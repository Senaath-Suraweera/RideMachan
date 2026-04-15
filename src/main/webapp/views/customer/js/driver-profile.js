// driver-profile.js — connected to backend
// Endpoints:
//   GET /customer/driver/profile?driverId=<id>
//   GET /ratings/actor?actorType=DRIVER&actorId=<id>

let currentDriver = null;
let showingAllReviews = false;
let allReviews = [];

// ─────────────────────────────────────────────
// Component loader (matches booking_details.js pattern)
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

function loadHeaderScript(cb) {
    if (window.initializeHeader) { cb(); return; }
    const s = document.createElement('script');
    s.src = '../components/header.js';
    s.onload = cb;
    s.onerror = () => { console.error('Failed to load header.js'); cb(); };
    document.head.appendChild(s);
}

// ─────────────────────────────────────────────
// Page init
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    loadComponent('navbar-container', '../components/navbar.html');

    loadComponent('header-container', '../components/header.html', () => {
        loadHeaderScript(() => {
            if (typeof initializeHeader === 'function') initializeHeader();
            if (typeof setPageTitle === 'function') {
                setPageTitle('Driver Profile');
            } else {
                const pageTitle = document.getElementById('pageTitle');
                if (pageTitle) pageTitle.textContent = 'Driver Profile';
            }
        });
    });

    setTimeout(() => {
        setupBackButton();
        loadDriverProfile();
    }, 100);
});

// ─────────────────────────────────────────────
// Back button label depends on where the user came from
// ─────────────────────────────────────────────
function setupBackButton() {
    const previousPage = sessionStorage.getItem('previousPage');
    const backBtn = document.querySelector('.back-btn');
    if (!backBtn) return;
    if (previousPage === 'booking_details') {
        backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back to Booking';
    } else {
        backBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Back';
    }
}

function goBack() {
    const previousPage = sessionStorage.getItem('previousPage');
    if (previousPage === 'booking_details') {
        window.history.back();
    } else {
        window.history.back();
    }
}

// ─────────────────────────────────────────────
// Build context-aware URLs (works whether app is at / or /RideMachan)
// ─────────────────────────────────────────────
function getContextPath() {
    return window.location.pathname.split('/views/')[0];
}

// ─────────────────────────────────────────────
// Load driver profile + ratings
// ─────────────────────────────────────────────
function loadDriverProfile() {
    const driverId = sessionStorage.getItem('selectedDriverId');

    if (!driverId) {
        showNotification('No driver selected', 'warning');
        setTimeout(() => window.history.back(), 1500);
        return;
    }

    const ctx = getContextPath();
    const url = `${ctx}/customer/driver/profile?driverId=${encodeURIComponent(driverId)}`;

    fetch(url, { credentials: 'same-origin' })
        .then(async response => {
            if (response.status === 401) {
                showNotification('Please login to view driver profile', 'warning');
                setTimeout(() => (window.location.href = '../../landing/customer_sign-in.html'), 1500);
                throw new Error('unauthorized');
            }
            if (response.status === 404) {
                showNotification('Driver not found', 'warning');
                setTimeout(() => window.history.back(), 2000);
                throw new Error('not found');
            }
            if (!response.ok) throw new Error('Server error (' + response.status + ')');
            return response.json();
        })
        .then(data => {
            if (!data.success || !data.driver) {
                showNotification(data.message || 'Failed to load driver', 'error');
                return;
            }
            currentDriver = data.driver;
            renderDriver(currentDriver);
            // Now fetch ratings
            loadRatings(driverId);
        })
        .catch(err => {
            if (err.message === 'unauthorized' || err.message === 'not found') return;
            console.error('Error loading driver profile:', err);
            showNotification('Failed to load driver profile', 'error');
        });
}

// ─────────────────────────────────────────────
// Render driver into the DOM
// ─────────────────────────────────────────────
function renderDriver(d) {
    // Avatar — use profile picture if uploaded, otherwise initials
    const avatarEl = document.getElementById('driverAvatarImg');
    const callAvatarEl = document.getElementById('callAvatar');
    const picUrl = normalizeImageSrc(d.profilePicture);

    if (picUrl) {
        avatarEl.innerHTML = `<img src="${picUrl}" alt="${escapeHtml(d.fullName || 'Driver')}">`;
        avatarEl.classList.add('has-image');
        callAvatarEl.innerHTML = `<img src="${picUrl}" alt="${escapeHtml(d.fullName || 'Driver')}">`;
        callAvatarEl.classList.add('has-image');
    } else {
        avatarEl.textContent = d.initial || '?';
        callAvatarEl.textContent = d.initial || '?';
    }

    document.getElementById('driverName').textContent = d.fullName || '-';

    // Verified badge — only show if driver is active and not banned
    const verifiedBadge = document.querySelector('.verified-badge');
    if (verifiedBadge) {
        verifiedBadge.style.display = d.verified ? 'flex' : 'none';
    }

    // Hide price line (no per-hour price for drivers)
    const priceEl = document.getElementById('driverPrice');
    if (priceEl) priceEl.style.display = 'none';

    // Stats
    document.getElementById('driverLocation').textContent = d.location || '-';
    document.getElementById('driverExperience').textContent =
        (d.experienceYears != null) ? `${d.experienceYears} years experience` : 'Experience not specified';
    document.getElementById('driverTrips').textContent = `${d.totalRides || 0}+ Trips`;

    // Hide Languages section (not stored in DB)
    hideDetailSection('Languages:');

    // Specialties — derive from description
    const specialtyTags = document.getElementById('specialtyTags');
    if (specialtyTags) {
        const specialties = parseSpecialties(d.description);
        if (specialties.length > 0) {
            specialtyTags.innerHTML = specialties
                .map(s => `<span class="tag">${escapeHtml(s)}</span>`)
                .join('');
        } else {
            hideDetailSection('Specialties:');
        }
    }

    // Hide Vehicle Types section (not derived for now)
    hideDetailSection('Vehicle Types:');

    // Set up call modal driver name + phone (avatar already set above)
    document.getElementById('callDriverName').textContent = d.fullName || '-';
    document.getElementById('callDriverPhone').innerHTML = `
        <i class="fas fa-phone"></i>
        <span>${escapeHtml(d.mobileNumber || 'Not available')}</span>
    `;

    // Hide the "Call Now" button in the modal — we only display the number
    const callNowBtn = document.querySelector('#callModal .modal-footer .btn-primary');
    if (callNowBtn) callNowBtn.style.display = 'none';

    // Hide "Message" button — no messaging implemented
    const messageBtn = document.querySelector('.action-buttons .btn-outline');
    if (messageBtn) messageBtn.style.display = 'none';

    // Update overall rating display in header area (if you have one)
    if (d.averageRating != null && d.totalReviews > 0) {
        // Already handled by loadRatings, but seed values here too
    }
}

/**
 * Splits a description into specialty tags.
 * Looks for comma-separated phrases or sentence fragments.
 */
function parseSpecialties(description) {
    if (!description) return [];
    // Split on commas and periods, trim, filter short / empty
    return description
        .split(/[,.;]/)
        .map(s => s.trim())
        .filter(s => s.length > 2 && s.length < 60);
}

function hideDetailSection(headingText) {
    const sections = document.querySelectorAll('.detail-section');
    sections.forEach(sec => {
        const h = sec.querySelector('h3');
        if (h && h.textContent.trim() === headingText) {
            sec.style.display = 'none';
        }
    });
}

function replaceSubmitReviewWithNotice() {
    // No-op: the "Rate This Driver" notice has been removed from this page.
}

// ─────────────────────────────────────────────
// Load ratings (uses generic /ratings/actor endpoint)
// ─────────────────────────────────────────────
function loadRatings(driverId) {
    const ctx = getContextPath();
    const url = `${ctx}/ratings/actor?actorType=DRIVER&actorId=${encodeURIComponent(driverId)}`;

    fetch(url, { credentials: 'same-origin' })
        .then(response => {
            if (!response.ok) throw new Error('Server error (' + response.status + ')');
            return response.json();
        })
        .then(data => {
            if (!data.success) {
                showNotification(data.message || 'Failed to load ratings', 'error');
                return;
            }
            renderRatings(data);
        })
        .catch(err => {
            console.error('Error loading ratings:', err);
            renderRatings({ average: 0, total: 0, breakdown: {1:0,2:0,3:0,4:0,5:0}, reviews: [] });
        });
}

function renderRatings(data) {
    const total = data.total || 0;
    const average = data.average || 0;

    // Overall rating number
    document.getElementById('overallRatingNumber').textContent =
        total > 0 ? average.toFixed(1) : '-';

    // Total reviews label
    document.getElementById('totalReviews').textContent =
        total > 0 ? `Based on ${total} review${total > 1 ? 's' : ''}` : 'No reviews yet';

    // Stars
    document.getElementById('overallStars').innerHTML = generateStars(average);

    // Breakdown bars
    const breakdown = data.breakdown || {};
    for (let i = 1; i <= 5; i++) {
        const count = parseInt(breakdown[i]) || 0;
        const percent = total > 0 ? (count / total) * 100 : 0;
        const bar = document.getElementById(`rating${i}`);
        const cnt = document.getElementById(`count${i}`);
        if (bar) bar.style.width = `${percent}%`;
        if (cnt) cnt.textContent = count;
    }

    // Reviews
    allReviews = data.reviews || [];
    renderReviewsList();
}

function renderReviewsList() {
    const recentList = document.getElementById('recentReviewsList');
    const allList    = document.getElementById('allReviewsList');
    const toggleBtn  = document.getElementById('toggleReviewsBtn');

    if (allReviews.length === 0) {
        recentList.innerHTML = `
            <div class="review-item" style="text-align: center;">
                <p class="review-text" style="color: var(--text-light);">
                    No reviews yet. Be the first to review after your trip!
                </p>
            </div>
        `;
        if (allList) allList.innerHTML = '';
        if (toggleBtn) toggleBtn.style.display = 'none';
        return;
    }

    const recent = allReviews.slice(0, 3);
    recentList.innerHTML = recent.map(reviewHtml).join('');

    if (allReviews.length > 3) {
        if (toggleBtn) toggleBtn.style.display = '';
        if (allList) allList.innerHTML = allReviews.map(reviewHtml).join('');
    } else {
        if (toggleBtn) toggleBtn.style.display = 'none';
    }
}

function reviewHtml(r) {
    return `
        <div class="review-item">
            <div class="review-header">
                <span class="reviewer-name">${escapeHtml(r.name || 'Anonymous')}</span>
                <span class="review-date">${escapeHtml(r.date || '')}</span>
            </div>
            <div class="review-stars">
                ${generateReviewStars(r.rating || 0)}
            </div>
            <p class="review-text">${escapeHtml(r.text || '')}</p>
        </div>
    `;
}

function toggleAllReviews() {
    const allReviewsList = document.getElementById('allReviewsList');
    const recentList     = document.getElementById('recentReviewsList');
    const toggleBtnText  = document.getElementById('toggleBtnText');
    const toggleBtnIcon  = document.getElementById('toggleBtnIcon');

    showingAllReviews = !showingAllReviews;

    if (showingAllReviews) {
        if (recentList) recentList.style.display = 'none';
        if (allReviewsList) allReviewsList.style.display = 'block';
        if (toggleBtnText) toggleBtnText.textContent = 'Show Less';
        if (toggleBtnIcon) toggleBtnIcon.className = 'fas fa-chevron-up';
    } else {
        if (recentList) recentList.style.display = 'flex';
        if (allReviewsList) allReviewsList.style.display = 'none';
        if (toggleBtnText) toggleBtnText.textContent = 'View All Reviews';
        if (toggleBtnIcon) toggleBtnIcon.className = 'fas fa-chevron-down';
    }
}

// ─────────────────────────────────────────────
// Star helpers
// ─────────────────────────────────────────────
function generateStars(rating) {
    let stars = '';
    const r = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(r)) {
            stars += '<i class="fas fa-star"></i>';
        } else if (i === Math.ceil(r) && r % 1 !== 0) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        } else {
            stars += '<i class="far fa-star"></i>';
        }
    }
    return stars;
}

function generateReviewStars(rating) {
    let stars = '';
    const r = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
        stars += i <= r ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    return stars;
}

// ─────────────────────────────────────────────
// Modal handlers (call modal kept as info popup)
// ─────────────────────────────────────────────
function openCallModal() {
    if (!currentDriver) return;
    document.getElementById('callModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeCallModal() {
    document.getElementById('callModal').classList.remove('show');
    document.body.style.overflow = 'auto';
}

// Message modal stubs — kept so inline onclick handlers don't error
function openMessageModal() {
    showNotification('Messaging is not available yet', 'info');
}
function closeMessageModal() {
    const m = document.getElementById('messageModal');
    if (m) m.classList.remove('show');
    document.body.style.overflow = 'auto';
}
function sendMessage() { closeMessageModal(); }

// Submit rating stub — disabled on this page
function submitRating() {
    showNotification('Please rate this driver from your booking details after the trip', 'info');
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    const icon = type === 'success' ? 'check-circle'
        : type === 'warning' ? 'exclamation-triangle'
            : type === 'error'   ? 'times-circle'
                : 'info-circle';

    notification.innerHTML = `<i class="fas fa-${icon}"></i><span>${escapeHtml(message)}</span>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add('show'), 100);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ─────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────
function escapeHtml(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

/**
 * Accepts a profile-picture string from the backend and returns a usable
 * <img src=""> value. Returns null if the input is empty.
 *
 * Handles three storage conventions:
 *   - Already a data URI:  "data:image/jpeg;base64,/9j/..."
 *   - A regular URL:       "/uploads/driver_5.jpg" or "https://..."
 *   - Raw base64:          "/9j/4AAQSkZJRgABAQ..."  → prepended with prefix
 */
function normalizeImageSrc(raw) {
    if (!raw || typeof raw !== 'string') return null;
    const s = raw.trim();
    if (!s) return null;
    if (s.startsWith('data:image/')) return s;
    if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/')) return s;
    // Assume raw base64 — default to JPEG
    return 'data:image/jpeg;base64,' + s;
}

// ─────────────────────────────────────────────
// Close modals on outside click / Escape
// ─────────────────────────────────────────────
document.addEventListener('click', function (event) {
    if (event.target.classList.contains('modal-overlay')) {
        if (event.target.id === 'callModal') closeCallModal();
        else if (event.target.id === 'messageModal') closeMessageModal();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        closeCallModal();
        closeMessageModal();
    }
});