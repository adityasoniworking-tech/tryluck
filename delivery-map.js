// Map-based Delivery System
// Shop Location (Gandhinagar)
const shopLocation = [23.2156, 72.6369];
let userMarker = null;
let map = null;
let selectedLocation = null;

// Debug: Log when script loads
console.log('🗺️ Delivery Map Script Loaded Successfully!');

// Immediately define functions in global scope
(function() {
    'use strict';
    
    // Initialize Map
    window.openMapModal = function() {
        console.log('🗺️ Opening Map Modal...');
        
        const modal = document.getElementById('mapModal');
        if (!modal) {
            console.error('❌ Map Modal not found!');
            alert('Map modal not found. Please refresh the page.');
            return;
        }
        
        modal.style.display = 'flex';
        console.log('✅ Map Modal displayed');
        
        // Initialize map if not already done
        if (!map) {
            console.log('🗺️ Initializing map...');
            
            // Wait a bit for DOM to be ready
            setTimeout(() => {
                try {
                    map = L.map('map').setView(shopLocation, 13);
                    console.log('✅ Map object created');
                    
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '© OpenStreetMap contributors'
                    }).addTo(map);
                    console.log('✅ Map tiles loaded');
                    
                    // Add shop marker
                    L.marker(shopLocation).addTo(map)
                        .bindPopup('The Nutty Choco Morsels<br>Our Shop Location')
                        .openPopup();
                    console.log('✅ Shop marker added');
                    
                    // Add search control
                    addSearchControl();
                    
                    // Add click event for location selection
                    map.on('click', function(e) {
                        console.log('🗺️ Map clicked at:', e.latlng);
                        selectLocation(e.latlng.lat, e.latlng.lng);
                    });
                    console.log('✅ Map click event added');
                    
                    // Get and show user's live location
                    showUserLiveLocation();
                    
                } catch (error) {
                    console.error('❌ Error initializing map:', error);
                    alert('Error loading map. Please check your internet connection.');
                }
            }, 500);
        } else {
            // If map already exists, just show live location
            showUserLiveLocation();
        }
    };

    // Get user's current location
    window.getUserLocation = function() {
        console.log('🗺️ Getting user location...');
        
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }
        
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Getting Location...';
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                console.log('✅ Location received:', position.coords);
                
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Calculate distance and delivery charge
                await getRoadDistance(lat, lng);
                
                // Update map location field with coordinates
                const mapLocationField = document.getElementById('mapLocation');
                if (mapLocationField) {
                    mapLocationField.value = `GPS Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    mapLocationField.style.background = '#e8f5e8';
                    mapLocationField.style.color = '#155724';
                    console.log('✅ Map location field updated with GPS location');
                }
                
                // Also save to hidden lat/lng fields
                const latField = document.getElementById('custLat');
                const lngField = document.getElementById('custLng');
                if (latField) latField.value = lat.toFixed(6);
                if (lngField) lngField.value = lng.toFixed(6);
                
                // Get actual address from coordinates
                getAddressFromCoordinates(lat, lng);
                
                btn.disabled = false;
                btn.innerHTML = originalText;
            },
            (error) => {
                console.error('❌ Error getting location:', error);
                alert('Unable to get your location. Please try selecting on map.');
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        );
    };

    // Confirm selected location
    window.confirmMapLocation = function() {
        console.log('🗺️ Confirming map location...');
        
        if (!selectedLocation) {
            alert('Please select a location on the map first!');
            return;
        }
        
        const [lat, lng] = selectedLocation;
        console.log('🗺️ Confirmed location:', lat, lng);
        
        // Calculate distance and delivery charge
        getRoadDistance(lat, lng);
        
        // Close map modal
        document.getElementById('mapModal').style.display = 'none';
        
        // Update map location field with coordinates
        const mapLocationField = document.getElementById('mapLocation');
        if (mapLocationField) {
            mapLocationField.value = `Map Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            mapLocationField.style.background = '#e8f5e8';
            mapLocationField.style.color = '#155724';
            console.log('✅ Map location field updated');
        } else {
            console.error('❌ Map location field not found');
        }
        
        // Also save to hidden lat/lng fields
        const latField = document.getElementById('custLat');
        const lngField = document.getElementById('custLng');
        if (latField) latField.value = lat.toFixed(6);
        if (lngField) lngField.value = lng.toFixed(6);
        
        // Get actual address from coordinates
        getAddressFromCoordinates(lat, lng);
    };

    console.log('✅ Functions registered in global scope');
})();

// Add search control to map
function addSearchControl() {
    console.log('🔍 Adding search control...');
    
    // Create search container
    const searchContainer = L.control({ position: 'topright' });
    
    searchContainer.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'leaflet-bar');
        div.style.cssText = `
            background: white;
            padding: 5px;
            border-radius: 5px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            min-width: 200px;
        `;
        
        div.innerHTML = `
            <input type="text" id="mapSearchInput" placeholder="🔍 Search location..." 
                   style="width: 100%; padding: 8px; border: 2px solid #ddd; border-radius: 5px; outline: none; font-size: 14px; box-sizing: border-box;">
            <div id="searchResults" style="max-height: 200px; overflow-y: auto; margin-top: 5px; background: white; border: 1px solid #ddd; border-radius: 3px;"></div>
        `;
        
        // Prevent map clicks on search
        L.DomEvent.disableClickPropagation(div);
        
        return div;
    };
    
    searchContainer.addTo(map);
    
    // Add search functionality
    const searchInput = document.getElementById('mapSearchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (searchInput && searchResults) {
        let searchTimeout;
        
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            if (query.length < 3) {
                searchResults.innerHTML = '';
                return;
            }
            
            searchTimeout = setTimeout(() => {
                searchLocation(query);
            }, 500);
        });
        
        // Add Enter key support
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = e.target.value.trim();
                if (query.length >= 3) {
                    clearTimeout(searchTimeout);
                    searchLocation(query);
                }
            }
        });
        
        // Focus on input when map opens
        setTimeout(() => {
            searchInput.focus();
        }, 1000);
        
        console.log('✅ Search control added');
    }
}

// Search location using Nominatim API
async function searchLocation(query) {
    console.log('🔍 Searching for:', query);
    
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;
    
    searchResults.innerHTML = '<div style="padding: 5px; color: #666;">🔄 Searching...</div>';
    
    try {
        // Add proper User-Agent to avoid blocking
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'TheNuttyChocoMorsels/1.0 (https://thenuttychocomorsels.in; contact@thenuttychocomorsels.in)'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const results = await response.json();
        
        if (results.length === 0) {
            searchResults.innerHTML = '<div style="padding: 5px; color: #666;">📍 No results found</div>';
            return;
        }
        
        searchResults.innerHTML = results.map((result, index) => {
            const displayName = result.display_name || `${result.name || 'Location'}, ${result.address?.city || 'Unknown'}`;
            return `
                <div style="padding: 8px; border-bottom: 1px solid #eee; cursor: pointer; font-size: 12px; background: white;"
                     onmouseover="this.style.background='#f5f5f5'" 
                     onmouseout="this.style.background='white'"
                     onclick="selectSearchResult(${result.lat}, ${result.lon}, '${displayName.replace(/'/g, "\\'").replace(/"/g, '\\"')}')">
                    <strong style="color: #6b0f1a;">📍 ${result.name || displayName.split(',')[0]}</strong><br>
                    <small style="color: #666;">${displayName}</small>
                </div>
            `;
        }).join('');
        
        console.log(`✅ Found ${results.length} search results`);
        
    } catch (error) {
        console.error('❌ Search error:', error);
        searchResults.innerHTML = '<div style="padding: 5px; color: #f44336;">❌ Search failed. Try again.</div>';
    }
}

// Select search result
window.selectSearchResult = function(lat, lon, displayName) {
    console.log('🔍 Selected search result:', lat, lon);
    
    // Clear search results
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.innerHTML = '';
    }
    
    // Clear search input
    const searchInput = document.getElementById('mapSearchInput');
    if (searchInput) {
        searchInput.value = displayName.split(',')[0];
    }
    
    // Move map to location
    map.setView([lat, lon], 16);
    
    // Select the location
    selectLocation(lat, lon);
    
    // Add marker with popup
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    
    userMarker = L.marker([lat, lon]).addTo(map)
        .bindPopup(`<strong>📍 ${displayName.split(',')[0]}</strong><br><small>${displayName}</small>`)
        .openPopup();
};

// Show user's live location
function showUserLiveLocation() {
    console.log('📍 Getting live location...');
    
    if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported');
        return;
    }
    
    // Show loading indicator
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'locationLoading';
    loadingDiv.style.cssText = `
        position: absolute;
        top: 10px;
        left: 10px;
        background: white;
        padding: 10px;
        border-radius: 5px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        z-index: 1000;
        font-size: 12px;
    `;
    loadingDiv.innerHTML = '🔄 Getting your location...';
    
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.appendChild(loadingDiv);
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            console.log('✅ Live location received:', position.coords);
            
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Remove loading
            const loading = document.getElementById('locationLoading');
            if (loading) loading.remove();
            
            // Add live location marker
            const liveLocationIcon = L.divIcon({
                html: '<div style="background: #4285f4; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>',
                iconSize: [16, 16],
                className: 'live-location-marker'
            });
            
            if (window.liveLocationMarker) {
                map.removeLayer(window.liveLocationMarker);
            }
            
            window.liveLocationMarker = L.marker([lat, lng], { icon: liveLocationIcon }).addTo(map)
                .bindPopup('<strong>Your Live Location</strong><br><small>Blue dot shows your current position</small>')
                .openPopup();
            
            // Center map on user location
            map.setView([lat, lng], 15);
            
            // Add accuracy circle
            if (window.accuracyCircle) {
                map.removeLayer(window.accuracyCircle);
            }
            
            const accuracy = position.coords.accuracy;
            window.accuracyCircle = L.circle([lat, lng], {
                radius: accuracy,
                fillColor: '#4285f4',
                fillOpacity: 0.1,
                color: '#4285f4',
                weight: 1
            }).addTo(map);
            
            // Show success message
            const successDiv = document.createElement('div');
            successDiv.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                background: #4caf50;
                color: white;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                z-index: 1000;
                font-size: 12px;
            `;
            successDiv.innerHTML = '✅ Location found! Blue dot shows your live position';
            
            if (mapContainer) {
                mapContainer.appendChild(successDiv);
                setTimeout(() => successDiv.remove(), 3000);
            }
            
        },
        (error) => {
            console.error('❌ Location error:', error);
            
            // Remove loading
            const loading = document.getElementById('locationLoading');
            if (loading) loading.remove();
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = `
                position: absolute;
                top: 10px;
                left: 10px;
                background: #f44336;
                color: white;
                padding: 10px;
                border-radius: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                z-index: 1000;
                font-size: 12px;
            `;
            errorDiv.innerHTML = '❌ Could not get your location. Please enable location services.';
            
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                mapContainer.appendChild(errorDiv);
                setTimeout(() => errorDiv.remove(), 5000);
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Select location on map
function selectLocation(lat, lng) {
    console.log('🗺️ Selecting location:', lat, lng);
    
    try {
        // Remove existing user marker
        if (userMarker) {
            map.removeLayer(userMarker);
        }
        
        // Add new marker
        userMarker = L.marker([lat, lng]).addTo(map)
            .bindPopup('Your Selected Location')
            .openPopup();
        
        selectedLocation = [lat, lng];
        console.log('✅ Location selected:', selectedLocation);
        
        // Draw route line
        if (window.L && window.L.polyline) {
            const routeLine = L.polyline([shopLocation, [lat, lng]], {
                color: '#6b0f1a',
                weight: 3,
                opacity: 0.7,
                dashArray: '10, 10'
            }).addTo(map);
            console.log('✅ Route line drawn');
        }
        
    } catch (error) {
        console.error('❌ Error selecting location:', error);
        alert('Error selecting location. Please try again.');
    }
}

// Calculate road distance using OSRM API
async function getRoadDistance(userLat, userLon) {
    console.log('🗺️ Calculating road distance...');
    
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${shopLocation[1]},${shopLocation[0]};${userLon},${userLat}?overview=false`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.routes && data.routes[0]) {
            const distanceKM = data.routes[0].distance / 1000;
            console.log(`✅ Road Distance: ${distanceKM.toFixed(2)} KM`);
            
            calculateDeliveryCharge(distanceKM);
            updateDeliveryDisplay(distanceKM);
        } else {
            throw new Error('No route found');
        }
        
    } catch (error) {
        console.error('❌ Error calculating road distance:', error);
        
        // Fallback to straight-line distance
        const distanceKM = calculateStraightLineDistance(userLat, userLon);
        console.log(`🗺️ Using straight-line distance: ${distanceKM.toFixed(2)} KM`);
        
        calculateDeliveryCharge(distanceKM);
        updateDeliveryDisplay(distanceKM);
    }
}

// Calculate straight-line distance (fallback)
function calculateStraightLineDistance(userLat, userLon) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (userLat - shopLocation[0]) * Math.PI / 180;
    const dLon = (userLon - shopLocation[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(shopLocation[0] * Math.PI / 180) * Math.cos(userLat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Calculate delivery charge based on distance
function calculateDeliveryCharge(km) {
    console.log('🗺️ Calculating delivery charge for:', km, 'KM');
    
    let charge = 0;
    
    if (km <= 2) {
        charge = 20; // Base charge
    } else if (km <= 5) {
        charge = 20 + (km - 2) * 10; // 2km ke baad 10rs/km
    } else if (km <= 10) {
        charge = 50 + (km - 5) * 8; // 5km ke baad 8rs/km
    } else {
        charge = 90 + (km - 10) * 6; // 10km ke baad 6rs/km
    }
    
    window.currentDeliveryCharge = charge;
    console.log('✅ Delivery charge calculated: ₹', charge);
    
    return charge;
}

// Update delivery information display
function updateDeliveryDisplay(distanceKM) {
    console.log('🗺️ Updating delivery display...');
    
    try {
        const deliveryInfo = document.getElementById('deliveryInfo');
        const distanceDisplay = document.getElementById('distanceDisplay');
        const deliveryCharge = document.getElementById('deliveryCharge');
        const totalWithDelivery = document.getElementById('totalWithDelivery');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!deliveryInfo || !distanceDisplay || !deliveryCharge || !totalWithDelivery) {
            console.error('❌ Delivery display elements not found');
            return;
        }
        
        // Show delivery info section
        deliveryInfo.style.display = 'block';
        
        // Update distance
        distanceDisplay.textContent = `${distanceKM.toFixed(2)} KM`;
        
        // Update delivery charge
        const charge = calculateDeliveryCharge(distanceKM);
        deliveryCharge.textContent = `₹${charge.toFixed(2)}`;
        
        // Update total amount
        const subtotal = parseFloat(cartTotal ? cartTotal.innerText : '0');
        const grandTotal = subtotal + charge;
        totalWithDelivery.textContent = `₹${grandTotal.toFixed(2)}`;
        
        console.log('✅ Delivery display updated successfully');
        
    } catch (error) {
        console.error('❌ Error updating delivery display:', error);
    }
}

// Get actual address from coordinates using reverse geocoding
async function getAddressFromCoordinates(lat, lng) {
    console.log('🔍 Getting address for coordinates:', lat, lng);
    
    try {
        // Try direct Nominatim API (free, no key needed)
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`, {
            method: 'GET',
            headers: {
                'User-Agent': 'TheNuttyChocoMorsels/1.0 (https://thenuttychocomorsels.in)'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data && data.display_name) {
                console.log('✅ Address found:', data.display_name);
                
                // Update map location field with actual address
                const mapLocationField = document.getElementById('mapLocation');
                if (mapLocationField) {
                    mapLocationField.value = data.display_name;
                    mapLocationField.style.background = '#e8f5e8';
                    mapLocationField.style.color = '#155724';
                    console.log('✅ Map location field updated with address');
                }
                
                return data.display_name;
            }
        }
        
        throw new Error('No address found');
        
    } catch (error) {
        console.error('❌ Error getting address:', error);
        
        // Fallback: Show coordinates in map location field
        const mapLocationField = document.getElementById('mapLocation');
        if (mapLocationField) {
            mapLocationField.value = `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            mapLocationField.style.background = '#fff3cd';
            mapLocationField.style.color = '#856404';
        }
        
        console.log('ℹ️ Using coordinates as fallback');
        return null;
    }
}

// Export functions for global use
window.deliverySystem = {
    getRoadDistance,
    calculateDeliveryCharge,
    updateDeliveryDisplay,
    selectLocation
};

console.log('🗺️ Delivery Map System Ready!');
