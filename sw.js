/* GJPS sw · navegació sempre de la xarxa, recursos amb cache */
var CACHE = 'gjps-v1';

self.addEventListener('install', function () {
  self.skipWaiting();               // el SW nou pren el control de seguida
});

self.addEventListener('activate', function (e) {
  e.waitUntil((async function () {
    var keys = await caches.keys();
    await Promise.all(keys
      .filter(function (k) { return k.indexOf('gjps-') === 0 && k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  /* Navegacions (index.html): XARXA primer; cache només si no hi ha connexió */
  if (req.mode === 'navigate') {
    e.respondWith((async function () {
      try {
        var net = await fetch(req);
        var c = await caches.open(CACHE);
        c.put(req, net.clone());
        return net;
      } catch (err) {
        var c2 = await caches.open(CACHE);
        var hit = await c2.match(req) || await c2.match('./index.html');
        return hit || new Response('Sense connexió', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      }
    })());
    return;
  }

  /* Recursos (img, apps, icones): cache primer i refresc en segon pla */
  e.respondWith((async function () {
    var c = await caches.open(CACHE);
    var hit = await c.match(req);
    var netP = fetch(req).then(function (n) {
      if (n && n.ok) c.put(req, n.clone());
      return n;
    }).catch(function () { return null; });
    if (hit) return hit;
    var net = await netP;
    return net || new Response('', { status: 504 });
  })());
});