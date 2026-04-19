let selectedDate = null;
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

document.addEventListener("DOMContentLoaded", async function () {
  console.log("JS loaded");
  initializeCalendar();
  await loadDriverData();
});

/* ================= FETCH ================= */

async function loadDriverData() {
  try {
    if (!selectedDate) {
      selectedDate = new Date().toISOString().split("T")[0];
    }

    const response = await fetch(`/drivercalview?date=${selectedDate}`, {
      method: "GET",
      credentials: "same-origin",
    });

    if (response.status === 401) {
      alert("Please login first");
      window.location.href = "/views/landing/driverlogin.html";
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
  document.getElementById("driverName").textContent =
    driver.fullName || driver.username || "Driver";

  const name = driver.firstName || driver.username || "D";
  document.getElementById("profileInitial").textContent = name
    .charAt(0)
    .toUpperCase();
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
  // Reset all slots
  document.querySelectorAll(".slot-content").forEach((c) => {
    c.innerHTML = '<div class="no-booking">No booking scheduled</div>';
  });

  if (!bookings || bookings.length === 0) {
    updateSummary([]);
    return;
  }

  console.log("Selected Date:", selectedDate);

  // Keep bookings whose date range includes selectedDate
  const onThisDay = [];

  bookings.forEach((booking) => {
    const range = getBookingHourRangeForDate(booking, selectedDate);
    if (!range) return;

    console.log(
      `Booking ${booking.rideId}: filling hours ${range.from}–${range.to}`,
    );
    onThisDay.push({ booking, range });

    // Fill every slot in [from, to]
    for (let h = range.from; h <= range.to; h++) {
      const slot = document.querySelector(`.time-slot[data-time="${h}"]`);
      if (!slot) continue;

      const content = slot.querySelector(".slot-content");
      content.innerHTML = createBookingCard(booking, selectedDate);
    }
  });

  updateSummary(onThisDay);
}
/* ================= SUMMARY ================= */

function updateSummary(items) {
  const sumItems = document.querySelectorAll(".summary-item");
  if (sumItems.length < 3) return;

  sumItems[0].querySelector(".summary-value").textContent = items.length;

  if (items.length === 0) {
    sumItems[1].querySelector(".summary-value").textContent = "--";
    sumItems[2].querySelector(".summary-value").textContent = "--";
    return;
  }

  const froms = items.map((x) => x.range.from);
  const tos = items.map((x) => x.range.to);

  sumItems[1].querySelector(".summary-value").textContent =
    `${Math.min(...froms)}:00`;
  sumItems[2].querySelector(".summary-value").textContent =
    `${Math.max(...tos)}:00`;
}

/* ================= CARD ================= */

function createBookingCard(booking, dateStr) {
  const startDate = booking.tripStartDate?.split("T")[0];
  const endDate = (booking.tripEndDate || booking.tripStartDate)?.split("T")[0];

  let dayBadge = "";
  if (startDate && endDate && startDate !== endDate) {
    // Multi-day trip — show which day of the trip we're on
    const total =
      Math.round((new Date(endDate) - new Date(startDate)) / 86400000) + 1;
    const dayNo =
      Math.round((new Date(dateStr) - new Date(startDate)) / 86400000) + 1;
    dayBadge = `<div class="day-badge">Day ${dayNo} of ${total}</div>`;
  }

  return `
        <div class="booking-card">

            <div class="booking-top">
                <div class="customer-name">
                    ${booking.customerName || "Customer"}
                </div>

                <div class="status ${booking.status || "active"}">
                    ${booking.status || "ACTIVE"}
                </div>
            </div>

            <div class="booking-vehicle">
                ${booking.vehicleModel || "Vehicle"}
            </div>

            <div class="booking-route">
                ${booking.pickupLocation || ""} → ${booking.dropLocation || ""}
            </div>

            <div class="booking-bottom">
                <div class="time">
                    ${booking.startTimeStr || ""}${booking.endTimeStr ? " – " + booking.endTimeStr : ""}
                </div>

                <div class="ride-id">
                    ${booking.rideId || ""}
                </div>
            </div>

            ${dayBadge}
        </div>
    `;
}

/* ================= CALENDAR ================= */

function initializeCalendar() {
  const today = new Date();

  selectedDate = today.toISOString().split("T")[0];

  currentMonth = today.getMonth();
  currentYear = today.getFullYear();

  updateMonthLabel(currentYear, currentMonth);
  generateCalendarDays(currentYear, currentMonth);
  attachCalendarNavigation(); // 🔥 only call
}

function attachCalendarNavigation() {
  document
    .getElementById("prevMonth")
    ?.addEventListener("click", goToPrevMonth);
  document
    .getElementById("nextMonth")
    ?.addEventListener("click", goToNextMonth);
}

function goToPrevMonth() {
  currentMonth--;

  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }

  refreshCalendar();
}

function goToNextMonth() {
  currentMonth++;

  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }

  refreshCalendar();
}

function refreshCalendar() {
  updateMonthLabel(currentYear, currentMonth);
  generateCalendarDays(currentYear, currentMonth);
}

function updateMonthLabel(year, month) {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  document.getElementById("currentMonthYear").textContent =
    `${months[month]} ${year}`;
}

function generateCalendarDays(year, month) {
  const grid = document.querySelector(".calendar-grid");

  let body = grid.querySelector(".calendar-body");
  if (body) body.remove();

  body = document.createElement("div");
  body.className = "calendar-body";

  const firstDay = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    body.appendChild(empty);
  }

  for (let d = 1; d <= days; d++) {
    const day = document.createElement("div");
    day.className = "calendar-day";
    day.textContent = d;

    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    day.addEventListener("click", async function () {
      document
        .querySelectorAll(".calendar-day")
        .forEach((x) => x.classList.remove("selected"));

      this.classList.add("selected");

      selectedDate = dateStr;

      console.log("Selected:", selectedDate);

      await loadDriverData();
    });

    body.appendChild(day);
  }

  grid.appendChild(body);
}

/* ================= TIME HELPERS ================= */

function getBookingTimeString(booking) {
  return booking.startTimeStr || null;
}

function getBookingHour(booking) {
  const timeStr = getBookingTimeString(booking);
  if (!timeStr) return null;
  return new Date(`1970-01-01T${timeStr}`).getHours();
}

// Parse "HH:MM:SS" (or "HH:MM") into an integer hour, or null
function parseHour(timeStr) {
  if (!timeStr) return null;
  const h = new Date(`1970-01-01T${timeStr}`).getHours();
  return isNaN(h) ? null : h;
}

// Figure out which hour range on `dateStr` the booking occupies.
// Returns { from, to } clamped to the 8–18 visible window, or null if not on this date.
function getBookingHourRangeForDate(booking, dateStr) {
  const startDate = booking.tripStartDate?.split("T")[0];
  const endDate = (booking.tripEndDate || booking.tripStartDate)?.split("T")[0];
  if (!startDate) return null;

  // Outside the booking's date range → not on this day
  if (dateStr < startDate || dateStr > endDate) return null;

  const SLOT_MIN = 8;
  const SLOT_MAX = 18;

  const startHour = parseHour(booking.startTimeStr) ?? SLOT_MIN;
  const endHour = parseHour(booking.endTimeStr) ?? SLOT_MAX;

  const isStartDay = dateStr === startDate;
  const isEndDay = dateStr === endDate;

  // On the start day: from startHour → end of window (or endHour if same-day booking)
  // On middle days:   full window
  // On the end day:   start of window → endHour
  let from = isStartDay ? startHour : SLOT_MIN;
  let to = isEndDay ? endHour : SLOT_MAX;

  // Clamp into the visible 8–18 window
  from = Math.max(SLOT_MIN, Math.min(SLOT_MAX, from));
  to = Math.max(SLOT_MIN, Math.min(SLOT_MAX, to));

  if (to < from) return null;
  return { from, to };
}
