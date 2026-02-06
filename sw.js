const CACHE_NAME = 'sibim-v1';
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
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
