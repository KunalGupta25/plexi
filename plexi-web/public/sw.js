self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Keep this handler so the app meets PWA installability checks.
self.addEventListener("fetch", () => {});
