/**
 * Service Worker for Text Image Generator PWA
 * Provides offline functionality and caching
 */

const CACHE_NAME = 'textgen-v1.0.0';
const STATIC_CACHE = 'textgen-static-v1.0.0';
const FONT_CACHE = 'textgen-fonts-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
    './',
    './index.html',
    './assets/css/styles.css',
    './assets/js/main.js',
    './manifest.json'
];

// Font directories to cache on demand
const FONT_DIRECTORIES = [];
for (let i = 1; i <= 30; i++) {
    const dir = i === 1 ? './alphabet/' : `./alphabet${i}/`;
    FONT_DIRECTORIES.push(dir);
}

/**
 * Install event - cache static files
 */
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(STATIC_CACHE).then(cache => {
                console.log('Caching static files');
                return cache.addAll(STATIC_FILES);
            }),
            
            // Cache some common font characters
            caches.open(FONT_CACHE).then(cache => {
                console.log('Pre-caching common font characters');
                const commonChars = 'abcdefghijklmnopqrstuvwxyz';
                const fontPromises = [];
                
                // Cache first 3 fonts with common characters
                for (let fontNum = 1; fontNum <= 3; fontNum++) {
                    const fontDir = fontNum === 1 ? './alphabet/' : `./alphabet${fontNum}/`;
                    for (const char of commonChars) {
                        fontPromises.push(
                            cache.add(`${fontDir}${char}.png`).catch(() => {
                                // Ignore errors for missing characters
                                console.log(`Skipped ${fontDir}${char}.png`);
                            })
                        );
                    }
                }
                
                return Promise.allSettled(fontPromises);
            })
        ]).then(() => {
            console.log('Service Worker installed successfully');
            // Force the waiting service worker to become the active service worker
            return self.skipWaiting();
        })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== STATIC_CACHE && 
                            cacheName !== FONT_CACHE && 
                            cacheName !== CACHE_NAME) {
                            console.log('Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            
            // Take control of all clients
            self.clients.claim()
        ]).then(() => {
            console.log('Service Worker activated successfully');
        })
    );
});

/**
 * Fetch event - serve from cache or network
 */
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Handle different types of requests
    if (url.pathname.endsWith('.png') && url.pathname.includes('alphabet')) {
        // Font image requests - cache first strategy
        event.respondWith(handleFontRequest(event.request));
    } else if (STATIC_FILES.some(file => url.pathname.endsWith(file.replace('./', '')))) {
        // Static file requests - cache first strategy
        event.respondWith(handleStaticRequest(event.request));
    } else if (url.pathname === '/' || url.pathname.endsWith('.html')) {
        // HTML requests - network first strategy
        event.respondWith(handleHtmlRequest(event.request));
    } else {
        // Other requests - network first strategy
        event.respondWith(handleNetworkFirst(event.request));
    }
});

/**
 * Handle font image requests with cache-first strategy
 */
async function handleFontRequest(request) {
    try {
        // Try cache first
        const cache = await caches.open(FONT_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If not in cache, fetch from network and cache
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Clone the response before caching
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
        
    } catch (error) {
        console.log('Font request failed:', request.url, error);
        
        // Return a fallback response or empty image
        return new Response(
            '<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" fill="#ccc"/><text x="16" y="20" text-anchor="middle" fill="#666">?</text></svg>',
            {
                headers: {
                    'Content-Type': 'image/svg+xml',
                    'Cache-Control': 'max-age=86400'
                }
            }
        );
    }
}

/**
 * Handle static file requests with cache-first strategy
 */
async function handleStaticRequest(request) {
    try {
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // If not in cache, fetch from network
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
        
    } catch (error) {
        console.log('Static request failed:', request.url, error);
        
        // Return cached version if available, otherwise throw
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Handle HTML requests with network-first strategy
 */
async function handleHtmlRequest(request) {
    try {
        // Try network first for HTML to get latest content
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache the response
            const cache = await caches.open(STATIC_CACHE);
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
        
    } catch (error) {
        console.log('HTML request failed, trying cache:', request.url);
        
        // Fall back to cache
        const cache = await caches.open(STATIC_CACHE);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page if available
        return caches.match('./offline.html') || new Response(
            '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
        );
    }
}

/**
 * Handle other requests with network-first strategy
 */
async function handleNetworkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(CACHE_NAME);
            const responseClone = networkResponse.clone();
            await cache.put(request, responseClone);
            return networkResponse;
        }
        
        throw new Error('Network response not ok');
        
    } catch (error) {
        console.log('Network request failed, trying cache:', request.url);
        
        // Fall back to cache
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        throw error;
    }
}

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', event => {
    if (event.data && event.data.type) {
        switch (event.data.type) {
            case 'SKIP_WAITING':
                self.skipWaiting();
                break;
                
            case 'CACHE_FONT':
                if (event.data.fontPath) {
                    cacheFont(event.data.fontPath);
                }
                break;
                
            case 'CLEAR_CACHE':
                clearCaches();
                break;
                
            case 'GET_CACHE_STATUS':
                getCacheStatus().then(status => {
                    event.ports[0].postMessage(status);
                });
                break;
        }
    }
});

/**
 * Cache a specific font directory
 */
async function cacheFont(fontPath) {
    try {
        const cache = await caches.open(FONT_CACHE);
        const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        
        const promises = Array.from(characters).map(char => {
            return cache.add(`${fontPath}${char}.png`).catch(() => {
                console.log(`Character ${char} not found in ${fontPath}`);
            });
        });
        
        await Promise.allSettled(promises);
        console.log(`Font ${fontPath} cached successfully`);
        
    } catch (error) {
        console.error('Error caching font:', fontPath, error);
    }
}

/**
 * Clear all caches
 */
async function clearCaches() {
    try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('All caches cleared');
    } catch (error) {
        console.error('Error clearing caches:', error);
    }
}

/**
 * Get cache status information
 */
async function getCacheStatus() {
    try {
        const cacheNames = await caches.keys();
        const status = {};
        
        for (const name of cacheNames) {
            const cache = await caches.open(name);
            const keys = await cache.keys();
            status[name] = keys.length;
        }
        
        return {
            caches: status,
            totalCaches: cacheNames.length,
            isOnline: navigator.onLine
        };
        
    } catch (error) {
        console.error('Error getting cache status:', error);
        return { error: error.message };
    }
}

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', event => {
    if (event.tag === 'background-download') {
        event.waitUntil(handleBackgroundDownload());
    }
});

/**
 * Handle background download requests
 */
async function handleBackgroundDownload() {
    try {
        // Handle any queued download requests when back online
        console.log('Processing background downloads');
        
        // This would typically involve reading from IndexedDB
        // and processing queued requests
        
    } catch (error) {
        console.error('Background download error:', error);
    }
}

/**
 * Handle push notifications (future feature)
 */
self.addEventListener('push', event => {
    if (event.data) {
        const data = event.data.json();
        
        const options = {
            body: data.body || 'New update available!',
            icon: './icon-192.png',
            badge: './icon-72.png',
            tag: 'textgen-notification',
            data: data.url || './',
            actions: [
                {
                    action: 'open',
                    title: 'Open App'
                },
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ]
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title || 'Text Generator', options)
        );
    }
});

/**
 * Handle notification clicks
 */
self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open' || !event.action) {
        event.waitUntil(
            clients.openWindow(event.notification.data || './')
        );
    }
});

console.log('Service Worker script loaded');