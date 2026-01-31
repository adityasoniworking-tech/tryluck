// --- ORDERS MANAGEMENT ---
const orderAlarm = new Audio('alert.mp3'); 
let isInitialLoad = true;
let lastSnapshot = null; // Store snapshot for re-rendering 

function startOrderListener() {
    db.collection("orders").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        lastSnapshot = snapshot;
        
        // Live Notification & Sound Logic
        if (!isInitialLoad) {
            snapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    const newOrder = change.doc.data();
                    if (newOrder.status === "Pending" || newOrder.status === "Payment Awaited") {
                        orderAlarm.play().catch(err => console.log("Sound blocked. Click page once."));
                        if (Notification.permission === "granted") {
                            new Notification("🚨 Naya Order Aaya Hai!", {
                                body: `Customer: ${newOrder.userName || 'Guest'} | Total: ₹${newOrder.totalAmount}`,
                                icon: 'icon.png' 
                            });
                        }
                    }
                }
            });
        }
        isInitialLoad = false;
        
        renderOrders(snapshot);
    });
}

function renderOrders(snapshot) {
    const container = document.getElementById("ordersDisplayArea");
    let totalOrders = 0, pendingOrders = 0, totalRevenue = 0;
    let ordersData = [];

    console.log('renderOrders called with docs:', snapshot.size);

    // Collect stats and data
    if (snapshot.empty) {
        container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:#9ca3af; margin-top:50px; background:white; padding:40px; border-radius:12px;">
            <i class="fa-solid fa-box-open" style="font-size:3rem; margin-bottom:15px; opacity:0.5;"></i><br>No orders received.
        </div>`;
        return;
    }

    snapshot.forEach((doc) => {
        const order = doc.data();
        const id = doc.id;
        totalOrders++;
        
        if (order.status === "Pending" || order.status === "Payment Awaited") pendingOrders++;
        if (order.status === "Accepted" || order.status === "Ready" || order.status === "Delivered") totalRevenue += (order.totalAmount || 0);
        
        ordersData.push({ id, ...order });
    });

    console.log('Rendering', ordersData.length, 'orders in grid view');

    // Always render grid view (cards)
    renderGridView(ordersData);

    // Update stats
    document.getElementById('statTotal').innerText = totalOrders;
    document.getElementById('statPending').innerText = pendingOrders;
    document.getElementById('statRevenue').innerText = "₹" + totalRevenue.toFixed(2).toLocaleString('en-IN');
    const badge = document.getElementById('pendingCount');
    if (badge) {
        badge.innerText = pendingOrders;
        badge.style.display = pendingOrders > 0 ? 'inline-block' : 'none';
    }
}

function renderGridView(ordersData) {
    const container = document.getElementById("ordersDisplayArea");
    container.innerHTML = `<div id="ordersList" class="orders-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start"></div>`;
    const list = document.getElementById("ordersList");

    ordersData.forEach(order => {
        const paymentTag = order.paymentMethod === 'UPI' 
            ? `<span style="color:#0369a1; font-weight:600;">UPI</span>` 
            : `<span style="color:#059669; font-weight:600;">COD</span>`;

        // Calculate items total and delivery charge
        let itemsTotal = 0;
        if (order.items && Array.isArray(order.items)) {
            itemsTotal = order.items.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);
        }
        const totalAmount = order.totalAmount || 0;
        const deliveryCharge = totalAmount - itemsTotal;
        
        let itemsHtml = order.items.map(i => `
            <div class="item-line">
                <span><strong>${i.qty}x</strong> ${i.name}</span>
                <span>₹${(i.price * i.qty).toFixed(2)}</span>
            </div>`).join('');
        
        // Add delivery charge to items display
        if (deliveryCharge > 0) {
            itemsHtml += `
                <div class="item-line" style="color: #059669; font-weight: 600; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 8px;">
                    <span><i class="fa-solid fa-truck"></i> Delivery Charge</span>
                    <span>₹${deliveryCharge.toFixed(2)}</span>
                </div>`;
        }

        let timeAgo = order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleString('en-IN') : "Just now";
        
        let buttonsHtml;
        const needsAction = order.status === 'Pending' || order.status === 'Payment Awaited';
        const isAccepted = order.status === 'Accepted';
        const isReady = order.status === 'Ready';

        // Always add View Map button
        let mapButton = `<button class="btn btn-map" onclick="showAdminMap('${order.id}', '${order.userAddress || order.address || ''}', '${order.userName || 'Customer'}')">
            <i class="fa-solid fa-map-location-dot"></i> View Map
        </button>`;

        if (needsAction) {
            buttonsHtml = `
                <button class="btn btn-accept" onclick="updateStatus('${order.id}', 'Accepted')"><i class="fa-solid fa-check"></i> Accept</button>
                <button class="btn btn-reject" onclick="updateStatus('${order.id}', 'Rejected')"><i class="fa-solid fa-xmark"></i> Reject</button>
                ${mapButton}
            `;
        } else if (isAccepted) {
            buttonsHtml = `
                <button class="btn" style="background:#f59e0b; color:white;" onclick="updateStatus('${order.id}', 'Ready')">
                    <i class="fa-solid fa-cookie-bite"></i> Mark Ready
                </button>
                ${mapButton}
            `;
        } else if (isReady) {
            buttonsHtml = `
                <button class="btn" style="background:#10b981; color:white;" onclick="updateStatus('${order.id}', 'Delivered')">
                    <i class="fa-solid fa-truck"></i> Delivered
                </button>
                ${mapButton}
            `;
        } else {
            buttonsHtml = `
                ${mapButton}
                <button class="btn btn-delete" onclick="deleteOrder('${order.id}')"><i class="fa-solid fa-trash"></i> Archive</button>
            `;
        }

        list.innerHTML += `
            <div class="order-card">
                <div class="card-top">
                    <div><div class="order-id">#${order.id.toUpperCase()}</div><div class="order-time">${timeAgo}</div></div>
                    <span class="status-pill status-${order.status.replace(/\s/g, '\\ ')}">${order.status}</span>
                </div>
                <div class="card-body">
                    <div class="user-info"><div class="u-icon"><i class="fa-solid fa-user"></i></div>
                    <div><div class="user-name">${order.userName || 'Guest'}</div><div class="user-phone">${order.phone}</div></div></div>
                    <div style="font-size:0.85rem; color:#6b7280; margin-bottom:12px;"><i class="fa-solid fa-location-dot"></i> ${order.address}</div>
                    <div class="order-items">${itemsHtml}</div>
                    <div class="price-tag">₹${order.totalAmount.toFixed(2)} <span style="font-size:0.7em; font-weight:600; color:#6b7280;">(${paymentTag})</span></div>
                </div>
                <div class="card-actions">${buttonsHtml}</div>
            </div>`;
    });
    
    // Re-apply search filter if there's a search term
    const searchInput = document.getElementById('orderSearchInput');
    if (searchInput && searchInput.value.trim() !== '') {
        // Use setTimeout to ensure DOM is fully updated
        setTimeout(() => {
            filterOrders();
        }, 0);
    }
}

function updateStatus(docId, status) { 
    let msg = status === "Rejected" ? "Are you sure you want to reject this order?" : `Set status to ${status}?`;
    if (status === "Accepted" || status === "Ready" || status === "Delivered" || confirm(msg)) {
        db.collection("orders").doc(docId).update({ status: status })
        .then(() => {
            console.log(`Order ${docId} status set to ${status}`);
        })
        .catch(error => {
            alert("Error updating status: " + error.message);
        });
    }
}

function deleteOrder(docId) { 
    if(confirm("Are you sure you want to Archive/Delete this order?")) {
        db.collection("orders").doc(docId).delete()
        .then(() => {
            alert("Order archived successfully.");
        })
        .catch(error => {
            alert("Error deleting order: " + error.message);
        });
    }
}

function filterOrders() {
    const input = document.getElementById('orderSearchInput');
    if (!input) {
        return;
    }
    
    const filter = input.value.toLowerCase().trim();
    const listContainer = document.getElementById("ordersList");
    
    if (!listContainer) {
        return;
    }
    
    // Use querySelectorAll for better compatibility
    const orderCards = listContainer.querySelectorAll('.order-card');
    
    if (orderCards.length === 0) {
        return;
    }
    
    // If filter is empty, show all cards
    if (filter === "") {
        orderCards.forEach(card => {
            card.style.setProperty('display', 'flex', 'important');
        });
        return;
    }
    
    // Filter cards based on search term
    orderCards.forEach((card) => {
        try {
            // Get all text content from the card for comprehensive search
            const cardText = card.textContent || card.innerText || "";
            const searchText = cardText.toLowerCase();
            
            // Check if filter matches anywhere in the card text
            const matches = searchText.includes(filter);
            
            if (matches) {
                card.style.setProperty('display', 'flex', 'important');
            } else {
                card.style.setProperty('display', 'none', 'important');
            }
        } catch (error) {
            console.error('Error processing card:', error);
            card.style.setProperty('display', 'flex', 'important'); // Show card if there's an error
        }
    });
}

async function deleteAllOrders() {
    const confirm1 = confirm("⚠️ KYA AAP SURE HAIN? Sabhi orders hamesha ke liye delete ho jayenge!");
    if (!confirm1) return;

    const confirm2 = prompt("Data delete karne ke liye 'DELETE' likhein:");
    if (confirm2 !== "DELETE") {
        alert("Action cancelled. Spelling galat thi.");
        return;
    }

    try {
        const snapshot = await db.collection("orders").get();
        if (snapshot.empty) {
            alert("Delete karne ke liye koi orders nahi hain.");
            return;
        }

        const batch = db.batch();
        snapshot.forEach((doc) => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        alert("✅ Sabhi orders delete kar diye gaye hain.");
    } catch (error) {
        console.error("Error deleting all orders:", error);
        alert("Error: " + error.message);
    }
}

// Simple admin map function
function showAdminMap(orderId, address, customerName) {
    console.log('🗺️ Showing map for order:', orderId, address, customerName);
    
    // Get order data to extract coordinates
    db.collection("orders").doc(orderId).get().then(doc => {
        if (!doc.exists) {
            console.error('Order not found:', orderId);
            return;
        }
        
        const order = doc.data();
        const lat = order.lat || null;
        const lng = order.lng || null;
        const actualAddress = order.address || address;
        
        // Create modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const mapUrl = lat && lng 
            ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(actualAddress)}`;
        
        const locationInfo = lat && lng 
            ? `<p style="margin: 4px 0 0 0; color: #059669; font-weight: 600;">📍 GPS Coordinates: ${lat}, ${lng}</p>`
            : `<p style="margin: 4px 0 0 0; color: #6b7280;">📍 Address Based Location</p>`;
        
        modal.innerHTML = `
            <div style="background: white; padding: 20px; border-radius: 12px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                    <h3 style="margin: 0; color: #1f2937;">📍 Customer Location</h3>
                    <button onclick="this.closest('div[style*=position]').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">×</button>
                </div>
                <div style="margin-bottom: 16px;">
                    <p style="margin: 0; color: #6b7280; font-weight: 600;">Order ID: #${orderId}</p>
                    <p style="margin: 4px 0 0 0; color: #374151;">Customer: ${customerName}</p>
                    <p style="margin: 4px 0 0 0; color: #1f2937; font-weight: 500;">📍 ${actualAddress}</p>
                    ${locationInfo}
                </div>
                <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; color: #6b7280;">🗺️ Map View</p>
                    <p style="margin: 8px 0 0 0; color: #374151;">${lat && lng ? 'GPS Location Available' : 'Address Based Location'}</p>
                    <div style="margin-top: 16px;">
                        <a href="${mapUrl}" target="_blank" style="background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; display: inline-block;">
                            🗺️ Open in Google Maps
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on background click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }).catch(error => {
        console.error('Error fetching order:', error);
        alert('Error loading location data');
    });
}

// Auto-initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM loaded - starting orders...');
    
    // Auto-start if logged in
    if (document.getElementById('adminLoginOverlay').style.display === 'none') {
        startOrderListener();
    }
});

console.log('🧪 Orders Module Loaded');
