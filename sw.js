/* GJPS Service Worker v2 · network-first per a navegacions */
var CACHE = 'gjps-v2';
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  /* Navegacions: primer xarxa, cau com a reserva */
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (m) { return m || caches.match('./index.html'); });
      })
    );
    return;
  }
  /* Mateix origen (img, css, js): cau amb revalidació */
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then(function (cached) {
        var fetched = fetch(e.request).then(function (res) {
          if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(e.request, copy); }); }
          return res;
        }).catch(function () { return cached; });
        return cached || fetched;
      })
    );
    return;
  }
  /* Creuat (Drive, fonts): no ho toquem */
});