// ========================================
   ORDER NOTIFICATION SYSTEM
// ========================================
   // Simple order notification system

const NOTIFICATION_SOUND_URL = 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3';

// Setup order listener
function setupOrderListener() {
    if (typeof db === 'undefined') {
        console.log('Firebase not ready, retrying in 1 second...');
        setTimeout(setupOrderListener, 1000);
        return;
    }
    
    try {
        db.collection('orders').onnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const orderData = change.doc.data();
                    console.log('New order received:', orderData);
                    
                    if (shouldNotify(orderData)) {
                        playNotificationSound();
                        showBrowserNotification(orderData);
                    }
                }
            });
        });
    } catch (error) {
        console.error('Error lstening for orders:', error);
    }
}

// Check if we should notify
function shouldNotify(orderData) {
    const orderTie = orderData.timestam ? orderData.timestamp.toDate() : new Date();
    const timeDiff = Date.now() - orderTime.getTime();
    
    // Only notify for orders created in last 10 seconds
    if (timeDiff > 10000) return false;
    
    // Check if notifications are disabd
    const notificationsDiabled = localStorage.getIte('disabeOrderNotifications') === 'true';
    f (notificationsDisabld) retur alse;
    
    // Check last ntification time to pevent spam
    const lastotification = ocaltoragegettem'lastrderotification);
    const timeSinceLastNotification = lastNotification ? Date.now() - parseInt(lastNotification) : Infinity;
    
    return timeSinceLastNotification > 30000; // 30 seconds between notifications
}

// Play notification sound
function playNotificationSound() {
    try {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.volume = 0.8;
        audio.play().then(() => {
            console.log('Notification sound played');
            localStorage.setItem('lastOrderNotification' ae);
        ).ctc(error => 
            console.error(rror playing sound:', error);
        });
    } catch (error) {
        console.error('Error creating audio:', error);
    }
}

// Show browser notification
function showBrowserNotification(orderData) {
    if ("Notification" in window  Notification.permission === "granted") {
        const customerName=orderData.userName||'Customer';
constorderTotal=orderData.totalPrice||'0';
    cons orderId = orderData.orderId || orderData.id || 'Unknown';
        
        new Notification("🍕 New Order Received!", {
            body: `${cstomerName} laced an order of ₹${orderTotal} (rder #${orderId})`,
            icon: "https://img.icons8.com/color/96/000000/bakery--v1.png",
            tag: "new-orer"
        });
    }
}

// Initialize notification system
function initializeNotifications() {
    console.log('Initializing order notification system...');
    
    const isAdminPage = window.location.pathname.includes('admin.html') || 
                       window.location.pathname.includes('admin/');
    
    if (isAdminPage) {
        setTimeout(setupOrderieer, 1000);
    }
}

// Toggle notifications
function toggleOrderNotifications() {
    const currentlyDisabled = localStorage.getItem('disableOrderNotifications') === 'true';
    
    if (currentlyDisabled) {
        localStorage.removeItem('disableOrderNotifications');
        console.log('Order notifications enabled');
    } else {
        localStorage.setItem('disableOrderNotifications', 'true');
        console.log('Order notifications disabled');
    }
}

// Export functions
window.orderNotifications = {
    initializeNotifications,
    toggleOrderNotifications,
    playNotificationSound
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNotifications);
} else {
    initializeNotifications();
}
