// past-bookings.js (API wired)
// Uses: GET /api/admin/customer-bookings/{customerId}/past
// Navigates to: order-details.html?customerId=...&id=BK001

let ALL_BOOKINGS = [];
let currentPage = 1;
let totalBookings = 0;
const PAGE_SIZE = 10;

document.addEventListener("DOMContentLoaded", async () => {
  wireUI();
  await loadBookings("past", 1);
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
    .forEach((cb) => cb.addEventListener("change", applyFilters));

  document
    .getElementById("sortSelect")
    ?.addEventListener("change", applySorting);
}

async function loadBookings(scope, page) {
  const customerId = getQueryParam("customerId");
  const container = document.querySelector(".bookings-container");
  if (!container) return;

  if (!customerId) {
    container.innerHTML = `<div style="padding:16px;color:#b91c1c;">Missing customerId in URL.</div>`;
    return;
  }

  if (page === 1) {
    container.innerHTML = `<div style="padding:16px;color:#6b7280;">Loading bookings...</div>`;
    ALL_BOOKINGS = [];
  }

  try {
    const url = `${apiBase()}/${encodeURIComponent(customerId)}/${scope}?page=${page}&pageSize=${PAGE_SIZE}`;
    const res = await fetch(url, { credentials: "include" });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      container.innerHTML = `<div style="padding:16px;color:#b91c1c;">${escapeHtml(
        data.error || `Failed (HTTP ${res.status})`,
      )}</div>`;
      return;
    }

    const incoming = Array.isArray(data.bookings) ? data.bookings : [];
    totalBookings = data.total || 0;
    currentPage = page;

    if (page === 1) {
      ALL_BOOKINGS = incoming;
    } else {
      ALL_BOOKINGS = ALL_BOOKINGS.concat(incoming);
    }

    renderBookings(ALL_BOOKINGS, page === 1);
    updateLoadMoreButton();
  } catch (e) {
    console.error(e);
    container.innerHTML = `<div style="padding:16px;color:#b91c1c;">Failed to load bookings. Check servlet mapping + admin session.</div>`;
  }
}

function updateLoadMoreButton() {
  const section = document.getElementById("loadMoreSection");
  if (!section) return;
  if (ALL_BOOKINGS.length < totalBookings) {
    section.style.display = "block";
    const btn = document.getElementById("loadMoreBtn");
    if (btn)
      btn.textContent = `Load More (${ALL_BOOKINGS.length} / ${totalBookings})`;
  } else {
    section.style.display = "none";
  }
}

function loadMoreBookings() {
  loadBookings("past", currentPage + 1);
}

function renderBookings(list, clearFirst) {
  const container = document.querySelector(".bookings-container");

  if (clearFirst) {
    container.innerHTML = "";
  }

  if (!list.length) {
    container.innerHTML = `<div style="padding:16px;color:#6b7280;">No past bookings found.</div>`;
    return;
  }

  if (clearFirst) {
    list.forEach((b) => container.appendChild(createBookingCard(b)));
  } else {
    const startIdx = (currentPage - 1) * PAGE_SIZE;
    list
      .slice(startIdx)
      .forEach((b) => container.appendChild(createBookingCard(b)));
  }

  initializeBookingCards();
  addViewDetailsButtons();
  enhanceBookingCardInteractions();
  applyFilters();
}

function createVehicleImageMarkup(vehicle) {
  const imageUrl = vehicle?.imageUrl;
  if (imageUrl) {
    return `
      <img
        src="${escapeHtml(imageUrl)}"
        alt="${escapeHtml(vehicle?.name || "Vehicle")}"
        style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;"
        onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=&quot;vehicle-icon&quot;><i class=&quot;fas fa-car-side&quot;></i></span><div class=&quot;image-placeholder&quot;>Vehicle</div>';"
      />
    `;
  }

  return `
    <span class="vehicle-icon"><i class="fas fa-car-side"></i></span>
    <div class="image-placeholder">Vehicle</div>
  `;
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
  const totalAmount = b.totalAmount != null ? b.totalAmount : null;

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
    dots.push(`<span class="status-dot accepted">Completed</span>`);
  if (status === "cancelled")
    dots.push(`<span class="status-dot pickup">Cancelled</span>`);
  if (pay === "paid") dots.push(`<span class="status-dot paid">Paid</span>`);

  const card = document.createElement("div");
  card.className = "booking-card";
  card.dataset.status = pay || status || "";
  card.dataset.tripStart = b.tripStartDate || "";
  card.dataset.tripEnd = b.tripEndDate || "";
  card.dataset.totalAmount = totalAmount != null ? totalAmount : "";
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
              ? `<div class="driver-info">
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
          <span>${escapeHtml(vehicleName)} ${vehicleType ? `(${escapeHtml(vehicleType)})` : ""}</span>
        </div>
        <div class="duration-info">
          <strong>Duration</strong>
          <span>${escapeHtml(durationDays)}</span>
        </div>
        ${
          b.tripStartDate
            ? `<div class="date-info">
                 <strong>From</strong>
                 <span>${formatDateShort(b.tripStartDate)}</span>
               </div>`
            : ""
        }
        ${
          b.tripEndDate
            ? `<div class="date-info">
                 <strong>To</strong>
                 <span>${formatDateShort(b.tripEndDate)}</span>
               </div>`
            : ""
        }
        ${
          totalAmount != null
            ? `<div class="price-info">
                 <strong>Total</strong>
                 <span>LKR ${Number(totalAmount).toLocaleString()}</span>
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
        ${b.tripStartDate ? `<span class="action-label">Pick-up: ${formatDateShort(b.tripStartDate)}</span>` : `<span class="action-label">Pick-up</span>`}
        ${b.tripEndDate ? `<span class="action-label">Drop-off: ${formatDateShort(b.tripEndDate)}</span>` : `<span class="action-label">Drop-off</span>`}
      </div>
    </div>
  `;

  return card;
}

function formatDateShort(dateStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function initializeBookingCards() {
  document.querySelectorAll(".booking-card").forEach((card) => {
    if (card.dataset.wired) return;
    card.dataset.wired = "1";

    card.addEventListener("click", function (e) {
      if (e.target.closest("button") || e.target.closest(".view-details-btn"))
        return;
      navigateToOrderDetails(extractBookingId(card));
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
  const t = card.querySelector(".booking-id h3")?.textContent || "";
  const m = t.match(/Booking ID:\s*(.+)/);
  return m ? m[1].trim() : "BK000";
}

function navigateToOrderDetails(bookingId) {
  const customerId = getQueryParam("customerId");
  sessionStorage.setItem("previousPage", "past-bookings");
  sessionStorage.setItem("scrollPosition", window.scrollY);
  window.location.href = `order-details.html?customerId=${encodeURIComponent(customerId || "")}&id=${encodeURIComponent(bookingId)}`;
}

function addViewDetailsButtons() {
  document.querySelectorAll(".booking-card").forEach((card) => {
    const actionsArea = card.querySelector(".booking-actions");
    if (actionsArea && !actionsArea.querySelector(".view-details-btn")) {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-primary view-details-btn";
      btn.textContent = "View Details";
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
    .booking-card { position: relative; overflow: hidden; }
    .booking-card::before {
      content:'';
      position:absolute; top:0; left:-100%;
      width:100%; height:100%;
      background:linear-gradient(90deg,transparent,rgba(26,188,156,0.1),transparent);
      transition:left 0.6s;
    }
    .booking-card:hover::before { left:100%; }
    .booking-card:active { transform: translateY(1px) !important; }
    .view-details-btn { opacity:0; transform: translateY(10px); transition: all 0.3s ease; }
    .booking-card:hover .view-details-btn { opacity:1; transform: translateY(0); }
  `;
  document.head.appendChild(style);
}

function toggleFilters(btn) {
  const filterOptions = document.getElementById("filterOptions");
  if (!filterOptions) return;
  const hidden = filterOptions.style.display === "none";
  filterOptions.style.display = hidden ? "flex" : "none";
  if (btn) btn.textContent = hidden ? "Hide Filters" : "Show Filters";
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
  const paid = document.getElementById("paid")?.checked;

  document.querySelectorAll(".booking-card").forEach((card) => {
    let ok = true;

    if (vehicleType !== "Select type") {
      const vt = card.dataset.vehicleType || "";
      if (!vt.includes(vehicleType.toLowerCase())) ok = false;
    }

    if (location) {
      const loc = card.dataset.location || "";
      if (!loc.includes(location)) ok = false;
    }

    if (fromDate) {
      const start = card.dataset.tripStart;
      if (!start || start < fromDate) ok = false;
    }

    if (toDate) {
      const end = card.dataset.tripEnd;
      if (!end || end > toDate) ok = false;
    }

    const dots = Array.from(card.querySelectorAll(".status-dot")).map(
      (d) => d.textContent,
    );

    const showCompleted = document.getElementById("completed")?.checked;
    const showCancelled = document.getElementById("cancelled")?.checked;

    if (showCompleted && !dots.some((t) => t.includes("Completed"))) ok = false;
    if (showCancelled && !dots.some((t) => t.includes("Cancelled"))) ok = false;
    if (paid && !dots.some((t) => t.includes("Paid"))) ok = false;
    if (withDriver && !card.querySelector(".driver-info")) ok = false;

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
    if (sortValue === "Date (Newest)") {
      return (b.dataset.tripStart || "").localeCompare(
        a.dataset.tripStart || "",
      );
    }
    if (sortValue === "Date (Oldest)") {
      return (a.dataset.tripStart || "").localeCompare(
        b.dataset.tripStart || "",
      );
    }
    if (sortValue === "Price (High to Low)") {
      return (
        (parseFloat(b.dataset.totalAmount) || 0) -
        (parseFloat(a.dataset.totalAmount) || 0)
      );
    }
    if (sortValue === "Price (Low to High)") {
      return (
        (parseFloat(a.dataset.totalAmount) || 0) -
        (parseFloat(b.dataset.totalAmount) || 0)
      );
    }
    const aId = a.querySelector(".booking-id h3")?.textContent || "";
    const bId = b.querySelector(".booking-id h3")?.textContent || "";
    if (sortValue === "Ascending") return aId.localeCompare(bId);
    return bId.localeCompare(aId);
  });

  cards.forEach((c) => container.appendChild(c));
}
