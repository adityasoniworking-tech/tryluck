// --- DELIVERY CHARGE CALCULATION SYSTEM ---
// Author: TNCM Bakery
// Purpose: Calculate distance-based delivery charges

class DeliveryCalculator {
    constructor() {
        // Bakery Location (Gandhinagar, Gujarat - Update with exact coordinates)
        this.bakeryLocation = {
            lat: 23.2156,  // Gandhinagar coordinates
            lng: 72.6369
        };
        
        // Delivery Charge Slabs
        this.deliverySlabs = [
            { maxDistance: 2, charge: 0, label: "Free (2km)" },
            { maxDistance: 5, charge: 30, label: "₹30 (2-5km)" },
            { maxDistance: 10, charge: 50, label: "₹50 (5-10km)" },
            { maxDistance: Infinity, charge: 80, label: "₹80 (10km+)" }
        ];
        
        // Free Delivery Conditions
        this.freeDeliveryConditions = {
            minOrderAmount: 500,  // Free delivery above ₹500
            specialAreas: ["Sector 1", "Sector 2", "Sector 3"],  // Free in these areas
            pickupOption: true  // Self-pickup always free
        };
    }

    // Calculate distance between two coordinates using Haversine formula
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = this.toRad(lat2 - lat1);
        const dLng = this.toRad(lng2 - lng1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; // Distance in km
    }

    toRad(deg) {
        return deg * (Math.PI/180);
    }

    // Get delivery charge based on distance
    getDeliveryCharge(distance, orderAmount = 0, address = "") {
        // Check for free delivery conditions
        if (this.isFreeDelivery(orderAmount, address)) {
            return {
                charge: 0,
                distance: distance,
                label: "FREE",
                reason: this.getFreeDeliveryReason(orderAmount, address)
            };
        }

        // Find applicable slab
        const slab = this.deliverySlabs.find(s => distance <= s.maxDistance);
        
        return {
            charge: slab.charge,
            distance: distance,
            label: slab.label,
            reason: "Standard delivery charge"
        };
    }

    // Check if delivery is free
    isFreeDelivery(orderAmount, address) {
        // Free above minimum order amount
        if (orderAmount >= this.freeDeliveryConditions.minOrderAmount) {
            return true;
        }

        // Free in special areas
        if (this.freeDeliveryConditions.specialAreas.some(area => 
            address.toLowerCase().includes(area.toLowerCase()))) {
            return true;
        }

        return false;
    }

    // Get reason for free delivery
    getFreeDeliveryReason(orderAmount, address) {
        if (orderAmount >= this.freeDeliveryConditions.minOrderAmount) {
            return `Free delivery on orders above ₹${this.freeDeliveryConditions.minOrderAmount}`;
        }
        
        if (this.freeDeliveryConditions.specialAreas.some(area => 
            address.toLowerCase().includes(area.toLowerCase()))) {
            return "Free delivery in your area";
        }
        
        return "Free delivery";
    }

    // Get user's current location
    async getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by this browser"));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000 // 5 minutes
                }
            );
        });
    }

    // Calculate delivery from user location
    async calculateDeliveryFromLocation(userLat, userLng, orderAmount = 0, address = "") {
        const distance = this.calculateDistance(
            this.bakeryLocation.lat,
            this.bakeryLocation.lng,
            userLat,
            userLng
        );

        return this.getDeliveryCharge(distance, orderAmount, address);
    }
}

// Global instance
window.deliveryCalculator = new DeliveryCalculator();

// --- UI Functions for Cart Modal ---

// --- ADVANCED ADDRESS SEARCH AND LOCATION FEATURES ---

// Address search with autocomplete
window.initAddressSearch = function() {
    const searchInput = document.getElementById('addressSearch');
    const suggestionsDiv = document.getElementById('addressSuggestions');
    
    if (!searchInput || !suggestionsDiv) return;

    let searchTimeout;
    
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 3) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        searchTimeout = setTimeout(() => {
            window.searchAddress(query);
        }, 300);
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !suggestionsDiv.contains(e.target)) {
            suggestionsDiv.style.display = 'none';
        }
    });
};

// Search address using Nominatim (OpenStreetMap)
window.searchAddress = async function(query) {
    const suggestionsDiv = document.getElementById('addressSuggestions');
    if (!suggestionsDiv) return;
    
    try {
        suggestionsDiv.innerHTML = '<div style="padding:10px; text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';
        suggestionsDiv.style.display = 'block';
        
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
        const data = await response.json();
        
        if (data.length === 0) {
            suggestionsDiv.innerHTML = '<div style="padding:10px; color:#666;">No addresses found</div>';
            return;
        }
        
        let html = '';
        data.forEach(place => {
            const displayName = place.display_name;
            const lat = place.lat;
            const lng = place.lon;
            
            html += `
                <div onclick="window.selectAddress('${displayName.replace(/'/g, "\\'")}', ${lat}, ${lng})" 
                     style="padding:10px; border-bottom:1px solid #eee; cursor:pointer; hover:background:#f5f5f5;">
                    <div style="font-size:0.9rem; font-weight:500;">${displayName}</div>
                    <div style="font-size:0.8rem; color:#666;">📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
                </div>
            `;
        });
        
        suggestionsDiv.innerHTML = html;
        
    } catch (error) {
        console.error('Address search error:', error);
        suggestionsDiv.innerHTML = '<div style="padding:10px; color:red;">Search failed. Try again.</div>';
    }
};

// Select address from suggestions
window.selectAddress = function(displayName, lat, lng) {
    const addressInput = document.getElementById('custAddress');
    const searchInput = document.getElementById('addressSearch');
    const suggestionsDiv = document.getElementById('addressSuggestions');
    const latInput = document.getElementById('custLat');
    const lngInput = document.getElementById('custLng');
    
    if (addressInput) addressInput.value = displayName;
    if (searchInput) searchInput.value = displayName;
    if (suggestionsDiv) suggestionsDiv.style.display = 'none';
    if (latInput) latInput.value = lat;
    if (lngInput) lngInput.value = lng;
    
    // Calculate delivery for selected address
    const cartTotal = parseFloat(document.getElementById('cartTotal').innerText) || 0;
    window.calculateDeliveryFromCoordinates(lat, lng, cartTotal, displayName);
};

// Manual location selection with map
window.openManualLocation = function() {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 10000; 
        display: flex; align-items: center; justify-content: center;
    `;
    
    modal.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 15px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #6b0f1a;">📍 Pin Your Location</h3>
                <button onclick="this.closest('.modal').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Latitude:</label>
                <input type="number" id="manualLat" step="0.0001" placeholder="e.g. 23.2156" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Longitude:</label>
                <input type="number" id="manualLng" step="0.0001" placeholder="e.g. 72.6369" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
            </div>
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 600;">Address Details:</label>
                <textarea id="manualAddress" placeholder="Enter complete address" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px; height: 80px; resize: none;"></textarea>
            </div>
            
            <div style="background: #f8f9fa; padding: 10px; border-radius: 6px; margin-bottom: 15px;">
                <p style="margin: 0; font-size: 0.85rem; color: #666;">
                    <strong>💡 Tip:</strong> You can get coordinates from Google Maps. Right-click on your location and select coordinates.
                </p>
            </div>
            
            <div style="display: flex; gap: 10px;">
                <button onclick="window.saveManualLocation()" style="flex: 1; background: #6b0f1a; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer; font-weight: 600;">
                    📍 Save Location
                </button>
                <button onclick="this.closest('.modal').remove()" style="flex: 1; background: #6c757d; color: white; border: none; padding: 12px; border-radius: 6px; cursor: pointer;">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    modal.className = 'modal';
    document.body.appendChild(modal);
};

// Save manual location
window.saveManualLocation = function() {
    const lat = document.getElementById('manualLat').value;
    const lng = document.getElementById('manualLng').value;
    const address = document.getElementById('manualAddress').value;
    
    if (!lat || !lng || !address) {
        alert('Please fill all fields');
        return;
    }
    
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    
    if (isNaN(latNum) || isNaN(lngNum)) {
        alert('Please enter valid coordinates');
        return;
    }
    
    // Update form fields
    const addressInput = document.getElementById('custAddress');
    const latInput = document.getElementById('custLat');
    const lngInput = document.getElementById('custLng');
    
    if (addressInput) addressInput.value = address;
    if (latInput) latInput.value = latNum;
    if (lngInput) lngInput.value = lngNum;
    
    // Calculate delivery
    const cartTotal = parseFloat(document.getElementById('cartTotal').innerText) || 0;
    window.calculateDeliveryFromCoordinates(latNum, lngNum, cartTotal, address);
    
    // Close modal
    document.querySelector('.modal').remove();
};

// Calculate delivery from coordinates
window.calculateDeliveryFromCoordinates = async function(lat, lng, orderAmount, address) {
    const statusDiv = document.getElementById('locationStatus');
    const deliveryInfo = document.getElementById('deliveryInfo');
    
    try {
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Calculating delivery...';
        }
        
        const delivery = await window.deliveryCalculator.calculateDeliveryFromLocation(lat, lng, orderAmount, address);
        
        if (statusDiv) {
            statusDiv.innerHTML = `<i class="fa-solid fa-check-circle" style="color:green;"></i> Location set successfully!`;
        }
        
        if (deliveryInfo) {
            deliveryInfo.style.display = 'block';
            document.getElementById('distanceText').innerText = `${delivery.distance.toFixed(1)} km`;
            document.getElementById('deliveryCharge').innerText = delivery.charge === 0 ? 'FREE' : `₹${delivery.charge}`;
            
            // Show free delivery reason
            const reasonDiv = document.getElementById('freeDeliveryReason');
            if (reasonDiv) {
                if (delivery.reason && delivery.charge === 0) {
                    reasonDiv.innerHTML = `✅ ${delivery.reason}`;
                } else {
                    reasonDiv.innerHTML = '';
                }
            }
        }
        
        // Update order summary
        updateOrderSummary(orderAmount, delivery.charge);
        
    } catch (error) {
        console.error('Delivery calculation error:', error);
        if (statusDiv) {
            statusDiv.innerHTML = '<i class="fa-solid fa-exclamation-triangle" style="color:red;"></i> Error calculating delivery';
        }
    }
};

// Enhanced getUserLocation function
window.getUserLocation = async function() {
    const statusDiv = document.getElementById('locationStatus');
    const deliveryInfo = document.getElementById('deliveryInfo');
    const locationBtn = document.getElementById('getLocationBtn');
    
    if (!statusDiv || !deliveryInfo || !locationBtn) return;

    try {
        // Show loading state
        statusDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Getting your location...';
        locationBtn.disabled = true;
        locationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Getting Location...';

        // Get user location
        const location = await window.deliveryCalculator.getUserLocation();
        
        // Store coordinates
        const latInput = document.getElementById('custLat');
        const lngInput = document.getElementById('custLng');
        if (latInput) latInput.value = location.lat;
        if (lngInput) lngInput.value = location.lng;

        // Get current order total
        const cartTotal = parseFloat(document.getElementById('cartTotal').innerText) || 0;
        const address = document.getElementById('custAddress').value || "Current Location";

        // Calculate delivery
        await window.calculateDeliveryFromCoordinates(location.lat, location.lng, cartTotal, address);

        // Reset button
        locationBtn.disabled = false;
        locationBtn.innerHTML = '<i class="fa-solid fa-map-location-dot"></i> 📍 Update Location';

    } catch (error) {
        console.error('Location error:', error);
        let errorMessage = 'Unable to get location. ';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                errorMessage += 'Please allow location access or use manual location.';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage += 'Location information unavailable. Try manual location.';
                break;
            case error.TIMEOUT:
                errorMessage += 'Location request timed out. Try again.';
                break;
            default:
                errorMessage += 'Please try manual location entry.';
        }
        
        statusDiv.innerHTML = `<i class="fa-solid fa-exclamation-triangle" style="color:orange;"></i> ${errorMessage}`;
        locationBtn.disabled = false;
        locationBtn.innerHTML = '<i class="fa-solid fa-map-location-dot"></i> 📍 Retry';
    }
};

// Initialize address search when cart opens
document.addEventListener('DOMContentLoaded', function() {
    const originalOpenCart = window.openCart;
    window.openCart = function() {
        originalOpenCart();
        setTimeout(() => {
            window.initAddressSearch();
        }, 100);
    };
});

// Auto-update when address changes
document.addEventListener('DOMContentLoaded', function() {
    const addressInput = document.getElementById('custAddress');
    if (addressInput) {
        addressInput.addEventListener('blur', function() {
            // If we have location, recalculate delivery
            const latInput = document.getElementById('custLat');
            const lngInput = document.getElementById('custLng');
            
            if (latInput && lngInput && latInput.value && lngInput.value) {
                const cartTotal = parseFloat(document.getElementById('cartTotal').innerText) || 0;
                window.getUserLocation();
            }
        });
    }
});
