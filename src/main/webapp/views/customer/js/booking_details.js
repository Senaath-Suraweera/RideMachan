// booking_details.js — connected to backend
// Fetches booking details from /customer/booking-details?id=<rideId>

// Global variables
let currentBooking = null;

// ─────────────────────────────────────────────
// Component loader (unchanged)
// ─────────────────────────────────────────────
function loadComponent(elementId, filePath, callback) {
    fetch(filePath)
        .then(response => response.text())
        .then(html => {
            document.getElementById(elementId).innerHTML = html;
            if (callback) callback();
        })
        .catch(error => console.error('Error loading component:', error));
}

// ─────────────────────────────────────────────
// Page init
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    loadComponent('navbar-container', '../components/navbar.html', () => {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));
        const bookingsNav = document.querySelector('[data-page="bookings"]');
        if (bookingsNav) bookingsNav.classList.add('active');
    });

    loadComponent('header-container', '../components/header.html', () => {
        const pageTitle = document.querySelector('.hi h1');
        if (pageTitle) {
            pageTitle.textContent = 'Booking Details';
            const subtitle = document.querySelector('.subtitle');
            if (subtitle) subtitle.textContent = 'Complete information about your reservation';
        }
    });

    setTimeout(() => {
        loadBookingDetails();
    }, 100);
});

// ─────────────────────────────────────────────
// Fetch booking from backend
// ─────────────────────────────────────────────
function loadBookingDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const bookingId = urlParams.get('id');

    if (!bookingId) {
        showNotification('No booking ID provided', 'warning');
        setTimeout(() => (window.location.href = 'bookings.html'), 2000);
        return;
    }

    // Context path aware: works whether app is deployed at / or /RideMachan
    const ctx = window.location.pathname.split('/views/')[0];
    const url = `${ctx}/customer/booking-details?id=${encodeURIComponent(bookingId)}`;

    fetch(url, { credentials: 'same-origin' })
        .then(async response => {
            if (response.status === 401) {
                showNotification('Please login to view booking details', 'warning');
                setTimeout(() => (window.location.href = '../../login.html'), 1500);
                throw new Error('unauthorized');
            }
            if (response.status === 404) {
                showNotification('Booking not found', 'warning');
                setTimeout(() => (window.location.href = 'bookings.html'), 2000);
                throw new Error('not found');
            }
            if (!response.ok) {
                throw new Error('Server error (' + response.status + ')');
            }
            return response.json();
        })
        .then(data => {
            if (!data.success || !data.booking) {
                showNotification(data.message || 'Failed to load booking', 'error');
                return;
            }
            currentBooking = data.booking;
            renderBooking(currentBooking);
        })
        .catch(err => {
            if (err.message === 'unauthorized' || err.message === 'not found') return;
            console.error('Error loading booking details:', err);
            showNotification('Failed to load booking details', 'error');
        });
}

// ─────────────────────────────────────────────
// Render booking into the DOM
// ─────────────────────────────────────────────
function renderBooking(booking) {
    // Header
    document.getElementById('bookingId').textContent = booking.id;
    const statusBadge = document.getElementById('bookingStatus');
    statusBadge.textContent = booking.status || '-';
    statusBadge.className = 'status-badge';
    const s = (booking.status || '').toLowerCase();
    if (s === 'active' || s === 'confirmed' || s === 'pending') {
        statusBadge.style.background = 'rgba(16, 185, 129, 0.1)';
        statusBadge.style.color = '#10b981';
    } else if (s === 'completed') {
        statusBadge.style.background = 'rgba(72, 149, 239, 0.1)';
        statusBadge.style.color = '#4895ef';
    } else if (s === 'cancelled') {
        statusBadge.style.background = 'rgba(239, 68, 68, 0.1)';
        statusBadge.style.color = '#ef4444';
    }

    // Vehicle
    document.getElementById('vehicleName').textContent = booking.vehicle || '-';
    document.getElementById('companyName').textContent =
        (booking.company && booking.company.name) || '-';
    document.getElementById('vehicleTypeText').textContent = booking.vehicleType || '-';
    document.getElementById('vehiclePlateText').textContent = booking.vehiclePlate || '-';
    document.getElementById('rentalTypeText').textContent =
        booking.rentalType === 'with-driver' ? 'With Driver' : 'Self-Drive';

    // Vehicle features — overwrite the static placeholder if we got real data
    if (booking.vehicleFeatures) {
        const grid = document.getElementById('vehicleFeatures');
        if (grid) {
            const items = booking.vehicleFeatures
                .split(',')
                .map(f => f.trim())
                .filter(Boolean);
            if (items.length) {
                grid.innerHTML = items
                    .map(f => `<span class="feature"><i class="fas fa-check"></i> ${escapeHtml(f)}</span>`)
                    .join('');
            }
        }
    }

    // Schedule
    document.getElementById('pickupLocation').textContent = booking.pickup || '-';
    document.getElementById('dropoffLocation').textContent = booking.dropoff || '-';
    document.getElementById('pickupDate').innerHTML =
        `<i class="fas fa-calendar"></i> ${booking.pickupDate || '-'}`;
    document.getElementById('pickupTime').innerHTML =
        `<i class="fas fa-clock"></i> ${booking.pickupTime || '-'}`;
    document.getElementById('dropoffDate').innerHTML =
        `<i class="fas fa-calendar"></i> ${booking.dropoffDate || '-'}`;
    document.getElementById('dropoffTime').innerHTML =
        `<i class="fas fa-clock"></i> ${booking.dropoffTime || '-'}`;

    // Duration — simple hour diff from HH:mm strings
    const duration = computeDuration(booking.pickupTime, booking.dropoffTime);
    document.getElementById('durationText').textContent = duration;

    // Cost breakdown
    document.getElementById('baseFare').textContent =
        `LKR ${Math.round(booking.baseFare || 0).toLocaleString()}`;
    document.getElementById('driverCharges').textContent =
        `LKR ${Math.round(booking.driverCharges || 0).toLocaleString()}`;
    document.getElementById('serviceFee').textContent =
        `LKR ${Math.round(booking.serviceFee || 0).toLocaleString()}`;
    document.getElementById('totalAmount').textContent =
        `LKR ${Math.round(booking.amount || 0).toLocaleString()}`;
    document.getElementById('paymentStatusText').textContent = booking.paymentStatus || '-';

    // Driver vs self-drive
    if (booking.rentalType === 'self-drive') {
        document.getElementById('driverCard').style.display = 'none';
        document.getElementById('selfDriveCard').style.display = 'block';
        document.getElementById('driverChargesRow').style.display = 'none';
    } else {
        document.getElementById('driverCard').style.display = 'block';
        document.getElementById('selfDriveCard').style.display = 'none';
        document.getElementById('driverChargesRow').style.display = '';

        if (booking.driver) {
            const d = booking.driver;
            document.getElementById('driverPlaceholder').textContent = d.initial || '?';
            document.getElementById('driverName').textContent = d.name || '-';
            document.getElementById('driverRating').textContent = d.rating != null ? d.rating : '-';
            document.getElementById('driverReviews').textContent =
                d.reviews != null ? `(${d.reviews} reviews)` : '';
            document.getElementById('driverBio').textContent =
                d.bio || 'Professional driver assigned to this booking.';
            document.getElementById('driverTrips').textContent =
                d.trips != null ? `${d.trips}+ Trips` : '- Trips';
            document.getElementById('driverExperience').textContent =
                d.experience != null ? `${d.experience} Years Experience` : '- Years';
            document.getElementById('driverLanguages').textContent = d.languages || d.area || '-';

            window.currentDriverId = d.id;
        } else {
            // with-driver but none assigned yet
            document.getElementById('driverPlaceholder').textContent = '?';
            document.getElementById('driverName').textContent = 'Driver not assigned yet';
            document.getElementById('driverBio').textContent =
                'A driver will be assigned by the company shortly.';
        }
    }

    updateSupportModal(booking);
}

function computeDuration(startHHmm, endHHmm) {
    if (!startHHmm || !endHHmm) return '-';
    const [sh, sm] = startHHmm.split(':').map(Number);
    const [eh, em] = endHHmm.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} Hours` : `${h}h ${m}m`;
}

function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// ─────────────────────────────────────────────
// Support modal (unchanged behavior)
// ─────────────────────────────────────────────
function updateSupportModal(booking) {
    if (booking.driver) {
        document.getElementById('driverSupportOption').style.display = 'block';
        document.getElementById('driverContactInfo').innerHTML = `
            <strong>Name:</strong> ${booking.driver.name || '-'}<br>
            <strong>Phone:</strong> ${booking.driver.phone || '-'}
        `;
    } else {
        document.getElementById('driverSupportOption').style.display = 'none';
    }

    const c = booking.company || {};
    document.getElementById('companyContactInfo').innerHTML = `
        <strong>Company:</strong> ${c.name || '-'}<br>
        <strong>Phone:</strong> ${c.phone || '-'}<br>
        <strong>Email:</strong> ${c.email || '-'}
    `;
}

// ─────────────────────────────────────────────
// Navigation / action handlers (unchanged)
// ─────────────────────────────────────────────
function navigateToCompany() {
    if (currentBooking && currentBooking.company) {
        sessionStorage.setItem('selectedCompanyId', currentBooking.company.id);
        window.location.href = `company-profile.html?company=${currentBooking.company.id}`;
    }
}

function navigateToDriverProfile() {
    if (window.currentDriverId) {
        sessionStorage.setItem('selectedDriverId', window.currentDriverId);
        sessionStorage.setItem('previousPage', 'booking_details');
        window.location.href = 'driver-profile.html';
    }
}

function viewInvoice() {
    if (currentBooking) {
        sessionStorage.setItem('invoiceBookingId', currentBooking.id);
        window.location.href = `payment_status.html?id=${currentBooking.id}`;
    }
}

function callDriver() {
    if (currentBooking && currentBooking.driver) {
        showNotification(`Calling ${currentBooking.driver.name}...`, 'info');
        setTimeout(() => {
            window.location.href = `tel:${currentBooking.driver.phone}`;
        }, 1000);
    }
}

function messageDriver() {
    if (currentBooking && currentBooking.driver) {
        showNotification(`Opening message to ${currentBooking.driver.name}...`, 'info');
        setTimeout(() => {
            alert(`Message feature coming soon. You can call ${currentBooking.driver.name} at ${currentBooking.driver.phone}`);
        }, 1000);
    }
}

function contactSupport() {
    document.getElementById('supportModal').classList.add('show');
}
function closeSupportModal() {
    document.getElementById('supportModal').classList.remove('show');
}
function contactDriverPhone() {
    if (currentBooking && currentBooking.driver) {
        window.location.href = `tel:${currentBooking.driver.phone}`;
    }
}
function contactCompanyPhone() {
    if (currentBooking && currentBooking.company) {
        window.location.href = `tel:${currentBooking.company.phone}`;
    }
}
function contactAdmin() {
    window.location.href = 'tel:+94112345678';
}

function cancelBooking() {
    if (currentBooking &&
        ['Active', 'Confirmed', 'Pending'].includes(currentBooking.status)) {
        document.getElementById('cancelModal').classList.add('show');
    } else {
        showNotification('This booking cannot be cancelled', 'warning');
    }
}
function closeCancelModal() {
    document.getElementById('cancelModal').classList.remove('show');
}
function confirmCancel() {
    closeCancelModal();
    showNotification('Processing cancellation...', 'info');
    // TODO: hook this to your CustomerCancelBookingServlet
    setTimeout(() => {
        showNotification('Booking cancelled successfully', 'success');
        setTimeout(() => (window.location.href = 'bookings.html'), 2000);
    }, 1500);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type} show`;
    const iconClass =
        type === 'success' ? 'check-circle' :
            type === 'warning' ? 'exclamation-triangle' :
                type === 'error'   ? 'times-circle' : 'info-circle';
    notification.innerHTML = `<i class="fas fa-${iconClass}"></i><span>${message}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

window.onclick = function (event) {
    const cancelModal = document.getElementById('cancelModal');
    const supportModal = document.getElementById('supportModal');
    if (event.target === cancelModal) closeCancelModal();
    if (event.target === supportModal) closeSupportModal();
};