document.addEventListener("DOMContentLoaded", function() {
    console.log('🚀 Layout loading started...');
    
    // 1. INJECT HEADER (Immediate)
    const headerHTML = `
        <div class="logo">
           <img src="logo.svg" alt="Logo" style="height: 40px; width: auto;">
           thenuttychocomorsels
        </div>
        <div class="mobile-toggle" id="menuBtn">
            <i class="fa-solid fa-bars"></i>
        </div>
        <nav class="nav-links" id="navLinks">
            <a href="index.html">Home</a>
            <a href="about.html">About Us</a>
            <a href="menu.html">Menu</a>
            
            <a href="javascript:void(0)" id="navOrders" onclick="window.openProfile()" style="display: flex; align-items: center; gap: 5px;">
                <i class="fa-solid fa-box"></i> My Orders
            </a>

            <div id="auth-section" style="display: flex; align-items: center; margin: 0 10px;">
                </div>

            <a href="javascript:void(0)" class="nav-cart-green" onclick="window.openCart()" style="position:relative;">
                <i class="fa-solid fa-cart-shopping"></i>
                <span id="cart-count" style="position:absolute; top:-5px; right:-10px; background:red; color:white; border-radius:50%; padding:2px 6px; font-size:10px; display:none;">0</span>
            </a>
            
            <a href="contact.html" class="contact-btn">Contact Us</a>
        </nav>
    `;
    const headerElem = document.getElementById('main-header');
    if(headerElem) {
        headerElem.innerHTML = headerHTML;
        console.log('✅ Header loaded');
    }

    // --- MOBILE MENU TOGGLE (Immediate)
    const menuBtn = document.getElementById('menuBtn');
    const navLinks = document.getElementById('navLinks');

    if (menuBtn && navLinks) {
        menuBtn.onclick = function(e) {
            e.stopPropagation();
            navLinks.classList.toggle('active');
        };
        document.addEventListener('click', (e) => {
            if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
                navLinks.classList.remove('active');
            }
        });
    }

    // 2. INJECT FOOTER (Immediate)
    const footerHTML = `
        <div class="footer-grid">
            <div class="footer-col">
                <h3>Quick Links</h3>
                <a href="index.html">Home</a>
                <a href="about.html">About Us</a>
                <a href="menu.html">Menu</a>
                <a href="contact.html">Contact Us</a>
            </div>
            <div class="footer-col">
                <h3>Contact Info</h3>
                <p><i class="fa-solid fa-phone"></i> +91 9978744573, +91 9974565391</p>
                <p><i class="fa-solid fa-envelope"></i> thenuttychocomorsels@gmail.com</p>
                <p><i class="fa-solid fa-location-dot"></i> Swarnim Park, Gandhinagar, 382016</p>
            </div>
            <div class="footer-col">
                <h3>Follow Us</h3>
                <div class="social-icons">
                    <a href="https://www.instagram.com/thenuttychocomorsels" target="_blank"><i class="fa-brands fa-instagram"></i></a>
                    <a href="whatsapp_select.html" target="_blank" class="wa-bg"><i class="fa-brands fa-whatsapp"></i></a>
                </div>
            </div>
        </div>
        <div class="copyright">&copy; 2026 The Nutty Choco Morsels. All Rights Reserved.</div>
    `;
    const footerElem = document.getElementById('main-footer');
    if(footerElem) {
        footerElem.innerHTML = footerHTML;
        console.log('✅ Footer loaded');
    }

    // 3. INJECT MODALS (Delayed for performance)
    setTimeout(() => {
        const extraComponentsHTML = `
            <a href="tracking.html" class="floating-track-btn" title="Track My Order">
                <i class="fa-solid fa-location-crosshairs"></i>
                <span>Track Order</span>
            </a>

            <div id="authModal" class="modal" style="display:none; align-items:center; justify-content:center; background:rgba(0,0,0,0.8); z-index:10005;">
                <div class="modal-content" style="max-width:380px; position:relative; padding:30px;">
                    <span class="close-btn" onclick="document.getElementById('authModal').style.display='none'">&times;</span>
                    <div>
                        <h2 style="font-family:'Playfair Display'; color:#6b0f1a; text-align:center; margin-bottom:30px;">Welcome to The Nutty Choco Morsels</h2>
                        <div class="social-login">
                            <button id="google-login-btn" class="google-btn" onclick="handleGoogleLogin()" style="border: 2px solid #6b0f1a; border-radius: 25px; padding: 12px 20px;">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo">
                                Continue with Google
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="cartModal" class="modal" style="display:none; align-items:center; justify-content:center; background:rgba(0,0,0,0.8); z-index:10006;">
                <div class="modal-content" style="display: block; overflow-y: auto; max-height: 90vh; padding: 20px; max-width:450px; width:90%;">
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
                            <textarea id="custAddress" placeholder="Complete Delivery Address (House/Flat No, Street, Landmark, Floor, etc.)" style="width:100%; padding:12px; margin-bottom:10px; border:1px solid #ddd; border-radius:8px; height:80px; resize:none;"></textarea>
                            
                            <!-- Map Location Field (Read-only) -->
                            <input id="mapLocation" type="text" placeholder="Select your location on map (Required)" readonly style="width:100%; padding:12px; margin-bottom:15px; border:2px dashed #007bff; border-radius:8px; background:#f8f9fa; color:#666;">
                            
                            <!-- Hidden coordinate fields -->
                            <input id="custLat" type="hidden" value="">
                            <input id="custLng" type="hidden" value="">
                            
                            <!-- Location Selection -->
                            <div style="margin-bottom: 15px; display: flex; gap: 10px;">
                                <button onclick="window.getUserLocation()" style="width:48%; background:#28a745; color:white; padding:12px; border:none; border-radius:8px; cursor:pointer; font-size:14px; font-weight:500; transition:all 0.3s ease;" onmouseover="this.style.background='#218838'" onmouseout="this.style.background='#28a745'">
                                    <i class="fa-solid fa-location-crosshairs"></i> Get My Location
                                </button>
                                <button onclick="window.openMapModal()" style="width:48%; background:#007bff; color:white; padding:12px; border:none; border-radius:8px; cursor:pointer; font-size:14px; font-weight:500; transition:all 0.3s ease;" onmouseover="this.style.background='#0056b3'" onmouseout="this.style.background='#007bff'">
                                    <i class="fa-solid fa-map"></i> Select on Map
                                </button>
                            </div>
                            
                            <!-- Delivery Info Display -->
                            <div id="deliveryInfo" style="background:#f8f9fa; padding:10px; border-radius:8px; margin-bottom:10px; display:none;">
                                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                    <span>Distance:</span>
                                    <span id="distanceDisplay">-</span>
                                </div>
                                <div style="display:flex; justify-content:space-between; margin-bottom:5px;">
                                    <span>Delivery Charge:</span>
                                    <span id="deliveryCharge" style="color:#6b0f1a; font-weight:bold;">₹0.00</span>
                                </div>
                                <div style="display:flex; justify-content:space-between;">
                                    <span>Total Amount:</span>
                                    <span id="totalWithDelivery" style="color:#6b0f1a; font-weight:bold;">₹0.00</span>
                                </div>
                            </div>
                            
                            <button class="order-btn-main" onclick="window.placeOrder('COD')" style="width:100%; background:#6b0f1a; color:white; padding:15px; border:none; border-radius:10px; font-weight:bold; cursor:pointer;">
                                Confirm & Place Order (COD)
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div id="successModal" class="modal" style="display:none; align-items:center; justify-content:center; background:rgba(0,0,0,0.8); z-index:10008;">
                <div class="modal-content" style="max-width:400px; text-align:center; padding:30px; background:white; border-radius:15px;">
                    <div style="font-size:4rem; margin-bottom:15px;">🎉</div>
                    <h2 style="color:#6b0f1a; margin-bottom:10px;">Order Placed Successfully!</h2>
                    <p style="color:#666; margin-bottom:20px;">Thank you for your order. We'll prepare your delicious treats with care!</p>
                    <div id="displayOrderId" style="background:#f9f9f9; padding:10px; border-radius:8px; margin:15px 0; font-family:monospace; font-weight:bold;"></div>
                    <div style="display:flex; gap:10px; justify-content:center; margin-bottom:15px;">
                        <button id="trackOrderBtn" style="background:#6b0f1a; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">
                            <i class="fa-solid fa-location-crosshairs"></i> Track Order
                        </button>
                        <button id="downloadBillBtn" onclick="window.generateBill(document.getElementById('displayOrderId').textContent.replace('Order ID: ', '').replace('#', '').trim())" style="background:#10b981; color:white; border:none; padding:10px 20px; border-radius:8px; cursor:pointer; font-weight:bold;">
                            <i class="fa-solid fa-download"></i> Download Bill
                        </button>
                    </div>
                    <button onclick="document.getElementById('successModal').style.display='none'" style="background:none; border:1px solid #6b0f1a; color:#6b0f1a; padding:8px 20px; border-radius:8px; cursor:pointer;">Continue Shopping</button>
                </div>
            </div>

            <div id="profileModal" class="modal" style="display:none; align-items:center; justify-content:center; background:rgba(0,0,0,0.8); z-index:10007;">
                <div class="modal-content" style="display: block; overflow-y: auto; max-height: 90vh; padding: 20px; max-width:500px; width:90%;">
                    <div style="position: sticky; top: -20px; background: white; z-index: 100; padding-bottom: 10px; border-bottom: 1px solid #eee; margin-bottom: 15px;">
                        <span class="close-btn" onclick="document.getElementById('profileModal').style.display='none'" style="position:absolute; right:0; top:5px; cursor:pointer; font-size:24px; z-index:1001;">&times;</span>
                        <h2 style="font-family: 'Playfair Display', serif; text-align:center; margin: 10px 0 0 0;">My Orders</h2>
                    </div>
                    <div id="myOrdersList"></div>
                </div>
            </div>

            <div id="mapModal" class="modal" style="display:none; align-items:center; justify-content:center; background:rgba(0,0,0,0.8); z-index:10010;">
                <div class="modal-content" style="max-width:90%; width:600px; position:relative; padding:20px;">
                    <span class="close-btn" onclick="document.getElementById('mapModal').style.display='none'">&times;</span>
                    <h3 style="font-family:'Playfair Display'; color:#6b0f1a; text-align:center; margin-bottom:15px;">Select Delivery Location</h3>
                    <div id="map" style="height:400px; border-radius:10px; margin-bottom:15px;"></div>
                    <div style="text-align:center;">
                        <button onclick="window.confirmMapLocation()" style="background:#6b0f1a; color:white; padding:10px 20px; border:none; border-radius:8px; cursor:pointer;">
                            Confirm Location
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', extraComponentsHTML);
        console.log('✅ Modals loaded');
    }, 100);

    // --- FIREBASE AUTH LISTENER ---
    if (typeof firebase !== 'undefined') {
        // Google Login Function
        window.handleGoogleLogin = () => {
            console.log("Google login initiated...");
            const provider = new firebase.auth.GoogleAuthProvider();
            
            firebase.auth().signInWithPopup(provider)
                .then((result) => {
                    console.log("Google login successful:", result.user);
                    const user = result.user;
                    
                    // Store user data in localStorage instead of Firestore (no permissions needed)
                    localStorage.setItem('userName', user.displayName || '');
                    localStorage.setItem('userEmail', user.email || '');
                    localStorage.setItem('userPhone', user.phoneNumber || '');
                    localStorage.setItem('userPhoto', user.photoURL || '');
                    localStorage.setItem('isLoggedIn', 'true');
                    
                    console.log("User data stored in localStorage");
                    document.getElementById('authModal').style.display = 'none';
                    location.reload();
                })
                .catch((error) => {
                    console.error("Google login failed:", error);
                    alert("Google login failed: " + error.message);
                });
        };
        
        firebase.auth().onAuthStateChanged((user) => {
            const authSection = document.getElementById('auth-section');
            if (!authSection) return;
            if (user) {
                authSection.innerHTML = `
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div onclick="window.openProfile()" style="cursor:pointer; background:#fff0f0; padding:5px 12px; border-radius:20px; border:1px solid #6b0f1a; display:flex; align-items:center; gap:5px;">
                            <i class="fa-solid fa-user" style="color:#6b0f1a; font-size:0.8rem;"></i>
                            <span style="font-weight:bold; color:#6b0f1a; font-size:0.85rem;">${user.displayName || 'Profile'}</span>
                        </div>
                        <button onclick="window.handleLogout()" title="Logout" style="background:none; border:none; color:#6b0f1a; cursor:pointer; font-size:1.1rem;">
                            <i class="fa-solid fa-right-from-bracket"></i>
                        </button>
                    </div>`;
            } else {
                authSection.innerHTML = `<button onclick="document.getElementById('authModal').style.display='flex'" style="background:#6b0f1a; color:white; border:none; padding:8px 18px; border-radius:20px; cursor:pointer; font-weight:500;">Login / Register</button>`;
            }
        });
    }

    // --- GLOBAL FUNCTIONS ---
    window.handleLogout = () => {
        if(confirm("Logout from NuttyApp?")) {
            firebase.auth().signOut().then(() => {
                localStorage.removeItem('cachedUserName');
                location.reload(); 
            });
        }
    };

    // Add openProfile function for My Orders click
    window.openProfile = () => {
        console.log('📦 Opening My Orders modal...');
        const modal = document.getElementById('profileModal');
        if (modal) {
            modal.style.display = 'flex';
            console.log('✅ Profile modal opened');
            
            // Load orders if modal-injector is available
            if (typeof window.openProfile === 'function' && window.openProfile !== arguments.callee) {
                // Call the original openProfile function from modal-injector
                setTimeout(() => {
                    if (typeof window.openProfile === 'function' && window.openProfile !== arguments.callee) {
                        window.openProfile();
                    }
                }, 100);
            } else {
                // Fallback: Show loading message
                const ordersList = document.getElementById('myOrdersList');
                if (ordersList) {
                    ordersList.innerHTML = '<p style="text-align:center; padding:20px;">Loading your orders...</p>';
                }
            }
        } else {
            console.error('❌ Profile modal not found');
            // Try to inject modal if not exists
            setTimeout(() => {
                const modal = document.getElementById('profileModal');
                if (modal) {
                    modal.style.display = 'flex';
                }
            }, 500);
        }
    };

    // Add openCart function for Cart click
    window.openCart = () => {
        console.log('🛒 Opening Cart modal...');
        const modal = document.getElementById('cartModal');
        if (modal) {
            modal.style.display = 'flex';
            console.log('✅ Cart modal opened');
            
            // Load cart items if modal-injector is available
            if (typeof window.openCart === 'function' && window.openCart !== arguments.callee) {
                // Call the original openCart function from modal-injector
                setTimeout(() => {
                    if (typeof window.openCart === 'function' && window.openCart !== arguments.callee) {
                        window.openCart();
                    }
                }, 100);
            }
        } else {
            console.error('❌ Cart modal not found');
            // Try to inject modal if not exists
            setTimeout(() => {
                const modal = document.getElementById('cartModal');
                if (modal) {
                    modal.style.display = 'flex';
                }
            }, 500);
        }
    };

    // Email Verification Functions
    window.showEmailVerificationModal = (email) => {
        const modal = document.getElementById('emailVerificationModal');
        const emailDisplay = document.getElementById('verificationEmail');
        
        if (modal && emailDisplay) {
            emailDisplay.textContent = email;
            modal.style.display = 'flex';
        }
    };

    window.resendVerificationEmail = () => {
        const user = firebase.auth().currentUser;
        if (user) {
            user.sendEmailVerification()
                .then(() => {
                    alert('Verification email sent! Please check your inbox.');
                })
                .catch((error) => {
                    alert('Error sending verification email: ' + error.message);
                });
        }
    };

    window.checkEmailVerification = () => {
        const user = firebase.auth().currentUser;
        if (user) {
            user.reload()
                .then(() => {
                    if (user.emailVerified) {
                        alert('Email verified successfully! You can now login.');
                        document.getElementById('emailVerificationModal').style.display = 'none';
                        firebase.auth().signOut();
                    } else {
                        alert('Email not verified yet. Please check your email and click the verification link.');
                    }
                })
                .catch((error) => {
                    alert('Error checking verification status: ' + error.message);
                });
        }
    };
});