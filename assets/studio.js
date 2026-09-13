(() => {
  const MAIL = 'digitalaleksei@gmail.com';
  const ENDPOINT = `https://formsubmit.co/ajax/${MAIL}`;
  const $ = (s, r = document) => r.querySelector(s);

  window.addEventListener('load', () => {
    setTimeout(() => {
      const splash = $('#splash');
      if (!splash) return;
      splash.classList.add('hide');
      splash.setAttribute('aria-hidden', 'true');
      setTimeout(() => splash.remove(), 700);
    }, 1600);
  });

  function say(el, msg, err) {
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('error', !!err);
    el.classList.toggle('ok', !err && !!msg);
  }

  async function sendOrder(payload, statusEl) {
    say(statusEl, 'Отправляю…');
    const body = {
      _subject: `Alex D Lab — заявка: ${payload.service}`,
      _template: 'table',
      name: payload.name,
      email: payload.email,
      contact: payload.contact || '—',
      service: payload.service,
      price: payload.price || '—',
      message: payload.message || '—',
      site: 'https://alexdlab.com/'
    };
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('send failed');
  }

  $('#studioOrder')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await sendOrder({
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        contact: f.contact.value.trim(),
        service: f.service.value,
        message: f.message.value.trim()
      }, $('#orderStatus'));
      say($('#orderStatus'), 'Заявка отправлена. Ответим на email.');
      f.reset();
    } catch (_) {
      say($('#orderStatus'), 'Не удалось отправить. Напишите на ' + MAIL, true);
    } finally {
      btn.disabled = false;
    }
  });

  function openQuick(service, price) {
    const modal = $('#quickOrder');
    const form = $('#quickForm');
    $('#qTitle').textContent = 'Заказ: ' + service;
    $('#qSub').textContent = price || '';
    form.service.value = service;
    form.price.value = price || '';
    say($('#qStatus'), '');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
  }
  function closeQuick() {
    const modal = $('#quickOrder');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-order]');
    if (btn) openQuick(btn.dataset.order, btn.dataset.price);
    if (e.target.closest('[data-close]')) closeQuick();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeQuick(); });

  $('#quickForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = e.currentTarget;
    const btn = f.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      await sendOrder({
        name: f.name.value.trim(),
        email: f.email.value.trim(),
        contact: f.contact.value.trim(),
        service: f.service.value,
        price: f.price.value,
        message: f.message.value.trim()
      }, $('#qStatus'));
      say($('#qStatus'), 'Заявка отправлена.');
      setTimeout(() => { closeQuick(); f.reset(); }, 800);
    } catch (_) {
      say($('#qStatus'), 'Ошибка отправки. Напишите на ' + MAIL, true);
    } finally {
      btn.disabled = false;
    }
  });
})();
