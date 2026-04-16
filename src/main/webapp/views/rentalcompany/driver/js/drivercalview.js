let selectedDate = null;

document.addEventListener('DOMContentLoaded', async function () {

    console.log("JS loaded");
    initializeCalendar();
    await loadDriverData();

});

async function loadDriverData() {

    try {

        // 🔥 STEP 6A CHANGE: added date filter to backend request
        if (!selectedDate) {
            selectedDate = new Date().toISOString().split('T')[0]; // 🔥 STEP 6B CHANGE
        }

        const response = await fetch(
            `/drivercalview?date=${selectedDate}`, // 🔥 STEP 6A CHANGE
            {
                method: 'GET',
                credentials: 'same-origin'
            }
        );

        if (response.status === 401) {
            alert('Please login first');
            window.location.href = '/views/landing/driverlogin.html';
            return;
        }

        const data = await response.json();
        console.log("DATA:", data);

        if (data && data.driver) {
            populateDriverInfo(data.driver);

            console.log("BOOKINGS:", data.bookings);

            let bookings = data.bookings || [];

            bookings.sort((a, b) => {
                if (!a.bookingTime || !b.bookingTime) return 0;
                return a.bookingTime.localeCompare(b.bookingTime);
            });

            displayBookings(bookings);

        }

    } catch (err) {
        console.error("ERROR:", err);
    }

}

function populateDriverInfo(driver) {

    const nameEl = document.getElementById('driverName');
    const profileInitial = document.getElementById('profileInitial');

    if (nameEl) {
        nameEl.textContent = driver.fullName || driver.username || 'Driver';
    }

    if (profileInitial) {
        const name = driver.firstName || driver.username || 'D';
        profileInitial.textContent = name.charAt(0).toUpperCase();
    }

}

function mapBookingsToSlots(bookings) {

    let slots = document.querySelectorAll('.time-slot');

    slots.forEach(slot => {

        let content = slot.querySelector('.slot-content');

        if (content) {

            content.innerHTML = '<div class="no-booking">No booking scheduled</div>';

        }

    });

    if (!bookings || bookings.length === 0) {
        console.log("No bookings to map");
        return;
    }

    bookings.forEach(booking => {

        if (!booking.bookingTime) {
            return;
        }

        let hour = parseInt(booking.bookingTime.split(':')[0]);

        let slot = document.querySelector(`.time-slot[data-time="${hour}"]`);

        if (slot) {

            let content = slot.querySelector('.slot-content');

            if (content) {

                content.innerHTML = '';

                content.innerHTML = createBookingCard(booking);

            }

        }

    });

}

function displayBookings(bookings) {

    mapBookingsToSlots(bookings);
    updateSummary(bookings);
    initializeActionButtons();

}

function updateSummary(bookings) {

    const summaryItems = document.querySelectorAll('.summary-item');

    if (summaryItems.length >= 3) {

        const totalTrips = summaryItems[0].querySelector('.summary-value');
        if (totalTrips) totalTrips.textContent = bookings.length;

        if (bookings.length > 0) {

            const times = bookings
                .map(b => b.bookingTime ? parseInt(b.bookingTime.split(':')[0]) : null)
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

function createBookingCard(booking) {

    return `
        <div style="
            width: 100%;
            background: white;
            border-radius: 10px;
            padding: 10px;
            box-shadow: 0 4px 20px rgba(58, 12, 163, 0.08);
            border: 1px solid rgba(58, 12, 163, 0.1);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            font-family: Poppins, sans-serif;
        ">

            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 8px;
                padding-bottom: 6px;
                border-bottom: 1px solid #f0f0f0;
            ">

                <div style="
                    font-size: 14px;
                    font-weight: 600;
                    color: #2d3748;
                ">
                    ${booking.customerName || 'Customer'}
                </div>

                <div style="
                    font-size: 11px;
                    padding: 3px 8px;
                    border-radius: 20px;
                    background: linear-gradient(135deg, #48bb78, #38a169);
                    color: white;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                ">
                    ACTIVE
                </div>

            </div>

            <div style="
                font-size: 13px;
                font-weight: 500;
                color: #4a5568;
                margin-bottom: 6px;
            ">
                🚗 ${booking.vehicleModel || 'Vehicle'}
            </div>

            <div style="
                font-size: 12px;
                color: #718096;
                margin-bottom: 8px;
                line-height: 1.4;
            ">
                📍 ${booking.pickupLocation || ''} → ${booking.dropoffLocation || ''}
            </div>

            <div style="
                display: flex;
                justify-content: space-between;
                font-size: 11px;
                color: #a0aec0;
            ">
                <span>🕒 ${booking.bookingTime || ''}</span>
                <span>Ride ID: ${booking.rideId || 'N/A'}</span>
            </div>

        </div>
    `;
}

function initializeCalendar() {

    const today = new Date();
    selectedDate = today.toISOString().split('T')[0];

    const monthYearElement = document.getElementById('currentMonthYear');

    if (monthYearElement) {
        const monthNames = [
            'January','February','March','April','May','June',
            'July','August','September','October','November','December'
        ];

        monthYearElement.textContent =
            `${monthNames[today.getMonth()]} ${today.getFullYear()}`;
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

    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = prevMonthDays - i;
        bodyDiv.appendChild(day);
    }

    for (let d = 1; d <= daysInMonth; d++) {

        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = d;

        const dateStr =
            `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

        dayEl.addEventListener('click', async function () {

            document.querySelectorAll('.calendar-day')
                .forEach(x => x.classList.remove('selected'));

            this.classList.add('selected');

            selectedDate = dateStr;

            console.log("Selected Date:", selectedDate);

            await loadDriverData(); // refresh bookings for selected date

        });

        bodyDiv.appendChild(dayEl);
    }

    calendarGrid.appendChild(bodyDiv);
}

function loadDummyBookings() {

    return [
        {
            bookingTime: "08:00",
            customerName: "Kamal Perera",
            vehicleModel: "Toyota Axio",
            pickupLocation: "Colombo",
            dropoffLocation: "Negombo"
        },
        {
            bookingTime: "11:00",
            customerName: "Nimal Silva",
            vehicleModel: "Honda Fit",
            pickupLocation: "Galle",
            dropoffLocation: "Colombo"
        },
        {
            bookingTime: "15:00",
            customerName: "Saman Kumara",
            vehicleModel: "Suzuki Alto",
            pickupLocation: "Kandy",
            dropoffLocation: "Matale"
        }
    ];
}