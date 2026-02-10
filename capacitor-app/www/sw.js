const CACHE_NAME = 'sibim-v2.1.0';
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
    '/pages/management.html',
    '/pages/qr-repository.html',
    '/assets/images/logo_municipio.png',
    '/assets/images/logo_ofs.png',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return Promise.allSettled(
                ASSETS.map(url => cache.add(url).catch(err => console.warn(`SW: Failed to cache ${url}`, err)))
            );
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('SW: Deleting old cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.url.includes('google.com') || event.request.url.includes('googleusercontent.com')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
