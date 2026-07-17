/* Lærling service worker — appen virker offline og åpner umiddelbart */
const CACHE = "laerling-v12";
const FILER = ["./", "./index.html", "./rapport.html", "./bli-med.html", "./admin.html",
  "./ansatte.html", "./ledelsen.html",
  "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILER)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // versjon.json og changelog.json må alltid være ferske
  const sti = new URL(e.request.url).pathname;
  if (sti.endsWith("/versjon.json") || sti.endsWith("/changelog.json") || sti.endsWith("/panelsvar.json")) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request, { ignoreSearch: true })));
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((treff) =>
      treff ||
      fetch(e.request).then((svar) => {
        const kopi = svar.clone();
        caches.open(CACHE).then((c) => c.put(e.request, kopi));
        return svar;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
