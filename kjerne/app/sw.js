/* Plattformkjernen service worker — appskallet virker offline og åpner
   umiddelbart. Cache-navnet bumpes SAMTIDIG med VERSJON i js/app.js og
   versjon.json — de tre må aldri drifte. */
const CACHE = 'kjerne-v0.3.0';
const FILER = ['./', './index.html', './stil.css', './manifest.webmanifest', './ikon.svg',
  './js/api.js', './js/app.js',
  './js/moduler/hjem.js', './js/moduler/timer.js', './js/moduler/dagbok.js',
  './js/moduler/varsler.js', './js/moduler/skriv.js', './js/moduler/innspill.js',
  './js/moduler/sentral.js', './js/moduler/innflytting.js',
  './js/moduler/tillegg.js', './js/moduler/frister.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILER)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // API (inkl. SSE) og versjonsfiler: alltid nett — aldri cache
  if (url.pathname.startsWith('/api/') || /versjon\.json$/.test(url.pathname)) return;
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((treff) =>
      treff ||
      fetch(e.request).then((svar) => {
        if (svar.ok) {
          const kopi = svar.clone();
          caches.open(CACHE).then((c) => c.put(e.request, kopi));
        }
        return svar;
      }).catch(() => (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined))
    )
  );
});
