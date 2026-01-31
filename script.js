// --- 1. FIREBASE CONFIGURATION ---
const firebaseConfig = {
    apiKey: "AIzaSyC6Cr8OI7pjTt3t70hrjiSW7kWeZj4jHWc",
    authDomain: "bakeryapp-c4812.firebaseapp.com",
    projectId: "bakeryapp-c4812",
    storageBucket: "bakeryapp-c4812.firebasestorage.app",
    messagingSenderId: "547764804378",
    appId: "1:547764804378:web:e4a425b9e13c826afaaaa3"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// --- 2. GLOBAL STATE ---
let cart = JSON.parse(localStorage.getItem('user_cart')) || {}; 
let isViewAll = false;
let currentCategory = 'all';
let dbMenuItems = []; 

// --- 3. UI LOGIC & INITIALIZATION ---

// --- NEW: INSTANT CACHE CHECK (To stop flicker) ---
function checkAuthCache() {
    const authSection = document.getElementById('auth-section');
    const cachedName = localStorage.getItem('cachedUserName');
    if (authSection && cachedName) {
        authSection.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div onclick="openProfile()" style="cursor:pointer; background:#fff0f0; padding:5px 12px; border-radius:20px; border:1px solid #6b0f1a; display:flex; align-items:center; gap:5px;">
                    <i class="fa-solid fa-user" style="color:#6b0f1a; font-size:0.8rem;"></i>
                    <span style="font-weight:bold; color:#6b0f1a; font-size:0.85rem;">${cachedName}</span>
                </div>
                <button onclick="window.handleLogout()" title="Logout" style="background:none; border:none; color:#6b0f1a; cursor:pointer; font-size:1.1rem;">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>`;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Page load hote hi turant cache check karein
    checkAuthCache();

    // 1. Initial Data Fetching
    fetchMenuFromDB();
    if (window.updateCartIcon) window.updateCartIcon();

    // 2. URL Parameters parsing
    const urlParams = new URLSearchParams(window.location.search);
    const catFromUrl = urlParams.get('cat'); 
    const trackIdFromUrl = urlParams.get('id'); 

    // --- LOGIC A: Menu Filtering from URL ---
    if (catFromUrl) {
        currentCategory = catFromUrl; 
        setTimeout(() => {
            if (typeof window.filterMenu === 'function') {
                window.filterMenu(catFromUrl);
            }
        }, 800); 
    }

    // --- LOGIC B: Auto-fill Tracking ID ---
    const trackInput = document.getElementById('trackIdInput');
    if (trackIdFromUrl && trackInput) {
        trackInput.value = trackIdFromUrl; 

        setTimeout(() => {
            if (typeof window.trackOrder === 'function') {
                window.trackOrder(); 
            }
        }, 1000); 
    }
});

// --- 4. FETCH MENU FROM DATABASE ---
function fetchMenuFromDB() {
    const grid = document.getElementById('menuGrid');
    if(grid && dbMenuItems.length === 0) {
        grid.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>Loading Fresh Menu...</p>";
    }
    
    fetchFilters();

    db.collection("menu").orderBy("id").onSnapshot(snapshot => {
        dbMenuItems = [];
        snapshot.forEach(doc => { dbMenuItems.push(doc.data()); });
        renderMenu();
    });
}

function fetchFilters() {
    const filterBar = document.querySelector('.filter-bar');
    if(!filterBar) return;

    const urlParams = new URLSearchParams(window.location.search);
    const catFromUrl = urlParams.get('cat') || 'all';

    db.collection("categories").orderBy("pos").onSnapshot(snapshot => {
        let allActiveClass = catFromUrl === 'all' ? 'active' : '';
        filterBar.innerHTML = `<button class="filter-btn ${allActiveClass}" onclick="filterMenu('all')">All</button>`;
        
        snapshot.forEach(doc => {
            const cat = doc.data();
            let activeClass = cat.slug === catFromUrl ? 'active' : '';
            filterBar.innerHTML += `<button class="filter-btn ${activeClass}" onclick="filterMenu('${cat.slug}')">${cat.name}</button>`;
        });
    });
}

// --- 5. RENDER LOGIC ---
function renderMenu() {
    const grid = document.getElementById('menuGrid');
    if(!grid) return; 
    
    let filteredItems = currentCategory === 'all' ? dbMenuItems : dbMenuItems.filter(i => i.cat === currentCategory);
    let displayItems = (!isViewAll && currentCategory === 'all') ? filteredItems.slice(0, 5) : filteredItems;

    if(dbMenuItems.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px;">
                <i class="fa-solid fa-cookie-bite fa-spin" style="font-size:2rem; color:#6b0f1a; margin-bottom:10px;"></i>
                <p>Oven is heating up... (Loading Items)</p>
            </div>`;
        return;
    }

    if(displayItems.length === 0) {
        grid.innerHTML = "<p style='grid-column:1/-1; text-align:center; padding:40px; color:#888;'>No items available in this category.</p>";
        return;
    }

    let finalHTML = "";

    displayItems.forEach(item => {
        let imgUrl = item.image && item.image.length > 5 ? item.image : `https://placehold.co/400x300/6b0f1a/fff?text=${item.cat.toUpperCase()}`;
        let qty = cart[item.id] || 0;
        
        let actionHTML = item.inStock === false ? 
            `<button class="add-btn" style="background:#ccc; cursor:not-allowed; width:100%; border:none; padding:10px; border-radius:5px; color:white;" disabled>Out of Stock</button>` : 
            (qty === 0 ? `<button class="add-btn" onclick="window.modifyQty(${item.id}, 1)" style="background:#6b0f1a; color:white; width:100%; border:none; padding:10px; border-radius:5px; font-weight:bold; cursor:pointer; font-family:'Roboto', sans-serif;">Add to Cart</button>` : 
            `<div class="qty-selector" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#fff0f0; padding:5px; border-radius:5px;">
                <button class="qty-btn-small" onclick="window.modifyQty(${item.id}, -1)" style="background:#6b0f1a; color:white; border:none; width:30px; height:30px; border-radius:4px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">-</button>
                <span class="qty-val-display" style="font-weight:bold; color:#6b0f1a; min-width:20px; text-align:center;">${qty}</span>
                <button class="qty-btn-small" onclick="window.modifyQty(${item.id}, 1)" style="background:#6b0f1a; color:white; border:none; width:30px; height:30px; border-radius:4px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">+</button>
            </div>`);

        finalHTML += `
            <div class="product-card" style="background:white; padding:15px; border-radius:10px; text-align:center; box-shadow: 0 4px 10px rgba(0,0,0,0.1); width:100%; max-width:300px; justify-self:center; transition: transform 0.3s ease; ${item.inStock === false ? 'opacity: 0.6;' : ''}">
                <img src="${imgUrl}" style="width:100%; height:180px; object-fit:cover; border-radius:8px; margin-bottom:10px;">
                <h3 style="font-family: 'Playfair Display', serif; font-size:1.1rem; color:#333; margin-bottom:5px; font-weight:bold;">${item.name}</h3>
                <div class="price" style="color:#c5a059; font-weight:bold; font-size:1.2rem; margin-bottom:15px; font-family:'Roboto', sans-serif;">₹${item.price}</div>
                ${actionHTML}
            </div>`;
    });

    if(!isViewAll && currentCategory === 'all' && filteredItems.length > 5) {
        finalHTML += `
            <div class="view-all-container" style="grid-column: 1 / -1; text-align:center; margin:30px;">
                <button class="view-all-btn" onclick="window.triggerViewAll()" style="background:transparent; border:2px solid #6b0f1a; padding:10px 30px; border-radius:50px; cursor:pointer; font-weight:bold; color:#6b0f1a; transition: 0.3s;">
                    View All Products <i class="fa-solid fa-arrow-down"></i>
                </button>
            </div>`;
    }

    grid.innerHTML = finalHTML;
}

window.filterMenu = function(cat) {
    currentCategory = cat; 
    isViewAll = (cat !== 'all'); 
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText.toLowerCase() === cat.toLowerCase()) {
            btn.classList.add('active');
        }
    });
    renderMenu();
}

window.triggerViewAll = function() { isViewAll = true; renderMenu(); };

// --- 6. CART LOGIC (GLOBAL) ---
window.modifyQty = function(id, change) {
    const item = dbMenuItems.find(i => i.id == id);
    if (change > 0 && item?.inStock === false) return alert("Out of stock!");
    
    cart[id] = (cart[id] || 0) + change;
    if (cart[id] <= 0) delete cart[id];
    
    localStorage.setItem('user_cart', JSON.stringify(cart));
    window.updateCartIcon(); 
    renderMenu();
};

window.updateCartIcon = function() {
    let totalCount = Object.values(cart).reduce((a, b) => a + b, 0);
    const badges = document.querySelectorAll('#cart-count');
    badges.forEach(badge => {
        badge.innerText = totalCount;
        badge.style.display = totalCount > 0 ? "flex" : "none";
    });
};

// --- 7. ORDER PLACEMENT (COD ONLY) ---
// --- 7. ORDER PLACEMENT (LINKED WITH USER ID) ---
window.placeOrder = function(paymentMethod = 'COD') {
    const user = firebase.auth().currentUser;
    
    if (!user) {
        alert("Order place karne ke liye Login ya Register karein!");
        document.getElementById('authModal').style.display = 'flex';
        return;
    }
    
    const cartIds = Object.keys(cart);
    if(cartIds.length === 0) return alert("Cart is empty!");
    
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    const mapLocation = document.getElementById('mapLocation').value.trim();
    const lat = document.getElementById('custLat')?.value.trim() || '';
    const lng = document.getElementById('custLng')?.value.trim() || '';
    const subtotal = parseFloat(document.getElementById('cartTotal').innerText);
    const deliveryCharge = window.currentDeliveryCharge || 0;
    const grandTotal = subtotal + deliveryCharge;

    if(!name || !phone || !address) return alert("Please fill all details.");
    if(!mapLocation) return alert("Please select your location on map for delivery calculation!");

    let orderItems = cartIds.map(id => {
        let item = dbMenuItems.find(i => i.id == id);
        if (!item) {
            console.error("Item not found for ID:", id);
            return null;
        }
        return { name: item.name, price: item.price, qty: cart[id] };
    }).filter(item => item !== null);
    
    // --- UPDATED DATA WITH USER ID ---
    db.collection("orders").add({
        userId: user.uid, // ✨ Ab ye order aapki profile se link ho gaya
        userEmail: user.email,
        userName: name, 
        phone, 
        address,
        mapLocation, // Map coordinates stored separately
        lat: lat,
        lng: lng,
        items: orderItems, 
        subtotal: subtotal,
        deliveryCharge: deliveryCharge,
        totalAmount: grandTotal,
        status: "Pending", 
        paymentMethod: paymentMethod, 
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then((docRef) => {
        // 1. Local Storage Update (Optional legacy support)
        let orders = JSON.parse(localStorage.getItem('my_orders') || "[]");
        orders.push(docRef.id);
        localStorage.setItem('my_orders', JSON.stringify(orders));
        
        // 2. UI & Cart Cleanup
        cart = {}; 
        localStorage.removeItem('user_cart');
        if (window.updateCartIcon) window.updateCartIcon(); 
        if (typeof renderMenu === 'function') renderMenu();
        
        const cartModal = document.getElementById('cartModal');
        if (cartModal) cartModal.style.display = 'none';

        // --- 3. CELEBRATION ---
        if (typeof confetti === 'function') {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }

        // --- 4. SHOW SUCCESS MODAL ---
        const successModal = document.getElementById('successModal');
        const orderIdDisplay = document.getElementById('displayOrderId');
        
        if (successModal) {
            if (orderIdDisplay) orderIdDisplay.innerHTML = `<span style="color:#c5a059">Order ID:</span> ${docRef.id}`;
            successModal.style.display = 'flex';

            const trackBtn = successModal.querySelector('button'); 
            if (trackBtn) {
                trackBtn.onclick = () => {
                    successModal.style.display = 'none';
                    window.location.href = `tracking.html?id=${docRef.id}`;
                };
            }
        } else {
            window.location.href = `tracking.html?id=${docRef.id}`;
        }

    }).catch((err) => {
        console.error("Order Error:", err);
        alert("Failed to place order.");
    });
};

// --- 8. TRACKING & PROFILE LOGIC --
window.openCart = function() {
    console.log("Cart button clicked!");
    const modal = document.getElementById('cartModal');
    const list = document.getElementById('cartItems');
    const totalDisplay = document.getElementById('cartTotal');
    
    if(!modal || !list) return;
    modal.style.display = 'flex'; 
    list.innerHTML = ""; 
    let total = 0;
    const cartIds = Object.keys(cart);
    
    if(cartIds.length === 0) {
        list.innerHTML = "<p style='text-align:center; color:#999; margin:20px 0;'>Your basket is empty.</p>";
        if(totalDisplay) totalDisplay.innerText = "0.00";
        return;
    }
    
    cartIds.forEach(id => {
        let item = dbMenuItems.find(i => i.id == id);
        if(item) {
            let itemTotal = item.price * cart[id];
            total += itemTotal;
            
            list.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding:10px; background:#f9f9f9; border-radius:10px;">
                <div style="flex:1;">
                    <strong style="font-size:0.9rem;">${item.name}</strong>
                    <div style="font-size:0.8rem; color:#6b0f1a;">₹${item.price} x ${cart[id]}</div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button onclick="window.modifyQty(${item.id}, -1); window.openCart();" style="width:25px; height:25px; border-radius:5px; border:1px solid #ddd; background:white; cursor:pointer;">-</button>
                    <span style="font-weight:bold; min-width:20px; text-align:center;">${cart[id]}</span>
                    <button onclick="window.modifyQty(${item.id}, 1); window.openCart();" style="width:25px; height:25px; border-radius:5px; border:1px solid #ddd; background:white; cursor:pointer;">+</button>
                </div>
                <div style="width:70px; text-align:right; font-weight:bold; color:#6b0f1a;">₹${itemTotal.toFixed(2)}</div>
            </div>`;
        }
    });
    
    if(totalDisplay) totalDisplay.innerText = total.toFixed(2);
};

window.trackOrder = function() {
    let inputId = document.getElementById('trackIdInput').value.trim();
    if(!inputId) return alert("Please enter Order ID");

    // .get() ko .onSnapshot() se replace kiya taaki LIVE update mile
    db.collection("orders").doc(inputId).onSnapshot((doc) => {
        if(doc.exists) {
            const data = doc.data();
            showTrackingResult(doc.id, data);
            
            // Scooter ko live move karega
            if(window.moveScooter) {
                window.moveScooter(data.status);
            }
        } else {
            alert("Order ID not found. Please check and try again.");
        }
    }, (err) => {
        console.error("Tracking Error:", err);
        alert("Error fetching order details.");
    });
};

function showTrackingResult(id, order) {
    const resDiv = document.getElementById('trackingResult');
    if(!resDiv) return;

    resDiv.style.display = 'block';
    document.getElementById('resId').innerText = id.toUpperCase(); 
    
    // Add timestamp display
    const dateElement = document.getElementById('resDate');
    const timeElement = document.getElementById('resTime');
    
    if (order.timestamp) {
        const orderDate = new Date(order.timestamp.seconds * 1000);
        const date = orderDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long', 
            year: 'numeric'
        });
        const time = orderDate.toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        if (dateElement) dateElement.innerText = date;
        if (timeElement) timeElement.innerText = time;
    } else {
        if (dateElement) dateElement.innerText = 'No date';
        if (timeElement) timeElement.innerText = 'No time';
    }
    
    const statusText = document.getElementById('resStatusText');
    statusText.innerText = order.status;

    // Element IDs
    const s1 = document.getElementById('step-1');
    const s2 = document.getElementById('step-2');
    const s3 = document.getElementById('step-3');
    const s4 = document.getElementById('step-4');
    const line = document.getElementById('activeProgressLine');
    const scooter = document.getElementById('scooterIcon');

    // --- RESET STYLES (Har baar refresh hone par normal kar do) ---
    [s1, s2, s3, s4].forEach(s => s && s.classList.remove('step-active'));
    statusText.style.color = "#6b0f1a"; 
    line.style.background = "#6b0f1a"; // Normal Maroon color
    scooter.style.opacity = "1";

    // --- 🚨 REJECTED SPECIAL LOGIC 🚨 ---
    if (order.status === "Rejected") {
        statusText.innerText = "Order Rejected";
        statusText.style.color = "red";
        line.style.background = "red"; // Line ko laal kar do
        scooter.style.opacity = "0.3"; // Scooter ko fade kar do
        // Scooter ko wahi rokne ke liye aage ka logic skip kar dete hain
        return; 
    }

    // --- NORMAL STEPS LOGIC (Bina refresh ke scooter chalega) ---
    if (s1) s1.classList.add('step-active');
    
    if ((order.status === "Accepted" || order.status === "Confirmed" || order.status === "Ready" || order.status === "Delivered") && s2) {
        s2.classList.add('step-active');
    }
    if ((order.status === "Ready" || order.status === "Delivered") && s3) {
        s3.classList.add('step-active');
    }
    if (order.status === "Delivered" && s4) {
        s4.classList.add('step-active');
    }

    // Smoothly niche scroll karein result dikhane ke liye
    resDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('PWA Registered'))
      .catch(err => console.log('PWA Failed'));
  });
}

// --- 9. AUTH LOGIC (INSTANT LOAD FIX) ---

window.toggleAuth = function(type) {
    document.getElementById('loginForm').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = type === 'reg' ? 'block' : 'none';
};

window.handleRegister = function() {
    const name = document.getElementById('regName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const pass = document.getElementById('regPass').value.trim();

    if (!name || !email || !pass) return alert("Please fill all registration fields!");
    if (pass.length < 6) return alert("Password must be at least 6 characters.");

    // Show loading state
    const regBtn = document.getElementById('regSubmitBtn');
    const originalText = regBtn.textContent;
    regBtn.textContent = 'Creating Account...';
    regBtn.disabled = true;

    firebase.auth().createUserWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Update user profile with name
            return user.updateProfile({ displayName: name })
                .then(() => {
                    // Send email verification using Firebase template
                    return user.sendEmailVerification();
                })
                .then(() => {
                    // Store user data for verification check
                    localStorage.setItem('pendingVerification', 'true');
                    localStorage.setItem('pendingEmail', email);
                    localStorage.setItem('cachedUserName', name);
                    
                    // Sign out the user until email is verified
                    return firebase.auth().signOut();
                });
        })
        .then(() => {
            // Show verification message
            alert('Registration successful! Please check your email and click the verification link to complete your registration.');
            
            // Close modal and reset form
            document.getElementById('authModal').style.display = 'none';
            document.getElementById('regName').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPass').value = '';
            
            // Switch to login form
            window.toggleAuth('login');
        })
        .catch((error) => {
            alert("Error: " + error.message);
        })
        .finally(() => {
            // Reset button state
            regBtn.textContent = originalText;
            regBtn.disabled = false;
        });
};

window.handleLogin = function() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    if (!email || !pass) return alert("Please enter both email and password.");

    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            const user = userCredential.user;
            
            // Check if email is verified
            if (!user.emailVerified) {
                // Show verification modal instead of alert
                document.getElementById('authModal').style.display = 'none';
                window.showEmailVerificationModal(email);
                
                // Sign out the user
                return firebase.auth().signOut();
            }
            
            localStorage.setItem('cachedUserName', user.displayName || 'Profile');
            location.reload();
        })
        .catch((error) => alert("Login Failed: " + error.message));
};

window.handleLogout = function() {
    if(confirm("Logout from NuttyApp?")) {
        localStorage.removeItem('cachedUserName');
        firebase.auth().signOut().then(() => {
            location.reload();
        });
    }
};

// --- GLOBAL AUTH LISTENER (Instant Name Display) ---
firebase.auth().onAuthStateChanged((user) => {
    const authSection = document.getElementById('auth-section');
    if (!authSection) return;

    const cachedName = localStorage.getItem('cachedUserName');

    if (user) {
        const nameToShow = user.displayName || cachedName || 'Profile';
        localStorage.setItem('cachedUserName', nameToShow);

        authSection.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <div onclick="openProfile()" style="cursor:pointer; background:#fff0f0; padding:5px 12px; border-radius:20px; border:1px solid #6b0f1a; display:flex; align-items:center; gap:5px;">
                    <i class="fa-solid fa-user" style="color:#6b0f1a; font-size:0.8rem;"></i>
                    <span style="font-weight:bold; color:#6b0f1a; font-size:0.85rem;">${nameToShow}</span>
                </div>
                <button onclick="window.handleLogout()" title="Logout" style="background:none; border:none; color:#6b0f1a; cursor:pointer; font-size:1.1rem;">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>`;
    } else {
        localStorage.removeItem('cachedUserName');
        authSection.innerHTML = `
            <button onclick="document.getElementById('authModal').style.display='flex'" style="background:#6b0f1a; color:white; border:none; padding:8px 18px; border-radius:20px; cursor:pointer; font-weight:500;">
                Login with Google
            </button>`;
    }
});

// --- 10. MY ORDERS FETCH LOGIC (Login User Only) ---
window.loadUserOrders = function() {
    const user = firebase.auth().currentUser;
    const container = document.getElementById('myOrdersGrid');

    if (!user) {
        if(container) container.innerHTML = "<p style='text-align:center; padding:20px;'>Please login to see your orders.</p>";
        return;
    }

    if(container) container.innerHTML = "<p style='text-align:center;'>Fetching your delicious history... 🍪</p>";

    db.collection("orders")
      .where("userId", "==", user.uid)
      .orderBy("timestamp", "desc")
      .onSnapshot((snapshot) => {
          if (!container) return;
          container.innerHTML = "";

          if (snapshot.empty) {
              container.innerHTML = "<p style='text-align:center; padding:20px;'>No orders found yet. Time to buy some cookies! 🍪</p>";
              return;
          }

          snapshot.forEach((doc) => {
              const order = doc.data();
              const orderId = doc.id;
              
              // Debug: Log the order data
              console.log('Order data:', order);
              console.log('Timestamp:', order.timestamp);
              
              const date = order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleDateString('en-IN') : 'No date';
              const time = order.timestamp ? new Date(order.timestamp.seconds * 1000).toLocaleTimeString('en-IN', {hour: '2-digit', minute:'2-digit'}) : '';

              container.innerHTML += `
                <div class="order-card-mini" style="background:white; padding:15px; border-radius:12px; margin-bottom:15px; box-shadow:0 4px 10px rgba(0,0,0,0.05); border-left:5px solid #6b0f1a;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                        <span style="font-weight:bold; color:#6b0f1a; font-size:0.75rem; word-break:break-all;">#${orderId.toUpperCase()}</span>
                        <div style="text-align:right; background:#f9f9f9; padding:5px 8px; border-radius:5px;">
                            <span style="font-size:0.8rem; color:#333; font-weight:500;">${date}</span>
                            ${time ? `<br><span style="font-size:0.7rem; color:#666; font-weight:400;">${time}</span>` : ''}
                        </div>
                    </div>
                    <div style="font-size:0.9rem; margin-bottom:10px; color:#444;">
                        ${order.items ? (Array.isArray(order.items) ? order.items.map(i => `${i.qty}x ${i.name}`).join(', ') : 'Order details unavailable') : 'No items'}
                    </div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <strong style="color:#6b0f1a;">₹${order.totalAmount ? order.totalAmount.toFixed(2) : '0.00'}</strong>
                        <div style="display:flex; gap:10px;">
                            <span style="padding:4px 10px; border-radius:15px; background:#fff0f0; color:#6b0f1a; font-size:0.75rem; font-weight:bold;">${order.status || 'Pending'}</span>
                            <button onclick="window.location.href='tracking.html?id=${orderId}'" style="background:none; border:1px solid #6b0f1a; color:#6b0f1a; padding:4px 12px; border-radius:5px; cursor:pointer; font-size:0.75rem;">Track</button>
                        </div>
                    </div>
                </div>`;
          });
      }, (error) => {
          console.error("Orders load karne mein error:", error);
          if (error.message.includes("index")) {
              console.warn("Firestore Index link click karein:", error.message);
          }
      });
};

// 🛡️ Login hote hi orders load karne ke liye listener
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Agar aap My Orders page par hain toh function call karein
        if (document.getElementById('myOrdersGrid')) {
            window.loadUserOrders();
        }
    }
});