// --- 1. MODAL & SCROLLING SETUP ---
window.setupModalScrolling = function(elementId) {
    const list = document.getElementById(elementId);
    if (list) {
        // Mobile aur Desktop dono ke liye scrollable height set karna
        list.style.maxHeight = "60vh"; 
        list.style.overflowY = "auto";
        list.style.paddingRight = "5px"; // Scrollbar spacing
    }
};

// Background scroll lock/unlock logic
function toggleScrollLock(lock) {
    document.body.style.overflow = lock ? 'hidden' : 'auto';
}

// --- GOOGLE SIGN-IN LOGIC ---
// Firebase Auth already loaded in HTML, no need to import
const auth = firebase.auth();
const provider = new firebase.auth.GoogleAuthProvider();

// Function to setup Google button listeners
function setupGoogleButtons() {
    console.log("Setting up Google buttons...");
    
    const googleBtn = document.getElementById('google-login-btn');
    
    console.log("Google login button found:", !!googleBtn);
    
    if (googleBtn && !googleBtn.hasAttribute('data-google-setup')) {
        googleBtn.setAttribute('data-google-setup', 'true');
        googleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log("Google login button clicked!");
            
            auth.signInWithPopup(provider)
                .then((result) => {
                    // Login successful
                    const user = result.user;
                    console.log("User logged in:", user.displayName);
                    
                    // Modal band karein aur profile update karein
                    closeModal(); 
                    updateUserProfileUI(user);
                })
                .catch((error) => {
                    console.error("Error during Google Login:", error);
                    alert("Google login failed: " + error.message);
                });
        });
        console.log("Google login button listener added!");
    }
}

// Google Login Button par event listener
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, setting up Google buttons...");
    setupGoogleButtons();
    
    // Also setup buttons after a delay in case they're added dynamically
    setTimeout(setupGoogleButtons, 1000);
    setTimeout(setupGoogleButtons, 2000);
});

// Also listen for DOM changes in case buttons are added later
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.addedNodes.length) {
            setupGoogleButtons();
        }
    });
});

observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Test function for debugging - run this in console
window.testGoogleLogin = function() {
    console.log("Testing Google Login...");
    console.log("Firebase auth:", typeof firebase !== 'undefined' ? 'loaded' : 'not loaded');
    console.log("Auth object:", !!auth);
    console.log("Provider object:", !!provider);
    
    const googleBtn = document.getElementById('google-login-btn');
    
    console.log("Button found:", {
        googleBtn: !!googleBtn,
        googleBtnSetup: googleBtn ? googleBtn.hasAttribute('data-google-setup') : false
    });
    
    // Try to trigger Google Sign-In directly
    if (auth && provider) {
        auth.signInWithPopup(provider)
            .then((result) => {
                console.log("Direct Google login successful:", result.user);
            })
            .catch((error) => {
                console.error("Direct Google login failed:", error);
            });
    }
};

// User Profile UI update karne ke liye function
function updateUserProfileUI(user) {
    const profileSection = document.querySelector('.profile-icon'); // aapka profile element
    if (profileSection && user.photoURL) {
        profileSection.innerHTML = `<img src="${user.photoURL}" class="user-avatar">`;
    }
}

// Modal close function
function closeModal() {
    const authModal = document.getElementById('authModal');
    if (authModal) {
        authModal.style.display = 'none';
        toggleScrollLock(false);
    }
}

// --- 2. OPEN PROFILE / MY ORDERS (UNIFIED DESIGN) ---
const originalOpenProfile = window.openProfile;
window.openProfile = function() {
    const modal = document.getElementById('profileModal');
    const list = document.getElementById('myOrdersList');
    
    if (modal && list) {
        modal.style.display = 'flex';
        list.innerHTML = "<p style='text-align:center;'>Fetching your delicious history... 🍪</p>";

        // Get current user and load orders (same as script.js)
        const user = firebase.auth().currentUser;
        if (!user) {
            list.innerHTML = "<p style='text-align:center; padding:20px;'>Please login to see your orders.</p>";
            return;
        }

        db.collection("orders")
          .where("userId", "==", user.uid)
          .orderBy("timestamp", "desc")
          .onSnapshot((snapshot) => {
              if (!list) return;
              list.innerHTML = "";

              if (snapshot.empty) {
                  list.innerHTML = "<p style='text-align:center; padding:20px;'>No orders found yet. Time to buy some cookies! 🍪</p>";
                  return;
              }

              snapshot.forEach((doc) => {
                  const order = doc.data();
                  const orderId = doc.id;
                  
                  // Debug: Log the order data
                  console.log('Modal Order data:', order);
                  console.log('Modal Timestamp:', order.timestamp);
                  console.log('Timestamp type:', typeof order.timestamp);
                  
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
                          console.log('Formatted date:', date);
                          console.log('Formatted time:', time);
                      } catch (error) {
                          console.error('Error formatting timestamp:', error);
                          date = 'Invalid date';
                      }
                  } else {
                      console.log('No timestamp found in order data');
                  }

                  list.innerHTML += `
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
                            <div style="display:flex; gap:6px; align-items:center;">
                                <span style="padding:4px 10px; border-radius:15px; background:#fff0f0; color:#6b0f1a; font-size:0.7rem; font-weight:bold;">${order.status || 'Pending'}</span>
                                <button onclick="viewOrderBill('${orderId}')" style="background:linear-gradient(135deg, #28a745, #20c997); color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:0.7rem; font-weight:600; box-shadow:0 2px 4px rgba(40,167,69,0.3); transition:all 0.3s ease;" title="View Bill">
                                    🧾 Bill
                                </button>
                                <button onclick="window.location.href='tracking.html?id=${orderId}'" style="background:linear-gradient(135deg, #6b0f1a, #8b2530); color:white; border:1px solid #6b0f1a; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:0.7rem; font-weight:600; box-shadow:0 2px 4px rgba(107,15,26,0.3); transition:all 0.3s ease;">
                                    Track
                                </button>
                            </div>
                        </div>
                    </div>`;
              });
          }, (error) => {
              console.error("Modal Orders load error:", error);
              if (error.message.includes("index")) {
                  console.warn("Firestore Index link:", error.message);
              }
          });
        }
        window.setupModalScrolling('myOrdersList');
        toggleScrollLock(true);
    }
};

// --- 3. OPEN CART ---
const originalOpenCart = window.openCart;
window.openCart = function() {
    if (typeof originalOpenCart === 'function') {
        originalOpenCart();
        window.setupModalScrolling('cartItems');
        toggleScrollLock(true);
    }
};

// --- 5. BILL VIEW FUNCTION ---
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

// --- 4. CLOSE MODAL LOGIC ---
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
        toggleScrollLock(false);
    }
};

// Modal close button (X) ke liye listener
document.querySelectorAll('.close-modal').forEach(btn => {
    btn.onclick = function() {
        this.closest('.modal').style.display = "none";
        toggleScrollLock(false);
    }
});