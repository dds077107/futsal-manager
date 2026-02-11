// Service Worker for Futsal Manager PWA
const CACHE_NAME = 'futsal-manager-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/manifest.json',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap'
];

// 설치 이벤트: 정적 리소스 캐싱
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app resources');
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

// 활성화 이벤트: 오래된 캐시 정리
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch 이벤트: 캐시 우선 전략
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 캐시에 있으면 캐시 반환, 없으면 네트워크 요청
                if (response) {
                    return response;
                }
                return fetch(event.request).then(response => {
                    // 유효한 응답이면 캐시에 저장
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                    return response;
                });
            })
    );
});
