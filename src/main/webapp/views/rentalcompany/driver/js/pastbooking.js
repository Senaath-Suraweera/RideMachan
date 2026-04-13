// Global variables
let allBookings = [];
let currentFilters = {
    dateRange: 'month',
    status: 'all',
    search: ''
};

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const loadingSpinner = document.getElementById('loadingSpinner');
const bookingsList = document.getElementById('bookingsList');
const bookingsContainer = document.getElementById('bookingsContainer');
const emptyState = document.getElementById('emptyState');
const bookingDetailsModal = document.getElementById('bookingDetailsModal');
const closeModal = document.getElementById('closeModal');
const searchInput = document.getElementById('searchInput');
const dateRange = document.getElementById('dateRange');
const statusFilter = document.getElementById('statusFilter');
const resetFilters = document.getElementById('resetFilters');

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadBookings();
});

// Setup all event listeners
function setupEventListeners() {
    // Sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside (mobile)
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 &&
            sidebar.classList.contains('active') &&
            !sidebar.contains(e.target) &&
            (!sidebarToggle || !sidebarToggle.contains(e.target))) {
            sidebar.classList.remove('active');
        }
    });

    // Filter event listeners
    searchInput.addEventListener('input', debounce(function() {
        currentFilters.search = this.value;
        loadBookings();
    }, 500));

    dateRange.addEventListener('change', function() {
        currentFilters.dateRange = this.value;
        loadBookings();
    });

    statusFilter.addEventListener('change', function() {
        currentFilters.status = this.value;
        loadBookings();
    });

    resetFilters.addEventListener('click', function() {
        currentFilters = {
            dateRange: 'month',
            status: 'all',
            search: ''
        };
        searchInput.value = '';
        dateRange.value = 'month';
        statusFilter.value = 'all';
        loadBookings();
    });

    // Close modal handlers
    if (closeModal) {
        closeModal.addEventListener('click', closeBookingModal);
    }

    window.addEventListener('click', function(event) {
        if (event.target === bookingDetailsModal) {
            closeBookingModal();
        }
    });

    // Logout functionality
    document.querySelector('.logout').addEventListener('click', function() {
        if (confirm('Are you sure you want to logout?')) {
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Logging out...</span>';
            setTimeout(() => {
                window.location.href = '../driver/logout';
            }, 1000);
        }
    });
}

// Load bookings from backend
async function loadBookings() {
    showLoading();

    try {
        const params = new URLSearchParams();
        if (currentFilters.dateRange) params.append('dateRange', currentFilters.dateRange);
        if (currentFilters.status) params.append('status', currentFilters.status);
        if (currentFilters.search) params.append('search', currentFilters.search);

        const response = await fetch(`/driver/pastbookings?${params.toString()}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.status === 401) {
            alert('Please login first');
            window.location.href = '/views/landing/driverlogin.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Failed to fetch bookings');
        }

        const data = await response.json();

        if (data.success) {
            allBookings = data.bookings || [];

            const stats = data.stats || { totalActive: 0, inProgress: 0, upcoming: 0 };
            updateStats(stats);
            renderBookings();
        } else {
            throw new Error(data.error || 'Unknown error');
        }

    } catch (error) {
        console.error('Error loading bookings:', error);
        alert('Failed to load bookings. Please try again.');
        showEmptyState();
    } finally {
        hideLoading();
    }
}

// Update statistics
function updateStats(stats) {
    document.getElementById('completedCount').textContent = stats.totalCompleted || 0;
    document.getElementById('cancelledCount').textContent = stats.totalCancelled || 0;
    document.getElementById('revenueAmount').textContent = 'Rs. ' + (stats.totalRevenue || 0).toLocaleString();
    document.getElementById('avgRating').textContent = (stats.avgRating || 0).toFixed(1);
}

// Render bookings
function renderBookings() {
    if (allBookings.length === 0) {
        showEmptyState();
        return;
    }

    bookingsList.innerHTML = '';
    bookingsContainer.style.display = 'block';
    emptyState.style.display = 'none';

    allBookings.forEach(booking => {
        const card = createBookingCard(booking);
        bookingsList.appendChild(card);
    });

    updateBookingsCount(allBookings.length);
}

// Create booking card element
function createBookingCard(booking) {
    const card = document.createElement('div');
    card.className = 'booking-card';
    card.dataset.bookingId = booking.rideId;

    const statusClass = booking.status.toLowerCase();
    const statusText = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);

    const formattedDate = formatDate(booking.bookingDate);
    const formattedTime = formatTime(booking.startTime);

    card.innerHTML = `
        <div class="booking-header">
            <div class="booking-id">
                <i class="fas fa-hashtag"></i>
                ${booking.rideId}
            </div>
            <div class="booking-status ${statusClass}">${statusText}</div>
        </div>
        
        <div class="booking-info">
            <div class="booking-details">
                <div class="detail-item">
                    <i class="fas fa-user"></i>
                    <span class="detail-label">Customer:</span>
                    <span class="detail-value">${booking.customerName}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span class="detail-label">Date:</span>
                    <span class="detail-value">${formattedDate}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-clock"></i>
                    <span class="detail-label">Time:</span>
                    <span class="detail-value">${formattedTime}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-dollar-sign"></i>
                    <span class="detail-label">Fare:</span>
                    <span class="detail-value">Rs. ${booking.totalAmount.toLocaleString()}</span>
                </div>
                <!--<div class="detail-item">
                    <i class="fas fa-star"></i>
                    <span class="detail-label">Rating:</span>
                    <span class="detail-value">N/A</span>
                </div>-->
            </div>
            
            <div class="location-info">
                <div class="location-item pickup">
                    <i class="fas fa-map-marker-alt pickup-icon"></i>
                    <span class="location-text">${booking.pickupLocation}</span>
                </div>
                <div class="location-item dropoff">
                    <i class="fas fa-map-marker-alt dropoff-icon"></i>
                    <span class="location-text">${booking.dropoffLocation}</span>
                </div>
            </div>
        </div>
        
        <div class="booking-actions">
            <button class="btn btn-outline" onclick="viewBookingDetails('${booking.rideId}')">
                <i class="fas fa-eye"></i>
                View Details
            </button>
        </div>
    `;

    return card;
}

// View booking details
function viewBookingDetails(rideId) {
    const booking = allBookings.find(b => b.rideId === rideId);
    if (!booking) return;

    const modalContent = document.getElementById('modalBookingDetails');
    const formattedDate = formatDate(booking.bookingDate);
    const formattedTime = formatTime(booking.startTime);
    const statusClass = booking.status.toLowerCase();
    const statusColor = statusClass === 'completed' ? '#28a745' : '#dc3545';

    modalContent.innerHTML = `
        <div style="display: grid; gap: 20px;">
            <!-- Customer Information -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h4 style="color: var(--primary); margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-user-circle"></i> Customer Information
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Name</div>
                        <div style="font-weight: 600;">${booking.customerName}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Phone</div>
                        <div style="font-weight: 600;">${booking.customerPhone || 'N/A'}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Email</div>
                        <div style="font-weight: 600;">${booking.customerEmail || 'N/A'}</div>
                    </div>
                </div>
            </div>

            <!-- Vehicle Information -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h4 style="color: var(--primary); margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-car"></i> Vehicle Information
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Vehicle</div>
                        <div style="font-weight: 600;">${booking.vehicleModel} - ${booking.vehiclePlate}</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Duration</div>
                        <div style="font-weight: 600;">${booking.estimatedDuration} minutes</div>
                    </div>
                    <div>
                        <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Distance</div>
                        <div style="font-weight: 600;">${booking.distance} km</div>
                    </div>
                </div>
            </div>

            <!-- Booking Details -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h4 style="color: var(--primary); margin-bottom: 15px; display: flex; align-items: center; gap: 10px;">
                    <i class="fas fa-calendar-check"></i> Booking Details
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <div style="margin-bottom: 15px;">
                            <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Booking ID</div>
                            <div style="font-weight: 600;">${booking.rideId}</div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Date & Time</div>
                            <div style="font-weight: 600;">${formattedDate} at ${formattedTime}</div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Status</div>
                            <div style="font-weight: 600; color: ${statusColor}; text-transform: capitalize;">${booking.status}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Fare</div>
                            <div style="font-weight: 600; font-size: 18px; color: var(--primary);">Rs. ${booking.totalAmount.toLocaleString()}</div>
                        </div>
                    </div>
                    <div>
                        <div style="margin-bottom: 15px;">
                            <div style="font-size: 12px; color: var(--text-light); margin-bottom: 8px;">Pickup Location</div>
                            <div style="display: flex; align-items: center; gap: 8px; background: rgba(40, 167, 69, 0.05); padding: 10px; border-radius: 6px; border-left: 4px solid #28a745;">
                                <i class="fas fa-map-marker-alt" style="color: #28a745;"></i>
                                <span style="font-weight: 500;">${booking.pickupLocation}</span>
                            </div>
                        </div>
                        <div style="margin-bottom: 15px;">
                            <div style="font-size: 12px; color: var(--text-light); margin-bottom: 8px;">Dropoff Location</div>
                            <div style="display: flex; align-items: center; gap: 8px; background: rgba(247, 37, 133, 0.05); padding: 10px; border-radius: 6px; border-left: 4px solid var(--danger);">
                                <i class="fas fa-map-marker-alt" style="color: var(--danger);"></i>
                                <span style="font-weight: 500;">${booking.dropoffLocation}</span>
                            </div>
                        </div>
                        ${booking.specialInstructions ? `
                        <div>
                            <div style="font-size: 12px; color: var(--text-light); margin-bottom: 4px;">Special Instructions</div>
                            <div style="font-weight: 500; font-size: 13px;">${booking.specialInstructions}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;

    bookingDetailsModal.style.display = 'block';
}

// Close booking modal
function closeBookingModal() {
    bookingDetailsModal.style.display = 'none';
}

// Utility functions
function showLoading() {
    loadingSpinner.style.display = 'flex';
    bookingsContainer.style.display = 'none';
    emptyState.style.display = 'none';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showEmptyState() {
    bookingsContainer.style.display = 'none';
    emptyState.style.display = 'block';
    updateBookingsCount(0);
}

function updateBookingsCount(count) {
    document.getElementById('bookingsCount').textContent = `${count} total bookings`;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(timeString) {
    if (!timeString) return 'N/A';

    if (timeString.length === 5) {
        return formatTo12Hour(timeString);
    } else if (timeString.length === 8) {
        return formatTo12Hour(timeString.substring(0, 5));
    }

    return timeString;
}

function formatTo12Hour(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}