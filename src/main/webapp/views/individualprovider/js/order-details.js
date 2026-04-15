// order-details.js — Provider side
// API: GET /api/provider/bookings/{bookingId}
//      PUT /api/provider/bookings/{bookingId}/status

document.addEventListener("DOMContentLoaded", () => {
  initializeOrderDetails();
});

const API_BASE = window.API_BASE || "";
let CURRENT_ORDER = null;

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
  const bookingId = new URLSearchParams(window.location.search).get("id");
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
    CURRENT_ORDER = data;
    populateOrderData(data);
  } catch (err) {
    console.error(err);
    document.getElementById("orderTitle").textContent = "Order Not Found";
    document.getElementById("orderIdDisplay").textContent = err.message;
  }
}

function populateOrderData(order) {
  document.getElementById("orderIdDisplay").textContent =
    `Booking ID: ${order.displayId || "BK" + order.bookingId}`;
  updateStatusBadge(order.status);

  const c = order.customer || {};
  setText("customerName", c.name);
  setText("customerEmail", c.email);
  setText("customerPhone", c.phone);
  setText("customerAvatar", initials(c.name || "NA"));

  const license =
    c.customerType === "FOREIGN"
      ? c.internationalDriversLicenseNumber || c.driversLicenseNumber || "N/A"
      : c.driversLicenseNumber || "N/A";
  setText("customerLicense", license);

  const v = order.vehicle || {};
  setText("vehicleName", v.name);
  setText("vehiclePlate", v.plate);
  setText("vehicleType", v.type);
  setText("vehicleColor", v.color);
  setText(
    "vehicleOdometer",
    v.odometer ? `${Number(v.odometer).toLocaleString()} km` : "N/A",
  );
  renderVehicleImage(v);

  const b = order.booking || {};
  const start = b.tripStartDate || "N/A";
  const end = b.tripEndDate || "N/A";

  setText("bookingDuration", durationText(b.tripStartDate, b.tripEndDate));
  setText("pickupDateTime", formatDateTime(start, b.startTime));
  setText("pickupLocation", b.pickupLocation || "N/A");
  setText("returnDateTime", formatDateTime(end, b.endTime));
  setText("returnLocation", b.dropLocation || "N/A");

  if (b.dailyRate != null) {
    setText("dailyRate", `Rs ${Number(b.dailyRate).toLocaleString()}/day`);
  } else {
    setText("dailyRate", "N/A");
  }

  if (b.durationDays != null) {
    setText("paymentDuration", `${b.durationDays} days`);
  } else {
    setText("paymentDuration", "N/A");
  }

  if (b.baseAmount != null) {
    setText("baseAmount", `Rs ${Number(b.baseAmount).toLocaleString()}`);
  } else {
    setText("baseAmount", "N/A");
  }

  if (order.totalAmount != null) {
    setText("totalAmount", `Rs ${Number(order.totalAmount).toLocaleString()}`);
  } else {
    setText("totalAmount", "N/A");
  }

  setText("paymentStatusText", prettyPayment(order.paymentStatus));
  updatePaymentStatusBadge(order.paymentStatus);

  if (order.driver) {
    document.getElementById("driverSection").style.display = "block";
    setText("driverName", order.driver.name);
    setText("driverAvatar", initials(order.driver.name || "DR"));
    const lic = document.querySelector(".driver-license");
    if (lic)
      lic.textContent = `License: ${order.driver.licenseNumber || "N/A"}`;
    const contact = document.querySelector(".driver-contact span");
    if (contact)
      contact.innerHTML = `<i class="fas fa-phone"></i> ${escapeHtml(order.driver.phone || "N/A")}`;
  } else {
    document.getElementById("driverSection").style.display = "none";
  }

  updateProgressTimeline(order.status);
  buildOrderTimeline(order);
  renderDocuments(order.documents || [], v);
  populateVehicleModal(v, order.documents || []);
}

function updateStatusBadge(status) {
  const badge = document.getElementById("orderStatusBadge");
  if (!badge) return;
  badge.className = "order-status";

  const st = (status || "").toLowerCase();
  if (st === "pickup-ready") {
    badge.textContent = "Ready for Pickup";
    badge.classList.add("pickup-ready");
  } else if (st === "in-progress") {
    badge.textContent = "In Progress";
    badge.classList.add("in-progress");
  } else if (st === "completed") {
    badge.textContent = "Completed";
    badge.classList.add("completed");
  } else if (st === "cancelled") {
    badge.textContent = "Cancelled";
    badge.classList.add("cancelled");
  } else if (st === "accepted") {
    badge.textContent = "Accepted";
    badge.classList.add("accepted");
  } else {
    badge.textContent = "Pending";
    badge.classList.add("status-pending");
  }
}

function updatePaymentStatusBadge(paymentStatus) {
  const badge = document.getElementById("paymentStatusBadge");
  if (!badge) return;
  badge.className = "order-status";
  const ps = (paymentStatus || "").toLowerCase();
  if (ps === "paid") {
    badge.textContent = "Paid";
    badge.classList.add("completed");
  } else if (ps === "pending") {
    badge.textContent = "Pending";
    badge.classList.add("status-pending");
  } else {
    badge.textContent = paymentStatus || "—";
    badge.classList.add("status-pending");
  }
}

function updateProgressTimeline(status) {
  const steps = document.querySelectorAll(".progress-step");
  steps.forEach((s) => {
    s.classList.remove("completed", "active", "pending");
    s.classList.add("pending");
  });

  const st = (status || "").toLowerCase();
  const accepted = document.querySelector(`[data-step="accepted"]`);
  const paid = document.querySelector(`[data-step="paid"]`);
  const pickup = document.querySelector(`[data-step="pickup"]`);
  const dropoff = document.querySelector(`[data-step="dropoff"]`);

  if (accepted) accepted.classList.replace("pending", "completed");
  if (paid) paid.classList.replace("pending", "completed");

  if (st === "accepted") {
  } else if (st === "pickup-ready") {
    if (pickup) pickup.classList.replace("pending", "active");
  } else if (st === "in-progress") {
    if (pickup) pickup.classList.replace("pending", "active");
  } else if (st === "completed") {
    if (pickup) pickup.classList.replace("pending", "completed");
    if (dropoff) dropoff.classList.replace("pending", "completed");
  }
}

function buildOrderTimeline(order) {
  const container = document.getElementById("orderTimeline");
  if (!container) return;

  const status = (order.status || "").toLowerCase();
  const events = [];

  events.push({
    title: "Booking Confirmed",
    time: order.createdAt ? formatDateTime(order.createdAt) : "—",
    description: "Booking request accepted",
    type: "completed",
  });

  if (order.paymentStatus?.toLowerCase() === "paid") {
    events.push({
      title: "Payment Confirmed",
      time: "—",
      description: `Payment received`,
      type: "completed",
    });
  }

  if (
    status === "pickup-ready" ||
    status === "in-progress" ||
    status === "completed"
  ) {
    events.push({
      title: "Vehicle Ready",
      time: "—",
      description: "Vehicle prepared for customer pickup",
      type: status === "completed" ? "completed" : "active",
    });
  }

  if (status === "completed") {
    events.push({
      title: "Trip Completed",
      time: order.booking?.tripEndDate
        ? formatDateTime(order.booking.tripEndDate)
        : "—",
      description: "Vehicle successfully returned",
      type: "completed",
    });
  } else {
    events.push({
      title: "Awaiting Completion",
      time: order.booking?.tripEndDate
        ? `Expected ${formatDateShort(order.booking.tripEndDate)}`
        : "—",
      description: "Trip still in progress",
      type: "pending",
    });
  }

  container.innerHTML = events
    .map(
      (e) => `
    <div class="timeline-item ${e.type === "active" ? "active" : ""}">
      <div class="timeline-dot ${e.type}"></div>
      <div class="timeline-content">
        <div class="timeline-title">${escapeHtml(e.title)}</div>
        <div class="timeline-time">${escapeHtml(e.time)}</div>
        <div class="timeline-description">${escapeHtml(e.description)}</div>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderVehicleImage(vehicle) {
  const wrap = document.getElementById("vehicleImageWrap");
  if (!wrap) return;

  if (vehicle?.imageUrl) {
    wrap.innerHTML = `<img
      src="${escapeHtml(vehicle.imageUrl)}"
      alt="${escapeHtml(vehicle.name || "Vehicle")}"
      class="vehicle-main-image"
      onerror="this.onerror=null;this.parentElement.innerHTML='<span class=&quot;vehicle-icon&quot;><i class=&quot;fas fa-car-side&quot;></i></span><div class=&quot;image-placeholder&quot;>Vehicle Photo</div>';"
    />`;
  } else {
    wrap.innerHTML = `<span class="vehicle-icon"><i class="fas fa-car-side"></i></span>
      <div class="image-placeholder">Vehicle Photo</div>`;
  }
}

function renderDocuments(documents, vehicle) {
  const list = document.getElementById("documentsList");
  if (!list) return;

  const items = Array.isArray(documents) ? [...documents] : [];

  if (
    vehicle?.registrationDocumentUrl &&
    !items.some((d) => d.key === "vehicle-registration")
  ) {
    items.unshift({
      key: "vehicle-registration",
      name: "Vehicle Registration Document",
      type: "document",
      url: vehicle.registrationDocumentUrl,
    });
  }

  if (vehicle?.imageUrl && !items.some((d) => d.key === "vehicle-image")) {
    items.push({
      key: "vehicle-image",
      name: "Vehicle Image",
      type: "image",
      url: vehicle.imageUrl,
    });
  }

  if (!items.length) {
    list.innerHTML = `
      <div class="document-item">
        <div class="doc-icon"><i class="fas fa-folder-open"></i></div>
        <div class="doc-info">
          <div class="doc-name">No documents available</div>
          <div class="doc-size">—</div>
        </div>
      </div>
    `;
    return;
  }

  list.innerHTML = items
    .map((doc) => {
      const isImage = doc.type === "image";
      const icon = isImage ? "fa-image" : "fa-file-contract";
      const typeLabel = isImage ? "Image" : "Document";
      return `
        <div class="document-item">
          <div class="doc-icon">
            <i class="fas ${icon}" style="color: var(--primary-light); font-size: 18px"></i>
          </div>
          <div class="doc-info">
            <div class="doc-name">${escapeHtml(doc.name || "Document")}</div>
            <div class="doc-size">${typeLabel}</div>
          </div>
          <button
            class="btn btn-sm btn-secondary"
            type="button"
            onclick="openDocument('${escapeJs(doc.url || "")}')"
          >
            <i class="fas fa-eye"></i>
          </button>
        </div>
      `;
    })
    .join("");
}

function populateVehicleModal(vehicle, documents) {
  setText("modalVehicleName", vehicle?.name || "Vehicle");
  setText("modalVehicleBrand", vehicle?.brand || "N/A");
  setText("modalVehicleModel", vehicle?.model || "N/A");
  setText("modalVehiclePlate", vehicle?.plate || "N/A");
  setText("modalVehicleType", vehicle?.type || "N/A");
  setText("modalVehicleColor", vehicle?.color || "N/A");
  setText("modalVehicleFuel", vehicle?.fuelType || "N/A");
  setText("modalVehicleTransmission", vehicle?.transmission || "N/A");
  setText(
    "modalVehicleYear",
    vehicle?.manufactureYear != null ? String(vehicle.manufactureYear) : "N/A",
  );
  setText("modalVehicleLocation", vehicle?.location || "N/A");
  setText(
    "modalVehiclePrice",
    vehicle?.pricePerDay != null
      ? `Rs ${Number(vehicle.pricePerDay).toLocaleString()}/day`
      : "N/A",
  );
  setText(
    "modalVehicleOdometer",
    vehicle?.odometer
      ? `${Number(vehicle.odometer).toLocaleString()} km`
      : "N/A",
  );
  setText(
    "modalVehicleDescription",
    vehicle?.description || "No description available.",
  );
  setText("modalVehicleFeatures", vehicle?.features || "No features listed.");

  const imageWrap = document.getElementById("vehicleModalImageWrap");
  if (imageWrap) {
    if (vehicle?.imageUrl) {
      imageWrap.innerHTML = `<img
        src="${escapeHtml(vehicle.imageUrl)}"
        alt="${escapeHtml(vehicle.name || "Vehicle")}"
        class="vehicle-modal-image"
        onerror="this.onerror=null;this.parentElement.innerHTML='<span class=&quot;vehicle-icon&quot;><i class=&quot;fas fa-car-side&quot;></i></span><div class=&quot;image-placeholder&quot;>Vehicle Photo</div>';"
      />`;
    } else {
      imageWrap.innerHTML = `<span class="vehicle-icon"><i class="fas fa-car-side"></i></span>
        <div class="image-placeholder">Vehicle Photo</div>`;
    }
  }

  const docWrap = document.getElementById("vehicleModalDocuments");
  if (!docWrap) return;

  const items = Array.isArray(documents) ? [...documents] : [];
  if (
    vehicle?.registrationDocumentUrl &&
    !items.some((d) => d.key === "vehicle-registration")
  ) {
    items.unshift({
      key: "vehicle-registration",
      name: "Vehicle Registration Document",
      type: "document",
      url: vehicle.registrationDocumentUrl,
    });
  }

  docWrap.innerHTML = items.length
    ? items
        .filter((d) => d.type !== "image")
        .map(
          (doc) => `
        <div class="document-item">
          <div class="doc-icon">
            <i class="fas fa-file-contract" style="color: var(--primary-light); font-size: 18px"></i>
          </div>
          <div class="doc-info">
            <div class="doc-name">${escapeHtml(doc.name || "Document")}</div>
            <div class="doc-size">Legal Document</div>
          </div>
          <button
            class="btn btn-sm btn-secondary"
            type="button"
            onclick="openDocument('${escapeJs(doc.url || "")}')"
          >
            <i class="fas fa-eye"></i>
          </button>
        </div>
      `,
        )
        .join("")
    : `
      <div class="document-item">
        <div class="doc-icon"><i class="fas fa-folder-open"></i></div>
        <div class="doc-info">
          <div class="doc-name">No legal documents available</div>
          <div class="doc-size">—</div>
        </div>
      </div>
    `;
}

function goBack() {
  window.history.back();
}
function printOrder() {
  window.print();
}

function updateOrderStatus() {
  const m = document.getElementById("statusUpdateModal");
  if (m) m.classList.add("active");
}

function closeStatusModal() {
  const m = document.getElementById("statusUpdateModal");
  if (m) m.classList.remove("active");
}

async function confirmStatusUpdate() {
  const bookingId = new URLSearchParams(window.location.search).get("id");
  const newStatus = document.getElementById("newStatus")?.value;
  if (!bookingId || !newStatus) return;

  try {
    await fetchJson(
      `${API_BASE}/api/provider/bookings/${encodeURIComponent(bookingId)}/status`,
      { method: "PUT", body: JSON.stringify({ status: newStatus }) },
    );
    closeStatusModal();
    await loadOrderFromApi(bookingId);
    alert("Status updated successfully!");
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
}

function markAsCompleted() {
  const sel = document.getElementById("newStatus");
  if (sel) sel.value = "completed";
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
  alert("Report issue can be wired to your Support module.");
}
function viewVehicleDetails() {
  const modal = document.getElementById("vehicleDetailsModal");
  if (modal) modal.classList.add("active");
}
function closeVehicleModal() {
  const modal = document.getElementById("vehicleDetailsModal");
  if (modal) modal.classList.remove("active");
}
function openDocument(url) {
  if (!url) {
    alert("Document not available.");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
function downloadDocument(type) {
  if (!CURRENT_ORDER) {
    alert("Order data not loaded yet.");
    return;
  }

  const vehicle = CURRENT_ORDER.vehicle || {};
  const documents = CURRENT_ORDER.documents || [];

  if (type === "vehicle-registration") {
    const url =
      documents.find((d) => d.key === "vehicle-registration")?.url ||
      vehicle.registrationDocumentUrl;
    openDocument(url);
    return;
  }

  if (type === "vehicle-image") {
    openDocument(vehicle.imageUrl);
    return;
  }

  alert("Document not available.");
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || "—";
}

function initials(name) {
  const parts = String(name).trim().split(/\s+/);
  return ((parts[0]?.[0] || "N") + (parts[1]?.[0] || "A")).toUpperCase();
}

function durationText(start, end) {
  if (!start || !end) return "—";
  const days =
    Math.round((new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24)) + 1;
  return `${days} Days`;
}

function formatDateTime(dateStr, timeStr) {
  if (!dateStr || dateStr === "N/A") return "—";
  try {
    const d = new Date(dateStr);
    const date = d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    return timeStr ? `${date} at ${timeStr}` : date;
  } catch {
    return dateStr;
  }
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

function prettyPayment(ps) {
  const v = (ps || "").toLowerCase();
  if (v === "paid") return "Paid";
  if (v === "pending") return "Pending";
  return ps || "—";
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJs(str) {
  return String(str ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"');
}

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
window.closeVehicleModal = closeVehicleModal;
window.openDocument = openDocument;
window.downloadDocument = downloadDocument;
