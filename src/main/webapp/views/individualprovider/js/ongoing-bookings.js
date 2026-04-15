// ongoing-bookings.js — Provider side
// API: GET /api/provider/bookings?type=ongoing&...
// Detail: ../html/order-details.html?id={bookingId}

let ALL_BOOKINGS = [];
let currentPage = 1;
let totalBookings = 0;
const PAGE_SIZE = 10;

const API_BASE = window.API_BASE || "";

document.addEventListener("DOMContentLoaded", () => {
  initializeDateInputs();
  wireUI();
  loadBookings("ongoing", 1);
});

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

async function loadBookings(type, page) {
  const container = document.querySelector(".bookings-container");
  if (!container) return;

  if (page === 1) {
    container.innerHTML = `<div style="padding:16px;color:#6b7280;">Loading bookings…</div>`;
    ALL_BOOKINGS = [];
  }

  try {
    const q = collectFilterParams(type, page);
    const data = await fetchJson(
      `${API_BASE}/api/provider/bookings${buildQuery(q)}`,
    );
    const incoming = data.items || [];
    totalBookings = Number(data.total || incoming.length);
    currentPage = page;

    ALL_BOOKINGS = page === 1 ? incoming : ALL_BOOKINGS.concat(incoming);

    renderBookings(ALL_BOOKINGS, page === 1);
    updateLoadMoreButton();
  } catch (err) {
    console.error(err);
    container.innerHTML = `<div style="padding:16px;color:#b91c1c;">Failed to load bookings. ${escapeHtml(err.message)}</div>`;
  }
}

function collectFilterParams(type, page) {
  const vehicleType = document.getElementById("vehicleTypeFilter")?.value;
  const location = document.getElementById("locationFilter")?.value;
  const fromDate = document.getElementById("fromDate")?.value;
  const toDate = document.getElementById("toDate")?.value;
  const withDriver = document.getElementById("withDriver")?.checked;
  const accepted = document.getElementById("accepted")?.checked;
  const pickedUp = document.getElementById("pickedUp")?.checked;
  const paid = document.getElementById("paid")?.checked;

  let status = "";
  if (accepted) status = "accepted";
  else if (pickedUp) status = "in-progress";

  return {
    type,
    page: page || 1,
    pageSize: PAGE_SIZE,
    vehicleType:
      vehicleType && vehicleType !== "Select type" ? vehicleType : "",
    location: location || "",
    fromDate: fromDate || "",
    toDate: toDate || "",
    withDriver: withDriver ? "true" : "",
    status,
    paymentStatus: paid ? "paid" : "",
  };
}

function renderBookings(items, clearFirst) {
  const container = document.querySelector(".bookings-container");
  if (!container) return;

  if (clearFirst) container.innerHTML = "";

  if (!items.length) {
    container.innerHTML = `<div style="padding:16px;color:#6b7280;">No ongoing bookings found.</div>`;
    return;
  }

  if (clearFirst) {
    items.forEach((b) => container.appendChild(createBookingCard(b)));
  } else {
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    items
      .slice(startIdx)
      .forEach((b) => container.appendChild(createBookingCard(b)));
  }
}

function createBookingCard(b) {
  const bookingId = b.displayId || "BK" + b.bookingId;
  const status = String(b.status || "").toLowerCase();
  const pay = String(b.paymentStatus || "").toLowerCase();
  const customerName = b.customerName || "Unknown";
  const companyName = b.rentalCompany || "Rental Company";
  const driverName = b.driverName || null;
  const vehicleName = b.vehicleName || b.vehicle?.name || "Vehicle";
  const vehicleType = b.vehicleType || b.vehicle?.type || "";
  const location =
    b.pickupLocation || b.dropLocation || b.vehicle?.location || "—";
  const durationDays = b.durationDays != null ? `${b.durationDays} days` : "—";

  const badge = statusBadgeText(status, pay);
  const badgeClass = statusBadgeClass(status, pay);

  const dots = [];
  if (status && status !== "pending")
    dots.push(`<span class="status-dot accepted">Accepted</span>`);
  if (pay === "paid") dots.push(`<span class="status-dot paid">Paid</span>`);
  if (status === "in-progress" || status === "pickup-ready")
    dots.push(`<span class="status-dot pickup">Picked Up</span>`);

  const card = document.createElement("div");
  card.className = "booking-card";
  card.dataset.bookingId = b.bookingId;
  card.dataset.status = pay || status || "";
  card.dataset.tripStart = b.tripStartDate || "";
  card.dataset.tripEnd = b.tripEndDate || "";
  card.dataset.vehicleType = vehicleType.toLowerCase();
  card.dataset.location = location.toLowerCase();

  card.innerHTML = `
    <div class="booking-header">
      <div class="booking-id">
        <h3>Booking ID: ${escapeHtml(bookingId)}</h3>
        <span class="customer-name">${escapeHtml(customerName)}</span>
      </div>
      <div class="booking-status ${badgeClass}">${escapeHtml(badge)}</div>
    </div>

    <div class="booking-content">
      <div class="booking-left">
        <div class="vehicle-image">
          ${createVehicleImageMarkup(b.vehicle)}
        </div>
        <div class="rental-info">
          <div class="rental-company">
            <strong>Rental Company</strong>
            <span>${escapeHtml(companyName)}</span>
          </div>
          ${
            driverName
              ? `
          <div class="driver-info">
            <strong>Driver</strong>
            <span>${escapeHtml(driverName)}</span>
          </div>`
              : ""
          }
          <div class="location-info">
            <strong>Location</strong>
            <span><i class="fas fa-location-dot"></i> ${escapeHtml(location)}</span>
          </div>
        </div>
      </div>

      <div class="booking-right">
        <div class="vehicle-details">
          <strong>Vehicle</strong>
          <span>${escapeHtml(vehicleName)}${vehicleType ? ` (${escapeHtml(vehicleType)})` : ""}</span>
        </div>
        <div class="duration-info">
          <strong>Duration</strong>
          <span>${escapeHtml(durationDays)}</span>
        </div>
        ${
          b.tripStartDate
            ? `
        <div class="date-info">
          <strong>From</strong>
          <span>${formatDateShort(b.tripStartDate)}</span>
        </div>`
            : ""
        }
        ${
          b.tripEndDate
            ? `
        <div class="date-info">
          <strong>To</strong>
          <span>${formatDateShort(b.tripEndDate)}</span>
        </div>`
            : ""
        }
      </div>
    </div>

    <div class="booking-footer">
      <div class="status-indicators">
        ${dots.join("")}
      </div>
      <div class="booking-actions">
        <button class="btn btn-sm btn-primary view-details-btn" type="button" data-booking-id="${b.bookingId}">
          View Details
        </button>
      </div>
    </div>
  `;

  card.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    navigateToOrderDetails(b.bookingId);
  });

  card.querySelector("[data-booking-id]").addEventListener("click", (e) => {
    e.stopPropagation();
    navigateToOrderDetails(b.bookingId);
  });

  return card;
}

function navigateToOrderDetails(bookingId) {
  sessionStorage.setItem("previousPage", "ongoing-bookings");
  sessionStorage.setItem("scrollPosition", window.scrollY);
  window.location.href = `../html/order-details.html?id=${encodeURIComponent(bookingId)}`;
}

function createVehicleImageMarkup(vehicle) {
  if (vehicle?.imageUrl) {
    return `<img
      src="${escapeHtml(vehicle.imageUrl)}"
      alt="${escapeHtml(vehicle.name || "Vehicle")}"
      style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;"
      onerror="this.onerror=null;this.parentElement.innerHTML='<span class=&quot;vehicle-icon&quot;><i class=&quot;fas fa-car-side&quot;></i></span><div class=&quot;image-placeholder&quot;>Vehicle</div>';"
    />`;
  }
  return `<span class="vehicle-icon"><i class="fas fa-car-side"></i></span>
          <div class="image-placeholder">Vehicle</div>`;
}

function statusBadgeText(status, pay) {
  if (pay === "paid") return "Paid";
  if (status === "pickup-ready") return "Ready for Pickup";
  if (status === "in-progress") return "In Progress";
  if (status === "accepted") return "Accepted";
  return "Pending";
}

function statusBadgeClass(status, pay) {
  if (pay === "paid") return "paid";
  if (status === "pickup-ready") return "pickup-ready";
  if (status === "in-progress") return "in-progress";
  if (status === "accepted") return "accepted";
  return "accepted";
}

function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function applySorting() {
  const val = document.getElementById("sortSelect")?.value || "Descending";
  const container = document.querySelector(".bookings-container");
  if (!container) return;

  const cards = Array.from(container.querySelectorAll(".booking-card"));
  cards.sort((a, b) => {
    if (val.includes("Date")) {
      const aDate = new Date(a.dataset.tripStart || 0);
      const bDate = new Date(b.dataset.tripStart || 0);
      return val.includes("Newest") ? bDate - aDate : aDate - bDate;
    }
    const aId = parseInt(a.dataset.bookingId || "0", 10);
    const bId = parseInt(b.dataset.bookingId || "0", 10);
    return val.includes("Ascending") ? aId - bId : bId - aId;
  });
  cards.forEach((c) => container.appendChild(c));
}

function updateLoadMoreButton() {
  const section = document.getElementById("loadMoreSection");
  if (!section) return;
  if (ALL_BOOKINGS.length < totalBookings) {
    section.style.display = "block";
    const btn = document.getElementById("loadMoreBtn");
    if (btn)
      btn.innerHTML = `<i class="fas fa-chevron-down"></i> Load More (${ALL_BOOKINGS.length} / ${totalBookings})`;
  } else {
    section.style.display = "none";
  }
}

function loadMoreBookings() {
  loadBookings("ongoing", currentPage + 1);
}

function wireUI() {
  const ids = [
    "vehicleTypeFilter",
    "locationFilter",
    "fromDate",
    "toDate",
    "withDriver",
    "accepted",
    "pickedUp",
    "paid",
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = id === "locationFilter" ? "input" : "change";
    el.addEventListener(evt, applyFilters);
  });
  document
    .getElementById("sortSelect")
    ?.addEventListener("change", applySorting);
}

function initializeDateInputs() {
  const from = document.getElementById("fromDate");
  const to = document.getElementById("toDate");
  if (!from || !to) return;
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  from.value = today;
  to.value = nextWeek.toISOString().split("T")[0];
}

function applyFilters() {
  loadBookings("ongoing", 1);
}

function toggleFilters(btn) {
  const filterOptions = document.getElementById("filterOptions");
  if (!filterOptions) return;
  const hidden = filterOptions.style.display === "none";
  filterOptions.style.display = hidden ? "flex" : "none";
  if (btn) {
    btn.innerHTML = hidden
      ? `<i class="fas fa-sliders"></i> Hide Filters`
      : `<i class="fas fa-sliders"></i> Show Filters`;
  }
}

window.applyFilters = applyFilters;
window.toggleFilters = toggleFilters;
window.loadMoreBookings = loadMoreBookings;
