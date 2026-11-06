const C='nailclub-v1';
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./manifest.webmanifest','./icon.svg'])));self.skipWaiting()});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match('./'))))});
self.addEventListener('push',e=>{const d=e.data?e.data.json():{title:'Nail Club',body:'Tienes un aviso nuevo'};e.waitUntil(self.registration.showNotification(d.title,{body:d.body,icon:'icon.svg'}))});
