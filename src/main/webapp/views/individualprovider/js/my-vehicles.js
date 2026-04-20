// my-vehicles.js — Dashboard-themed version with Details modal & Document viewer

const BASE_URL = "http://localhost:8080";

const API_BASE = `${BASE_URL}/api/vehicles`;

// providerId will be loaded from session (NO localStorage fallback)
let providerId = null;

// Cache of the most recently loaded vehicles (for details modal)
let vehiclesCache = [];

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
      grid.innerHTML = `<p class="empty-state-message">Session expired / not logged in. Please login again.</p>`;
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

  // 4) Close modals with ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDetailsModal();
      closeDocViewer();
      closeRegisterModal();
      closeUpdateModal();
    }
  });

  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.classList.remove("active");
        document.body.style.overflow = "";
        // Clear doc iframe when closing
        const docFrame = document.getElementById("docFrame");
        if (docFrame && overlay.id === "docViewerModal") docFrame.src = "";
      }
    });
  });
});

// ---------- Helper: always send cookies ----------
async function apiFetch(url, options = {}) {
  return fetch(url, {
    ...options,
    credentials: "include",
  });
}

// ---------- get providerId from session ----------
async function getProviderIdFromSession() {
  try {
    const res = await apiFetch(`${API_BASE}/me`);
    if (!res.ok) return null;
    const me = await res.json();
    return Number(me.providerId) || null;
  } catch (e) {
    console.error("Failed to fetch /me:", e);
    return null;
  }
}

// ================= LOAD VEHICLES =================
async function loadVehicles() {
  const vehiclesGrid = document.getElementById("vehiclesGrid");
  vehiclesGrid.innerHTML = `<p class="empty-state-message"><i class="fas fa-spinner fa-spin"></i> Loading vehicles...</p>`;

  try {
    const response = await apiFetch(
      `${API_BASE}?provider_id=${providerId}&limit=200`,
    );

    if (response.status === 401) {
      vehiclesGrid.innerHTML = `<p class="empty-state-message">Session expired. Please login again.</p>`;
      return;
    }
    if (!response.ok) throw new Error(await response.text());

    const data = await response.json();
    const vehicles = Array.isArray(data) ? data : data.vehicles || [];

    // cache for details modal
    vehiclesCache = vehicles;

    // Update stats
    updateStats(vehicles);

    vehiclesGrid.innerHTML = "";

    if (!vehicles || vehicles.length === 0) {
      vehiclesGrid.innerHTML = `
        <div class="empty-state-message">
          <i class="fas fa-car" style="font-size:32px;color:var(--primary-light);margin-bottom:12px;display:block;"></i>
          <strong>No vehicles registered yet.</strong><br>
          Click "Register Vehicle" above to add your first one.
        </div>`;
      return;
    }

    vehicles.forEach((v) => {
      const vehicleId = v.vehicleid;
      const imageUrl = `${API_BASE}/${vehicleId}/image`;

      const card = document.createElement("div");
      card.className = "vehicle-card";
      card.dataset.vehicleId = vehicleId;

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

          <div class="vehicle-price">Rs. ${safe(formatMoney(v.price_per_day))} <span style="font-size:12px;color:var(--text-light);font-weight:500;">/ day</span></div>

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
            <button class="btn btn-outline" data-action="update" data-id="${vehicleId}">
              <i class="fas fa-pen"></i> Update
            </button>
            <button class="btn btn-danger" data-action="delete" data-id="${vehicleId}">
              <i class="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
      `;

      // Card click -> details modal. Buttons stop propagation.
      card.addEventListener("click", (e) => {
        // ignore clicks on the inner buttons
        const actionBtn = e.target.closest("[data-action]");
        if (actionBtn) {
          e.stopPropagation();
          const action = actionBtn.dataset.action;
          const id = actionBtn.dataset.id;
          if (action === "update") openUpdateModal(id);
          else if (action === "delete") deleteVehicle(id);
          return;
        }
        openDetailsModal(vehicleId);
      });

      vehiclesGrid.appendChild(card);
    });
  } catch (err) {
    vehiclesGrid.innerHTML = `<p class="empty-state-message">Error loading vehicles.</p>`;
    console.error("Error loading vehicles:", err);
  }
}

// ================= STATS =================
function updateStats(vehicles) {
  const total = vehicles.length;
  let available = 0,
    maintenance = 0,
    unavailable = 0;

  vehicles.forEach((v) => {
    const s = (v.availability_status || "").toLowerCase();
    if (s === "available") available++;
    else if (s === "maintenance") maintenance++;
    else if (s === "unavailable") unavailable++;
  });

  setText("statTotal", total);
  setText("statAvailable", available);
  setText("statMaintenance", maintenance);
  setText("statUnavailable", unavailable);
}

// ================= DETAILS MODAL =================
async function openDetailsModal(vehicleId) {
  if (!vehicleId) return;

  const modal = document.getElementById("vehicleDetailsModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  // Try cache first for snappy UX
  let v = vehiclesCache.find((x) => String(x.vehicleid) === String(vehicleId));

  try {
    // Always refresh with latest from backend
    const res = await apiFetch(`${API_BASE}/${vehicleId}`);
    if (res.ok) {
      const fresh = await res.json();
      if (!fresh.error) v = fresh;
    }
  } catch (e) {
    console.warn("Details fetch fell back to cache:", e);
  }

  if (!v) {
    alert("Failed to load vehicle details.");
    closeDetailsModal();
    return;
  }

  const imgUrl = `${API_BASE}/${v.vehicleid}/image`;
  const statusClass = (v.availability_status || "available").toLowerCase();

  // Header
  setText(
    "detailsTitle",
    `${v.vehiclebrand || ""} ${v.vehiclemodel || ""}`.trim() ||
      "Vehicle Details",
  );
  setText("detailsSubtitle", `Complete overview • Vehicle #${v.vehicleid}`);

  // Hero
  const imgEl = document.getElementById("detailsImage");
  imgEl.src = imgUrl;
  imgEl.onerror = function () {
    this.onerror = null;
    this.src = FALLBACK_IMG;
  };

  const badge = document.getElementById("detailsStatusBadge");
  badge.className = `vehicle-status ${statusClass}`;
  badge.textContent = v.availability_status || "available";

  setText(
    "detailsName",
    `${v.vehiclebrand || ""} ${v.vehiclemodel || ""}`.trim() || "—",
  );
  setText("detailsPrice", `Rs. ${formatMoney(v.price_per_day)} / day`);
  setText("detailsLocation", v.location || "No location");
  setText("detailsPlate", v.numberplatenumber || "—");
  setText("detailsYear", v.manufacture_year || "—");

  // Specs
  setText("detailsType", v.vehicle_type || "—");
  setText("detailsFuel", v.fuel_type || "—");
  setText("detailsTransmission", v.transmission || "—");
  setText(
    "detailsEngineCapacity",
    v.enginecapacity ? `${v.enginecapacity} cc` : "—",
  );
  setText("detailsTareWeight", v.tareweight ? `${v.tareweight} kg` : "—");
  setText("detailsPassengers", v.numberofpassengers || "—");
  setText("detailsColor", v.color || "—");
  setText("detailsMilage", v.milage || "—");

  // Identifiers
  setText("detailsEngineNo", v.enginenumber || "—");
  setText("detailsChasisNo", v.chasisnumber || "—");

  // Features
  const featuresArr = (v.features || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const featWrap = document.getElementById("detailsFeatures");
  if (featuresArr.length) {
    featWrap.innerHTML = featuresArr
      .map((f) => `<span class="feature">${safe(f)}</span>`)
      .join("");
  } else {
    featWrap.innerHTML = `<span class="feature">No features listed</span>`;
  }

  // Description
  setText("detailsDescription", v.description || "No description provided.");

  // Timestamps
  setText("detailsCreatedAt", formatDate(v.created_at));
  setText("detailsUpdatedAt", formatDate(v.updated_at));

  // Wire action buttons (re-bind each time to capture current id)
  const editBtn = document.getElementById("detailsEditBtn");
  editBtn.onclick = () => {
    closeDetailsModal();
    openUpdateModal(v.vehicleid);
  };

  const deleteBtn = document.getElementById("detailsDeleteBtn");
  deleteBtn.onclick = () => {
    closeDetailsModal();
    deleteVehicle(v.vehicleid);
  };

  // Store id for doc viewer
  const docBtn = document.getElementById("detailsViewDocBtn");
  docBtn.dataset.vehicleId = v.vehicleid;
  docBtn.dataset.vehicleName =
    `${v.vehiclebrand || ""} ${v.vehiclemodel || ""}`.trim();
  docBtn.dataset.vehiclePlate = v.numberplatenumber || "";
}

function closeDetailsModal() {
  const modal = document.getElementById("vehicleDetailsModal");
  if (modal) modal.classList.remove("active");
  document.body.style.overflow = "";
}

// ================= DOCUMENT VIEWER =================
function viewRegistrationDoc() {
  const btn = document.getElementById("detailsViewDocBtn");
  const vid = btn?.dataset?.vehicleId;
  if (!vid) return;

  const name = btn.dataset.vehicleName || "Vehicle";
  const plate = btn.dataset.vehiclePlate || "";

  const docUrl = `${API_BASE}/${vid}/doc`;

  const modal = document.getElementById("docViewerModal");
  const frame = document.getElementById("docFrame");
  const dl = document.getElementById("docDownloadBtn");
  const sub = document.getElementById("docViewerSubtitle");

  sub.textContent = `${name}${plate ? " • " + plate : ""}`;
  frame.src = docUrl;
  dl.href = docUrl;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeDocViewer() {
  const modal = document.getElementById("docViewerModal");
  const frame = document.getElementById("docFrame");
  if (modal) modal.classList.remove("active");
  if (frame) frame.src = "";
  document.body.style.overflow = "";
}

// ================= REGISTER VEHICLE =================
async function registerVehicle(e) {
  e.preventDefault();

  const form = e.target;
  const formData = new FormData(form);

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

function setText(id, value) {
  const el = document.getElementById(id);
  if (el)
    el.textContent =
      value === null || value === undefined || value === ""
        ? "—"
        : String(value);
}

function formatMoney(v) {
  if (v === null || v === undefined || v === "") return "0.00";
  const n = Number(v);
  if (Number.isNaN(n)) return String(v);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(v) {
  if (!v || v === "null") return "—";
  try {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return String(v);
    return d.toLocaleString();
  } catch {
    return String(v);
  }
}
