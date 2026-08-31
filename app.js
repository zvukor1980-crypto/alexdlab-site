const input = document.querySelector('#problemInput');
const count = document.querySelector('#charCount');
const form = document.querySelector('#diagnosticForm');
const result = document.querySelector('#result');
let device = 'iphone';

const plans = {
  screen: { title: 'Сначала сохраните доступ к данным', text: 'Экран повреждён, поэтому приоритет — не ремонт, а безопасное копирование данных.', steps: ['Не нажимайте на повреждённую область и не пытайтесь прогревать экран.', 'Если изображение видно и сенсор работает — подключите Wi‑Fi и создайте резервную копию.', 'Если сенсор не работает, проверьте доступ через ранее доверенный компьютер.', 'При отсутствии доступа попросите сервис временно подключить исправный дисплей без сброса устройства.'], warning: 'Не соглашайтесь на сброс или перепрошивку, пока не выяснено, существует ли резервная копия.' },
  water: { title: 'Выключите устройство прямо сейчас', text: 'После контакта с жидкостью скорость и правильный порядок действий особенно важны.', steps: ['Отключите зарядку и выключите телефон.', 'Снимите чехол, извлеките SIM‑лоток и промокните корпус снаружи.', 'Не включайте, не заряжайте и не используйте фен или рис.', 'Как можно быстрее передайте устройство на разбор и очистку от жидкости.'], warning: 'Каждая попытка включения может усилить коррозию или вызвать короткое замыкание.' },
  network: { title: 'Отделим проблему сети от неисправности телефона', text: 'Начните с проверок, которые не затрагивают данные и настройки устройства.', steps: ['Включите авиарежим на 20 секунд и выключите его.', 'Проверьте покрытие и возможный сбой оператора на другом телефоне.', 'Переставьте SIM‑карту или временно установите другую.', 'Если сеть не появилась, проверьте настройки оператора и только затем сбрасывайте настройки сети.'], warning: 'Сброс настроек сети удалит сохранённые Wi‑Fi‑пароли, но не фотографии и приложения.' },
  slow: { title: 'Освободим ресурсы без удаления данных', text: 'Торможение чаще всего можно исследовать без полного сброса устройства.', steps: ['Перезагрузите телефон и проверьте свободное место.', 'Освободите не менее 10–15% хранилища, начиная с крупных видео.', 'Обновите систему и приложения после создания резервной копии.', 'Проверьте состояние аккумулятора и приложения с высоким расходом энергии.'], warning: 'Не устанавливайте неизвестные «ускорители» и «очистители»: они часто ухудшают работу и собирают данные.' },
  charge: { title: 'Проверим цепочку зарядки', text: 'Последовательно исключим кабель, адаптер, разъём и аккумулятор.', steps: ['Осмотрите кабель и адаптер, затем попробуйте заведомо исправный комплект.', 'Проверьте разъём при хорошем освещении; не используйте металлические предметы.', 'Оставьте телефон на зарядке на 30 минут и попробуйте принудительный перезапуск.', 'Если корпус греется, пахнет химией или вздулся — немедленно отключите питание.'], warning: 'Вздутый аккумулятор нельзя прокалывать, прижимать или продолжать заряжать.' },
  power: { title: 'Начнём с безопасной проверки питания', text: 'Чёрный экран не всегда означает, что телефон полностью выключен.', steps: ['Позвоните на телефон и проверьте вибрацию, звук или уведомления.', 'Подключите исправную зарядку на 30 минут.', 'Выполните принудительный перезапуск для своей модели.', 'Если есть признаки жизни без изображения, вероятна проблема дисплейного модуля.'], warning: 'Если перед отключением телефон падал, намок или сильно нагрелся, не повторяйте попытки включения.' },
  generic: { title: 'Уточним симптомы безопасными проверками', text: 'Предварительный маршрут составлен. Для точного результата потребуется ещё несколько деталей.', steps: ['Вспомните, что произошло непосредственно перед появлением проблемы.', 'Проверьте, включается ли экран, есть ли звук, вибрация и реакция на зарядку.', 'Не выполняйте сброс и не удаляйте данные.', 'Откройте сервисную лабораторию и выберите точную модель устройства.'], warning: 'Если устройство намокло, перегрелось или аккумулятор вздулся — прекратите использование.' }
};

function classify(value) {
  const v = value.toLowerCase();
  if (/экран|диспле|разб|трещ|сенсор/.test(v)) return 'screen';
  if (/вод|намок|жидк|утон/.test(v)) return 'water';
  if (/сет|сим|signal|оператор|связ/.test(v)) return 'network';
  if (/торм|завис|медлен|лага/.test(v)) return 'slow';
  if (/заряд|кабел|разъём|разъем/.test(v)) return 'charge';
  if (/не включ|черн|не запуска/.test(v)) return 'power';
  return 'generic';
}

function showPlan(value) {
  const plan = plans[classify(value)];
  document.querySelector('#resultTitle').textContent = plan.title;
  document.querySelector('#resultText').textContent = `${device === 'iphone' ? 'Для iPhone' : device === 'android' ? 'Для Android' : 'Для вашего устройства'}: ${plan.text}`;
  document.querySelector('#resultWarning').textContent = plan.warning;
  document.querySelector('#resultSteps').innerHTML = plan.steps.map((step, i) => `<div class="step"><b>${String(i + 1).padStart(2, '0')}</b><span>${step}</span></div>`).join('');
  result.hidden = false;
  result.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

input.addEventListener('input', () => { input.value = input.value.slice(0, 240); count.textContent = input.value.length; });
document.querySelectorAll('.device').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.device').forEach(item => item.classList.remove('active'));
  button.classList.add('active'); device = button.dataset.device;
}));
document.querySelectorAll('.problem').forEach(button => button.addEventListener('click', () => {
  input.value = button.dataset.problem; count.textContent = input.value.length; showPlan(input.value);
}));
form.addEventListener('submit', event => { event.preventDefault(); showPlan(input.value.trim() || 'Нужна диагностика телефона'); });
document.querySelector('#closeResult').addEventListener('click', () => { result.hidden = true; document.querySelector('#diagnostic').scrollIntoView({ behavior: 'smooth' }); });
