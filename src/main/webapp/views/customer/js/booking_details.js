// booking_details.js — connected to backend
// Fetches booking details from /customer/booking-details?id=<rideId>

// Global variables
let currentBooking = null;

// ─────────────────────────────────────────────
// Component loader
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
        loadHeaderScript(() => {
            if (typeof initializeHeader === 'function') initializeHeader();
            if (typeof setPageTitle === 'function') {
                setPageTitle('Booking Details');
            } else {
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) pageTitle.textContent = 'Booking Details';
            }
        });
    });

    function loadHeaderScript(cb) {
        if (window.initializeHeader) { cb(); return; }
        const s = document.createElement('script');
        s.src = '../components/header.js';
        s.onload = cb;
        s.onerror = () => { console.error('Failed to load header.js'); cb(); };
        document.head.appendChild(s);
    }

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
    const companyEl = document.getElementById('companyName');
    if (booking.company && booking.company.name && booking.company.id) {
        companyEl.textContent = booking.company.name;
        companyEl.style.cursor = 'pointer';
        companyEl.style.color = 'var(--primary)';
        companyEl.style.textDecoration = 'underline';
        companyEl.title = 'View company profile';
        companyEl.onclick = navigateToCompany;
    } else {
        companyEl.textContent = (booking.company && booking.company.name) || '-';
        companyEl.onclick = null;
    }
    document.getElementById('vehicleTypeText').textContent = booking.vehicleType || '-';
    document.getElementById('vehiclePlateText').textContent = booking.vehiclePlate || '-';
    document.getElementById('rentalTypeText').textContent =
        booking.rentalType === 'with-driver' ? 'With Driver' : 'Self-Drive';

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

    const duration = computeDuration(booking.pickupTime, booking.dropoffTime);
    document.getElementById('durationText').textContent = duration;

    // Cost
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
            document.getElementById('driverPlaceholder').textContent = '?';
            document.getElementById('driverName').textContent = 'Driver not assigned yet';
            document.getElementById('driverBio').textContent =
                'A driver will be assigned by the company shortly.';
        }
    }

    updateSupportModal(booking);
    updateCancelButtonVisibility(booking);
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
// 24-hour cancel rule helpers
// ─────────────────────────────────────────────
const CANCELLABLE_STATUSES = ['active', 'confirmed', 'pending', 'upcoming'];

/**
 * Returns the pickup datetime as a Date, or null if unavailable.
 * Accepts pickupDate as 'YYYY-MM-DD' or 'M/D/YYYY' and pickupTime as 'HH:mm' or 'HH:mm:ss'.
 */
function getPickupDateTime(booking) {
    if (!booking || !booking.pickupDate) return null;
    const dateStr = String(booking.pickupDate).trim();
    const timeStr = String(booking.pickupTime || '00:00').trim();

    let y, mo, d;
    if (dateStr.includes('-')) {
        const parts = dateStr.split('-').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        [y, mo, d] = parts;
    } else if (dateStr.includes('/')) {
        const parts = dateStr.split('/').map(Number);
        if (parts.length !== 3 || parts.some(isNaN)) return null;
        // assume M/D/YYYY
        [mo, d, y] = parts;
    } else {
        return null;
    }

    const [hh, mm] = timeStr.split(':').map(Number);
    const dt = new Date(y, (mo || 1) - 1, d || 1, hh || 0, mm || 0, 0);
    return isNaN(dt.getTime()) ? null : dt;
}

function isCancellable(booking) {
    if (!booking) return { ok: false, reason: 'No booking loaded' };

    const status = (booking.status || '').toLowerCase();
    if (!CANCELLABLE_STATUSES.includes(status)) {
        return { ok: false, reason: 'Only upcoming bookings can be cancelled' };
    }

    const pickup = getPickupDateTime(booking);
    if (!pickup) {
        return { ok: false, reason: 'Pickup time unavailable' };
    }

    const now = new Date();
    const hoursUntilPickup = (pickup.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilPickup < 24) {
        return {
            ok: false,
            reason: hoursUntilPickup < 0
                ? 'Pickup time has already passed'
                : 'Bookings can only be cancelled at least 24 hours before pickup'
        };
    }

    return { ok: true };
}

function updateCancelButtonVisibility(booking) {
    // The cancel button is the one with class .btn-danger inside .detail-actions
    const cancelBtn = document.querySelector('.detail-actions .btn-danger');
    if (!cancelBtn) return;

    const check = isCancellable(booking);
    if (check.ok) {
        cancelBtn.style.display = '';
        cancelBtn.disabled = false;
        cancelBtn.title = '';
    } else {
        // Keep visible but disabled with tooltip — clearer than hiding
        cancelBtn.style.display = '';
        cancelBtn.disabled = true;
        cancelBtn.style.opacity = '0.5';
        cancelBtn.style.cursor = 'not-allowed';
        cancelBtn.title = check.reason;
    }
}

// ─────────────────────────────────────────────
// Support modal — show numbers inline (no tel:)
// ─────────────────────────────────────────────
function updateSupportModal(booking) {
    // Driver section
    if (booking.driver && booking.driver.phone) {
        document.getElementById('driverSupportOption').style.display = 'block';
        document.getElementById('driverContactInfo').innerHTML = `
            <div class="contact-row"><strong>Name:</strong> <span>${escapeHtml(booking.driver.name || '-')}</span></div>
            <div class="contact-row">
                <strong>Phone:</strong>
                <span class="phone-display" id="driverPhoneDisplay">${escapeHtml(booking.driver.phone)}</span>
                <button class="copy-btn" type="button" onclick="copyToClipboard('${escapeHtml(booking.driver.phone)}', this)">
                    <i class="fas fa-copy"></i> Copy
                </button>
            </div>
        `;
    } else {
        document.getElementById('driverSupportOption').style.display = 'none';
    }

    // Company section
    const c = booking.company || {};
    document.getElementById('companyContactInfo').innerHTML = `
        <div class="contact-row"><strong>Company:</strong> <span>${escapeHtml(c.name || '-')}</span></div>
        <div class="contact-row">
            <strong>Phone:</strong>
            <span class="phone-display">${escapeHtml(c.phone || '-')}</span>
            ${c.phone ? `<button class="copy-btn" type="button" onclick="copyToClipboard('${escapeHtml(c.phone)}', this)">
                <i class="fas fa-copy"></i> Copy
            </button>` : ''}
        </div>
        <div class="contact-row"><strong>Email:</strong> <span>${escapeHtml(c.email || '-')}</span></div>
    `;
}

function copyToClipboard(text, btn) {
    if (!text || text === '-') return;

    const done = () => {
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Copied';
            btn.classList.add('copied');
            setTimeout(() => {
                btn.innerHTML = original;
                btn.classList.remove('copied');
            }, 1500);
        }
        showNotification('Phone number copied', 'success');
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
        fallbackCopy(text, done);
    }
}

function fallbackCopy(text, done) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); }
    catch (e) { showNotification('Could not copy', 'warning'); }
    document.body.removeChild(ta);
}

// ─────────────────────────────────────────────
// Navigation / action handlers
// ─────────────────────────────────────────────
function navigateToCompany() {
    if (currentBooking && currentBooking.company && currentBooking.company.id) {
        sessionStorage.setItem('selectedCompanyId', currentBooking.company.id);
        window.location.href = `company-profile.html?companyId=${encodeURIComponent(currentBooking.company.id)}`;
    } else {
        showNotification('Company information not available', 'warning');
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

// Driver call/message buttons inside Driver card — also no tel:
function callDriver() {
    if (currentBooking && currentBooking.driver && currentBooking.driver.phone) {
        // Just open the support modal so the user can see/copy the number
        contactSupport();
    } else {
        showNotification('Driver phone not available', 'warning');
    }
}

function messageDriver() {
    if (currentBooking && currentBooking.driver) {
        showNotification('Messaging feature coming soon', 'info');
    }
}

function contactSupport() {
    document.getElementById('supportModal').classList.add('show');
}
function closeSupportModal() {
    document.getElementById('supportModal').classList.remove('show');
}

// Kept for compatibility — now just copy the number instead of dialing
function contactDriverPhone() {
    if (currentBooking && currentBooking.driver && currentBooking.driver.phone) {
        copyToClipboard(currentBooking.driver.phone, null);
    }
}
function contactCompanyPhone() {
    if (currentBooking && currentBooking.company && currentBooking.company.phone) {
        copyToClipboard(currentBooking.company.phone, null);
    }
}
function contactAdmin() {
    copyToClipboard('+94112345678', null);
}

// ─────────────────────────────────────────────
// Cancel booking — 24h rule (frontend) + server enforces too
// ─────────────────────────────────────────────
function cancelBooking() {
    const check = isCancellable(currentBooking);
    if (!check.ok) {
        showNotification(check.reason, 'warning');
        return;
    }
    document.getElementById('cancelModal').classList.add('show');
}

function closeCancelModal() {
    document.getElementById('cancelModal').classList.remove('show');
}

function confirmCancel() {
    if (!currentBooking) return;

    // Re-check at submit time
    const check = isCancellable(currentBooking);
    if (!check.ok) {
        closeCancelModal();
        showNotification(check.reason, 'warning');
        return;
    }

    closeCancelModal();
    showNotification('Processing cancellation...', 'info');

    const ctx = window.location.pathname.split('/views/')[0];
    fetch(`${ctx}/customer/cancel-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ rideId: currentBooking.id })
    })
        .then(res => res.json().then(data => ({ status: res.status, data })))
        .then(({ status, data }) => {
            if (data.success) {
                showNotification('Booking cancelled successfully', 'success');
                setTimeout(() => (window.location.href = 'bookings.html'), 1500);
            } else {
                showNotification(data.message || 'Failed to cancel booking', 'warning');
            }
        })
        .catch(err => {
            console.error('Cancel error:', err);
            showNotification('Could not connect to server', 'error');
        });
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