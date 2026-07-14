self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', event => {
    // Basic pass-through fetch handler
    // Required to be recognized as a PWA
    event.respondWith(fetch(event.request).catch(() => new Response('Network error')));
});
