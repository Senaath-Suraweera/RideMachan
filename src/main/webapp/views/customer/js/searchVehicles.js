// ========================================
// Global Variables
// ========================================
let allVehicles = [];
let filteredVehicles = [];
let companiesMap = {};      // id  → name  (populated from /customer/getCompanies)
let companyNameToId = {};   // name → id   (reverse map, built at the same time)

// ========================================
// 1. Boot sequence — load companies first,
//    then load vehicles (vehicles need the map)
// ========================================
document.addEventListener('DOMContentLoaded', function () {
    loadCompaniesAndVehicles();
    initializePriceSlider();
});

async function loadCompaniesAndVehicles() {
    await loadCompanies();   // must finish before vehicles so the map is ready
    await loadVehicles();
}

// ========================================
// 2. Fetch Companies from Backend
//    GET /customer/getCompanies
//    Returns: [{ "id": 1, "name": "Premium Rentals" }, ...]
// ========================================
async function loadCompanies() {
    const contextPath = window.location.pathname.substring(0, window.location.pathname.indexOf('/', 1));
    const endpoints = [
        `${window.location.origin}${contextPath}/customer/getCompanies`,
        '/customer/getCompanies',
        `${window.location.origin}/customer/getCompanies`
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, { credentials: 'include' });
            if (response.ok) {
                const companies = await response.json();
                companies.forEach(c => {
                    companiesMap[c.id]      = c.name;
                    companyNameToId[c.name] = c.id;
                });
                console.log('✅ Companies loaded:', companiesMap);
                return;
            }
        } catch (e) {
            console.warn(`Company endpoint ${endpoint} failed:`, e.message);
        }
    }
    console.error('❌ All company endpoints failed — company names will fall back to IDs');
}

// ========================================
// 3. Get Company Name by ID
//    Uses the live map; falls back gracefully
// ========================================
function getCompanyName(companyId) {
    return companiesMap[companyId] || `Company #${companyId}`;
}

// ========================================
// 4. Populate Filter Dropdowns from Vehicle Data
// ========================================
function populateFilterOptions() {
    if (!allVehicles || allVehicles.length === 0) return;

    const vehicleTypes = [...new Set(allVehicles.map(v => v.vehicleType).filter(Boolean).map(t => t.trim()))].sort();
    const locations    = [...new Set(allVehicles.map(v => v.location).filter(Boolean).map(l => l.trim()))].sort();
    const fuelTypes    = [...new Set(allVehicles.map(v => v.fuelType).filter(Boolean).map(f => f.trim()))].sort();
    const seatCounts   = [...new Set(allVehicles.map(v => v.numberOfPassengers).filter(s => s && s > 0))].sort((a, b) => a - b);

    // Companies — built from the live companiesMap
    const companies = Object.entries(companiesMap)
        .map(([id, name]) => ({ id: parseInt(id), name }))
        .sort((a, b) => a.name.localeCompare(b.name));

    _populateSelect('vehicleType',    vehicleTypes, t => ({ value: t.toLowerCase(), text: t }), 'All Types');
    _populateSelect('pickupLocation', locations,    l => ({ value: l.toLowerCase(), text: l }), 'All Locations');
    _populateSelect('fuelType',       fuelTypes,    f => ({ value: f.toLowerCase(), text: f }), 'All Fuel Types');
    _populateSelect('companyFilter',  companies,    c => ({ value: c.name,          text: c.name }), 'All Companies');

    const seatsSelect = document.getElementById('seats');
    if (seatsSelect) {
        seatsSelect.innerHTML = '<option value="">Any</option>';
        seatCounts.forEach(s => {
            const opt = document.createElement('option');
            opt.value = s; opt.textContent = s;
            seatsSelect.appendChild(opt);
        });
        const maxSeats = Math.max(...seatCounts);
        if (maxSeats >= 7) {
            const opt = document.createElement('option');
            opt.value = '7+'; opt.textContent = '7+';
            seatsSelect.appendChild(opt);
        }
    }
}

function _populateSelect(id, items, mapper, defaultLabel) {
    const sel = document.getElementById(id);
    if (!sel) return;
    sel.innerHTML = `<option value="">${defaultLabel}</option>`;
    items.forEach(item => {
        const { value, text } = mapper(item);
        const opt = document.createElement('option');
        opt.value = value; opt.textContent = text;
        sel.appendChild(opt);
    });
}

// ========================================
// 5. Fetch Vehicles from Backend
//    GET /customer/search/vehicle
// ========================================
async function loadVehicles() {
    const contextPath = window.location.pathname.substring(0, window.location.pathname.indexOf('/', 1));
    const baseUrl = `${window.location.origin}${contextPath}`;
    const endpoints = [
        `${baseUrl}/customer/search/vehicle`,
        '/customer/search/vehicle',
        `${window.location.origin}/customer/search/vehicle`
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint, { credentials: 'include' });
            if (response.ok) {
                const data = await response.json();
                allVehicles      = data;
                filteredVehicles = [...allVehicles];
                populateFilterOptions();
                displayVehicles(filteredVehicles);
                return;
            }
        } catch (e) {
            console.warn(`Vehicle endpoint ${endpoint} failed:`, e.message);
        }
    }

    showError('Failed to load vehicles. Please check if the server is running.');
}

// ========================================
// 6. Display Vehicles in Search Results
// ========================================
function displayVehicles(vehicles) {
    const container = document.getElementById('searchResults');
    if (!container) return;

    container.innerHTML = '';

    if (vehicles.length === 0) {
        container.innerHTML = `
            <p style="text-align:center;color:var(--text-light);padding:40px;">
                No vehicles found matching your criteria.
            </p>`;
        return;
    }

    vehicles.forEach(vehicle => {
        const card = document.createElement('div');
        card.className = 'vehicle-card';
        card.onclick = () => viewVehicle(vehicle.vehicleId);

        const companyName = getCompanyName(vehicle.companyId);

        // Build image URL using the real servlet endpoint
        const imageUrl = `/vehicle/image?vehicleid=${vehicle.vehicleId}`;

        card.innerHTML = `
            <div class="vehicle-image">
                <img
                    src="${imageUrl}"
                    alt="${vehicle.vehicleBrand} ${vehicle.vehicleModel}"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    style="width:100%;height:100%;object-fit:cover;border-radius:8px 8px 0 0;"
                />
                <div class="vehicle-image-fallback" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;">
                    <i class="fas fa-car" style="font-size:48px;color:var(--text-light);"></i>
                </div>
            </div>

            <div class="vehicle-info">
                <h4>${vehicle.vehicleBrand} ${vehicle.vehicleModel}</h4>

                <p class="price">
                    LKR ${vehicle.pricePerDay ? vehicle.pricePerDay.toLocaleString() : 'N/A'}/day
                </p>

                <p class="category"
                   style="cursor:pointer;color:var(--primary);text-decoration:underline;"
                   onclick="event.stopPropagation(); viewCompany(${vehicle.companyId})">
                   ${companyName}
                </p>

                <!-- Location from vehicle data -->
                <p class="location">
                    <i class="fas fa-map-marker-alt" style="margin-right:4px;"></i>
                    ${vehicle.location || 'Sri Lanka'}
                </p>

                <!-- Dynamic rating loaded asynchronously -->
                <div class="rating" id="rating-${vehicle.vehicleId}">
                    <div class="stars">${generateStars(0)}</div>
                    <span class="review-count">Loading...</span>
                </div>

                <div class="seats-info">
                    <i class="fas fa-users"></i>
                    ${vehicle.numberOfPassengers} seats
                </div>

                <div class="features">
                    <span class="feature-tag">${vehicle.fuelType || 'Fuel'}</span>
                    <span class="feature-tag">${vehicle.vehicleType || 'Vehicle'}</span>
                    ${vehicle.availabilityStatus === 'available'
            ? '<span class="feature-tag available-tag">Available</span>'
            : ''}
                </div>
            </div>
        `;

        container.appendChild(card);

        // Load rating asynchronously so cards appear instantly
        loadVehicleRating(vehicle.vehicleId);
    });
}

// ========================================
// 7. Load Vehicle Rating Asynchronously
//    GET /ratings/actor?actorType=VEHICLE&actorId=X
// ========================================
async function loadVehicleRating(vehicleId) {
    const ratingEl = document.getElementById(`rating-${vehicleId}`);
    if (!ratingEl) return;

    try {
        const response = await fetch(`/ratings/actor?actorType=VEHICLE&actorId=${vehicleId}`, {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                const avg   = parseFloat(data.average) || 0;
                const total = data.total || 0;
                const label = total > 0
                    ? `${avg.toFixed(1)} (${total} review${total !== 1 ? 's' : ''})`
                    : 'No reviews yet';

                ratingEl.innerHTML = `
                    <div class="stars">${generateStars(avg)}</div>
                    <span class="review-count">${label}</span>
                `;
                return;
            }
        }
    } catch (e) {
        // Silently fall through to default
    }

    // Fallback when ratings endpoint unavailable
    ratingEl.innerHTML = `
        <div class="stars">${generateStars(0)}</div>
        <span class="review-count">No reviews yet</span>
    `;
}

// ========================================
// 8. Generate Star Rating HTML (supports decimals)
// ========================================
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(rating) && rating % 1 >= 0.5) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

// ========================================
// 9. Search Vehicles
// ========================================
function performSearch() {
    applyFilters();
}

function searchVehicles() {
    applyFilters();
}

// ========================================
// 10. Apply Filters
// ========================================
function applyFilters() {
    const priceMin      = parseInt(document.getElementById('priceMin')?.value       || 0);
    const priceMax      = parseInt(document.getElementById('priceMax')?.value       || 100000);
    const companyFilter = document.getElementById('companyFilter')?.value           || '';
    const fuelType      = (document.getElementById('fuelType')?.value               || '').toLowerCase();
    const seats         = document.getElementById('seats')?.value                   || '';
    const vehicleType   = (document.getElementById('vehicleType')?.value            || '').toLowerCase();
    const pickupLoc     = (document.getElementById('pickupLocation')?.value         || '').toLowerCase();

    let filtered = [...allVehicles];

    // Price
    filtered = filtered.filter(v => v.pricePerDay >= priceMin && v.pricePerDay <= priceMax);

    // Vehicle type
    if (vehicleType) {
        filtered = filtered.filter(v => {
            const type = (v.vehicleType || '').toLowerCase();
            const name = `${v.vehicleBrand} ${v.vehicleModel}`.toLowerCase();
            return type === vehicleType || name.includes(vehicleType);
        });
    }

    // Company — use the live reverse map (no hardcoding)
    if (companyFilter) {
        const companyId = companyNameToId[companyFilter];
        if (companyId) {
            filtered = filtered.filter(v => v.companyId === companyId);
        }
    }

    // Fuel type
    if (fuelType) {
        filtered = filtered.filter(v => (v.fuelType || '').toLowerCase() === fuelType);
    }

    // Seats
    if (seats) {
        if (seats === '7+') {
            filtered = filtered.filter(v => v.numberOfPassengers >= 7);
        } else {
            filtered = filtered.filter(v => v.numberOfPassengers == parseInt(seats));
        }
    }

    // Pickup location — uses real v.location field
    if (pickupLoc) {
        filtered = filtered.filter(v =>
            v.location && v.location.toLowerCase().includes(pickupLoc)
        );
    }

    filteredVehicles = filtered;
    displayVehicles(filteredVehicles);
}

// ========================================
// 11. Clear All Filters
// ========================================
function clearAllFilters() {
    ['vehicleType', 'pickupLocation', 'fuelType', 'seats', 'companyFilter'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const priceMin      = document.getElementById('priceMin');
    const priceMax      = document.getElementById('priceMax');
    const priceFromInput = document.getElementById('priceFromInput');
    const priceToInput   = document.getElementById('priceToInput');
    const priceValueFrom = document.getElementById('priceValueFrom');
    const priceValueTo   = document.getElementById('priceValueTo');
    const sliderRange    = document.getElementById('sliderRange');

    if (priceMin)      priceMin.value      = 0;
    if (priceMax)      priceMax.value      = 100000;
    if (priceFromInput) priceFromInput.value = 0;
    if (priceToInput)   priceToInput.value   = 100000;
    if (priceValueFrom) priceValueFrom.textContent = '0';
    if (priceValueTo)   priceValueTo.textContent   = '100000';
    if (sliderRange) { sliderRange.style.left = '0%'; sliderRange.style.width = '100%'; }

    filteredVehicles = [...allVehicles];
    displayVehicles(filteredVehicles);
    showNotification('All filters cleared!', 'info');
}

// ========================================
// 12. View Vehicle Details
// ========================================
function viewVehicle(vehicleId) {
    const vehicle = allVehicles.find(v => v.vehicleId === vehicleId);
    if (vehicle) {
        try {
            sessionStorage.setItem('selectedVehicle', JSON.stringify(vehicle));
            sessionStorage.setItem('searchData', JSON.stringify({
                vehicleType:     document.getElementById('vehicleType')?.value     || '',
                pickupLocation:  document.getElementById('pickupLocation')?.value  || '',
                dropoffLocation: document.getElementById('dropoffLocation')?.value || '',
                fromDateTime:    document.getElementById('fromDateTime')?.value    || '',
                toDateTime:      document.getElementById('toDateTime')?.value      || ''
            }));
        } catch (e) {
            console.log('SessionStorage not available:', e);
        }
        window.location.href = `vehicle-profile.html?id=${vehicleId}`;
    }
}

// ========================================
// 13. View Company Profile
// ========================================
function viewCompany(companyId) {
    window.location.href = 'company-profile.html?companyId=' + companyId;
}

// ========================================
// 14. Send Message Popup
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

function sendMessageAction(vehicleId) {
    const messageInput = document.querySelector('.message-input');
    if (messageInput && messageInput.value.trim()) {
        showNotification('Message sent successfully!', 'success');
        closePopup();
    } else {
        showNotification('Please enter a message before sending.', 'error');
    }
}

function closePopup() {
    const popup = document.querySelector('.popup-overlay');
    if (popup) popup.remove();
}

// ========================================
// 15. UI Helpers
// ========================================
function showError(message) {
    const container = document.getElementById('searchResults');
    if (container) {
        container.innerHTML = `
            <div style="text-align:center;padding:40px;">
                <i class="fas fa-exclamation-circle" style="font-size:48px;color:var(--danger);margin-bottom:15px;"></i>
                <p style="color:var(--text);font-size:18px;">${message}</p>
            </div>`;
    }
}

function showNotification(message, type = 'info') {
    const colors = { success: '#4caf50', error: '#f44336', info: '#2196f3' };
    const icons  = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const n = document.createElement('div');
    n.style.cssText = `
        position:fixed;top:20px;right:20px;background:${colors[type]};color:white;
        padding:15px 20px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,.15);
        z-index:9999;animation:slideInRight .3s ease;max-width:300px;
        display:flex;align-items:center;gap:10px;`;
    n.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
    document.body.appendChild(n);
    setTimeout(() => {
        n.style.animation = 'slideOutRight .3s ease';
        setTimeout(() => n.remove(), 300);
    }, 3000);
}

// ========================================
// 16. Price Range Slider
// ========================================
function initializePriceSlider() {
    const priceMin      = document.getElementById('priceMin');
    const priceMax      = document.getElementById('priceMax');
    const priceFromInput = document.getElementById('priceFromInput');
    const priceToInput   = document.getElementById('priceToInput');
    const priceValueFrom = document.getElementById('priceValueFrom');
    const priceValueTo   = document.getElementById('priceValueTo');
    const sliderRange    = document.getElementById('sliderRange');

    if (!priceMin || !priceMax) return;

    function updateSlider() {
        let minVal = parseInt(priceMin.value);
        let maxVal = parseInt(priceMax.value);

        if (minVal > maxVal - 1000) {
            if (this === priceMin) { priceMin.value = maxVal - 1000; minVal = maxVal - 1000; }
            else                   { priceMax.value = minVal + 1000; maxVal = minVal + 1000; }
        }

        if (priceValueFrom) priceValueFrom.textContent = minVal.toLocaleString();
        if (priceValueTo)   priceValueTo.textContent   = maxVal.toLocaleString();
        if (priceFromInput) priceFromInput.value        = minVal;
        if (priceToInput)   priceToInput.value          = maxVal;

        if (sliderRange) {
            sliderRange.style.left  = (minVal / 100000 * 100) + '%';
            sliderRange.style.width = ((maxVal - minVal) / 100000 * 100) + '%';
        }
    }

    function updateFromInput() {
        let minVal = Math.max(0, Math.min(parseInt(priceFromInput.value) || 0,      100000));
        let maxVal = Math.max(0, Math.min(parseInt(priceToInput.value)   || 100000, 100000));
        if (minVal > maxVal - 1000) minVal = maxVal - 1000;
        priceMin.value = minVal;
        priceMax.value = maxVal;
        updateSlider();
    }

    priceMin.addEventListener('input', updateSlider);
    priceMax.addEventListener('input', updateSlider);
    if (priceFromInput) priceFromInput.addEventListener('change', updateFromInput);
    if (priceToInput)   priceToInput.addEventListener('change', updateFromInput);

    updateSlider();
}