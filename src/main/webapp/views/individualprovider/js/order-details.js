// order-details.js (API-connected)

document.addEventListener("DOMContentLoaded", () => {
  initializeOrderDetails();
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

function initializeOrderDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get("id");

  if (!bookingId) {
    document.getElementById("orderTitle").textContent = "Order Not Found";
    return;
  }

  loadOrderFromApi(bookingId);
}

async function loadOrderFromApi(bookingId) {
  try {
    const data = await fetchJson(
      `${API_BASE}/api/provider/bookings/${encodeURIComponent(bookingId)}`,
    );
    populateOrderData(data);
  } catch (err) {
    console.error(err);
    document.getElementById("orderTitle").textContent = "Order Not Found";
    alert(err.message);
  }
}

function populateOrderData(order) {
  document.getElementById("orderIdDisplay").textContent =
    `Booking ID: ${order.displayId || "BK" + order.bookingId}`;
  updateStatusBadge(order.status);

  // Customer
  const c = order.customer || {};
  document.getElementById("customerName").textContent = c.name || "N/A";
  document.getElementById("customerEmail").textContent = c.email || "N/A";
  document.getElementById("customerPhone").textContent = c.phone || "N/A";

  // Prefer NIC/Passport based on type, but show license as well
  const license =
    c.customerType === "FOREIGN"
      ? c.internationalDriversLicenseNumber || c.driversLicenseNumber || "N/A"
      : c.driversLicenseNumber || "N/A";
  document.getElementById("customerLicense").textContent = license;

  document.getElementById("customerAvatar").textContent = initials(
    c.name || "NA",
  );

  // Vehicle
  const v = order.vehicle || {};
  document.getElementById("vehicleName").textContent = v.name || "N/A";
  document.getElementById("vehiclePlate").textContent = v.plate || "N/A";
  document.getElementById("vehicleType").textContent = v.type || "N/A";
  document.getElementById("vehicleColor").textContent = v.color || "N/A";
  document.getElementById("vehicleOdometer").textContent = v.odometer || "N/A";

  // Booking
  const b = order.booking || {};
  const start = b.tripStartDate || "N/A";
  const end = b.tripEndDate || "N/A";
  document.getElementById("bookingDuration").textContent = durationText(
    b.tripStartDate,
    b.tripEndDate,
  );

  document.getElementById("pickupDateTime").textContent =
    `${start}${b.startTime ? " at " + b.startTime : ""}`;
  document.getElementById("pickupLocation").textContent =
    b.pickupLocation || "N/A";

  document.getElementById("returnDateTime").textContent =
    `${end}${b.endTime ? " at " + b.endTime : ""}`;
  document.getElementById("returnLocation").textContent =
    b.dropLocation || "N/A";

  // Driver (optional)
  if (order.driver) {
    document.getElementById("driverSection").style.display = "block";
    document.getElementById("driverName").textContent =
      order.driver.name || "N/A";
    document.querySelector(".driver-license").textContent =
      `License: ${order.driver.licenseNumber || "N/A"}`;
    document.querySelector(".driver-contact span").textContent =
      `📞 ${order.driver.phone || "N/A"}`;
  } else {
    document.getElementById("driverSection").style.display = "none";
  }

  updateProgressTimeline(order.status);
}

// ---------- Status UI ----------
function updateStatusBadge(status) {
  const badge = document.getElementById("orderStatusBadge");
  badge.className = "order-status";

  switch ((status || "").toLowerCase()) {
    case "pickup-ready":
      badge.textContent = "Ready for Pickup";
      badge.classList.add("status-ongoing");
      break;
    case "in-progress":
      badge.textContent = "In Progress";
      badge.classList.add("status-ongoing");
      break;
    case "completed":
      badge.textContent = "Completed";
      badge.classList.add("status-completed");
      break;
    case "cancelled":
      badge.textContent = "Cancelled";
      badge.classList.add("status-inactive");
      break;
    case "accepted":
      badge.textContent = "Accepted";
      badge.classList.add("status-pending");
      break;
    default:
      badge.textContent = "Pending";
      badge.classList.add("status-pending");
  }
}

function updateProgressTimeline(status) {
  const steps = document.querySelectorAll(".progress-step");
  steps.forEach((step) => {
    step.classList.remove("completed", "active", "pending");
    step.classList.add("pending");
  });

  const st = (status || "").toLowerCase();

  const accepted = document.querySelector(`[data-step="accepted"]`);
  const paid = document.querySelector(`[data-step="paid"]`);
  const pickup = document.querySelector(`[data-step="pickup"]`);
  const dropoff = document.querySelector(`[data-step="dropoff"]`);

  if (accepted) accepted.classList.add("completed");

  // we don’t have a separate “paid” status; mark paid as completed if paymentStatus is paid (UI still ok)
  if (paid) paid.classList.add("completed");

  if (st === "accepted") {
    if (pickup) pickup.classList.add("pending");
    if (dropoff) dropoff.classList.add("pending");
    return;
  }

  if (st === "pickup-ready" || st === "in-progress") {
    if (pickup) pickup.classList.add("active");
    if (dropoff) dropoff.classList.add("pending");
    return;
  }

  if (st === "completed") {
    if (pickup) pickup.classList.add("completed");
    if (dropoff) dropoff.classList.add("completed");
    return;
  }
}

// ---------- Actions required by HTML buttons ----------
function goBack() {
  window.history.back();
}

function printOrder() {
  window.print();
}

function updateOrderStatus() {
  // open modal
  const m = document.getElementById("statusUpdateModal");
  if (m) m.classList.add("active");
}

function closeStatusModal() {
  const m = document.getElementById("statusUpdateModal");
  if (m) m.classList.remove("active");
}

async function confirmStatusUpdate() {
  const urlParams = new URLSearchParams(window.location.search);
  const bookingId = urlParams.get("id");
  const newStatus = document.getElementById("newStatus")?.value;

  if (!bookingId || !newStatus) return;

  try {
    await fetchJson(
      `${API_BASE}/api/provider/bookings/${encodeURIComponent(bookingId)}/status`,
      {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      },
    );

    closeStatusModal();
    await loadOrderFromApi(bookingId);
    alert("Status updated!");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

function markAsCompleted() {
  // quick action -> set status completed
  document.getElementById("newStatus").value = "completed";
  confirmStatusUpdate();
}

function contactCustomer() {
  alert("Contact feature can be wired to your chat/call module.");
}

function contactDriver() {
  alert("Contact driver feature can be wired to your chat/call module.");
}

function sendMessage() {
  alert("Message feature can be wired to your chat module.");
}

function reportIssue() {
  alert("Report issue can be wired to SupportTicket module.");
}

function viewVehicleDetails() {
  alert("Vehicle details page can be wired if you want.");
}

function downloadDocument() {
  alert("Document download endpoint not implemented here.");
}

// helpers
function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  const a = parts[0]?.[0] || "N";
  const b = parts[1]?.[0] || "A";
  return (a + b).toUpperCase();
}

function durationText(start, end) {
  if (!start || !end) return "N/A";
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1;
  return `${days} Days`;
}

// export globals for onclick handlers in HTML
window.goBack = goBack;
window.printOrder = printOrder;
window.updateOrderStatus = updateOrderStatus;
window.closeStatusModal = closeStatusModal;
window.confirmStatusUpdate = confirmStatusUpdate;
window.markAsCompleted = markAsCompleted;
window.contactCustomer = contactCustomer;
window.contactDriver = contactDriver;
window.sendMessage = sendMessage;
window.reportIssue = reportIssue;
window.viewVehicleDetails = viewVehicleDetails;
window.downloadDocument = downloadDocument;
