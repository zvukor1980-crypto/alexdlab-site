const schedule=[
{d:'18',m:'сен',time:'19:00',title:'О любви и не только…',meta:'жизнь в вопросах и восклицаниях · 14+'},
{d:'19',m:'сен',time:'18:00',title:'Вот вы спрашиваете, как мы поживаем…',meta:'ожившие страницы · 14+'},
{d:'20',m:'сен',time:'11:00',title:'Кошкин дом',meta:'музыкальная сказка по С. Маршаку · 4+'},
{d:'26',m:'сен',time:'12:00 / 16:00',title:'Дружок',meta:'по мотивам рассказов Н. Носова · 6+'},
{d:'27',m:'сен',time:'13:00',title:'Дружок',meta:'приключения школьников · 6+'}
];
const performances=[
{title:'Капитанская дочка',meta:'А. С. Пушкин · поэтическая драма · 14+',img:'https://rus-drama.ru/images/stories/performances/kapitanskaya-dochka/m/003.jpg'},
{title:'Царский путь',meta:'историческая трагедия · 14+',img:'https://rus-drama.ru/images/teatr.jpg'},
{title:'Куликово поле',meta:'неофициальное расследование · 16+',img:'https://rus-drama.ru/images/stories/performances/kapitanskaya-dochka/m/031.jpg'},
{title:'Не унывай!',meta:'оптимистическая драма · 12+',img:'https://rus-drama.ru/images/stories/performances/kapitanskaya-dochka/m/039.jpg'},
{title:'Вот вы спрашиваете, как мы поживаем…',meta:'ожившие страницы · 14+',img:'https://rus-drama.ru/images/stories/performances/kapitanskaya-dochka/m/056.jpg'},
{title:'Сердце не камень',meta:'комедия в двух частях · 14+',img:'https://rus-drama.ru/images/stories/performances/kapitanskaya-dochka/m/015.jpg'},
{title:'Дружок',meta:'приключения школьников · 6+',img:'https://rus-drama.ru/images/stories/performances/kapitanskaya-dochka/m/006.jpg'},
{title:'Кошкин дом',meta:'музыкальная сказка · 4+',img:'https://rus-drama.ru/images/stories/performances/kapitanskaya-dochka/m/031.jpg'},
{title:'Муромское чудо',meta:'сказание · 12+',img:'https://rus-drama.ru/images/stories/performances/kapitanskaya-dochka/m/039.jpg'},
{title:'Урок дочкам',meta:'музыкальная комедия · 14+',img:'https://rus-drama.ru/images/stories/performances/kapitanskaya-dochka/m/056.jpg'}
];
const people=['Михаил Щепенко','Тамара Баснина','Аркадий Аверин','Дмитрий Поляков','Валерия Полякова','Алексей Савченко','Василий Васильев','Юлия Щепенко','Павел Левицкий','Ирина Винокурова','Ирина Андреева','Светлана Савченко','Геннадий Кухаренко','Алексей Зеленков','Сергей Нестеров','Дмитрий Щепенко','Ирина Обложнова','Антонина Королёва','Мария Мальнова','Даниил Колганов','Елизавета Ануфриева','Дарья Руденко','Артур Бичакиан','Алексей Ласточкин','Александр Бураков','Никита Шаталов','Антон Кулёмин','Александр Арчаков','Анастасия Вурста','Екатерина Аверина','Михаил Филимонов','Анастасия Дёмкина','Николай Аверин','Александр Кылосов','Денис Толкачев'];
const scheduleEl=document.querySelector('#schedule');
scheduleEl.innerHTML=schedule.map(x=>`<article class="event"><div class="event-date"><b>${x.d}</b> <span>${x.m}</span></div><div class="event-time">${x.time}</div><div class="event-title">${x.title}</div><div class="event-meta">${x.meta}</div><a class="buy" href="https://bilet.mos.ru" target="_blank" rel="noopener">Билеты →</a></article>`).join('');
const grid=document.querySelector('#performanceGrid');
let shown=6;
function drawPerformances(){grid.innerHTML=performances.slice(0,shown).map((x,i)=>`<article class="performance-card"><img loading="lazy" src="${x.img}" alt="${x.title}"><div class="performance-info"><span>${i<2?'В афише':'Репертуар'}</span><h3>${x.title}</h3><p>${x.meta}</p></div></article>`).join('');document.querySelector('#showMore').textContent=shown>=performances.length?'Скрыть дополнительные постановки':'Показать больше постановок'}
drawPerformances();
document.querySelector('#showMore').addEventListener('click',()=>{shown=shown>=performances.length?6:performances.length;drawPerformances()});
document.querySelector('#companyList').innerHTML=people.map((name,i)=>`<article class="person"><b>${name}</b><span>${i===0?'Художественный руководитель':i===1?'Директор · режиссёр':'Артист театра'}</span></article>`).join('');
const toggle=document.querySelector('.menu-toggle'),nav=document.querySelector('.main-nav');toggle.addEventListener('click',()=>{const open=nav.style.display==='flex';nav.style.display=open?'none':'flex';if(!open){Object.assign(nav.style,{position:'absolute',top:'76px',left:'0',right:'0',padding:'25px',background:'#17100d',flexDirection:'column',alignItems:'center',borderTop:'1px solid rgba(255,255,255,.15)'})}});
document.querySelectorAll('.month-tabs button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.month-tabs button').forEach(b=>b.classList.remove('active'));btn.classList.add('active')}));