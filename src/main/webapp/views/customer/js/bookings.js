// =============================================================
// My Bookings page - fetches bookings from backend and renders
// Endpoint: /customer/my-bookings (GET)
// =============================================================

let allBookings = [];
let currentBookingId = null;
let ratings = { overall: 0, service: 0, vehicle: 0 };

// ---------- Component loading (navbar + header) ----------
function loadComponent(elementId, filePath, callback) {
    fetch(filePath)
        .then(r => r.text())
        .then(html => {
            if (elementId === 'header-container') {
                html = html.replace('{{PAGE_TITLE}}', 'MY BOOKINGS');
            }
            document.getElementById(elementId).innerHTML = html;
            executeComponentScripts(elementId);
            if (callback) callback();
        })
        .catch(err => console.error('Error loading component:', err));
}

function executeComponentScripts(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('script').forEach(oldScript => {
        const newScript = document.createElement('script');
        if (oldScript.src) newScript.src = oldScript.src;
        else newScript.textContent = oldScript.textContent;
        document.body.appendChild(newScript);
        oldScript.parentNode && oldScript.parentNode.removeChild(oldScript);
    });
}

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', function () {
    loadComponent('navbar-container', '../components/navbar.html', () => {
        if (typeof initializeNavbar === 'function') initializeNavbar();
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const bookingsNav = document.querySelector('[data-page="bookings"]');
        if (bookingsNav) bookingsNav.classList.add('active');
    });

    loadComponent('header-container', '../components/header.html', () => {
        if (typeof initializeHeader === 'function') initializeHeader();
        const pageTitle = document.querySelector('.hi h1');
        if (pageTitle) {
            pageTitle.textContent = 'MY BOOKINGS';
            const subtitle = document.querySelector('.subtitle');
            if (subtitle) subtitle.textContent = 'Manage your vehicle reservations';
        }
    });

    initializeFilterTabs();
    initializeRatingModal();
    loadBookings();
});

// ---------- Fetch & render ----------
function loadBookings() {
    showLoading(true);

    fetch('../../../customer/my-bookings', { credentials: 'same-origin' })
        .then(res => {
            if (res.status === 401) {
                showNotification('Please login to view your bookings', 'warning');
                setTimeout(() => window.location.href = 'login.html', 1500);
                throw new Error('Unauthorized');
            }
            return res.json();
        })
        .then(data => {
            showLoading(false);
            if (!data.success) {
                showNotification(data.message || 'Failed to load bookings', 'warning');
                return;
            }
            allBookings = data.bookings || [];
            renderAllSections();
            handleVehicleFilter('all');
        })
        .catch(err => {
            showLoading(false);
            console.error('Error loading bookings:', err);
            if (err.message !== 'Unauthorized') {
                showNotification('Could not connect to server', 'warning');
            }
        });
}

function showLoading(isLoading) {
    const container = document.getElementById('vehicle-bookings');
    if (!container) return;
    let loader = document.getElementById('bookings-loader');
    if (isLoading) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'bookings-loader';
            loader.style.cssText = 'text-align:center;padding:40px;color:#666;';
            loader.innerHTML = '<i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:15px;">Loading your bookings...</p>';
            container.appendChild(loader);
        }
    } else if (loader) {
        loader.remove();
    }
}

function renderAllSections() {
    const active   = allBookings.filter(b => b.category === 'active');
    const upcoming = allBookings.filter(b => b.category === 'upcoming');
    const past     = allBookings.filter(b => b.category === 'past');

    renderSection('.vehicle-active',   active,   'active');
    renderSection('.vehicle-upcoming', upcoming, 'upcoming');
    renderSection('.vehicle-past',     past,     'past');
}

function renderSection(sectionSelector, bookings, category) {
    const section = document.querySelector(sectionSelector);
    if (!section) return;

    // Keep the section title, remove old cards
    section.querySelectorAll('.booking-card').forEach(c => c.remove());
    const emptyMsg = section.querySelector('.empty-state');
    if (emptyMsg) emptyMsg.remove();

    if (bookings.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.style.cssText = 'text-align:center;padding:30px;color:#888;';
        empty.innerHTML = `<i class="fas fa-inbox fa-2x" style="opacity:0.4;"></i><p style="margin-top:10px;">No ${category} bookings</p>`;
        section.appendChild(empty);
        return;
    }

    bookings.forEach(b => section.appendChild(buildBookingCard(b, category)));
}

// ---------- Card builder ----------
function buildBookingCard(b, category) {
    const card = document.createElement('div');
    card.className = 'booking-card' + (category === 'active' ? ' active-booking' : '') + (category === 'past' ? ' completed' : '');
    card.dataset.bookingId = b.rideId;
    card.onclick = function () { navigateToDetails(this); };

    const isSelfDrive = b.rentalType === 'self-drive';
    const statusBadge = getStatusBadge(category, b.status);
    const dateDisplay = formatDate(b.tripStartDate);
    const timeDisplay = `${formatTime(b.startTime)} - ${formatTime(b.endTime)}`;
    const amount = `LKR ${Number(b.totalAmount || 0).toLocaleString()}`;
    const paymentBadge = (b.paymentStatus || 'unpaid').toLowerCase() === 'paid'
        ? '<span class="payment-badge paid">Paid</span>'
        : '<span class="payment-badge unpaid">Unpaid</span>';

    // Driver / self-drive block
    let partyBlock;
    if (isSelfDrive) {
        partyBlock = `
            <div class="driver-info">
                <div class="self-drive-badge-large"><i class="fas fa-steering-wheel"></i></div>
                <div class="driver-details">
                    <span class="driver-name">${escapeHtml(b.companyName || 'Self Drive Rental')}</span>
                </div>
            </div>`;
    } else {
        const initials = getInitials(b.driverName || 'Driver');
        partyBlock = `
            <div class="driver-info">
                <div class="driver-avatar"><span>${initials}</span></div>
                <div class="driver-details">
                    <span class="driver-name">${escapeHtml(b.driverName || 'Driver')}</span>
                    <div class="driver-rating">
                        <i class="fas fa-star"></i>
                        <span>${b.driverRating != null ? b.driverRating : '4.5'}</span>
                    </div>
                </div>
            </div>`;
    }

    // Actions based on category
    let actionsBlock = '';
    const id = b.rideId;
    const msgLabel = isSelfDrive ? 'Message Company' : 'Message Driver';
    if (category === 'active') {
        actionsBlock = `
            <button class="btn btn-outline btn-sm" onclick="navigateToDetails(this.closest('.booking-card'))"><i class="fas fa-eye"></i> View Details</button>
            <button class="btn btn-primary btn-sm" onclick="openMessageModal('${id}')"><i class="fas fa-message"></i> ${msgLabel}</button>
            <button class="btn btn-success btn-sm" onclick="openCallModal('${id}')"><i class="fas fa-phone"></i> ${isSelfDrive ? 'Call Company' : 'Call Driver'}</button>`;
    } else if (category === 'upcoming') {
        actionsBlock = `
            <button class="btn btn-outline btn-sm" onclick="navigateToDetails(this.closest('.booking-card'))"><i class="fas fa-eye"></i> View Details</button>
            <button class="btn btn-warning btn-sm" onclick="openMessageModal('${id}')"><i class="fas fa-message"></i> ${msgLabel}</button>
            <button class="btn btn-danger btn-sm" onclick="openCancelModal('${id}')"><i class="fas fa-times"></i> Cancel</button>`;
    } else {
        actionsBlock = `
            <button class="btn btn-outline btn-sm" onclick="navigateToDetails(this.closest('.booking-card'))"><i class="fas fa-eye"></i> View Details</button>
            <button class="btn btn-primary btn-sm" onclick="openRatingModal('${id}')"><i class="fas fa-star"></i> Rate Experience</button>
            <button class="btn btn-success btn-sm" onclick="openRebookModal('${id}')"><i class="fas fa-redo"></i> Book Again</button>`;
    }

    card.innerHTML = `
        <div class="booking-header">
            <div class="vehicle-info">
                <div class="vehicle-icon"><i class="fas fa-car"></i></div>
                <div class="vehicle-details">
                    <h4>${escapeHtml(b.vehicleModel || 'Vehicle')}</h4>
                    <span class="booking-id">Booking ID: ${escapeHtml(b.rideId || '')}</span>
                </div>
            </div>
            <div class="booking-status">
                ${statusBadge}
                <span class="booking-type${isSelfDrive ? ' self-drive-badge' : ''}">${isSelfDrive ? 'Self-Drive' : 'With Driver'}</span>
            </div>
        </div>
        <div class="booking-content">
            <div class="booking-info">
                <div class="info-row"><span class="label">Date:</span><span class="value">${dateDisplay}</span></div>
                <div class="info-row"><span class="label">Time:</span><span class="value">${timeDisplay}</span></div>
                <div class="info-row"><span class="label">From:</span><span class="value">${escapeHtml(b.pickupLocation || '-')}</span></div>
                <div class="info-row"><span class="label">To:</span><span class="value">${escapeHtml(b.dropLocation || '-')}</span></div>
            </div>
            ${partyBlock}
            <div class="amount-info">
                <span class="amount">${amount}</span>
                ${paymentBadge}
            </div>
        </div>
        <div class="booking-actions" onclick="event.stopPropagation()">
            ${actionsBlock}
        </div>`;

    return card;
}

function getStatusBadge(category, dbStatus) {
    if (category === 'active')   return '<span class="status-badge active-progress">Active</span>';
    if (category === 'past')     return '<span class="status-badge completed">Completed</span>';
    // upcoming
    const s = (dbStatus || 'pending').toLowerCase();
    if (s === 'cancelled') return '<span class="status-badge cancelled">Cancelled</span>';
    return '<span class="status-badge paid">Confirmed</span>';
}

// ---------- Helpers ----------
function formatDate(iso) {
    if (!iso) return '-';
    const parts = iso.split('-'); // yyyy-mm-dd
    if (parts.length !== 3) return iso;
    return `${parseInt(parts[1])}/${parseInt(parts[2])}/${parts[0]}`;
}

function formatTime(t) {
    if (!t) return '';
    return t.substring(0, 5); // HH:mm
}

function getInitials(name) {
    return name.split(' ').filter(Boolean).map(w => w[0]).join('').substring(0, 2).toUpperCase();
}

function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
}

function findBooking(rideId) {
    return allBookings.find(b => b.rideId === rideId);
}

// ---------- Navigation ----------
function navigateToDetails(element) {
    const bookingId = element.dataset.bookingId;
    if (bookingId) window.location.href = `booking_details.html?id=${bookingId}`;
}

// ---------- Filter tabs ----------
function initializeFilterTabs() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;
            document.querySelectorAll(`.filter-btn[data-category="${category}"]`).forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            handleVehicleFilter(btn.dataset.filter);
        });
    });
}

function handleVehicleFilter(filter) {
    const sections = {
        active:   document.querySelector('.vehicle-active'),
        upcoming: document.querySelector('.vehicle-upcoming'),
        past:     document.querySelector('.vehicle-past')
    };
    Object.values(sections).forEach(s => { if (s) s.style.display = 'none'; });

    if (filter === 'all') {
        Object.values(sections).forEach(s => { if (s) s.style.display = 'block'; });
    } else if (sections[filter]) {
        sections[filter].style.display = 'block';
    }
}

// ===============================================================
// Modals
// ===============================================================

// ---------- Message ----------
function openMessageModal(rideId) {
    currentBookingId = rideId;
    const b = findBooking(rideId);
    if (!b) return;
    const subtitle = document.getElementById('messageSubtitle');
    if (b.rentalType === 'self-drive') {
        subtitle.textContent = `Send a message to ${b.companyName || 'the company'} about their ${b.vehicleModel}:`;
    } else {
        subtitle.textContent = `Send a message to ${b.driverName || 'the driver'} about their ${b.vehicleModel}:`;
    }
    document.getElementById('messageModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeMessageModal() {
    document.getElementById('messageModal').style.display = 'none';
    document.getElementById('messageText').value = '';
    document.body.style.overflow = 'auto';
}

function sendMessage() {
    const message = document.getElementById('messageText').value.trim();
    if (!message) { showNotification('Please enter a message', 'warning'); return; }
    const b = findBooking(currentBookingId);
    if (!b) return;
    const phone = b.rentalType === 'self-drive' ? b.companyPhone : b.driverPhone;
    if (phone) {
        window.location.href = `sms:${phone}?body=${encodeURIComponent(message + ' - Booking ID: ' + currentBookingId)}`;
    }
    closeMessageModal();
    showNotification('Opening messaging app...', 'success');
}

// ---------- Call ----------
function openCallModal(rideId) {
    currentBookingId = rideId;
    const b = findBooking(rideId);
    if (!b) return;
    const subtitle = document.getElementById('callSubtitle');
    const phone = document.getElementById('callPhone');
    if (b.rentalType === 'self-drive') {
        subtitle.textContent = `Call ${b.companyName || 'Company'} about ${b.vehicleModel}`;
        phone.textContent = b.companyPhone || 'N/A';
    } else {
        subtitle.textContent = `Call ${b.driverName || 'Driver'} - ${b.vehicleModel} Driver`;
        phone.textContent = b.driverPhone || 'N/A';
    }
    document.getElementById('callModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCallModal() {
    document.getElementById('callModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function makeCall() {
    const b = findBooking(currentBookingId);
    if (!b) return;
    const phone = b.rentalType === 'self-drive' ? b.companyPhone : b.driverPhone;
    if (phone) window.location.href = `tel:${phone}`;
    closeCallModal();
}

// ---------- Cancel ----------
function openCancelModal(rideId) {
    currentBookingId = rideId;
    const b = findBooking(rideId);
    if (!b) return;
    document.getElementById('cancelSubtitle').textContent = 'Are you sure you want to cancel this booking?';
    document.getElementById('cancelDetails').innerHTML = `
        <div class="detail-item"><strong>Vehicle:</strong> ${escapeHtml(b.vehicleModel)}</div>
        <div class="detail-item"><strong>Booking ID:</strong> ${escapeHtml(b.rideId)}</div>
        <div class="detail-item"><strong>Date:</strong> ${formatDate(b.tripStartDate)}</div>
        <div class="detail-item"><strong>Time:</strong> ${formatTime(b.startTime)} - ${formatTime(b.endTime)}</div>`;
    document.getElementById('cancelModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeCancelModal() {
    document.getElementById('cancelModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function confirmCancellation() {
    const rideId = currentBookingId;
    const card = document.querySelector(`[data-booking-id="${rideId}"]`);
    if (card) {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
    }
    closeCancelModal();

    fetch('../../../customer/cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ rideId: rideId })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Remove from local state and UI
                allBookings = allBookings.filter(b => b.rideId !== rideId);
                if (card) {
                    setTimeout(() => {
                        card.remove();
                        // If the upcoming section is now empty, show empty state
                        const upcomingSection = document.querySelector('.vehicle-upcoming');
                        if (upcomingSection && upcomingSection.querySelectorAll('.booking-card').length === 0) {
                            const empty = document.createElement('div');
                            empty.className = 'empty-state';
                            empty.style.cssText = 'text-align:center;padding:30px;color:#888;';
                            empty.innerHTML = '<i class="fas fa-inbox fa-2x" style="opacity:0.4;"></i><p style="margin-top:10px;">No upcoming bookings</p>';
                            upcomingSection.appendChild(empty);
                        }
                    }, 300);
                }
                showNotification('Booking cancelled successfully', 'success');
            } else {
                if (card) {
                    card.style.opacity = '';
                    card.style.pointerEvents = '';
                }
                showNotification(data.message || 'Failed to cancel booking', 'warning');
            }
        })
        .catch(err => {
            console.error('Cancel error:', err);
            if (card) {
                card.style.opacity = '';
                card.style.pointerEvents = '';
            }
            showNotification('Could not connect to server', 'warning');
        });
}

// ---------- Rating ----------
function openRatingModal(rideId) {
    currentBookingId = rideId;
    document.getElementById('ratingModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeRatingModal() {
    document.getElementById('ratingModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    resetRatings();
}

function initializeRatingModal() {
    document.querySelectorAll('.star-rating').forEach(ratingDiv => {
        const stars = ratingDiv.querySelectorAll('i');
        stars.forEach(star => {
            star.addEventListener('click', function () {
                const rating = parseInt(this.dataset.rating);
                const type = ratingDiv.id.replace('Rating', '');
                ratings[type] = rating;
                stars.forEach((s, idx) => {
                    s.classList.toggle('fas', idx < rating);
                    s.classList.toggle('far', idx >= rating);
                });
            });
            star.addEventListener('mouseenter', function () {
                const rating = parseInt(this.dataset.rating);
                stars.forEach((s, idx) => { s.style.color = idx < rating ? '#f8961e' : ''; });
            });
        });
        ratingDiv.addEventListener('mouseleave', function () {
            const type = ratingDiv.id.replace('Rating', '');
            const current = ratings[type];
            stars.forEach((s, idx) => { s.style.color = idx < current ? '#f8961e' : ''; });
        });
    });
}

function resetRatings() {
    ratings = { overall: 0, service: 0, vehicle: 0 };
    document.querySelectorAll('.star-rating i').forEach(s => {
        s.classList.remove('fas'); s.classList.add('far'); s.style.color = '';
    });
    const c = document.getElementById('ratingComments');
    if (c) c.value = '';
}

function submitRating() {
    if (ratings.overall === 0 || ratings.service === 0 || ratings.vehicle === 0) {
        showNotification('Please provide all ratings', 'warning');
        return;
    }
    showNotification('Submitting your rating...', 'info');
    setTimeout(() => {
        showNotification('Thank you for your feedback!', 'success');
        closeRatingModal();
        const card = document.querySelector(`[data-booking-id="${currentBookingId}"]`);
        if (card) {
            const rateBtn = card.querySelector('.btn-primary');
            if (rateBtn) {
                rateBtn.innerHTML = '<i class="fas fa-check"></i> Rated';
                rateBtn.disabled = true;
                rateBtn.style.opacity = '0.6';
            }
        }
    }, 1000);
}

// ---------- Rebook ----------
function openRebookModal(rideId) {
    currentBookingId = rideId;
    const b = findBooking(rideId);
    if (!b) return;
    document.getElementById('rebookSubtitle').textContent = `Book ${b.vehicleModel} again for your next trip`;
    document.getElementById('rebookDetails').innerHTML = `
        <div class="detail-item"><strong>Previous Vehicle:</strong> ${escapeHtml(b.vehicleModel)}</div>
        <div class="detail-item"><strong>Rental Type:</strong> ${b.rentalType === 'self-drive' ? 'Self-Drive' : 'With Driver'}</div>
        <div class="detail-item"><strong>Company:</strong> ${escapeHtml(b.companyName || '-')}</div>`;
    document.getElementById('rebookModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeRebookModal() {
    document.getElementById('rebookModal').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function confirmRebook() {
    sessionStorage.setItem('rebookingId', currentBookingId);
    window.location.href = 'search.html';
}

// ---------- Notification ----------
function showNotification(message, type = 'info') {
    const n = document.createElement('div');
    n.className = `notification-toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle';
    n.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    document.body.appendChild(n);
    setTimeout(() => n.classList.add('show'), 100);
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
}

// ---------- Close modals on outside click ----------
window.onclick = function (event) {
    if (event.target.classList.contains('action-modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};