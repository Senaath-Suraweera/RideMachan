// my-vehicles.js (UPDATED: fetch providerId from backend session via /api/vehicles/me)

const BASE_URL = "http://localhost:8080";
// If you have context path:
// const BASE_URL = "http://localhost:8080/RideMachan";

const API_BASE = `${BASE_URL}/api/vehicles`;

// providerId will be loaded from session (NO localStorage fallback)
let providerId = null;

// Offline fallback image (no internet/DNS needed)
const FALLBACK_IMG =
  "data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22250%22><rect width=%22100%25%22 height=%22100%25%22 fill=%22%23f1f3f5%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%236c757d%22 font-size=%2220%22 font-family=%22Arial%22>No Image</text></svg>";

document.addEventListener("DOMContentLoaded", async () => {
  // 1) Get providerId from backend session
  providerId = await getProviderIdFromSession();

  if (!providerId) {
    console.error("No provider session found.");
    const grid = document.getElementById("vehiclesGrid");
    if (grid)
      grid.innerHTML = `<p>Session expired / not logged in. Please login again.</p>`;
    return;
  }

  // 2) Load vehicles
  loadVehicles();

  // 3) Bind forms
  document
    .getElementById("registerVehicleForm")
    .addEventListener("submit", registerVehicle);

  document
    .getElementById("updateVehicleForm")
    .addEventListener("submit", updateVehicle);
});

// ---------- Helper: always send cookies ----------
async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include", // ✅ send JSESSIONID
  });
}

// ---------- NEW: get providerId from session ----------
async function getProviderIdFromSession() {
  try {
    const res = await apiFetch(`${API_BASE}/me`);
    if (!res.ok) return null;

    const me = await res.json();
    // response expected: { actor:"PROVIDER", providerId: 4, ... }
    return Number(me.providerId) || null;
  } catch (e) {
    console.error("Failed to fetch /me:", e);
    return null;
  }
}

// ================= LOAD VEHICLES =================
async function loadVehicles() {
  const vehiclesGrid = document.getElementById("vehiclesGrid");
  vehiclesGrid.innerHTML = `<p>Loading vehicles...</p>`;

  try {
    // Uses providerId from session->/me, then filters list by provider_id
    const response = await apiFetch(
      `${API_BASE}?provider_id=${providerId}&limit=200`,
    );

    if (response.status === 401) {
      vehiclesGrid.innerHTML = `<p>Session expired. Please login again.</p>`;
      return;
    }
    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const vehicles = Array.isArray(data) ? data : data.vehicles || [];

    vehiclesGrid.innerHTML = "";

    if (!vehicles || vehicles.length === 0) {
      vehiclesGrid.innerHTML = `<p>No vehicles registered yet.</p>`;
      return;
    }

    vehicles.forEach((v) => {
      const vehicleId = v.vehicleid;
      const imageUrl = `${API_BASE}/${vehicleId}/image`;

      const card = document.createElement("div");
      card.className = "vehicle-card";

      const statusClass = (v.availability_status || "available").toLowerCase();
      const statusLabel = v.availability_status || "available";

      const featuresArr = (v.features || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 6);

      card.innerHTML = `
        <div class="vehicle-image">
          <img src="${imageUrl}"
               alt="${safe(v.vehiclebrand)} ${safe(v.vehiclemodel)}"
               onerror="this.onerror=null;this.src='${FALLBACK_IMG}'">
          <div class="vehicle-status ${safe(statusClass)}">${safe(statusLabel)}</div>
        </div>

        <div class="vehicle-info">
          <div class="vehicle-name">${safe(v.vehiclebrand)} ${safe(v.vehiclemodel)}</div>

          <div class="vehicle-price">Rs. ${safe(v.price_per_day ?? "0.00")} / day</div>

          <div class="vehicle-category">
            <i class="fa-solid fa-car"></i>
            ${safe(v.vehicle_type || "N/A")} • ${safe(v.fuel_type || "N/A")} • ${safe(v.transmission || "N/A")}
            ${v.manufacture_year ? `• ${safe(v.manufacture_year)}` : ""}
          </div>

          <div class="vehicle-location">
            <i class="fa-solid fa-location-dot"></i>
            ${safe(v.location || "N/A")}
          </div>

          <p><b>Plate:</b> ${safe(v.numberplatenumber)}</p>
          <p><b>Passengers:</b> ${safe(v.numberofpassengers || "0")} | <b>Engine:</b> ${safe(v.enginecapacity || "0")}cc</p>
          <p><b>Milage:</b> ${safe(v.milage || "N/A")}</p>

          <div class="vehicle-features">
            ${
              featuresArr.length
                ? featuresArr
                    .map((f) => `<span class="feature">${safe(f)}</span>`)
                    .join("")
                : `<span class="feature">No features</span>`
            }
          </div>

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
async function registerVehicle(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  // send provider id so your existing backend logic works
  formData.set("provider_id", String(providerId));

  if (!formData.get("price_per_day")) {
    alert("Price per day is required.");
    return;
  }

  try {
    const response = await apiFetch(`${API_BASE}`, {
      method: "POST",
      body: formData,
    });

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      return;
    }
    if (!response.ok) throw new Error(await response.text());

    const result = await response.json();
    if (result.status !== "success") throw new Error(JSON.stringify(result));

    alert("Vehicle registered successfully!");
    closeRegisterModal();
    form.reset();
    loadVehicles();
  } catch (err) {
    console.error("Error registering vehicle:", err);
    alert("Failed to register vehicle.\n" + err.message);
  }
}

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
  if (!vehicleId) {
    alert("Invalid vehicle ID");
    return;
  }

  const modal = document.getElementById("updateVehicleModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  try {
    const response = await apiFetch(`${API_BASE}/${vehicleId}`);
    if (response.status === 401) {
      alert("Session expired. Please login again.");
      closeUpdateModal();
      return;
    }
    if (!response.ok) throw new Error(await response.text());

    const v = await response.json();
    if (v.error) throw new Error(v.error);

    document.getElementById("updateVehicleId").value = v.vehicleid || "";

    document.getElementById("updateBrand").value = v.vehiclebrand || "";
    document.getElementById("updateModel").value = v.vehiclemodel || "";
    document.getElementById("updatePlate").value = v.numberplatenumber || "";
    document.getElementById("updateColor").value = v.color || "";
    document.getElementById("updateTareWeight").value = v.tareweight || "";
    document.getElementById("updateEngineCapacity").value =
      v.enginecapacity || "";
    document.getElementById("updatePassengers").value =
      v.numberofpassengers || "";
    document.getElementById("updateMilage").value = v.milage || "";
    document.getElementById("updateEngineNumber").value = v.enginenumber || "";
    document.getElementById("updateChasisNumber").value = v.chasisnumber || "";
    document.getElementById("updateDescription").value = v.description || "";

    document.getElementById("updatePricePerDay").value = v.price_per_day ?? "";
    document.getElementById("updateLocation").value = v.location || "";
    document.getElementById("updateFeatures").value = v.features || "";
    document.getElementById("updateVehicleType").value = v.vehicle_type || "";
    document.getElementById("updateFuelType").value = v.fuel_type || "";
    document.getElementById("updateAvailabilityStatus").value =
      v.availability_status || "available";
    document.getElementById("updateManufactureYear").value =
      v.manufacture_year ?? "";
    document.getElementById("updateTransmission").value = v.transmission || "";
  } catch (err) {
    console.error("Error fetching vehicle data:", err);
    alert("Failed to load vehicle details for update.\n" + err.message);
    closeUpdateModal();
  }
}

function closeUpdateModal() {
  document.getElementById("updateVehicleModal").classList.remove("active");
  document.body.style.overflow = "";
}

async function updateVehicle(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

  const vehicleId = formData.get("vehicleid");
  if (!vehicleId) {
    alert("Vehicle ID missing");
    return;
  }

  // send provider id so your existing backend logic works
  formData.set("provider_id", String(providerId));

  if (!formData.get("price_per_day")) {
    formData.delete("price_per_day");
  }

  try {
    const response = await apiFetch(`${API_BASE}/${vehicleId}`, {
      method: "POST",
      body: formData,
    });

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      return;
    }
    if (!response.ok) throw new Error(await response.text());

    const result = await response.json();
    if (result.status !== "success") throw new Error(JSON.stringify(result));

    alert("Vehicle updated successfully!");
    closeUpdateModal();
    loadVehicles();
  } catch (err) {
    console.error("Error updating vehicle:", err);
    alert("Failed to update vehicle.\n" + err.message);
  }
}

// ================= DELETE VEHICLE =================
async function deleteVehicle(vehicleId) {
  if (!vehicleId) {
    alert("Invalid vehicle ID");
    return;
  }

  if (!confirm("Are you sure you want to delete this vehicle?")) return;

  try {
    const response = await apiFetch(`${API_BASE}/${vehicleId}`, {
      method: "DELETE",
    });

    if (response.status === 401) {
      alert("Session expired. Please login again.");
      return;
    }
    if (!response.ok) throw new Error(await response.text());

    const result = await response.json();
    if (result.status !== "success") throw new Error(JSON.stringify(result));

    alert("Vehicle deleted successfully!");
    loadVehicles();
  } catch (err) {
    console.error("Error deleting vehicle:", err);
    alert("Failed to delete vehicle.\n" + err.message);
  }
}

// ================= UTIL =================
function safe(v) {
  if (v === null || v === undefined) return "";
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
