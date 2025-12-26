/**
 * Service Worker for Countdown Timer PWA
 * Provides offline support and caching
 */

const CACHE_NAME = 'countdown-timer-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/js/main.js',
    '/js/constants.js',
    '/js/utils.js',
    '/js/storage.js',
    '/js/Timer.js',
    '/js/ui.js',
    '/js/notifications.js',
    '/manifest.json',
    '/icons/icon-72.svg',
    '/icons/icon-96.svg',
    '/icons/icon-128.svg',
    '/icons/icon-144.svg',
    '/icons/icon-152.svg',
    '/icons/icon-192.svg',
    '/icons/icon-384.svg',
    '/icons/icon-512.svg',
    '/favicon.svg'
];

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response and update cache in background
                    event.waitUntil(updateCache(event.request));
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                return fetch(event.request)
                    .then((response) => {
                        // Cache the new response
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(event.request, responseClone));
                        }
                        return response;
                    })
                    .catch(() => {
                        // Offline fallback for HTML pages
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

/**
 * Updates cache in background (stale-while-revalidate)
 * @param {Request} request - The request to update
 */
async function updateCache(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(request, response);
        }
    } catch (error) {
        // Network error, skip update
    }
}

/**
 * Handle push notifications
 */
self.addEventListener('push', (event) => {
    const options = {
        body: event.data?.text() || 'Timer notification',
        icon: '/icons/icon-192.svg',
        badge: '/icons/icon-72.svg',
        vibrate: [200, 100, 200],
        requireInteraction: true
    };

    event.waitUntil(
        self.registration.showNotification('Countdown Timer', options)
    );
});

/**
 * Handle notification click
 */
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Focus existing window if available
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        return client.focus();
                    }
                }
                // Open new window if no existing window
                if (clients.openWindow) {
                    return clients.openWindow('/');
                }
            })
    );
});

/**
 * Handle background sync
 */
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-timers') {
        event.waitUntil(syncTimers());
    }
});

/**
 * Sync timers with server (future feature)
 */
async function syncTimers() {
    // Placeholder for future server sync functionality
    console.log('Background sync triggered');
}

