/* Service worker — Le Fiqh — Hajj, Commerce et Famille
   Mise à jour : remplace index.html sur GitHub puis augmente le numéro
   de version ci-dessous (fiqh-hajj-v4 → fiqh-hajj-v5…). */
const PREFIX = 'fiqh-hajj-';
const CACHE = PREFIX + 'v4';
const ASSETS = ['./', './index.html', './fonts.css', './manifest.webmanifest',
  './apple-touch-icon.png', './icon-192.png', './icon-512.png', './icon-1024.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

/* Ne supprime que les anciens caches de CETTE appli
   (toutes tes applis partagent le même domaine github.io). */
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // Page : réseau d'abord (mises à jour automatiques), cache si hors ligne / réseau lent
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const net = fetch(req).then(res => { if (res && res.ok) cache.put('./index.html', res.clone()); return res; });
      try { const res = await Promise.race([net, new Promise(r => setTimeout(r, 3500))]); if (res) return res; } catch (err) {}
      return (await cache.match('./index.html')) || net;
    })());
    return;
  }
  // Autres fichiers : cache d'abord
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
