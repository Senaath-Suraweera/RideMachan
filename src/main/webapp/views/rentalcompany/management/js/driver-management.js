
// Driver Management JavaScript
class DriverManager {
  constructor() {
    this.drivers = [
      { 
        id: "DL2345678",
        name: "John Smith",
        initials: "JS",
        phone: "+1-555-0101",
        license: "ABC123456",
        area: "Downtown",
        expiry: "2025-06-15",
        status: "available",
        rating: 4.8,
        trips: 156,
        currentBooking: {
          id: "BK001",
          time: "09:00 - 17:00",
          customer: "Alice Johnson",
          vehicle: "Toyota Prius 2020",
        },
      },
      {
        id: "DL8765432",
        name: "Sarah Wilson",
        initials: "SW",
        phone: "+1-555-0102",
        license: "XYZ789012",
        area: "Airport",
        expiry: "2024-12-20",
        status: "on-trip",
        rating: 4.9,
        trips: 203,
        currentBooking: {
          id: "BK002",
          time: "14:00 - 18:00",
          customer: "Bob Miller",
          vehicle: "Honda Civic 2021",
        },
      },
      {
        id: "DL5432167",
        name: "Mike Davis",
        initials: "MD",
        phone: "+1-555-0103",
        license: "DEF456789",
        area: "Uptown",
        expiry: "2025-03-10",
        status: "offline",
        rating: 4.6,
        trips: 89,
        currentBooking: null,
      },
    ]

    this.filteredDrivers = [...this.drivers]
    this.init()
  }

  init() {
    this.renderDrivers()
    this.setupEventListeners()
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.querySelector(".search-input")
    searchInput.addEventListener("input", (e) => {
      this.filterDrivers(e.target.value, document.querySelector(".filter-select").value)
    })

    // Filter functionality
    const filterSelect = document.querySelector(".filter-select")
    filterSelect.addEventListener("change", (e) => {
      this.filterDrivers(document.querySelector(".search-input").value, e.target.value)
    })

    // Add driver button
    const addDriverBtn = document.querySelector(".add-driver-btn")
    addDriverBtn.addEventListener("click", () => {
      this.openAddDriverModal()
    })

    // Add driver form
    const addDriverForm = document.getElementById("addDriverForm")
    addDriverForm.addEventListener("submit", (e) => {
      e.preventDefault()
      this.addNewDriver(new FormData(e.target))
    })
  }

  filterDrivers(searchTerm, statusFilter) {
    this.filteredDrivers = this.drivers.filter((driver) => {
      const matchesSearch =
        !searchTerm ||
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.id.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || driver.status === statusFilter

      return matchesSearch && matchesStatus
    })

    this.renderDrivers()
  }

  renderDrivers() {
    const driversGrid = document.getElementById("driversGrid")

    if (this.filteredDrivers.length === 0) {
      driversGrid.innerHTML = `
                <div class="no-drivers">
                    <i class="fas fa-users" style="font-size: 3rem; color: #ccc; margin-bottom: 1rem;"></i>
                    <h3>No drivers found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                </div>
            `
      return
    }

    driversGrid.innerHTML = this.filteredDrivers
      .map(
        (driver) => `
            <div class="driver-card">
                <div class="driver-status status-${driver.status}">
                    ${this.getStatusText(driver.status)}
                </div>
                
                <div class="driver-header">
                    <div class="driver-avatar">${driver.initials}</div>
                    <div class="driver-info">
                        <h3>${driver.name}</h3>
                        <p class="driver-id">Driver ID: ${driver.id}</p>
                    </div>
                </div>

                <div class="driver-rating">
                    <i class="fas fa-star rating-star"></i>
                    <span><strong>${driver.rating}</strong></span>
                    <span class="rating-text">(${driver.trips} trips)</span>
                </div>

                <div class="driver-details">
                    <div class="detail-item">
                        <i class="fas fa-map-marker-alt detail-icon"></i>
                        <span>Area: ${driver.area}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-phone detail-icon"></i>
                        <span>${driver.phone}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-id-card detail-icon"></i>
                        <span>License: ${driver.license}</span>
                    </div>
                    <div class="detail-item">
                        <i class="fas fa-calendar detail-icon"></i>
                        <span>Expires: ${driver.expiry}</span>
                    </div>
                </div>

                ${
                  driver.currentBooking
                    ? `
                    <div class="current-booking">
                        <div class="booking-header">
                            <span class="booking-title">Current Booking</span>
                            <span class="booking-id">${driver.currentBooking.id}</span>
                        </div>
                        <div class="booking-details">
                            <span><i class="fas fa-clock"></i> ${driver.currentBooking.time}</span>
                            <span><i class="fas fa-car"></i> ${driver.currentBooking.vehicle}</span>
                        </div>
                        <div class="booking-details">
                            <span><i class="fas fa-user"></i> Customer: ${driver.currentBooking.customer}</span>
                        </div>
                    </div>
                `
                    : ""
                }

                <div class="driver-actions">
                    <button class="action-btn" onclick="window.driverManager.messageDriver('${driver.id}')">
                        <i class="fas fa-comment"></i>
                        Message
                    </button>
                    
                    <button class="action-btn primary" data-driver-id="${driver.id}">
                        Assign Booking
                    </button>
                </div>
            </div>
        `,
      )
      .join("") 
  }

  getStatusText(status) {
    const statusMap = {
      available: "Available",
      "on-trip": "On Trip",
      offline: "Offline",
    }
    return statusMap[status] || status
  }

  // Open Add Driver Modal
openAddDriverModal() {
  const modal = document.getElementById("addDriverModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  

  // Close modal if clicked outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      this.closeAddDriverModal();
    }
  });
}

// Close Add Driver Modal
closeAddDriverModal() {
  const modal = document.getElementById("addDriverModal");
  modal.classList.remove("active");
  document.body.style.overflow = "auto";
  document.getElementById("addDriverForm").reset();
}


  addNewDriver(formData) {
    const newDriver = {
      id: "DL" + Math.random().toString().substr(2, 7),
      name: formData.get("name"),
      initials: this.getInitials(formData.get("name")),
      phone: formData.get("phone"),
      license: formData.get("license"),
      area: formData.get("area"),
      expiry: formData.get("expiry"),
      status: formData.get("status"),
      rating: 0,
      trips: 0,
      currentBooking: null,
    }

    this.drivers.unshift(newDriver)
    this.filteredDrivers = [...this.drivers]
    this.renderDrivers()
    this.closeAddDriverModal()

    // Show success message
    this.showNotification("Driver added successfully!", "success")
  }

  getInitials(name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  messageDriver(driverId) {
    const driver = this.drivers.find((d) => d.id === driverId);
    if (!driver) return;

    // Open your message modal
    document.getElementById("messageStaffName").textContent = `To: ${driver.name}`;
    document.getElementById("messageContent").value = "";
    messageModal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  callDriver(driverId) {
    const driver = this.drivers.find((d) => d.id === driverId)
    this.showNotification(`Calling ${driver.name} at ${driver.phone}...`, "info")
    // Implement calling functionality
  }

  viewDriverDetails(driverId) {
    const driver = this.drivers.find((d) => d.id === driverId)
    this.showNotification(`Opening details for ${driver.name}...`, "info")
    // Implement driver details view
  }

  showNotification(message, type = "info") {
    // Create notification element
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`
    notification.innerHTML = `
            <i class="fas fa-${type === "success" ? "check-circle" : "info-circle"}"></i>
            <span>${message}</span>
        `

    // Add to page
    document.body.appendChild(notification)

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove()
    }, 3000)
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.driverManager = new DriverManager()
})

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 0.5rem;
        z-index: 1001;
        animation: slideIn 0.3s ease;
    }
    
    .notification-success {
        border-left: 4px solid #28a745;
        color: #155724;
    }
    
    .notification-info {
        border-left: 4px solid #17a2b8;
        color: #0c5460;
    }
    
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
    
    .no-drivers {
        grid-column: 1 / -1;
        text-align: center;
        padding: 3rem;
        color: #666;
    }
    
    .no-drivers h3 {
        margin: 0 0 0.5rem 0;
        color: #1a1a1a;
    }
`

// Inject notification styles
const styleSheet = document.createElement("style")
styleSheet.textContent = notificationStyles
document.head.appendChild(styleSheet)

































// Wait until DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  const driversGrid = document.getElementById("driversGrid");

  // Event delegation for Assign Booking button
  driversGrid.addEventListener("click", function (e) {
    const btn = e.target.closest(".action-btn.primary");
    if (!btn) return; 
    const driverId = btn.dataset.driverId;
    if (!driverId) return;

    const driver = window.driverManager.drivers.find(d => d.id === driverId);
    if (!driver) return;

    // Create overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.6); display:flex; justify-content:center;
      align-items:center; z-index:10000;
    `;

    // Create modal
    const modal = document.createElement("div");
    modal.style.cssText = `
      background: #fff; padding: 25px; border-radius: 12px;
      width: 500px; max-height: 90%; overflow-y: auto;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3); position: relative;
      font-family: 'Poppins', sans-serif; color: #333;
    `;

    modal.innerHTML = `
      <h2>Assign Booking to ${driver.name}</h2>
      <form id="assignBookingForm">
        <div style="margin-bottom:10px;">
          <label>Booking ID</label>
          <input type="text" name="bookingId" required style="width:100%; padding:8px;">
        </div>
        <div style="margin-bottom:10px;">
          <label>Pickup Location</label>
          <input type="text" name="pickup" required style="width:100%; padding:8px;">
        </div>
        <div style="margin-bottom:10px;">
          <label>Dropoff Location</label>
          <input type="text" name="dropoff" required style="width:100%; padding:8px;">
        </div>
        <div style="margin-bottom:10px;">
          <label>Date</label>
          <input type="date" name="date" required style="width:100%; padding:8px;">
        </div>
        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:15px;">
          <button type="submit" style="padding:8px 14px; background:#1dd1a1; color:#fff; border:none; border-radius:6px; cursor:pointer;">Assign</button>
          <button type="button" id="closeAssignModal" style="padding:8px 14px; background:#ff6b6b; color:#fff; border:none; border-radius:6px; cursor:pointer;">Cancel</button>
        </div>
      </form>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    // Close modal
    modal.querySelector("#closeAssignModal").addEventListener("click", () => {
      overlay.remove();
      document.body.style.overflow = "auto";
    });

    // Handle form submission
    modal.querySelector("#assignBookingForm").addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const booking = {
        id: formData.get("bookingId"),
        pickup: formData.get("pickup"),
        dropoff: formData.get("dropoff"),
        date: formData.get("date"),
      };

      // Assign booking to driver
      driver.currentBooking = booking;

      // Update driverManager UI
      window.driverManager.filteredDrivers = [...window.driverManager.drivers];
      window.driverManager.renderDrivers();
      window.driverManager.showNotification(`Booking ${booking.id} assigned to ${driver.name}`, "success");

      overlay.remove();
      document.body.style.overflow = "auto";
    });
  });
});























// Event delegation for Call button
document.getElementById("driversGrid").addEventListener("click", function (e) {
  const btn = e.target.closest(".action-btn");
  if (!btn) return;

  const driverId = btn.dataset.driverId || null;
  if (!driverId) return;

  const driver = window.driverManager.drivers.find(d => d.id === driverId);
  if (!driver) return;

  // Check if button is "Call"
  if (btn.innerText.includes("Call")) {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed; top:0; left:0; width:100%; height:100%;
      background: rgba(0,0,0,0.6); display:flex; justify-content:center;
      align-items:center; z-index:10000;
    `;

    // Create modal
    const modal = document.createElement("div");
    modal.style.cssText = `
      background: #fff; padding: 20px; border-radius: 12px;
      width: 400px; max-width:90%; text-align:center;
      box-shadow: 0 6px 20px rgba(0,0,0,0.3); position: relative;
      font-family: 'Poppins', sans-serif; color: #333;
    `;

    modal.innerHTML = `
      <h2>Call Driver</h2>
      <p>Driver: <strong>${driver.name}</strong></p>
      <p>Phone: <strong>${driver.phone}</strong></p>
      <button id="copyPhoneBtn" style="
        margin:10px; padding:8px 14px; background:#48dbfb; color:#fff;
        border:none; border-radius:6px; cursor:pointer;
      ">Copy Number</button>
      <button id="closeCallModal" style="
        margin:10px; padding:8px 14px; background:#ff6b6b; color:#fff;
        border:none; border-radius:6px; cursor:pointer;
      ">Close</button>
    `;

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    // Copy phone number
    modal.querySelector("#copyPhoneBtn").addEventListener("click", () => {
      navigator.clipboard.writeText(driver.phone).then(() => {
        window.driverManager.showNotification("Phone number copied!", "success");
      });
    });

    // Close modal
    modal.querySelector("#closeCallModal").addEventListener("click", () => {
      overlay.remove();
      document.body.style.overflow = "auto";
    });
  }
});

























// ====== Message Staff Popup JS ======

// Create the modal dynamically
const messageModal = document.createElement("div");
messageModal.id = "messageStaffModal";
messageModal.style.display = "none";
messageModal.style.position = "fixed";
messageModal.style.top = "0";
messageModal.style.left = "0";
messageModal.style.width = "100%";
messageModal.style.height = "100%";
messageModal.style.backgroundColor = "rgba(0,0,0,0.5)";
messageModal.style.zIndex = "1000";
messageModal.style.justifyContent = "center";
messageModal.style.alignItems = "center";

messageModal.innerHTML = `
  <div style="background:#fff; padding:20px; border-radius:8px; width:400px; max-width:90%; position:relative;">
    <span id="closeMessageModal" style="position:absolute; top:10px; right:15px; font-size:20px; cursor:pointer;">&times;</span>
    <h2>Message Driver</h2>
    <p id="messageStaffName" style="font-weight:600;"></p>
    <textarea id="messageContent" placeholder="Type your message..." style="width:100%; height:120px; margin-top:10px; padding:8px; border:1px solid #ccc; border-radius:4px;"></textarea>
    <button id="sendMessageBtn" style="margin-top:10px; padding:10px 20px; background:#4CAF50; color:#fff; border:none; border-radius:4px; cursor:pointer;">Send</button>
  </div>
`;
 
document.body.appendChild(messageModal);

// Open Message Modal
function messageStaff(staffId) {
  const staff = staffData.find(s => s.id === staffId);
  if (!staff) return;

  document.getElementById("messageStaffName").textContent = `To: ${staff.name}`;
  document.getElementById("messageContent").value = "";
  messageModal.style.display = "flex";
  document.body.style.overflow = "hidden";
}

// Close Message Modal
function closeMessageModal() {
  messageModal.style.display = "none";
  document.body.style.overflow = "auto";
}

// Send Message
document.getElementById("sendMessageBtn").addEventListener("click", () => {
  const message = document.getElementById("messageContent").value.trim();
  if (!message) {
    alert("Please enter a message.");
    return;
  }

  console.log("[v0] Message sent:", message);
  alert("Message sent successfully!");
  closeMessageModal();
});

// Close modal via close button
document.getElementById("closeMessageModal").addEventListener("click", closeMessageModal);

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  if (event.target === messageModal) {
    closeMessageModal();
  }
});

// Close modal with Escape key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMessageModal();
  }
});












































document.querySelectorAll(".btn-assign-booking").forEach((btn) => {
  btn.addEventListener("click", () => {
    const driverId = btn.dataset.driverId;
    const driverWindow = window.open("driver-management.html", "_blank");

    // Poll until driverManager exists
    const interval = setInterval(() => {
      if (driverWindow.driverManager) {
        clearInterval(interval);

        // Open dynamic modal
        createAssignBookingModal(driverWindow, driverId);
      }
    }, 100);
  });
});

function createAssignBookingModal(driverWindow, driverId) {
  // Create modal overlay
  const overlay = driverWindow.document.createElement("div");
  overlay.style.cssText = `
    position: fixed; top:0; left:0; width:100%; height:100%;
    background: rgba(0,0,0,0.5); display:flex; justify-content:center;
    align-items:center; z-index:10000;
  `;

  // Modal content
  const modal = driverWindow.document.createElement("div");
  modal.style.cssText = `
    background: #fff; padding:20px; border-radius:10px; width:400px;
    max-width:90%; font-family:sans-serif;
  `;

  modal.innerHTML = `
    <h2>Assign Booking</h2>
    <form id="assignBookingForm">
      <div>
        <label>Booking ID</label>
        <input type="text" name="bookingId" required>
      </div>
      <div>
        <label>Pickup Location</label>
        <input type="text" name="pickup" required>
      </div>
      <div>
        <label>Dropoff Location</label>
        <input type="text" name="dropoff" required>
      </div>
      <div>
        <label>Date</label>
        <input type="date" name="date" required>
      </div>
      <div style="margin-top:15px; text-align:right;">
        <button type="submit">Assign</button>
        <button type="button" id="closeAssignModal">Cancel</button>
      </div>
    </form>
  `;

  overlay.appendChild(modal);
  driverWindow.document.body.appendChild(overlay);
  driverWindow.document.body.style.overflow = "hidden";

  // Close modal
  modal.querySelector("#closeAssignModal").addEventListener("click", () => {
    overlay.remove();
    driverWindow.document.body.style.overflow = "auto";
  });

  // Form submit
  modal.querySelector("#assignBookingForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const booking = {
      id: formData.get("bookingId"),
      time: formData.get("date"),
      pickup: formData.get("pickup"),
      dropoff: formData.get("dropoff"),
      customer: "N/A", // optional
      vehicle: "N/A"   // optional
    };

    // Assign to driver in driverManager
    const driver = driverWindow.driverManager.drivers.find(d => d.id === driverId);
    if (driver) {
      driver.currentBooking = booking;
      driverWindow.driverManager.filteredDrivers = [...driverWindow.driverManager.drivers];
      driverWindow.driverManager.renderDrivers();
    }

    overlay.remove();
    driverWindow.document.body.style.overflow = "auto";
    driverWindow.driverManager.showNotification("Booking assigned!", "success");
  });
}




































// Wait until DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Select the button
  const assignDriverBtn = document.querySelector(".assignDriverBtn");
  if (assignDriverBtn) {
    assignDriverBtn.addEventListener("click", (e) => {
      e.preventDefault(); // Prevent default <a> behavior
      // Redirect to driver-management.html
      window.location.href = "driver-management.html";
    });
  }
});
