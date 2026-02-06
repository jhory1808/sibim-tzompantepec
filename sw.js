const CACHE_NAME = 'sibim-v1.2.6';
const ASSETS = [
    '/',
    '/home.html',
    '/login.html',
    '/index.html',
    '/css/futuristic.css',
    '/js/config.js',
    '/js/api.js',
    '/js/auth.js',
    '/js/updates-manager.js',
    '/js/app.js',
    '/assets/images/logo_municipio.png',
    '/assets/images/logo_ofs.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Usamos un bucle para que si un archivo falta, no se rompa todo el cache
            return Promise.allSettled(
                ASSETS.map(url => cache.add(url).catch(err => console.warn(`SW: Failed to cache ${url}`, err)))
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    // No interceptar peticiones a la API de Google Scripts para evitar problemas de CORS/Redirección
    if (event.request.url.includes('google.com') || event.request.url.includes('googleusercontent.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
