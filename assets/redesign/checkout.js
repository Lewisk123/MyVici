/* SDK-independent backup checkout. Shopify creates a fresh cart for each visit. */
(() => {
  'use strict';
  const status = document.getElementById('checkout-status');
  const retry = document.getElementById('checkout-retry');
  if (!status || !retry) return;
  const domain = '7nrbmy-7x.myshopify.com';
  // Public Storefront token, also used by the existing Shopify Buy Button.
  const storefrontToken = '4a085f885ae44195115658a23ccaa265';
  const query = `mutation BackupCheckout($input: CartInput!) {
    cartCreate(input: $input) {
      cart { checkoutUrl totalQuantity }
      userErrors { message }
    }
  }`;
  let pending = false;
  async function openCheckout() {
    if (pending) return;
    pending = true;
    retry.hidden = true;
    retry.disabled = true;
    status.textContent = 'Opening your secure checkout…';
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(`https://${domain}/api/2026-07/graphql.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Shopify-Storefront-Access-Token': storefrontToken },
        body: JSON.stringify({ query, variables: { input: { lines: [{ merchandiseId: 'gid://shopify/ProductVariant/56804961976644', quantity: 1 }] } } }),
        signal: controller.signal
      });
      if (!response.ok) throw new Error('Checkout unavailable');
      const result = await response.json();
      const created = result.data && result.data.cartCreate;
      if (result.errors || !created || created.userErrors.length || !created.cart || created.cart.totalQuantity !== 1) throw new Error('Could not add the bag');
      const checkout = new URL(created.cart.checkoutUrl);
      if (checkout.protocol !== 'https:' || ![domain, 'myvici.com', 'www.myvici.com'].includes(checkout.hostname)) throw new Error('Unexpected checkout address');
      window.location.assign(checkout.href);
    } catch (error) {
      status.textContent = 'We could not open checkout just now. Please try again, or email us below for help ordering.';
      pending = false;
      retry.hidden = false;
      retry.disabled = false;
    } finally {
      window.clearTimeout(timeout);
    }
  }
  retry.addEventListener('click', openCheckout);
  openCheckout();
})();
