const BASE_URL = "http://localhost:8080";
let companyId = null;
let allVehicles = [];

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

async function loadVehicleStatistics() {
  try {
    const response = await fetch("/company/displayvehiclestatistics", {
      method: "POST",
    });
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

function renderVehicleStatistics(stats) {
  const statsGrid = document.getElementsByClassName("stats-grid")[0];
  statsGrid.innerHTML = "";

  function createStatsCard(iconClass, statusClass, label, value) {
    return `
            <div class="stat-card">
                <div class="stat-icon ${statusClass}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="stat-content">
                    <div class="stat-number">${value}</div>
                    <div class="stat-label">${label}</div>
                </div>
            </div>
        `;
  }

  statsGrid.innerHTML += createStatsCard(
    "fas fa-car",
    "total",
    "Total Vehicles",
    stats.totalVehicles || 0,
  );
  statsGrid.innerHTML += createStatsCard(
    "fas fa-check-circle",
    "available",
    "Available",
    stats.availableVehicles || 0,
  );
  statsGrid.innerHTML += createStatsCard(
    "fas fa-route",
    "on-trip",
    "On Trip",
    stats.onTripVehicles || 0,
  );
  statsGrid.innerHTML += createStatsCard(
    "fas fa-wrench",
    "maintenance",
    "Maintenance",
    stats.maintenanceVehicles || 0,
  );
}

async function loadVehicles(searchQuery = "") {
  const vehicleGrid = document.getElementById("vehicleGrid");
  handleEmptyCase("Loading vehicles...", "vehicleGrid");

  try {
    const response = await fetch(
      `${BASE_URL}/company/vehicle/list?company_id=${companyId}`,
    );

    if (!response.ok) {
      throw new Error("Failed to fetch vehicles");
    }

    const vehicles = await response.json();

    allVehicles = vehicles;

    console.log("Loaded vehicles:", allVehicles);

    vehicleGrid.innerHTML = "";

    if (!vehicles || vehicles.length === 0) {
      handleEmptyCase("No vehicles Found yet", "vehicleGrid");
      return;
    }

    renderVehicles(vehicles);
  } catch (err) {
    console.error("Error loading vehicles:", err);
    vehicleGrid.innerHTML = `<p>Error loading vehicles: ${err.message}</p>`;
  }
}

//delete vehicle
async function removeVehicle(vehicleId) {
  console.log("Deleting vehicle ID:", vehicleId);

  if (!vehicleId || vehicleId === undefined || vehicleId === "undefined") {
    showNotification("Invalid vehicle ID", "error");
    return;
  }

  if (!confirm("Are you sure you want to delete this vehicle?")) {
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/company/vehicle/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `vehicleid=${encodeURIComponent(vehicleId)}`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = "Delete failed";

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // not JSON
      }

      throw new Error(errorMessage);
    }

    showNotification("Vehicle deleted successfully!", "success");
    await loadVehicles();
    loadVehicleStatistics().then((stats) => {
      if (stats) renderVehicleStatistics(stats);
    });
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    showNotification("Failed to delete vehicle!", "error");
  }
}

function openAddModal() {
  document.getElementById("addVehicleModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeAddModal() {
  document.getElementById("addVehicleModal").classList.remove("active");
  document.body.style.overflow = "";
  document.getElementById("addVehicleForm").reset();
}

// update vehicle — pre-fills all editable fields including new dropdowns
async function openEditModal(vehicleId) {
  console.log("Opening edit modal for vehicle ID:", vehicleId);

  if (!vehicleId || vehicleId === undefined || vehicleId === "undefined") {
    showNotification("Invalid vehicle ID!", "error");
    return;
  }

  const modal = document.getElementById("editVehicleModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  try {
    const response = await fetch(
      `${BASE_URL}/company/vehicle/list?vehicleid=${vehicleId}`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched vehicle data:", data);

    if (!data || data.length === 0) {
      throw new Error("Vehicle not found");
    }

    const v = data[0];

    setValue("editVehicleId", v.vehicleId);
    setValue("editBrand", v.vehicleBrand);
    setValue("editModel", v.vehicleModel);
    setValue("editPlate", v.numberPlateNumber);
    setValue("editColor", v.color);
    setValue("editTareWeight", v.tareWeight);
    setValue("editEngineCapacity", v.engineCapacity);
    setValue("editPassengers", v.numberOfPassengers);
    setValue("editMilage", v.milage);
    setValue("editEngineNumber", v.engineNumber);
    setValue("editChasisNumber", v.chasisNumber);
    setValue("editDescription", v.description);

    setValue("editPricePerDay", v.pricePerDay);
    setValue("editLocation", v.location);
    setValue("editFeatures", v.features);

    // NEW: manufacture year + dropdowns
    setValue("editManufactureYear", v.manufactureYear);
    setSelectValue("editVehicleType", v.vehicleType);
    setSelectValue("editFuelType", v.fuelType);
    setSelectValue("editTransmission", v.transmission);

    // reset file inputs
    const regDoc = document.getElementById("editRegDoc");
    if (regDoc) regDoc.value = "";
    const img = document.getElementById("editImage");
    if (img) img.value = "";
  } catch (err) {
    console.error("Error fetching vehicle data:", err);
    showNotification("Failed to load vehicle details for update!", "error");
    closeEditModal();
  }
}

// helpers — guard against missing elements + null values
function setValue(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  el.value = val === null || val === undefined ? "" : val;
}

function setSelectValue(id, val) {
  const el = document.getElementById(id);
  if (!el) return;
  if (val === null || val === undefined || val === "") {
    el.value = "";
    return;
  }
  // Only set if the option exists; otherwise leave default so user must re-choose
  const match = Array.from(el.options).find(
    (o) => o.value.toLowerCase() === String(val).toLowerCase(),
  );
  el.value = match ? match.value : "";
}

function closeEditModal() {
  document.getElementById("editVehicleModal").classList.remove("active");
  document.body.style.overflow = "";
}

function redirectCalenderView(vehicleId) {
  if (!vehicleId) {
    showNotification("Invalid vehicle ID!", "error");
    return;
  }

  window.location.href = `/views/rentalcompany/management/html/fleet-calender.html?vehicleId=${encodeURIComponent(vehicleId)}`;
}

function redirectMaintenanceView(vehicleId) {
  if (!vehicleId) {
    showNotification("Invalid vehicle ID!", "error");
    return;
  }

  window.location.href = `/views/rentalcompany/management/html/maintenance-fleet.html?vehicleId=${encodeURIComponent(vehicleId)}`;
}

function renderVehicles(vehicles) {
  const vehicleGrid = document.getElementById("vehicleGrid");
  vehicleGrid.innerHTML = "";

  if (!vehicles || vehicles.length === 0) {
    handleEmptyCase("No vehicles Found yet", "vehicleGrid");
    return;
  }

  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i];

    const vehicleId = v.vehicleId;
    const imageUrl = `${BASE_URL}/vehicle/image?vehicleid=${vehicleId}`;

    const card = document.createElement("div");
    card.className = "vehicle-card";

    card.innerHTML = `
            <div>
                <h3 class="label">${v.status}</h3>
            </div>
            <div class="vehicle-image">
                  <img src="${imageUrl}" alt="${v.vehicleBrand} ${v.vehicleModel}" onerror="this.src='../assets/no-image.png'">
            </div>
            <div class="vehicle-info">
                  <h3>${v.vehicleBrand} ${v.vehicleModel}</h3>
                  <p><b>Plate:</b> ${v.numberPlateNumber}</p>
                  <p><b>Color:</b> ${v.color}</p>
                  <p><b>Engine:</b> ${v.engineCapacity} cc</p>
                  <p><b>Passengers:</b> ${v.numberOfPassengers}</p>
                  <p><b>Milage:</b> ${v.milage || "N/A"}</p>
                  <div class="vehicle-actions">
                    <button class="action-btn primary" onclick="openEditModal(${vehicleId})"><i class="fas fa-edit"></i> Update</button>
                    <button class="action-btn secondary" onclick="removeVehicle(${vehicleId})"><i class="fas fa-trash"></i> Delete</button>
                    <button class="redirect" onclick="redirectCalenderView(${vehicleId})">Calender View</button>
                  </div>
            </div>
        `;

    vehicleGrid.appendChild(card);
  }
}

function filterVehiclesByText(searchText) {
  let vehicleGrid = document.getElementById("vehicleGrid");

  const input = searchText.toLowerCase().trim();

  if (input === "") {
    renderVehicles(allVehicles);
    return;
  }

  const filteredVehicles = [];

  for (let i = 0; i < allVehicles.length; i++) {
    const v = allVehicles[i];

    const model = (v.vehicleModel || "").toLowerCase();
    const plate = (v.numberPlateNumber || "").toLowerCase();

    if (model.includes(input) || plate.includes(input)) {
      filteredVehicles.push(v);
    }
  }

  renderVehicles(filteredVehicles);
}

function filterVehiclesByStatus(status) {
  const filteredVehicles = [];

  for (let i = 0; i < allVehicles.length; i++) {
    const vehicleStatus = (allVehicles[i].status || "").toLowerCase();

    if (status === "all") {
      filteredVehicles.push(allVehicles[i]);
    } else if (status === "maintenance") {
      if (vehicleStatus.includes("maintenance")) {
        filteredVehicles.push(allVehicles[i]);
      }
    } else if (status === "available") {
      if (vehicleStatus.includes("available")) {
        filteredVehicles.push(allVehicles[i]);
      }
    } else if (status === "on-trip") {
      if (vehicleStatus.includes("trip")) {
        filteredVehicles.push(allVehicles[i]);
      }
    }
  }

  renderVehicles(filteredVehicles);
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

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const loggedIn = await checkLogin();

    if (!loggedIn) {
      return;
    }

    await loadVehicles();

    const stats = await loadVehicleStatistics();

    if (stats) {
      renderVehicleStatistics(stats);
    }

    document
      .getElementById("vehicleFilter")
      .addEventListener("change", function () {
        filterVehiclesByStatus(this.value);
      });
  } catch (err) {
    console.error("Error during initialization:", err);
  }
});

document.getElementById("vehicleSearch").addEventListener("input", function () {
  filterVehiclesByText(this.value);
});

document
  .getElementById("addVehicleBtn")
  .addEventListener("click", openAddModal);

//Add vehicle
document
  .getElementById("addVehicleForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    let numberPlate = document.getElementById("numberplatenumber").value;
    let pricePerDay = document.getElementById("priceperday").value;

    if (!validateSriLankaVehicleFields(numberPlate, pricePerDay)) {
      return;
    }

    const formData = new FormData(this);
    formData.append("company_id", companyId);

    try {
      const response = await fetch(
        `${BASE_URL}/company/vehicle/add?company_id=${companyId}`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      console.log("data:", data);

      if (data.status === "success") {
        showNotification("Vehicle registered successfully!", "success");
        closeAddModal();
        this.reset();
        await loadVehicles();
        loadVehicleStatistics().then((stats) => {
          if (stats) renderVehicleStatistics(stats);
        });
      } else {
        throw new Error(data.message || "Failed to add vehicle");
      }
    } catch (err) {
      console.error("Error adding vehicle:", err);
      showNotification(err.message || "Failed to register vehicle!", "error");
    }
  });

document
  .getElementById("closeAddVehicleModal")
  .addEventListener("click", closeAddModal);

//save changes
document
  .getElementById("editVehicleForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const plateEl = document.getElementById("editPlate");
    const priceEl = document.getElementById("editPricePerDay");
    if (plateEl && priceEl) {
      if (!validateSriLankaVehicleFields(plateEl.value, priceEl.value)) {
        return;
      }
    }

    const formData = new FormData(this);
    formData.append("company_id", companyId);

    try {
      const response = await fetch(`${BASE_URL}/company/vehicle/update`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.status === "success") {
        showNotification("Vehicle updated successfully!", "success");
        closeEditModal();
        await loadVehicles();
        loadVehicleStatistics().then((stats) => {
          if (stats) renderVehicleStatistics(stats);
        });
      } else {
        throw new Error(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Error updating vehicle:", err);
      showNotification(err.message || "Failed to update vehicle!", "error");
    }
  });

document
  .getElementById("closeEditVehicleModal")
  .addEventListener("click", closeEditModal);

function showNotification(message, type = "info") {
  const notification = document.createElement("div");

  notification.textContent = message;

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

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function validateSriLankaVehicleFields(numberPlate, pricePerDay) {
  const plateRegex =
    /^([A-Z]{2,3}[- ]?[A-Z]{1,3}[- ]?\d{3,4}|\d{2}[- ]?\d{3,4})$/i;

  if (!plateRegex.test(numberPlate.trim())) {
    showNotification("Invalid Sri Lankan number plate format!", "error");
    return false;
  }

  const price = Number(pricePerDay);

  if (isNaN(price) || price <= 0) {
    showNotification("Invalid price per day!", "error");
    return false;
  }

  if (price < 500 || price > 500000) {
    showNotification("Price must be between Rs.500 and Rs.500,000", "error");
    return false;
  }

  return true;
}
