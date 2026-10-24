/* Shopify owns the basket, amounts and checkout URL. This adapter changes only
   the cart's checkout control into a normal parent-document navigation link. */
(() => {
  'use strict';
  const states = new WeakMap();
  const carts = new Set();
  const selector = '[data-myvici-checkout]';

  const checkoutURL = cart => {
    try {
      if (cart.isEmpty || !cart.model || typeof cart.model.webUrl !== 'string') return null;
      const url = new URL(cart.model.webUrl);
      if (url.protocol !== 'https:' || url.hostname !== '7nrbmy-7x.myshopify.com' ||
          url.username || url.password || url.port || url.hash) return null;
      // Never reuse an old decoration. Preserve Shopify's cart key and other
      // original checkout parameters; no website query or hash is copied.
      url.searchParams.delete('_gl');
      url.searchParams.delete('_ga');
      return url.href;
    } catch { return null; }
  };

  const stateFor = cart => {
    if (!states.has(cart)) states.set(cart, { open: false, returnFocus: null, checkoutFocused: false, bound: false });
    return states.get(cart);
  };

  const refresh = cart => {
    const link = cart.node.querySelector(selector);
    if (!link) return;
    const url = checkoutURL(cart);
    if (url) {
      link.href = url;
      link.removeAttribute('aria-disabled');
      link.removeAttribute('tabindex');
    } else {
      // A missing/unrecognised URL must not make this optional adapter the
      // sole checkout path. Restore the unchanged Shopify control; Shopify
      // remains responsible for its own URL and recovery behavior.
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'shopify-buy__btn shopify-buy__btn--cart-checkout';
      button.dataset.element = 'cart.button';
      button.textContent = link.textContent;
      link.replaceWith(button);
    }
  };

  const beforeRender = cart => {
    const state = stateFor(cart);
    state.checkoutFocused = !!document.activeElement?.matches?.(selector) && cart.node.contains(document.activeElement);
    if (cart.isVisible && !state.open) state.returnFocus = document.activeElement;
  };

  const afterRender = cart => {
    const state = stateFor(cart);
    carts.add(cart);
    cart.node.classList.add('myvici-native-cart');
    cart.node.dataset.open = String(!!cart.isVisible);
    cart.node.inert = !cart.isVisible;
    cart.node.setAttribute('aria-hidden', String(!cart.isVisible));
    cart.node.setAttribute('role', 'dialog');
    cart.node.setAttribute('aria-label', 'Your kit');
    const button = cart.node.querySelector('[data-element="cart.button"]');
    if (button && button.tagName !== 'A' && checkoutURL(cart)) {
      const link = document.createElement('a');
      // Deliberately omit the SDK checkout-button classes: its delegated
      // window.open handler must not also run for this native link.
      link.className = 'myvici-checkout-link';
      link.dataset.myviciCheckout = '';
      link.dataset.element = 'cart.button';
      link.textContent = button.textContent;
      link.target = '_blank';
      link.rel = 'noopener';
      link.setAttribute('aria-label', 'Secure checkout (opens in a new tab)');
      button.replaceWith(link);
    }
    refresh(cart);
    if (cart.isVisible && state.checkoutFocused) cart.node.querySelector(selector)?.focus();
    if (!cart.isVisible && state.open) {
      const target = state.returnFocus;
      // Shopify removes its focus trap after its render callback returns.
      queueMicrotask(() => { if (!cart.isVisible && target?.isConnected) target.focus(); });
    }
    state.open = !!cart.isVisible;
    if (state.bound) return;
    state.bound = true;
    // The SDK captures first/last nodes when opened; a later render replaces
    // checkout. Resolve live boundaries only on an actual Tab keypress. Do not
    // call SDK setFocus on render: it blurs quantity inputs and can resend updates.
    // The SDK's non-iframe mode also lacks its iframe Escape listener.
    cart.node.addEventListener('keydown', event => {
      if (!cart.isVisible) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cart.close();
      } else if (event.key === 'Tab') {
        const controls = [...cart.node.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]')]
          .filter(el => el.tabIndex >= 0 && !el.hidden && el.getClientRects().length && window.getComputedStyle(el).visibility !== 'hidden');
        const first = controls[0], last = controls[controls.length - 1];
        const target = event.shiftKey && document.activeElement === first ? last :
          !event.shiftKey && document.activeElement === last ? first : null;
        if (target) {
          event.preventDefault();
          event.stopPropagation();
          target.focus();
        }
      }
    }, true);
    const prepareNavigation = event => {
      if (!event.target.closest?.(selector)) return;
      refresh(cart); // Current cart URL; Google may decorate later while bubbling.
      if (!checkoutURL(cart)) event.preventDefault();
      if (!window.myviciAnalytics?.canLinkCheckout?.()) {
        // Default link navigation still works, but a retained tag listener
        // cannot decorate it after refusal/expiry or on a preview host.
        event.stopPropagation();
      }
    };
    cart.node.addEventListener('click', prepareNavigation, true);
    cart.node.addEventListener('auxclick', prepareNavigation, true);
    cart.node.addEventListener('contextmenu', () => refresh(cart), true);
  };

  const cleanLinks = () => carts.forEach(cart => {
    if (!cart.node.isConnected) carts.delete(cart);
    else refresh(cart);
  });
  window.addEventListener('myvici:analytics-disabled', cleanLinks);
  window.addEventListener('pageshow', cleanLinks);
  window.myviciCartCheckout = { events: { beforeRender, afterRender } };
})();
