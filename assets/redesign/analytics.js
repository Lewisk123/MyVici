/* Optional analytics. Basic consent mode: no analytics SDK loads before acceptance. */
(() => {
  'use strict';
  if (window.myviciAnalytics) return;
  const MEASUREMENT_ID = 'G-PLQXZEFCDL'; // MYVICI web stream; public measurement identifier.
  const STORAGE_KEY = 'myvici-analytics-choice-v1';
  const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
  const hosts = new Set(['myvici.com', 'www.myvici.com']);
  const pages = {
    '/': 'MYVICI | Organiser',
    '/index.html': 'MYVICI | Organiser',
    '/our-story.html': 'Our Story | MYVICI',
    '/delivery-returns.html': 'Shipping & Returns | MYVICI',
    '/privacy.html': 'Privacy & Cookies | MYVICI'
  };
  const eligible = location.protocol === 'https:' && hosts.has(location.hostname) && Object.hasOwn(pages, location.pathname);
  if (!Object.hasOwn(pages, location.pathname)) return;
  const validId = /^G-[A-Z0-9]{6,}$/.test(MEASUREMENT_ID);
  const gaDisabled = `ga-disable-${MEASUREMENT_ID}`;
  const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  const pageLocation = `https://myvici.com${location.pathname === '/index.html' ? '/' : location.pathname}`;
  const referrerOrigin = (() => {
    try { const u = new URL(document.referrer); return /^https?:$/.test(u.protocol) ? u.origin + '/' : ''; }
    catch { return ''; }
  })();
  let choice = null;
  let started = false;
  let gaStarted = false;
  let priorFocus = null;
  const readChoice = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return saved && saved.version === 1 && ['accepted', 'rejected'].includes(saved.value) &&
        Number.isFinite(saved.at) && saved.at <= Date.now() && Date.now() - saved.at < MAX_AGE ? saved.value : null;
    } catch { return null; }
  };
  const clearGaCookies = () => {
    const names = document.cookie.split(';').map(value => value.trim().split('=')[0]).filter(name => /^_ga(?:_|$)/.test(name));
    const paths = new Set(['/']);
    const segments = location.pathname.split('/').filter(Boolean);
    for (let n = 1; n <= segments.length; n++) paths.add('/' + segments.slice(0, n).join('/'));
    names.forEach(name => paths.forEach(path => ['', location.hostname, '.' + location.hostname, 'myvici.com', '.myvici.com'].forEach(domain => {
      document.cookie = `${name}=; Max-Age=0; Path=${path};${domain ? ` Domain=${domain};` : ''} SameSite=Lax; Secure`;
    })));
  };
  function gtag() { window.dataLayer.push(arguments); }
  const track = (name) => {
    if (choice !== 'accepted' || !gaStarted || !['page_view', 'product_section_click', 'checkout_link_click'].includes(name)) return;
    gtag('event', name, { send_to: MEASUREMENT_ID, page_location: pageLocation, page_referrer: referrerOrigin, page_title: pages[location.pathname] });
  };
  const start = () => {
    if (started || choice !== 'accepted' || !eligible) return;
    started = true;
    if (validId) {
      window.dataLayer = window.dataLayer || [];
      window[gaDisabled] = false;
      gtag('consent', 'default', denied);
      gtag('consent', 'update', { ...denied, analytics_storage: 'granted' });
      gtag('set', { page_location: pageLocation, page_referrer: referrerOrigin, page_title: pages[location.pathname] });
      // Documented linker configuration precedes js/config. It is queued only
      // after analytics acceptance, on the existing production-host allowlist.
      gtag('set', 'linker', {
        domains: ['myvici.com', 'www.myvici.com', '7nrbmy-7x.myshopify.com'],
        decorate_forms: false
      });
      gtag('js', new Date());
      gtag('config', MEASUREMENT_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_domain: 'myvici.com',
        cookie_expires: MAX_AGE / 1000,
        cookie_update: false,
        cookie_flags: 'SameSite=Lax;Secure',
        page_location: pageLocation,
        page_referrer: referrerOrigin,
        page_title: pages[location.pathname]
      });
      gaStarted = true;
      track('page_view');
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
      script.referrerPolicy = 'no-referrer';
      script.dataset.myviciAnalytics = 'google';
      document.head.appendChild(script);
    }
    // Preserve the existing aggregate Vercel reporting, behind the same choice.
    // Avoid loading it with a non-public referrer whose URL cannot be redacted by beforeSend.
    let safeVercelReferrer = !document.referrer;
    try {
      const u = new URL(document.referrer);
      safeVercelReferrer = hosts.has(u.hostname) && Object.hasOwn(pages, u.pathname) && !u.search && !u.hash;
    } catch { /* Empty or invalid referrers do not supply personal URL data. */ }
    if (!safeVercelReferrer) return;
    window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
    window.va('beforeSend', event => {
      if (choice !== 'accepted' || event.type !== 'pageview') return null;
      try {
        const u = new URL(event.url);
        if (!hosts.has(u.hostname) || !Object.hasOwn(pages, u.pathname)) return null;
        return { ...event, url: `https://myvici.com${u.pathname === '/index.html' ? '/' : u.pathname}` };
      } catch { return null; }
    });
    const origin = 'https://my-vici.vercel.app';
    const script = document.createElement('script');
    script.src = `${origin}/_vercel/insights/script.js`;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    script.referrerPolicy = 'no-referrer';
    script.dataset.viewEndpoint = `${origin}/_vercel/insights/view`;
    script.dataset.eventEndpoint = `${origin}/_vercel/insights/event`;
    script.dataset.sdkn = '@vercel/analytics';
    script.dataset.sdkv = '2.0.1';
    script.dataset.myviciAnalytics = 'vercel';
    document.head.appendChild(script);
  };
  const panel = document.createElement('section');
  panel.className = 'analytics-choice';
  panel.setAttribute('aria-labelledby', 'analytics-choice-heading');
  panel.innerHTML = '<h2 id="analytics-choice-heading">Your analytics choice</h2><p>May we use Google Analytics and Vercel Web Analytics to understand which pages are useful? These are optional. Shopping works either way.</p><p><a href="/privacy.html">Privacy and cookies</a></p><div class="analytics-choice-actions"><button type="button" data-analytics-choice="accepted">Accept analytics</button><button type="button" data-analytics-choice="rejected">Reject analytics</button></div>';
  const restoreFocus = () => { if (priorFocus && typeof priorFocus.focus === 'function') priorFocus.focus(); };
  const stop = () => {
    window[gaDisabled] = true;
    if (gaStarted) gtag('consent', 'update', denied);
    gaStarted = false;
    clearGaCookies();
    document.querySelectorAll('script[data-myvici-analytics]').forEach(script => script.remove());
    window.dispatchEvent(new Event('myvici:analytics-disabled'));
  };
  const choose = value => {
    choice = value;
    let persisted = false;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, value, at: Date.now() }));
      persisted = true;
    } catch {
      // A blocked store must not reload a previously saved acceptance on withdrawal.
      if (value === 'rejected') { try { localStorage.removeItem(STORAGE_KEY); } catch { /* Remain disabled in this document. */ } }
    }
    panel.hidden = true;
    restoreFocus();
    if (value === 'accepted') start();
    else {
      const reloadNeeded = started;
      stop();
      // Unload SDK timers/listeners after withdrawal; the saved refusal prevents reloading them.
      if (reloadNeeded && persisted) location.reload();
    }
  };
  panel.addEventListener('click', event => {
    const button = event.target.closest('[data-analytics-choice]');
    if (button) choose(button.dataset.analyticsChoice);
  });
  document.body.appendChild(panel);
  document.querySelectorAll('[data-analytics-settings]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', () => {
      priorFocus = button;
      panel.hidden = false;
      panel.querySelector('button').focus();
    });
  });
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || choice !== 'accepted') return;
    try {
      const u = new URL(anchor.href, location.href);
      if (hosts.has(u.hostname) && ['/', '/index.html'].includes(u.pathname) && u.hash === '#shop') track('product_section_click');
      else if (u.protocol === 'https:' && u.hostname === '7nrbmy-7x.myshopify.com' && u.pathname === '/cart/56804961976644:1') track('checkout_link_click');
    } catch { /* No arbitrary link text, destination or form contents enter analytics. */ }
  });
  window.addEventListener('storage', event => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    if (readChoice() !== 'accepted' && choice === 'accepted') {
      choice = 'rejected';
      stop();
      location.reload();
    }
  });
  window.addEventListener('pageshow', event => {
    // Frozen Back/Forward documents may miss storage events from other pages/tabs.
    if (event.persisted && choice === 'accepted' && readChoice() !== 'accepted') {
      choice = 'rejected';
      stop();
      location.reload();
    }
  });
  window.myviciAnalytics = {
    openSettings: () => { panel.hidden = false; panel.querySelector('button').focus(); },
    // A failed/expired preference read conservatively prevents cross-domain
    // decoration; checkout itself never depends on this optional permission.
    canLinkCheckout: () => eligible && choice === 'accepted' && gaStarted && readChoice() === 'accepted'
  };
  choice = readChoice();
  panel.hidden = choice !== null;
  if (choice === 'accepted') start();
  else stop();
})();
