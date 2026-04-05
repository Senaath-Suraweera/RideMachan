// ongoing-bookings.js (API wired)
// Uses: GET /api/admin/customer-bookings/{customerId}/ongoing
// Navigates to: order-details.html?customerId=...&id=BK001

document.addEventListener("DOMContentLoaded", async () => {
  wireUI();
  await loadBookings("ongoing");
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

let ALL_BOOKINGS = []; // raw API array

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
    applyFilters(); // apply current UI filters on top
  } catch (e) {
    console.error(e);
    container.innerHTML = `<div style="padding:16px;color:#b91c1c;">Failed to load bookings. Check servlet mapping + admin session.</div>`;
  }
}

function renderBookings(list) {
  const container = document.querySelector(".bookings-container");
  container.innerHTML = "";

  if (!list.length) {
    container.innerHTML = `<div style="padding:16px;color:#6b7280;">No ongoing bookings found.</div>`;
    return;
  }

  list.forEach((b) => {
    const card = createBookingCard(b);
    container.appendChild(card);
  });

  // card interactions
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

  const badge = statusBadgeText(status, pay);
  const badgeClass = statusBadgeClass(status, pay);

  // status dots (for filters)
  const dots = [];
  if (status && status !== "pending")
    dots.push(`<span class="status-dot accepted">● Accepted</span>`);
  if (pay === "paid") dots.push(`<span class="status-dot paid">● Paid</span>`);

  // picked up heuristic
  if (isPickedUp(b.tripStartDate))
    dots.push(`<span class="status-dot pickup">● Pick-up</span>`);

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

function statusBadgeText(status, pay) {
  if (status === "cancelled") return "Cancelled";
  if (status === "completed") return "Completed";
  if (status === "in-progress" || status === "ongoing") return "In Progress";
  if (pay === "paid") return "Paid";
  if (status === "accepted") return "Accepted";
  return status ? titleCase(status) : "Ongoing";
}

function statusBadgeClass(status, pay) {
  if (status === "cancelled") return "cancelled";
  if (status === "completed") return "completed";
  if (status === "in-progress" || status === "ongoing") return "in-progress";
  if (pay === "paid") return "paid";
  if (status === "accepted") return "accepted";
  return "in-progress";
}

function isPickedUp(tripStartDate) {
  if (!tripStartDate) return false;
  try {
    const d = new Date(tripStartDate);
    const now = new Date();
    return d <= now;
  } catch {
    return false;
  }
}

function titleCase(s) {
  return String(s)
    .split("-")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : ""))
    .join(" ");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

/* ---------------- Existing UI functions (modified to work with dynamic cards) ---------------- */

function initializeBookingCards() {
  const bookingCards = document.querySelectorAll(".booking-card");
  bookingCards.forEach((card) => {
    card.addEventListener("click", function (e) {
      if (
        e.target.closest("button") ||
        e.target.closest(".booking-actions") ||
        e.target.closest(".view-details-btn")
      ) {
        return;
      }
      const bookingId = extractBookingId(card);
      navigateToOrderDetails(bookingId);
    });

    card.addEventListener("mouseenter", function () {
      this.style.cursor = "pointer";
      this.style.transform = "translateY(-2px)";
      this.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.15)";
      this.style.transition = "all 0.2s ease";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
      this.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
    });
  });
}

function extractBookingId(card) {
  const bookingIdElement = card.querySelector(".booking-id h3");
  if (bookingIdElement) {
    const fullText = bookingIdElement.textContent;
    const match = fullText.match(/Booking ID:\s*(.+)/);
    return match ? match[1].trim() : "BK000";
  }
  return "BK000";
}

function navigateToOrderDetails(bookingId) {
  const customerId = getQueryParam("customerId");
  sessionStorage.setItem("previousPage", "ongoing-bookings");
  sessionStorage.setItem("scrollPosition", window.scrollY);

  window.location.href = `order-details.html?customerId=${encodeURIComponent(customerId || "")}&id=${encodeURIComponent(bookingId)}`;
}

function addViewDetailsButtons() {
  const bookingCards = document.querySelectorAll(".booking-card");
  bookingCards.forEach((card) => {
    const actionsArea = card.querySelector(".booking-actions");
    if (actionsArea && !actionsArea.querySelector(".view-details-btn")) {
      const viewDetailsBtn = document.createElement("button");
      viewDetailsBtn.className = "btn btn-sm btn-primary view-details-btn";
      viewDetailsBtn.innerHTML = "View Details";
      viewDetailsBtn.style.marginLeft = "8px";
      viewDetailsBtn.onclick = function (e) {
        e.stopPropagation();
        const bookingId = extractBookingId(card);
        navigateToOrderDetails(bookingId);
      };
      actionsArea.appendChild(viewDetailsBtn);
    }
  });
}

function enhanceBookingCardInteractions() {
  if (document.getElementById("bookingEnhanceStyle")) return;
  const style = document.createElement("style");
  style.id = "bookingEnhanceStyle";
  style.textContent = `
    .booking-card { position: relative; overflow: hidden; }
    .booking-card::before {
      content:'';
      position:absolute; top:0; left:-100%;
      width:100%; height:100%;
      background:linear-gradient(90deg,transparent,rgba(26,188,156,0.1),transparent);
      transition:left 0.6s;
    }
    .booking-card:hover::before { left:100%; }
    .booking-card:active { transform: translateY(1px); }
    .view-details-btn { opacity:0; transform: translateY(10px); transition: all 0.3s ease; }
    .booking-card:hover .view-details-btn { opacity:1; transform: translateY(0); }
  `;
  document.head.appendChild(style);
}

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

function applyFilters() {
  const vehicleType =
    document.getElementById("vehicleTypeFilter")?.value || "Select type";
  const location = (
    document.getElementById("locationFilter")?.value || ""
  ).toLowerCase();
  const fromDate = document.getElementById("fromDate")?.value || "";
  const toDate = document.getElementById("toDate")?.value || "";

  const withDriver = document.getElementById("withDriver")?.checked;
  const accepted = document.getElementById("accepted")?.checked;
  const pickedUp = document.getElementById("pickedUp")?.checked;
  const paid = document.getElementById("paid")?.checked;

  const cards = document.querySelectorAll(".booking-card");

  cards.forEach((card) => {
    let shouldShow = true;

    // Vehicle type
    if (vehicleType !== "Select type") {
      const vehicleText = (
        card.querySelector(".vehicle-details span")?.textContent || ""
      ).toLowerCase();
      if (!vehicleText.includes(vehicleType.toLowerCase())) shouldShow = false;
    }

    // Location
    if (location) {
      const cardLocation = (
        card.querySelector(".location-info span")?.textContent || ""
      ).toLowerCase();
      if (!cardLocation.includes(location)) shouldShow = false;
    }

    // Date range (we can only read from embedded bookingId card? -> skip if not set)
    // If you want strict date filtering, we need dates printed on cards. For now: ignore.

    const indicators = Array.from(card.querySelectorAll(".status-dot")).map(
      (d) => d.textContent,
    );

    if (accepted && !indicators.some((t) => t.includes("Accepted")))
      shouldShow = false;
    if (paid && !indicators.some((t) => t.includes("Paid"))) shouldShow = false;
    if (pickedUp && !indicators.some((t) => t.includes("Pick-up")))
      shouldShow = false;

    if (withDriver) {
      const driverInfo = card.querySelector(".driver-info");
      if (!driverInfo) shouldShow = false;
    }

    card.style.display = shouldShow ? "block" : "none";
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
    if (sortValue.includes("Descending")) return bId.localeCompare(aId);

    // Dates + prices would need printed values; keep ID sort fallback
    return bId.localeCompare(aId);
  });

  cards.forEach((c) => container.appendChild(c));
}
