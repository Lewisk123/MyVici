/* Existing MYVICI Shopify Buy Button integration. Product identity and client credentials are unchanged. */
(() => {
  'use strict';
  const mount = document.getElementById('product-component-1782147379789');
  if (!mount) return;
  const purchase = mount.closest('.purchase-area');
  const loading = purchase.querySelector('.shop-loading');
  const fallback = purchase.querySelector('.shop-fallback');
  let completed = false;
  const showReady = () => {
    if (completed) return;
    completed = true;
    purchase.setAttribute('aria-busy', 'false');
    loading.hidden = true;
    fallback.hidden = true;
    observer.disconnect();
    clearTimeout(fallbackTimer);
  };
  const showFallback = () => {
    if (completed) return;
    purchase.setAttribute('aria-busy', 'false');
    loading.hidden = true;
    fallback.hidden = false;
    observer.disconnect();
  };
  const observer = new MutationObserver(() => { if (mount.querySelector('iframe')) showReady(); });
  observer.observe(mount, { childList: true, subtree: true });
  const fallbackTimer = window.setTimeout(showFallback, 15000);
  const init = () => {
    if (!window.ShopifyBuy || !window.ShopifyBuy.UI) { showFallback(); return; }
    const client = ShopifyBuy.buildClient({
      domain: "7nrbmy-7x.myshopify.com",
      storefrontAccessToken: "4a085f885ae44195115658a23ccaa265"
    });
    ShopifyBuy.UI.onReady(client).then((ui) => ui.createComponent('product', {
      id: "15564140806468",
      node: mount,
      moneyFormat: '%C2%A3%7B%7Bamount%7D%7D',
      options: {
        product: {
          contents: { img: false, title: false, price: false, options: false },
          buttonDestination: 'cart',
          styles: {
            product: { 'max-width': '100%', width: '100%', margin: '0', 'text-align': 'left' },
            button: {
              'background-color': '#c1fa3c', color: '#10110f', width: '100%', 'min-height': '56px',
              'font-family': 'Inter, Arial, sans-serif', 'font-size': '11px', 'font-weight': '800',
              'letter-spacing': '1px', 'text-transform': 'uppercase', 'border-radius': '0',
              ':hover': { 'background-color': '#d2ff70', color: '#10110f' },
              ':focus': { 'background-color': '#d2ff70', color: '#10110f' }
            }
          },
          text: { button: 'BUY THE ORGANISER' }
        },
        cart: {
          styles: {
            cart: { 'background-color': '#10110f' },
            title: { color: '#f8f9f3' },
            header: { color: '#f8f9f3' },
            lineItems: { color: '#f8f9f3' },
            subtotalText: { color: '#b6bbaf' },
            subtotal: { color: '#f8f9f3' },
            notice: { color: '#a7aba1' },
            close: { color: '#f8f9f3', ':hover': { color: '#c1fa3c' } },
            button: {
              'background-color': '#c1fa3c', color: '#10110f', 'font-weight': '800',
              'border-radius': '0', ':hover': { 'background-color': '#d2ff70' },
              ':focus': { 'background-color': '#d2ff70' }
            }
          },
          text: {
            title: 'Your kit', total: 'Subtotal', button: 'SECURE CHECKOUT',
            notice: 'The 5% automatic discount and delivery are calculated at checkout.'
          }
        },
        lineItem: {
          contents: { image: false, variantTitle: true, title: true, price: false, priceWithDiscounts: true, quantity: true, quantityIncrement: true, quantityDecrement: true, quantityInput: true },
          styles: {
            variantTitle: { color: '#a7aba1' }, title: { color: '#f8f9f3' },
            price: { color: '#f8f9f3' }, priceWithDiscounts: { color: '#f8f9f3' },
            quantityInput: { color: '#10110f', 'background-color': '#f2f2ed' }
          }
        },
        toggle: {
          styles: { toggle: { 'background-color': '#c1fa3c', ':hover': { 'background-color': '#d2ff70' }, ':focus': { 'background-color': '#d2ff70' } }, count: { color: '#10110f' }, iconPath: { fill: '#10110f' } }
        }
      }
    })).catch(showFallback);
  };
  const scriptURL = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
  if (window.ShopifyBuy && window.ShopifyBuy.UI) { init(); }
  else {
    const sdk = document.createElement('script');
    sdk.async = true;
    sdk.src = scriptURL;
    sdk.onload = init;
    sdk.onerror = showFallback;
    document.head.appendChild(sdk);
  }
})();
