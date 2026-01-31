// Service Worker for PWA functionality
const CACHE_NAME = 'admin-portal-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/admin-style.css',
  '/dashboard.css',
  '/firebase-config.js',
  '/auth.js',
  '/navigation.js',
  '/dashboard.js',
  '/orders.js',
  '/menu.js',
  '/notification.js',
  '/notification-sw.js',
  'https://img.icons8.com/color/192/000000/bakery--v1.png',
  'https://img.icons8.com/color/512/000000/bakery--v1.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('PWA Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('PWA Service Worker installed');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Error installing PWA:', error);
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('PWA Service Worker activating...');
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

// Fetch requests
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        return fetch(event.request);
      })
  );
});

// Handle push notifications
self.addEventListener('push', event => {
  console.log('PWA Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    
    if (data.type === 'new_order') {
      showOrderNotification(data.orderData);
      playNotificationSound();
    }
  }
});

// Show order notification
function showOrderNotification(orderData) {
  const customerName = orderData.userName || 'Customer';
  const orderTotal = orderData.totalPrice || '0';
  const orderId = orderData.orderId || orderData.id || 'Unknown';
  
  self.registration.showNotification("🍕 New Order Received!", {
    body: `${customerName} placed an order of ₹${orderTotal} (Order #${orderId})`,
    icon: "https://img.icons8.com/color/96/000000/bakery--v1.png",
    badge: "https://img.icons8.com/color/48/000000/bakery--v1.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: "new-order",
    data: {
      orderId: orderId,
      customerName: customerName,
      total: orderTotal,
      url: '/'
    }
  });
}

// Play notification sound
function playNotificationSound() {
  try {
    // Create audio context for sound
    const audioContext = new (self.AudioContext || self.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create bell sound
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    console.log('PWA notification sound played');
  } catch (error) {
    console.error('Error playing PWA sound:', error);
  }
}

// Handle notification click
self.addEventListener('notificationclick', event => {
  console.log('PWA notification clicked:', event);
  
  event.notification.close();
  
  // Open or focus the app
  if (clients.openWindow) {
    clients.openWindow(event.notification.data.url || '/').then(windowClient => {
      if (windowClient) {
        windowClient.focus();
      }
    });
  } else if (clients.matchAll) {
    clients.matchAll().then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('admin')) {
          client.focus();
          return;
        }
      }
      // If no admin page is open, open one
      if (clientList.length > 0) {
        clients.openWindow('/');
      }
    });
  }
});

// Background sync for offline functionality
self.addEventListener('sync', event => {
  console.log('PWA background sync:', event);
  
  if (event.tag === 'order-sync') {
    event.waitUntil(syncOrders());
  }
});

// Sync orders when online
function syncOrders() {
  return caches.open(CACHE_NAME)
    .then(cache => {
      return cache.match('/firebase-config.js');
    })
    .then(response => {
      if (response) {
        return response.text();
      }
    })
    .then(firebaseConfig => {
      // Initialize Firebase and sync orders
      eval(firebaseConfig);
      
      return db.collection('orders').get();
    })
    .then(snapshot => {
      console.log('PWA synced orders:', snapshot.size);
      return snapshot.size;
    })
    .catch(error => {
      console.error('PWA sync error:', error);
    });
}
