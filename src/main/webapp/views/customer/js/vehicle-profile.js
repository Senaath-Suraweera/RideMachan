// Vehicle data with hourly rates
const vehicleDetails = {
    1: {
        id: 1,
        name: "Honda Vezel",
        company: "Premium Rentals Colombo",
        companyId: 1,
        location: "Colombo 03, Sri Lanka",
        hourlyRate: 2700,
        hourlyRateWithDriver: 3500,
        rating: 4.7,
        reviews: 47,
        year: 2022,
        mileage: "16 km/L",
        engine: "1.5L Hybrid",
        color: "Pearl White",
        transmission: "CVT Automatic",
        fuel: "Hybrid Petrol",
        seats: 5,
        ac: "Dual Zone AC",
        luggage: "3-4 Large Bags",
        bookedDates: [
            '2025-10-20',
            '2025-10-21',
            '2025-10-22',
            '2025-10-25',
            '2025-10-26',
            '2025-11-01',
            '2025-11-02',
            '2025-11-03'
        ],
        pickupLocations: [
            'Colombo 01', 'Colombo 02', 'Colombo 03', 'Colombo 04',
            'Colombo 05', 'Colombo 06', 'Colombo 07', 'Colombo 08',
            'Colombo 09', 'Colombo 10', 'Colombo 11', 'Colombo 12',
            'Colombo 13', 'Colombo 14', 'Colombo 15', 'Colombo Suburbs'
        ]
    }
};

let isWishlisted = false;
let selectedMode = 'self-drive';
let bookingData = {
    pickupDate: null,
    pickupTime: null,
    returnDate: null,
    returnTime: null,
    pickupLocation: '',
    hours: 0,
    subtotal: 0,
    serviceFee: 500,
    total: 500
};
let currentCalendarMonth = new Date();

document.addEventListener('DOMContentLoaded', function() {
    loadVehicleDetails();
});

function loadVehicleDetails() {
    const vehicleId = 1;
    const vehicle = vehicleDetails[vehicleId];

    if (!vehicle) return;

    document.getElementById('vehicleName').textContent = vehicle.name;
    document.getElementById('vehicleCompany').textContent = vehicle.company;
    document.getElementById('vehicleLocation').textContent = vehicle.location;
    document.getElementById('vehiclePrice').innerHTML = `LKR ${vehicle.hourlyRate.toLocaleString()}<span class="price-period">/hour</span>`;
    document.getElementById('overallRating').textContent = vehicle.rating;
    document.getElementById('ratingText').textContent = `${vehicle.reviews} reviews`;
    document.getElementById('ratingSummary').textContent = `Based on ${vehicle.reviews} customer reviews`;

    updateStars('vehicleStars', vehicle.rating);
}

function updateStars(containerId, rating) {
    const container = document.getElementById(containerId);
    let starsHTML = '';
    
    for (let i = 1; i <= 5; i++) {
        starsHTML += i <= rating ? '<i class="fas fa-star"></i>' : '<i class="far fa-star"></i>';
    }
    
    container.innerHTML = starsHTML;
}

function bookVehicle() {
    const vehicle = vehicleDetails[1];
    showBookingPopup(vehicle);
}

function showBookingPopup(vehicle) {
    const locationOptions = vehicle.pickupLocations.map(loc => 
        `<option value="${loc}"${loc === vehicle.location ? ' selected' : ''}>${loc}</option>`
    ).join('');
    
    const popup = document.createElement('div');
    popup.className = 'popup-overlay';
    popup.innerHTML = `
        <div class="popup-content">
            <div class="popup-header">
                <h3><i class="fas fa-car"></i> Book Your Vehicle</h3>
                <button class="close-btn" onclick="closePopup()">&times;</button>
            </div>
            <div class="popup-body">
                <!-- Mode Selection -->
                <div class="booking-section">
                    <h4 class="section-title"><i class="fas fa-cog"></i> Select Booking Mode</h4>
                    <div class="mode-selection">
                        <div class="mode-option active" data-mode="self-drive" onclick="selectMode('self-drive')">
                            <div class="mode-icon">
                                <i class="fas fa-car"></i>
                            </div>
                            <div class="mode-details">
                                <div class="mode-title">Self Drive</div>
                                <div class="mode-price">LKR ${vehicle.hourlyRate.toLocaleString()}/hour</div>
                            </div>
                            <div class="mode-check">
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </div>
                        <div class="mode-option" data-mode="with-driver" onclick="selectMode('with-driver')">
                            <div class="mode-icon">
                                <i class="fas fa-user-tie"></i>
                            </div>
                            <div class="mode-details">
                                <div class="mode-title">With Driver</div>
                                <div class="mode-price">LKR ${vehicle.hourlyRateWithDriver.toLocaleString()}/hour</div>
                            </div>
                            <div class="mode-check">
                                <i class="fas fa-check-circle"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Date Time Picker -->
                <div class="booking-section">
                    <div class="datetime-picker-container">
                        <h4 class="datetime-section-title"><i class="fas fa-calendar-alt"></i> Select Dates & Times</h4>
                        
                        <div class="datetime-row">
                            <div class="datetime-field">
                                <label class="datetime-label">
                                    <i class="fas fa-map-marker-alt"></i> PICK-UP DATE
                                </label>
                                <div class="datetime-input-wrapper">
                                    <input type="text" id="pickupDateDisplay" class="datetime-input" placeholder="Select date" readonly onclick="focusPickupDate()" />
                                    <i class="fas fa-calendar datetime-input-icon"></i>
                                </div>
                                <input type="hidden" id="pickupDate" />
                            </div>
                            <div class="datetime-field">
                                <label class="datetime-label">
                                    <i class="fas fa-clock"></i> PICK-UP TIME
                                </label>
                                <div class="datetime-input-wrapper">
                                    <select id="pickupTime" class="datetime-input" onchange="updatePickupDisplay(); calculateDuration();">
                                        <option value="">Select time</option>
                                        ${generateTimeOptions()}
                                    </select>
                                    <i class="fas fa-chevron-down datetime-input-icon"></i>
                                </div>
                            </div>
                        </div>

                        <div class="datetime-row">
                            <div class="datetime-field">
                                <label class="datetime-label">
                                    <i class="fas fa-map-marker-alt"></i> DROP-OFF DATE
                                </label>
                                <div class="datetime-input-wrapper">
                                    <input type="text" id="returnDateDisplay" class="datetime-input" placeholder="Select date" readonly onclick="focusReturnDate()" />
                                    <i class="fas fa-calendar datetime-input-icon"></i>
                                </div>
                                <input type="hidden" id="returnDate" />
                            </div>
                            <div class="datetime-field">
                                <label class="datetime-label">
                                    <i class="fas fa-clock"></i> DROP-OFF TIME
                                </label>
                                <div class="datetime-input-wrapper">
                                    <select id="returnTime" class="datetime-input" onchange="updateReturnDisplay(); calculateDuration();">
                                        <option value="">Select time</option>
                                        ${generateTimeOptions()}
                                    </select>
                                    <i class="fas fa-chevron-down datetime-input-icon"></i>
                                </div>
                            </div>
                        </div>

                        <!-- Calendar View -->
                        <div class="calendar-wrapper">
                            <div class="calendar-header">
                                <div class="calendar-nav">
                                    <button onclick="previousMonth()"><i class="fas fa-chevron-left"></i> Prev</button>
                                    <button onclick="nextMonth()">Next <i class="fas fa-chevron-right"></i></button>
                                </div>
                                <div class="calendar-month-year" id="calendarMonthYear">October 2025</div>
                            </div>
                            <div class="calendar-grid" id="calendarGrid"></div>
                            <div class="calendar-legend">
                                <div class="legend-item">
                                    <div class="legend-color selected"></div>
                                    <span>Selected</span>
                                </div>
                                <div class="legend-item">
                                    <div class="legend-color unavailable"></div>
                                    <span>Unavailable</span>
                                </div>
                                <div class="legend-item">
                                    <div class="legend-color available"></div>
                                    <span>Available</span>
                                </div>
                            </div>
                        </div>

                        <!-- Duration Summary -->
                        <div id="durationSummaryContainer" style="display: none;">
                            <div class="duration-summary">
                                <div class="duration-info">
                                    <span class="duration-label"><i class="fas fa-hourglass-half"></i> Total Duration:</span>
                                    <span class="duration-value" id="totalHours">0 hours</span>
                                </div>
                                <div class="duration-note" id="durationNote"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pickup Location -->
                <div class="booking-section">
                    <div class="location-field">
                        <label for="pickupLocation"><i class="fas fa-location-dot"></i> Pickup Location</label>
                        <select id="pickupLocation" class="location-select" onchange="validateBookingForm()">
                            <option value="">Select pickup location</option>
                            ${locationOptions}
                        </select>
                    </div>
                </div>

                <!-- Cost Summary -->
                <div class="booking-section">
                    <div class="cost-summary">
                        <div class="cost-row">
                            <span>Booking Mode:</span>
                            <span id="selectedModeText">Self Drive</span>
                        </div>
                        <div class="cost-row">
                            <span>Hourly Rate:</span>
                            <span id="hourlyRate">LKR ${vehicle.hourlyRate.toLocaleString()}</span>
                        </div>
                        <div class="cost-row">
                            <span>Duration:</span>
                            <span id="durationText">0 hours</span>
                        </div>
                        <div class="cost-row">
                            <span>Service Fee:</span>
                            <span id="serviceFee">LKR 500</span>
                        </div>
                        <div class="cost-row total">
                            <span>Total Cost:</span>
                            <span id="totalCost">LKR 500</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="popup-footer">
                <button class="btn btn-outline" onclick="closePopup()">Cancel</button>
                <button class="btn btn-primary" id="confirmBookingBtn" onclick="confirmBooking()" disabled style="opacity: 0.6; cursor: not-allowed;">
                    <i class="fas fa-arrow-right"></i>
                    Proceed to Payment
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(popup);
    
    setTimeout(() => {
        renderCalendar();
    }, 100);
}

function renderCalendar() {
    const vehicle = vehicleDetails[1];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const month = currentCalendarMonth.getMonth();
    const year = currentCalendarMonth.getFullYear();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    document.getElementById('calendarMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const grid = document.getElementById('calendarGrid');
    let html = '';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        html += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Empty cells before month starts
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="calendar-day other-month"></div>';
    }
    
    // Get selected dates
    const selectedPickupDate = document.getElementById('pickupDate').value;
    const selectedReturnDate = document.getElementById('returnDate').value;
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        
        const isToday = dateStr === today.toISOString().split('T')[0];
        const isBooked = vehicle.bookedDates.includes(dateStr);
        const isPastDate = date < today;
        const isPickupSelected = dateStr === selectedPickupDate;
        const isReturnSelected = dateStr === selectedReturnDate;
        
        let classes = 'calendar-day';
        let clickable = true;
        
        if (isBooked || isPastDate) {
            classes += ' disabled';
            clickable = false;
        }
        
        if (isToday && !isBooked && !isPastDate) {
            classes += ' today';
        }
        
        if (isPickupSelected || isReturnSelected) {
            classes += ' selected';
        }
        
        const onclick = clickable ? `onclick="selectDate('${dateStr}')"` : '';
        html += `<div class="${classes}" ${onclick}>${day}</div>`;
    }
    
    grid.innerHTML = html;
}

let selectingPickup = true;

function focusPickupDate() {
    selectingPickup = true;
}

function focusReturnDate() {
    const pickupDate = document.getElementById('pickupDate').value;
    if (!pickupDate) {
        showNotification('Please select pickup date first', 'warning');
        return;
    }
    selectingPickup = false;
}

function selectDate(dateStr) {
    const pickupDate = document.getElementById('pickupDate').value;
    const returnDate = document.getElementById('returnDate').value;
    
    // If selecting pickup date
    if (selectingPickup || !pickupDate) {
        document.getElementById('pickupDate').value = dateStr;
        document.getElementById('returnDate').value = '';
        document.getElementById('returnDateDisplay').value = '';
        document.getElementById('returnTime').value = '';
        updatePickupDisplay();
        selectingPickup = false;
    }
    // If selecting return date
    else {
        const pickup = new Date(pickupDate);
        const selected = new Date(dateStr);
        
        if (selected <= pickup) {
            showNotification('Drop-off date must be after pick-up date', 'warning');
            return;
        }
        
        document.getElementById('returnDate').value = dateStr;
        updateReturnDisplay();
    }
    
    renderCalendar();
    calculateDuration();
}

function updatePickupDisplay() {
    const dateValue = document.getElementById('pickupDate').value;
    const timeValue = document.getElementById('pickupTime').value;
    const displayInput = document.getElementById('pickupDateDisplay');
    
    if (dateValue) {
        const date = new Date(dateValue);
        const formatted = formatDateForDisplay(date);
        displayInput.value = timeValue ? `${formatted}, ${formatTimeDisplay(timeValue)}` : formatted;
        displayInput.classList.add('filled');
    } else {
        displayInput.value = '';
        displayInput.classList.remove('filled');
    }
    
    validateBookingForm();
}

function updateReturnDisplay() {
    const dateValue = document.getElementById('returnDate').value;
    const timeValue = document.getElementById('returnTime').value;
    const displayInput = document.getElementById('returnDateDisplay');
    
    if (dateValue) {
        const date = new Date(dateValue);
        const formatted = formatDateForDisplay(date);
        displayInput.value = timeValue ? `${formatted}, ${formatTimeDisplay(timeValue)}` : formatted;
        displayInput.classList.add('filled');
    } else {
        displayInput.value = '';
        displayInput.classList.remove('filled');
    }
    
    validateBookingForm();
}

function formatDateForDisplay(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatTimeDisplay(timeStr) {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${period}`;
}

function previousMonth() {
    const today = new Date();
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() - 1);
    
    // Don't allow going before current month
    if (currentCalendarMonth < new Date(today.getFullYear(), today.getMonth(), 1)) {
        currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + 1);
        showNotification('Cannot select past dates', 'warning');
        return;
    }
    
    renderCalendar();
}

function nextMonth() {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + 1);
    renderCalendar();
}

function generateTimeOptions() {
    let options = '';
    for (let hour = 0; hour < 24; hour++) {
        for (let min = 0; min < 60; min += 30) {
            const timeStr = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            const displayTime = formatTimeDisplay(timeStr);
            options += `<option value="${timeStr}">${displayTime}</option>`;
        }
    }
    return options;
}

function selectMode(mode) {
    selectedMode = mode;
    const vehicle = vehicleDetails[1];
    
    document.querySelectorAll('.mode-option').forEach(opt => {
        opt.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    const rate = mode === 'self-drive' ? vehicle.hourlyRate : vehicle.hourlyRateWithDriver;
    document.getElementById('selectedModeText').textContent = mode === 'self-drive' ? 'Self Drive' : 'With Driver';
    document.getElementById('hourlyRate').textContent = `LKR ${rate.toLocaleString()}`;
    
    calculateDuration();
}

function calculateDuration() {
    const pickupDate = document.getElementById('pickupDate').value;
    const pickupTime = document.getElementById('pickupTime').value;
    const returnDate = document.getElementById('returnDate').value;
    const returnTime = document.getElementById('returnTime').value;
    
    if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
        document.getElementById('durationSummaryContainer').style.display = 'none';
        document.getElementById('durationText').textContent = '0 hours';
        document.getElementById('totalCost').textContent = 'LKR 500';
        validateBookingForm();
        return;
    }
    
    const pickup = new Date(`${pickupDate}T${pickupTime}`);
    const returnDT = new Date(`${returnDate}T${returnTime}`);
    
    if (returnDT <= pickup) {
        showNotification('Drop-off date/time must be after pick-up date/time', 'warning');
        document.getElementById('durationSummaryContainer').style.display = 'none';
        validateBookingForm();
        return;
    }
    
    const diffMs = returnDT - pickup;
    const hours = Math.ceil(diffMs / (1000 * 60 * 60));
    
    const vehicle = vehicleDetails[1];
    const rate = selectedMode === 'self-drive' ? vehicle.hourlyRate : vehicle.hourlyRateWithDriver;
    const serviceFee = 500;
    const subtotal = hours * rate;
    const total = subtotal + serviceFee;
    
    document.getElementById('totalHours').textContent = `${hours} hour${hours > 1 ? 's' : ''}`;
    document.getElementById('durationText').textContent = `${hours} hour${hours > 1 ? 's' : ''}`;
    document.getElementById('totalCost').textContent = `LKR ${total.toLocaleString()}`;
    document.getElementById('durationSummaryContainer').style.display = 'block';
    
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    let note = '';
    if (days > 0) {
        note = `Approximately ${days} day${days > 1 ? 's' : ''}`;
        if (remainingHours > 0) {
            note += ` and ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`;
        }
    }
    document.getElementById('durationNote').textContent = note;
    
    bookingData = {
        pickupDate,
        pickupTime,
        returnDate,
        returnTime,
        hours,
        subtotal,
        serviceFee,
        total
    };
    
    validateBookingForm();
}

function validateBookingForm() {
    const pickupDate = document.getElementById('pickupDate').value;
    const pickupTime = document.getElementById('pickupTime').value;
    const returnDate = document.getElementById('returnDate').value;
    const returnTime = document.getElementById('returnTime').value;
    const pickupLocation = document.getElementById('pickupLocation').value;
    
    const confirmBtn = document.getElementById('confirmBookingBtn');
    
    // Enable button only if all fields are filled
    if (pickupDate && pickupTime && returnDate && returnTime && pickupLocation) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
    } else {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.6';
        confirmBtn.style.cursor = 'not-allowed';
    }
}

function confirmBooking() {
    const vehicle = vehicleDetails[1];
    const pickupLocation = document.getElementById('pickupLocation').value.trim();
    
    if (!pickupLocation || !bookingData.pickupDate || !bookingData.pickupTime || 
        !bookingData.returnDate || !bookingData.returnTime) {
        showNotification('Please fill in all booking details', 'warning');
        return;
    }
    
    const pickupDateTime = new Date(`${bookingData.pickupDate}T${bookingData.pickupTime}`);
    const returnDateTime = new Date(`${bookingData.returnDate}T${bookingData.returnTime}`);
    
    const finalBookingData = {
        vehicleId: 1,
        vehicleName: vehicle.name,
        company: vehicle.company,
        mode: selectedMode,
        modeDisplay: selectedMode === 'self-drive' ? 'Self Drive' : 'With Driver',
        pickupDate: bookingData.pickupDate,
        pickupTime: bookingData.pickupTime,
        pickupDateTime: pickupDateTime.toLocaleString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        returnDate: bookingData.returnDate,
        returnTime: bookingData.returnTime,
        returnDateTime: returnDateTime.toLocaleString('en-US', { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }),
        pickupLocation: pickupLocation,
        hours: bookingData.hours,
        hourlyRate: selectedMode === 'self-drive' ? vehicle.hourlyRate : vehicle.hourlyRateWithDriver,
        subtotal: bookingData.subtotal,
        serviceFee: bookingData.serviceFee,
        totalCost: bookingData.total
    };
    
    // Store in window object for next page
    window.bookingDetails = finalBookingData;
    
    // Navigate to payment page
    showNotification('Proceeding to payment...', 'success');
    setTimeout(() => {
        window.location.href = 'payment.html';
    }, 1000);
}

function messageOwner() {
    showNotification('Message feature coming soon!', 'info');
}

function toggleWishlist() {
    const btn = document.getElementById('wishlistBtn');
    const icon = btn.querySelector('i');
    
    if (!isWishlisted) {
        icon.classList.replace('far', 'fas');
        btn.style.background = 'var(--danger)';
        btn.style.color = 'white';
        btn.style.borderColor = 'var(--danger)';
        btn.innerHTML = '<i class="fas fa-heart"></i> Added to Wishlist';
        isWishlisted = true;
        showNotification('Added to wishlist!', 'success');
    } else {
        icon.classList.replace('fas', 'far');
        btn.style.background = 'transparent';
        btn.style.color = 'var(--primary)';
        btn.style.borderColor = 'var(--primary-light)';
        btn.innerHTML = '<i class="far fa-heart"></i> Add to Wishlist';
        isWishlisted = false;
        showNotification('Removed from wishlist!', 'info');
    }
}

function closePopup() {
    const popup = document.querySelector('.popup-overlay');
    if (popup) popup.remove();
    
    // Reset booking data
    bookingData = {
        pickupDate: null,
        pickupTime: null,
        returnDate: null,
        returnTime: null,
        pickupLocation: '',
        hours: 0,
        subtotal: 0,
        serviceFee: 500,
        total: 500
    };
    
    // Reset calendar month
    currentCalendarMonth = new Date();
    selectingPickup = true;
}

function viewCompany() {
    window.location.href = 'company-profile.html';
}

function goBack() {
    if (document.referrer && document.referrer !== window.location.href) {
        window.history.back();
    } else {
        window.location.href = 'search.html';
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Call backend servlet
        fetch('/customer/logout', { method: 'GET' })
            .then(response => {
                // Follow redirect from servlet
                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    // Manual fallback
                    window.location.href = '/views/landing/index.html';
                }
            })
            .catch(error => {
                console.error('Logout failed:', error);
                window.location.href = '/views/landing/index.html';
            });
    }
}


function showNotification(message, type) {
    const notification = document.createElement('div');
    
    const bgColor = type === 'success' ? 'var(--success)' : 
                    type === 'warning' ? 'var(--warning)' : 
                    type === 'error' ? 'var(--danger)' : 
                    'var(--info)';
    
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'warning' ? 'fa-exclamation-triangle' : 
                 type === 'error' ? 'fa-times-circle' : 
                 'fa-info-circle';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${bgColor};
        color: white;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 10001;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}