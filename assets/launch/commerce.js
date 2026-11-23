(() => {
  'use strict';
  const endpoint = 'https://7nrbmy-7x.myshopify.com/api/2026-10/graphql.json';
  const token = '4a085f885ae44195115658a23ccaa265';
  const query = "query Products {\n  bag: product(id: \"gid://shopify/Product/15564140806468\") {\n    id title variants(first: 20) { nodes { id title availableForSale price { amount currencyCode } image { url altText } } }\n  }\n  beanie: product(id: \"gid://shopify/Product/15743182012740\") {\n    id title variants(first: 20) { nodes { id title availableForSale price { amount currencyCode } image { url altText } } }\n  }\n}\nfragment CartDetails on Cart {\n  id checkoutUrl totalQuantity\n  cost { subtotalAmount { amount currencyCode } totalAmount { amount currencyCode } }\n  discountAllocations { discountedAmount { amount currencyCode } ... on CartAutomaticDiscountAllocation { title } }\n  lines(first: 100) { nodes {\n    id quantity cost { totalAmount { amount currencyCode } }\n    discountAllocations { discountedAmount { amount currencyCode } ... on CartAutomaticDiscountAllocation { title } }\n    merchandise { ... on ProductVariant { id title product { title } image { url altText } } }\n  } }\n}\nquery GetCart($id: ID!) { cart(id: $id) { ...CartDetails } }\nmutation CreateCart($input: CartInput!) {\n  cartCreate(input: $input) { cart { ...CartDetails } userErrors { field message } }\n}\nmutation AddLines($cartId: ID!, $lines: [CartLineInput!]!) {\n  cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartDetails } userErrors { field message } }\n}\nmutation UpdateLines($cartId: ID!, $lines: [CartLineUpdateInput!]!) {\n  cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartDetails } userErrors { field message } }\n}\nmutation RemoveLines($cartId: ID!, $lineIds: [ID!]!) {\n  cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartDetails } userErrors { field message } }\n}\n";
  const initialProducts = {"bag": {"id": "gid://shopify/Product/15564140806468", "title": "MYVICI Organiser Bag", "variants": {"nodes": [{"id": "gid://shopify/ProductVariant/56804961976644", "title": "Default Title", "availableForSale": true, "price": {"amount": "59.99", "currencyCode": "GBP"}, "image": {"url": "https://cdn.shopify.com/s/files/1/0974/8060/6020/files/bag-new-logo.jpg?v=1780172169", "altText": null}}]}}, "beanie": {"id": "gid://shopify/Product/15743182012740", "title": "MYVICI Beanie", "variants": {"nodes": [{"id": "gid://shopify/ProductVariant/57548044403012", "title": "Bloom", "availableForSale": true, "price": {"amount": "19.99", "currencyCode": "GBP"}, "image": {"url": "https://cdn.shopify.com/s/files/1/0974/8060/6020/files/myvici-beanie-bloom.webp?v=1795444148", "altText": "MYVICI Beanie in Bloom"}}, {"id": "gid://shopify/ProductVariant/57548044435780", "title": "Glacier", "availableForSale": true, "price": {"amount": "19.99", "currencyCode": "GBP"}, "image": {"url": "https://cdn.shopify.com/s/files/1/0974/8060/6020/files/myvici-beanie-glacier.webp?v=1795444456", "altText": "MYVICI Beanie in Glacier"}}, {"id": "gid://shopify/ProductVariant/57548044468548", "title": "Midnight", "availableForSale": true, "price": {"amount": "19.99", "currencyCode": "GBP"}, "image": {"url": "https://cdn.shopify.com/s/files/1/0974/8060/6020/files/myvici-beanie-midnight.webp?v=1795444526", "altText": "MYVICI Beanie in Midnight"}}, {"id": "gid://shopify/ProductVariant/57548044501316", "title": "Ridge", "availableForSale": true, "price": {"amount": "19.99", "currencyCode": "GBP"}, "image": {"url": "https://cdn.shopify.com/s/files/1/0974/8060/6020/files/myvici-beanie-ridge.webp?v=1795444534", "altText": "MYVICI Beanie in Ridge"}}, {"id": "gid://shopify/ProductVariant/57548044534084", "title": "Moss", "availableForSale": true, "price": {"amount": "19.99", "currencyCode": "GBP"}, "image": {"url": "https://cdn.shopify.com/s/files/1/0974/8060/6020/files/myvici-beanie-moss.webp?v=1795444550", "altText": "MYVICI Beanie in Moss"}}]}}};
  const storageKey = 'myvici-cart-v1';
  const dialog = document.getElementById('shopping-bag');
  const panels = [...document.querySelectorAll('[data-product]')];
  const formatter = new Intl.NumberFormat('en-GB', {style:'currency', currency:'GBP'});
  const money = value => formatter.format(Number(value?.amount ?? value ?? 0));
  let products = initialProducts;
  let available = false;
  let busy = false;
  let cart = null;
  let cartId = null;
  try { cartId = localStorage.getItem(storageKey); } catch { /* Basket still works in this tab. */ }
  const promoActive = () => Date.now() >= Date.parse('2026-11-23T00:00:00Z') && Date.now() <= Date.parse('2026-12-02T23:59:59Z');
  const status = (panel, text) => { const node=panel.querySelector('.purchase-status'); if(node) node.textContent=text; };
  const variantFor = panel => products[panel.dataset.product]?.variants.nodes.find(v => v.id.endsWith('/'+panel.dataset.variant));
  function showPrice(node, price, isBag) {
    node.replaceChildren(document.createTextNode(money(isBag && promoActive() ? Math.max(0, Number(price.amount)-15) : price)));
    if(isBag && promoActive()) { const original=document.createElement('s');original.textContent=money(price);original.setAttribute('aria-label','Regular price '+money(price));node.append(original); }
  }
  function refreshPrices() {
    panels.forEach(panel=>{const variant=variantFor(panel);if(variant)showPrice(panel.querySelector('[data-product-price]'),variant.price,panel.dataset.product==='bag');});
    document.querySelectorAll('[data-catalog-bag-price]').forEach(node=>showPrice(node,products.bag.variants.nodes[0].price,true));
  }
  const setButtons = () => panels.forEach(panel => {
    const variant=variantFor(panel);
    panel.querySelectorAll('[data-buy]').forEach(button => {
      button.disabled=busy || !available || !variant?.availableForSale;
      button.textContent=!busy && available && !variant?.availableForSale ? 'Sold out' : button.dataset.buy==='now' ? 'Buy now' : 'Add to bag';
    });
  });
  function refreshPromos() {
    refreshPrices();
    document.querySelectorAll('[data-promo-summary]').forEach(node => { node.textContent=promoActive() ? 'Black Friday · Bag £44.99 · 2 beanies £30 · Bag + beanie £59.99 · Ends 2 December' : 'Geared for greatness · Built by a runner'; });
    document.querySelectorAll('[data-offer]').forEach(node => {
      node.hidden=!promoActive();
      node.textContent=node.dataset.offer==='bag' ? 'Black Friday: £44.99 · Bag + beanie £59.99. Automatic savings at checkout. Ends 2 December.' : 'Black Friday: 2 or more £15 each · Bag + beanie £59.99. Mix your colours. Ends 2 December.';
    });
  }
  refreshPromos();
  window.addEventListener('pageshow', refreshPromos);
  setInterval(refreshPromos,60000);
  async function api(operationName, variables={}) {
    const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':token},body:JSON.stringify({query,operationName,variables}),signal:AbortSignal.timeout(20000)});
    if(!response.ok) throw new Error('The shop could not connect. Please try again.');
    const result=await response.json();
    if(result.errors?.length) throw new Error('The shop could not complete that request. Please try again.');
    return result.data;
  }
  function checkoutURL(value) {
    const url=new URL(value);
    if(url.protocol!=='https:' || !['www.myvici.com','myvici.com','7nrbmy-7x.myshopify.com'].includes(url.hostname) || !/^\/(?:cart\/c\/|checkouts\/)/.test(url.pathname) || url.username || url.password) throw new Error('Secure checkout is temporarily unavailable. Please try again.');
    url.hostname='7nrbmy-7x.myshopify.com';
    url.searchParams.set('_fd','0');
    url.searchParams.delete('_gl');
    url.searchParams.delete('_ga');
    return url.href;
  }
  function saveCart(next) {
    cart=next;
    cartId=next?.id || null;
    try { if(cartId) localStorage.setItem(storageKey,cartId); else localStorage.removeItem(storageKey); } catch { /* Keep the active basket in memory. */ }
    renderCart();
  }
  function el(tag, className, text) {
    const node=document.createElement(tag);
    if(className) node.className=className;
    if(text!==undefined) node.textContent=text;
    return node;
  }
  function renderCart() {
    document.querySelectorAll('[data-cart-count]').forEach(node => {node.textContent=cart?.totalQuantity||0;});
    const list=dialog.querySelector('[data-cart-lines]');
    list.replaceChildren();
    if(!cart?.totalQuantity) list.append(el('p','basket-empty','Your bag is empty. Choose your kit to get started.'));
    for(const line of cart?.lines.nodes || []) {
      const row=el('article','basket-item');
      if(line.merchandise.image) {
        const image=el('img'); image.src=line.merchandise.image.url; image.alt=line.merchandise.image.altText||line.merchandise.product.title; image.width=88; image.height=88; row.append(image);
      }
      const details=el('div','basket-item-copy');
      details.append(el('h3','',line.merchandise.product.title));
      if(line.merchandise.title!=='Default Title') details.append(el('p','basket-variant',line.merchandise.title));
      details.append(el('p','basket-price',money(line.cost.totalAmount)));
      const discounts=[...new Set(line.discountAllocations.filter(d=>Number(d.discountedAmount.amount)>0).map(d=>d.title||'Automatic saving'))];
      if(discounts.length) details.append(el('p','basket-saving',discounts.join(' · ')));
      const controls=el('div','basket-quantity');
      const name=line.merchandise.product.title+' '+line.merchandise.title;
      for(const [label,symbol,quantity] of [['Decrease','−',line.quantity-1],['Increase','+',line.quantity+1]]) {
        const button=el('button','',symbol); button.type='button';button.setAttribute('aria-label',label+' quantity of '+name);button.disabled=busy;button.addEventListener('click',()=>updateLine(line.id,quantity));
        if(label==='Increase') controls.append(el('span','',String(line.quantity)));
        controls.append(button);
      }
      const remove=el('button','basket-remove','Remove');remove.type='button';remove.setAttribute('aria-label','Remove '+name);remove.disabled=busy;remove.addEventListener('click',()=>updateLine(line.id,0));controls.append(remove);
      details.append(controls);row.append(details);list.append(row);
    }
    dialog.querySelector('[data-cart-total]').textContent=money(cart?.cost.totalAmount);
    const checkout=dialog.querySelector('[data-checkout]');
    checkout.hidden=!cart?.totalQuantity;
    if(cart?.totalQuantity) {
      try {checkout.href=checkoutURL(cart.checkoutUrl);} catch(error) {checkout.removeAttribute('href');dialog.querySelector('.cart-status').textContent=error.message;}
    }
    checkout.setAttribute('aria-disabled',String(busy));
    checkout.tabIndex=busy?-1:0;
  }
  async function restoreCart() {
    if(!cartId) return;
    const result=await api('GetCart',{id:cartId});
    saveCart(result.cart);
  }
  async function loadProducts() {
    try {
      products=await api('Products'); available=true;
      panels.forEach(panel=> {
        const variant=variantFor(panel);
        if(variant) showPrice(panel.querySelector('[data-product-price]'),variant.price,panel.dataset.product==='bag');
        status(panel,variant?.availableForSale?'In stock. Ready for your next adventure.':'This colour is currently sold out.');
      });
    } catch {
      available=false;
      panels.forEach(panel=>{
        status(panel,'Unable to check stock. Refresh to try again, or contact hello@myvici.com.');
      });
    }
    setButtons();
  }
  const readyCart=restoreCart().catch(error=>{dialog.querySelector('.cart-status').textContent=error.message;});
  loadProducts();renderCart();
  const openCart=()=>{ if(!dialog.open)dialog.showModal(); };
  document.querySelectorAll('[data-open-cart]').forEach(button=>button.addEventListener('click',async()=>{openCart();try{await restoreCart();}catch(error){dialog.querySelector('.cart-status').textContent=error.message;}}));
  dialog.querySelectorAll('[data-close-cart]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}});
  dialog.querySelector('[data-checkout]').addEventListener('click',event=>{if(busy)event.preventDefault();});
  document.addEventListener('myvici:variant',event=>{
    const panel=event.target.closest('[data-product]');
    const variant=variantFor(panel);
    if(variant)showPrice(panel.querySelector('[data-product-price]'),variant.price,panel.dataset.product==='bag');
    status(panel,available?(variant?.availableForSale?'In stock. Ready for your next adventure.':'This colour is currently sold out.'):'Checking availability…');
    const explore=panel.querySelector('.product-explore');
    if(explore){const url=new URL(explore.href);url.searchParams.set('variant',panel.dataset.variant);explore.href=url.href;}
    setButtons();
  });
  const fromURL=new URLSearchParams(location.search).get('variant');
  if(fromURL) panels.forEach(panel=>panel.querySelector('.picker button[data-variant="'+CSS.escape(fromURL)+'"]')?.click());
  panels.forEach(panel=>panel.querySelectorAll('[data-buy]').forEach(button=>button.addEventListener('click',async()=>{
    if(busy)return;
    const input=panel.querySelector('[data-quantity]');
    if(!input.reportValidity())return;
    busy=true;setButtons();status(panel,'Adding to your bag…');
    try {
      await readyCart;
      const line={merchandiseId:'gid://shopify/ProductVariant/'+panel.dataset.variant,quantity:Number(input.value)};
      const operation=cartId?'AddLines':'CreateCart';
      const variables=cartId?{cartId,lines:[line]}:{input:{buyerIdentity:{countryCode:'GB'},lines:[line]}};
      const data=await api(operation,variables);const result=data[cartId?'cartLinesAdd':'cartCreate'];
      if(result.cart)saveCart(result.cart);
      if(result.userErrors?.length)throw new Error(result.userErrors.map(e=>e.message).join(' '));
      if(!result.cart)throw new Error('Your bag could not be updated. Please try again.');
      status(panel,'Added to your bag.');
      if(button.dataset.buy==='now') { const destination=checkoutURL(cart.checkoutUrl);window.dispatchEvent(new Event('myvici:checkout'));location.assign(destination); } else openCart();
    } catch(error){status(panel,error.name==='TimeoutError'?'The shop took too long to respond. Please try again.':error.message);}
    finally{busy=false;setButtons();renderCart();}
  })));
  async function updateLine(id,quantity) {
    if(busy)return;
    const focusLabel=document.activeElement?.getAttribute('aria-label');
    busy=true;setButtons();renderCart();dialog.querySelector('.cart-status').textContent='Updating your bag…';
    try {
      const data=await api(quantity?'UpdateLines':'RemoveLines',quantity?{cartId,lines:[{id,quantity}]}:{cartId,lineIds:[id]});
      const result=data[quantity?'cartLinesUpdate':'cartLinesRemove'];
      if(result.cart)saveCart(result.cart);
      if(result.userErrors?.length)throw new Error(result.userErrors.map(e=>e.message).join(' '));
      dialog.querySelector('.cart-status').textContent='Your bag is up to date.';
    } catch(error){dialog.querySelector('.cart-status').textContent=error.message;}
    finally{busy=false;setButtons();renderCart();const target=[...dialog.querySelectorAll('button')].find(button=>button.getAttribute('aria-label')===focusLabel);(target||dialog.querySelector('[data-close-cart]')).focus();}
  }
})();
