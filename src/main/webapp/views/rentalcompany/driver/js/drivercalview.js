// Driver Calendar View JavaScript

document.addEventListener('DOMContentLoaded', function() {
    loadDriverData();
    initializeCalendar();
    initializeEventListeners();
});

// ==========================================
// DATA LOADING
// ==========================================

async function loadDriverData() {
    try {
        const response = await fetch('/drivercalview', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin'
        });

        const data = await response.json();
        console.log(data);

        if (response.status === 401) {
            alert('Please login first');
            window.location.href = '/views/landing/driverlogin.html';
            return;
        }

        if (data.success) {
            populateDriverInfo(data.driver);
            displayBookings(data.bookings || []);
        } else {
            console.error('Failed to load data:', data.message);
            showMessage('Failed to load data');
        }

    } catch (error) {
        console.error('Error loading data:', error);
        showMessage('Error connecting to server');
    }
}

// ==========================================
// DRIVER INFO DISPLAY
// ==========================================

function populateDriverInfo(driver) {
const driverName = document.getElementById('driverName');
const profileInitial = document.getElementById('profileInitial');

if (driverName) {
const displayName = driver.fullName ||
    (driver.firstName && driver.lastName ?
        `${driver.firstName} ${driver.lastName}` :
        driver.firstName || driver.username || 'Driver');
driverName.textContent = displayName;
}

if (profileInitial) {
const nameForInitial = driver.firstName || driver.username || 'D';
profileInitial.textContent = nameForInitial.charAt(0).toUpperCase();
}

console.log('Driver data loaded:', driver);
}

// ==========================================
// BOOKING DISPLAY
// ==========================================

function displayBookings(bookings) {
const timeSlots = document.querySelectorAll('.time-slot');

// Clear all existing bookings
timeSlots.forEach(slot => {
const content = slot.querySelector('.slot-content');
if (content) {
    content.innerHTML = '<div class="no-booking">No booking scheduled</div>';
}
});

// If no bookings, just show the message
if (!bookings || bookings.length === 0) {
updateSummary([]);
return;
}

// Add bookings to appropriate time slots
bookings.forEach(booking => {
if (!booking.bookingTime) return;

// Extract hour from booking time (format: HH:mm:ss)
const timeStr = booking.bookingTime.toString();
const hour = parseInt(timeStr.split(':')[0]);

// Find the corresponding time slot
const slot = Array.from(timeSlots).find(s => {
    const timeText = s.querySelector('.time')?.textContent;
    if (!timeText) return false;
    const slotHour = parseInt(timeText.split(':')[0]);
    return slotHour === hour;
});

if (slot) {
    const content = slot.querySelector('.slot-content');
    if (content) {
        content.innerHTML = createBookingCard(booking);
    }
}
});

updateSummary(bookings);
initializeActionButtons();
}

function createBookingCard(booking) {
const statusClass = booking.status === 'completed' ? 'status-completed' : 'status-upcoming';
const statusText = booking.status ? booking.status.toUpperCase() : 'PENDING';

return `
<div class="booking-card">
    <div class="booking-header">
        <div class="status-badge ${statusClass}">${statusText}</div>
        <div class="customer-id">Ride ID: ${booking.rideId || 'N/A'}</div>
    </div>
    <div class="vehicle-type">${booking.vehicleModel || 'Vehicle'}</div>
    <div class="customer-name">${booking.customerName || 'Customer'}</div>
    <div class="customer-phone">${booking.customerPhone || 'N/A'}</div>
    <div class="trip-details">
        <div class="location pickup">
            <i class="fas fa-circle"></i>
            <span>Pickup: ${booking.pickupLocation || 'Not specified'}</span>
        </div>
        <div class="location drop">
            <i class="fas fa-circle"></i>
            <span>Drop: ${booking.dropoffLocation || 'Not specified'}</span>
        </div>
    </div>
    <div class="booking-actions">
        <button class="action-btn" onclick="viewCustomer('${booking.rideId}')">View Customer</button>
        <button class="action-btn" onclick="viewVehicle('${booking.vehiclePlate || 'N/A'}')">View Company Vehicle</button>
        <button class="action-btn" onclick="reportIssue('${booking.rideId}')">Report Issue</button>
    </div>
</div>
`;
}

function updateSummary(bookings) {
const summaryItems = document.querySelectorAll('.summary-item');

if (summaryItems.length >= 3) {
// Update total trips
const totalTrips = summaryItems[0].querySelector('.summary-value');
if (totalTrips) totalTrips.textContent = bookings.length;

// Update earliest and latest times
if (bookings.length > 0) {
    const times = bookings
        .map(b => b.bookingTime ? parseInt(b.bookingTime.toString().split(':')[0]) : null)
        .filter(t => t !== null);

    if (times.length > 0) {
        const earliest = summaryItems[1].querySelector('.summary-value');
        const latest = summaryItems[2].querySelector('.summary-value');

        if (earliest) earliest.textContent = `${Math.min(...times)}:00`;
        if (latest) latest.textContent = `${Math.max(...times)}:00`;
    }
} else {
    const earliest = summaryItems[1].querySelector('.summary-value');
    const latest = summaryItems[2].querySelector('.summary-value');
    if (earliest) earliest.textContent = '--';
    if (latest) latest.textContent = '--';
}
}
}

// ==========================================
// CALENDAR FUNCTIONALITY
// ==========================================

function initializeCalendar() {
const today = new Date();
const monthYearElement = document.getElementById('currentMonthYear');

if (monthYearElement) {
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
monthYearElement.textContent = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
}

generateCalendarDays(today.getFullYear(), today.getMonth());
}

function generateCalendarDays(year, month) {
const calendarGrid = document.querySelector('.calendar-grid');
if (!calendarGrid) return;

let bodyDiv = calendarGrid.querySelector('.calendar-body');
if (bodyDiv) bodyDiv.remove();

bodyDiv = document.createElement('div');
bodyDiv.className = 'calendar-body';

const firstDay = new Date(year, month, 1).getDay();
const daysInMonth = new Date(year, month + 1, 0).getDate();
const today = new Date();

// Previous month days
const prevMonthDays = new Date(year, month, 0).getDate();
for (let i = firstDay - 1; i >= 0; i--) {
const day = document.createElement('div');
day.className = 'calendar-day other-month';
day.textContent = prevMonthDays - i;
bodyDiv.appendChild(day);
}

// Current month days
for (let day = 1; day <= daysInMonth; day++) {
const dayEl = document.createElement('div');
dayEl.className = 'calendar-day';
dayEl.textContent = day;

if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
    dayEl.classList.add('today');
}

dayEl.addEventListener('click', function() {
    if (!this.classList.contains('other-month')) {
        document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
        this.classList.add('selected');
    }
});

bodyDiv.appendChild(dayEl);
}

// Next month days
const totalCells = firstDay + daysInMonth;
const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
for (let i = 1; i <= remainingCells; i++) {
const day = document.createElement('div');
day.className = 'calendar-day other-month';
day.textContent = i;
bodyDiv.appendChild(day);
}

calendarGrid.appendChild(bodyDiv);
}

// ==========================================
// EVENT LISTENERS
// ==========================================

function initializeEventListeners() {
const prevBtn = document.getElementById('prevMonth');
const nextBtn = document.getElementById('nextMonth');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');

if (prevBtn) prevBtn.addEventListener('click', () => navigateMonth(-1));
if (nextBtn) nextBtn.addEventListener('click', () => navigateMonth(1));
if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
if (refreshBtn) {
refreshBtn.addEventListener('click', () => {
    showMessage('Refreshing calendar...');
    loadDriverData();
});
}
}

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function navigateMonth(direction) {
currentMonth += direction;

if (currentMonth > 11) {
currentMonth = 0;
currentYear++;
} else if (currentMonth < 0) {
currentMonth = 11;
currentYear--;
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
'July', 'August', 'September', 'October', 'November', 'December'];

const monthYearElement = document.getElementById('currentMonthYear');
if (monthYearElement) {
monthYearElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

generateCalendarDays(currentYear, currentMonth);
}

// ==========================================
// ACTION HANDLERS
// ==========================================

function viewCustomer(rideId) {
showMessage(`Opening customer details for ride ${rideId}...`);
// TODO: Implement customer details view
}

function viewVehicle(plate) {
showMessage(`Opening vehicle details for ${plate}...`);
// TODO: Implement vehicle details view
}

function reportIssue(rideId) {
showMessage(`Opening issue report for ride ${rideId}...`);
// TODO: Navigate to issue reporting page
// window.location.href = `reportissue.html?rideId=${rideId}`;
}

function initializeActionButtons() {
const summaryBtns = document.querySelectorAll('.summary-btn');
summaryBtns.forEach(btn => {
if (!btn.id && btn.textContent.includes('Contact Admin')) {
    btn.addEventListener('click', () => {
        showMessage('Contacting admin...');
    });
}
});
}

// ==========================================
// LOGOUT
// ==========================================

async function handleLogout() {
if (confirm('Are you sure you want to logout?')) {
try {
    const response = await fetch('driverlogout', {
        method: 'POST',
        credentials: 'same-origin'
    });

    showMessage('Logging out...');
    setTimeout(() => {
        window.location.href = 'driverlogin.html';
    }, 1000);

} catch (error) {
    console.error('Logout error:', error);
    window.location.href = 'driverlogin.html';
}
}
}

// ==========================================
// SIDEBAR
// ==========================================

function toggleSidebar() {
const sidebar = document.getElementById('sidebar');
const overlay = document.querySelector('.sidebar-overlay');
if (sidebar) sidebar.classList.toggle('active');
if (overlay) overlay.classList.toggle('active');
}

document.addEventListener('click', function(event) {
const sidebar = document.getElementById('sidebar');
const toggle = document.querySelector('.mobile-toggle');
const overlay = document.querySelector('.sidebar-overlay');

if (window.innerWidth <= 992) {
if (!sidebar.contains(event.target) && !toggle.contains(event.target)) {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
}
}
});

window.addEventListener('resize', function() {
const sidebar = document.getElementById('sidebar');
const overlay = document.querySelector('.sidebar-overlay');
if (window.innerWidth > 992) {
sidebar.classList.remove('active');
overlay.classList.remove('active');
}
});

// ==========================================
// UTILITIES
// ==========================================

function showMessage(message) {
const notification = document.createElement('div');
notification.className = 'success-notification';
notification.innerHTML = `
<i class="fas fa-check-circle"></i>
<span>${message}</span>
`;
notification.style.cssText = `
position: fixed;
top: 20px;
right: 20px;
background: linear-gradient(135deg, #4361ee, #3a0ca3);
color: white;
padding: 12px 20px;
border-radius: 8px;
box-shadow: 0 4px 12px rgba(67, 97, 238, 0.3);
z-index: 10000;
display: flex;
align-items: center;
gap: 8px;
font-family: 'Poppins', sans-serif;
font-size: 14px;
animation: slideIn 0.3s ease-out;
`;

document.body.appendChild(notification);

setTimeout(() => {
notification.style.animation = 'slideOut 0.3s ease-in';
setTimeout(() => {
    if (notification.parentNode) {
        document.body.removeChild(notification);
    }
}, 300);
}, 3000);
}