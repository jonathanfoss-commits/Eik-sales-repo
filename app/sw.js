/* Lærling service worker — appen virker offline og åpner umiddelbart */
const CACHE = "laerling-v19";
const FILER = ["./", "./index.html", "./rapport.html", "./bli-med.html", "./admin.html",
  "./ansatte.html", "./ledelsen.html", "./lab.html",
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
  const url = new URL(e.request.url);
  // rør aldri andre domener eller serverfunksjoner — de skal alltid være ferske,
  // og svarene kan inneholde persondata som ikke skal ligge i cache
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/.netlify/")) return;
  const sti = url.pathname;
  // versjon/changelog/panelsvar: network-first, med cache som offline-reserve
  if (sti.endsWith("/versjon.json") || sti.endsWith("/changelog.json") || sti.endsWith("/panelsvar.json")) {
    e.respondWith(
      fetch(e.request).then((svar) => {
        const kopi = svar.clone();
        caches.open(CACHE).then((c) => c.put(e.request, kopi));
        return svar;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((treff) =>
      treff ||
      fetch(e.request).then((svar) => {
        const kopi = svar.clone();
        caches.open(CACHE).then((c) => c.put(e.request, kopi));
        return svar;
      }).catch(() => (e.request.mode === "navigate" ? caches.match("./index.html") : Response.error()))
    )
  );
});
