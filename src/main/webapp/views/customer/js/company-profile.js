const API_BASE = window.location.pathname.includes('/RideMachan/') ? '/RideMachan' : '';
let currentCompany = null;
let currentVehicles = [];

function apiUrl(path) {
    return `${API_BASE}${path}`;
}

// Clear old company data to prevent stale loads
function clearCompanyCache() {
    sessionStorage.removeItem('selectedCompanyId');
    sessionStorage.removeItem('companyId');
}

function getCompanyId() {
    const params = new URLSearchParams(window.location.search);
    const urlCompanyId = params.get('companyId');

    if (!urlCompanyId) {
        console.error('❌ ERROR: No companyId in URL. Expected: ?companyId=<id>');
        showNotification('Invalid company URL. Please navigate from the company list.', 'warning');
        setTimeout(() => {
            window.location.href = 'search.html';
        }, 2000);
        return null;
    }

    console.log('✓ Loading company ID:', urlCompanyId);
    return urlCompanyId;
}

function safeText(value, fallback = 'N/A') {
    return value === null || value === undefined || value === '' ? fallback : String(value);
}

function normalizeList(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        return value
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
    }
    return [];
}

function formatCurrency(value) {
    const amount = Number(value);
    return Number.isFinite(amount) ? `LKR ${amount.toLocaleString()}` : 'LKR N/A';
}

function getInitials(name) {
    return (name || 'C')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join('');
}

// Load components function
function loadComponent(elementId, filePath) {
    return fetch(filePath)
        .then(response => response.text())
        .then(data => {
            const container = document.getElementById(elementId);
            if (container) container.innerHTML = data;

            if (elementId === 'header-container') {
                return new Promise(resolve => {
                    loadHeaderScript(() => {
                        if (typeof initializeHeader === 'function') initializeHeader();
                        if (typeof setPageTitle === 'function') setPageTitle('Company Profile');

                        // Add back button (your existing logic)
                        const headerLeft = document.querySelector('.header .hi');
                        if (headerLeft && !headerLeft.querySelector('.back-btn')) {
                            const backBtn = document.createElement('button');
                            backBtn.className = 'back-btn';
                            backBtn.onclick = goBack;
                            backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back';
                            headerLeft.style.display = 'flex';
                            headerLeft.style.alignItems = 'center';
                            headerLeft.style.gap = '20px';
                            headerLeft.insertBefore(backBtn, headerLeft.firstChild);
                        }
                        resolve();
                    });
                });
            }
        })
        .catch(error => console.error('Error loading component:', error));
}

function loadHeaderScript(cb) {
    if (window.initializeHeader) { cb(); return; }
    const s = document.createElement('script');
    s.src = '../components/header.js';
    s.onload = cb;
    s.onerror = () => { console.error('Failed to load header.js'); cb(); };
    document.head.appendChild(s);
}

function updateStars(containerId, rating) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const value = Number(rating) || 0;
    let starsHTML = '';

    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(value)) {
            starsHTML += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(value) && value % 1 !== 0) {
            starsHTML += '<i class="fas fa-star-half-alt"></i>';
        } else {
            starsHTML += '<i class="far fa-star"></i>';
        }
    }

    container.innerHTML = starsHTML;
}

function renderList(containerId, items, fallbackHtml) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!items || !items.length) {
        container.innerHTML = fallbackHtml;
        return;
    }

    container.innerHTML = items.map(item => {
        if (typeof item === 'string') {
            return item;
        }

        const icon = item.icon || 'fa-circle-check';
        const label = item.label || item.name || item.title || '';
        return `
            <div class="service-item">
                <i class="fas ${icon}"></i>
                <span>${label}</span>
            </div>
        `;
    }).join('');
}

function renderCompanyStats(company, vehicleCount) {
    const container = document.getElementById('companyStats');
    if (!container) return;

    const totalVehicles = company.totalVehicles || vehicleCount || 0;
    const happyCustomers = company.happyCustomers || company.customers || company.totalCustomers || '—';
    const yearsInService = company.yearsInService || '—';

    container.innerHTML = `
        <div class="stat-item">
            <div class="stat-number">${totalVehicles}</div>
            <div class="stat-label">Total Vehicles</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${happyCustomers}</div>
            <div class="stat-label">Happy Customers</div>
        </div>
        <div class="stat-item">
            <div class="stat-number">${yearsInService}</div>
            <div class="stat-label">Years in Service</div>
        </div>
    `;
}

// Function to load company details from backend
async function loadCompanyProfile() {
    const companyId = getCompanyId();

    if (!companyId) {
        console.error('❌ No company ID found');
        showNotification('Company ID not specified', 'error');
        return;
    }

    console.log('🚀 Starting company profile load for ID:', companyId);

    try {
        // Fetch company details
        const detailsUrl = `${apiUrl('/customer/company-details')}?companyId=${encodeURIComponent(companyId)}`;
        console.log('📡 Fetching company details from:', detailsUrl);

        const detailsResponse = await fetch(detailsUrl);
        console.log('📊 Response status:', detailsResponse.status);

        if (!detailsResponse.ok) {
            throw new Error(`HTTP ${detailsResponse.status}: ${detailsResponse.statusText}`);
        }

        const detailsJson = await detailsResponse.json();
        console.log('✅ Company details JSON received:', detailsJson);

        // Check success flag
        if (detailsJson?.success === false) {
            throw new Error(detailsJson?.message || 'Backend returned error');
        }

        const companyPayload = detailsJson;

        if (!companyPayload?.companyid) {
            throw new Error('Invalid company data: missing companyid');
        }

        console.log('✅ Company loaded:', companyPayload.companyname);
        currentCompany = companyPayload;

        // Fetch vehicles
        const vehiclesUrl = `${apiUrl('/customer/company-vehicles')}?companyId=${encodeURIComponent(companyId)}`;
        console.log('📡 Fetching vehicles from:', vehiclesUrl);

        let vehiclesList = [];
        try {
            const vehiclesResponse = await fetch(vehiclesUrl);
            if (vehiclesResponse.ok) {
                const vehiclesJson = await vehiclesResponse.json();
                console.log('✅ Vehicles JSON received, count:', Array.isArray(vehiclesJson) ? vehiclesJson.length : 0);
                vehiclesList = Array.isArray(vehiclesJson) ? vehiclesJson : [];
            }
        } catch (vehicleError) {
            console.warn('⚠️ Vehicle fetch error:', vehicleError);
            vehiclesList = [];
        }

        currentVehicles = vehiclesList;

        // Update page title
        const companyName = safeText(companyPayload.companyname, 'Company Profile');
        document.title = `${companyName} - Ride Machan`;

        // Update header
        const nameEl = document.getElementById('companyName');
        if (nameEl) nameEl.textContent = companyName;

        const aboutNameEl = document.getElementById('aboutCompanyName');
        if (aboutNameEl) aboutNameEl.textContent = companyName;
        if (typeof setPageTitle === 'function') setPageTitle(companyName);

        // Location
        const location = safeText(companyPayload.city, 'Sri Lanka');
        const locationEl = document.getElementById('companyLocation');
        if (locationEl) locationEl.textContent = location;

        // Description
        const description = safeText(companyPayload.description, 'Professional vehicle rental service.');
        const descEl = document.getElementById('companyDescription');
        if (descEl) descEl.textContent = description;

        // Meta info
        const metaEl = document.getElementById('companyMeta');
        if (metaEl) {
            metaEl.innerHTML = `
                <span>Registration: ${safeText(companyPayload.registrationnumber, '—')}</span>
                <span>City: ${location}</span>
            `;
        }

        // Contact info
        const phone = safeText(companyPayload.phone);
        const email = safeText(companyPayload.companyemail);
        const address = [companyPayload.street, companyPayload.city, 'Sri Lanka']
            .filter(Boolean).join(', ') || 'N/A';

        const contactInfo = document.getElementById('contactInfo');
        if (contactInfo) {
            let contactHTML = '';

            if (phone !== 'N/A') {
                contactHTML += `
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <span>${phone}</span>
                    </div>
                `;
            }

            if (email !== 'N/A') {
                contactHTML += `
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <span>${email}</span>
                    </div>
                `;
            }

            if (address !== 'N/A') {
                contactHTML += `
                    <div class="contact-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${address}</span>
                    </div>
                `;
            }

            contactInfo.innerHTML = contactHTML || '<p style="color: var(--text-light);">No contact info available</p>';
        }

        // Rating
        const ratingEl = document.getElementById('companyRating');
        if (ratingEl) ratingEl.textContent = '4.5 (0 reviews)';

        const iconEl = document.getElementById('companyIcon');
        if (iconEl) iconEl.className = 'fas fa-building';

        updateStars('companyStars', 4.5);

        // Services
        renderList('servicesGrid', [
            { icon: 'fa-headset', label: '24/7 Customer Support' },
            { icon: 'fa-truck', label: 'Free Delivery & Pickup' },
            { icon: 'fa-shield-alt', label: 'Comprehensive Insurance' },
            { icon: 'fa-star', label: 'Best Price Guarantee' }
        ], '');

        // Certifications
        renderList('certifications', [
            { icon: 'fa-check-circle', label: 'Licensed by Tourism Board' },
            { icon: 'fa-check-circle', label: 'Fully Insured Fleet' }
        ], '');

        // Stats
        renderCompanyStats(companyPayload, vehiclesList.length);

        // Fleet grid
        const fleetGrid = document.getElementById('fleetGrid');
        if (fleetGrid) {
            if (vehiclesList.length > 0) {
                fleetGrid.innerHTML = vehiclesList.map(vehicle => {
                    const vehicleId = vehicle.vehicleid || vehicle.vehicleId || vehicle.id;
                    const vehicleName = safeText(vehicle.name, 'Vehicle');
                    const vehicleType = safeText(vehicle.type, 'Car');
                    const seats = safeText(vehicle.seats || vehicle.capacity, '—');
                    const price = formatCurrency(vehicle.price || vehicle.rent);

                    return `
                        <div class="fleet-item" onclick="viewVehicleDetails(${vehicleId})">
                            <h4>${vehicleName}</h4>
                            <div class="fleet-details">
                                <span class="seats">${vehicleType} • ${seats} seats</span>
                                <span class="price">${price}/day</span>
                            </div>
                            <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); viewVehicleDetails(${vehicleId})">
                                View Details
                            </button>
                        </div>
                    `;
                }).join('');
            } else {
                fleetGrid.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 20px;">No vehicles available</p>';
            }
        }

        console.log('✅ Company profile loaded successfully!');
        showNotification('Company loaded successfully!', 'success');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);

        showNotification(`Error: ${error.message}`, 'error');

        const fleetGrid = document.getElementById('fleetGrid');
        if (fleetGrid) {
            fleetGrid.innerHTML = `
                <div style="padding: 20px; background: #fee; border-radius: 8px; color: #c00; text-align: center;">
                    <h4>⚠️ Error Loading Company</h4>
                    <p>${error.message}</p>
                    <small>Check F12 Console for logs</small>
                </div>
            `;
        }
    }
}

function contactCompany() {
    if (currentCompany) {
        showNotification(
            `Call: ${safeText(currentCompany.phone)} | Email: ${safeText(currentCompany.companyemail)}`,
            'info'
        );
    }
}

function bookNow() {
    const companyId = getCompanyId();
    if (companyId) {
        sessionStorage.setItem('selectedCompanyId', companyId);
    }
    showNotification('Redirecting to booking...', 'success');
    setTimeout(() => {
        window.location.href = `search.html?companyId=${companyId}`;
    }, 1000);
}

function viewVehicleDetails(vehicleId) {
    sessionStorage.setItem('selectedVehicleId', vehicleId);
    window.location.href = 'vehicle-profile.html';
}

function goBack() {
    window.history.back();
}

function writeReview() {
    showNotification('Review feature coming soon!', 'info');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196f3'};
        color: white;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10000;
        font-weight: 500;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    clearCompanyCache();
    console.log('🚀 Page loading, API_BASE:', API_BASE);

    await Promise.all([
        loadComponent('navbar-container', '../components/navbar.html'),
        loadComponent('header-container', '../components/header.html')
    ]);

    await loadCompanyProfile();
});

// Add hover effects to interactive elements
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('fleet-item') || e.target.closest('.fleet-item')) {
        const fleetItem = e.target.classList.contains('fleet-item') ? e.target : e.target.closest('.fleet-item');
        fleetItem.style.transform = 'scale(0.98)';
        setTimeout(() => {
            fleetItem.style.transform = 'translateY(-2px)';
        }, 100);
    }
});