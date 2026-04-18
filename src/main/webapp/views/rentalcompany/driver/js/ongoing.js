// Global variables
let allBookings = [];
let currentFilter = "all";
let currentBookingDetails = null;

// Initialize page on load
document.addEventListener("DOMContentLoaded", async function () {
  await initializePage();
});

// Initialize all page functionality
async function initializePage() {
  setupEventListeners();
  await loadBookings();
}

// Setup all event listeners
function setupEventListeners() {
  // Sidebar toggle
  document
    .getElementById("sidebarToggle")
    .addEventListener("click", function () {
      document.getElementById("sidebar").classList.toggle("active");
    });

  // Filter buttons
  document
    .querySelectorAll(".filter-btn:not(.vehicle-issues-btn)")
    .forEach((btn) => {
      btn.addEventListener("click", function () {
        document
          .querySelectorAll(".filter-btn:not(.vehicle-issues-btn)")
          .forEach((b) => b.classList.remove("active"));
        this.classList.add("active");
        currentFilter = this.dataset.filter;
        filterBookings();
      });
    });

  // Sort dropdown
  document
    .getElementById("sortBookings")
    .addEventListener("change", function () {
      sortBookings(this.value);
    });

  // Tab switching in modal
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const tab = this.dataset.tab;
      document
        .querySelectorAll(".tab-btn")
        .forEach((b) => b.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));
      this.classList.add("active");
      document.getElementById(tab).classList.add("active");
    });
  });

  // Logout functionality
  document.querySelector(".logout").addEventListener("click", function () {
    if (confirm("Are you sure you want to logout?")) {
      this.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i><span>Logging out...</span>';
      setTimeout(() => {
        window.location.href = "http://localhost:8080/views/landing/index.html";
      }, 1000);
    }
  });

  // Close modal on outside click
  window.addEventListener("click", function (event) {
    const modal = document.getElementById("bookingDetailsModal");
    if (event.target === modal) {
      closeModal();
    }
  });
}

// Load bookings from backend
async function loadBookings() {
  const loadingSpinner = document.getElementById("loadingSpinner");
  const emptyState = document.getElementById("emptyState");
  const bookingsGrid = document.getElementById("bookingsGrid");

  // Show loading
  loadingSpinner.style.display = "block";
  emptyState.style.display = "none";
  bookingsGrid.style.display = "none";

  try {
    const response = await fetch("/driver/ongoing", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (response.status === 401) {
      const modal = document.getElementById("loginModal");
      modal.style.display = "flex";

      document.getElementById("loginOkBtn").onclick = () => {
        window.location.href = "/views/landing/driverlogin.html";
      };

      return;
    }

    if (!response.ok) {
      console.log("HTTP status:", response.status, response.statusText);
      const text = await response.text(); // read raw body
      console.log("Response body:", text);
      throw new Error("Failed to fetch bookings");
    }

    const data = await response.json();
    console.log(data);

    if (data.success) {
      allBookings = data.bookings || [];

      const stats = data.stats || {
        totalActive: 0,
        inProgress: 0,
        upcoming: 0,
      };
      updateStats(stats);
      renderBookings();
    } else {
      throw new Error(data.error || "Unknown error");
    }
  } catch (error) {
    console.error("Error loading bookings:", error);
    alert("Failed to load bookings. Please try again.");
    showEmptyState();
  } finally {
    loadingSpinner.style.display = "none";
  }
}

// Update statistics
function updateStats(stats) {
  document.getElementById("totalActive").textContent = stats.totalActive || 0;
  document.getElementById("inProgressCount").textContent =
    stats.inProgress || 0;
  document.getElementById("upcomingCount").textContent = stats.upcoming || 0;
}

// Render bookings on the page
function renderBookings() {
  const bookingsGrid = document.getElementById("bookingsGrid");
  const emptyState = document.getElementById("emptyState");

  if (allBookings.length === 0) {
    showEmptyState();
    return;
  }

  bookingsGrid.innerHTML = "";
  bookingsGrid.style.display = "grid";
  emptyState.style.display = "none";

  allBookings.forEach((booking) => {
    const card = createBookingCard(booking);
    bookingsGrid.appendChild(card);
  });

  // Apply current filter
  filterBookings();
}

// Create a booking card element
function createBookingCard(booking) {
  const card = document.createElement("div");
  card.className = `booking-card ${booking.status}`;
  card.dataset.status = booking.status;
  card.dataset.time = booking.bookingTime || "";
  card.dataset.fare = booking.totalAmount || 0;

  // Format date safely
  const bookingDate = booking.startdate
    ? new Date(booking.startdate)
    : new Date();
  const formattedDate = formatDate(bookingDate);

  // Format time safely
  const formattedTime = formatTime(booking.time);

  // Status badge
  const statusBadge = getStatusBadge(booking.status);

  card.innerHTML = `
        <div class="booking-header">
            <div class="booking-id">#${booking.rideId}</div>
            ${statusBadge}
        </div>

        <div class="booking-time">
            <div class="date">${formattedDate}</div>
            <div class="time">${formattedTime}</div>
        </div>

        <div class="booking-route">
            <div class="route-item pickup">
                <i class="fas fa-map-marker-alt"></i>
                <span>${booking.pickup || "N/A"}</span>
            </div>
            <div class="route-divider">
                <i class="fas fa-arrow-down"></i>
            </div>
            <div class="route-item dropoff">
                <i class="fas fa-map-marker-alt"></i>
                <span>${booking.dropOff || "N/A"}</span>
            </div>
        </div>

        <div class="booking-info">
            <div class="info-item">
                <i class="fas fa-user"></i>
                <span>${booking.customerName || "N/A"}</span>
            </div>

            <div class="info-item">
                <i class="fas fa-car"></i>
                <span>${booking.vehicleModel || "N/A"} - ${booking.vehiclePlate || "N/A"}</span>
            </div>

            <div class="info-item">
                <i class="fas fa-clock"></i>
                <span>${booking.estimatedDuration || 0} mins</span>
            </div>

            <div class="info-item">
                <i class="fas fa-dollar-sign"></i>
                <span>LKR ${Number(booking.totalAmount || 0).toFixed(2)}</span>
            </div>
        </div>

        <div class="booking-actions">
            <button class="btn btn-outline" onclick="showBookingDetails('${booking.rideId}')">
                <i class="fas fa-info-circle"></i>
                Details
            </button>
            ${getActionButton(booking)}
        </div>
    `;

  return card;
}

function getActionButton(booking) {
  const canStart = canStartRide(booking.startdate, booking.time);

  // upcoming but NOT yet allowed → NO BUTTON
  if (booking.status === "upcoming") {
    if (!canStart) {
      return ""; // ✅ nothing shown
    }

    return `
            <button class="btn btn-primary" onclick="startRide('${booking.rideId}')">
                <i class="fas fa-play"></i> Start Ride
            </button>
        `;
  }

  // in progress → always show complete button
  if (booking.status === "in-progress") {
    return `
            <button class="btn btn-primary" onclick="completeRide('${booking.rideId}')">
                <i class="fas fa-check"></i> Complete Ride
            </button>
        `;
  }

  return "";
}

// Start ride
async function startRide(rideId) {
  const booking = allBookings.find((b) => b.rideId === rideId);
  if (!booking) return;

  const canStart = canStartRide(booking.startdate, booking.time);

  if (!canStart) {
    showNotification("You cannot start this ride yet!", "error");
    return; // ❌ STOP HERE
  }

  if (!confirm("Are you sure you want to start this ride?")) return;

  const btn = event.target;
  const originalContent = btn.innerHTML;

  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';
  btn.disabled = true;

  try {
    const response = await fetch("/driver/ongoing", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
      body: `action=updateStatus&rideId=${rideId}&status=in-progress`,
    });

    const data = await response.json();

    if (data.success) {
      btn.innerHTML = '<i class="fas fa-check"></i> Started';
      btn.className = "btn btn-primary";

      setTimeout(() => {
        loadBookings(); // Reload bookings
      }, 1500);
    } else {
      throw new Error(data.error || "Failed to start ride");
    }
  } catch (error) {
    console.error("Error starting ride:", error);
    alert("Failed to start ride: " + error.message);
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

function canStartRide(bookingDate, bookingTime) {
  if (!bookingDate || !bookingTime) return false;

  const bookingDateTime = new Date(`${bookingDate}T${bookingTime}`);
  return Date.now() >= bookingDateTime.getTime();
}

// Get status badge HTML
function getStatusBadge(status) {
  const badges = {
    "in-progress":
      '<div class="status-badge in-progress"><i class="fas fa-road"></i> In Progress</div>',
    upcoming:
      '<div class="status-badge upcoming"><i class="fas fa-clock"></i> Upcoming</div>',
    confirmed:
      '<div class="status-badge confirmed"><i class="fas fa-check"></i> Confirmed</div>',
  };
  return badges[status] || badges["upcoming"];
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");

  notification.textContent = message;

  // basic styling
  notification.style.position = "fixed";
  notification.style.top = "20px";
  notification.style.right = "20px";
  notification.style.padding = "12px 18px";
  notification.style.borderRadius = "8px";
  notification.style.color = "#fff";
  notification.style.fontSize = "14px";
  notification.style.zIndex = "9999";
  notification.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  notification.style.transition = "0.3s ease";

  // color based on type
  if (type === "success") {
    notification.style.background = "#28a745";
  } else if (type === "error") {
    notification.style.background = "#dc3545";
  } else if (type === "info") {
    notification.style.background = "#17a2b8";
  } else {
    notification.style.background = "#333";
  }

  document.body.appendChild(notification);

  // auto remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Format date
function formatDate(date) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === tomorrow.toDateString()) {
    return "Tomorrow";
  } else {
    const options = { month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  }
}

// Format time
function formatTime(timeString) {
  if (!timeString) return "N/A";

  // Handle different time formats
  if (timeString.length === 5) {
    // Already in HH:MM format
    return formatTo12Hour(timeString);
  } else if (timeString.length === 8) {
    // HH:MM:SS format
    return formatTo12Hour(timeString.substring(0, 5));
  }

  return timeString;
}

// Convert 24-hour time to 12-hour format
function formatTo12Hour(time24) {
  const [hours, minutes] = time24.split(":");
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

// Filter bookings based on selected filter
function filterBookings() {
  const cards = document.querySelectorAll(".booking-card");

  cards.forEach((card) => {
    if (currentFilter === "all" || card.dataset.status === currentFilter) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

// Sort bookings
function sortBookings(sortBy) {
  const grid = document.getElementById("bookingsGrid");
  const cards = Array.from(grid.children);

  cards.sort((a, b) => {
    if (sortBy === "time-asc") {
      return a.dataset.time.localeCompare(b.dataset.time);
    } else if (sortBy === "time-desc") {
      return b.dataset.time.localeCompare(a.dataset.time);
    } else if (sortBy === "fare") {
      return parseFloat(b.dataset.fare) - parseFloat(a.dataset.fare);
    } else if (sortBy === "status") {
      return a.dataset.status.localeCompare(b.dataset.status);
    }
    return 0;
  });

  cards.forEach((card) => grid.appendChild(card));
}

// Show booking details in modal
function showBookingDetails(rideId) {
  const booking = allBookings.find((b) => b.rideId === rideId);
  if (!booking) return;

  currentBookingDetails = booking;

  // Update modal content
  document.getElementById("modal-booking-id").textContent =
    "#" + booking.rideId;
  document.getElementById("modal-status").innerHTML = getStatusBadge(
    booking.status,
  ).replace("status-badge", "status-badge");
  document.getElementById("modal-datetime").textContent =
    `${formatDate(new Date(booking.bookingDate))} - ${formatTime(booking.bookingTime)}`;
  document.getElementById("modal-duration").textContent =
    booking.estimatedDuration + " minutes";
  document.getElementById("modal-fare").textContent =
    "LKR " + booking.totalAmount.toFixed(2);
  document.getElementById("modal-distance").textContent =
    booking.distance + " km";

  // Customer details
  document.getElementById("modal-customer-name").textContent =
    booking.customerName;
  document.getElementById("modal-customer-initial").textContent =
    booking.customerName.charAt(0).toUpperCase();
  document.getElementById("modal-customer-phone").textContent =
    booking.customerPhone || "N/A";
  document.getElementById("modal-customer-email").textContent =
    booking.customerEmail || "N/A";

  // Route details
  document.getElementById("modal-pickup").textContent = booking.pickupLocation;
  document.getElementById("modal-dropoff").textContent =
    booking.dropoffLocation;

  // Vehicle details
  document.getElementById("modal-vehicle-model").textContent =
    booking.vehicleModel;
  document.getElementById("modal-vehicle-plate").textContent =
    "License: " + booking.vehiclePlate;

  // Special instructions
  const instructionsContainer = document.getElementById("modal-instructions");
  if (
    booking.specialInstructions &&
    booking.specialInstructions.trim() !== ""
  ) {
    const instructions = booking.specialInstructions.split("\n");
    instructionsContainer.innerHTML = instructions
      .map(
        (inst) => `
            <div class="instruction-item">
                <i class="fas fa-info-circle"></i>
                <span>${inst}</span>
            </div>
        `,
      )
      .join("");
  } else {
    instructionsContainer.innerHTML =
      '<p style="color: var(--text-light);">No special instructions</p>';
  }

  // Update primary action button
  const primaryBtn = document.getElementById("primaryActionBtn");
  if (booking.status === "upcoming") {
    primaryBtn.innerHTML = '<i class="fas fa-play"></i> Start Ride';
    primaryBtn.onclick = () => startRideFromModal(booking.rideId);
  } else if (booking.status === "in-progress") {
    primaryBtn.innerHTML = '<i class="fas fa-check"></i> Complete Ride';
    primaryBtn.onclick = () => completeRideFromModal(booking.rideId);
  }

  // Show modal
  document.getElementById("bookingDetailsModal").classList.add("show");
}

// Close modal
function closeModal() {
  document.getElementById("bookingDetailsModal").classList.remove("show");
  currentBookingDetails = null;
}

// Start ride from modal
async function startRideFromModal(rideId) {
  closeModal();
  await startRide(rideId);
}

// Complete ride
async function completeRide(rideId) {
  if (!confirm("Are you sure you want to complete this ride?")) return;

  const btn = event.target;
  const originalContent = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Completing...';
  btn.disabled = true;

  try {
    const response = await fetch("/driver/ongoing", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      credentials: "include",
      body: `action=updateStatus&rideId=${rideId}&status=completed`,
    });

    const data = await response.json();

    if (data.success) {
      btn.innerHTML = '<i class="fas fa-check"></i> Completed';
      btn.style.backgroundColor = "#28a745";

      setTimeout(() => {
        const card = btn.closest(".booking-card");
        card.style.transform = "translateX(-100%)";
        card.style.opacity = "0";

        setTimeout(() => {
          loadBookings(); // Reload bookings
        }, 300);
      }, 1500);
    } else {
      throw new Error(data.error || "Failed to complete ride");
    }
  } catch (error) {
    console.error("Error completing ride:", error);
    alert("Failed to complete ride: " + error.message);
    btn.innerHTML = originalContent;
    btn.disabled = false;
  }
}

// Complete ride from modal
async function completeRideFromModal(rideId) {
  closeModal();
  await completeRide(rideId);
}

// Contact customer
function contactCustomer() {
  if (!currentBookingDetails) return;

  const phone = currentBookingDetails.customerPhone;
  if (phone) {
    window.location.href = `tel:${phone}`;
  } else {
    alert("Customer phone number not available");
  }
}

// Primary action (called from modal)
function primaryAction() {
  if (!currentBookingDetails) return;

  if (currentBookingDetails.status === "upcoming") {
    startRideFromModal(currentBookingDetails.rideId);
  } else if (currentBookingDetails.status === "in-progress") {
    completeRideFromModal(currentBookingDetails.rideId);
  }
}

// Navigate to issue reporting
function navigateToIssueReporting() {
  const btn = event.target.closest(".vehicle-issues-btn");
  const originalContent = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
  btn.disabled = true;

  setTimeout(() => {
    window.location.href = "issuereporting.html";
  }, 1000);
}

// Show empty state
function showEmptyState() {
  document.getElementById("emptyState").style.display = "block";
  document.getElementById("bookingsGrid").style.display = "none";
}
