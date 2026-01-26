// ========================================
// Global Variables
// ========================================
let allVehicles = [];
let filteredVehicles = [];

// ========================================
// Fetch Vehicles from Backend on Load
// ========================================
async function loadVehicles() {
    try {
        const response = await fetch("/customer/search/vehicle");
        if (!response.ok) throw new Error("Failed to fetch vehicles");

        const data = await response.json();
        allVehicles = data;
        filteredVehicles = [...allVehicles];

        displayVehicles(filteredVehicles);
    } catch (error) {
        console.error("Error loading vehicles:", error);
        showError("Failed to load vehicles. Please try again later.");
    }
}

// ========================================
// Display Vehicles in Search Results
// ========================================
function displayVehicles(vehicles) {
    const container = document.getElementById("searchResults");

    if (!container) {
        console.error("searchResults container not found");
        return;
    }

    container.innerHTML = ""; // Clear previous content

    if (vehicles.length === 0) {
        container.innerHTML = `
            <p style="text-align: center; color: var(--text-light); padding: 40px;">
                No vehicles found matching your criteria.
            </p>
        `;
        return;
    }

    vehicles.forEach(vehicle => {
        const vehicleCard = document.createElement("div");
        vehicleCard.className = "vehicle-card";
        vehicleCard.onclick = () => viewVehicle(vehicle.vehicleId);

        vehicleCard.innerHTML = `
            <div class="vehicle-image">
                <i class="fas fa-car"></i>
            </div>

            <div class="vehicle-info">
                <!-- Vehicle name -->
                <h4>${vehicle.vehicleBrand} ${vehicle.vehicleModel}</h4>

                <!-- Price -->
                <p class="price">
                    LKR ${vehicle.pricePerDay ? vehicle.pricePerDay.toLocaleString() : "N/A"}/day
                </p>

                <!-- Company -->
                <p class="category"
                   style="cursor:pointer; color:var(--primary); text-decoration:underline;"
                   onclick="event.stopPropagation(); viewCompany(${vehicle.companyId})">
                   ${getCompanyName(vehicle.companyId)}
                </p>

                <!-- Location -->
                <p class="location">Sri Lanka</p>

                <!-- Rating - Always 5 stars -->
                <div class="rating">
                    <div class="stars">
                        ${generateStars(5)}
                    </div>
                    <span class="review-count">Excellent Service</span>
                </div>

                <!-- Seats -->
                <div class="seats-info">
                    <i class="fas fa-users"></i>
                    ${vehicle.numberOfPassengers} seats
                </div>

                <!-- Features -->
                <div class="features">
                    <span class="feature-tag">${vehicle.fuelType || "Fuel"}</span>
                    <span class="feature-tag">${vehicle.vehicleCategory || "Vehicle"}</span>
                    ${vehicle.availabilityStatus === 'available' ? '<span class="feature-tag">Available</span>' : ''}
                </div>
            </div>

            <div class="vehicle-actions">
                <button class="message-btn"
                    onclick="event.stopPropagation(); sendMessage(${vehicle.vehicleId}, '${vehicle.vehicleBrand} ${vehicle.vehicleModel}')">
                    Message
                </button>
            </div>
        `;

        container.appendChild(vehicleCard);
    });
}

// ========================================
// Generate 5 Star Rating HTML
// ========================================
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="fas fa-star"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// ========================================
// Get Company Name by ID
// ========================================
function getCompanyName(companyId) {
    const companyMap = {
        1: "Premium Rentals",
        2: "City Car Rentals",
        3: "Budget Wheels",
        4: "Lanka Van Hire",
        5: "Luxury Rides LK",
        6: "Island Transport"
    };
    return companyMap[companyId] || `Company ID: ${companyId}`;
}

// ========================================
// Search Vehicles by Form Criteria
// ========================================
function searchVehicles() {
    const vehicleType = document.getElementById('vehicleType')?.value.toLowerCase();
    const pickupLocation = document.getElementById('pickupLocation')?.value.toLowerCase();
    
    let results = [...allVehicles];
    
    if (vehicleType) {
        results = results.filter(vehicle => {
            // Search by vehicle category (Car, SUV, Van) or by vehicle name (brand + model)
            const vehicleName = `${vehicle.vehicleBrand} ${vehicle.vehicleModel}`.toLowerCase();
            const category = (vehicle.vehicleCategory || '').toLowerCase();
            return category === vehicleType || vehicleName.includes(vehicleType);
        });
    }
    
    // Note: Location filtering would need backend support
    // For now, we show all vehicles regardless of pickup location
    
    filteredVehicles = results;
    displayVehicles(filteredVehicles);
}

// ========================================
// Apply Filters
// ========================================
function applyFilters() {
    const priceRange = document.getElementById('priceRange')?.value;
    const category = document.getElementById('category')?.value;
    const companyFilter = document.getElementById('companyFilter')?.value;
    const fuelType = document.getElementById('fuelType')?.value.toLowerCase();
    const seats = document.getElementById('seats')?.value;

    let filtered = [...allVehicles];

    // Price Range Filter
    if (priceRange) {
        const [min, max] = priceRange.split('-');
        if (max === undefined) {
            // Handle "10000+" format
            filtered = filtered.filter(v => v.pricePerDay >= parseInt(min.replace('+', '')));
        } else {
            filtered = filtered.filter(v =>
                v.pricePerDay >= parseInt(min) && v.pricePerDay <= parseInt(max)
            );
        }
    }

    // Company Filter
    if (companyFilter) {
        // Map company name to ID
        const companyIdMap = {
            "Premium Rentals": 1,
            "City Car Rentals": 2,
            "Budget Wheels": 3,
            "Lanka Van Hire": 4,
            "Luxury Rides LK": 5,
            "Island Transport": 6
        };
        const companyId = companyIdMap[companyFilter];
        if (companyId) {
            filtered = filtered.filter(v => v.companyId === companyId);
        }
    }

    // Fuel Type Filter
    if (fuelType) {
        filtered = filtered.filter(v =>
            v.fuelType && v.fuelType.toLowerCase() === fuelType
        );
    }

    // Seats Filter
    if (seats) {
        if (seats === '7+') {
            filtered = filtered.filter(v => v.numberOfPassengers >= 7);
        } else {
            filtered = filtered.filter(v => v.numberOfPassengers == parseInt(seats));
        }
    }

    filteredVehicles = filtered;
    displayVehicles(filteredVehicles);
}

// ========================================
// Clear All Filters
// ========================================
function clearAllFilters() {
    // Reset all form dropdowns to their default values
    const vehicleType = document.getElementById('vehicleType');
    const pickupLocation = document.getElementById('pickupLocation');
    const priceRange = document.getElementById('priceRange');
    const fuelType = document.getElementById('fuelType');
    const seats = document.getElementById('seats');
    const vehicleCategoryFilter = document.getElementById('vehicleCategoryFilter');
    const companyFilter = document.getElementById('companyFilter');

    if (vehicleType) vehicleType.value = '';
    if (pickupLocation) pickupLocation.value = '';
    if (priceRange) priceRange.value = '';
    if (fuelType) fuelType.value = '';
    if (seats) seats.value = '';
    if (vehicleCategoryFilter) vehicleCategoryFilter.value = '';
    if (companyFilter) companyFilter.value = '';

    // Reset filtered vehicles to show all vehicles
    filteredVehicles = [...allVehicles];
    displayVehicles(filteredVehicles);

    // Show notification
    showNotification('All filters cleared!', 'info');
}


// ========================================
// View Vehicle Details
// ========================================
function viewVehicle(vehicleId) {
    const vehicle = allVehicles.find(v => v.vehicleId === vehicleId);
    if (vehicle) {
        try {
            // Store vehicle data in sessionStorage
            sessionStorage.setItem('selectedVehicle', JSON.stringify(vehicle));
            sessionStorage.setItem('searchData', JSON.stringify({
                vehicleType: document.getElementById('vehicleType')?.value || '',
                pickupLocation: document.getElementById('pickupLocation')?.value || '',
                dropoffLocation: document.getElementById('dropoffLocation')?.value || '',
                fromDateTime: document.getElementById('fromDateTime')?.value || '',
                toDateTime: document.getElementById('toDateTime')?.value || ''
            }));
        } catch(e) {
            console.log('SessionStorage not available:', e);
        }
        window.location.href = `vehicle-profile.html?id=${vehicleId}`;
    }
}

// ========================================
// View Company Profile
// ========================================
function viewCompany(companyId) {
    try {
        sessionStorage.setItem('selectedCompanyId', companyId.toString());
    } catch(e) {
        console.log('SessionStorage not available:', e);
    }
    window.location.href = 'company-profile.html';
}

// ========================================
// Send Message to Company
// ========================================
function sendMessage(vehicleId, vehicleName) {
    const vehicle = allVehicles.find(v => v.vehicleId === vehicleId);
    if (!vehicle) return;

    const companyName = getCompanyName(vehicle.companyId);

    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <h3>Send Message</h3>
                <button class="close-btn" onclick="closePopup()">&times;</button>
            </div>
            <div class="popup-body">
                <p>Send a message to <strong>${companyName}</strong> about their <strong>${vehicleName}</strong>:</p>
                <textarea class="message-input" placeholder="Type your message here..." rows="4"></textarea>
            </div>
            <div class="popup-footer">
                <button class="btn btn-primary" onclick="sendMessageAction(${vehicleId})">Send Message</button>
                <button class="btn btn-outline" onclick="closePopup()">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
}

// ========================================
// Send Message Action
// ========================================
function sendMessageAction(vehicleId) {
    const messageInput = document.querySelector('.message-input');
    if (messageInput && messageInput.value.trim()) {
        // TODO: Implement actual message sending to backend
        showNotification('Message sent successfully!', 'success');
        closePopup();
    } else {
        showNotification('Please enter a message before sending.', 'error');
    }
}

// ========================================
// Close Popup
// ========================================
function closePopup() {
    const popup = document.querySelector('.popup-overlay');
    if (popup) {
        popup.remove();
    }
}

// ========================================
// Show Error Message
// ========================================
function showError(message) {
    const container = document.getElementById("searchResults");
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 48px; color: var(--danger); margin-bottom: 15px;"></i>
                <p style="color: var(--text); font-size: 18px;">${message}</p>
            </div>
        `;
    }
}

// ========================================
// Show Notification Toast
// ========================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        info: '#2196f3'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 9999;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;

    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ========================================
// Initialize on Page Load
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    loadVehicles();
});
