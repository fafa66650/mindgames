
const CACHE='fafa-mindgame-v5';
const ASSETS=['./','./index.html','./style.css','./app.js','./data.js','./scenarios.json','./codes.json','./packs.json','./manifest.json','./icons/icon-192.png','./icons/icon-512.png','./assets/logo-fafatraining.jpeg'];
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); });
self.addEventListener('activate', e => e.waitUntil(clients.claim()));
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy)); return res;
  }).catch(()=>caches.match('./index.html'))));
});
