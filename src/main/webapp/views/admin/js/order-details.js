// order-details.js (API wired)
// Uses: GET /api/admin/customer-bookings/{customerId}/{bookingId}

let _currentOrder = null;

const RENTAL_COMPANY_FEE_RATE = 0.2;
const TAX_RATE = 0.03;

document.addEventListener("DOMContentLoaded", async () => {
  await loadOrderDetailsFromAPI();
  wireBackButton();
  wireModalClose();
});

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function apiBase() {
  return "/api/admin/customer-bookings";
}

async function loadOrderDetailsFromAPI() {
  const bookingId = getParam("id");
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

    _currentOrder = data;
    populateOrderDataFromAPI(data);
  } catch (e) {
    console.error(e);
    document.getElementById("orderTitle").textContent = "Order Not Found";
    document.getElementById("orderIdDisplay").textContent =
      "Failed to load order details.";
  }
}

function populateOrderDataFromAPI(order) {
  document.getElementById("orderIdDisplay").textContent =
    `Booking ID: ${order.bookingId || "—"}`;
  updateStatusBadge(order.status, order.paymentStatus);
  updatePaymentStatusBadge(order.paymentStatus);

  setText("customerName", order.customer?.name);
  setText("customerEmail", order.customer?.email);
  setText("customerPhone", order.customer?.phone);
  setText("customerLicense", order.customer?.license);

  const initials = initialsFromName(order.customer?.name || "");
  setText("customerAvatar", initials || "?");

  setText("vehicleName", order.vehicle?.name);
  setText("vehiclePlate", order.vehicle?.plate);
  setText("vehicleType", order.vehicle?.type);
  setText("vehicleColor", order.vehicle?.color);
  setText(
    "vehicleOdometer",
    order.vehicle?.odometer
      ? `${Number(order.vehicle.odometer).toLocaleString()} km`
      : null,
  );
  renderVehicleImage(order.vehicle);

  const pickupDT = formatDateTime(order.tripStartDate, order.startTime);
  const returnDT = formatDateTime(order.tripEndDate, order.endTime);

  setText(
    "bookingDuration",
    order.durationDays != null ? `${order.durationDays} Days` : null,
  );
  setText("pickupDateTime", pickupDT);
  setText("pickupLocation", order.pickupLocation);
  setText("returnDateTime", returnDT);
  setText("returnLocation", order.dropLocation);

  if (order.driver) {
    setText("driverName", order.driver.name);
    setHtmlQuery(
      ".driver-license",
      `<i class="fas fa-id-card"></i> License: ${escapeHtml(order.driver.license || "—")}`,
    );
    setHtmlQuery(".driver-rating", `<i class="fas fa-star"></i> — (— trips)`);
    setHtmlQuery(
      ".driver-contact span",
      `<i class="fas fa-phone"></i> ${escapeHtml(order.driver.phone || "—")}`,
    );
    const sec = document.getElementById("driverSection");
    if (sec) sec.style.display = "";
  } else {
    const sec = document.getElementById("driverSection");
    if (sec) sec.style.display = "none";
  }

  populatePayment(order);
  setText("companyName", order.company?.companyName);

  updateTimeline(order);
  updateSidebarTimeline(order);
  populateVehicleModal(order.vehicle);
}

function renderVehicleImage(vehicle) {
  const container = document.getElementById("vehicleImageContainer");
  if (!container) return;

  container.style.overflow = "hidden";

  if (vehicle?.imageUrl) {
    container.innerHTML = `
      <img
        src="${escapeHtml(vehicle.imageUrl)}"
        alt="${escapeHtml(vehicle.name || "Vehicle")}"
        style="width:100%;height:100%;object-fit:cover;border-radius:inherit;display:block;"
        onerror="this.remove(); this.parentElement.innerHTML='<div class=&quot;image-placeholder&quot;>Vehicle Photo</div>';"
      />
    `;
  } else {
    container.innerHTML = `<div class="image-placeholder">Vehicle Photo</div>`;
  }
}

function populateVehicleModal(vehicle) {
  setText("vehicleModalName", vehicle?.name);
  setText("vehicleModalBrand", vehicle?.brand);
  setText("vehicleModalModel", vehicle?.model);
  setText("vehicleModalPlate", vehicle?.plate);
  setText("vehicleModalColor", vehicle?.color);
  setText("vehicleModalFuel", vehicle?.fuelType);
  setText("vehicleModalTransmission", vehicle?.transmission);
  setText(
    "vehicleModalPassengers",
    vehicle?.passengers != null ? String(vehicle.passengers) : null,
  );
  setText(
    "vehicleModalEngineCapacity",
    vehicle?.engineCapacity != null ? `${vehicle.engineCapacity} cc` : null,
  );
  setText(
    "vehicleModalOdometer",
    vehicle?.odometer
      ? `${Number(vehicle.odometer).toLocaleString()} km`
      : null,
  );
  setText("vehicleModalPricePerDay", formatCurrency(vehicle?.pricePerDay));
  setText("vehicleModalLocation", vehicle?.location);
  setText("vehicleModalFeatures", vehicle?.features);
  setText("vehicleModalDescription", vehicle?.description);
  setText("vehicleModalType", vehicle?.type);

  const img = document.getElementById("vehicleModalImage");
  const placeholder = document.getElementById("vehicleModalImagePlaceholder");

  if (img && placeholder) {
    if (vehicle?.imageUrl) {
      img.src = vehicle.imageUrl;
      img.style.display = "block";
      placeholder.style.display = "none";
    } else {
      img.removeAttribute("src");
      img.style.display = "none";
      placeholder.style.display = "flex";
    }
  }
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value || "—";
}

function setHtmlQuery(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.innerHTML = value || "—";
}

function formatCurrency(value) {
  return value != null && !Number.isNaN(Number(value))
    ? `LKR ${Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : "—";
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function populatePayment(order) {
  const pricePerDay =
    order.vehicle?.pricePerDay != null
      ? Number(order.vehicle.pricePerDay)
      : null;
  const days = order.durationDays != null ? Number(order.durationDays) : null;
  const backendTotal =
    order.totalAmount != null ? Number(order.totalAmount) : null;

  let baseFare = null;

  if (pricePerDay != null && days != null) {
    baseFare = roundMoney(pricePerDay * days);
  } else if (backendTotal != null) {
    baseFare = roundMoney(backendTotal);
  }

  const rentalCompanyFee =
    baseFare != null ? roundMoney(baseFare * RENTAL_COMPANY_FEE_RATE) : null;

  const taxAmount = baseFare != null ? roundMoney(baseFare * TAX_RATE) : null;

  const finalTotal =
    baseFare != null
      ? roundMoney(baseFare + (rentalCompanyFee || 0) + (taxAmount || 0))
      : null;

  setText("baseFare", formatCurrency(baseFare));
  setText(
    "pricePerDay",
    pricePerDay != null ? `${formatCurrency(pricePerDay)} / day` : null,
  );
  setText("rentalCompanyFee", formatCurrency(rentalCompanyFee));
  setText("taxAmount", formatCurrency(taxAmount));
  setText("paymentTotal", formatCurrency(finalTotal));
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
  } else if (s === "cancelled") {
    badge.textContent = "Cancelled";
    badge.classList.add("status-cancelled");
  } else if (s === "in-progress" || s === "ongoing") {
    badge.textContent = "In Progress";
    badge.classList.add("status-ongoing");
  } else if (p === "paid") {
    badge.textContent = "Paid";
    badge.classList.add("status-ongoing");
  } else if (s === "accepted") {
    badge.textContent = "Accepted";
    badge.classList.add("status-ongoing");
  } else {
    badge.textContent = status || "Pending";
    badge.classList.add("status-ongoing");
  }
}

function updatePaymentStatusBadge(paymentStatus) {
  const badge = document.getElementById("paymentStatusBadge");
  if (!badge) return;

  const p = String(paymentStatus || "").toLowerCase();
  badge.className = "status-badge";

  if (p === "paid") {
    badge.textContent = "Paid";
    badge.classList.add("status-completed");
  } else if (p === "pending") {
    badge.textContent = "Pending";
    badge.classList.add("status-pending");
  } else if (p) {
    badge.textContent = titleCase(p);
    badge.classList.add("status-pending");
  } else {
    badge.textContent = "—";
  }
}

function updateTimeline(order) {
  const status = String(order.status || "").toLowerCase();
  const pay = String(order.paymentStatus || "").toLowerCase();
  const now = new Date();
  const started = order.tripStartDate && new Date(order.tripStartDate) <= now;
  const ended = order.tripEndDate && new Date(order.tripEndDate) <= now;

  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";
  const isPaid = pay === "paid";
  const isAccepted =
    status === "accepted" ||
    status === "in-progress" ||
    status === "ongoing" ||
    isCompleted;

  setStep("accepted", isAccepted || isCompleted, false);
  setStep("paid", isPaid || isCompleted, false);
  setStep(
    "pickup",
    (started && !isCancelled) || isCompleted,
    !isCompleted && started && !ended,
  );
  setStep("dropoff", isCompleted || ended, false);

  setText(
    "acceptedTime",
    order.bookedDate
      ? formatDateTime(order.bookedDate, null)
      : isAccepted
        ? "Confirmed"
        : "Pending",
  );
  setText(
    "paidTime",
    isPaid ? "Payment confirmed" : isCompleted ? "Paid" : "Pending",
  );
  setText(
    "pickupTime",
    order.tripStartDate
      ? formatDateTime(order.tripStartDate, order.startTime)
      : "Pending",
  );
  setText(
    "dropoffTime",
    order.tripEndDate
      ? formatDateTime(order.tripEndDate, order.endTime)
      : "Pending",
  );
}

function setStep(stepName, isCompleted, isActive) {
  const el = document.querySelector(`[data-step="${stepName}"]`);
  if (!el) return;
  el.classList.remove("completed", "active", "pending");

  const icon = el.querySelector(".step-icon");
  if (icon) {
    if (stepName === "accepted") {
      icon.innerHTML = `<i class="fas fa-circle-check"></i>`;
    } else if (stepName === "paid") {
      icon.innerHTML = `<i class="fas fa-credit-card"></i>`;
    } else if (stepName === "pickup") {
      icon.innerHTML = `<i class="fas fa-key"></i>`;
    } else if (stepName === "dropoff") {
      icon.innerHTML = `<i class="fas fa-flag-checkered"></i>`;
    }
  }

  if (isCompleted) {
    el.classList.add("completed");
  } else if (isActive) {
    el.classList.add("active");
  } else {
    el.classList.add("pending");
  }
}

function updateSidebarTimeline(order) {
  const list = document.querySelector(".timeline-list");
  if (!list) return;

  const status = String(order.status || "").toLowerCase();
  const pay = String(order.paymentStatus || "").toLowerCase();
  const isPaid = pay === "paid";
  const isAccepted = [
    "accepted",
    "in-progress",
    "ongoing",
    "completed",
  ].includes(status);
  const now = new Date();
  const tripStarted =
    order.tripStartDate && new Date(order.tripStartDate) <= now;
  const isCompleted = status === "completed";

  const items = [
    {
      title: "Booking Confirmed",
      time: order.bookedDate ? formatDateTime(order.bookedDate, null) : "—",
      desc: "Booking request accepted by admin",
      done: isAccepted,
      active: false,
    },
    {
      title: "Payment Processed",
      time: isPaid ? "Payment confirmed" : "Pending",
      desc:
        order.totalAmount != null
          ? `${formatCurrency(order.totalAmount)} booking amount received`
          : "Payment pending",
      done: isPaid || isCompleted,
      active: false,
    },
    {
      title: "Vehicle Prepared / Ready for Pickup",
      time: order.tripStartDate
        ? formatDateTime(order.tripStartDate, order.startTime)
        : "—",
      desc: `Pickup at ${order.pickupLocation || "—"}`,
      done: (tripStarted && !["cancelled"].includes(status)) || isCompleted,
      active: isPaid && !tripStarted && !isCompleted,
    },
    {
      title: "Customer Pickup",
      time: order.tripStartDate
        ? formatDateTime(order.tripStartDate, order.startTime)
        : "Scheduled",
      desc: "Customer collects vehicle",
      done: tripStarted || isCompleted,
      active: false,
    },
    {
      title: "Drop-off",
      time: order.tripEndDate
        ? formatDateTime(order.tripEndDate, order.endTime)
        : "Scheduled",
      desc: `Drop-off at ${order.dropLocation || "—"}`,
      done: isCompleted,
      active: tripStarted && !isCompleted,
    },
  ];

  list.innerHTML = items
    .map(
      (item) => `
    <div class="timeline-item ${item.active ? "active" : ""}">
      <div class="timeline-dot ${item.done ? "completed" : item.active ? "active" : "pending"}"></div>
      <div class="timeline-content">
        <div class="timeline-title">${escapeHtml(item.title)}</div>
        <div class="timeline-time">${escapeHtml(item.time)}</div>
        <div class="timeline-description">${escapeHtml(item.desc)}</div>
      </div>
    </div>
  `,
    )
    .join("");
}

function formatDateTime(dateStr, timeStr) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const date = d.toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return timeStr ? `${date} at ${timeStr}` : date;
  } catch {
    return String(dateStr);
  }
}

function initialsFromName(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

function titleCase(s) {
  return String(s)
    .split(/[\s_-]+/)
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : ""))
    .join(" ");
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function wireBackButton() {
  const btn = document.getElementById("backBtn");
  if (btn) btn.addEventListener("click", goBack);
}

function wireModalClose() {
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target !== overlay) return;
      if (overlay.id === "statusUpdateModal") closeStatusModal();
      if (overlay.id === "vehicleDetailsModal") closeVehicleDetailsModal();
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeStatusModal();
    closeVehicleDetailsModal();
  });
}

function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    const customerId = getParam("customerId");
    window.location.href = customerId
      ? `customer-view.html?customerId=${encodeURIComponent(customerId)}`
      : "customer-view.html";
  }
}

function printOrder() {
  window.print();
}

function updateOrderStatus() {
  const modal = document.getElementById("statusUpdateModal");
  if (modal) modal.style.display = "flex";
}

function closeStatusModal() {
  const modal = document.getElementById("statusUpdateModal");
  if (modal) modal.style.display = "none";
}

function confirmStatusUpdate() {
  const newStatus = document.getElementById("newStatus")?.value;
  if (!newStatus) return;

  alert(
    `Status update to "${newStatus}" noted. Wire this to your status-update API endpoint.`,
  );
  closeStatusModal();
}

function contactCustomer() {
  const phone = _currentOrder?.customer?.phone;
  if (phone) {
    window.location.href = `tel:${phone}`;
  } else {
    alert("No phone number available for this customer.");
  }
}

function sendMessage() {
  const email = _currentOrder?.customer?.email;
  if (email) {
    window.location.href = `mailto:${email}`;
  } else {
    alert("No email address available for this customer.");
  }
}

function contactDriver() {
  const phone = _currentOrder?.driver?.phone;
  if (phone) {
    window.location.href = `tel:${phone}`;
  } else {
    alert("No phone number available for this driver.");
  }
}

function markAsCompleted() {
  if (
    confirm(
      "Mark this booking as Completed? This should be wired to your status-update API.",
    )
  ) {
    alert('Status update to "completed" noted. Wire to your API.');
  }
}

function reportIssue() {
  alert("Issue reporting — wire this to your support/ticketing system.");
}

function viewVehicleDetails() {
  if (!_currentOrder?.vehicle) {
    alert("Vehicle details are not available.");
    return;
  }
  populateVehicleModal(_currentOrder.vehicle);
  const modal = document.getElementById("vehicleDetailsModal");
  if (modal) modal.style.display = "flex";
}

function closeVehicleDetailsModal() {
  const modal = document.getElementById("vehicleDetailsModal");
  if (modal) modal.style.display = "none";
}

function downloadDocument(docType) {
  alert(
    `Document download for "${docType}" — wire this to your file-serving endpoint.`,
  );
}
