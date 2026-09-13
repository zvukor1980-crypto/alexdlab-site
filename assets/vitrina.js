(function () {
  const dlg = document.getElementById('order');
  const title = document.getElementById('dlgTitle');
  const sub = document.getElementById('dlgSub');
  const mailSubject = document.getElementById('mailSubject');
  const mailService = document.getElementById('mailService');
  const mailPrice = document.getElementById('mailPrice');

  function openOrder(service, price) {
    title.textContent = service;
    sub.textContent = price ? ('Цена: ' + price) : '';
    mailService.value = service;
    mailPrice.value = price || '';
    mailSubject.value = 'Заказ alexdlab.com: ' + service;
    if (dlg.showModal) dlg.showModal();
    else dlg.setAttribute('open', '');
  }

  document.querySelectorAll('[data-service]').forEach((btn) => {
    btn.addEventListener('click', () => {
      openOrder(btn.getAttribute('data-service') || 'Заявка', btn.getAttribute('data-price') || '');
    });
  });

  document.getElementById('dlgClose').addEventListener('click', () => dlg.close());

  if (new URLSearchParams(location.search).get('sent') === '1') {
    const n = document.createElement('div');
    n.textContent = 'Заявка отправлена. Проверьте почту — подтверждение FormSubmit может прийти один раз.';
    n.style.cssText = 'position:fixed;bottom:1rem;left:50%;transform:translateX(-50%);background:#c8f542;color:#0b0f02;padding:.85rem 1.1rem;border-radius:999px;font-weight:600;z-index:50;max-width:min(520px,92vw);text-align:center;font-size:.9rem';
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 7000);
    history.replaceState({}, '', location.pathname);
  }
})();
