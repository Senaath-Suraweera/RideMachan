const BASE_URL = "http://localhost:8080";
const providerId = 5; // fallback for testing
// const providerId = localStorage.getItem("provider_id");

document.addEventListener("DOMContentLoaded", loadVehicles);

// ================= LOAD VEHICLES =================
async function loadVehicles() {
  const vehiclesGrid = document.getElementById("vehiclesGrid");
  vehiclesGrid.innerHTML = `<p>Loading vehicles...</p>`;

  try {
    const response = await fetch(
      `${BASE_URL}/vehicle/list?provider_id=${providerId}`
    );
    if (!response.ok) throw new Error("Failed to fetch vehicles");
    const vehicles = await response.json();

    console.log("Loaded vehicles:", vehicles); // Debug log

    vehiclesGrid.innerHTML = "";

    if (!vehicles || vehicles.length === 0) {
      vehiclesGrid.innerHTML = `<p>No vehicles registered yet.</p>`;
      return;
    }

    vehicles.forEach((v) => {
      // Use vehicleId (camelCase) - this is how Gson serializes it
      const vehicleId = v.vehicleId;
      const imageUrl = `${BASE_URL}/vehicle/image?vehicleid=${vehicleId}`;

      const card = document.createElement("div");
      card.className = "vehicle-card";
      card.innerHTML = `
        <div class="vehicle-image"><img src="${imageUrl}" alt="${
        v.vehicleBrand
      } ${v.vehicleModel}">
        </div>
        <div class="vehicle-info">
          <h3>${v.vehicleBrand} ${v.vehicleModel}</h3>
          <p><b>Plate:</b> ${v.numberPlateNumber}</p>
          <p><b>Color:</b> ${v.color}</p>
          <p><b>Engine:</b> ${v.engineCapacity} cc</p>
          <p><b>Passengers:</b> ${v.numberOfPassengers}</p>
          <p><b>Milage:</b> ${v.milage || "N/A"}</p>
          <div class="vehicle-buttons">
            <button class="btn btn-primary" onclick="openUpdateModal(${vehicleId})">Update</button>
            <button class="btn btn-danger" onclick="deleteVehicle(${vehicleId})">Delete</button>
          </div>
        </div>
      `;
      vehiclesGrid.appendChild(card);
    });
  } catch (err) {
    vehiclesGrid.innerHTML = `<p>Error loading vehicles.</p>`;
    console.error("Error loading vehicles:", err);
  }
}

// ================= REGISTER VEHICLE =================
document
  .getElementById("registerVehicleForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    formData.append("provider_id", providerId);

    try {
      const response = await fetch(`${BASE_URL}/vehicle/add`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to add vehicle");

      alert("✅ Vehicle registered successfully!");
      closeRegisterModal();
      this.reset();
      loadVehicles();
    } catch (err) {
      console.error("Error registering vehicle:", err);
      alert("❌ Failed to register vehicle.");
    }
  });

function openRegisterModal() {
  document.getElementById("registerVehicleModal").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeRegisterModal() {
  document.getElementById("registerVehicleModal").classList.remove("active");
  document.body.style.overflow = "";
}

// ================= UPDATE VEHICLE =================
async function openUpdateModal(vehicleId) {
  console.log("Opening update modal for vehicle ID:", vehicleId); // Debug log

  if (!vehicleId || vehicleId === undefined || vehicleId === "undefined") {
    alert("Invalid vehicle ID");
    return;
  }

  const modal = document.getElementById("updateVehicleModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  try {
    const response = await fetch(
      `${BASE_URL}/vehicle/list?vehicleid=${vehicleId}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Fetched vehicle data:", data); // Debug log

    if (!data || data.length === 0) {
      throw new Error("Vehicle not found");
    }

    const v = data[0];

    // Populate fields - use camelCase property names
    document.getElementById("updateVehicleId").value = v.vehicleId || "";
    document.getElementById("updateBrand").value = v.vehicleBrand || "";
    document.getElementById("updateModel").value = v.vehicleModel || "";
    document.getElementById("updatePlate").value = v.numberPlateNumber || "";
    document.getElementById("updateColor").value = v.color || "";
    document.getElementById("updateTareWeight").value = v.tareWeight || "";
    document.getElementById("updateEngineCapacity").value =
      v.engineCapacity || "";
    document.getElementById("updatePassengers").value =
      v.numberOfPassengers || "";
    document.getElementById("updateMilage").value = v.milage || "";
    document.getElementById("updateEngineNumber").value = v.engineNumber || "";
    document.getElementById("updateChasisNumber").value = v.chasisNumber || "";
    document.getElementById("updateDescription").value = v.description || "";
  } catch (err) {
    console.error("Error fetching vehicle data:", err);
    alert("Failed to load vehicle details for update. Error: " + err.message);
    closeUpdateModal();
  }
}

function closeUpdateModal() {
  document.getElementById("updateVehicleModal").classList.remove("active");
  document.body.style.overflow = "";
}

document
  .getElementById("updateVehicleForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    formData.append("provider_id", providerId);

    try {
      const response = await fetch(`${BASE_URL}/vehicle/update`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Update failed");

      alert("✅ Vehicle updated successfully!");
      closeUpdateModal();
      loadVehicles();
    } catch (err) {
      console.error("Error updating vehicle:", err);
      alert("❌ Failed to update vehicle.");
    }
  });

// ================= DELETE VEHICLE =================
async function deleteVehicle(vehicleId) {
  console.log("Deleting vehicle ID:", vehicleId); // Debug log

  if (!vehicleId || vehicleId === undefined || vehicleId === "undefined") {
    alert("Invalid vehicle ID");
    return;
  }

  if (!confirm("Are you sure you want to delete this vehicle?")) return;

  try {
    const response = await fetch(`${BASE_URL}/vehicle/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `vehicleid=${encodeURIComponent(vehicleId)}`,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Delete failed");
    }

    alert("🗑️ Vehicle deleted successfully!");
    loadVehicles();
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    alert("❌ Failed to delete vehicle: " + err.message);
  }
}
