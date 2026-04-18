let allBookings = [];
let currentYear, currentMonth;
let selectedDateKey = null; // "YYYY-MM-DD"

document.addEventListener("DOMContentLoaded", () => {
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    selectedDateKey = toKey(now);

    bindUI();
    renderMonth(currentYear, currentMonth);
    loadData();
});

function bindUI() {
    byId("prevMonth")?.addEventListener("click", () => changeMonth(-1));
    byId("nextMonth")?.addEventListener("click", () => changeMonth(1));
    byId("refreshBtn")?.addEventListener("click", loadData);

    byId("logoutBtn")?.addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) window.location.href = "/driver/logout";
    });
}

async function loadData() {
    try {
        const res = await fetch("/drivercalview", { method: "GET", credentials: "include" });

        if (res.status === 401) {
            alert("Please login first");
            window.location.href = "/views/landing/driverlogin.html";
            return;
        }

        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to load calendar data");

        populateDriver(data.driver || {});
        allBookings = data.bookings || [];

        // default render for selected date
        displayBookingsForDate(selectedDateKey);

    } catch (e) {
        console.error(e);
        alert("Failed to load calendar");
    }
}

function populateDriver(driver) {
    const name =
        driver.fullName ||
        [driver.firstName, driver.lastName].filter(Boolean).join(" ") ||
        driver.username ||
        "Driver";

    const initial = (driver.firstName || driver.username || "D").charAt(0).toUpperCase();

    byId("driverName").textContent = name;
    byId("profileInitial").textContent = initial;
}

function renderMonth(year, month) {
    const monthNames = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];
    byId("currentMonthYear").textContent = `${monthNames[month]} ${year}`;

    const grid = document.querySelector(".calendar-grid");
    if (!grid) return;

    grid.querySelector(".calendar-body")?.remove();
    const body = document.createElement("div");
    body.className = "calendar-body";

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    // prev month fill
    for (let i = firstDay - 1; i >= 0; i--) body.appendChild(dayCell(prevMonthDays - i, true));

    // current month
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = dayCell(d, false);
        const key = `${year}-${pad(month + 1)}-${pad(d)}`;
        cell.dataset.date = key;

        if (key === toKey(new Date())) cell.classList.add("today");
        if (key === selectedDateKey) cell.classList.add("selected");

        cell.addEventListener("click", () => {
            selectedDateKey = key;
            document.querySelectorAll(".calendar-day").forEach(x => x.classList.remove("selected"));
            cell.classList.add("selected");
            displayBookingsForDate(selectedDateKey);
        });

        body.appendChild(cell);
    }

    // next month fill
    const totalCells = firstDay + daysInMonth;
    const rem = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
    for (let i = 1; i <= rem; i++) body.appendChild(dayCell(i, true));

    grid.appendChild(body);
}

function dayCell(text, otherMonth) {
    const el = document.createElement("div");
    el.className = "calendar-day" + (otherMonth ? " other-month" : "");
    el.textContent = text;
    return el;
}

function changeMonth(dir) {
    currentMonth += dir;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderMonth(currentYear, currentMonth);
}

function displayBookingsForDate(dateKey) {
    // reset slots
    document.querySelectorAll(".time-slot .slot-content").forEach(c => {
        c.innerHTML = '<div class="no-booking">No booking scheduled</div>';
    });

    const todays = allBookings.filter(b => (b.bookingDate || "").slice(0, 10) === dateKey);

    for (const b of todays) {
        const hour = parseHour(b.bookingTime);
        if (hour == null) continue;

        const slot = findSlotByHour(hour);
        if (!slot) continue;

        slot.innerHTML = bookingHtml(b);
    }

    updateSummary(todays);
}

function findSlotByHour(hour) {
    const slots = document.querySelectorAll(".time-slot");
    for (const s of slots) {
        const t = s.querySelector(".time")?.textContent || "";
        const h = parseInt(t.split(":")[0], 10);
        if (h === hour) return s.querySelector(".slot-content");
    }
    return null;
}

function bookingHtml(b) {
    const status = String(b.status || "upcoming").trim().toLowerCase();
    const badgeClass = status === "completed" ? "status-completed" : "status-upcoming";
    const badgeText = status.toUpperCase();

    return `
    <div class="booking-card">
      <div class="booking-header">
        <div class="status-badge ${badgeClass}">${badgeText}</div>
        <div class="customer-id">Ride ID: ${esc(b.rideId || "N/A")}</div>
      </div>
      <div class="vehicle-type">${esc(b.vehicleModel || "Vehicle")}</div>
      <div class="customer-name">${esc(b.customerName || "Customer")}</div>
      <div class="customer-phone">${esc(b.customerPhone || "N/A")}</div>
      <div class="trip-details">
        <div class="location pickup"><i class="fas fa-circle"></i><span>Pickup: ${esc(b.pickupLocation || "N/A")}</span></div>
        <div class="location drop"><i class="fas fa-circle"></i><span>Drop: ${esc(b.dropoffLocation || "N/A")}</span></div>
      </div>
      <div class="booking-actions">
        <button class="action-btn" type="button" onclick="alert('Customer: ${esc(b.customerName || "")}')">View Customer</button>
        <button class="action-btn" type="button" onclick="alert('Vehicle: ${esc(b.vehiclePlate || "N/A")}')">View Company Vehicle</button>
        <button class="action-btn" type="button" onclick="window.location.href='issuereporting.html'">Report Issue</button>
      </div>
    </div>
  `;
}

function updateSummary(list) {
    const items = document.querySelectorAll(".summary-item .summary-value");
    if (items.length < 3) return;

    items[0].textContent = list.length;

    const hours = list.map(b => parseHour(b.bookingTime)).filter(h => h != null);
    items[1].textContent = hours.length ? `${Math.min(...hours)}:00` : "--";
    items[2].textContent = hours.length ? `${Math.max(...hours)}:00` : "--";
}

function parseHour(timeStr) {
    if (!timeStr) return null;
    const h = parseInt(String(timeStr).split(":")[0], 10);
    return Number.isFinite(h) ? h : null;
}

function toKey(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function pad(n) { return String(n).padStart(2, "0"); }
function byId(id) { return document.getElementById(id); }
function esc(v) {
    return String(v ?? "")
        .replaceAll("&", "&amp;").replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;").replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}