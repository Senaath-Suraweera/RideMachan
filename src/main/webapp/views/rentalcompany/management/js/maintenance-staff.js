// Maintenance Staff Management JavaScript

// Sample staff data
const staffData = [
  {
    id: "MAINT001",
    name: "Robert Wilson",
    specialization: "Engine & Transmission",
    status: "available",
    rating: 4.9,
    jobs: 89,
    experience: 6,
    phone: "+1-555-0201",
    vehicles: ["2020 Toyota Prius - ABC-123", "2019 Honda Civic - XYZ-456"],
    badges: ["ASE Certified", "Hybrid Specialist"],
  },
  {
    id: "MAINT002",
    name: "Maria Garcia",
    specialization: "Electrical & Electronics",
    status: "on-job",
    rating: 4.8,
    jobs: 76,
    experience: 6,
    phone: "+1-555-0202",
    vehicles: ["2020 Nissan Altima - GHI-012", "2021 BMW 320i - JKL-345"],
    badges: ["Electronics Specialist", "Diagnostic Expert"],
    currentAssignment: {
      id: "M-001",
      vehicle: "Toyota Prius 2020",
      task: "Brake Inspection",
      completion: "2:00 PM",
    },
  },
  {
    id: "MAINT003",
    name: "James Thompson",
    specialization: "Body & Paint",
    status: "offline",
    rating: 4.7,
    jobs: 54,
    experience: 12,
    phone: "+1-555-0203",
    vehicles: ["2021 Mercedes C200 - MNO-678"],
    badges: ["Paint Specialist", "Body Repair"],
  },
]

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  initializeSearch()
  initializeFilter()
  updateStats()
})

// Search functionality
function initializeSearch() {
  const searchInput = document.getElementById("staffSearch")
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase()
      filterStaff(searchTerm)
    })
  }
}

// Filter functionality
function initializeFilter() {
  const filterSelect = document.getElementById("staffFilter")
  if (filterSelect) {
    filterSelect.addEventListener("change", function () {
      const filterValue = this.value
      filterStaffByStatus(filterValue)
    })
  }
}

// Filter staff by search term
function filterStaff(searchTerm) {
  const staffCards = document.querySelectorAll(".staff-card")

  staffCards.forEach((card) => {
    const staffName = card.querySelector(".staff-name").textContent.toLowerCase()
    const staffId = card.querySelector(".staff-id").textContent.toLowerCase()
    const specialization = card.querySelector(".staff-specialization").textContent.toLowerCase()

    if (staffName.includes(searchTerm) || staffId.includes(searchTerm) || specialization.includes(searchTerm)) {
      card.style.display = "block"
    } else {
      card.style.display = "none"
    }
  })
}

// Filter staff by status
function filterStaffByStatus(status) {
  const staffCards = document.querySelectorAll(".staff-card")

  staffCards.forEach((card) => {
    if (status === "all") {
      card.style.display = "block"
    } else {
      const cardStatus = card.getAttribute("data-status")
      if (cardStatus === status) {
        card.style.display = "block"
      } else {
        card.style.display = "none"
      }
    }
  })
}

// Update statistics
function updateStats() {
  const totalStaff = staffData.length
  const availableStaff = staffData.filter((staff) => staff.status === "available").length
  const onJobStaff = staffData.filter((staff) => staff.status === "on-job").length
  const offlineStaff = staffData.filter((staff) => staff.status === "offline").length
  const totalVehicles = staffData.reduce((total, staff) => total + staff.vehicles.length, 0)

  // Update stat cards if they exist
  const statCards = document.querySelectorAll(".stat-card .stat-number")
  if (statCards.length >= 5) {
    statCards[0].textContent = totalStaff
    statCards[1].textContent = availableStaff
    statCards[2].textContent = onJobStaff
    statCards[3].textContent = offlineStaff
    statCards[4].textContent = totalVehicles
  }
}

// Modal functions
function openAddStaffModal() {
  const modal = document.getElementById("addStaffModal")
  if (modal) {
    modal.style.display = "block"
    document.body.style.overflow = "hidden"
  }
}

function closeAddStaffModal() {
  const modal = document.getElementById("addStaffModal")
  if (modal) {
    modal.style.display = "none"
    document.body.style.overflow = "auto"

    // Reset form
    const form = document.getElementById("addStaffForm")
    if (form) {
      form.reset()
    }
  }
}

// Staff action functions
function viewStaffDetails(staffId) {
  console.log("[v0] Viewing details for staff:", staffId)
  // Implement staff details view
  alert(`Viewing details for staff: ${staffId}`)
}

function messageStaff(staffId) {
  console.log("[v0] Opening message for staff:", staffId)
  // Implement messaging functionality
  alert(`Opening message for staff: ${staffId}`)
}

function manageStaff(staffId) {
  console.log("[v0] Managing staff:", staffId)
  // Implement staff management
  alert(`Managing staff: ${staffId}`)
}

// Add staff form submission
document.addEventListener("DOMContentLoaded", () => {
  const addStaffForm = document.getElementById("addStaffForm")
  if (addStaffForm) {
    addStaffForm.addEventListener("submit", function (e) {
      e.preventDefault()

      const formData = new FormData(this)
      const staffData = {
        name: document.getElementById("staffName").value,
        phone: document.getElementById("staffPhone").value,
        email: document.getElementById("staffEmail").value,
        specialization: document.getElementById("staffSpecialization").value,
        experience: document.getElementById("staffExperience").value,
        certifications: document.getElementById("staffCertifications").value,
      }

      console.log("[v0] Adding new staff member:", staffData)

      // Simulate adding staff
      alert("Staff member added successfully!")
      closeAddStaffModal()
    })
  }
})

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  const modal = document.getElementById("addStaffModal")
  if (event.target === modal) {
    closeAddStaffModal()
  }
})

// Keyboard navigation
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAddStaffModal()
  }
})





























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
    <h2>Message Staff</h2>
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






































// ====== Manage Staff Modal ======

// Create the modal dynamically
const manageModal = document.createElement("div");
manageModal.id = "manageStaffModal";
manageModal.style.display = "none";
manageModal.style.position = "fixed";
manageModal.style.top = "0";
manageModal.style.left = "0";
manageModal.style.width = "100%";
manageModal.style.height = "100%";
manageModal.style.backgroundColor = "rgba(0,0,0,0.5)";
manageModal.style.zIndex = "1000";
manageModal.style.justifyContent = "center";
manageModal.style.alignItems = "center";

manageModal.innerHTML = `
  <div style="background:#fff; padding:25px; border-radius:12px; width:500px; max-width:90%; position:relative; max-height:90vh; overflow-y:auto; font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
    <span id="closeManageModal" style="position:absolute; top:10px; right:15px; font-size:22px; cursor:pointer;">&times;</span>
    <h2 style="margin-bottom:15px; color:#333;">Manage Staff</h2>
    <p id="manageStaffName" style="font-weight:600; margin-bottom:15px;"></p>

    <div style="margin-bottom:20px;">
      <h3 style="margin-bottom:5px;">1. Assign / Update Jobs</h3>
      <textarea id="assignJobs" placeholder="Assign tasks or update current jobs..." style="width:100%; height:80px; padding:8px; border:1px solid #ccc; border-radius:6px;"></textarea>
    </div>

    <div style="margin-bottom:20px;">
      <h3 style="margin-bottom:5px;">2. Update Staff Details</h3>
      <input id="updatePhone" type="text" placeholder="Phone" style="width:48%; margin-right:4%; padding:6px; border-radius:6px; border:1px solid #ccc;">
      <input id="updateEmail" type="email" placeholder="Email" style="width:48%; padding:6px; border-radius:6px; border:1px solid #ccc;">
      <input id="updateDepartment" type="text" placeholder="Department" style="width:48%; margin-right:4%; margin-top:8px; padding:6px; border-radius:6px; border:1px solid #ccc;">
      <input id="updateShift" type="text" placeholder="Shift" style="width:48%; margin-top:8px; padding:6px; border-radius:6px; border:1px solid #ccc;">
    </div>

    <div style="margin-bottom:20px;">
      <h3 style="margin-bottom:5px;">3. Manage Availability</h3>
      <select id="updateStatus" style="width:100%; padding:6px; border-radius:6px; border:1px solid #ccc;">
        <option value="available">Available</option>
        <option value="on-job">On Job</option>
        <option value="offline">Offline</option>
      </select>
    </div>

    <div style="margin-bottom:20px;">
      <h3 style="margin-bottom:5px;">4. Equipment / Vehicles</h3>
      <textarea id="updateVehicles" placeholder="Assign/remove vehicles or equipment..." style="width:100%; height:60px; padding:8px; border:1px solid #ccc; border-radius:6px;"></textarea>
    </div>

    <div style="margin-bottom:20px;">
      <h3 style="margin-bottom:5px;">5. Administrative Actions</h3>
      <button id="suspendStaffBtn" style="background:#f44336; color:#fff; border:none; border-radius:6px; padding:8px 12px; cursor:pointer;">Suspend / Deactivate</button>
    </div>

    <button id="saveManageBtn" style="background:#4CAF50; color:#fff; border:none; border-radius:6px; padding:10px 15px; cursor:pointer; width:100%;">Save Changes</button>
  </div>
`;

document.body.appendChild(manageModal);



























// ========================
// ADD STAFF MODAL - JS ONLY
// ========================

function openAddStaffModal() {
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'addStaffOverlay';
    overlay.style.position = 'fixed';
    overlay.style.top = 0;
    overlay.style.left = 0;
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = 1000;

    // Create modal container
    const modal = document.createElement('div');
    modal.id = 'addStaffModal';
    modal.style.backgroundColor = '#fff';
    modal.style.padding = '20px';
    modal.style.borderRadius = '10px';
    modal.style.width = '400px';
    modal.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    modal.style.position = 'relative';
    modal.style.width = '400px';
    modal.style.maxHeight = '80vh'; // <-- Maximum 80% of viewport height
    modal.style.overflowY = 'auto'; // <-- Enable vertical scrolling
    modal.style.padding = '20px';
    modal.style.borderRadius = '10px';
    modal.style.boxShadow = '0 5px 15px rgba(0,0,0,0.3)';
    modal.style.position = 'relative';

    // Modal header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    const title = document.createElement('h2');
    title.textContent = 'Add New Staff Member';
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontSize = '24px';
    closeBtn.onclick = () => document.body.removeChild(overlay);
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Modal form
    const form = document.createElement('form');
    form.id = 'addStaffForm';

    form.style.marginTop = '30px';

    const fields = [
        { label: 'Name', type: 'text', name: 'name' },
        { label: 'Age', type: 'number', name: 'age' },
        { label: 'Gender', type: 'text', name: 'gender' },
        { label: 'Phone', type: 'text', name: 'phone' },
        { label: 'Supervisor', type: 'text', name: 'supervisor' },
        { label: 'Address', type: 'text', name: 'address' },
        { label: 'Description', type: 'text', name: 'role' },
        { label: 'Email', type: 'email', name: 'email' },
    ];

    fields.forEach(f => {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '10px';
        const lbl = document.createElement('label');
        lbl.textContent = f.label;
        lbl.style.display = 'block';
        lbl.style.marginBottom = '5px';
        const input = document.createElement('input');
        input.type = f.type;
        input.name = f.name;
        input.required = true;
        input.style.width = '100%';
        input.style.padding = '8px';
        input.style.borderRadius = '5px';        
        input.style.border = '1px solid #ccc';
        input.style.display = 'flex';
        wrapper.appendChild(lbl);
        wrapper.appendChild(input);
        form.appendChild(wrapper);
    });

    // Submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.textContent = 'Add Staff';
    submitBtn.style.padding = '10px 35px';
    submitBtn.style.border = 'none';
    submitBtn.style.borderRadius = '5px';
    submitBtn.style.backgroundColor = '#4CAF50';
    submitBtn.style.color = '#fff';
    submitBtn.style.cursor = 'pointer';

    form.appendChild(submitBtn);

    form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        console.log('New Staff:', Object.fromEntries(formData.entries()));
        // Close modal after submit
        document.body.removeChild(overlay);
    };

    // Append everything
    modal.appendChild(header);
    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// Example: attach to button
document.getElementById('addStaffBtn').addEventListener('click', openAddStaffModal);
