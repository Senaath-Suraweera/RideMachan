let selectedDate = null;


document.addEventListener('DOMContentLoaded', async function () {

    console.log("JS loaded");
    initializeCalendar();
    await loadDriverData();

});

/* ================= FETCH ================= */

async function loadDriverData() {

    try {

        if (!selectedDate) {
            selectedDate = new Date().toISOString().split('T')[0];
        }

        const response = await fetch(`/drivercalview?date=${selectedDate}`, {
            method: 'GET',
            credentials: 'same-origin'
        });

        if (response.status === 401) {
            alert('Please login first');
            window.location.href = '/views/landing/driverlogin.html';
            return;
        }

        const data = await response.json();
        console.log("DATA:", data);

        if (data && data.driver) {
            populateDriverInfo(data.driver);

            let bookings = data.bookings || [];

            console.log("BOOKINGS:", bookings);

            displayBookings(bookings);
        }

    } catch (err) {
        console.error("ERROR:", err);
    }
}

/* ================= DRIVER ================= */

function populateDriverInfo(driver) {

    document.getElementById('driverName').textContent =
        driver.fullName || driver.username || 'Driver';

    const name = driver.firstName || driver.username || 'D';
    document.getElementById('profileInitial').textContent =
        name.charAt(0).toUpperCase();
}

/* ================= TIME HELPERS ================= */

function getBookingTimeString(booking) {
    return booking.startTimeStr || null; // 🔥 YOUR FIELD
}

function getBookingHour(booking) {

    const timeStr = getBookingTimeString(booking);

    if (!timeStr) return null;

    let hour = new Date(`1970-01-01T${timeStr}`).getHours();

    return hour;
}

/* ================= MAIN RENDER ================= */

function displayBookings(bookings) {

    // 🔥 RESET ALL SLOTS FIRST
    document.querySelectorAll('.slot-content').forEach(c => {
        c.innerHTML = '<div class="no-booking">No booking scheduled</div>';
    });

    if (!bookings || bookings.length === 0) {
        updateSummary([]);
        return;
    }

    console.log("Selected Date:", selectedDate);

    // 🔥 FILTER BY SELECTED DATE
    const filtered = bookings.filter(b => {
        const bookingDate = b.tripStartDate?.split('T')[0];
        console.log("Booking Date:", bookingDate);
        return bookingDate === selectedDate;
    });

    console.log("Filtered:", filtered);

    filtered.forEach(booking => {

        const hour = getBookingHour(booking);

        if (hour === null) {
            console.log("❌ No time");
            return;
        }

        // 🔥 HANDLE OUTSIDE RANGE (8–18)
        let mappedHour = hour;
        if (hour < 8) mappedHour = 8;
        if (hour > 18) mappedHour = 18;

        console.log(`Mapping ${hour} → ${mappedHour}`);

        const slot = document.querySelector(`.time-slot[data-time="${mappedHour}"]`);

        if (!slot) {
            console.log("❌ No slot for:", mappedHour);
            return;
        }

        const content = slot.querySelector('.slot-content');

        content.innerHTML = createBookingCard(booking);
    });

    updateSummary(filtered);
}

/* ================= SUMMARY ================= */

function updateSummary(bookings) {

    const items = document.querySelectorAll('.summary-item');

    if (items.length < 3) return;

    items[0].querySelector('.summary-value').textContent = bookings.length;

    if (bookings.length === 0) {
        items[1].querySelector('.summary-value').textContent = '--';
        items[2].querySelector('.summary-value').textContent = '--';
        return;
    }

    const times = bookings
        .map(b => getBookingHour(b))
        .filter(t => t !== null);

    items[1].querySelector('.summary-value').textContent = `${Math.min(...times)}:00`;
    items[2].querySelector('.summary-value').textContent = `${Math.max(...times)}:00`;
}

/* ================= CARD ================= */

function createBookingCard(booking) {

    return `
        <div class="booking-card">

            <div class="booking-top">
                <div class="customer-name">
                    ${booking.customerName || 'Customer'}
                </div>

                <div class="status ${booking.status || 'active'}">
                    ${booking.status || 'ACTIVE'}
                </div>
            </div>

            <div class="booking-vehicle">
                ${booking.vehicleModel || 'Vehicle'}
            </div>

            <div class="booking-route">
                ${booking.pickupLocation || ''} → ${booking.dropLocation || ''}
            </div>

            <div class="booking-bottom">
                <div class="time">
                    ${booking.startTimeStr || ''}
                </div>

                <div class="ride-id">
                    ${booking.rideId || ''}
                </div>
            </div>

        </div>
    `;
}

/* ================= CALENDAR ================= */

function initializeCalendar() {

    const today = new Date();
    selectedDate = today.toISOString().split('T')[0];

    updateMonthLabel(today);

    generateCalendarDays(today.getFullYear(), today.getMonth());
}

function updateMonthLabel(date) {

    const months = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];

    document.getElementById('currentMonthYear').textContent =
        `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function generateCalendarDays(year, month) {

    const grid = document.querySelector('.calendar-grid');

    let body = grid.querySelector('.calendar-body');
    if (body) body.remove();

    body = document.createElement('div');
    body.className = 'calendar-body';

    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        body.appendChild(empty);
    }

    for (let d = 1; d <= days; d++) {

        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.textContent = d;

        const dateStr =
            `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

        day.addEventListener('click', async function () {

            document.querySelectorAll('.calendar-day')
                .forEach(x => x.classList.remove('selected'));

            this.classList.add('selected');

            selectedDate = dateStr;

            console.log("Selected:", selectedDate);

            await loadDriverData();
        });

        body.appendChild(day);
    }

    grid.appendChild(body);
}