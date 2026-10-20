'use strict';
const form = document.getElementById('order-form');
const status = document.getElementById('form-status');
const fallback = document.getElementById('email-fallback');
document.querySelectorAll('[data-from]').forEach(button => button.addEventListener('click', () => {
  form.elements.namedItem('from').value = button.dataset.from;
  form.elements.namedItem('to').value = button.dataset.to;
  document.getElementById('order').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
}));
function orderPayload() {
  const get = name => form.elements.namedItem(name).value.trim();
  return {_subject:'Alex D Lab — заявка: '+get('from')+' → '+get('to'), _template:'table', name:get('name'), contact:get('contact'), from:get('from'), to:get('to'), message:get('message'), consent:'Согласие на связь по заказу получено', _honey:get('_honey'), site:'https://alexdlab.com/'};
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const payload = orderPayload();
  if(payload._honey) return;
  if(!payload.name || !payload.contact || payload.message.length<10) {
    status.className='error'; status.textContent='Укажите имя, контакт и описание заказа (не менее 10 символов).'; return;
  }
  const body = `Имя: ${payload.name}\nКонтакт: ${payload.contact}\nОткуда: ${payload.from}\nКуда: ${payload.to}\n\n${payload.message}`;
  fallback.href='mailto:digitalaleksei@gmail.com?subject='+encodeURIComponent(payload._subject)+'&body='+encodeURIComponent(body);
  const button=form.querySelector('[type=submit]');
  button.disabled=true;form.setAttribute('aria-busy','true');status.className='';status.textContent='Отправляю заявку…';
  const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);
  try {
    const response=await fetch('https://formsubmit.co/ajax/digitalaleksei@gmail.com',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify(payload),signal:controller.signal});
    const result=await response.json();
    if(!response.ok || !(result.success===true || result.success==='true')) throw new Error('not accepted');
    status.className='success';
    status.textContent='Заявка принята сервисом отправки. Алексей свяжется с вами по указанному контакту. Если ответа долго нет, напишите напрямую по email.';
    form.reset();
  } catch(error) {
    status.className='error';status.textContent='Не удалось подтвердить отправку. Ваши данные остались в форме. Нажмите ссылку ниже, чтобы отправить готовую заявку через почту.';
  } finally {clearTimeout(timeout);button.disabled=false;form.removeAttribute('aria-busy');}
});
