// Order Details JavaScript
document.addEventListener("DOMContentLoaded", function () {
  initializeOrderDetails();
  loadOrderData();
  initializeActions();
  updateTimestamps();
});

// Initialize order details page
function initializeOrderDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get("id") || "BK001";

  loadOrderFromStorage(orderId);
  startRealTimeUpdates();
}

// Load order data
function loadOrderData() {
  console.log("Loading order data...");
}

// Load order from storage or URL
function loadOrderFromStorage(orderId) {
  // Expanded order dataset
  const orderData = {
    BK001: {
      id: "BK001",
      customer: {
        name: "John Smith",
        email: "john.smith@email.com",
        phone: "+94 77 123 4567",
        license: "B1234567",
        avatar: "JS",
        rating: 4.8,
        rides: 23,
      },
      vehicle: {
        name: "Toyota Camry 2023",
        plate: "CAB-1234",
        type: "Sedan",
        color: "Silver",
        odometer: "45,230 km",
      },
      booking: {
        duration: "3 Days",
        pickupDateTime: "Dec 15, 2024 at 10:00 AM",
        pickupLocation: "Bandaranaike International Airport",
        returnDateTime: "Dec 18, 2024 at 6:00 PM",
        returnLocation: "Bandaranaike International Airport",
      },
      driver: {
        name: "Michael Johnson",
        license: "D7890123",
        phone: "+94 71 234 5678",
        rating: 4.9,
        trips: 156,
      },
      status: "pickup-ready",
      payment: {
        total: 23000,
        earnings: 20240,
        method: "Visa ending in 4567",
        transactionId: "TXN-20241215-001",
      },
    },
    BK002: {
      id: "BK002",
      customer: {
        name: "Sarah Wilson",
        email: "sarah.wilson@email.com",
        phone: "+94 76 987 6543",
        license: "B9876543",
        avatar: "SW",
        rating: 4.6,
        rides: 15,
      },
      vehicle: {
        name: "Honda Civic 2022",
        plate: "XYZ-5678",
        type: "Sedan",
        color: "White",
        odometer: "32,150 km",
      },
      booking: {
        duration: "5 Days",
        pickupDateTime: "Dec 16, 2024 at 2:00 PM",
        pickupLocation: "Galle Face Hotel",
        returnDateTime: "Dec 21, 2024 at 5:00 PM",
        returnLocation: "Galle Face Hotel",
      },
      driver: null, // no driver assigned
      status: "in-progress",
      payment: {
        total: 28000,
        earnings: 23800,
        method: "MasterCard ending in 1234",
        transactionId: "TXN-20241216-002",
      },
    },
    BK003: {
      id: "BK003",
      customer: {
        name: "David Brown",
        email: "david.brown@email.com",
        phone: "+94 72 555 6789",
        license: "B5556789",
        avatar: "DB",
        rating: 4.7,
        rides: 19,
      },
      vehicle: {
        name: "BMW X5 2023",
        plate: "BXX-9090",
        type: "SUV",
        color: "Black",
        odometer: "28,900 km",
      },
      booking: {
        duration: "2 Days",
        pickupDateTime: "Dec 17, 2024 at 9:00 AM",
        pickupLocation: "Galle City Center",
        returnDateTime: "Dec 19, 2024 at 6:00 PM",
        returnLocation: "Galle City Center",
      },
      driver: {
        name: "Alex Fernando",
        license: "D3332211",
        phone: "+94 70 987 6543",
        rating: 4.5,
        trips: 98,
      },
      status: "accepted",
      payment: {
        total: 18000,
        earnings: 16200,
        method: "Amex ending in 7890",
        transactionId: "TXN-20241217-003",
      },
    },
  };

  const order = orderData[orderId];
  if (order) {
    populateOrderData(order);
  } else {
    console.error("No order data found for ID:", orderId);
    document.getElementById("orderTitle").textContent = "Order Not Found";
  }
}

// Populate order data in the UI
function populateOrderData(order) {
  document.getElementById(
    "orderIdDisplay"
  ).textContent = `Booking ID: ${order.id}`;
  updateStatusBadge(order.status);

  document.getElementById("customerName").textContent = order.customer.name;
  document.getElementById("customerEmail").textContent = order.customer.email;
  document.getElementById("customerPhone").textContent = order.customer.phone;
  document.getElementById("customerLicense").textContent =
    order.customer.license;
  document.getElementById("customerAvatar").textContent = order.customer.avatar;

  document.getElementById("vehicleName").textContent = order.vehicle.name;
  document.getElementById("vehiclePlate").textContent = order.vehicle.plate;
  document.getElementById("vehicleType").textContent = order.vehicle.type;
  document.getElementById("vehicleColor").textContent = order.vehicle.color;
  document.getElementById("vehicleOdometer").textContent =
    order.vehicle.odometer;

  document.getElementById("bookingDuration").textContent =
    order.booking.duration;
  document.getElementById("pickupDateTime").textContent =
    order.booking.pickupDateTime;
  document.getElementById("pickupLocation").textContent =
    order.booking.pickupLocation;
  document.getElementById("returnDateTime").textContent =
    order.booking.returnDateTime;
  document.getElementById("returnLocation").textContent =
    order.booking.returnLocation;

  if (order.driver) {
    document.getElementById("driverName").textContent = order.driver.name;
    document.querySelector(
      ".driver-license"
    ).textContent = `License: ${order.driver.license}`;
    document.querySelector(
      ".driver-rating"
    ).textContent = `★ ${order.driver.rating} (${order.driver.trips} trips)`;
    document.querySelector(
      ".driver-contact span"
    ).textContent = `📞 ${order.driver.phone}`;
  } else {
    document.getElementById("driverSection").style.display = "none";
  }

  updateProgressTimeline(order.status);
}

// Status badge logic
function updateStatusBadge(status) {
  const badge = document.getElementById("orderStatusBadge");
  badge.className = "order-status";

  switch (status) {
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

// Progress timeline updater
function updateProgressTimeline(status) {
  const steps = document.querySelectorAll(".progress-step");
  steps.forEach((step) => {
    step.classList.remove("completed", "active", "pending");
    step.classList.add("pending");
  });

  const stepOrder = ["accepted", "paid", "pickup", "dropoff"];
  let currentStepIndex = -1;

  switch (status) {
    case "accepted":
      currentStepIndex = 0;
      break;
    case "pickup-ready":
    case "in-progress":
      currentStepIndex = 2;
      break;
    case "completed":
      currentStepIndex = 3;
      break;
    default:
      currentStepIndex = 1;
  }

  stepOrder.forEach((stepName, index) => {
    const stepElement = document.querySelector(`[data-step="${stepName}"]`);
    if (stepElement) {
      if (index < currentStepIndex) stepElement.classList.add("completed");
      else if (index === currentStepIndex) stepElement.classList.add("active");
    }
  });
}

// Dummy handlers
function initializeActions() {
  console.log("Action handlers initialized");
}
function updateTimestamps() {}
function startRealTimeUpdates() {}
function goBack() {
  window.history.back();
}
function printOrder() {
  window.print();
}