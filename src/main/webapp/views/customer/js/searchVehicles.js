// ========================================
// Global Variables
// ========================================
let allVehicles = [];
let filteredVehicles = [];

// ========================================
// Populate Filter Dropdowns from Vehicle Data
// ========================================
function populateFilterOptions() {
    if (!allVehicles || allVehicles.length === 0) {
        console.log('⚠️ populateFilterOptions: No vehicles available');
        return;
    }

    console.log('🔍 populateFilterOptions: Processing', allVehicles.length, 'vehicles');
    console.log('🔍 First vehicle sample:', allVehicles[0]);
    console.log('🔍 Vehicle types:', allVehicles.map(v => v.vehicleType));

    // Extract unique vehicle types (Car, SUV, Van, etc.)
    const vehicleTypes = [...new Set(allVehicles
        .map(v => v.vehicleType)
        .filter(Boolean)
        .map(type => type.trim())
    )].sort();

    console.log('✅ Unique vehicle types found:', vehicleTypes);

    // Extract unique locations
    const locations = [...new Set(allVehicles
        .map(v => v.location)
        .filter(Boolean)
        .map(loc => loc.trim())
    )].sort();

    // Extract unique fuel types
    const fuelTypes = [...new Set(allVehicles
        .map(v => v.fuelType)
        .filter(Boolean)
        .map(fuel => fuel.trim())
    )].sort();

    // Extract unique seat counts
    const seatCounts = [...new Set(allVehicles
        .map(v => v.numberOfPassengers)
        .filter(seats => seats && seats > 0)
    )].sort((a, b) => a - b);

    // Extract unique companies
    // First get unique company IDs, then map to company objects
    const uniqueCompanyIds = [...new Set(allVehicles
        .map(v => v.companyId)
        .filter(id => id != null)
    )];

    const companies = uniqueCompanyIds
        .map(id => ({
            id: id,
            name: getCompanyName(id)
        }))
        .filter(company => company.name)
        .sort((a, b) => a.name.localeCompare(b.name));

    // Populate Vehicle Type dropdown
    const vehicleTypeSelect = document.getElementById('vehicleType');
    if (vehicleTypeSelect) {
        // Keep the "All Types" option
        vehicleTypeSelect.innerHTML = '<option value="">All Types</option>';
        vehicleTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.toLowerCase();
            option.textContent = type;
            vehicleTypeSelect.appendChild(option);
        });
    }

    // Populate Pickup Location dropdown
    const pickupLocationSelect = document.getElementById('pickupLocation');
    if (pickupLocationSelect) {
        pickupLocationSelect.innerHTML = '<option value="">All Locations</option>';
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location.toLowerCase();
            option.textContent = location;
            pickupLocationSelect.appendChild(option);
        });
    }

    // Populate Fuel Type dropdown
    const fuelTypeSelect = document.getElementById('fuelType');
    if (fuelTypeSelect) {
        fuelTypeSelect.innerHTML = '<option value="">All Fuel Types</option>';
        fuelTypes.forEach(fuel => {
            const option = document.createElement('option');
            option.value = fuel.toLowerCase();
            option.textContent = fuel;
            fuelTypeSelect.appendChild(option);
        });
    }

    // Populate Seats dropdown
    const seatsSelect = document.getElementById('seats');
    if (seatsSelect) {
        seatsSelect.innerHTML = '<option value="">Any</option>';
        seatCounts.forEach(seats => {
            const option = document.createElement('option');
            option.value = seats;
            option.textContent = seats;
            seatsSelect.appendChild(option);
        });
        // Add "7+" option if there are vehicles with 7+ seats
        const maxSeats = Math.max(...seatCounts);
        if (maxSeats >= 7) {
            const option = document.createElement('option');
            option.value = '7+';
            option.textContent = '7+';
            seatsSelect.appendChild(option);
        }
    }

    // Populate Company dropdown
    const companySelect = document.getElementById('companyFilter');
    if (companySelect) {
        companySelect.innerHTML = '<option value="">All Companies</option>';
        companies.forEach(company => {
            const option = document.createElement('option');
            option.value = company.name;
            option.textContent = company.name;
            companySelect.appendChild(option);
        });
        console.log('✅ Companies populated:', companies.map(c => c.name));
    }
}

// ========================================
// Fetch Vehicles from Backend on Load
// ========================================
async function loadVehicles() {
    console.log('=== loadVehicles() called ===');

    // Determine the base URL dynamically
    const contextPath = window.location.pathname.substring(0, window.location.pathname.indexOf('/', 1));
    const baseUrl = `${window.location.origin}${contextPath}`;
    const endpoints = [
        `${baseUrl}/customer/search/vehicle`,
        '/customer/search/vehicle',
        `${window.location.origin}/customer/search/vehicle`,
        '../../../customer/search/vehicle',
        '/RideMachan-1.0-SNAPSHOT/customer/search/vehicle'
    ];

    console.log('Context path:', contextPath);
    console.log('Base URL:', baseUrl);
    console.log('Current location:', window.location.href);
    console.log('Will try endpoints:', endpoints);

    let lastError = null;

    for (const endpoint of endpoints) {
        try {
            console.log(`Trying endpoint: ${endpoint}`);
            const response = await fetch(endpoint);
            console.log(`Response status for ${endpoint}:`, response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ SUCCESS! Data received from:', endpoint);
                console.log('Raw data received:', data);
                console.log('Data type:', typeof data);
                console.log('Is array:', Array.isArray(data));
                console.log('Data length:', data ? data.length : 'null/undefined');

                allVehicles = data;
                filteredVehicles = [...allVehicles];

                console.log('allVehicles set to:', allVehicles);
                console.log('filteredVehicles set to:', filteredVehicles);

                // Populate filter dropdowns with unique values from backend
                populateFilterOptions();

                displayVehicles(filteredVehicles);
                return; // Success, exit function
            } else {
                console.log(`❌ Failed with status ${response.status} for: ${endpoint}`);
                lastError = new Error(`HTTP ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Error with endpoint ${endpoint}:`, error.message);
            lastError = error;
        }
    }

    // If we get here, all endpoints failed
    console.error("=== ALL ENDPOINTS FAILED ===");
    console.error("Last error:", lastError);
    showError("Failed to load vehicles. Please check if the server is running and the endpoint is correct.");
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
                    <span class="feature-tag">${vehicle.vehicleType || "Vehicle"}</span>
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
function performSearch() {
    // Same as searchVehicles but also applies filters
    applyFilters();
}

function searchVehicles() {
    const vehicleType = document.getElementById('vehicleType')?.value.toLowerCase();
    const pickupLocation = document.getElementById('pickupLocation')?.value.toLowerCase();
    
    let results = [...allVehicles];
    
    if (vehicleType) {
        results = results.filter(vehicle => {
            // Search by vehicle type (Car, SUV, Van) or by vehicle name (brand + model)
            const vehicleName = `${vehicle.vehicleBrand} ${vehicle.vehicleModel}`.toLowerCase();
            const type = (vehicle.vehicleType || '').toLowerCase();
            return type === vehicleType || vehicleName.includes(vehicleType);
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
    const priceMin = parseInt(document.getElementById('priceMin')?.value || 0);
    const priceMax = parseInt(document.getElementById('priceMax')?.value || 100000);
    const companyFilter = document.getElementById('companyFilter')?.value;
    const fuelType = document.getElementById('fuelType')?.value.toLowerCase();
    const seats = document.getElementById('seats')?.value;
    const vehicleType = document.getElementById('vehicleType')?.value.toLowerCase();
    const pickupLocation = document.getElementById('pickupLocation')?.value.toLowerCase();

    let filtered = [...allVehicles];

    // Price Range Filter
    filtered = filtered.filter(v =>
        v.pricePerDay >= priceMin && v.pricePerDay <= priceMax
    );

    // Vehicle Type Filter
    if (vehicleType) {
        filtered = filtered.filter(v => {
            const type = (v.vehicleType || '').toLowerCase();
            const vehicleName = `${v.vehicleBrand} ${v.vehicleModel}`.toLowerCase();
            return type === vehicleType || vehicleName.includes(vehicleType);
        });
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

    // Pickup Location Filter
    if (pickupLocation) {
        filtered = filtered.filter(v =>
            v.location && v.location.toLowerCase().includes(pickupLocation)
        );
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
    const fuelType = document.getElementById('fuelType');
    const seats = document.getElementById('seats');
    const companyFilter = document.getElementById('companyFilter');
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const priceFromInput = document.getElementById('priceFromInput');
    const priceToInput = document.getElementById('priceToInput');

    if (vehicleType) vehicleType.value = '';
    if (pickupLocation) pickupLocation.value = '';
    if (fuelType) fuelType.value = '';
    if (seats) seats.value = '';
    if (companyFilter) companyFilter.value = '';

    // Reset price sliders
    if (priceMin) priceMin.value = 0;
    if (priceMax) priceMax.value = 100000;
    if (priceFromInput) priceFromInput.value = 0;
    if (priceToInput) priceToInput.value = 100000;

    // Update slider display
    const priceValueFrom = document.getElementById('priceValueFrom');
    const priceValueTo = document.getElementById('priceValueTo');
    const sliderRange = document.getElementById('sliderRange');

    if (priceValueFrom) priceValueFrom.textContent = '0';
    if (priceValueTo) priceValueTo.textContent = '100000';
    if (sliderRange) {
        sliderRange.style.left = '0%';
        sliderRange.style.width = '100%';
    }

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
    initializePriceSlider();
});

// ========================================
// Price Range Slider Functionality
// ========================================
function initializePriceSlider() {
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const priceFromInput = document.getElementById('priceFromInput');
    const priceToInput = document.getElementById('priceToInput');
    const priceValueFrom = document.getElementById('priceValueFrom');
    const priceValueTo = document.getElementById('priceValueTo');
    const sliderRange = document.getElementById('sliderRange');

    if (!priceMin || !priceMax) return;

    // Update display when sliders move
    function updateSlider() {
        let minVal = parseInt(priceMin.value);
        let maxVal = parseInt(priceMax.value);

        // Ensure min is not greater than max
        if (minVal > maxVal - 1000) {
            if (this === priceMin) {
                priceMin.value = maxVal - 1000;
                minVal = maxVal - 1000;
            } else {
                priceMax.value = minVal + 1000;
                maxVal = minVal + 1000;
            }
        }

        // Update display values
        if (priceValueFrom) priceValueFrom.textContent = minVal.toLocaleString();
        if (priceValueTo) priceValueTo.textContent = maxVal.toLocaleString();
        if (priceFromInput) priceFromInput.value = minVal;
        if (priceToInput) priceToInput.value = maxVal;

        // Update visual slider range
        if (sliderRange) {
            const percentMin = (minVal / 100000) * 100;
            const percentMax = (maxVal / 100000) * 100;
            sliderRange.style.left = percentMin + '%';
            sliderRange.style.width = (percentMax - percentMin) + '%';
        }
    }

    // Update sliders when input fields change
    function updateFromInput() {
        let minVal = parseInt(priceFromInput.value) || 0;
        let maxVal = parseInt(priceToInput.value) || 100000;

        // Validate range
        minVal = Math.max(0, Math.min(minVal, 100000));
        maxVal = Math.max(0, Math.min(maxVal, 100000));

        if (minVal > maxVal - 1000) {
            minVal = maxVal - 1000;
        }

        priceMin.value = minVal;
        priceMax.value = maxVal;
        updateSlider();
    }

    // Add event listeners
    priceMin.addEventListener('input', updateSlider);
    priceMax.addEventListener('input', updateSlider);

    if (priceFromInput) {
        priceFromInput.addEventListener('change', updateFromInput);
    }
    if (priceToInput) {
        priceToInput.addEventListener('change', updateFromInput);
    }

    // Initialize slider display
    updateSlider();
}

