// 📴 guarda una copia de la app en el móvil para poder abrirla sin conexión
const CACHE = "insistentes-v3";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"]);
      // 📦 también el código de la app: los archivos que enlaza index.html
      try {
        const html = await (await fetch("/index.html", { cache: "no-store" })).text();
        const archivos = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map((m) => m[1]);
        await cache.addAll(archivos);

        // 🖼️ y todas las imágenes que usa el código (Explorador, iconos, ilustraciones…)
        const imagenes = new Set();
        for (const archivo of archivos.filter((a) => a.endsWith(".js"))) {
          const respuesta = await cache.match(archivo);
          if (!respuesta) continue;
          const codigo = await respuesta.text();
          for (const m of codigo.matchAll(/\/assets\/[^"'`\s)]+\.(?:png|jpe?g|webp|svg|gif)/g)) {
            imagenes.add(m[0]);
          }
        }
        for (const img of imagenes) {
          try {
            await cache.add(img);
          } catch (err) {
            // si alguna falla, se guardará al verla
          }
        }
      } catch (err) {
        // si falla, se irán guardando al usarlos
      }
    })()
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