// Maintenance Log JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Initialize page
  initializePage()

  // Event listeners
  setupEventListeners()
})

function initializePage() {
  console.log("[v0] Maintenance log page initialized")

  // Load vehicle data
  loadVehicleData()

  // Load maintenance records
  loadMaintenanceRecords()
}

function setupEventListeners() {
  // Vehicle selector change
  const vehicleSelect = document.getElementById("vehicleSelect")
  if (vehicleSelect) {
    vehicleSelect.addEventListener("change", handleVehicleChange)
  }

  // Search button
  const searchBtns = document.querySelectorAll(".search-btn")
  searchBtns.forEach((btn) => {
    btn.addEventListener("click", handleSearch)
  })

  // Filter change
  const filterSelect = document.querySelector(".filter-select")
  if (filterSelect) {
    filterSelect.addEventListener("change", handleFilterChange)
  }

  // Quick access cards
  const accessCards = document.querySelectorAll(".access-card")
  accessCards.forEach((card) => {
    card.addEventListener("click", handleQuickAccess)
  })

  // Go back button
  const goBackBtn = document.querySelector(".go-back-btn")
  if (goBackBtn) {
    goBackBtn.addEventListener("click", goBack)
  }
}

function handleVehicleChange(event) {
  const selectedVehicle = event.target.value
  console.log("[v0] Vehicle changed to:", selectedVehicle)

  // Update vehicle details
  updateVehicleDetails(selectedVehicle)

  // Reload maintenance records 
  loadMaintenanceRecords(selectedVehicle)
}

function handleSearch() {
  const vehicleInput = document.querySelector(".search-form .form-input")
  const typeSelect = document.querySelector(".search-form .form-select")

  if (vehicleInput && typeSelect) {
    const vehicleNo = vehicleInput.value.trim()
    const vehicleType = typeSelect.value

    console.log("[v0] Searching for vehicle:", vehicleNo, "Type:", vehicleType)

    if (vehicleNo) {
      searchVehicle(vehicleNo, vehicleType)
    } else {
      showError("Please enter a vehicle registration number")
    }
  }
}

function handleFilterChange(event) {
  const filterValue = event.target.value
  console.log("[v0] Filter changed to:", filterValue)

  filterMaintenanceRecords(filterValue)
}

function handleQuickAccess(event) {
  const card = event.currentTarget
  const documentType = card.querySelector("h4").textContent

  console.log("[v0] Quick access clicked:", documentType)

  // Show document or download
  showDocument(documentType)
}

function loadVehicleData() {
  // Simulate loading vehicle data
  const vehicleData = {
    "WP CAB 2156": {
      model: "Toyota Prius 2020",
      status: "Under Service",
      lastService: "2023-12-15",
      nextService: "2024-03-15",
      insuranceExpiry: "2024-05-11",
      emissionTest: "overdue/passed",
      statusClass: "status-under-service",
    },
    "ABC 123": {
      model: "Honda Civic 2021",
      status: "Available",
      lastService: "2023-11-20",
      nextService: "2024-02-20",
      insuranceExpiry: "2024-06-15",
      emissionTest: "passed",
      statusClass: "status-available",
    },
  }

  // Store data globally
  window.vehicleData = vehicleData
}

function updateVehicleDetails(vehicleId) {
  const vehicleData = window.vehicleData[vehicleId]
  if (!vehicleData) return

  // Update vehicle info
  const vehicleInfo = document.querySelector(".vehicle-info h3")
  const statusBadge = document.querySelector(".status-badge")
  const statValues = document.querySelectorAll(".stat-value")

  if (vehicleInfo) vehicleInfo.textContent = vehicleData.model
  if (statusBadge) {
    statusBadge.textContent = vehicleData.status
    statusBadge.className = `status-badge ${vehicleData.statusClass}`
  }

  // Update stats
  if (statValues.length >= 6) {
    statValues[1].textContent = vehicleData.lastService
    statValues[2].textContent = vehicleData.nextService
    statValues[3].textContent = vehicleData.insuranceExpiry
    statValues[4].textContent = vehicleData.emissionTest
    statValues[5].textContent = vehicleData.model
  }
}

function loadMaintenanceRecords(vehicleId = "WP CAB 2156") {
  // Simulate loading maintenance records
  const records = {
    "WP CAB 2156": [
      {
        date: "2023-12-15",
        id: "MR001",
        service: "Oil change",
        cost: "$95",
        description: "Regular oil change and filter replacement",
        mileage: "45,230 km",
        status: "Completed",
      },
      {
        date: "2023-11-20",
        id: "MR002",
        service: "Brake check",
        cost: "$180",
        description: "Brake inspection and pad replacement",
        mileage: "44,800 km",
        status: "Completed",
      },
    ],
  }

  const vehicleRecords = records[vehicleId] || []
  renderMaintenanceRecords(vehicleRecords)
}

function renderMaintenanceRecords(records) {
  const tableBody = document.querySelector(".table-body")
  if (!tableBody) return

  tableBody.innerHTML = records
    .map(
      (record) => `
        <div class="table-row">
            <div class="col-date">
                <div class="date">${record.date}</div>
                <div class="id">ID: ${record.id}</div>
            </div>
            <div class="col-service">
                <div class="service-name">${record.service}</div>
                <div class="service-cost">${record.cost}</div>
            </div>
            <div class="col-description">
                <div class="description">${record.description}</div>
                <div class="mileage">Mileage: ${record.mileage}</div>
            </div>
            <div class="col-action">
                <span class="status-badge status-completed">${record.status}</span>
            </div>
        </div>
    `,
    )
    .join("")
}

function filterMaintenanceRecords(filterValue) {
  const rows = document.querySelectorAll(".table-row")

  rows.forEach((row) => {
    const status = row.querySelector(".status-badge").textContent.toLowerCase()

    if (filterValue === "all" || status.includes(filterValue.toLowerCase())) {
      row.style.display = "grid"
    } else {
      row.style.display = "none"
    }
  })
}

function searchVehicle(vehicleNo, vehicleType) {
  // Simulate vehicle search
  const found = Math.random() > 0.5 // Random for demo

  if (found) {
    showSuccess(`Vehicle ${vehicleNo} found!`)
    // Load vehicle data
    loadVehicleData()
  } else {
    showError("Vehicle not found in fleet or no legal documents available.")
  }
}

function showDocument(documentType) {
  // Simulate document viewing
  alert(`Opening ${documentType}...`)
}

function showError(message) {
  const errorDiv = document.querySelector(".error-message")
  if (errorDiv) {
    errorDiv.innerHTML = `<i class="fas fa-times-circle"></i> ${message}`
    errorDiv.style.display = "flex"
  }
}

function showSuccess(message) {
  // Create temporary success message
  const successDiv = document.createElement("div")
  successDiv.className = "success-message"
  successDiv.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`
  successDiv.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        color: #2ed573;
        font-weight: 500;
        margin-bottom: 2rem;
        padding: 1rem;
        background: #f0fff4;
        border-radius: 8px;
        border: 1px solid #9ae6b4;
    `

  const errorDiv = document.querySelector(".error-message")
  if (errorDiv) {
    errorDiv.parentNode.insertBefore(successDiv, errorDiv)
    setTimeout(() => successDiv.remove(), 3000)
  }
}

function goBack() {
  window.history.back()
}

// Export functions for global access
window.goBack = goBack
