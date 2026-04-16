// =====================================================
//  vehicle-profile.js  –  fully wired to backend
// =====================================================

// Global vehicle data
let vehicleData = null;
let isWishlisted = false;
let selectedMode = "self-drive";
let bookingData = {
  pickupDate: null,
  pickupTime: null,
  returnDate: null,
  returnTime: null,
  pickupLocation: "",
  hours: 0,
  subtotal: 0,
  serviceFee: 500,
  total: 500,
};
let currentCalendarMonth = new Date();

document.addEventListener("DOMContentLoaded", function () {
  loadVehicleDetails();
});

// =====================================================
// HELPER: Format date to yyyy-MM-dd using LOCAL time
// =====================================================
function toLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// =====================================================
// LOAD: Vehicle details + image + ratings
// =====================================================
async function loadVehicleDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const vehicleId = urlParams.get("id");

  if (!vehicleId) {
    showNotification("No vehicle ID provided", "error");
    setTimeout(() => {
      window.location.href = "search.html";
    }, 2000);
    return;
  }

  try {
    // 1. Vehicle details
    const response = await fetch(
      `/customer/vehicle-details?vehicleId=${vehicleId}`,
    );
    if (!response.ok) throw new Error("Failed to fetch vehicle details");
    vehicleData = await response.json();
    if (!vehicleData) throw new Error("Vehicle not found");

    // 2. Company name via FK
    if (vehicleData.companyId) {
      const companyRes = await fetch(
        `/customer/company-name?companyId=${vehicleData.companyId}`,
      );
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        vehicleData.companyName = companyData.companyName || "N/A";
      } else {
        vehicleData.companyName = "N/A";
      }
    } else {
      vehicleData.companyName = "N/A";
    }

    // 3. Populate static details first
    populateVehicleDetails(vehicleData);

    // 4. Load vehicle image (non-blocking)
    loadVehicleImage(vehicleData.vehicleId || vehicleData.vehicleid);

    // 5. Load ratings (non-blocking)
    loadVehicleRatings(vehicleData.vehicleId || vehicleData.vehicleid);
  } catch (error) {
    console.error("Error loading vehicle details:", error);
    showNotification("Failed to load vehicle details", "error");
    setTimeout(() => {
      window.location.href = "search.html";
    }, 2000);
  }
}

// =====================================================
// LOAD: Vehicle image from /vehicle/image?vehicleid=X
// =====================================================
function loadVehicleImage(vehicleId) {
  if (!vehicleId) return;

  const img = document.getElementById("vehicleImage");
  const fallback = document.getElementById("vehicleImageFallback");

  if (!img) return;

  // Build the URL that GetVehicleImageServlet responds to
  img.src = `/vehicle/image?vehicleid=${vehicleId}`;

  img.onload = function () {
    img.style.display = "block";
    fallback.style.display = "none";
  };

  img.onerror = function () {
    img.style.display = "none";
    fallback.style.display = "flex";
  };
}

// =====================================================
// LOAD: Ratings from GET /ratings/actor?actorType=VEHICLE&actorId=X
// =====================================================
async function loadVehicleRatings(vehicleId) {
  if (!vehicleId) return;

  try {
    const res = await fetch(
      `/ratings/actor?actorType=VEHICLE&actorId=${vehicleId}`,
    );
    if (!res.ok) throw new Error("Ratings fetch failed");
    const data = await res.json();

    if (!data.success) throw new Error("Ratings response not success");

    const rating = data.average || 0;
    const reviews = data.total || 0;

    // Update both star blocks
    updateStars("vehicleStars", rating);
    updateStars("reviewStars", rating);

    // Score text
    document.getElementById("overallRating").textContent = rating.toFixed(1);
    document.getElementById("ratingText").textContent =
      `${reviews} review${reviews !== 1 ? "s" : ""}`;
    document.getElementById("ratingSummary").textContent =
      reviews > 0
        ? `Based on ${reviews} customer review${reviews !== 1 ? "s" : ""}`
        : "No reviews yet";

    // Render individual review cards
    renderReviews(data.reviews || []);
  } catch (err) {
    console.warn("Could not load ratings:", err);

    // Graceful fallback — clear placeholders
    updateStars("vehicleStars", 0);
    updateStars("reviewStars", 0);
    document.getElementById("overallRating").textContent = "—";
    document.getElementById("ratingText").textContent = "No reviews yet";
    document.getElementById("ratingSummary").textContent =
      "No reviews available";
  }
}

// Render the list of review cards
function renderReviews(reviews) {
  const container = document.getElementById("reviewsList");
  if (!container) return;

  if (reviews.length === 0) {
    container.innerHTML =
      '<p style="color: var(--text-light); font-size:14px; margin-top:12px;">No customer reviews yet.</p>';
    return;
  }

  container.innerHTML = reviews
    .map(
      (r) => `
        <div class="review-card" style="
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 14px 16px;
            margin-top: 12px;
            background: #fafbff;
        ">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:6px;">
                <div style="display:flex; align-items:center; gap:10px;">
                    <div style="
                        width:36px; height:36px; border-radius:50%;
                        background: linear-gradient(135deg, var(--secondary), var(--primary));
                        display:flex; align-items:center; justify-content:center;
                        color:white; font-weight:600; font-size:14px;
                    ">${(r.name || "A").charAt(0).toUpperCase()}</div>
                    <div>
                        <div style="font-weight:600; font-size:14px;">${escapeHtml(r.name || "Anonymous")}</div>
                        <div style="font-size:12px; color:var(--text-light);">${r.date || ""}</div>
                    </div>
                </div>
                <div style="display:flex; gap:2px; color:#f4c430; font-size:13px;">
                    ${renderStarHTML(r.rating || 0)}
                </div>
            </div>
            ${r.text ? `<p style="font-size:13px; color:var(--text); margin:0; line-height:1.5;">${escapeHtml(r.text)}</p>` : ""}
        </div>
    `,
    )
    .join("");
}

function renderStarHTML(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html +=
      i <= rating
        ? '<i class="fas fa-star"></i>'
        : '<i class="far fa-star"></i>';
  }
  return html;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// =====================================================
// POPULATE: Static vehicle details
// =====================================================
function populateVehicleDetails(vehicle) {
  const vehicleName = `${vehicle.vehicleBrand} ${vehicle.vehicleModel}`;
  document.getElementById("vehicleName").textContent = vehicleName;
  document.getElementById("vehicleCompany").textContent =
    vehicle.companyName || "N/A";
  document.getElementById("vehicleLocation").textContent =
    vehicle.location || "N/A";

  // ── Hourly rate ──────────────────────────────────────────
  // Prefer explicit fields if backend ever adds them;
  // fall back to pricePerDay / 24 formula.
  const hourlyRate = vehicle.hourlyRate
    ? Math.round(vehicle.hourlyRate)
    : Math.round(vehicle.pricePerDay / 24);

  const hourlyRateWithDriver = vehicle.withDriverRate
    ? Math.round(vehicle.withDriverRate)
    : Math.round(hourlyRate * 1.3); // 30 % markup stays until backend provides it

  document.getElementById("vehiclePrice").innerHTML =
    `LKR ${hourlyRate.toLocaleString()}<span class="price-period">/hour</span>`;

  // Attach computed rates to vehicleData for booking popup
  vehicleData.hourlyRate = hourlyRate;
  vehicleData.hourlyRateWithDriver = hourlyRateWithDriver;
  vehicleData.name = vehicleName;
  vehicleData.company = vehicle.companyName || "N/A";
  vehicleData.companyId = vehicle.companyId;

  // ── Availability ─────────────────────────────────────────
  const availDiv = document.getElementById("availabilityStatus");
  const availText = document.getElementById("availabilityText");

  if (vehicle.availabilityStatus === "available") {
    availDiv.className = "availability-status available";
    availDiv.innerHTML =
      '<i class="fas fa-check-circle"></i><span>Available Now</span>';
    availText.textContent = "Next available: Immediately";
  } else {
    availDiv.className = "availability-status unavailable";
    availDiv.innerHTML =
      '<i class="fas fa-times-circle"></i><span>Currently Unavailable</span>';
    // Show real next-available date if backend provides it
    availText.textContent = vehicle.nextAvailableDate
      ? `Next available: ${vehicle.nextAvailableDate}`
      : "Check back later for availability";
  }

  // ── Vehicle meta ─────────────────────────────────────────
  const metaContainer = document.getElementById("vehicleMeta");
  metaContainer.innerHTML = `
        <div class="meta-item">
            <span class="meta-label">Type:</span>
            <span class="meta-value">${vehicle.vehicleType || "N/A"}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Mileage:</span>
            <span class="meta-value">${vehicle.milage || "N/A"}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Engine:</span>
            <span class="meta-value">${(vehicle.engineCapacity / 1000).toFixed(1)}L ${vehicle.fuelType || ""}</span>
        </div>
        <div class="meta-item">
            <span class="meta-label">Color:</span>
            <span class="meta-value">${vehicle.color || "N/A"}</span>
        </div>
    `;

  // ── Key features ─────────────────────────────────────────
  // transmission now comes from the dedicated DB column (vehicle.transmission).
  // AC is parsed from features string as fallback; a dedicated hasAC field is
  // used if the backend ever adds it.
  const transmission =
    vehicle.transmission || parseTransmissionFromFeatures(vehicle.features);
  const hasAC =
    vehicle.hasAC !== undefined
      ? vehicle.hasAC
      : checkACInFeatures(vehicle.features);

  const featuresContainer = document.querySelector(".features-list");
  featuresContainer.innerHTML = `
        <div class="feature-item">
            <div class="feature-icon transmission">
                <i class="fas fa-cogs"></i>
            </div>
            <div class="feature-content">
                <div class="feature-title">Transmission</div>
                <div class="feature-subtitle">${transmission || "N/A"}</div>
            </div>
        </div>
        <div class="feature-item">
            <div class="feature-icon fuel">
                <i class="fas fa-gas-pump"></i>
            </div>
            <div class="feature-content">
                <div class="feature-title">Fuel Type</div>
                <div class="feature-subtitle">${vehicle.fuelType || "N/A"}</div>
            </div>
        </div>
        <div class="feature-item">
            <div class="feature-icon seating">
                <i class="fas fa-users"></i>
            </div>
            <div class="feature-content">
                <div class="feature-title">Seating Capacity</div>
                <div class="feature-subtitle">${vehicle.numberOfPassengers} Passengers</div>
            </div>
        </div>
        <div class="feature-item">
            <div class="feature-icon ac">
                <i class="fas fa-snowflake"></i>
            </div>
            <div class="feature-content">
                <div class="feature-title">Air Conditioning</div>
                <div class="feature-subtitle">${hasAC ? "Yes" : "No"}</div>
            </div>
        </div>
        <div class="feature-item">
            <div class="feature-icon luggage">
                <i class="fas fa-info-circle"></i>
            </div>
            <div class="feature-content">
                <div class="feature-title">Description</div>
                <div class="feature-subtitle">${vehicle.description || "No description available"}</div>
            </div>
        </div>
    `;

  // ── Pickup locations ──────────────────────────────────────
  const locationParts = vehicle.location
    ? vehicle.location.split(",")
    : ["Colombo"];
  vehicleData.pickupLocations = [
    vehicle.location,
    ...generateNearbyLocations(locationParts[0]),
  ];
}

// ── Feature helpers ───────────────────────────────────────────
// Reads from the new dedicated `transmission` column first; this is only
// the string-parse fallback for older rows that pre-date the column.
function parseTransmissionFromFeatures(featuresString) {
  if (!featuresString) return null;
  const parts = featuresString.split(",");
  for (const f of parts) {
    const lower = f.trim().toLowerCase();
    if (
      lower.includes("automatic") ||
      lower.includes("manual") ||
      lower.includes("cvt")
    ) {
      return f.trim();
    }
  }
  return null;
}

function checkACInFeatures(featuresString) {
  if (!featuresString) return false;
  const lower = featuresString.toLowerCase();
  return (
    lower.includes("a/c") ||
    lower.includes(" ac") ||
    lower.includes("air conditioning")
  );
}

function generateNearbyLocations(city) {
  const baseCity = city.trim();
  return [
    `${baseCity} 01`,
    `${baseCity} 02`,
    `${baseCity} 03`,
    `${baseCity} 04`,
    `${baseCity} 05`,
    `${baseCity} 06`,
    `${baseCity} 07`,
    `${baseCity} Suburbs`,
  ];
}

// =====================================================
// STARS
// =====================================================
function updateStars(containerId, rating) {
  const container = document.getElementById(containerId);
  if (!container) return;
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html +=
      i <= Math.round(rating)
        ? '<i class="fas fa-star"></i>'
        : '<i class="far fa-star"></i>';
  }
  container.innerHTML = html;
}

// =====================================================
// BOOKING POPUP
// =====================================================
function bookVehicle() {
  if (!vehicleData) {
    showNotification("Vehicle data not loaded", "error");
    return;
  }
  showBookingPopup(vehicleData);
}

function showBookingPopup(vehicle) {
  const locationOptions = (vehicle.pickupLocations || [vehicle.location])
    .map(
      (loc) =>
        `<option value="${loc}"${loc === vehicle.location ? " selected" : ""}>${loc}</option>`,
    )
    .join("");

  // Service fee: use backend value if present, default LKR 500
  const serviceFee = vehicle.serviceFee || 500;

  const popup = document.createElement("div");
  popup.className = "popup-overlay";
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
                            <div class="mode-icon"><i class="fas fa-car"></i></div>
                            <div class="mode-details">
                                <div class="mode-title">Self Drive</div>
                                <div class="mode-price">LKR ${vehicle.hourlyRate.toLocaleString()}/hour</div>
                            </div>
                            <div class="mode-check"><i class="fas fa-check-circle"></i></div>
                        </div>
                        <div class="mode-option" data-mode="with-driver" onclick="selectMode('with-driver')">
                            <div class="mode-icon"><i class="fas fa-user-tie"></i></div>
                            <div class="mode-details">
                                <div class="mode-title">With Driver</div>
                                <div class="mode-price">LKR ${vehicle.hourlyRateWithDriver.toLocaleString()}/hour</div>
                            </div>
                            <div class="mode-check"><i class="fas fa-check-circle"></i></div>
                        </div>
                    </div>
                </div>

                <!-- Date Time Picker -->
                <div class="booking-section">
                    <div class="datetime-picker-container">
                        <h4 class="datetime-section-title"><i class="fas fa-calendar-alt"></i> Select Dates &amp; Times</h4>
                        <div class="datetime-row">
                            <div class="datetime-field">
                                <label class="datetime-label"><i class="fas fa-map-marker-alt"></i> PICK-UP DATE</label>
                                <div class="datetime-input-wrapper">
                                    <input type="text" id="pickupDateDisplay" class="datetime-input" placeholder="Select date" readonly onclick="focusPickupDate()" />
                                    <i class="fas fa-calendar datetime-input-icon"></i>
                                </div>
                                <input type="hidden" id="pickupDate" />
                            </div>
                            <div class="datetime-field">
                                <label class="datetime-label"><i class="fas fa-clock"></i> PICK-UP TIME</label>
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
                                <label class="datetime-label"><i class="fas fa-map-marker-alt"></i> DROP-OFF DATE</label>
                                <div class="datetime-input-wrapper">
                                    <input type="text" id="returnDateDisplay" class="datetime-input" placeholder="Select date" readonly onclick="focusReturnDate()" />
                                    <i class="fas fa-calendar datetime-input-icon"></i>
                                </div>
                                <input type="hidden" id="returnDate" />
                            </div>
                            <div class="datetime-field">
                                <label class="datetime-label"><i class="fas fa-clock"></i> DROP-OFF TIME</label>
                                <div class="datetime-input-wrapper">
                                    <select id="returnTime" class="datetime-input" onchange="updateReturnDisplay(); calculateDuration();">
                                        <option value="">Select time</option>
                                        ${generateTimeOptions()}
                                    </select>
                                    <i class="fas fa-chevron-down datetime-input-icon"></i>
                                </div>
                            </div>
                        </div>

                        <!-- Calendar -->
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
                                <div class="legend-item"><div class="legend-color selected"></div><span>Selected</span></div>
                                <div class="legend-item"><div class="legend-color unavailable"></div><span>Unavailable</span></div>
                                <div class="legend-item"><div class="legend-color available"></div><span>Available</span></div>
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
                            <span id="serviceFeeDisplay">LKR ${serviceFee.toLocaleString()}</span>
                        </div>
                        <div class="cost-row total">
                            <span>Total Cost:</span>
                            <span id="totalCost">LKR ${serviceFee.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="popup-footer">
                <button class="btn btn-outline" onclick="closePopup()">Cancel</button>
                <button class="btn btn-primary" id="confirmBookingBtn" onclick="confirmBooking()" disabled style="opacity:0.6;cursor:not-allowed;">
                    <i class="fas fa-arrow-right"></i> Proceed to Payment
                </button>
            </div>
        </div>
    `;
  document.body.appendChild(popup);

  // Store live service fee on bookingData
  bookingData.serviceFee = serviceFee;

  setTimeout(() => {
    renderCalendar();
  }, 100);
}

// =====================================================
// CALENDAR
// =====================================================
function renderCalendar() {
  if (!vehicleData) return;

  const bookedDates = vehicleData.bookedDates || [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const month = currentCalendarMonth.getMonth();
  const year = currentCalendarMonth.getFullYear();

  const monthNames = [
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

  document.getElementById("calendarMonthYear").textContent =
    `${monthNames[month]} ${year}`;

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const grid = document.getElementById("calendarGrid");
  let html = "";

  ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].forEach((d) => {
    html += `<div class="calendar-day-header">${d}</div>`;
  });

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="calendar-day other-month"></div>';
  }

  const selectedPickupDate = document.getElementById("pickupDate").value;
  const selectedReturnDate = document.getElementById("returnDate").value;
  const todayStr = toLocalDateString(today);

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    const dateStr = toLocalDateString(date);

    const isToday = dateStr === todayStr;
    const isBooked = bookedDates.includes(dateStr);
    const isPastDate = date < today;
    const isPickup = dateStr === selectedPickupDate;
    const isReturn = dateStr === selectedReturnDate;

    let classes = "calendar-day";
    let clickable = true;

    if (isBooked || isPastDate) {
      classes += " disabled";
      clickable = false;
    }
    if (isToday && !isBooked && !isPastDate) classes += " today";
    if (isPickup || isReturn) classes += " selected";

    const onclick = clickable ? `onclick="selectDate('${dateStr}')"` : "";
    html += `<div class="${classes}" ${onclick}>${day}</div>`;
  }

  grid.innerHTML = html;
}

let selectingPickup = true;

function focusPickupDate() {
  selectingPickup = true;
}

function focusReturnDate() {
  const pickupDate = document.getElementById("pickupDate").value;
  if (!pickupDate) {
    showNotification("Please select pickup date first", "warning");
    return;
  }
  selectingPickup = false;
}

function selectDate(dateStr) {
  const pickupDate = document.getElementById("pickupDate").value;

  if (selectingPickup || !pickupDate) {
    document.getElementById("pickupDate").value = dateStr;
    document.getElementById("returnDate").value = "";
    document.getElementById("returnDateDisplay").value = "";
    document.getElementById("returnTime").value = "";
    updatePickupDisplay();
    selectingPickup = false;
  } else {
    if (dateStr <= pickupDate) {
      showNotification("Drop-off date must be after pick-up date", "warning");
      return;
    }
    document.getElementById("returnDate").value = dateStr;
    updateReturnDisplay();
  }

  renderCalendar();
  calculateDuration();
}

function updatePickupDisplay() {
  const dateValue = document.getElementById("pickupDate").value;
  const timeValue = document.getElementById("pickupTime").value;
  const displayInput = document.getElementById("pickupDateDisplay");

  if (dateValue) {
    const parts = dateValue.split("-");
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const formatted = formatDateForDisplay(date);
    displayInput.value = timeValue
      ? `${formatted}, ${formatTimeDisplay(timeValue)}`
      : formatted;
    displayInput.classList.add("filled");
  } else {
    displayInput.value = "";
    displayInput.classList.remove("filled");
  }
  validateBookingForm();
}

function updateReturnDisplay() {
  const dateValue = document.getElementById("returnDate").value;
  const timeValue = document.getElementById("returnTime").value;
  const displayInput = document.getElementById("returnDateDisplay");

  if (dateValue) {
    const parts = dateValue.split("-");
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    const formatted = formatDateForDisplay(date);
    displayInput.value = timeValue
      ? `${formatted}, ${formatTimeDisplay(timeValue)}`
      : formatted;
    displayInput.classList.add("filled");
  } else {
    displayInput.value = "";
    displayInput.classList.remove("filled");
  }
  validateBookingForm();
}

function formatDateForDisplay(date) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatTimeDisplay(timeStr) {
  if (!timeStr) return "";
  const [hours, minutes] = timeStr.split(":");
  const hour = parseInt(hours);
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${minutes} ${period}`;
}

function previousMonth() {
  const today = new Date();
  currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() - 1);
  if (
    currentCalendarMonth < new Date(today.getFullYear(), today.getMonth(), 1)
  ) {
    currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + 1);
    showNotification("Cannot select past dates", "warning");
    return;
  }
  renderCalendar();
}

function nextMonth() {
  currentCalendarMonth.setMonth(currentCalendarMonth.getMonth() + 1);
  renderCalendar();
}

function generateTimeOptions() {
  let options = "";
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
      options += `<option value="${timeStr}">${formatTimeDisplay(timeStr)}</option>`;
    }
  }
  return options;
}

// =====================================================
// MODE SELECTION
// =====================================================
function selectMode(mode) {
  if (!vehicleData) return;

  selectedMode = mode;
  document
    .querySelectorAll(".mode-option")
    .forEach((opt) => opt.classList.remove("active"));
  document.querySelector(`[data-mode="${mode}"]`).classList.add("active");

  const rate =
    mode === "self-drive"
      ? vehicleData.hourlyRate
      : vehicleData.hourlyRateWithDriver;
  document.getElementById("selectedModeText").textContent =
    mode === "self-drive" ? "Self Drive" : "With Driver";
  document.getElementById("hourlyRate").textContent =
    `LKR ${rate.toLocaleString()}`;

  calculateDuration();
}

// =====================================================
// DURATION & COST CALCULATION
// =====================================================
function calculateDuration() {
  const pickupDate = document.getElementById("pickupDate").value;
  const pickupTime = document.getElementById("pickupTime").value;
  const returnDate = document.getElementById("returnDate").value;
  const returnTime = document.getElementById("returnTime").value;

  if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
    document.getElementById("durationSummaryContainer").style.display = "none";
    document.getElementById("durationText").textContent = "0 hours";
    document.getElementById("totalCost").textContent =
      `LKR ${bookingData.serviceFee.toLocaleString()}`;
    validateBookingForm();
    return;
  }

  const pickup = new Date(`${pickupDate}T${pickupTime}`);
  const returnDT = new Date(`${returnDate}T${returnTime}`);

  if (returnDT <= pickup) {
    showNotification(
      "Drop-off date/time must be after pick-up date/time",
      "warning",
    );
    document.getElementById("durationSummaryContainer").style.display = "none";
    validateBookingForm();
    return;
  }

  const diffMs = returnDT - pickup;
  const hours = Math.ceil(diffMs / (1000 * 60 * 60));
  const rate =
    selectedMode === "self-drive"
      ? vehicleData.hourlyRate
      : vehicleData.hourlyRateWithDriver;
  const fee = bookingData.serviceFee;
  const subtotal = hours * rate;
  const total = subtotal + fee;

  document.getElementById("totalHours").textContent =
    `${hours} hour${hours > 1 ? "s" : ""}`;
  document.getElementById("durationText").textContent =
    `${hours} hour${hours > 1 ? "s" : ""}`;
  document.getElementById("totalCost").textContent =
    `LKR ${total.toLocaleString()}`;
  document.getElementById("durationSummaryContainer").style.display = "block";

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  let note = "";
  if (days > 0) {
    note = `Approximately ${days} day${days > 1 ? "s" : ""}`;
    if (remainingHours > 0)
      note += ` and ${remainingHours} hour${remainingHours > 1 ? "s" : ""}`;
  }
  document.getElementById("durationNote").textContent = note;

  bookingData = {
    ...bookingData,
    pickupDate,
    pickupTime,
    returnDate,
    returnTime,
    hours,
    subtotal,
    total,
  };

  validateBookingForm();
}

function validateBookingForm() {
  const ok =
    document.getElementById("pickupDate").value &&
    document.getElementById("pickupTime").value &&
    document.getElementById("returnDate").value &&
    document.getElementById("returnTime").value &&
    document.getElementById("pickupLocation").value;

  const btn = document.getElementById("confirmBookingBtn");
  if (!btn) return;
  btn.disabled = !ok;
  btn.style.opacity = ok ? "1" : "0.6";
  btn.style.cursor = ok ? "pointer" : "not-allowed";
}

// =====================================================
// CONFIRM BOOKING
// =====================================================
async function confirmBooking() {
  if (!vehicleData) {
    showNotification("Vehicle data not loaded", "error");
    return;
  }

  const pickupLocation = document.getElementById("pickupLocation").value.trim();
  if (
    !pickupLocation ||
    !bookingData.pickupDate ||
    !bookingData.pickupTime ||
    !bookingData.returnDate ||
    !bookingData.returnTime
  ) {
    showNotification("Please fill in all booking details", "warning");
    return;
  }

  const confirmBtn = document.getElementById("confirmBookingBtn");
  confirmBtn.disabled = true;
  confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

  const requestBody = {
    vehicleId: vehicleData.vehicleId,
    companyId: vehicleData.companyId,
    vehicleName: vehicleData.name,
    mode: selectedMode,
    pickupDate: bookingData.pickupDate,
    returnDate: bookingData.returnDate,
    pickupTime: bookingData.pickupTime,
    returnTime: bookingData.returnTime,
    pickupLocation: pickupLocation,
    hours: bookingData.hours,
    hourlyRate:
      selectedMode === "self-drive"
        ? vehicleData.hourlyRate
        : vehicleData.hourlyRateWithDriver,
    subtotal: bookingData.subtotal,
    serviceFee: bookingData.serviceFee,
    totalCost: bookingData.total,
  };

  try {
    const response = await fetch("/customer/create-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();

    if (result.success) {
      showNotification("Booking created! Ride ID: " + result.rideId, "success");

      const pParts = bookingData.pickupDate.split("-");
      const rParts = bookingData.returnDate.split("-");
      const pickupDateTime = new Date(
        pParts[0],
        pParts[1] - 1,
        pParts[2],
        ...bookingData.pickupTime.split(":").map(Number),
      );
      const returnDateTime = new Date(
        rParts[0],
        rParts[1] - 1,
        rParts[2],
        ...bookingData.returnTime.split(":").map(Number),
      );

      const bookingDetailsObj = {
        rideId: result.rideId,
        vehicleId: vehicleData.vehicleId,
        vehicleName: vehicleData.name,
        company: vehicleData.company,
        mode: selectedMode,
        modeDisplay:
          selectedMode === "self-drive" ? "Self Drive" : "With Driver",
        pickupDate: bookingData.pickupDate,
        pickupTime: bookingData.pickupTime,
        pickupDateTime: pickupDateTime.toLocaleString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        returnDate: bookingData.returnDate,
        returnTime: bookingData.returnTime,
        returnDateTime: returnDateTime.toLocaleString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        pickupLocation,
        hours: bookingData.hours,
        hourlyRate:
          selectedMode === "self-drive"
            ? vehicleData.hourlyRate
            : vehicleData.hourlyRateWithDriver,
        subtotal: bookingData.subtotal,
        serviceFee: bookingData.serviceFee,
        totalCost: bookingData.total,
      };

      window.bookingDetails = bookingDetailsObj;
      try {
        sessionStorage.setItem(
          "bookingDetails",
          JSON.stringify(bookingDetailsObj),
        );
      } catch (e) {
        console.error("sessionStorage save failed", e);
      }

      setTimeout(() => {
        window.location.href = "payment.html";
      }, 1500);
    } else {
      showNotification(result.message || "Booking failed", "error");
      confirmBtn.disabled = false;
      confirmBtn.innerHTML =
        '<i class="fas fa-arrow-right"></i> Proceed to Payment';
    }
  } catch (error) {
    console.error("Booking error:", error);
    showNotification("Failed to create booking. Please try again.", "error");
    confirmBtn.disabled = false;
    confirmBtn.innerHTML =
      '<i class="fas fa-arrow-right"></i> Proceed to Payment';
  }
}

// =====================================================
// MISC ACTIONS
// =====================================================
function messageOwner() {
  showNotification("Message feature coming soon!", "info");
}

function toggleWishlist() {
  const btn = document.getElementById("wishlistBtn");
  if (!isWishlisted) {
    btn.style.background = "var(--danger)";
    btn.style.color = "white";
    btn.style.borderColor = "var(--danger)";
    btn.innerHTML = '<i class="fas fa-heart"></i> Added to Wishlist';
    isWishlisted = true;
    showNotification("Added to wishlist!", "success");
  } else {
    btn.style.background = "transparent";
    btn.style.color = "var(--primary)";
    btn.style.borderColor = "var(--primary-light)";
    btn.innerHTML = '<i class="far fa-heart"></i> Add to Wishlist';
    isWishlisted = false;
    showNotification("Removed from wishlist!", "info");
  }
}

function closePopup() {
  const popup = document.querySelector(".popup-overlay");
  if (popup) popup.remove();

  bookingData = {
    pickupDate: null,
    pickupTime: null,
    returnDate: null,
    returnTime: null,
    pickupLocation: "",
    hours: 0,
    subtotal: 0,
    serviceFee: vehicleData?.serviceFee || 500,
    total: vehicleData?.serviceFee || 500,
  };
  currentCalendarMonth = new Date();
  selectingPickup = true;
}

function viewCompany() {
  if (vehicleData && vehicleData.companyId) {
    window.location.href = `company-profile.html?companyId=${encodeURIComponent(vehicleData.companyId)}`;
  } else {
    showNotification("Company information not available", "warning");
  }
}

function goBack() {
  if (document.referrer && document.referrer !== window.location.href) {
    window.history.back();
  } else {
    window.location.href = "search.html";
  }
}

// handleLogout is provided by header.js — no duplicate needed here.

// =====================================================
// NOTIFICATIONS
// =====================================================
function showNotification(message, type) {
  const notification = document.createElement("div");

  const bgColor =
    type === "success"
      ? "var(--success)"
      : type === "warning"
        ? "var(--warning)"
        : type === "error"
          ? "var(--danger)"
          : "var(--info)";

  const icon =
    type === "success"
      ? "fa-check-circle"
      : type === "warning"
        ? "fa-exclamation-triangle"
        : type === "error"
          ? "fa-times-circle"
          : "fa-info-circle";

  notification.style.cssText = `
        position: fixed; top: 20px; right: 20px;
        padding: 15px 20px;
        background: ${bgColor}; color: white;
        border-radius: var(--radius);
        box-shadow: var(--shadow-lg);
        z-index: 10001; font-weight: 500;
        display: flex; align-items: center; gap: 10px;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
  notification.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, 4000);
}
