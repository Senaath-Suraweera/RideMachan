// Vehicle Fleet Management JavaScript
 
// Sample vehicle data
const vehicleData = [
  {
    id: 1,
    make: "Toyota",
    model: "Prius",
    year: 2020,
    plate: "WP CAB 2156",
    type: "Hybrid Sedan",
    status: "available",
    location: "Downtown Depot",    
    fuelType: "battery",
    mileage: "45,230 km",
    condition: "good",
    maintenanceStaff: [{ name: "Robert Wilson", id: "MAINT01", task: "Engine & Transmission" }],
  },
  {
    id: 2,
    make: "Honda",
    model: "Civic",
    year: 2021,
    plate: "ABC 123",
    type: "Sedan",
    status: "on-trip",
    location: "Airport Route",
    fuelType: "fuel",
    mileage: "32,145 km",
    condition: "good",
    currentBooking: "BK002",
    maintenanceStaff: [{ name: "Robert Wilson", id: "MAINT01", task: "Engine & Transmission" }],
  },
  {
    id: 3,
    make: "Ford",
    model: "Explorer",
    year: 2022,
    plate: "XYZ 789",
    type: "SUV",
    status: "maintenance",
    location: "Service Center",
    fuelType: "fuel",
    mileage: "28,567 km",
    condition: "under-repair",
    maintenanceStaff: [{ name: "Mike Thompson", id: "MAINT03", task: "Body & Paint" }],
  },
  {
    id: 4,
    make: "Nissan",
    model: "Altima",
    year: 2020,
    plate: "GHI 012",
    type: "Sedan",
    status: "available",
    location: "Downtown Depot",
    fuelType: "fuel",
    mileage: "38,445 km",
    condition: "good",
    maintenanceStaff: [{ name: "Sarah Davis", id: "MAINT02", task: "Electrical & Electronics" }],
  },
  {
    id: 5,
    make: "BMW",
    model: "320i",
    year: 2022,
    plate: "DEF 345",
    type: "Sedan",
    status: "available",
    location: "Airport Depot",
    fuelType: "fuel",
    mileage: "15,230 km",
    condition: "good",
    maintenanceStaff: [{ name: "Robert Wilson", id: "MAINT01", task: "Engine & Transmission" }],
  },
  {
    id: 6,
    make: "Mercedes",
    model: "C200",
    year: 2021,
    plate: "MNO 678",
    type: "Sedan",
    status: "maintenance",
    location: "Service Center",
    fuelType: "fuel",
    mileage: "42,567 km",
    condition: "scheduled-service",
    maintenanceStaff: [{ name: "Mike Thompson", id: "MAINT03", task: "Body & Paint" }],
  },
]

let filteredVehicles = [...vehicleData]

// DOM Elements
const vehicleGrid = document.getElementById("vehicleGrid")
const vehicleSearch = document.getElementById("vehicleSearch")
const vehicleFilter = document.getElementById("vehicleFilter")
const addVehicleBtn = document.getElementById("addVehicleBtn")
const addVehicleModal = document.getElementById("addVehicleModal")
const closeAddVehicleModal = document.getElementById("closeAddVehicleModal")
const addVehiclebtn = document.getElementById("addAddVehicle")
const addVehicleForm = document.getElementById("addVehicleForm")

// Initialize the page
document.addEventListener("DOMContentLoaded", () => {
  renderVehicles()
  setupEventListeners()
})

// Render vehicles in the grid
function renderVehicles() {
  vehicleGrid.innerHTML = ""

  filteredVehicles.forEach((vehicle) => {
    const vehicleCard = createVehicleCard(vehicle)
    vehicleGrid.appendChild(vehicleCard)
  })
}

// Create individual vehicle card
function createVehicleCard(vehicle) {
  const card = document.createElement("div")
  card.className = "vehicle-card"
  

  const statusClass = vehicle.status.replace("-", "-")
  const conditionClass = vehicle.condition.replace(" ", "-")

  card.innerHTML = `
        <div class="vehicle-image">
            <i class="fas fa-car"></i>
            <div class="vehicle-status ${statusClass}">${formatStatus(vehicle.status)}</div>
        </div>
        <div class="vehicle-info">
            <div class="vehicle-header">
                <div>
                    <div class="vehicle-title">${vehicle.make} ${vehicle.model} ${vehicle.year}</div>
                    <div class="vehicle-subtitle">Vehicle: ${vehicle.plate}</div>
                    <div class="vehicle-subtitle">${vehicle.type}</div>
                </div>
            </div>
            
            <div class="vehicle-details">
                <div class="detail-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${vehicle.location}</span>
                </div>
                
                <div class="detail-item">
                    <i class="fas fa-tachometer-alt"></i>
                    <span>${vehicle.mileage}</span>
                </div>
                <div class="detail-item">
                    <span class="condition-badge ${conditionClass}">${formatCondition(vehicle.condition)}</span>
                </div>
            </div>
            
            ${
              vehicle.currentBooking
                ? `<div class="current-booking">
                    <strong>Current Booking:</strong> ${vehicle.currentBooking}
                </div>`
                : ""
            }
            
            <div class="maintenance-staff">
                <h4><i class="fas fa-user-cog"></i> Assigned Maintenance Staff</h4>
                <div class="staff-list">
                    ${vehicle.maintenanceStaff
                      .map(
                        (staff) => `
                        <div class="staff-item">
                            <i class="fas fa-user"></i>
                            <span>${staff.name}</span>
                        </div>
                        <div class="staff-item">
                            <i class="fas fa-id-badge"></i>
                            <span>ID: ${staff.id}</span>
                        </div>
                        <div class="staff-item">
                            <i class="fas fa-wrench"></i>
                            <span>${staff.task}</span>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
            
            <div class="vehicle-actions">
                <button class="action-btn secondary" onclick="viewVehicleDetails(${vehicle.id})">
                    <i class="fas fa-eye"></i>
                    Calender
                </button>
                
                <button class="action-btn maintenance maintenace" onclick="manageMaintenance(${vehicle.id})">
                    <i class="fas fa-wrench"></i>
                    Maintenance
                </button>
                <button class="action-btn secondary" onclick="removeVehicle(${vehicle.id})">
                    <i class="fa fa-trash"></i>
                    Remove
                </button>
                
            </div>
        </div>
    `

  return card
}

// Format status for display
function formatStatus(status) {
  switch (status) {
    case "available":
      return "Available"
    case "on-trip":
      return "On Trip"
    case "maintenance":
      return "Maintenance"
    default:
      return status
  }
}

// Format condition for display
function formatCondition(condition) {
  switch (condition) {
    case "good":
      return "Good"
    case "under-repair":
      return "Under Repair"
    case "scheduled-service":
      return "Scheduled Service"
    default:
      return condition
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search functionality
  vehicleSearch.addEventListener("input", function () {
    const searchTerm = this.value.toLowerCase()
    filteredVehicles = vehicleData.filter(
      (vehicle) =>
        vehicle.make.toLowerCase().includes(searchTerm) ||
        vehicle.model.toLowerCase().includes(searchTerm) ||
        vehicle.plate.toLowerCase().includes(searchTerm),
    )
    applyFilter()
  })

  // Filter functionality
  vehicleFilter.addEventListener("change", () => {
    applyFilter()
  })

  // Modal functionality
  addVehicleBtn.addEventListener("click", () => {
    addVehicleModal.classList.add("active")
  })

  closeAddVehicleModal.addEventListener("click", () => {
    addVehicleModal.classList.remove("active")
  })

addVehiclebtn.addEventListener("click", () => {
    // Check if all required fields are filled
    const requiredFields = [
        "vehiclePlate",
        "vehicleModel",
        "vehicleColour",
        "vehicleSeats",
        "vehicleEngineCapacity",
        "vehicleEngineNumber",
        "vehicleMaintenanceStaff",
        "vehicleYear",
        "vehicleDescription",
        "vehicleType",
        "vehicleLocation",
        "vehicleImage"
    ];

    let allFilled = true;

    requiredFields.forEach(id => {
        const field = document.getElementById(id);
        if (!field.value) {
            allFilled = false;
            field.style.border = "2px solid red"; // highlight missing fields
        } else {
            field.style.border = ""; // reset border if filled
        }
    });

    if (!allFilled) {
        alert("Please fill all required fields before adding the vehicle.");
        return; // Do not close modal
    }

    // If all fields are filled, submit the form
    handleAddVehicle();
});

  // Close modal when clicking outside
  addVehicleModal.addEventListener("click", (e) => {
    if (e.target === addVehicleModal) {
      addVehicleModal.classList.remove("active")
    }
  })

  // Form submission
  addVehicleForm.addEventListener("submit", (e) => {
    e.preventDefault()
    handleAddVehicle()
  })

  // View tabs
  document.querySelectorAll(".view-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".view-tab").forEach((t) => t.classList.remove("active"))
      this.classList.add("active")

      const view = this.dataset.view
      handleViewChange(view)
    })
  })
}

// Apply current filter
function applyFilter() {
  const filterValue = vehicleFilter.value

  if (filterValue === "all") {
    // filteredVehicles already contains search results
  } else {
    filteredVehicles = filteredVehicles.filter((vehicle) => vehicle.status === filterValue)
  }

  renderVehicles()
}

// Handle view change
function handleViewChange(view) {
  console.log(`[v0] Switching to ${view} view`)
  // Implementation for different views would go here
}

// Handle add vehicle form submission
function handleAddVehicle() {
  const formData = new FormData(addVehicleForm)
  const newVehicle = {
    id: vehicleData.length + 1,
    make: document.getElementById("vehicleMake").value,
    model: document.getElementById("vehicleModel").value,
    year: Number.parseInt(document.getElementById("vehicleYear").value),
    plate: document.getElementById("vehiclePlate").value,
    type: document.getElementById("vehicleType").value,
    location: document.getElementById("vehicleLocation").value,
    status: "available",
    fuelLevel: 100,
    fuelType: "fuel",
    mileage: "0 km",
    condition: "good",
    maintenanceStaff: [],
  }

  vehicleData.push(newVehicle)
  filteredVehicles = [...vehicleData]
  renderVehicles()

  addVehicleModal.classList.remove("active")
  addVehicleForm.reset()

  console.log("[v0] New vehicle added:", newVehicle)
}

// Vehicle action handlers
function viewVehicleDetails(vehicleId) {
  const vehicle = vehicleData.find((v) => v.id === vehicleId)
  console.log("[v0] Viewing details for vehicle:", vehicle)
  alert(`Viewing details for ${vehicle.make} ${vehicle.model} (${vehicle.plate})`)
}

function removeVehicle(vehicleId) {
  const vehicle = vehicleData.find((v) => v.id === vehicleId)
  console.log("[v0] Removing vehicle:", vehicle)
  alert(`Removing vehicle ${vehicle.make} ${vehicle.model} (${vehicle.plate})`)
}
 
function scheduleVehicle(vehicleId) {
    const vehicle = vehicleData.find(v => v.id === vehicleId);
    if (!vehicle) return;

    // Create modal container
    const modal = document.createElement("div");
    modal.style.cssText = `
        position: fixed;
        z-index: 1000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;

    // Modal content
    const content = document.createElement("div");
    content.style.cssText = `
        background: #fefefe;
        padding: 25px 30px;
        width: 400px;
        border-radius: 12px;
        position: relative;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        font-family: 'Poppins', sans-serif;
        animation: slideDown 0.3s ease;
    `;

    // Close button
    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = `
        position: absolute;
        top: 12px;
        right: 20px;
        font-size: 24px;
        font-weight: bold;
        cursor: pointer;
        color: #333;
    `;
    closeBtn.addEventListener("click", () => document.body.removeChild(modal));

    // Vehicle info
    const info = document.createElement("div");
    info.innerHTML = `
        <h3 style="margin-bottom: 5px; color:#2c3e50;">New Booking</h3>
        <p style="margin-bottom:15px; color:#34495e; font-weight:500;">
            ${vehicle.make} ${vehicle.model} (${vehicle.plate})
        </p>
    `;

    // Form
    const form = document.createElement("form");

    const dateLabel = document.createElement("label");
    dateLabel.textContent = "Booking Date:";
    dateLabel.htmlFor = "bookingDate";
    dateLabel.style.display = "block";
    dateLabel.style.marginBottom = "5px";
    dateLabel.style.fontWeight = "500";

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.id = "bookingDate";
    dateInput.required = true;
    dateInput.style.cssText = `
        width: 100%;
        padding: 8px 10px;
        margin-bottom: 15px;
        border-radius: 6px;
        border: 1px solid #ccc;
    `;

    const timeLabel = document.createElement("label");
    timeLabel.textContent = "Booking Time:";
    timeLabel.htmlFor = "bookingTime";
    timeLabel.style.display = "block";
    timeLabel.style.marginBottom = "5px";
    timeLabel.style.fontWeight = "500";

    const timeInput = document.createElement("input");
    timeInput.type = "time";
    timeInput.id = "bookingTime";
    timeInput.required = true;
    timeInput.style.cssText = `
        width: 100%;
        padding: 8px 10px;
        margin-bottom: 20px;
        border-radius: 6px;
        border: 1px solid #ccc;
    `;

    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "Create Booking";
    submitBtn.style.cssText = `
        width: 100%;
        padding: 10px;
        background-color: #3498db;
        color: #fff;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        cursor: pointer;
        font-weight: 600;
        transition: 0.3s;
    `;
    submitBtn.addEventListener("mouseover", () => (submitBtn.style.backgroundColor = "#2980b9"));
    submitBtn.addEventListener("mouseout", () => (submitBtn.style.backgroundColor = "#3498db"));

    form.append(dateLabel, dateInput, timeLabel, timeInput, submitBtn);

    // Form submission
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const date = dateInput.value;
        const time = timeInput.value;

        if (date && time) {
            // Redirect to booking management page with vehicle info
            const query = `?plate=${encodeURIComponent(vehicle.plate)}&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}`;
            window.location.href = `booking-management.html${query}`;
        }
    });

    content.append(closeBtn, info, form);
    modal.appendChild(content);
    document.body.appendChild(modal);

    // Close modal if clicking outside content
    modal.addEventListener("click", (e) => {
        if (e.target === modal) document.body.removeChild(modal);
    });
 
    // Animations
    const style = document.createElement("style");
    style.textContent = `
        @keyframes fadeIn { from {opacity:0;} to {opacity:1;} }
        @keyframes slideDown { from {transform:translateY(-20px); opacity:0;} to {transform:translateY(0); opacity:1;} }
    `;
    document.head.appendChild(style);
}



function manageMaintenance(vehicleId) {
  const vehicle = vehicleData.find(v => v.id === vehicleId);
  if (vehicle) {
    // Redirect to maintenance page with plate in URL
    window.location.href = `maintenance-fleet.html?plate=${encodeURIComponent(vehicle.plate)}`;
  }
}

function viewDocuments(vehicleId) {
  const vehicle = vehicleData.find((v) => v.id === vehicleId)
  console.log("[v0] Viewing documents for vehicle:", vehicle)
  alert(`Opening documents for ${vehicle.make} ${vehicle.model} (${vehicle.plate})`)
}
 





























function viewVehicleDetails(vehicleId) {
  const vehicle = vehicleData.find(v => v.id === vehicleId)
  if (vehicle) {
    window.location.href = `fleet-calender.html?plate=${encodeURIComponent(vehicle.plate)}`
  }
}















// Remove vehicle by ID and update grid
function removeVehicle(vehicleId) {
  // Confirm deletion
  const confirmDelete = confirm("Are you sure you want to remove this vehicle?");
  if (!confirmDelete) return;

  // Remove from vehicleData array
  const index = vehicleData.findIndex(v => v.id === vehicleId);
  if (index !== -1) {
    vehicleData.splice(index, 1);
  }

  // Also remove from filteredVehicles to keep search/filter consistent
  filteredVehicles = filteredVehicles.filter(v => v.id !== vehicleId);

  // Remove the card from DOM
  const vehicleCard = document.querySelector(`.vehicle-card[data-id='${vehicleId}']`);
  if (vehicleCard) {
    vehicleCard.remove(); // Removes the card element
  }
}
