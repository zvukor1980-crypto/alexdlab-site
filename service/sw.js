const CACHE='repairlab-v10-future-hud';
const ASSETS=['./','index.html','iphone.html?v=10','styles.css?v=10','app.js?v=10','jailbreak.js?v=10','assets/repairlab-hero-v1.webp','data/devices.json','manifest.webmanifest'];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)))});
self.addEventListener('activate',e=>{e.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()]))});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  const fresh=url.origin===location.origin&&(req.mode==='navigate'||/\.(?:html|css|js|json|webmanifest)$/.test(url.pathname));
  if(fresh){
    e.respondWith(fetch(req).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(req,copy));return r}).catch(()=>caches.match(req)));
  }else{
    e.respondWith(caches.match(req).then(r=>r||fetch(req)));
  }
});
