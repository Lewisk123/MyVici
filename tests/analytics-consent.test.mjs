import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../assets/redesign/analytics.js', import.meta.url), 'utf8');
const KEY = 'myvici-analytics-choice-v1';
const ID = 'G-PLQXZEFCDL';
const saved = (value, at = Date.now()) => JSON.stringify({ version: 1, value, at });
function browser({ url = 'https://myvici.com/', consent = null, referrer = '', storageFails = false } = {}) {
  const storage = new Map(consent === null ? [] : [[KEY, consent]]);
  const scripts = [], sections = [], cookieWrites = [], documentEvents = {}, windowEvents = {};
  let reloads = 0, cookies = '_ga=old; _ga_PLQXZEFCDL=old; cart=keep; unrelated=keep';
  class Element {
    constructor(tag) { this.tagName = tag; this.dataset = {}; this.events = {}; this.hidden = false; }
    setAttribute(name, value) { this[name] = value; }
    addEventListener(name, callback) { this.events[name] = callback; }
    focus() { this.focused = true; }
    querySelector() { return this.firstButton ||= new Element('button'); }
    remove() { scripts.splice(scripts.indexOf(this), 1); }
  }
  const settings = new Element('button');
  const document = {
    referrer,
    createElement: tag => new Element(tag),
    head: { appendChild: script => scripts.push(script) },
    body: { appendChild: section => sections.push(section) },
    querySelectorAll: selector => selector === '[data-analytics-settings]' ? [settings] : [...scripts],
    addEventListener: (name, callback) => { documentEvents[name] = callback; },
    get cookie() { return cookies; },
    set cookie(value) { cookieWrites.push(value); cookies = cookies.split(';').filter(v => v.trim().split('=')[0] !== value.split('=')[0]).join(';'); }
  };
  const location = new URL(url);
  location.reload = () => { reloads++; };
  const window = { addEventListener: (name, callback) => { windowEvents[name] = callback; } };
  const localStorage = {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => { if (storageFails) throw Error('blocked'); storage.set(key, value); },
    removeItem: key => { if (storageFails) throw Error('blocked'); storage.delete(key); }
  };
  const context = vm.createContext({ window, document, location, localStorage, URL, Date, Set });
  vm.runInContext(source, context);
  return {
    window, document, location, storage, scripts, sections, settings, cookieWrites,
    reloads: () => reloads,
    commands: () => (window.dataLayer || []).map(args => Array.from(args)),
    events: () => (window.dataLayer || []).filter(args => args[0] === 'event').map(args => Array.from(args)),
    choose: value => sections[0].events.click({ target: { closest: () => ({ dataset: { analyticsChoice: value } }) } }),
    click: href => documentEvents.click({ target: { closest: () => ({ href }) } }),
    signal: (name, event) => windowEvents[name]?.(event),
    rerun: () => vm.runInContext(source, context),
    vercelFilter: () => window.vaq?.find(args => args[0] === 'beforeSend')?.[1]
  };
}

test('fresh and refused visitors load no SDK, send no command and retain shopping cookies', () => {
  for (const consent of [null, saved('rejected')]) {
    const b = browser({ consent });
    assert.equal(b.scripts.length, 0);
    assert.equal(b.commands().length, 0);
    assert.equal(b.window['ga-disable-' + ID], true);
    assert.equal(b.settings.hidden, false);
    assert.match(b.document.cookie, /cart=keep/);
    assert.ok(b.cookieWrites.every(value => /^_ga/.test(value)));
  }
});

test('acceptance loads each SDK once and emits exactly one explicit page_view', () => {
  const b = browser();
  b.choose('accepted'); b.choose('accepted'); b.rerun();
  assert.equal(b.scripts.length, 2);
  assert.equal(b.events().length, 1);
  assert.equal(b.events()[0][1], 'page_view');
  assert.equal(b.commands().find(args => args[0] === 'config')[2].send_page_view, false);
  assert.equal(Object.prototype.toString.call(b.window.dataLayer[0]), '[object Arguments]');
  assert.equal(b.commands()[0][2].analytics_storage, 'denied');
  const granted = b.commands()[1][2];
  assert.equal(granted.analytics_storage, 'granted');
  for (const key of ['ad_storage', 'ad_user_data', 'ad_personalization']) assert.equal(granted[key], 'denied');
});

test('production allowlist prevents local, preview, HTTP and unknown-path collection', () => {
  for (const url of ['http://localhost:8768/', 'https://my-vici-git-preview.vercel.app/', 'http://myvici.com/', 'https://example.com/', 'https://myvici.com/redesign.html', 'https://myvici.com/customer/private']) {
    const b = browser({ url, consent: saved('accepted') });
    assert.equal(b.scripts.length, 0, url);
    assert.equal(b.events().length, 0, url);
  }
  for (const url of ['https://myvici.com/', 'https://www.myvici.com/our-story.html', 'https://myvici.com/privacy.html', 'https://myvici.com/delivery-returns.html']) {
    assert.equal(browser({ url, consent: saved('accepted') }).events().length, 1, url);
  }
});

test('expired, malformed and future-dated choices require a new choice', () => {
  for (const consent of [saved('accepted', Date.now() - 181 * 86400000), saved('accepted', Date.now() + 86400000), 'broken', '{}', JSON.stringify({ version: 9, value: 'accepted', at: Date.now() })]) {
    const b = browser({ consent });
    assert.equal(b.scripts.length, 0);
    assert.equal(b.sections[0].hidden, false);
  }
});

test('withdrawal disables future events, clears only GA cookies, removes SDKs and reloads refused', () => {
  const b = browser({ consent: saved('accepted') });
  const filter = b.vercelFilter();
  b.choose('rejected');
  assert.equal(b.window['ga-disable-' + ID], true);
  assert.equal(b.scripts.length, 0);
  assert.equal(b.reloads(), 1);
  assert.equal(JSON.parse(b.storage.get(KEY)).value, 'rejected');
  b.click('https://myvici.com/#shop');
  assert.equal(b.events().length, 1);
  assert.equal(filter({ type: 'pageview', url: 'https://myvici.com/' }), null);
  assert.equal(browser({ consent: b.storage.get(KEY) }).scripts.length, 0);
});

test('storage errors cannot cause withdrawal to reload an old accepted choice', () => {
  const b = browser({ consent: saved('accepted'), storageFails: true });
  b.choose('rejected');
  assert.equal(b.reloads(), 0);
  assert.equal(b.window['ga-disable-' + ID], true);
  assert.equal(b.scripts.length, 0);
  b.click('https://myvici.com/#shop');
  assert.equal(b.events().length, 1);
});

test('other-tab withdrawal and expired/removed consent stop an existing document', () => {
  for (const value of [saved('rejected'), null, saved('accepted', Date.now() - 181 * 86400000)]) {
    const b = browser({ consent: saved('accepted') });
    value === null ? b.storage.delete(KEY) : b.storage.set(KEY, value);
    b.signal('storage', { key: KEY });
    assert.equal(b.reloads(), 1);
    assert.equal(b.window['ga-disable-' + ID], true);
  }
});

test('Back/Forward cache restoration rechecks consent without duplicate pageviews', () => {
  const accepted = browser({ consent: saved('accepted') });
  accepted.signal('pageshow', { persisted: true });
  assert.equal(accepted.events().length, 1);
  assert.equal(accepted.reloads(), 0);
  const frozen = browser({ consent: saved('accepted') });
  frozen.storage.set(KEY, saved('rejected'));
  frozen.signal('pageshow', { persisted: true });
  assert.equal(frozen.reloads(), 1);
  assert.equal(frozen.window['ga-disable-' + ID], true);
  assert.equal(frozen.scripts.length, 0);
});

test('GA payloads remove page query/hash and referrer path/query/hash', () => {
  const b = browser({ url: 'https://www.myvici.com/index.html?email=private%40example.com#secret', consent: saved('accepted'), referrer: 'https://source.example/private/person?token=secret#private' });
  const wire = JSON.stringify(b.commands());
  assert.ok(!wire.includes('private'));
  assert.ok(!wire.includes('secret'));
  assert.equal(b.events()[0][2].page_location, 'https://myvici.com/');
  assert.equal(b.events()[0][2].page_referrer, 'https://source.example/');
  assert.equal(b.scripts.length, 1, 'external private referrer prevents Vercel SDK loading');
});

test('Vercel beforeSend redacts URLs and rejects unknown pages and custom events', () => {
  const b = browser({ consent: saved('accepted') });
  const filter = b.vercelFilter();
  assert.equal(filter({ type: 'pageview', url: 'https://www.myvici.com/?email=secret#private' }).url, 'https://myvici.com/');
  assert.equal(filter({ type: 'event', url: 'https://myvici.com/' }), null);
  assert.equal(filter({ type: 'pageview', url: 'https://myvici.com/customer' }), null);
  assert.equal(filter({ type: 'pageview', url: 'https://other.example/' }), null);
});

test('only fixed product-interest and fallback-checkout names are measured, never purchases', () => {
  const b = browser({ consent: saved('accepted') });
  b.click('mailto:hello@myvici.com?subject=secret');
  b.click('https://other.example/private');
  b.click('https://myvici.com/#shop');
  b.click('https://7nrbmy-7x.myshopify.com/cart/56804961976644:1?email=secret');
  assert.deepEqual(Array.from(b.events(), args => args[1]), ['page_view', 'product_section_click', 'checkout_link_click']);
  assert.ok(!JSON.stringify(b.events()).includes('secret'));
  assert.ok(!source.includes("track('purchase')"));
});

test('all public pages integrate one script, persistent settings and privacy; legacy unconditional tracker is removed', () => {
  for (const page of ['index.html', 'our-story.html', 'delivery-returns.html', 'privacy.html']) {
    const html = readFileSync(new URL('../' + page, import.meta.url), 'utf8');
    assert.equal((html.match(/assets\/redesign\/analytics\.js/g) || []).length, 1, page);
    assert.match(html, /data-analytics-settings/);
    assert.match(html, /href="privacy\.html"/);
  }
  const js = readFileSync(new URL('../assets/redesign/site.js', import.meta.url), 'utf8');
  assert.ok(!js.includes('/_vercel/insights/script.js'));
  const css = readFileSync(new URL('../assets/redesign/site.css', import.meta.url), 'utf8');
  assert.ok(!css.includes('[data-analytics-choice="accepted"]'));
  const privacy = readFileSync(new URL('../privacy.html', import.meta.url), 'utf8');
  assert.match(privacy, /180 days/);
  assert.match(privacy, /Shopify/);
});
