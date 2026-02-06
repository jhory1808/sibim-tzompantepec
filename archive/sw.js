// sw.js - Service Worker mínimo
self.addEventListener('install', event => {
    console.log('Service Worker de SIBIM instalado');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('Service Worker de SIBIM activado');
});

self.addEventListener('fetch', event => {
    // Pasar todas las solicitudes normalmente
    // Puedes agregar caching aquí si lo necesitas
});