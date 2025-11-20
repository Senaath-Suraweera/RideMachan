// Fleet Calendar JavaScript
const currentDate = new Date()
let currentVehicle = "WP CAB 2156"
let currentView = "daily"

// Initialize calendar
document.addEventListener("DOMContentLoaded", () => {
  updateDateDisplay()
  loadVehicleSchedule()
})

// Date navigation functions
function previousMonth() {
  currentDate.setMonth(currentDate.getMonth() - 1)
  updateDateDisplay()
  loadVehicleSchedule()
}

function nextMonth() {
  currentDate.setMonth(currentDate.getMonth() + 1)
  updateDateDisplay()
  loadVehicleSchedule()
}

function updateDateDisplay() {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const currentDateElement = document.querySelector(".current-date")
  if (currentDateElement) {
    currentDateElement.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`
  }
}

// Vehicle selection
function changeVehicle() {
  const vehicleSelect = document.getElementById("vehicleSelect")
  currentVehicle = vehicleSelect.value
  loadVehicleSchedule()
  updateVehicleInfo()
}

function updateVehicleInfo() {
  // Update vehicle information based on selected vehicle
  const vehicleDetails = {
    "WP CAB 2156": {
      name: "Toyota Prius 2020",
      status: "Available",
    },
    "ABC 123": {
      name: "Honda Civic 2021",
      status: "On Trip",
    },
    "XYZ 789": {
      name: "Ford Explorer 2022",
      status: "Maintenance",
    },
  }

  const vehicle = vehicleDetails[currentVehicle]
  if (vehicle) {
    document.querySelector(".vehicle-details h3").textContent = vehicle.name
    const statusBadge = document.querySelector(".status-badge")
    statusBadge.textContent = vehicle.status
    statusBadge.className = `status-badge ${vehicle.status.toLowerCase().replace(" ", "-")}`
  }
}

// View selection
function changeView() {
  const viewSelect = document.getElementById("viewType")
  currentView = viewSelect.value
  loadVehicleSchedule()
}

// Load vehicle schedule
function loadVehicleSchedule() {
  // Simulate loading schedule data
  console.log(`Loading schedule for ${currentVehicle} in ${currentView} view for ${currentDate.toDateString()}`)

  // Update daily stats
  updateDailyStats()
}

function updateDailyStats() {
  // Simulate updating daily statistics
  const stats = {
    trips: Math.floor(Math.random() * 5) + 1,
    maintenance: Math.floor(Math.random() * 3),
    drivers: Math.floor(Math.random() * 3) + 1,
  }

  const statCards = document.querySelectorAll(".stat-number")
  if (statCards.length >= 3) {
    statCards[0].textContent = stats.trips
    statCards[1].textContent = stats.maintenance
    statCards[2].textContent = stats.drivers
  }
}  

// Action functions
function addToMaintenance() {
  alert(`Adding ${currentVehicle} to maintenance schedule...`)
  // Implement maintenance scheduling logic
}

function refreshCalendar() {
  loadVehicleSchedule()
  showNotification("Calendar refreshed successfully!")
}

function contactAdmin() {
  alert("Contacting admin...")
  // Implement admin contact functionality
}

// Utility functions
function showNotification(message) {
  // Create and show notification
  const notification = document.createElement("div")
  notification.className = "notification"
  notification.textContent = message
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4caf50;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.remove()
  }, 3000)
}

// Add CSS animation for notifications
const style = document.createElement("style")
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`
document.head.appendChild(style)

// Handle booking interactions
document.addEventListener("click", (e) => {
  if (e.target.closest(".booking")) {
    const booking = e.target.closest(".booking")
    const bookingId = booking.querySelector(".booking-id").textContent
    console.log(`Clicked on booking: ${bookingId}`)
    // Implement booking details modal or navigation
  }

  if (e.target.closest(".maintenance")) {
    const maintenance = e.target.closest(".maintenance")
    const maintenanceType = maintenance.querySelector(".maintenance-type").textContent
    console.log(`Clicked on maintenance: ${maintenanceType}`)
    // Implement maintenance details modal or navigation
  }
})

// Auto-refresh every 5 minutes
setInterval(() => {
  loadVehicleSchedule()
}, 300000)
 























// Initialize date picker with current date
document.addEventListener("DOMContentLoaded", () => {
    const dateInput = document.getElementById("calendarDate");
    if (dateInput) {
        const todayStr = currentDate.toISOString().split("T")[0]; // yyyy-mm-dd
        dateInput.value = todayStr;
    }
    updateDateDisplay()
    loadVehicleSchedule()
});

// Go to selected date
function goToSelectedDate() {
    const dateInput = document.getElementById("calendarDate");
    if (dateInput && dateInput.value) {
        currentDate.setTime(new Date(dateInput.value).getTime());
        updateDateDisplay();
        loadVehicleSchedule();
    }
}

// Update date display for "current-date" and "Today"
function updateDateDisplay() {
    const monthNames = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December"
    ];

    const currentDateElement = document.querySelector(".current-date");
    const todayInfo = document.getElementById("todayInfo");
    const dateStr = `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;

    if (currentDateElement) currentDateElement.textContent = dateStr;
    if (todayInfo) todayInfo.textContent = `Today: ${dateStr}`;

    // Update the date picker input value to match
    const dateInput = document.getElementById("calendarDate");
    if (dateInput) dateInput.value = currentDate.toISOString().split("T")[0];
}
