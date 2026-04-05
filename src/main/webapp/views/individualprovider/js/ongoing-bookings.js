// ongoing-bookings.js (API-connected)

document.addEventListener("DOMContentLoaded", () => {
  initializeFilters();
  initializeDateInputs();
  initializeSort();

  // Initial load (ongoing)
  loadBookings("ongoing");
});

const API_BASE = window.API_BASE || ""; // keep "" if same app origin/context

async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (e) {
    // ignore
  }
  if (!res.ok) {
    const msg = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
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

  const withDriver = document.getElementById("withDriver")?.checked;
  const accepted = document.getElementById("accepted")?.checked;
  const pickedUp = document.getElementById("pickedUp")?.checked;
  const paid = document.getElementById("paid")?.checked;

  // Minimal mapping from checkboxes -> status/paymentStatus filters
  // accepted => status=accepted
  // pickedUp => status=in-progress (approx)
  // paid => paymentStatus=paid
  let status = "";
  if (accepted) status = "accepted";
  else if (pickedUp) status = "in-progress";

  let paymentStatus = "";
  if (paid) paymentStatus = "paid";

  return {
    type,
    vehicleType:
      vehicleType && vehicleType !== "Select type" ? vehicleType : "",
    location: location || "",
    fromDate: fromDate || "",
    toDate: toDate || "",
    withDriver: withDriver ? "true" : "",
    status,
    paymentStatus,
  };
}

// ---------- UI wiring ----------
function initializeFilters() {
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
    el.addEventListener("change", () => loadBookings("ongoing"));
    if (id === "locationFilter")
      el.addEventListener("input", () => loadBookings("ongoing"));
  });
}

function initializeDateInputs() {
  const from = document.getElementById("fromDate");
  const to = document.getElementById("toDate");
  if (!from || !to) return;

  const today = new Date().toISOString().split("T")[0];
  from.value = today;

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  to.value = nextWeek.toISOString().split("T")[0];
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
    container.innerHTML = `<div style="padding:16px;color:#5f6368;">No bookings found.</div>`;
    return;
  }

  container.innerHTML = items
    .map((b) => {
      const statusText = prettyStatus(b.status);
      const paymentText =
        (b.paymentStatus || "").toLowerCase() === "paid"
          ? "Paid"
          : b.paymentStatus || "Pending";
      const driverBlock = b.driverName
        ? `<div class="driver-info"><strong>Driver</strong><span> ${escapeHtml(b.driverName)}</span></div>`
        : "";

      return `
      <div class="booking-card" data-status="${escapeHtml((b.paymentStatus || b.status || "").toLowerCase())}" data-booking-id="${b.bookingId}" style="cursor:pointer;">
        <div class="booking-header">
          <div class="booking-id">
            <h3>Booking ID: ${escapeHtml(b.displayId || "BK" + b.bookingId)}</h3>
            <span class="customer-name"> ${escapeHtml(b.customerName || "Unknown")}</span>
          </div>
          <div class="booking-status ${cssStatusClass(b.status, b.paymentStatus)}">${escapeHtml(paymentText)}</div>
        </div>

        <div class="booking-content">
          <div class="booking-left">
            <div class="vehicle-image">
              <span class="vehicle-icon"></span>
              <div class="image-placeholder">Image of Vehicle</div>
            </div>

            <div class="rental-info">
              <div class="rental-company">
                <strong>Rental Company</strong>
                <span>${escapeHtml(b.rentalCompany || "N/A")}</span>
              </div>

              ${driverBlock}

              <div class="location-info">
                <strong>Location</strong>
                <span>📍 ${escapeHtml(b.pickupLocation || b.dropLocation || "N/A")}</span>
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
          <div class="status-indicators">
            <span class="status-dot accepted">● ${escapeHtml(statusText)}</span>
            ${(b.paymentStatus || "").toLowerCase() === "paid" ? `<span class="status-dot paid">● Paid</span>` : ""}
          </div>

          <div class="booking-actions">
            <button class="btn btn-sm btn-primary view-details-btn" type="button" data-view-details="${b.bookingId}">View Details</button>
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
      navigateToOrderDetails(bookingId);
    });

    const btn = card.querySelector(`[data-view-details="${bookingId}"]`);
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        navigateToOrderDetails(bookingId);
      });
    }
  });
}

function navigateToOrderDetails(bookingId) {
  sessionStorage.setItem("previousPage", "ongoing-bookings");
  sessionStorage.setItem("scrollPosition", window.scrollY);
  window.location.href = `../html/order-details.html?id=${encodeURIComponent(bookingId)}`;
}

// Buttons used by HTML
function toggleFilters() {
  const filterOptions = document.querySelector(".filter-options");
  const button = event.target;
  if (!filterOptions) return;

  if (filterOptions.style.display === "none") {
    filterOptions.style.display = "flex";
    button.textContent = "Hide filters";
  } else {
    filterOptions.style.display = "none";
    button.textContent = "Show filters";
  }
}

function loadMoreBookings() {
  alert(
    "Pagination not implemented yet. (We can add LIMIT/OFFSET if you want)",
  );
}

function applyFilters() {
  loadBookings("ongoing");
}

// helpers
function prettyStatus(s) {
  const v = (s || "pending").toLowerCase();
  if (v === "pickup-ready") return "Ready for Pickup";
  if (v === "in-progress") return "In Progress";
  if (v === "accepted") return "Accepted";
  if (v === "completed") return "Completed";
  if (v === "cancelled") return "Cancelled";
  return "Pending";
}

function cssStatusClass(status, paymentStatus) {
  const pay = (paymentStatus || "").toLowerCase();
  if (pay === "paid") return "paid";
  const st = (status || "").toLowerCase();
  if (st.includes("progress")) return "in-progress";
  if (st.includes("accept")) return "accepted";
  return "paid"; // fallback to match existing css blocks
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// export globals used by HTML onclick
window.applyFilters = applyFilters;
window.toggleFilters = toggleFilters;
window.loadMoreBookings = loadMoreBookings;
