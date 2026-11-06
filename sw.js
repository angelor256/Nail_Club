const C = 'nailclub-v2';
const CORE = ['./', './index.html', './css/styles.css', './js/main.js', './js/core.js', './js/client.js', './js/admin.js', './manifest.webmanifest', './icon.svg'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(CORE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim())
));
// Red primero (siempre ves la última versión); sin red, usa lo guardado. Solo guarda respuestas correctas.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then((r) => {
    if (r.ok && r.type === 'basic') { const cp = r.clone(); caches.open(C).then((c) => c.put(e.request, cp)); }
    return r;
  }).catch(() => caches.match(e.request).then((m) => m || caches.match('./'))));
});
self.addEventListener('push', (e) => {
  const d = e.data ? e.data.json() : { title: 'Nail Club', body: 'Tienes un aviso nuevo' };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: 'icons/icon-192.png' }));
});
