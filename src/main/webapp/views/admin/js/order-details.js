// order-details.js (API wired)
// Uses: GET /api/admin/customer-bookings/{customerId}/{bookingId}

document.addEventListener("DOMContentLoaded", async () => {
  await loadOrderDetailsFromAPI();
  wireBackButton();
});

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function apiBase() {
  return "/api/admin/customer-bookings";
}

async function loadOrderDetailsFromAPI() {
  const bookingId = getParam("id"); // BK001 or 12
  const customerId = getParam("customerId");

  if (!bookingId || !customerId) {
    document.getElementById("orderTitle").textContent = "Order Not Found";
    document.getElementById("orderIdDisplay").textContent =
      "Missing bookingId/customerId";
    return;
  }

  try {
    const url = `${apiBase()}/${encodeURIComponent(customerId)}/${encodeURIComponent(bookingId)}`;
    const res = await fetch(url, { credentials: "include" });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};

    if (!res.ok) {
      document.getElementById("orderTitle").textContent = "Order Not Found";
      document.getElementById("orderIdDisplay").textContent =
        data.error || `HTTP ${res.status}`;
      return;
    }

    populateOrderDataFromAPI(data);
  } catch (e) {
    console.error(e);
    document.getElementById("orderTitle").textContent = "Order Not Found";
    document.getElementById("orderIdDisplay").textContent =
      "Failed to load order details.";
  }
}

function populateOrderDataFromAPI(order) {
  // Header
  document.getElementById("orderIdDisplay").textContent =
    `Booking ID: ${order.bookingId || "—"}`;

  // status badge
  updateStatusBadge(order.status, order.paymentStatus);

  // Customer
  document.getElementById("customerName").textContent =
    order.customer?.name || "—";
  document.getElementById("customerEmail").textContent =
    order.customer?.email || "—";
  document.getElementById("customerPhone").textContent =
    order.customer?.phone || "—";
  document.getElementById("customerLicense").textContent =
    order.customer?.license || "—";

  const initials = initialsFromName(order.customer?.name || "");
  document.getElementById("customerAvatar").textContent = initials || "—";

  // Vehicle
  document.getElementById("vehicleName").textContent =
    order.vehicle?.name || "—";
  document.getElementById("vehiclePlate").textContent =
    order.vehicle?.plate || "—";
  document.getElementById("vehicleType").textContent =
    order.vehicle?.type || "—";
  document.getElementById("vehicleColor").textContent =
    order.vehicle?.color || "—";
  document.getElementById("vehicleOdometer").textContent =
    order.vehicle?.odometer || "—";

  // Booking (dates/locations)
  const pickupDT = formatDateTime(order.tripStartDate, order.startTime);
  const returnDT = formatDateTime(order.tripEndDate, order.endTime);

  document.getElementById("bookingDuration").textContent =
    order.durationDays != null ? `${order.durationDays} Days` : "—";

  document.getElementById("pickupDateTime").textContent = pickupDT;
  document.getElementById("pickupLocation").textContent =
    order.pickupLocation || "—";

  document.getElementById("returnDateTime").textContent = returnDT;
  document.getElementById("returnLocation").textContent =
    order.dropLocation || "—";

  // Driver (optional)
  if (order.driver) {
    document.getElementById("driverName").textContent =
      order.driver.name || "—";
    document.querySelector(".driver-license").textContent =
      `License: ${order.driver.license || "—"}`;
    document.querySelector(".driver-rating").textContent = `★ — (— trips)`; // DB doesn't provide rating/trips
    document.querySelector(".driver-contact span").textContent =
      `📞 ${order.driver.phone || "—"}`;
    document.getElementById("driverSection").style.display = "";
  } else {
    document.getElementById("driverSection").style.display = "none";
  }

  // Payment / totals (if your HTML has these ids; if not, it safely does nothing)
  const total =
    order.totalAmount != null
      ? `LKR ${Number(order.totalAmount).toLocaleString()}`
      : "—";
  const elTotal = document.getElementById("paymentTotal");
  if (elTotal) elTotal.textContent = total;

  // Company (if present on page)
  const elCompany = document.getElementById("companyName");
  if (elCompany) elCompany.textContent = order.company?.companyName || "—";
}

function updateStatusBadge(status, paymentStatus) {
  const badge = document.getElementById("orderStatusBadge");
  if (!badge) return;

  badge.className = "order-status";

  const s = String(status || "").toLowerCase();
  const p = String(paymentStatus || "").toLowerCase();

  if (s === "completed") {
    badge.textContent = "Completed";
    badge.classList.add("status-completed");
    return;
  }
  if (s === "cancelled") {
    badge.textContent = "Cancelled";
    badge.classList.add("status-cancelled");
    return;
  }
  if (s === "in-progress" || s === "ongoing") {
    badge.textContent = "In Progress";
    badge.classList.add("status-ongoing");
    return;
  }
  if (p === "paid") {
    badge.textContent = "Paid";
    badge.classList.add("status-ongoing");
    return;
  }
  if (s === "accepted") {
    badge.textContent = "Accepted";
    badge.classList.add("status-ongoing");
    return;
  }

  badge.textContent = status || "Ongoing";
  badge.classList.add("status-ongoing");
}

function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const date = isNaN(d.getTime()) ? String(dateStr) : d.toDateString();
  return timeStr ? `${date} at ${timeStr}` : date;
}

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

function wireBackButton() {
  const btn = document.getElementById("backBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    // go back to iframe list (browser history works best)
    window.history.back();
  });
}

function goBack() {
  window.history.back();
}
