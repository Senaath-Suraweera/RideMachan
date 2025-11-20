// ===============================
// Vehicle Fleet Management (Company Side) - REFACRORED
// ===============================
const BASE_URL = "http://localhost:8080";
const companyId = 7; // Replace with dynamic ID from sessionStorage/localStorage if available

document.addEventListener("DOMContentLoaded", loadVehicles);

// ================= LOAD VEHICLES =================
async function loadVehicles() {
  const vehicleGrid = document.getElementById("vehicleGrid");
  vehicleGrid.innerHTML = `<p>Loading vehicles...</p>`;

  try {
    const response = await fetch(
      `${BASE_URL}/vehicle/list?company_id=${companyId}`
    );
    if (!response.ok) throw new Error("Failed to fetch vehicles");
    const vehicles = await response.json();

    console.log("Loaded vehicles:", vehicles);

    vehicleGrid.innerHTML = "";

    if (!vehicles || vehicles.length === 0) {
      vehicleGrid.innerHTML = `<p>No vehicles registered yet.</p>`;
      return;
    }

    vehicles.forEach((v) => {
      // Use vehicleId (camelCase) - consistent with provider side
      const vehicleId = v.vehicleId;
      const imageUrl = `${BASE_URL}/vehicle/image?vehicleid=${vehicleId}`;

      const card = document.createElement("div");
      card.className = "vehicle-card";
      card.innerHTML = `
        <div class="vehicle-image">
          <img src="${imageUrl}" alt="${v.vehicleBrand} ${
        v.vehicleModel
      }" onerror="this.src='../assets/no-image.png'">
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
          </div>
        </div>
      `;
      vehicleGrid.appendChild(card);
    });
  } catch (err) {
    console.error("Error loading vehicles:", err);
    vehicleGrid.innerHTML = `<p>Error loading vehicles: ${err.message}</p>`;
  }
}

// ================= ADD VEHICLE (Refactored to match provider style) =================
document
  .getElementById("addVehicleForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    formData.append("company_id", companyId);

    try {
      const response = await fetch(`${BASE_URL}/vehicle/add`, {
        method: "POST",
        body: formData,
      });

      // The backend returns a JSON object with 'status' and 'message' (as seen in the original add logic)
      const data = await response.json();

      if (data.status === "success") {
        alert("✅ Vehicle registered successfully!");
        closeAddModal();
        this.reset(); // Reset the form after success
        loadVehicles();
      } else {
        throw new Error(data.message || "Failed to add vehicle");
      }
    } catch (err) {
      console.error("Error adding vehicle:", err);
      alert("❌ Failed to register vehicle: " + err.message);
    }
  });

function openAddModal() {
  document.getElementById("addVehicleModal").classList.add("active");
  document.body.style.overflow = "hidden"; // Added from provider side for consistency
}

function closeAddModal() {
  document.getElementById("addVehicleModal").classList.remove("active");
  document.body.style.overflow = ""; // Added from provider side for consistency
  document.getElementById("addVehicleForm").reset(); // Ensure reset is called
}

document
  .getElementById("addVehicleBtn")
  .addEventListener("click", openAddModal);

// Use a common class/ID for closing modals if possible, or keep original close listeners
document
  .getElementById("closeAddVehicleModal")
  .addEventListener("click", closeAddModal);

// ================= UPDATE VEHICLE (Refactored to fetch all details) =================
async function openEditModal(vehicleId) {
  console.log("Opening edit modal for vehicle ID:", vehicleId);

  if (!vehicleId || vehicleId === undefined || vehicleId === "undefined") {
    alert("Invalid vehicle ID");
    return;
  }

  const modal = document.getElementById("editVehicleModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  try {
    // Fetch all details using the same endpoint pattern as the provider side's update
    const response = await fetch(
      `${BASE_URL}/vehicle/list?vehicleid=${vehicleId}`
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

    // Populate all fields - use camelCase property names consistent with my-vehicles.js
    document.getElementById("editVehicleId").value = v.vehicleId || "";
    document.getElementById("editBrand").value = v.vehicleBrand || "";
    document.getElementById("editModel").value = v.vehicleModel || "";
    document.getElementById("editPlate").value = v.numberPlateNumber || "";
    document.getElementById("editColor").value = v.color || "";
    document.getElementById("editTareWeight").value = v.tareWeight || "";
    document.getElementById("editEngineCapacity").value =
      v.engineCapacity || "";
    document.getElementById("editPassengers").value =
      v.numberOfPassengers || "";
    document.getElementById("editMilage").value = v.milage || "";
    document.getElementById("editEngineNumber").value = v.engineNumber || "";
    document.getElementById("editChasisNumber").value = v.chasisNumber || "";
    document.getElementById("editDescription").value = v.description || "";
    // Note: If you don't have all these input fields in your HTML for the company edit modal,
    // you'll need to add them or only populate the ones that exist.
  } catch (err) {
    console.error("Error fetching vehicle data:", err);
    alert("Failed to load vehicle details for update. Error: " + err.message);
    closeEditModal();
  }
}

function closeEditModal() {
  document.getElementById("editVehicleModal").classList.remove("active");
  document.body.style.overflow = "";
}

document
  .getElementById("closeEditVehicleModal")
  .addEventListener("click", closeEditModal);

// ================= SAVE CHANGES (Refactored to use form submit event and FormData) =================
document
  .getElementById("editVehicleForm") // Assuming the modal content is wrapped in a form with this ID
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    formData.append("company_id", companyId);

    try {
      const response = await fetch(`${BASE_URL}/vehicle/update`, {
        method: "POST",
        body: formData,
      });

      // Based on the original vehicle-fleet update logic, the response is JSON
      const data = await response.json();

      if (data.status === "success") {
        alert("✅ Vehicle updated successfully!");
        closeEditModal();
        loadVehicles();
      } else {
        throw new Error(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Error updating vehicle:", err);
      alert("❌ Failed to update vehicle: " + err.message);
    }
  });

// ================= DELETE VEHICLE =================
async function removeVehicle(vehicleId) {
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
      // Attempt to parse error message if available, similar to my-vehicles.js
      const errorText = await response.text();
      let errorMessage = "Delete failed";
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // not a JSON response, use generic message
      }
      throw new Error(errorMessage);
    }

    alert("🗑️ Vehicle deleted successfully!");
    loadVehicles();
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    alert("❌ Failed to delete vehicle: " + err.message);
  }
}
