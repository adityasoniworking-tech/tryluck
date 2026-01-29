const CACHE_NAME = 'nutty-bakery-v1.0.5';
const ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/contact.html',
  '/menu.html',
  '/tracking.html',
  '/whatsapp_select.html',
  '/offline.html',
  '/style.css?v=1.0.5',
  '/script.js?v=1.0.5',
  '/layout.js?v=1.0.5',
  '/delivery.js?v=1.0.1',
  '/modal-handler.js?v=1.0.5',
  '/modal-injector.js?v=1.0.5',
  '/bill.js?v=1.0.5',
  '/modals.css?v=1.0.5',
  '/logo.svg',
  '/logo192.png',
  '/favicon.ico',
  '/mihir.jpg',
  '/shrikant.jpg',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Roboto:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Clear old cache on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// App install hone par files cache karein
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(error => {
        console.log('Cache addAll error:', error);
        // Missing files ko skip karke continue karein
        return Promise.resolve();
      });
    })
  );
});

// Always try network first, then cache
self.addEventListener('fetch', (event) => {
  // Skip POST requests and other non-GET methods
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // Skip cache for CSS and JS files with version params
  if (event.request.url.includes('?v=')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  event.respondWith(
    fetch(event.request).then((response) => {
      // Cache successful network responses
      if (response.status === 200) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
      }
      return response;
    }).catch(() => {
      // Try cache if network fails
      return caches.match(event.request).then((response) => {
        if (response) {
          return response;
        }
        
        // For HTML requests, serve offline page
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/offline.html');
        }
        
        // For other requests, return offline response
        return new Response('Offline - Please check your internet connection', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      });
    })
  );
});