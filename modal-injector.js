document.addEventListener("DOMContentLoaded", () => {
    // 1. Inject Cart Modal
    const cartModal = document.getElementById('cartModal');
    if (cartModal) {
        cartModal.innerHTML = `
        <div class="modal-content" style="display: block; overflow-y: auto; max-height: 90vh; padding: 20px;">
            <div style="position: sticky; top: -20px; background: white; z-index: 100; padding-bottom: 10px; border-bottom: 1px solid #eee; margin-bottom: 15px;">
                <span class="close-btn" onclick="document.getElementById('cartModal').style.display='none'" style="position:absolute; right:0; top:5px; cursor:pointer; font-size:24px;">&times;</span>
                <h2 style="font-family: 'Playfair Display', serif; text-align:center; margin: 10px 0 0 0;">Your Basket</h2>
            </div>
            
            <div id="cartItems"></div>
            
            <div style="margin-top: 20px;">
                <h3 style="text-align:right; color:#6b0f1a; font-size: 1.4rem; margin-bottom: 15px;">
                    Total: ₹<span id="cartTotal">0.00</span>
                </h3>

                <div class="checkout-form">
                    <input id="custName" type="text" placeholder="Enter Your Name" style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;">
                    <input id="custPhone" type="text" placeholder="Phone Number (10 digits)" style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px;">
                    <textarea id="custAddress" placeholder="Full Delivery Address (Enter detailed address for accurate delivery calculation)" style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px; height:80px; resize:none;"></textarea>
                    
                    <button class="order-btn-main" onclick="window.placeOrder('COD')" style="width:100%; background:#6b0f1a; color:white; padding:15px; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">
                        Confirm & Place Order (COD)
                    </button>
                </div>
            </div>
        </div>`;
    }

    // 2. Inject Profile Modal
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.innerHTML = `
        <div class="modal-content" style="display: block; overflow-y: auto; max-height: 90vh; padding: 20px;">
            <div style="position: sticky; top: -20px; background: white; z-index: 100; padding-bottom: 10px; border-bottom: 1px solid #eee; margin-bottom: 15px;">
                <span class="close-btn" onclick="document.getElementById('profileModal').style.display='none'" style="position:absolute; right:0; top:5px; cursor:pointer; font-size:24px;">&times;</span>
                <h2 style="font-family: 'Playfair Display', serif; text-align:center; margin: 10px 0 0 0;">My Orders</h2>
            </div>
            <div id="myOrdersList"></div>
        </div>`;
    }
});

// --- Data Rendering Logic ---
window.openCart = function() {
    const modal = document.getElementById('cartModal');
    const list = document.getElementById('cartItems');
    const totalDisplay = document.getElementById('cartTotal');
    if(!modal || !list) return;
    
    modal.style.display = 'flex';
    list.innerHTML = "";
    let total = 0;
    const cartIds = Object.keys(cart || {});
    
    if(cartIds.length === 0) {
        list.innerHTML = "<p style='text-align:center; color:#999; padding:20px;'>Your basket is empty.</p>";
        if(totalDisplay) totalDisplay.innerText = "0.00";
        return;
    }
    
    cartIds.forEach(id => {
        let item = dbMenuItems.find(i => i.id == id);
        if(item) {
            let itemTotal = item.price * cart[id];
            total += itemTotal;
            // Clean Item Row
            list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:12px; background:#f9f9f9; border-radius:10px; border:1px solid #eee;">
                <div style="flex:1;">
                    <strong style="font-size:0.9rem; display:block;">${item.name}</strong>
                    <small style="color:#666;">₹${item.price} x ${cart[id]}</small>
                </div>
                <div style="display:flex; align-items:center; gap:8px; margin: 0 10px;">
                    <button onclick="window.modifyQty(${item.id}, -1); window.openCart();" style="width:28px; height:28px; border-radius:5px; border:1px solid #ddd; background:white; cursor:pointer;">-</button>
                    <span style="font-weight:bold; min-width:20px; text-align:center;">${cart[id]}</span>
                    <button onclick="window.modifyQty(${item.id}, 1); window.openCart();" style="width:28px; height:28px; border-radius:5px; border:1px solid #ddd; background:white; cursor:pointer;">+</button>
                </div>
                <div style="font-weight:bold; color:#6b0f1a; min-width:70px; text-align:right;">₹${itemTotal.toFixed(2)}</div>
            </div>`;
        }
    });
    if(totalDisplay) totalDisplay.innerText = total.toFixed(2);
};

window.openProfile = function() {
    const modal = document.getElementById('profileModal');
    const list = document.getElementById('myOrdersList');
    if(!modal || !list) return;
    
    modal.style.display = 'flex';
    list.innerHTML = "<p style='text-align:center; padding:20px;'>Loading your orders...</p>";
    
    let savedIds = JSON.parse(localStorage.getItem('my_orders') || "[]");
    if(savedIds.length === 0) {
        list.innerHTML = "<p style='text-align:center; color:#999; padding:20px;'>No orders found.</p>";
        return;
    }
    
    list.innerHTML = "";
    savedIds.slice().reverse().forEach(id => {
        db.collection("orders").doc(id).onSnapshot(doc => {
            if(doc.exists) {
                const order = doc.data();
                const statusColor = order.status === 'Accepted' ? '#059669' : (order.status === 'Rejected' ? '#ef4444' : '#d97706');
                
                // --- Date aur Time Format Logic ---
                let date = 'No date';
                let time = '';
                
                if (order.timestamp) {
                    try {
                        const orderDate = new Date(order.timestamp.seconds * 1000);
                        date = orderDate.toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                        });
                        time = orderDate.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        console.log('Modal-Injector Formatted date:', date);
                        console.log('Modal-Injector Formatted time:', time);
                    } catch (error) {
                        console.error('Modal-Injector Error formatting timestamp:', error);
                        date = 'Invalid date';
                    }
                } else {
                    console.log('Modal-Injector: No timestamp found in order data');
                }

                const html = `
                <div id="order-row-${id}" style="background:#fff; border:1px solid #eee; padding:15px; border-radius:12px; margin-bottom:12px; border-left:5px solid #6b0f1a;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                        <strong style="font-size:0.75rem; color:#6b0f1a; word-break:break-all;">#${id.toUpperCase()}</strong>
                        <div style="text-align:right; background:#f9f9f9; padding:5px 8px; border-radius:5px;">
                            <span style="font-size:0.8rem; color:#333; font-weight:500;">${date}</span>
                            ${time ? `<br><span style="font-size:0.7rem; color:#666; font-weight:400;">${time}</span>` : ''}
                        </div>
                    </div>
                    
                    <div style="font-size:0.85rem; color:#666; margin-bottom:8px;">
                        ${order.items ? (Array.isArray(order.items) ? order.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'Order details unavailable') : 'No items'}
                    </div>

                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="color:#6b0f1a;">₹${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</strong>
                        <div style="display:flex; gap:6px; align-items:center;">
                            <button onclick="viewOrderBill('${id}')" style="background:linear-gradient(135deg, #28a745, #20c997); color:white; border:none; padding:5px 8px; border-radius:5px; cursor:pointer; font-size:0.7rem; font-weight:600; box-shadow:0 2px 4px rgba(40,167,69,0.3); transition:all 0.3s ease;" title="View Bill">
                                🧾 Bill
                            </button>
                            <a href="tracking.html?id=${id}" style="background:linear-gradient(135deg, #6b0f1a, #8b2530); color:white; text-decoration:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-size:0.7rem; font-weight:600; box-shadow:0 2px 4px rgba(107,15,26,0.3); transition:all 0.3s ease; border:1px solid #6b0f1a;">
                                Track
                            </a>
                        </div>
                    </div>
                </div>`;
                
                const existing = document.getElementById(`order-row-${id}`);
                if(existing) existing.outerHTML = html;
                else list.insertAdjacentHTML('beforeend', html);
            }
        });
    });
};

// --- BILL VIEW FUNCTION ---
window.viewOrderBill = function(orderId) {
    console.log("Viewing bill for order:", orderId);
    
    // Show loading state
    const modal = document.getElementById('profileModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Show loading message
    document.body.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5;">
            <div style="text-align: center; padding: 40px; background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
                <div style="font-size: 48px; margin-bottom: 20px;">🧾</div>
                <h2>Generating Bill...</h2>
                <p style="color: #666; margin-top: 10px;">Please wait while we prepare your bill</p>
                <div style="margin-top: 20px;">
                    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #6b0f1a; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </div>
        </div>
    `;
    
    // Wait a moment for bill.js to load, then generate bill
    setTimeout(() => {
        if (window.billGenerator && window.billGenerator.generateBill) {
            window.billGenerator.generateBill(orderId);
        } else if (window.generateBill) {
            window.generateBill(orderId);
        } else {
            // Fallback - try to reload bill.js
            const script = document.createElement('script');
            script.src = 'bill.js';
            script.onload = function() {
                if (window.billGenerator && window.billGenerator.generateBill) {
                    window.billGenerator.generateBill(orderId);
                } else {
                    showError();
                }
            };
            script.onerror = showError;
            document.head.appendChild(script);
        }
    }, 500);
    
    function showError() {
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f5f5f5;">
                <div style="text-align: center; padding: 40px; background: white; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1);">
                    <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                    <h2>Bill Generation Failed</h2>
                    <p style="color: #666; margin: 20px 0;">Unable to load bill generation system. Please refresh the page and try again.</p>
                    <button onclick="location.reload()" style="background: #6b0f1a; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer;">
                        Refresh Page
                    </button>
                    <button onclick="history.back()" style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-left: 10px;">
                        Go Back
                    </button>
                </div>
            </div>
        `;
    }
};

// modal-injector.js mein end mein ye add karein
// Success Modal ka HTML aur Functions
const successModalHTML = `
<div id="successModal" class="modal" style="display:none; align-items:center; justify-content:center; background:rgba(0,0,0,0.85); backdrop-filter:blur(10px); position:fixed; top:0; left:0; width:100%; height:100%; z-index:999999;">
    <div style="background:#1a1a1a; color:white; padding:40px; border-radius:25px; text-align:center; border:2px solid #c5a059; max-width:380px; width:90%; position:relative;">
        <div style="font-size:4rem; margin-bottom:15px;">🍰</div>
        <h2 style="font-family:'Playfair Display'; color:#c5a059; margin-bottom:10px;">Sweet Success!</h2>
        <p style="color:#ccc; font-size:0.9rem; margin-bottom:5px;">Chef has received your order! 👨‍🍳</p>
        <div id="displayOrderId" style="background:#2a2a2a; padding:12px; border-radius:10px; margin:20px 0; font-family:monospace; font-size:1.1rem; border:1px dashed #c5a059; color:#fff;"></div>
        
        <div style="display:flex; gap:10px; margin-bottom:15px;">
            <button id="trackBtn" style="background:#c5a059; color:#1a1a1a; border:none; padding:12px 20px; border-radius:50px; font-weight:bold; cursor:pointer; flex:1; transition:0.3s; font-size:0.9rem; text-transform:uppercase;">
                Track Order →
            </button>
            <button id="downloadBillBtn" onclick="window.generateBill(document.getElementById('displayOrderId').textContent.replace('Order ID: ', '').replace('#', '').trim())" style="background:#10b981; color:white; border:none; padding:12px 20px; border-radius:50px; font-weight:bold; cursor:pointer; flex:1; transition:0.3s; font-size:0.9rem; text-transform:uppercase;">
                📄 Bill
            </button>
        </div>
        
        <p id="closeSuccess" style="margin-top:20px; font-size:0.8rem; color:#666; cursor:pointer; text-decoration:underline;">Close & Continue Shopping</p>
    </div>
</div>`;

document.body.insertAdjacentHTML('beforeend', successModalHTML);

// Functions ko fix karne ke liye Event Listeners ka use (Better than onclick)
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'trackBtn') {
        const orderIdText = document.getElementById('displayOrderId').innerText.replace('#', '').trim();
        // Seedha tracking.html par jump karein ID ke saath
        window.location.href = `tracking.html?id=${orderIdText}`;
    }
    
    if (e.target && e.target.id === 'closeSuccess') {
        document.getElementById('successModal').style.display = 'none';
    }
});

// Backup global function agar script.js se call karna ho
window.closeSuccessModal = function() {
    document.getElementById('successModal').style.display = 'none';
};

// --- AUTO-TRACKING LOGIC FOR MODAL JUMP ---
// Ye code check karega ki URL mein koi ID aayi hai ya nahi
document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    let idFromUrl = urlParams.get('id');

    if (idFromUrl) {
        // CLEANING: Agar ID mein "Order ID:" likha ho toh usey hata do
        const cleanId = idFromUrl.replace(/Order\s*ID:\s*/gi, "").trim();

        const trackInput = document.getElementById('trackIdInput');
        if (trackInput) {
            trackInput.value = cleanId; // Input box mein sirf exact ID bharein
            
            // Firebase ko load hone ke liye thoda time dein, fir track karein
            setTimeout(() => {
                if (typeof window.trackOrder === 'function') {
                    window.trackOrder(); 
                }
            }, 600);
        }
    }
});