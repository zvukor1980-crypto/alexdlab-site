let db;
const $ = id => document.getElementById(id);
const selects = {category:$('category'),brand:$('brand'),model:$('model'),fault:$('fault')};

const IPHONES=[
['iphone','iPhone'],['iphone-3g','iPhone 3G'],['iphone-3gs','iPhone 3GS'],['iphone-4','iPhone 4'],['iphone-4s','iPhone 4s'],['iphone-5','iPhone 5'],['iphone-5c','iPhone 5c'],['iphone-5s','iPhone 5s'],['iphone-6','iPhone 6'],['iphone-6-plus','iPhone 6 Plus'],['iphone-6s','iPhone 6s'],['iphone-6s-plus','iPhone 6s Plus'],['iphone-se-1','iPhone SE (1st gen)'],['iphone-7','iPhone 7'],['iphone-7-plus','iPhone 7 Plus'],['iphone-8','iPhone 8'],['iphone-8-plus','iPhone 8 Plus'],['iphone-x','iPhone X'],['iphone-xr','iPhone XR'],['iphone-xs','iPhone XS'],['iphone-xs-max','iPhone XS Max'],['iphone-11','iPhone 11'],['iphone-11-pro','iPhone 11 Pro'],['iphone-11-pro-max','iPhone 11 Pro Max'],['iphone-se-2','iPhone SE (2nd gen)'],['iphone-12-mini','iPhone 12 mini'],['iphone-12','iPhone 12'],['iphone-12-pro','iPhone 12 Pro'],['iphone-12-pro-max','iPhone 12 Pro Max'],['iphone-13-mini','iPhone 13 mini'],['iphone-13','iPhone 13'],['iphone-13-pro','iPhone 13 Pro'],['iphone-13-pro-max','iPhone 13 Pro Max'],['iphone-se-3','iPhone SE (3rd gen)'],['iphone-14','iPhone 14'],['iphone-14-plus','iPhone 14 Plus'],['iphone-14-pro','iPhone 14 Pro'],['iphone-14-pro-max','iPhone 14 Pro Max'],['iphone-15','iPhone 15'],['iphone-15-plus','iPhone 15 Plus'],['iphone-15-pro','iPhone 15 Pro'],['iphone-15-pro-max','iPhone 15 Pro Max'],['iphone-16','iPhone 16'],['iphone-16-plus','iPhone 16 Plus'],['iphone-16-pro','iPhone 16 Pro'],['iphone-16-pro-max','iPhone 16 Pro Max'],['iphone-16e','iPhone 16e'],['iphone-17','iPhone 17'],['iphone-17-pro','iPhone 17 Pro'],['iphone-17-pro-max','iPhone 17 Pro Max'],['iphone-air','iPhone Air'],['iphone-17e','iPhone 17e']
].map(([id,name])=>({id,name}));

async function init(){
  const res = await fetch('data/devices.json',{cache:'no-store'});
  db = await res.json();
  fill(selects.category, db.categories, 'Выберите категорию');
  selects.category.addEventListener('change', onCategory);
  selects.brand.addEventListener('change', onBrand);
  selects.model.addEventListener('change', onModel);
  $('startBtn').addEventListener('click', renderDiagnostic);
  $('saveNotes').addEventListener('click', saveNotes);
  $('analyzeBtn').addEventListener('click', analyze);
  installFirmwareCenter();
  onCategory();
  registerPWA();
}
function fill(el, items, placeholder){
  el.innerHTML = `<option value="">${placeholder}</option>` + (items||[]).map(x=>`<option value="${x.id}">${x.name}</option>`).join('');
}
function cat(){ return db.categories.find(x=>x.id===selects.category.value); }
function brand(){ return cat()?.brands.find(x=>x.id===selects.brand.value); }
function isApple(){ return selects.category.value==='phones' && selects.brand.value==='apple'; }
function model(){
  const b=brand();
  const exact=b?.models.find(x=>x.id===selects.model.value);
  if(exact) return exact;
  if(isApple() && selects.model.value){
    const picked=IPHONES.find(x=>x.id===selects.model.value);
    const template=b?.models?.[0];
    if(picked && template) return {...template,id:picked.id,name:picked.name,revision:'iPhone diagnostic profile'};
  }
}
function fault(){ return model()?.faults.find(x=>x.id===selects.fault.value); }
function onCategory(){
  fill(selects.brand, cat()?.brands||[], cat()?.brands?.length?'Выберите производителя':'База готова к наполнению');
  fill(selects.model, [], 'Сначала производитель');
  fill(selects.fault, [], 'Сначала модель');
  updateFirmwareCenter();
}
function onBrand(){
  if(isApple()) fill(selects.model, IPHONES, 'Выберите iPhone');
  else fill(selects.model, brand()?.models||[], 'Выберите модель');
  fill(selects.fault, [], 'Сначала модель');
  updateFirmwareCenter();
}
function onModel(){
  fill(selects.fault, model()?.faults||[], 'Выберите неисправность');
  renderDocs(); loadNotes(); updateFirmwareCenter();
}
function renderDocs(){
  const m=model();
  $('docs').innerHTML = !m ? '<span class="muted">Выберите устройство.</span>' : (m.documents||[]).map(d=>`<div class="doc"><b>${d.name}</b><span>${d.status}</span></div>`).join('');
}
function renderDiagnostic(){
  const m=model(), f=fault();
  if(!m||!f){ $('diagTitle').textContent='Выберите модель и неисправность'; return; }
  $('diagTitle').textContent = `${m.name} — ${f.name}`;
  const badge=$('sourceBadge');
  badge.className='badge '+(f.verification==='verified'?'verified':'demo');
  badge.textContent=f.verification==='verified'?'проверено':'алгоритм / нужен источник для точных точек';
  $('tools').innerHTML=(f.tools||[]).map(t=>`<span class="chip">${t}</span>`).join('');
  $('flow').classList.remove('empty');
  $('flow').innerHTML=f.steps.map((s,i)=>`<div class="step"><div class="step-top"><div class="step-num">${i+1}</div><div><h4>${s.title}</h4><p>${s.text}</p><div class="meta">${s.instrument?`<span class="tag">Прибор: ${s.instrument}</span>`:''}${s.mode?`<span class="tag">Режим: ${s.mode}</span>`:''}${s.risk?`<span class="tag">⚠ ${s.risk}</span>`:''}${s.source?`<span class="tag">Источник: ${s.source}</span>`:''}</div><div class="decision"><button onclick="markStep(this,'ok')">✓ Выполнено</button><button onclick="markStep(this,'problem')">! Есть отклонение</button></div></div></div></div>`).join('');
}
window.markStep=(btn,state)=>{ btn.closest('.step').style.outline=state==='ok'?'1px solid #5b7727':'1px solid #806226'; };
function noteKey(){ return `repairlab:${selects.model.value||'general'}:notes`; }
function saveNotes(){ localStorage.setItem(noteKey(),$('notes').value); $('saveNotes').textContent='Сохранено'; setTimeout(()=>$('saveNotes').textContent='Сохранить локально',900); }
function loadNotes(){ $('notes').value=localStorage.getItem(noteKey())||''; }
function analyze(){
  const val=parseFloat(String($('measureValue').value).replace(',','.'));
  if(Number.isNaN(val)){ $('measureResult').textContent='Введите числовое значение.'; return; }
  const unit={voltage:'V',resistance:'Ω',current:'A',frequency:'Hz'}[$('measureType').value];
  $('measureResult').innerHTML=`Получено: <b>${val} ${unit}</b>. Автоматическая оценка не выполняется без выбранной контрольной точки с подтверждённым диапазоном. Это защита от выдуманных «норм».`;
}

function installFirmwareCenter(){
  const selector=document.querySelector('.selector');
  if(!selector || document.getElementById('firmwareCenter')) return;
  const el=document.createElement('section');
  el.id='firmwareCenter';
  el.className='panel';
  el.style.cssText='padding:20px;margin:0 0 18px;display:none';
  el.innerHTML=`
    <div class="section-head"><div><p class="eyebrow">IPHONE FIRMWARE CENTER</p><h2>Найти и подготовить прошивку</h2></div><span class="badge verified">только Signed IPSW</span></div>
    <p class="muted" style="line-height:1.55;margin-top:-2px">Сначала выберите iPhone выше. RepairLab найдёт все аппаратные варианты этой модели, затем покажет только подписанные Apple прошивки. Для старых моделей обязательно выберите точный ProductType (GSM/Global/CDMA), иначе IPSW может не подойти.</p>
    <div style="display:grid;grid-template-columns:minmax(220px,.8fr) minmax(260px,1.2fr) auto;gap:10px;align-items:end" class="fw-grid">
      <div class="field"><label>Точный аппаратный вариант</label><select id="fwDevice"><option value="">Сначала выберите iPhone</option></select></div>
      <div class="field"><label>Подписанная прошивка</label><select id="fwIpsw"><option value="">Сначала определите устройство</option></select></div>
      <button id="fwFind" class="primary" style="height:44px">Найти прошивку</button>
    </div>
    <div id="fwResult" class="result muted" style="margin-top:12px">Выберите iPhone — программа автоматически запросит актуальные варианты и подписанные IPSW.</div>
    <div id="fwActions" style="display:none;gap:8px;flex-wrap:wrap;margin-top:10px"></div>
    <div class="warning" style="margin-top:14px"><strong>Прошивка.</strong><span>GitHub Pages не имеет прямого доступа к сервисному USB-протоколу iPhone. Поэтому RepairLab подбирает правильную Signed IPSW и даёт прямую загрузку, а установка выполняется через Finder (Mac), Apple Devices/iTunes (Windows) либо совместимый локальный инструмент. Update пытается сохранить данные; Restore стирает устройство.</span></div>`;
  selector.insertAdjacentElement('afterend',el);
  const style=document.createElement('style');
  style.textContent='@media(max-width:850px){.fw-grid{grid-template-columns:1fr!important}}';
  document.head.appendChild(style);
  $('fwFind').addEventListener('click',loadDeviceVariants);
  $('fwDevice').addEventListener('change',loadSignedFirmwares);
  $('fwIpsw').addEventListener('change',renderFirmwareChoice);
}

function normalizeName(s){
  return String(s||'').toLowerCase().replace(/\(.*?\)/g,'').replace(/\b(1st|2nd|3rd)\s+gen\b/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
async function updateFirmwareCenter(){
  const box=$('firmwareCenter'); if(!box) return;
  box.style.display=isApple() && selects.model.value ? 'block' : 'none';
  if(box.style.display==='block'){
    $('fwDevice').innerHTML='<option value="">Нажмите «Найти прошивку»</option>';
    $('fwIpsw').innerHTML='<option value="">Сначала определите устройство</option>';
    $('fwResult').textContent=`Выбрано: ${model()?.name||''}. Нажмите «Найти прошивку».`;
    $('fwActions').style.display='none';
  }
}
async function loadDeviceVariants(){
  const m=model(); if(!m || !isApple()) return;
  $('fwFind').disabled=true; $('fwFind').textContent='Ищу…';
  $('fwResult').textContent='Запрашиваю каталог аппаратных вариантов…';
  try{
    const r=await fetch('https://api.ipsw.me/v4/devices',{cache:'no-store'});
    if(!r.ok) throw new Error('devices '+r.status);
    const all=await r.json();
    const wanted=normalizeName(m.name);
    let matches=all.filter(d=>String(d.identifier||'').startsWith('iPhone') && normalizeName(d.name)===wanted);
    if(!matches.length) matches=all.filter(d=>String(d.identifier||'').startsWith('iPhone') && (normalizeName(d.name).includes(wanted)||wanted.includes(normalizeName(d.name))));
    if(!matches.length) throw new Error('Не найден аппаратный вариант для '+m.name);
    matches.sort((a,b)=>String(a.identifier).localeCompare(String(b.identifier)));
    $('fwDevice').innerHTML=matches.map(d=>`<option value="${d.identifier}">${d.name} — ${d.identifier}</option>`).join('');
    $('fwResult').innerHTML=`Найдено аппаратных вариантов: <b>${matches.length}</b>. ${matches.length>1?'Выберите точный ProductType перед загрузкой прошивки.':'ProductType определён.'}`;
    await loadSignedFirmwares();
  }catch(e){
    $('fwResult').innerHTML=`Не удалось автоматически получить каталог IPSW: <b>${e.message}</b>. Можно открыть каталог прошивок вручную на IPSW Downloads.`;
    $('fwActions').style.display='flex';
    $('fwActions').innerHTML='<a class="ghost" style="display:inline-flex;align-items:center;text-decoration:none" href="https://ipsw.me/product/iPhone" target="_blank" rel="noopener">Открыть каталог iPhone IPSW</a>';
  }finally{$('fwFind').disabled=false;$('fwFind').textContent='Найти прошивку';}
}
async function loadSignedFirmwares(){
  const id=$('fwDevice').value; if(!id) return;
  $('fwIpsw').innerHTML='<option>Загрузка…</option>';
  $('fwResult').textContent=`Проверяю подписанные прошивки для ${id}…`;
  try{
    const r=await fetch(`https://api.ipsw.me/v4/device/${encodeURIComponent(id)}?type=ipsw`,{cache:'no-store'});
    if(!r.ok) throw new Error('firmware '+r.status);
    const d=await r.json();
    const signed=(d.firmwares||[]).filter(f=>f.signed===true).sort((a,b)=>new Date(b.releasedate||0)-new Date(a.releasedate||0));
    if(!signed.length){
      $('fwIpsw').innerHTML='<option value="">Нет подписанных IPSW</option>';
      $('fwResult').innerHTML=`Для <b>${id}</b> API сейчас не показывает подписанных IPSW. Неподписанную прошивку для обычного Restore использовать нельзя.`;
      $('fwActions').style.display='flex';
      $('fwActions').innerHTML=`<a class="ghost" style="display:inline-flex;align-items:center;text-decoration:none" href="https://ipsw.me/${encodeURIComponent(id)}" target="_blank" rel="noopener">Проверить на IPSW.me</a>`;
      return;
    }
    $('fwIpsw').innerHTML=signed.map((f,i)=>`<option value="${i}">iOS ${f.version} · ${f.buildid}${f.filesize?` · ${formatBytes(f.filesize)}`:''}</option>`).join('');
    $('fwIpsw').dataset.firmwares=JSON.stringify(signed);
    renderFirmwareChoice();
  }catch(e){
    $('fwResult').innerHTML=`Ошибка получения прошивок: <b>${e.message}</b>.`;
  }
}
function formatBytes(n){
  const v=Number(n); if(!v) return '';
  const g=v/1024/1024/1024; return g>=1?`${g.toFixed(1)} GB`:`${(v/1024/1024).toFixed(0)} MB`;
}
function renderFirmwareChoice(){
  const raw=$('fwIpsw').dataset.firmwares; if(!raw) return;
  const list=JSON.parse(raw), f=list[Number($('fwIpsw').value)||0]; if(!f) return;
  const id=$('fwDevice').value;
  $('fwResult').innerHTML=`<b>${id}</b> → iOS <b>${f.version}</b> (${f.buildid}) · <b>Signed</b>${f.filesize?` · ${formatBytes(f.filesize)}`:''}. Файл можно использовать для восстановления, пока Apple продолжает его подписывать.`;
  $('fwActions').style.display='flex';
  const url=f.url||`https://api.ipsw.me/v4/ipsw/download/${encodeURIComponent(id)}/${encodeURIComponent(f.buildid)}`;
  $('fwActions').innerHTML=`
    <a class="primary" style="display:inline-flex;align-items:center;min-height:42px;padding:0 14px;border-radius:10px;text-decoration:none" href="${url}" target="_blank" rel="noopener">Скачать Signed IPSW</a>
    <button class="ghost" onclick="showFlashSteps('update')">Update без стирания</button>
    <button class="ghost" onclick="showFlashSteps('restore')">Restore / чистая прошивка</button>
    <a class="ghost" style="display:inline-flex;align-items:center;text-decoration:none" href="https://ipsw.me/${encodeURIComponent(id)}" target="_blank" rel="noopener">Все версии</a>`;
}
window.showFlashSteps=(mode)=>{
  const update=mode==='update';
  $('fwResult').innerHTML=`<b>${update?'UPDATE — попытка сохранить данные':'RESTORE — данные будут стёрты'}</b><br><br>1. Подключите iPhone кабелем к Mac или Windows.<br>2. Откройте Finder (macOS Catalina+) либо Apple Devices/iTunes на Windows.<br>3. При необходимости переведите iPhone в Recovery/DFU по инструкции для его поколения.<br>4. ${update?'Сначала выберите Update. Если используете скачанный IPSW вручную: на Mac удерживайте Option при выборе Update, на Windows — Shift.':'Для выбранного IPSW на Mac удерживайте Option при Restore iPhone, на Windows — Shift при Restore.'}<br>5. Выберите скачанный IPSW и дождитесь проверки подписи Apple и завершения установки.${update?'<br><br>Если данные критичны, не переходите к Restore, пока не исчерпаны пути без стирания.':''}`;
};

function registerPWA(){
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(r=>r.update());
  let deferred;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;$('installBtn').hidden=false;});
  $('installBtn').addEventListener('click',async()=>{if(deferred){deferred.prompt();deferred=null;$('installBtn').hidden=true;}});
}
init().catch(err=>{console.error(err);$('flow').innerHTML='<div class="empty-state">Не удалось загрузить базу данных.</div>';});

/* Trust Scan: an honest, local pre-purchase audit. */
const AUDIT_ITEMS=[
  ['parts','История деталей без предупреждений','Нет «Неизвестной детали» для дисплея, батареи или камеры',18],
  ['activation','Activation Lock отключён','Продавец вышел из Apple Account, Find My выключен',20],
  ['identity','IMEI и серийный номер совпадают','В системе, на коробке/корпусе и по *#06#',12],
  ['face','Face ID / Touch ID работает','Повторная регистрация и несколько разблокировок',10],
  ['display','Дисплей прошёл тест','True Tone, яркость, сенсор по всей площади, нет выгорания',10],
  ['cameras','Камеры и микрофоны исправны','Все объективы, фокус, видео, вспышка и диктофон',8],
  ['radio','Связь проверена','SIM/eSIM, Wi‑Fi, Bluetooth, GPS и NFC',8],
  ['charge','Заряд и разъём исправны','Кабель, беспроводная зарядка, нет перегрева',7],
  ['body','Корпус без критичных следов ремонта','Ровные зазоры, винты, камеры без пыли',7]
];

function initAudit(){
  const box=$('auditChecks'); if(!box) return;
  box.innerHTML=AUDIT_ITEMS.map(([id,title,hint])=>`<label class="audit-check"><input type="checkbox" value="${id}"><span>${title}<small>${hint}</small></span></label>`).join('');
  $('auditRun').addEventListener('click',runAudit);
  $('auditReset').addEventListener('click',()=>{box.querySelectorAll('input').forEach(x=>x.checked=false);$('auditModel').value='';$('auditBattery').value='';$('auditSerial').value='';localStorage.removeItem('repairlab:audit');renderAuditEmpty();});
  const saved=JSON.parse(localStorage.getItem('repairlab:audit')||'null');
  if(saved){$('auditModel').value=saved.model||'';$('auditBattery').value=saved.battery||'';$('auditSerial').value=saved.serial||'';box.querySelectorAll('input').forEach(x=>x.checked=(saved.checked||[]).includes(x.value));runAudit();}
}
function runAudit(){
  const checked=[...$('auditChecks').querySelectorAll('input:checked')].map(x=>x.value);
  const battery=Math.max(0,Math.min(100,Number($('auditBattery').value)||0));
  let score=AUDIT_ITEMS.filter(x=>checked.includes(x[0])).reduce((sum,x)=>sum+x[3],0);
  if(battery){score=Math.round(score*.88+(battery>=90?12:battery>=80?8:battery>=70?4:0));}
  const missing=AUDIT_ITEMS.filter(x=>!checked.includes(x[0])).sort((a,b)=>b[3]-a[3]).slice(0,3);
  const risks=missing.map(x=>x[1]);
  if(battery&&battery<80) risks.unshift(`Аккумулятор ${battery}% — заложите замену в цену`);
  const state=score>=85?'good':score>=60?'warn':'danger';
  const title=score>=85?'Высокий уровень доверия':score>=60?'Нужна дополнительная проверка':'Покупка с повышенным риском';
  const model=$('auditModel').value.trim()||'iPhone';
  $('auditResult').className=`trust-card ${state}`;
  $('auditResult').innerHTML=`<div class="trust-ring" style="--score:${score}"><strong>${score}</strong><span>/ 100</span></div><div><p class="eyebrow">TRUST INDEX · ${escapeText(model)}</p><h3>${title}</h3><p>${checked.length} из ${AUDIT_ITEMS.length} проверок подтверждено.${battery?` Аккумулятор: ${battery}%.`:''}</p>${risks.length?`<div class="risk-list">${risks.map(x=>`<div class="risk-item">${escapeText(x)}</div>`).join('')}</div>`:'<p>Критичных пробелов в чек-листе не осталось.</p>'}</div>`;
  localStorage.setItem('repairlab:audit',JSON.stringify({model:$('auditModel').value,battery:$('auditBattery').value,serial:$('auditSerial').value,checked}));
}
function renderAuditEmpty(){$('auditResult').className='trust-card';$('auditResult').innerHTML='<div class="trust-ring" style="--score:0"><strong>—</strong><span>/ 100</span></div><div><p class="eyebrow">TRUST INDEX</p><h3>Пройдите чек-лист</h3><p>RepairLab соберёт риски и подскажет, что перепроверить до оплаты.</p></div>';}
function escapeText(value){const el=document.createElement('span');el.textContent=value;return el.innerHTML;}
initAudit();

/* RepairLab Direct: secure localhost bridge for this Mac. */
let bridgeConfig=null, bridgeTimer=null, dfuTimer=null, detectedDevice=null;
function initBridge(){
  if(!$('bridge')) return;
  const raw=location.hash.slice(1), params=new URLSearchParams(raw);
  if(params.get('bridge')&&params.get('token')){
    bridgeConfig={url:`http://127.0.0.1:${Number(params.get('bridge'))||18473}`,token:params.get('token')};
    localStorage.setItem('repairlab:bridge',JSON.stringify(bridgeConfig)); history.replaceState(null,'',location.pathname+location.search+'#bridge');
  }else{try{bridgeConfig=JSON.parse(localStorage.getItem('repairlab:bridge')||'null');}catch(e){}}
  $('bridgeRefresh').onclick=refreshBridge;
  $('bridgeIdentify').onclick=identifyIPhone;
  $('openDetectedGuide').onclick=()=>{selectDetectedModel(detectedDevice?.deviceType);$('iphone-center').scrollIntoView({behavior:'smooth'});};
  $('openConfigurator').onclick=()=>bridgePost('/open/configurator');
  $('deviceUpdate').onclick=()=>startBridgeJob('update');
  $('deviceRestore').onclick=restoreDevice;
  $('dfuGuide').onclick=()=>{$('dfuPanel').hidden=false;};
  $('dfuClose').onclick=()=>{$('dfuPanel').hidden=true;clearInterval(dfuTimer);};
  $('dfuStart').onclick=startDfuGuide;
  refreshBridge(); bridgeTimer=setInterval(refreshBridge,3000);
}
async function identifyIPhone(){
  const button=$('bridgeIdentify'), old=button.textContent;button.disabled=true;button.textContent='Считываю данные…';clearInterval(bridgeTimer);
  try{
    const result=await bridgeFetch('/device/details');detectedDevice=result.device;renderDeviceDetails(detectedDevice,false);
    const found=selectDetectedModel(detectedDevice.deviceType);
    $('openDetectedGuide').hidden=!found;$('openDetectedGuide').textContent=found?`Инструкции для ${found} ↓`:'Открыть инструкции по модели ↓';
    $('deviceMode').textContent=found||detectedDevice.name||'iPhone определён';$('deviceName').textContent=`${detectedDevice.deviceType||''} · iOS ${detectedDevice.humanReadableProductVersion||detectedDevice.firmwareVersion||'—'}`;
    $('bridgeHint').textContent='Устройство определено. Ниже показаны фактические данные Apple Configurator. Теперь можно перейти к типовым неисправностям этой модели.';
  }catch(e){showBridgeError(e.message);}finally{button.disabled=false;button.textContent=old;bridgeTimer=setInterval(refreshBridge,3000);}
}
function renderDeviceDetails(d,reveal){
  const labels={deviceType:'Модель устройства',humanReadableProductVersion:'Версия iOS',buildVersion:'Сборка',batteryCurrentCapacity:'Аккумулятор',batteryIsCharging:'Заряжается',totalDiskCapacity:'Объём памяти',freeDiskSpace:'Свободно',activationState:'Активация',bootedState:'Состояние',isPaired:'Доверие Mac',isRestorable:'Можно восстановить',isSupervised:'Supervised',passcodeProtected:'Код-пароль',cloudBackupsAreEnabled:'iCloud Backup',serialNumber:'Серийный номер',IMEI:'IMEI',IMEI2:'IMEI 2',ECID:'ECID',UDID:'UDID',language:'Язык',locale:'Регион'};
  const order=['deviceType','humanReadableProductVersion','buildVersion','batteryCurrentCapacity','batteryIsCharging','totalDiskCapacity','freeDiskSpace','activationState','bootedState','isPaired','isRestorable','isSupervised','passcodeProtected','cloudBackupsAreEnabled','serialNumber','IMEI','IMEI2','ECID','UDID','language','locale'];
  const privateKeys=['serialNumber','IMEI','IMEI2','ECID','UDID'];
  const value=(k,v)=>{if(privateKeys.includes(k)&&!reveal)return maskIdentifier(v);if(k==='batteryCurrentCapacity')return `${v}%`;if(k==='totalDiskCapacity'||k==='freeDiskSpace')return formatStorage(v);if(typeof v==='boolean')return v?'Да':'Нет';return String(v);};
  const box=$('deviceDetails');box.hidden=false;box.innerHTML=`<div class="details-head"><strong>Паспорт устройства</strong><span>данные только с этого Mac</span></div><div class="details-grid">${order.filter(k=>d[k]!==undefined&&d[k]!==null).map(k=>`<div><span>${labels[k]||k}</span><strong>${escapeText(value(k,d[k]))}</strong></div>`).join('')}</div><button id="revealDeviceIds" class="ghost">${reveal?'Скрыть идентификаторы':'Показать идентификаторы'}</button>`;
  $('revealDeviceIds').onclick=()=>renderDeviceDetails(d,!reveal);
}
function maskIdentifier(v){const s=String(v);return s.length<8?'••••':`${s.slice(0,4)}••••${s.slice(-4)}`;}
function formatStorage(v){return `${(Number(v)/1e9).toFixed(1)} GB`;}
function selectDetectedModel(productType){
  if(!productType)return null;const frame=$('iphoneFrame'),d=frame?.contentDocument;if(!d)return null;
  const card=[...d.querySelectorAll('.model')].find(x=>x.querySelector('small')?.textContent.includes(productType));if(!card)return null;
  const name=card.querySelector('b')?.textContent||productType;card.click();return name;
}
async function bridgeFetch(path,options={}){
  if(!bridgeConfig) throw new Error('Запустите START-REPAIRLAB.command на Mac');
  const r=await fetch(bridgeConfig.url+path,{...options,headers:{'Content-Type':'application/json','X-RepairLab-Token':bridgeConfig.token,...options.headers}});
  const data=await r.json(); if(!r.ok) throw new Error(data.error||`Bridge ${r.status}`); return data;
}
async function bridgePost(path,body={}){try{return await bridgeFetch(path,{method:'POST',body:JSON.stringify(body)});}catch(e){showBridgeError(e.message);}}
async function refreshBridge(){
  try{
    const s=await bridgeFetch('/status');
    $('bridge').classList.add('online');$('bridge').classList.remove('error');$('bridgeBadge').textContent='Bridge подключён';
    const device=s.devices?.[0]||{}, mode=s.mode||'disconnected';
    if($('usbTelemetry'))$('usbTelemetry').textContent=mode==='disconnected'?'WAIT':mode.toUpperCase();
    const labels={normal:'iPhone подключён',recovery:'Recovery Mode',dfu:'DFU Mode',disconnected:'iPhone не найден'};
    $('deviceMode').textContent=labels[mode]||mode;$('deviceName').textContent=device.model||device.deviceType||device.deviceName||device.name||device.ECID||(mode==='disconnected'?'Подключите кабель и разблокируйте iPhone':'Устройство обнаружено');
    $('devicePulse').parentElement.classList.toggle('connected',mode!=='disconnected');
    $('bridgeHint').textContent=mode==='dfu'?'DFU распознан. Теперь доступно восстановление через Apple Configurator.':mode==='recovery'?'Recovery распознан. Можно выполнить Update или Restore.':mode==='normal'?'Соединение установлено. Для действий подтвердите доверие на iPhone.':'Bridge работает — ожидаю iPhone по USB.';
  }catch(e){showBridgeError(e.message,false);}
}
function showBridgeError(message,hard=true){$('bridge').classList.remove('online');if(hard)$('bridge').classList.add('error');$('bridgeBadge').className='badge neutral';$('bridgeBadge').textContent='Bridge не подключён';$('deviceMode').textContent='Нет соединения';$('deviceName').textContent=message;if($('usbTelemetry'))$('usbTelemetry').textContent='WAIT';}
async function startBridgeJob(action,confirmation){
  const result=await bridgePost(`/action/${action}`,confirmation?{confirmation}:{});if(!result?.job)return;
  $('bridgeProgress').hidden=false;$('bridgeProgress').querySelector('p').textContent=action==='update'?'Apple Configurator обновляет iPhone. Не отключайте кабель.':'Выполняется полное восстановление. Не отключайте кабель.';
  const watch=setInterval(async()=>{try{const job=await bridgeFetch(`/job/${result.job}`);if(job.state!=='running'){clearInterval(watch);$('bridgeProgress').hidden=true;alert(job.state==='done'?'Операция завершена успешно.':`Ошибка операции: ${job.output||'неизвестная ошибка'}`);refreshBridge();}}catch(e){clearInterval(watch);$('bridgeProgress').hidden=true;showBridgeError(e.message);}},1800);
}
function restoreDevice(){
  const phrase=prompt('RESTORE ПОЛНОСТЬЮ СТИРАЕТ IPHONE.\n\nЕсли резервная копия создана и вы хотите продолжить, введите: СТЕРЕТЬ IPHONE');
  if(phrase==='СТЕРЕТЬ IPHONE')startBridgeJob('restore',phrase);else if(phrase!==null)alert('Фраза не совпала. Restore отменён.');
}
function startDfuGuide(){
  clearInterval(dfuTimer);let family=$('dfuFamily').value;
  const sequence=family==='modern'?[['Быстро нажмите Volume Up',1],['Быстро нажмите Volume Down',1],['Удерживайте Side до выключения экрана',10],['Держите Side + Volume Down',5],['Отпустите Side, держите Volume Down',10]]:family==='seven'?[['Удерживайте Side + Volume Down',8],['Отпустите Side, держите Volume Down',10]]:[['Удерживайте Home + Side',8],['Отпустите Side, держите Home',10]];
  let step=0,left=sequence[0][1];$('dfuTitle').textContent='Выполняйте команды точно по таймеру';
  const draw=()=>{$('dfuSeconds').textContent=left;$('dfuInstruction').textContent=sequence[step][0];};draw();
  dfuTimer=setInterval(()=>{left--;if(left<=0){step++;if(step>=sequence.length){clearInterval(dfuTimer);$('dfuSeconds').textContent='✓';$('dfuInstruction').textContent='Проверяю DFU… экран iPhone должен оставаться чёрным';setTimeout(refreshBridge,700);return;}left=sequence[step][1];}draw();},1000);
}
initBridge();

function initMotion(){
  if(!('IntersectionObserver' in window)||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const items=[...document.querySelectorAll('main>.panel,main>.iphone-shell,main>.grid,main>.warning,.section-separator')];
  items.forEach(x=>x.classList.add('reveal-ready'));
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('revealed');observer.unobserve(e.target);}}),{threshold:.08,rootMargin:'0px 0px -40px'});
  items.forEach(x=>observer.observe(x));
}
initMotion();
function initTelemetry(){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('[data-counter]').forEach(el=>{
    const target=Number(el.dataset.counter);if(reduced){el.textContent=`${target}%`;return;}
    const started=performance.now(),duration=1500;
    const tick=now=>{const p=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-p,3);el.textContent=`${Math.round(target*eased)}%`;if(p<1)requestAnimationFrame(tick);};requestAnimationFrame(tick);
  });
  if(!reduced&&$('hudPercent')){let n=98,up=true;setInterval(()=>{n+=up?1:-1;if(n>=99||n<=96)up=!up;$('hudPercent').textContent=`${n}%`;},1100);}
}
initTelemetry();
