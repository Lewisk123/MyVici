/* Small progressive enhancements. The content stays readable without JavaScript. */
(() => {
  'use strict';

  /* Vercel Web Analytics is enabled in the project dashboard; load its cookieless tracker on every page. */
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
  if (!document.querySelector('script[src="/_vercel/insights/script.js"]')) {
    const analytics = document.createElement('script');
    analytics.src = '/_vercel/insights/script.js';
    analytics.defer = true;
    analytics.dataset.sdkn = '@vercel/analytics';
    analytics.dataset.sdkv = '2.0.1';
    document.head.appendChild(analytics);
  }

  /* Keep the header wordmark on-brand: MY stays white, VICI uses MYVICI lime. */
  document.querySelectorAll('.site-header .brand > span').forEach((wordmark) => {
    wordmark.innerHTML = 'MY<span>VICI</span>';
  });

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ticker = document.querySelector('.ticker');
  const tickerButton = document.querySelector('.ticker-control');
  if (ticker && tickerButton) {
    const setTickerPaused = (paused) => {
      ticker.classList.toggle('is-paused', paused);
      tickerButton.setAttribute('aria-label', paused ? 'Play announcements' : 'Pause announcements');
    };
    setTickerPaused(motion.matches);
    tickerButton.addEventListener('click', () => setTickerPaused(!ticker.classList.contains('is-paused')));
    motion.addEventListener('change', () => setTickerPaused(motion.matches));
}
  const menu = document.querySelector('#mobile-menu');
  const menuToggle = document.querySelector('.menu-toggle');
  if (menu && menuToggle) {
    menuToggle.addEventListener('click', () => { menu.showModal(); menuToggle.setAttribute('aria-expanded', 'true'); document.body.classList.add('menu-open'); });
    menu.querySelector('.menu-close').addEventListener('click', () => menu.close());
    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => menu.close()));
    menu.addEventListener('close', () => { menuToggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('menu-open'); });
    menu.addEventListener('click', (event) => {
      if (event.target !== menu) return;
      const bounds = menu.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) menu.close();
    });
    const desktop = window.matchMedia('(min-width: 761px)');
    desktop.addEventListener('change', () => { if (desktop.matches && menu.open) menu.close(); });
  }
  const tabs = Array.from(document.querySelectorAll('.compare-tabs [role="tab"]'));
  const selectTab = (tab) => {
    tabs.forEach((item) => {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected));
      item.tabIndex = selected ? 0 : -1;
      document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
    });
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault(); selectTab(tabs[next]); tabs[next].focus();
    });
  });
  if ('IntersectionObserver' in window) {
    if (!motion.matches) {
      const reveals = new IntersectionObserver((entries, observer) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return; entry.target.classList.add('is-visible'); observer.unobserve(entry.target);
      }), { threshold: 0.06 });
      document.querySelectorAll('.reveal').forEach((element) => {
        if (element.getBoundingClientRect().top < window.innerHeight - 20) return;
        element.classList.add('will-reveal'); reveals.observe(element);
      });
    }
    const purchase = document.querySelector('.purchase-area');
    if (purchase) {
      const purchaseObserver = new IntersectionObserver((entries) => document.body.classList.toggle('at-purchase', entries[0].isIntersecting), { threshold: 0.5, rootMargin: '-115px 0px -80px 0px' });
      purchaseObserver.observe(purchase);
    }
  }
})();
