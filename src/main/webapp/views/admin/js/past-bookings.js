// past-bookings.js (API wired)
// Uses: GET /api/admin/customer-bookings/{customerId}/past
// Navigates to: order-details.html?customerId=...&id=BK001

document.addEventListener("DOMContentLoaded", async () => {
  wireUI();
  await loadBookings("past");
});

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function apiBase() {
  return "/api/admin/customer-bookings";
}

function wireUI() {
  document
    .getElementById("vehicleTypeFilter")
    ?.addEventListener("change", applyFilters);
  document
    .getElementById("locationFilter")
    ?.addEventListener("input", applyFilters);
  document.getElementById("fromDate")?.addEventListener("change", applyFilters);
  document.getElementById("toDate")?.addEventListener("change", applyFilters);

  document
    .querySelectorAll('.filter-options input[type="checkbox"]')
    .forEach((cb) => {
      cb.addEventListener("change", applyFilters);
    });

  document
    .getElementById("sortSelect")
    ?.addEventListener("change", applySorting);
}

let ALL_BOOKINGS = [];

async function loadBookings(scope) {
  const customerId = getQueryParam("customerId");
  const container = document.querySelector(".bookings-container");
  if (!container) return;

  if (!customerId) {
    container.innerHTML = `<div style="padding:16px;color:#b91c1c;">Missing customerId in URL.</div>`;
    return;
  }

  container.innerHTML = `<div style="padding:16px;color:#6b7280;">Loading bookings...</div>`;

  try {
    const url = `${apiBase()}/${encodeURIComponent(customerId)}/${scope}`;
    const res = await fetch(url, { credentials: "include" });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      container.innerHTML = `<div style="padding:16px;color:#b91c1c;">${escapeHtml(
        data.error || `Failed (HTTP ${res.status})`,
      )}</div>`;
      return;
    }

    ALL_BOOKINGS = Array.isArray(data.bookings) ? data.bookings : [];
    renderBookings(ALL_BOOKINGS);
    applyFilters();
  } catch (e) {
    console.error(e);
    container.innerHTML = `<div style="padding:16px;color:#b91c1c;">Failed to load bookings. Check servlet mapping + admin session.</div>`;
  }
}

function renderBookings(list) {
  const container = document.querySelector(".bookings-container");
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `<div style="padding:16px;color:#6b7280;">No past bookings found.</div>`;
    return;
  }

  list.forEach((b) => container.appendChild(createBookingCard(b)));

  initializeBookingCards();
  addViewDetailsButtons();
  enhanceBookingCardInteractions();
}

function createBookingCard(b) {
  const bookingId = b.bookingId || "BK000";
  const status = String(b.status || "").toLowerCase();
  const pay = String(b.paymentStatus || "").toLowerCase();

  const customerName = getQueryParam("customerName") || "Customer";
  const companyName = b.company?.companyName || "Rental Company";
  const driverName = b.driver?.name || null;

  const vehicleName = b.vehicle?.name || "Vehicle";
  const vehicleType = b.vehicle?.type || "";
  const location =
    b.pickupLocation || b.vehicle?.location || b.company?.city || "—";

  const durationDays = b.durationDays != null ? `${b.durationDays} days` : "—";

  const badge =
    status === "completed"
      ? "Completed"
      : status === "cancelled"
        ? "Cancelled"
        : "Past";
  const badgeClass =
    status === "completed"
      ? "completed"
      : status === "cancelled"
        ? "cancelled"
        : "completed";

  const dots = [];
  if (status === "completed")
    dots.push(`<span class="status-dot accepted">● Completed</span>`);
  if (status === "cancelled")
    dots.push(`<span class="status-dot pickup">● Cancelled</span>`);
  if (pay === "paid") dots.push(`<span class="status-dot paid">● Paid</span>`);

  const card = document.createElement("div");
  card.className = "booking-card";
  card.dataset.status = pay || status || "";

  card.innerHTML = `
    <div class="booking-header">
      <div class="booking-id">
        <h3>Booking ID: ${escapeHtml(bookingId)}</h3>
        <span class="customer-name"> ${escapeHtml(customerName)}</span>
      </div>
      <div class="booking-status ${badgeClass}">${escapeHtml(badge)}</div>
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
            <span>${escapeHtml(companyName)}</span>
          </div>

          ${
            driverName
              ? `<div class="driver-info">
                   <strong>Driver</strong>
                   <span> ${escapeHtml(driverName)}</span>
                 </div>`
              : ""
          }

          <div class="location-info">
            <strong>Location</strong>
            <span>📍 ${escapeHtml(location)}</span>
          </div>
        </div>
      </div>

      <div class="booking-right">
        <div class="vehicle-details">
          <strong>Vehicle</strong>
          <span> ${escapeHtml(vehicleName)} ${vehicleType ? `(${escapeHtml(vehicleType)})` : ""}</span>
        </div>
        <div class="duration-info">
          <strong>Duration</strong>
          <span> ${escapeHtml(durationDays)}</span>
        </div>
      </div>
    </div>

    <div class="booking-footer">
      <div class="status-indicators">
        ${dots.join("")}
      </div>
      <div class="booking-actions">
        <span class="action-label">Pick-up</span>
        <span class="action-label">Drop-off</span>
      </div>
    </div>
  `;

  return card;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* click-to-details + buttons */

function initializeBookingCards() {
  document.querySelectorAll(".booking-card").forEach((card) => {
    card.addEventListener("click", function (e) {
      if (
        e.target.closest("button") ||
        e.target.closest(".booking-actions") ||
        e.target.closest(".view-details-btn")
      )
        return;
      const bookingId = extractBookingId(card);
      navigateToOrderDetails(bookingId);
    });
  });
}

function extractBookingId(card) {
  const t = card.querySelector(".booking-id h3")?.textContent || "";
  const m = t.match(/Booking ID:\s*(.+)/);
  return m ? m[1].trim() : "BK000";
}

function navigateToOrderDetails(bookingId) {
  const customerId = getQueryParam("customerId");
  window.location.href = `order-details.html?customerId=${encodeURIComponent(customerId || "")}&id=${encodeURIComponent(bookingId)}`;
}

function addViewDetailsButtons() {
  document.querySelectorAll(".booking-card").forEach((card) => {
    const actionsArea = card.querySelector(".booking-actions");
    if (actionsArea && !actionsArea.querySelector(".view-details-btn")) {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-primary view-details-btn";
      btn.textContent = "View Details";
      btn.style.marginLeft = "8px";
      btn.onclick = (e) => {
        e.stopPropagation();
        navigateToOrderDetails(extractBookingId(card));
      };
      actionsArea.appendChild(btn);
    }
  });
}

function enhanceBookingCardInteractions() {
  if (document.getElementById("bookingEnhanceStyle")) return;
  const style = document.createElement("style");
  style.id = "bookingEnhanceStyle";
  style.textContent = `
    .view-details-btn { opacity:0; transform: translateY(10px); transition: all 0.3s ease; }
    .booking-card:hover .view-details-btn { opacity:1; transform: translateY(0); }
  `;
  document.head.appendChild(style);
}

/* filters + sort */

function applyFilters() {
  const vehicleType =
    document.getElementById("vehicleTypeFilter")?.value || "Select type";
  const location = (
    document.getElementById("locationFilter")?.value || ""
  ).toLowerCase();

  const withDriver = document.getElementById("withDriver")?.checked;
  const paid = document.getElementById("paid")?.checked;

  document.querySelectorAll(".booking-card").forEach((card) => {
    let ok = true;

    if (vehicleType !== "Select type") {
      const text = (
        card.querySelector(".vehicle-details span")?.textContent || ""
      ).toLowerCase();
      if (!text.includes(vehicleType.toLowerCase())) ok = false;
    }

    if (location) {
      const text = (
        card.querySelector(".location-info span")?.textContent || ""
      ).toLowerCase();
      if (!text.includes(location)) ok = false;
    }

    if (withDriver && !card.querySelector(".driver-info")) ok = false;

    const indicators = Array.from(card.querySelectorAll(".status-dot")).map(
      (d) => d.textContent,
    );
    if (paid && !indicators.some((t) => t.includes("Paid"))) ok = false;

    card.style.display = ok ? "block" : "none";
  });
}

function applySorting() {
  const sortValue =
    document.getElementById("sortSelect")?.value || "Descending";
  const container = document.querySelector(".bookings-container");
  if (!container) return;

  const cards = Array.from(container.querySelectorAll(".booking-card"));

  cards.sort((a, b) => {
    const aId = a.querySelector(".booking-id h3")?.textContent || "";
    const bId = b.querySelector(".booking-id h3")?.textContent || "";
    if (sortValue.includes("Ascending")) return aId.localeCompare(bId);
    return bId.localeCompare(aId);
  });

  cards.forEach((c) => container.appendChild(c));
}
