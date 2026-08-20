(()=>{
const $=id=>document.getElementById(id);
const TOOL_INFO={
 palera1n:{name:'palera1n',url:'https://palera.in/',note:'Для A8–A11 на iOS 15+; semi-tethered. На A11 действуют ограничения по passcode в jailbroken-состоянии.'},
 dopamine:{name:'Dopamine',url:'https://ios.cfw.guide/installing-dopamine/',note:'Semi-untethered. Поддержка зависит одновременно от чипа и версии iOS; перед установкой обязательно сверять точную комбинацию.'}
};
function parseMajor(v){const m=String(v||'').match(/^(\d+)/);return m?Number(m[1]):null}
function chipClass(product){
 const p=String(product||'');
 if(/^iPhone(6|7|8|9|10),/.test(p)) return 'checkm8';
 if(/^iPhone(11|12),/.test(p)) return 'a12a13';
 if(/^iPhone(13|14|15|16|17|18),/.test(p)) return 'newer';
 return 'legacy';
}
function recommend(product,ios){
 const major=parseMajor(ios), cls=chipClass(product), out=[];
 if(cls==='checkm8' && major!==null && major>=15) out.push(TOOL_INFO.palera1n);
 if(major!==null){
   if(major>=15 && major<=17) out.push(TOOL_INFO.dopamine);
   else if((major===18||major===26) && /^(iPhone11|iPhone12),/.test(product)) out.push(TOOL_INFO.dopamine);
 }
 return out;
}
function install(){
 const fw=document.getElementById('firmwareCenter');
 if(!fw||document.getElementById('jailbreakCenter')) return;
 const s=document.createElement('section');
 s.id='jailbreakCenter'; s.className='panel'; s.style.cssText='padding:20px;margin:0 0 18px;display:none';
 s.innerHTML=`<div class="section-head"><div><p class="eyebrow">IPHONE JAILBREAK & CUSTOMIZE</p><h2>Jailbreak и оформление</h2></div><span class="badge neutral">по совместимости</span></div>
 <p class="muted" style="line-height:1.55">Выберите iPhone и точный ProductType в Firmware Center. Затем укажите установленную версию iOS. RepairLab покажет только подходящие варианты или честно сообщит, что для этой комбинации поддерживаемого jailbreak нет.</p>
 <div style="display:grid;grid-template-columns:220px 1fr auto;gap:10px;align-items:end" class="jb-grid"><div class="field"><label>Версия iOS</label><input id="jbIos" placeholder="например 16.7.12"></div><div class="field"><label>ProductType</label><input id="jbProduct" readonly placeholder="выберите вариант в Firmware Center"></div><button id="jbCheck" class="primary" style="height:44px">Проверить jailbreak</button></div>
 <div id="jbResult" class="result muted" style="margin-top:12px">Сначала выберите iPhone и аппаратный вариант выше.</div>
 <div style="margin-top:14px;display:grid;grid-template-columns:repeat(3,1fr);gap:10px" class="jb-cards"><div class="doc"><b>Темы и иконки</b><span>После jailbreak: SnowBoard/совместимый theming-движок, пакеты иконок, док, виджеты. Проверяйте совместимость твика с вашей iOS.</span></div><div class="doc"><b>Минималистичный iPhone</b><span>Тёмные иконки, чистый lock screen, минимальный Control Center, монохромные виджеты.</span></div><div class="doc"><b>Retro / Neon</b><span>Кастомные иконки, ретро-плеер, неоновый lock screen, динамические обои и тематические звуки.</span></div></div>
 <div class="warning" style="margin-top:14px"><strong>Важно.</strong><span>Jailbreak не равен кастомной IPSW. Современные iPhone проверяют подпись Apple, поэтому «красивая модифицированная прошивка» обычно не восстанавливается обычным способом. Безопаснее ставить официальную Signed IPSW, а оформление менять после загрузки через совместимые jailbreak-твики. Не используйте jailbreak для обхода Activation Lock, кода-пароля или доступа к чужим данным.</span></div>`;
 fw.insertAdjacentElement('afterend',s);
 const st=document.createElement('style');st.textContent='@media(max-width:850px){.jb-grid,.jb-cards{grid-template-columns:1fr!important}}';document.head.appendChild(st);
 $('jbCheck').addEventListener('click',check);
 const dev=$('fwDevice'); if(dev) dev.addEventListener('change',sync);
 const modelSel=$('model'); if(modelSel) modelSel.addEventListener('change',()=>setTimeout(show,0));
 show(); sync();
}
function show(){const box=$('jailbreakCenter');if(!box)return;const fw=$('firmwareCenter');box.style.display=fw&&fw.style.display!=='none'?'block':'none'}
function sync(){const p=$('fwDevice');const out=$('jbProduct');if(out)out.value=p?.value||'';show()}
function check(){
 const product=$('jbProduct').value.trim(), ios=$('jbIos').value.trim();
 if(!product||!ios){$('jbResult').textContent='Укажите ProductType и версию iOS.';return}
 const list=recommend(product,ios);
 if(!list.length){$('jbResult').innerHTML=`Для <b>${product}</b> на <b>iOS ${ios}</b> в этой базе сейчас нет подтверждённого совместимого jailbreak. Не устанавливайте случайные «one-click jailbreak» сайты и профили.`;return}
 $('jbResult').innerHTML=list.map(t=>`<div class="doc" style="margin-bottom:8px"><b>${t.name}</b><span>${t.note}</span><div style="margin-top:8px"><a class="ghost" style="display:inline-flex;align-items:center;text-decoration:none" href="${t.url}" target="_blank" rel="noopener">Официальная инструкция</a></div></div>`).join('');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(install,0));else setTimeout(install,0);
})();
