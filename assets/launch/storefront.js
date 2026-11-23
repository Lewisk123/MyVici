(() => {
  'use strict';
  const header = document.querySelector('.site-head');
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 40 || document.body.classList.contains('product-page'));
  updateHeader();
  window.addEventListener('scroll', updateHeader, {passive:true});
  document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const photo = gallery.querySelector('.gallery-image');
    const buttons = [...gallery.querySelectorAll('.picker button')];
    buttons.forEach(button => button.addEventListener('click', () => {
      photo.src = button.dataset.src;
      photo.alt = button.dataset.alt;
      buttons.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
      const product = gallery.closest('[data-product]');
      if (product && button.dataset.variant) {
        product.dataset.variant = button.dataset.variant;
        product.dispatchEvent(new CustomEvent('myvici:variant', {bubbles:true}));
      }
    }));
  });
})();
