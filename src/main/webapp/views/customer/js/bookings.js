// =============================================================
// My Bookings page - fetches bookings from backend and renders
// Endpoint: /customer/my-bookings (GET)
// =============================================================

let allBookings = [];
let currentBookingId = null;
let ratings = { service: 0, vehicle: 0 };

// ---------- Component loading (navbar + header) ----------
function loadComponent(elementId, filePath, callback) {
    fetch(filePath)
        .then(r => r.text())
        .then(html => {
            document.getElementById(elementId).innerHTML = html;
            if (callback) callback();
        })
        .catch(err => console.error('Error loading component:', err));
}

function loadHeaderScript(cb) {
    if (window.initializeHeader) { cb(); return; }
    const s = document.createElement('script');
    s.src = '../components/header.js';
    s.onload = cb;
    s.onerror = () => { console.error('Failed to load header.js'); cb(); };
    document.head.appendChild(s);
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
        loadHeaderScript(() => {
            if (typeof initializeHeader === 'function') initializeHeader();
            if (typeof setPageTitle === 'function') {
                setPageTitle('MY BOOKINGS');
            } else {
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) pageTitle.textContent = 'MY BOOKINGS';
            }
        });
    });

    initializeFilterTabs();
    initializeRatingModal();
    loadBookings();

    // Auto-cancel check runs once on page load
    scheduleUnpaidAutoCancelCheck();
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

            // ── Front-end category override based on correct time logic ──
            // The backend already does this, but we recompute client-side as a
            // safety net so the display is always correct regardless of server TZ.
            const now = Date.now();
            allBookings.forEach(b => {
                b.category = computeCategory(b, now);
            });

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

// ── Category logic (mirrors CustomerMyBookingsDAO) ──────────────────
// upcoming : now  < startMillis
// active   : startMillis <= now <= endMillis
// past     : now  > endMillis
function computeCategory(b, nowMillis) {
    if (!b.tripStartDate || !b.tripEndDate) return 'upcoming';

    const startMillis = parseDateTimeMillis(b.tripStartDate, b.startTime);
    const endMillis   = parseDateTimeMillis(b.tripEndDate,   b.endTime);

    if (startMillis === null || endMillis === null) return 'upcoming';

    if (nowMillis < startMillis) return 'upcoming';
    if (nowMillis > endMillis)   return 'past';
    return 'active';
}

function parseDateTimeMillis(dateStr, timeStr) {
    if (!dateStr) return null;
    // dateStr: YYYY-MM-DD, timeStr: HH:mm or HH:mm:ss (optional)
    const dParts = String(dateStr).trim().split('-').map(Number);
    if (dParts.length !== 3 || dParts.some(isNaN)) return null;
    const [y, mo, d] = dParts;
    let hh = 0, mm = 0;
    if (timeStr) {
        const tParts = String(timeStr).trim().split(':').map(Number);
        hh = tParts[0] || 0;
        mm = tParts[1] || 0;
    }
    const dt = new Date(y, mo - 1, d, hh, mm, 0);
    return isNaN(dt.getTime()) ? null : dt.getTime();
}

// ── Unpaid bookings: only show in "upcoming" ─────────────────────────
// An unpaid booking that is still upcoming is fine to show.
// Once it crosses the 24h-before-start threshold without payment → auto-cancel.
function scheduleUnpaidAutoCancelCheck() {
    // Run immediately, then every 5 minutes
    runAutoCancelCheck();
    setInterval(runAutoCancelCheck, 5 * 60 * 1000);
}

function runAutoCancelCheck() {
    const now = Date.now();
    const unpaidUpcoming = allBookings.filter(b =>
        b.category === 'upcoming' &&
        (b.paymentStatus || '').toLowerCase() !== 'paid'
    );

    unpaidUpcoming.forEach(b => {
        const startMillis = parseDateTimeMillis(b.tripStartDate, b.startTime);
        if (startMillis === null) return;

        const hoursUntilStart = (startMillis - now) / 3600000;

        // Within 24 hours and still unpaid → trigger server-side auto-cancel
        if (hoursUntilStart <= 24 && hoursUntilStart > 0) {
            triggerAutoCancelUnpaid(b.rideId);
        }
    });
}

function triggerAutoCancelUnpaid(rideId) {
    fetch('../../../customer/cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ rideId: rideId, reason: 'auto_cancel_unpaid' })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                // Remove from local array and re-render
                allBookings = allBookings.filter(b => b.rideId !== rideId);
                renderAllSections();
                showNotification(`Booking ${rideId} was auto-cancelled (unpaid within 24h of start)`, 'warning');
            }
        })
        .catch(err => console.error('Auto-cancel error:', err));
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
    const now = Date.now();

    // Recompute categories fresh (handles the auto-cancel removals too)
    allBookings.forEach(b => { b.category = computeCategory(b, now); });

    // Unpaid bookings only appear in "upcoming"
    // If a booking is unpaid AND its category would be "active" or "past", hide it
    // (it should have been auto-cancelled, but as a safety guard, don't show it)
    const active   = allBookings.filter(b => b.category === 'active');
    const upcoming = allBookings.filter(b => {
        if (b.category !== 'upcoming') return false;
        // Paid bookings always show; unpaid only if still upcoming (already guaranteed by category)
        return true;
    });
    const past     = allBookings.filter(b => b.category === 'past');

    renderSection('.vehicle-active',   active,   'active');
    renderSection('.vehicle-upcoming', upcoming, 'upcoming');
    renderSection('.vehicle-past',     past,     'past');
}

function renderSection(sectionSelector, bookings, category) {
    const section = document.querySelector(sectionSelector);
    if (!section) return;

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

// ---------- 24h cancel rule ----------
function getPickupDateTime(b) {
    if (!b || !b.tripStartDate) return null;
    const ms = parseDateTimeMillis(b.tripStartDate, b.startTime);
    return ms !== null ? new Date(ms) : null;
}

function isCancellable(b) {
    if (!b) return { ok: false, reason: 'Booking not found' };

    const status = (b.status || '').toLowerCase();
    if (['cancelled', 'completed'].includes(status)) {
        return { ok: false, reason: 'This booking cannot be cancelled' };
    }

    const pickup = getPickupDateTime(b);
    if (!pickup) return { ok: false, reason: 'Pickup time unavailable' };

    const hoursUntil = (pickup.getTime() - Date.now()) / 3600000;
    if (hoursUntil < 24) {
        return {
            ok: false,
            reason: hoursUntil < 0
                ? 'Pickup time has already passed'
                : 'Bookings can only be cancelled at least 24 hours before pickup'
        };
    }
    return { ok: true };
}

// ---------- Vehicle image helper ----------
function getVehicleImageUrl(vehicleId) {
    if (!vehicleId) return null;
    // GetVehicleImageServlet is mapped to /vehicle/image?vehicleid=<id>
    return `../../../vehicle/image?vehicleid=${vehicleId}`;
}

function buildVehicleIcon(vehicleId) {
    if (!vehicleId) {
        return `<div class="vehicle-icon"><i class="fas fa-car"></i></div>`;
    }
    const imgUrl = getVehicleImageUrl(vehicleId);
    return `
        <div class="vehicle-icon" style="overflow:hidden;padding:0;background:transparent;">
            <img src="${imgUrl}"
                 alt="Vehicle"
                 style="width:100%;height:100%;object-fit:cover;border-radius:inherit;"
                 onerror="this.parentElement.innerHTML='<i class=\\'fas fa-car\\'></i>';this.parentElement.style='';"/>
        </div>`;
}

// ---------- Card builder ----------
function buildBookingCard(b, category) {
    const card = document.createElement('div');
    card.className = 'booking-card' +
        (category === 'active' ? ' active-booking' : '') +
        (category === 'past' ? ' completed' : '');
    card.dataset.bookingId = b.rideId;
    card.onclick = function () { navigateToDetails(this); };

    const isSelfDrive = b.rentalType === 'self-drive';
    const isPaid      = (b.paymentStatus || 'unpaid').toLowerCase() === 'paid';

    const statusBadge = getStatusBadge(category, b.status, isPaid);
    const dateDisplay = formatDate(b.tripStartDate);
    const timeDisplay = `${formatTime(b.startTime)} - ${formatTime(b.endTime)}`;
    const amount      = `LKR ${Number(b.totalAmount || 0).toLocaleString()}`;

    const paymentBadge = isPaid
        ? '<span class="payment-badge paid">Paid</span>'
        : '<span class="payment-badge unpaid">Unpaid</span>';

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

    let actionsBlock = '';
    const id        = b.rideId;
    const msgLabel  = isSelfDrive ? 'Message Company' : 'Message Driver';
    const callLabel = isSelfDrive ? 'Call Company' : 'Call Driver';

    if (category === 'active') {
        actionsBlock = `
            <button class="btn btn-outline btn-sm" onclick="navigateToDetails(this.closest('.booking-card'))"><i class="fas fa-eye"></i> View Details</button>
            <button class="btn btn-primary btn-sm" onclick="openMessageModal('${id}')"><i class="fas fa-message"></i> ${msgLabel}</button>
            <button class="btn btn-success btn-sm" onclick="openCallModal('${id}')"><i class="fas fa-phone"></i> ${callLabel}</button>
            <button class="btn btn-report btn-sm" onclick="openReportModal('${id}')"><i class="fas fa-flag"></i> Report</button>`;

    } else if (category === 'upcoming') {
        // Cancel button — disabled if outside 24h window
        const check = isCancellable(b);
        const cancelAttrs = check.ok
            ? `onclick="openCancelModal('${id}')"`
            : `disabled style="opacity:0.5;cursor:not-allowed;" title="${escapeHtml(check.reason)}"`;

        if (!isPaid) {
            // ── UNPAID upcoming: show Pay button instead of generic actions ──
            const startMillis   = parseDateTimeMillis(b.tripStartDate, b.startTime);
            const hoursUntilStart = startMillis ? (startMillis - Date.now()) / 3600000 : 999;
            const urgentWarning  = hoursUntilStart <= 24
                ? `<span style="color:var(--danger);font-size:12px;font-weight:600;display:block;margin-top:4px;">
                       <i class="fas fa-exclamation-triangle"></i> Auto-cancels within 24h of start if unpaid
                   </span>`
                : '';

            actionsBlock = `
                <button class="btn btn-outline btn-sm" onclick="navigateToDetails(this.closest('.booking-card'))"><i class="fas fa-eye"></i> View Details</button>
                <button class="btn btn-primary btn-sm" onclick="payNow('${id}')"><i class="fas fa-credit-card"></i> Pay Now</button>
                <button class="btn btn-danger btn-sm" ${cancelAttrs}><i class="fas fa-times"></i> Cancel</button>
                ${urgentWarning}`;
        } else {
            // Paid upcoming: normal actions
            actionsBlock = `
                <button class="btn btn-outline btn-sm" onclick="navigateToDetails(this.closest('.booking-card'))"><i class="fas fa-eye"></i> View Details</button>
                <button class="btn btn-warning btn-sm" onclick="openMessageModal('${id}')"><i class="fas fa-message"></i> ${msgLabel}</button>
                <button class="btn btn-danger btn-sm" ${cancelAttrs}><i class="fas fa-times"></i> Cancel</button>
                <button class="btn btn-report btn-sm" onclick="openReportModal('${id}')"><i class="fas fa-flag"></i> Report</button>`;
        }

    } else {
        // Past
        actionsBlock = `
            <button class="btn btn-outline btn-sm" onclick="navigateToDetails(this.closest('.booking-card'))"><i class="fas fa-eye"></i> View Details</button>
            <button class="btn btn-info btn-sm" onclick="showInvoice('${id}')"><i class="fas fa-file-invoice"></i> Show Invoice</button>
            <button class="btn btn-primary btn-sm" onclick="openRatingModal('${id}')"><i class="fas fa-star"></i> Rate Experience</button>
            <button class="btn btn-success btn-sm" onclick="rebookVehicle('${id}')"><i class="fas fa-redo"></i> Book Again</button>
            <button class="btn btn-report btn-sm" onclick="openReportModal('${id}')"><i class="fas fa-flag"></i> Report</button>`;
    }

    card.innerHTML = `
        <div class="booking-header">
            <div class="vehicle-info">
                ${buildVehicleIcon(b.vehicleId)}
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

function getStatusBadge(category, dbStatus, isPaid) {
    if (category === 'active') return '<span class="status-badge active-progress">Active</span>';
    if (category === 'past')   return '<span class="status-badge completed">Completed</span>';

    const s = (dbStatus || 'pending').toLowerCase();
    if (s === 'cancelled') return '<span class="status-badge cancelled">Cancelled</span>';
    if (!isPaid)           return '<span class="status-badge unpaid-badge" style="background:rgba(247,37,133,0.1);color:#f72585;">Unpaid</span>';
    return '<span class="status-badge paid">Confirmed</span>';
}

// ---------- Pay Now (unpaid upcoming booking) ----------
function payNow(rideId) {
    const b = findBooking(rideId);
    if (!b) { showNotification('Booking not found', 'warning'); return; }

    // Compute hours from start/end so payment.js can show duration
    const startMs = parseDateTimeMillis(b.tripStartDate, b.startTime);
    const endMs   = parseDateTimeMillis(b.tripEndDate,   b.endTime);
    const hours   = (startMs && endMs && endMs > startMs)
        ? Math.ceil((endMs - startMs) / 3600000)
        : null;

    // Reconstruct subtotal / serviceFee from totalAmount so the summary adds up.
    // payment.js shows: subtotal + serviceFee = totalCost
    // We know serviceFee = 500 (same constant used in vehicle-profile.js).
    // If totalAmount <= 500, treat the whole amount as the total and set fees to 0.
    const totalCost  = Number(b.totalAmount || 0);
    const serviceFee = totalCost > 500 ? 500 : 0;
    const subtotal   = totalCost - serviceFee;

    // hourlyRate — best-effort: subtotal ÷ hours, or just show 0
    const hourlyRate = (hours && hours > 0) ? Math.round(subtotal / hours) : 0;

    // payment.js reads these exact keys — all must be present
    const payData = {
        rideId:         b.rideId,
        vehicleId:      b.vehicleId,
        vehicleName:    b.vehicleModel  || 'Vehicle',
        company:        b.companyName   || '-',
        modeDisplay:    b.rentalType === 'self-drive' ? 'Self Drive' : 'With Driver',
        pickupDateTime: formatDate(b.tripStartDate) + ' ' + formatTime(b.startTime),
        returnDateTime: formatDate(b.tripEndDate)   + ' ' + formatTime(b.endTime),
        pickupLocation: b.pickupLocation || '-',
        hours:          hours || 0,
        hourlyRate:     hourlyRate,
        subtotal:       subtotal,
        serviceFee:     serviceFee,
        totalCost:      totalCost,
        isRepayment:    true   // flag so payment.js knows this is a re-pay
    };

    try { sessionStorage.setItem('bookingDetails', JSON.stringify(payData)); } catch (e) {}
    window.location.href = `payment.html?rideId=${encodeURIComponent(rideId)}`;
}

// ---------- Show Invoice (paid past/upcoming booking) ----------
function showInvoice(rideId) {
    const b = findBooking(rideId);
    if (!b) { showNotification('Booking not found', 'warning'); return; }

    // Build the paymentConfirmation object that payment_status.html reads
    const confData = {
        rideId:             b.rideId,
        vehicleId:          b.vehicleId,
        vehicleName:        b.vehicleModel || 'Vehicle',
        company:            b.companyName  || '-',
        modeDisplay:        b.rentalType === 'self-drive' ? 'Self Drive' : 'With Driver',
        pickupDateTime:     formatDate(b.tripStartDate) + ' ' + formatTime(b.startTime),
        returnDateTime:     formatDate(b.tripEndDate)   + ' ' + formatTime(b.endTime),
        pickupLocation:     b.pickupLocation || '-',
        totalCost:          b.totalAmount || 0,
        paymentMethodDisplay: 'Card Payment',
        email:              '-'
    };

    try { sessionStorage.setItem('paymentConfirmation', JSON.stringify(confData)); } catch (e) {}
    window.location.href = `payment_status.html?id=${encodeURIComponent(rideId)}`;
}

// ---------- Helpers ----------
function formatDate(iso) {
    if (!iso) return '-';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return `${parseInt(parts[1])}/${parseInt(parts[2])}/${parts[0]}`;
}

function formatTime(t) {
    if (!t) return '';
    return String(t).substring(0, 5);
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
    const phone    = document.getElementById('callPhone');
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

    const check = isCancellable(b);
    if (!check.ok) {
        showNotification(check.reason, 'warning');
        return;
    }

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
    const b      = findBooking(rideId);

    const check = isCancellable(b);
    if (!check.ok) {
        closeCancelModal();
        showNotification(check.reason, 'warning');
        return;
    }

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
                allBookings = allBookings.filter(x => x.rideId !== rideId);
                if (card) {
                    setTimeout(() => {
                        card.remove();
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
                if (card) { card.style.opacity = ''; card.style.pointerEvents = ''; }
                showNotification(data.message || 'Failed to cancel booking', 'warning');
            }
        })
        .catch(err => {
            console.error('Cancel error:', err);
            if (card) { card.style.opacity = ''; card.style.pointerEvents = ''; }
            showNotification('Could not connect to server', 'warning');
        });
}

// ---------- Rating ----------
function openRatingModal(rideId) {
    currentBookingId = rideId;
    const b = findBooking(rideId);
    if (!b) return;

    const driverSection = document.getElementById('driverRatingSection');
    if (driverSection) {
        driverSection.style.display = (b.rentalType === 'self-drive') ? 'none' : 'block';
    }

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
                const type   = ratingDiv.id.replace('Rating', '');
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
            const type    = ratingDiv.id.replace('Rating', '');
            const current = ratings[type] || 0;
            stars.forEach((s, idx) => { s.style.color = idx < current ? '#f8961e' : ''; });
        });
    });
}

function resetRatings() {
    ratings = { service: 0, vehicle: 0 };
    document.querySelectorAll('.star-rating i').forEach(s => {
        s.classList.remove('fas'); s.classList.add('far'); s.style.color = '';
    });
    const c = document.getElementById('ratingComments');
    if (c) c.value = '';
}

function submitRating() {
    const b = findBooking(currentBookingId);
    if (!b) { showNotification('Booking not found', 'warning'); return; }

    const isSelfDrive = b.rentalType === 'self-drive';

    if (ratings.vehicle === 0) { showNotification('Please rate the vehicle condition', 'warning'); return; }
    if (!isSelfDrive && ratings.service === 0) { showNotification('Please rate the driver/service quality', 'warning'); return; }

    const review  = (document.getElementById('ratingComments').value || '').trim();
    const payload = {
        rideId:        b.rideId,
        vehicleId:     b.vehicleId,
        driverId:      b.driverId || 0,
        companyId:     b.companyId,
        driverRating:  isSelfDrive ? 0 : ratings.service,
        vehicleRating: ratings.vehicle,
        review:        review || null
    };

    const btn = document.getElementById('submitRatingBtn');
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...'; }

    fetch('../../../customer/rating/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload)
    })
        .then(res => {
            if (res.status === 401) { showNotification('Please login to submit a rating', 'warning'); throw new Error('Unauthorized'); }
            return res.json();
        })
        .then(data => {
            if (btn) { btn.disabled = false; btn.innerHTML = 'Submit Rating'; }
            if (data.success) {
                showNotification('Thank you for your feedback!', 'success');
                closeRatingModal();
                const card = document.querySelector(`[data-booking-id="${currentBookingId}"]`);
                if (card) {
                    const rateBtn = card.querySelector('.btn-primary');
                    if (rateBtn) { rateBtn.innerHTML = '<i class="fas fa-check"></i> Rated'; rateBtn.disabled = true; rateBtn.style.opacity = '0.6'; rateBtn.onclick = null; }
                }
            } else {
                showNotification(data.message || 'Failed to submit rating', 'warning');
            }
        })
        .catch(err => {
            console.error('Rating submit error:', err);
            if (btn) { btn.disabled = false; btn.innerHTML = 'Submit Rating'; }
            if (err.message !== 'Unauthorized') showNotification('Could not connect to server', 'warning');
        });
}

// ---------- Rebook → goes straight to vehicle profile ----------
// vehicle-profile.js reads the vehicleId from URL param "id" (NOT "vehicleId")
function rebookVehicle(rideId) {
    const b = findBooking(rideId);
    if (!b) { showNotification('Booking not found', 'warning'); return; }
    if (!b.vehicleId) { showNotification('Vehicle information unavailable for rebooking', 'warning'); return; }

    sessionStorage.setItem('selectedVehicleId', b.vehicleId);
    sessionStorage.setItem('rebookingFromRideId', b.rideId);

    // vehicle-profile.js uses urlParams.get('id') — use ?id= param
    window.location.href = `vehicle-profile.html?id=${encodeURIComponent(b.vehicleId)}`;
}

// ---------- Notification ----------
function showNotification(message, type = 'info') {
    const n    = document.createElement('div');
    n.className = `notification-toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'times-circle' : 'info-circle';
    n.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    document.body.appendChild(n);
    setTimeout(() => n.classList.add('show'), 100);
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 3000);
}

window.onclick = function (event) {
    if (event.target.classList.contains('action-modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// =========================================================================
// Report feature
// =========================================================================

let reportState = {
    rideId: null, driverId: null, driverName: null,
    companyId: null, companyName: null, target: 'DRIVER', selectedImages: []
};

function openReportModal(rideId) {
    const b = findBooking(rideId);
    if (!b) return;

    const isSelfDrive = b.rentalType === 'self-drive';
    reportState = {
        rideId: rideId, driverId: b.driverId || null, driverName: b.driverName || null,
        companyId: b.companyId || null, companyName: b.companyName || null,
        target: isSelfDrive ? 'COMPANY' : 'DRIVER', selectedImages: []
    };

    document.getElementById('reportSubtitle').textContent =
        `Report an issue with your booking: ${b.vehicleModel || 'Vehicle'} (${rideId})`;

    const driverBtn  = document.querySelector('.report-target-btn[data-target="DRIVER"]');
    const companyBtn = document.querySelector('.report-target-btn[data-target="COMPANY"]');

    document.getElementById('reportDriverName').textContent = reportState.driverName || (isSelfDrive ? 'N/A' : 'Unknown');
    document.getElementById('reportCompanyName').textContent = reportState.companyName || 'Unknown';

    if (isSelfDrive || !reportState.driverId) {
        driverBtn.classList.add('disabled'); driverBtn.classList.remove('active');
        companyBtn.classList.add('active');
    } else {
        driverBtn.classList.remove('disabled'); driverBtn.classList.add('active');
        companyBtn.classList.remove('active');
    }

    ['reportCategory','reportSubject','reportDescription','reportImageInput'].forEach(id => {
        const el = document.getElementById(id); if (el) el.value = '';
    });
    document.getElementById('reportImagePreview').innerHTML = '';
    document.getElementById('reportModal').style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
    document.body.style.overflow = 'auto';
    reportState.selectedImages = [];
}

function selectReportTarget(target) {
    const btn = document.querySelector(`.report-target-btn[data-target="${target}"]`);
    if (!btn || btn.classList.contains('disabled')) return;
    reportState.target = target;
    document.querySelectorAll('.report-target-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function handleReportImageSelect(event) {
    const files = Array.from(event.target.files || []);
    files.forEach(file => {
        if (reportState.selectedImages.length >= 5) { showNotification('Maximum 5 images allowed', 'warning'); return; }
        if (file.size > 10 * 1024 * 1024) { showNotification(`${file.name} is too large (max 10MB)`, 'warning'); return; }
        reportState.selectedImages.push(file);
    });
    renderReportImagePreviews();
    event.target.value = '';
}

function renderReportImagePreviews() {
    const container = document.getElementById('reportImagePreview');
    container.innerHTML = '';
    reportState.selectedImages.forEach((file, idx) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `<img src="${e.target.result}" alt="preview" /><button type="button" class="preview-remove" onclick="removeReportImage(${idx})"><i class="fas fa-times"></i></button>`;
            container.appendChild(item);
        };
        reader.readAsDataURL(file);
    });
}

function removeReportImage(idx) {
    reportState.selectedImages.splice(idx, 1);
    renderReportImagePreviews();
}

function submitReport() {
    const category    = document.getElementById('reportCategory').value;
    const subject     = document.getElementById('reportSubject').value.trim();
    const description = document.getElementById('reportDescription').value.trim();

    if (!category)    { showNotification('Please select a category', 'warning'); return; }
    if (!subject)     { showNotification('Please enter a subject', 'warning'); return; }
    if (!description) { showNotification('Please describe the issue', 'warning'); return; }

    const reportedRole = reportState.target;
    const reportedId   = reportedRole === 'DRIVER' ? reportState.driverId : reportState.companyId;
    if (!reportedId)   { showNotification(`Cannot report ${reportedRole.toLowerCase()} — missing ID`, 'warning'); return; }

    const btn = document.getElementById('reportSubmitBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

    const payload = {
        category, subject,
        description: description + `\n\n[Booking ID: ${reportState.rideId}]`,
        reportedRole, reportedId
    };

    fetch('../../../customer/report/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin', body: JSON.stringify(payload)
    })
        .then(res => { if (res.status === 401) { showNotification('Please login to file a report', 'warning'); throw new Error('Unauthorized'); } return res.json(); })
        .then(data => {
            if (!data.success) throw new Error(data.message || 'Failed to submit report');
            const reportId = data.reportId;
            if (reportState.selectedImages.length === 0) { finishReportSubmission(); return; }
            const formData = new FormData();
            formData.append('reportId', reportId);
            reportState.selectedImages.forEach(f => formData.append('images', f));
            return fetch('../../../report/image/upload', { method: 'POST', credentials: 'same-origin', body: formData })
                .then(r => r.json())
                .then(imgRes => { if (imgRes.status !== 'success') showNotification('Report filed, but image upload failed', 'warning'); finishReportSubmission(); });
        })
        .catch(err => {
            console.error('Report submit error:', err);
            if (err.message !== 'Unauthorized') showNotification(err.message || 'Could not submit report', 'warning');
            btn.disabled = false; btn.innerHTML = '<i class="fas fa-flag"></i> Submit Report';
        });
}

function finishReportSubmission() {
    const btn = document.getElementById('reportSubmitBtn');
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-flag"></i> Submit Report';
    closeReportModal();
    showNotification('Report filed successfully. Our team will review it shortly.', 'success');
}