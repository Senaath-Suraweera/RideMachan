// <CHANGE> Complete rewrite - Dynamic calendar with navigation and date selection

class MaintenanceCalendar {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.appointments = {
            '2025-07-15': [
                { time: '09:00 AM', vehicle: 'ABC-1234', service: 'Oil Change', bay: 'Bay 1', status: 'Scheduled' },
                { time: '02:00 PM', vehicle: 'XYZ-5678', service: 'Brake Inspection', bay: 'Bay 2', status: 'Scheduled' }
            ],
            '2025-07-22': [
                { time: '10:00 AM', vehicle: 'DEF-9012', service: 'Tire Rotation', bay: 'Bay 3', status: 'Scheduled' }
            ],
            '2025-07-30': [
                { time: '09:00 AM', vehicle: 'ABC-1234', service: 'Oil Change', bay: 'Bay 1', status: 'Scheduled' },
                { time: '02:00 PM', vehicle: 'GHI-3456', service: 'Filter Replacement', bay: 'Bay 2', status: 'Scheduled' }
            ]
        };
        this.init();
    }

    init() {
        this.renderCalendar();
        this.attachEventListeners();
        this.updateAppointmentsList();
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const monthDisplay = document.querySelector('.current-month');
        if (monthDisplay) {
            monthDisplay.textContent = `${monthNames[month]} ${year}`;
        }

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const daysInPrevMonth = new Date(year, month, 0).getDate();

        // Clear existing dates
        const datesContainer = document.querySelector('.calendar-dates');
        if (!datesContainer) return;
        datesContainer.innerHTML = '';

        // Add previous month's dates
        for (let i = firstDay - 1; i >= 0; i--) {
            const dateCell = document.createElement('div');
            dateCell.className = 'date-cell prev-month';
            dateCell.textContent = daysInPrevMonth - i;
            datesContainer.appendChild(dateCell);
        }

        // Add current month's dates
        for (let day = 1; day <= daysInMonth; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'date-cell';
            dateCell.textContent = day;

            // Check if today
            const today = new Date();
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dateCell.classList.add('current-day');
            }

            // Check if selected
            if (day === this.selectedDate.getDate() && month === this.selectedDate.getMonth() && year === this.selectedDate.getFullYear()) {
                dateCell.classList.add('selected');
            }

            // Check if has appointments
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            if (this.appointments[dateKey]) {
                const badge = document.createElement('span');
                badge.className = 'appointment-badge';
                badge.textContent = this.appointments[dateKey].length;
                dateCell.appendChild(badge);
            }

            // Add click handler
            dateCell.addEventListener('click', () => this.selectDate(day, month, year));
            datesContainer.appendChild(dateCell);
        }

        // Add next month's dates
        const totalCells = datesContainer.children.length;
        const remainingCells = 42 - totalCells; // 6 rows × 7 days
        for (let day = 1; day <= remainingCells; day++) {
            const dateCell = document.createElement('div');
            dateCell.className = 'date-cell next-month';
            dateCell.textContent = day;
            datesContainer.appendChild(dateCell);
        }
    }

    selectDate(day, month, year) {
        this.selectedDate = new Date(year, month, day);
        this.renderCalendar();
        this.updateAppointmentsList();
    }

    updateAppointmentsList() {
        const dateKey = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}-${String(this.selectedDate.getDate()).padStart(2, '0')}`;
        const appointmentList = document.querySelector('.appointment-list');
        const scheduledSection = document.querySelector('.scheduled-section h3');

        if (!appointmentList) return;

        // Update heading
        if (scheduledSection) {
            const dateStr = this.selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            scheduledSection.textContent = `Bookings for ${dateStr}`;
        }

        // Clear and populate appointments
        appointmentList.innerHTML = '';
        const dayAppointments = this.appointments[dateKey] || [];

        if (dayAppointments.length === 0) {
            appointmentList.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">No appointments scheduled for this date</p>';
            return;
        }

        dayAppointments.forEach(apt => {
            const appointmentItem = document.createElement('div');
            appointmentItem.className = 'appointment-item';
            appointmentItem.innerHTML = `
                <div class="appointment-time">
                    <span class="time">${apt.time}</span>
                </div>
                <div class="appointment-details">
                    <div class="vehicle-info">
                        <span class="vehicle-icon">🚗</span>
                        <span class="vehicle-id">${apt.vehicle}</span>
                    </div>
                    <div class="service-type">${apt.service}</div>
                </div>
                <div class="appointment-actions">
                    <span class="status-badge ${apt.status.toLowerCase()}">${apt.status}</span>
                </div>
            `;
            appointmentList.appendChild(appointmentItem);
        });
    }

    attachEventListeners() {
        // Previous month button
        const prevBtn = document.querySelector('.calendar-nav .nav-btn:first-child');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.renderCalendar();
            });
        }

        // Next month button
        const nextBtn = document.querySelector('.calendar-nav .nav-btn:last-child');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.renderCalendar();
            });
        }
    }
}

// Initialize calendar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new MaintenanceCalendar();

    // <CHANGE> Schedule Maintenance Modal
    function openScheduleMaintenanceModal(vehicleId = "") {
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); display: flex;
            justify-content: center; align-items: center; z-index: 1000;
        `;

        const modal = document.createElement("div");
        modal.style.cssText = `
            background-color: #fff; padding: 25px 30px; border-radius: 12px;
            width: 400px; box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            font-family: 'Inter', sans-serif;
        `;

        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";

        const title = document.createElement("h2");
        title.textContent = "Schedule Maintenance";

        const closeBtn = document.createElement("span");
        closeBtn.innerHTML = "&times;";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontSize = "24px";
        closeBtn.style.color = "#555";
        closeBtn.onclick = () => document.body.removeChild(overlay);

        header.appendChild(title);
        header.appendChild(closeBtn);

        const form = document.createElement("form");
        form.style.marginTop = "20px";

        const fields = [
            { label: "Maintenance Type", type: "text", name: "maintenanceType", placeholder: "e.g., Oil Change, Brake Inspection" },
            { label: "Date & Time", type: "datetime-local", name: "dateTime" },
            { label: "Bay / Location", type: "text", name: "bayLocation", placeholder: "e.g., Bay 1, Workshop A" }
        ];

        fields.forEach(f => {
            const wrapper = document.createElement("div");
            wrapper.style.marginBottom = "15px";

            const lbl = document.createElement("label");
            lbl.textContent = f.label;
            lbl.style.display = "block";
            lbl.style.marginBottom = "5px";
            lbl.style.fontWeight = "600";

            const input = document.createElement("input");
            input.type = f.type;
            input.name = f.name;
            input.placeholder = f.placeholder || "";
            input.required = true;
            input.style.width = "100%";
            input.style.padding = "8px";
            input.style.borderRadius = "6px";
            input.style.border = "1px solid #ccc";
            input.style.fontSize = "14px";

            wrapper.appendChild(lbl);
            wrapper.appendChild(input);
            form.appendChild(wrapper);
        });

        const submitBtn = document.createElement("button");
        submitBtn.type = "submit";
        submitBtn.textContent = "Save Schedule";
        submitBtn.style.cssText = `
            padding: 10px 25px; background-color: #007BFF; color: #fff;
            border: none; border-radius: 6px; cursor: pointer; font-weight: 600;
        `;
        form.appendChild(submitBtn);

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            alert("✅ Maintenance Scheduled!");
            document.body.removeChild(overlay);
        });

        modal.appendChild(header);
        modal.appendChild(form);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    // Bind Schedule Maintenance button
    const scheduleBtn = document.getElementById("openScheduleBtn");
    if (scheduleBtn) {
        scheduleBtn.addEventListener("click", () => openScheduleMaintenanceModal());
    }

    // <CHANGE> Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const regNumber = searchInput.value.trim();
                if (regNumber) {
                    window.location.href = `vehiclerecords.html?reg=${encodeURIComponent(regNumber)}`;
                }
            }
        });
    }

    // <CHANGE> User profile dropdown (removed duplicate code)
    const userProfile = document.querySelector('.user-profile');
    if (userProfile) {
        const dropdownMenu = document.createElement('div');
        dropdownMenu.style.cssText = `
            position: absolute; top: 60px; right: 0;
            background-color: #fff; border: 1px solid #ccc;
            border-radius: 5px; width: 150px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            display: none; z-index: 1000; font-family: sans-serif;
        `;

        const profileItem = document.createElement('div');
        profileItem.textContent = 'Profile';
        profileItem.style.cssText = 'padding: 10px; cursor: pointer;';
        profileItem.addEventListener('click', () => {
            window.location.href = 'staffprofile.html';
        });
        dropdownMenu.appendChild(profileItem);

        const logoutItem = document.createElement('div');
        logoutItem.textContent = 'Logout';
        logoutItem.style.cssText = 'padding: 10px; cursor: pointer;';
        logoutItem.addEventListener('click', () => {
            alert('Logging out...');
            window.location.href = 'login.html';
        });
        dropdownMenu.appendChild(logoutItem);

        userProfile.style.position = 'relative';
        userProfile.appendChild(dropdownMenu);

        userProfile.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        document.addEventListener('click', () => {
            dropdownMenu.style.display = 'none';
        });
    }

    // <CHANGE> Mark under maintenance
    function markUnderMaintenance() {
        alert("Vehicle ABC-123 marked as Under Maintenance");
    }

    const undermaintenanceBtn = document.getElementById("undermaintenanceBtn");
    if (undermaintenanceBtn) {
        undermaintenanceBtn.addEventListener('click', markUnderMaintenance);
    }
});




























// Pure JS Calendar
class PureCalendar {
    constructor(container = document.body) {
        this.container = container;
        this.currentDate = new Date();
        this.selectedDate = new Date();
        this.init();
    }

    init() {
        // Create main calendar container
        this.calendarEl = document.createElement('div');
        this.calendarEl.style.width = '300px';
        this.calendarEl.style.fontFamily = 'Arial, sans-serif';
        this.calendarEl.style.border = '1px solid #ccc';
        this.calendarEl.style.borderRadius = '8px';
        this.calendarEl.style.padding = '10px';
        this.calendarEl.style.userSelect = 'none';

        this.container.appendChild(this.calendarEl);
        this.renderNav();
        this.renderDaysHeader();
        this.renderDates();
    }

    renderNav() {
        // Navigation
        const nav = document.createElement('div');
        nav.style.display = 'flex';
        nav.style.justifyContent = 'space-between';
        nav.style.alignItems = 'center';
        nav.style.marginBottom = '10px';

        const prevBtn = document.createElement('button');
        prevBtn.textContent = '<';
        prevBtn.style.cursor = 'pointer';
        prevBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderDates();
        });

        const nextBtn = document.createElement('button');
        nextBtn.textContent = '>';
        nextBtn.style.cursor = 'pointer';
        nextBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderDates();
        });

        this.monthDisplay = document.createElement('span');
        this.monthDisplay.style.fontWeight = 'bold';

        nav.appendChild(prevBtn);
        nav.appendChild(this.monthDisplay);
        nav.appendChild(nextBtn);

        this.calendarEl.appendChild(nav);
    }

    renderDaysHeader() {
        // Days header
        const daysHeader = document.createElement('div');
        daysHeader.style.display = 'grid';
        daysHeader.style.gridTemplateColumns = 'repeat(7, 1fr)';
        daysHeader.style.textAlign = 'center';
        daysHeader.style.fontWeight = 'bold';
        daysHeader.style.marginBottom = '5px';

        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        days.forEach(day => {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            daysHeader.appendChild(dayEl);
        });

        this.calendarEl.appendChild(daysHeader);
    }

    renderDates() {
        // Remove old grid if exists
        if (this.datesGrid) this.calendarEl.removeChild(this.datesGrid);

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        // Update month display
        const monthNames = ['January','February','March','April','May','June',
                            'July','August','September','October','November','December'];
        this.monthDisplay.textContent = `${monthNames[month]} ${year}`;

        // Create dates grid
        this.datesGrid = document.createElement('div');
        this.datesGrid.style.display = 'grid';
        this.datesGrid.style.gridTemplateColumns = 'repeat(7, 1fr)';
        this.datesGrid.style.gap = '5px';

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Fill in empty cells for previous month
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            this.datesGrid.appendChild(emptyCell);
        }

        // Fill current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEl = document.createElement('div');
            dayEl.textContent = day;
            dayEl.style.padding = '8px';
            dayEl.style.textAlign = 'center';
            dayEl.style.cursor = 'pointer';
            dayEl.style.borderRadius = '50%';
            dayEl.style.transition = '0.2s';

            // Highlight today
            const today = new Date();
            if (day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear()) {
                dayEl.style.backgroundColor = '#007BFF';
                dayEl.style.color = 'white';
            }

            // Highlight selected date
            if (day === this.selectedDate.getDate() &&
                month === this.selectedDate.getMonth() &&
                year === this.selectedDate.getFullYear()) {
                dayEl.style.border = '2px solid #FF5733';
            }

            dayEl.addEventListener('click', () => {
                this.selectedDate = new Date(year, month, day);
                this.renderDates();
                alert(`Selected Date: ${this.selectedDate.toDateString()}`);
            });

            this.datesGrid.appendChild(dayEl);
        }

        this.calendarEl.appendChild(this.datesGrid);
    }
}

// Initialize calendar
new PureCalendar();
