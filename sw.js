// Service Worker for PMU Way PWA
const CACHE_NAME = 'pmu-way-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/global.css',
  '/home.css',
  '/search.css',
  '/profile.css',
  '/admin.css',
  '/map.css',
  '/script.js',
  '/logo.png',
  '/P1.png',
  '/P2.png',
  '/B1.jpg',
  '/manifest.json'
];

// تثبيت الـ Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// جلب الملفات من الكاش أو الإنترنت
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// تحديث الـ Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
