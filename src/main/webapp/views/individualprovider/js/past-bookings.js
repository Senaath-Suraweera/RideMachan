// past-bookings.js (API-connected)

document.addEventListener("DOMContentLoaded", () => {
  // Past page uses same filter controls layout in your project
  initializeFilters();
  initializeDateInputs();
  initializeSort();
  loadBookings("past");
});

const API_BASE = window.API_BASE || "";

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {}
  if (!res.ok)
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  return data;
}

function buildQuery(paramsObj) {
  const p = new URLSearchParams();
  Object.entries(paramsObj).forEach(([k, v]) => {
    if (v !== null && v !== undefined && String(v).trim() !== "") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
}

async function loadBookings(type) {
  try {
    const q = collectFilterParams(type);
    const data = await fetchJson(
      `${API_BASE}/api/provider/bookings${buildQuery(q)}`,
    );
    renderBookings(data.items || []);
    wireCardNavigation();
  } catch (err) {
    console.error(err);
    renderBookings([]);
    alert(err.message);
  }
}

function collectFilterParams(type) {
  const vehicleType = document.getElementById("vehicleTypeFilter")?.value;
  const location = document.getElementById("locationFilter")?.value;
  const fromDate = document.getElementById("fromDate")?.value;
  const toDate = document.getElementById("toDate")?.value;

  return {
    type,
    vehicleType:
      vehicleType && vehicleType !== "Select type" ? vehicleType : "",
    location: location || "",
    fromDate: fromDate || "",
    toDate: toDate || "",
  };
}

function initializeFilters() {
  const ids = ["vehicleTypeFilter", "locationFilter", "fromDate", "toDate"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("change", () => loadBookings("past"));
    if (id === "locationFilter")
      el.addEventListener("input", () => loadBookings("past"));
  });
}

function initializeDateInputs() {
  // optional: leave empty for past searches
}

function initializeSort() {
  const sortSelect = document.getElementById("sortSelect");
  if (!sortSelect) return;
  sortSelect.addEventListener("change", () => applySorting());
}

function applySorting() {
  const sortValue =
    document.getElementById("sortSelect")?.value || "Descending";
  const container = document.querySelector(".bookings-container");
  if (!container) return;

  const cards = Array.from(container.querySelectorAll(".booking-card"));
  cards.sort((a, b) => {
    const aId = parseInt(a.dataset.bookingId || "0", 10);
    const bId = parseInt(b.dataset.bookingId || "0", 10);
    if (sortValue.includes("Ascending")) return aId - bId;
    return bId - aId;
  });

  cards.forEach((c) => container.appendChild(c));
}

function renderBookings(items) {
  const container = document.querySelector(".bookings-container");
  if (!container) return;

  if (!items.length) {
    container.innerHTML = `<div style="padding:16px;color:#5f6368;">No past bookings found.</div>`;
    return;
  }

  container.innerHTML = items
    .map((b) => {
      return `
      <div class="booking-card" data-booking-id="${b.bookingId}" style="cursor:pointer;">
        <div class="booking-header">
          <div class="booking-id">
            <h3>Booking ID: ${escapeHtml(b.displayId || "BK" + b.bookingId)}</h3>
            <span class="customer-name"> ${escapeHtml(b.customerName || "Unknown")}</span>
          </div>
          <div class="booking-status">${escapeHtml((b.status || "completed").toUpperCase())}</div>
        </div>

        <div class="booking-content">
          <div class="booking-left">
            <div class="vehicle-image">
              <div class="image-placeholder">Image of Vehicle</div>
            </div>
            <div class="rental-info">
              <div class="rental-company">
                <strong>Rental Company</strong>
                <span>${escapeHtml(b.rentalCompany || "N/A")}</span>
              </div>
              <div class="location-info">
                <strong>Location</strong>
                <span>📍 ${escapeHtml(b.pickupLocation || "N/A")}</span>
              </div>
            </div>
          </div>

          <div class="booking-right">
            <div class="vehicle-details">
              <strong>Vehicle</strong>
              <span> ${escapeHtml(b.vehicleName || "N/A")}</span>
            </div>
            <div class="duration-info">
              <strong>Duration</strong>
              <span> ${escapeHtml(String(b.durationDays || ""))} days</span>
            </div>
          </div>
        </div>

        <div class="booking-footer">
          <div class="booking-actions">
            <button class="btn btn-sm btn-primary" type="button" data-view-details="${b.bookingId}">View Details</button>
          </div>
        </div>
      </div>
      `;
    })
    .join("");
}

function wireCardNavigation() {
  const container = document.querySelector(".bookings-container");
  if (!container) return;

  container.querySelectorAll(".booking-card").forEach((card) => {
    const bookingId = card.getAttribute("data-booking-id");
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      window.location.href = `../html/order-details.html?id=${encodeURIComponent(bookingId)}`;
    });

    const btn = card.querySelector(`[data-view-details="${bookingId}"]`);
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        window.location.href = `../html/order-details.html?id=${encodeURIComponent(bookingId)}`;
      });
    }
  });
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
