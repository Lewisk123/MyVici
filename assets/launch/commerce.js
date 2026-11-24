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
  let checkingStock = true;
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
    panels.forEach(panel=>{const variant=variantFor(panel);if(variant){showPrice(panel.querySelector('[data-product-price]'),variant.price,panel.dataset.product==='bag');const label=panel.querySelector('[data-single-choice]');if(label)label.textContent='Single beanie · '+variant.title;}});
    document.querySelectorAll('[data-catalog-bag-price]').forEach(node=>showPrice(node,products.bag.variants.nodes[0].price,true));
  }
  const setButtons = () => { panels.forEach(panel => {
    const variant=variantFor(panel);
    panel.querySelectorAll('[data-buy]').forEach(button => {
      button.disabled=busy || !available || !variant?.availableForSale;
      button.textContent=!busy && available && !variant?.availableForSale ? 'Sold out' : button.dataset.buy==='now' ? 'Buy now' : 'Add to bag';
    });
  }); refreshOfferControls(); };
  function refreshPromos() {
    refreshPrices();
    const active=promoActive();
    document.querySelectorAll('[data-promo-summary]').forEach(node => { node.textContent=active ? 'Black Friday · 2 beanies for £30 · Organiser bag £44.99 · Bag + beanie £59.99 · Ends 2 December' : 'Geared for greatness · Built by a runner'; });
    document.querySelectorAll('[data-promo-ribbon]').forEach(ribbon => {
      if(ribbon.dataset.promoState===String(active)) return;
      ribbon.dataset.promoState=String(active);
      ribbon.querySelector('[data-promo-label]').textContent=active ? 'Black Friday' : 'MYVICI';
      const messages=active
        ? ['2 beanies for £30', 'Mix any two colours', 'Organiser bag £44.99', 'Bag + beanie £59.99', 'Ends 2 December']
        : ['Geared for greatness', 'Built by a runner', 'Kit for everyday adventure'];
      ribbon.querySelectorAll('[data-promo-group]').forEach(group => group.replaceChildren(...messages.map(text=>el('span','',text))));
    });
    refreshOfferControls();
  }
  document.querySelectorAll('[data-offer-picker]').forEach(buildOfferPicker);
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
  function buildOfferPicker(form, index) {
    const pair=form.dataset.offerPicker==='pair';
    const prefix='offer-'+index;
    const title=el('h3','offer-heading',pair?'2 beanies for £30':'Bag + beanie £59.99');
    title.id=prefix+'-title'; form.setAttribute('aria-labelledby',title.id);
    form.append(el('p','offer-kicker','Black Friday'),title,
      el('p','offer-intro',pair?'Choose two different colours or two of your favourite.':'One organiser bag + one beanie in your favourite colour.'));
    const fields=el('fieldset','offer-options '+(pair?'pair-options':'bundle-options'));
    fields.append(el('legend','',pair?'Choose your two beanies':'Choose your beanie colour'));
    for(const variant of products.beanie.variants.nodes) {
      const row=el('label','offer-option');
      const image=el('img');image.src=variant.image.url;image.alt='';image.width=48;image.height=48;image.loading='lazy';
      const name=el('span','offer-colour',variant.title);
      const input=el('input');input.type=pair?'number':'radio';input.dataset.offerVariant=variant.id;
      input.setAttribute('aria-label',pair?variant.title+' quantity':variant.title);
      if(pair){input.min='0';input.max='2';input.step='1';input.value='0';input.inputMode='numeric';}
      else {input.name=prefix+'-colour';input.value=variant.id;}
      row.append(image,name,input); fields.append(row);
    }
    const summary=el('p','offer-selection');summary.dataset.selectionSummary='';summary.id=prefix+'-selection';summary.setAttribute('aria-live','polite');
    const button=el('button','primary-button offer-submit',pair?'Add 2 beanies · £30':'Add bag + beanie · £59.99');button.type='submit';button.disabled=true;button.setAttribute('aria-describedby',summary.id);
    const message=el('p','offer-status');message.dataset.offerStatus='';message.setAttribute('role','status');
    form.append(fields,summary,button,el('p','offer-terms',pair?'£4 standard delivery. Offer ends 2 December.':'£6.99 standard delivery. Offer ends 2 December.'),message);
    form.addEventListener('input',()=>{message.textContent='';refreshOfferControls();});
    form.addEventListener('submit',async event=>{
      event.preventDefault();
      if(busy)return;
      const choice=offerSelection(form);
      if(!promoActive() || !available || choice.error){message.textContent=!promoActive()?'This offer has ended.':!available?'Please wait while we check availability.':choice.error;return;}
      if(!form.reportValidity())return;
      busy=true;setButtons();message.textContent='Adding your offer to the bag…';
      try {await addCartLines(choice.lines);message.textContent='Your offer has been added.';openCart();}
      catch(error){message.textContent=error.name==='TimeoutError'?'The shop took too long to respond. Please try again.':error.message;}
      finally {busy=false;setButtons();renderCart();}
    });
  }
  function offerSelection(form) {
    const variants=products.beanie.variants.nodes;
    const inputs=[...form.querySelectorAll('[data-offer-variant]')];
    const pair=form.dataset.offerPicker==='pair';
    const selected=inputs.map(input=>({merchandiseId:input.dataset.offerVariant,quantity:pair?Number(input.value):(input.checked?1:0)}));
    const total=selected.reduce((sum,line)=>sum+line.quantity,0);
    const invalid=selected.some(line=>!Number.isInteger(line.quantity)||line.quantity<0||line.quantity>(pair?2:1));
    const lines=selected.filter(line=>line.quantity>0);
    let error=invalid?'Use whole numbers from 0 to 2.':pair?(total===2?'':'Choose exactly 2 beanies for this offer.'):(total===1?'':'Choose a beanie colour for your bundle.');
    if(lines.some(line=>!variants.find(v=>v.id===line.merchandiseId)?.availableForSale))error='One of your colours is sold out. Please choose another.';
    if(!pair){const bag=products.bag.variants.nodes[0];if(!bag?.availableForSale)error='The organiser bag is currently sold out.';else lines.unshift({merchandiseId:bag.id,quantity:1});}
    return {lines,error,total,invalid};
  }
  function refreshOfferControls() {
    document.querySelectorAll('[data-offer-picker]').forEach(form=>{
      form.hidden=!promoActive();
      const choice=offerSelection(form);
      const pair=form.dataset.offerPicker==='pair';
      form.querySelectorAll('[data-offer-variant]').forEach(input=>{
        const variant=products.beanie.variants.nodes.find(v=>v.id===input.dataset.offerVariant);
        input.disabled=busy || !available || !variant?.availableForSale;
        const row=input.closest('.offer-option');
        row.classList.toggle('is-selected',pair?Number(input.value)>0:input.checked);
        row.classList.toggle('is-sold-out',available && !variant?.availableForSale);
        row.querySelector('.offer-colour').textContent=(variant?.title||'Unavailable')+(available && !variant?.availableForSale?' · Sold out':'');
      });
      form.querySelector('[data-selection-summary]').textContent=!available?(checkingStock?'Checking availability…':'Stock check unavailable. Refresh to try again.'):pair?(choice.invalid||choice.total===2&&choice.error?choice.error:choice.total+' / 2 selected'+(choice.total===2?' · Ready to add':choice.total>2?' · Choose only 2':'')):(choice.error||'Ready to add your bag + beanie');
      form.querySelector('button[type="submit"]').disabled=busy||!available||!promoActive()||Boolean(choice.error);
    });
  }
  async function addCartLines(lines) {
    await readyCart;
    const existing=Boolean(cartId);
    const variables=existing?{cartId,lines}:{input:{buyerIdentity:{countryCode:'GB'},lines}};
    const data=await api(existing?'AddLines':'CreateCart',variables);
    const result=data[existing?'cartLinesAdd':'cartCreate'];
    if(result.cart)saveCart(result.cart);
    if(result.userErrors?.length)throw new Error(result.userErrors.map(e=>e.message).join(' '));
    if(!result.cart)throw new Error('Your bag could not be updated. Please try again.');
    dialog.querySelector('.cart-status').textContent='';
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
    checkingStock=false;
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
    const label=panel.querySelector('[data-single-choice]');if(label && variant)label.textContent='Single beanie · '+variant.title;
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
      const line={merchandiseId:'gid://shopify/ProductVariant/'+panel.dataset.variant,quantity:Number(input.value)};
      await addCartLines([line]);
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
