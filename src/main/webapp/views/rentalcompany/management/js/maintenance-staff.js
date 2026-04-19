let companyId = null;
let AllMaintenaceStaff;

async function checkLogin() {
  try {
    const response = await fetch("/checklogin");
    const data = await response.json();

    if (!data.loggedIn) {
      const modal = document.getElementById("loginModal");
      modal.style.display = "flex";

      document.getElementById("loginOkBtn").onclick = () => {
        window.location.href = "/companylogin";
      };

      return false;
    }

    companyId = data.companyId;

    console.log("User is logged in.");
    return true;
  } catch (err) {
    console.error("Error checking login:", err);
    return false;
  }
}

async function loadStaffStatistics() {
  try {
    const response = await fetch("/displaystaffstatistics", { method: "POST" });
    console.log(response);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    console.log(data);

    return data;
  } catch (err) {
    console.log(err);
  }
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

function renderStaffStatistics(stats) {
  const statsGrid = document.getElementsByClassName("stats-grid")[0];
  statsGrid.innerHTML = "";

  function createStatsCard(statusClass, label, value) {
    return `
            <div class="stat-card ${statusClass}">
                <div class="stat-number">${value}</div>
                <div class="stat-label">${label}</div>
            </div>
        `;
  }

  statsGrid.innerHTML += createStatsCard(
    "",
    "Total Staff",
    stats.totalStaff || 0,
  );
  statsGrid.innerHTML += createStatsCard(
    "available",
    "Available",
    stats.availableStaff || 0,
  );
  statsGrid.innerHTML += createStatsCard(
    "on-job",
    "On Job",
    stats.onJobStaff || 0,
  );
  statsGrid.innerHTML += createStatsCard(
    "offline",
    "Offline",
    stats.offlineStaff || 0,
  );
  statsGrid.innerHTML += createStatsCard(
    "vehicles",
    "Total Vehicles",
    stats.totalVehicles || 0,
  );
}

async function loadAllMaintenanceStaff() {
  try {
    const response = await fetch("/display/maintenancestaff", {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    let data = await response.json();

    console.log(data);

    return data;
  } catch (err) {
    console.log(err);
  }
}

function renderMaintenanceStaff(maintenanceStaffs) {
  const staffGrid = document.getElementsByClassName("staff-grid")[0];
  staffGrid.innerHTML = "";

  if (!maintenanceStaffs || maintenanceStaffs.length === 0) {
    handleEmptyCase("No Maintenance Staff Found", "staff-grid");
    return;
  }

  let status;

  maintenanceStaffs.forEach((maintenanceStaff) => {
    maintenanceStaff.initials =
      maintenanceStaff.initials || maintenanceStaff.firstname?.[0] || "";

    status = maintenanceStaff.status
      ? maintenanceStaff.status.charAt(0).toUpperCase() +
        maintenanceStaff.status.slice(1).toLowerCase()
      : "";

    maintenanceStaff.specialization = maintenanceStaff.specialization || "";
    maintenanceStaff.completedJobs = maintenanceStaff.completedJobs || 0;
    maintenanceStaff.assignedVehicles = maintenanceStaff.assignedVehicles || [];
    maintenanceStaff.moreVehiclesCount =
      maintenanceStaff.moreVehiclesCount || 0;
    maintenanceStaff.certifications = maintenanceStaff.certifications || [];
    maintenanceStaff.yearsOfExperience =
      maintenanceStaff.yearsOfExperience || 0;

    const staffCard = document.createElement("div");
    staffCard.className = "staff-card";
    staffCard.dataset.status = maintenanceStaff.status;

    staffCard.innerHTML = `                  
                          <div class="staff-header">
                              <div class="staff-avatar">${maintenanceStaff.initials}</div>
                              <div class="staff-info">
                                  <h3 class="staff-name">${maintenanceStaff.firstname + " " + maintenanceStaff.lastname}</h3>
                                  <p class="staff-id">Staff ID: ${maintenanceStaff.staffId}</p>
                                  <div class="staff-jobs">
                                      <i class="fas fa-star rating-star"></i>  
                                      <span class="job-count">(${maintenanceStaff.completedJobs} jobs)</span>
                                  </div>
                              </div>
                              <div class="staff-status status-badge ${maintenanceStaff.status}">${status}</div>
                          </div>
                          <div class="staff-details">
                              <div class="detail-item"><i class="fas fa-phone detail-icon"></i><span>+ ${maintenanceStaff.contactNumber}</span></div>
                              <div class="detail-item"><i class="fas fa-calendar detail-icon"></i><span>Years of Experience: ${maintenanceStaff.yearsOfExperience}</span></div>
                              <div class="detail-item"><i class="fas fa-car detail-icon"></i><span>Assigned Vehicles: ${maintenanceStaff.assignedVehicles.length}</span></div>
                              <div class="detail-item"><i class="fas fa-wrench detail-icon"></i><span>${maintenanceStaff.specialization}</span></div>  
                          </div>
                          <div class="staff-badges">
                              ${maintenanceStaff.certifications.map((cert) => `<span class="badge">${cert}</span>`).join("")}
                          </div>
                          <div class="staff-actions">
                              <a onclick="reDirectAssignedVehiclePage(${maintenanceStaff.staffId},${maintenanceStaff.firstName},${maintenanceStaff.lastName})" style="text-decoration: none">
                                  <button class="action-btn primary" data-staff-id="${maintenanceStaff.staffId}">
                                          View Assigned Vehicles
                                  </button> 
                              </a>
                                                        
                          </div>                         
                       `;

    staffGrid.appendChild(staffCard);
  });
}

function reDirectAssignedVehiclePage(staffId, firstName, lastName) {
  window.location.href = `/views/rentalcompany/management/html/maintenance-vehicle-assignment.html?staffId=${staffId}&firstname=${firstName}&lastname=${lastName}`;
}

//for search by staff id
function filterStaffByStaffId(staffId) {
  const staffGrid = document.getElementsByClassName("staff-grid")[0];
  staffGrid.innerHTML = "";

  let filteredStaff = [];

  for (let i = 0; i < AllMaintenaceStaff.length; i++) {
    if (AllMaintenaceStaff[i].staffId == staffId) {
      filteredStaff.push(AllMaintenaceStaff[i]);
    }
  }

  renderMaintenanceStaff(filteredStaff);
}

// Search staff by name or specialization
function filterStaffByText(searchText) {
  const staffGrid = document.getElementsByClassName("staff-grid")[0];
  staffGrid.innerHTML = "";

  let inputLower = searchText.toLowerCase().trim();
  let filteredStaff = [];

  for (let i = 0; i < AllMaintenaceStaff.length; i++) {
    let staff = AllMaintenaceStaff[i];

    let staffName = (staff.firstname + " " + staff.lastname)
      .toLowerCase()
      .trim();
    let specialization = (staff.specialization || "").toLowerCase().trim();

    if (staffName.includes(inputLower) || specialization.includes(inputLower)) {
      filteredStaff.push(staff);
    }
  }

  console.log("Filtered staff count:", filteredStaff.length);
  renderMaintenanceStaff(filteredStaff);
}

//search Available,On Job,available staff
function filterStaffByStaffStatus(status) {
  const selectedStatus = (status || "").toLowerCase();

  let availableStaff = [];
  let onJobStaff = [];
  let offlineStaff = [];

  for (let i = 0; i < AllMaintenaceStaff.length; i++) {
    const staff = AllMaintenaceStaff[i];
    const staffStatus = (staff.status || "").toLowerCase();

    if (staffStatus.includes("available")) {
      availableStaff.push(staff);
    } else if (staffStatus.includes("on")) {
      onJobStaff.push(staff);
    } else if (staffStatus.includes("offline")) {
      offlineStaff.push(staff);
    }
  }

  if (selectedStatus === "all") {
    renderMaintenanceStaff(AllMaintenaceStaff);
  } else if (selectedStatus === "available") {
    renderMaintenanceStaff(availableStaff);
  } else if (selectedStatus === "on_job") {
    renderMaintenanceStaff(onJobStaff);
  } else if (selectedStatus === "offline") {
    renderMaintenanceStaff(offlineStaff);
  }
}

function openAddStaffModal() {
  const modal = document.getElementById("addStaffModal");
  modal.style.display = "block";
  modal.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
}

function closeAddStaffModal() {
  let addStaffModal = document.getElementById("addStaffModal");
  addStaffModal.style.display = "none";
  document.body.style.overflow = "auto";

  const form = document.getElementById("addStaffForm");
  form.reset();
}

async function addMaintenanceStaff() {
  const addStaffForm = document.getElementById("addStaffForm");

  const username = addStaffForm.username.value;
  const firstname = addStaffForm.firstname.value;
  const lastname = addStaffForm.lastname.value;
  const contactNumber = addStaffForm.contactNumber.value;
  const email = addStaffForm.email.value;
  const specialization = addStaffForm.specialization.value;
  const yearsOfExperience = addStaffForm.yearsOfExperience.value;
  const password = addStaffForm.password.value;
  const confirmPassword = addStaffForm.confirmPassword.value;

  if (!validateField(username, { required: true, minLength: 3 }, "Username"))
    return;
  if (!validateField(firstname, { required: true, type: "name" }, "First Name"))
    return;
  if (!validateField(lastname, { required: true, type: "name" }, "Last Name"))
    return;
  if (
    !validateField(
      contactNumber,
      { required: true, type: "mobile" },
      "Mobile Number",
    )
  )
    return;
  if (!validateField(email, { required: true, type: "email" }, "Email")) return;
  if (
    !validateField(
      specialization,
      { required: true, minLength: 3 },
      "Specialization",
    )
  )
    return;
  if (
    !validateField(
      yearsOfExperience,
      { required: true, type: "experience" },
      "Experience",
    )
  )
    return;
  if (
    !validateField(password, { required: true, type: "password" }, "Password")
  )
    return;

  if (password !== confirmPassword) {
    showNotification("Passwords do not match", "error");
    return;
  }

  const data = {
    username,
    firstname,
    lastname,
    contactNumber,
    email,
    password,
    companyId,
    specialization,
    yearsOfExperience: parseFloat(yearsOfExperience),
  };

  const response = await fetch("/maintenancestaff/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (result.status === "success") {
    showNotification("Staff added successfully!", "success");
    closeAddStaffModal();

    AllMaintenaceStaff = await loadAllMaintenanceStaff();
    renderMaintenanceStaff(AllMaintenaceStaff);

    const stats = await loadStaffStatistics();

    if (stats) {
      renderStaffStatistics(stats);
    }
  } else {
    showNotification("Staff adding is Failrd", "error");
  }
}

function handleEmptyCase(message, containerId = "container") {
  const container = document.getElementById(containerId);

  if (!container) return;

  container.innerHTML = "";

  const emptyCard = document.createElement("div");

  emptyCard.innerHTML = `
        <h2 class="empty-title">${message}</h2>
        <p class="empty-sub">Nothing to display right now</p>
    `;

  emptyCard.style.width = "100%";
  emptyCard.style.maxWidth = "900px";
  emptyCard.style.margin = "0 auto";
  emptyCard.style.padding = "50px 25px";
  emptyCard.style.borderRadius = "18px";
  emptyCard.style.background = "linear-gradient(135deg, #ffffff, #f8f9ff)";
  emptyCard.style.boxShadow = "0 10px 30px rgba(58, 12, 163, 0.15)";
  emptyCard.style.border = "1px solid rgba(58, 12, 163, 0.1)";
  emptyCard.style.textAlign = "center";
  emptyCard.style.gridColumn = "1 / -1";

  emptyCard.style.transition = "all 0.3s ease";
  emptyCard.style.cursor = "default";

  emptyCard.style.position = "relative";

  const title = emptyCard.querySelector(".empty-title");

  title.style.margin = "0";
  title.style.fontSize = "22px";
  title.style.fontWeight = "700";
  title.style.background = "linear-gradient(90deg, #3a0ca3, #4361ee, #f72585)";
  title.style.webkitBackgroundClip = "text";
  title.style.webkitTextFillColor = "transparent";
  title.style.backgroundClip = "text";
  title.style.letterSpacing = "0.5px";

  const sub = emptyCard.querySelector(".empty-sub");

  sub.style.marginTop = "10px";
  sub.style.fontSize = "14px";
  sub.style.color = "#6c757d";
  sub.style.opacity = "0.9";

  emptyCard.onmouseover = () => {
    emptyCard.style.transform = "translateY(-6px) scale(1.01)";
    emptyCard.style.boxShadow = "0 18px 40px rgba(67, 97, 238, 0.25)";
  };

  emptyCard.onmouseout = () => {
    emptyCard.style.transform = "translateY(0) scale(1)";
    emptyCard.style.boxShadow = "0 10px 30px rgba(58, 12, 163, 0.15)";
  };

  container.appendChild(emptyCard);
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const loggedIn = await checkLogin();

    if (!loggedIn) {
      return; // stop here if not logged in
    }

    AllMaintenaceStaff = await loadAllMaintenanceStaff();
    renderMaintenanceStaff(AllMaintenaceStaff);

    const stats = await loadStaffStatistics();

    if (stats) {
      renderStaffStatistics(stats);
    }
  } catch (err) {
    console.error("Error during initialization:", err);
  }
});

document
  .getElementById("addStaffModal")
  .addEventListener("click", function (event) {
    if (event.target === this) {
      closeAddStaffModal();
    }
  });

document
  .getElementById("addStaffForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    await addMaintenanceStaff();
  });

document
  .getElementById("staffSearch")
  .addEventListener("input", async function () {
    let staffInput = document.getElementById("staffSearch");
    let inputValue = staffInput.value;

    inputValue = inputValue.trim();

    console.log("Input value:", inputValue, "isNaN:", isNaN(inputValue));

    if (inputValue === "") {
      AllMaintenaceStaff = await loadAllMaintenanceStaff();
      renderMaintenanceStaff(AllMaintenaceStaff);
      return;
    }

    if (!isNaN(inputValue)) {
      filterStaffByStaffId(inputValue);
    } else {
      filterStaffByText(inputValue);
    }
  });

document.getElementById("staffFilter").addEventListener("change", function () {
  filterStaffByStaffStatus(this.value);
});

const SriLankaValidation = {
  mobile(value) {
    value = (value ?? "").trim();
    return /^07\d{8}$/.test(value) || /^\+947\d{8}$/.test(value);
  },

  name(value) {
    value = (value ?? "").trim();
    return /^[A-Za-z\s]{2,50}$/.test(value);
  },

  email(value) {
    value = (value ?? "").trim();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  password(value) {
    value = (value ?? "").trim();
    return value.length >= 6 && value.length <= 20;
  },

  experience(value) {
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= 60;
  },

  required(value) {
    return (value ?? "").toString().trim().length > 0;
  },
};

function validateField(value, rules, fieldName = "Field") {
  value = (value ?? "").toString().trim();

  if (rules.required && !SriLankaValidation.required(value)) {
    showNotification(`${fieldName} is required`, "error");
    return false;
  }

  if (rules.minLength && value.length < rules.minLength) {
    showNotification(
      `${fieldName} must be at least ${rules.minLength} characters`,
      "error",
    );
    return false;
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    showNotification(
      `${fieldName} must be less than ${rules.maxLength} characters`,
      "error",
    );
    return false;
  }

  if (rules.type === "name" && !SriLankaValidation.name(value)) {
    showNotification(`${fieldName} is invalid`, "error");
    return false;
  }

  if (rules.type === "mobile" && !SriLankaValidation.mobile(value)) {
    showNotification(`Invalid mobile number`, "error");
    return false;
  }

  if (rules.type === "email" && !SriLankaValidation.email(value)) {
    showNotification(`Invalid email`, "error");
    return false;
  }

  if (rules.type === "password" && !SriLankaValidation.password(value)) {
    showNotification(`Invalid password`, "error");
    return false;
  }

  if (rules.type === "experience" && !SriLankaValidation.experience(value)) {
    showNotification(`Invalid experience`, "error");
    return false;
  }

  return true;
}
