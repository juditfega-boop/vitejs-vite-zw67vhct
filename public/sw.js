// 📴 guarda una copia de la app en el móvil para poder abrirla sin conexión
const CACHE = "insistentes-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"])
    )
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const claves = await caches.keys();
      await Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  const peticion = e.request;
  if (peticion.method !== "GET") return;
  const url = new URL(peticion.url);
  if (url.origin !== self.location.origin) return; // Firebase va por su cuenta

  // la página: primero internet (para tener siempre la última versión), si no, la copia
  if (peticion.mode === "navigate") {
    e.respondWith(
      fetch(peticion)
        .then((resp) => {
          const copia = resp.clone();
          caches.open(CACHE).then((c) => c.put("/index.html", copia));
          return resp;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // código e imágenes: primero la copia, si no, internet (y se guarda)
  e.respondWith(
    caches.match(peticion).then(
      (guardada) =>
        guardada ||
        fetch(peticion).then((resp) => {
          if (resp.ok) {
            const copia = resp.clone();
            caches.open(CACHE).then((c) => c.put(peticion, copia));
          }
          return resp;
        })
    )
  );
});