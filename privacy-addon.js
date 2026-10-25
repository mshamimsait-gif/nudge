(() => {
  'use strict';

  const STORAGE_KEY = 'nudgePrivacyHidden';
  let hidden = localStorage.getItem(STORAGE_KEY) === '1';

  const openEye = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
  const closedEye = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.7 6.2A10.6 10.6 0 0 1 12 6c6.5 0 10 6 10 6a15 15 0 0 1-2.4 3.2M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';

  const style = document.createElement('style');
  style.textContent = `
    .header-actions{display:flex;align-items:center;gap:8px}
    #privacyToggle svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
    #privacyToggle.active{background:#0a3e83;color:#75b2ff;border-color:#2d65aa}
    .privacy-masked{letter-spacing:.08em}
    @media(max-width:390px){.header-actions{gap:6px}.header-actions .iconbtn{width:44px;height:44px}}
  `;
  document.head.appendChild(style);

  function installButton() {
    const gear = document.getElementById('gear');
    if (!gear || document.getElementById('privacyToggle')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'header-actions';
    gear.parentNode.insertBefore(wrapper, gear);
    wrapper.appendChild(gear);
    const button = document.createElement('button');
    button.type = 'button';
    button.id = 'privacyToggle';
    button.className = 'iconbtn';
    wrapper.insertBefore(button, gear);
    button.addEventListener('click', () => {
      hidden = !hidden;
      localStorage.setItem(STORAGE_KEY, hidden ? '1' : '0');
      applyPrivacy();
    });
  }

  function amountElements() {
    return document.querySelectorAll([
      '#di','#de','#db','#te','#rt','#le','#lo',
      '#up .row b','#recent .row b','#txlist .row b',
      '#rlist .row b','#llist .row b',
      '.row-main > b','.summary > b','.totals b'
    ].join(','));
  }

  function applyPrivacy() {
    const button = document.getElementById('privacyToggle');
    if (button) {
      button.innerHTML = hidden ? closedEye : openEye;
      button.classList.toggle('active', hidden);
      button.setAttribute('aria-label', hidden ? 'Show amounts' : 'Hide amounts');
      button.title = hidden ? 'Show amounts' : 'Hide amounts';
    }

    amountElements().forEach(el => {
      if (hidden) {
        if (el.textContent !== '••••••') el.dataset.realAmount = el.textContent;
        el.textContent = '••••••';
        el.classList.add('privacy-masked');
      } else {
        if (el.dataset.realAmount) {
          el.textContent = el.dataset.realAmount;
          delete el.dataset.realAmount;
        }
        el.classList.remove('privacy-masked');
      }
    });
  }

  installButton();

  const observer = new MutationObserver(mutations => {
    if (!hidden) return;
    const needsMask = mutations.some(m => {
      if (m.type === 'childList') return [...m.addedNodes].some(n => n.nodeType === 1);
      return false;
    });
    if (needsMask) requestAnimationFrame(applyPrivacy);
  });
  observer.observe(document.querySelector('main') || document.body, {childList:true, subtree:true});

  document.addEventListener('click', () => requestAnimationFrame(applyPrivacy));
  requestAnimationFrame(applyPrivacy);
})();
