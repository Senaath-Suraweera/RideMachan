// ─────────────────────────────────────────────────────────────
// Provider-Request.js
// Displays pending vehicle requests from providers and lets the
// rental company accept or reject them.
// ─────────────────────────────────────────────────────────────

let AllVehicles = [];

// ─────────────────────────────────────────────────────────────
// Login check
// ─────────────────────────────────────────────────────────────
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

    return true;
  } catch (err) {
    console.error("Error checking login:", err);
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// Fetch all pending provider request vehicles
// ─────────────────────────────────────────────────────────────
async function loadAllRequestVehicles() {
  try {
    const response = await fetch(`/display/allrequest`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.error("Error loading requests:", err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// Render vehicle cards
// ─────────────────────────────────────────────────────────────
function renderVehicles(vehicles) {
  const container = document.getElementById("container");
  if (!container) return;

  container.innerHTML = "";

  if (!vehicles || vehicles.length === 0) {
    handleEmptyCase("No pending vehicle requests", "container");
    return;
  }

  vehicles.forEach((vehicle) => {
    const card = document.createElement("div");
    card.className = "vehicle-card";

    const imageUrl = `/company/vehicle/image?vehicleid=${vehicle.vehicleId}`;
    const price = vehicle.pricePerDay
      ? vehicle.pricePerDay.toLocaleString()
      : "N/A";

    card.innerHTML = `
            <div class="vehicle-image">
                <img
                    src="${imageUrl}"
                    alt="${vehicle.vehicleBrand} ${vehicle.vehicleModel}"
                    onerror="this.style.display='none'; this.parentElement.querySelector('.vehicle-image-fallback').style.display='flex';"
                />
                <div class="vehicle-image-fallback" style="display:none;">
                    <i class="fas fa-car"></i>
                </div>
            </div>

            <div class="vehicle-info">
                <h4>${vehicle.vehicleBrand} ${vehicle.vehicleModel}</h4>

                <p class="price">
                    LKR ${price}/day
                </p>

                <p class="location">
                    <i class="fas fa-map-marker-alt"></i> ${vehicle.location || "Sri Lanka"}
                </p>

                <div class="features">
                    <span class="feature-tag">${vehicle.fuelType || "—"}</span>
                    <span class="feature-tag">${vehicle.vehicleType || "—"}</span>
                </div>
            </div>

            <div class="vehicle-actions">
                <button class="assign-btn" data-id="${vehicle.vehicleId}">
                    <i class="fas fa-check"></i> Accept
                </button>
                <button class="reject-btn" data-id="${vehicle.vehicleId}">
                    <i class="fas fa-times"></i> Reject
                </button>
            </div>
        `;

    // Wire up the buttons (safer than inline onclick)
    card
      .querySelector(".assign-btn")
      .addEventListener("click", () => assignVehicle(vehicle.vehicleId));
    card
      .querySelector(".reject-btn")
      .addEventListener("click", () => rejectVehicle(vehicle.vehicleId));

    container.appendChild(card);
  });
}

// ─────────────────────────────────────────────────────────────
// Accept a vehicle request
// ─────────────────────────────────────────────────────────────
async function assignVehicle(vehicleId) {
  if (!confirm("Accept this vehicle request?")) return;

  try {
    const formData = new URLSearchParams();
    formData.append("vehicleId", vehicleId);

    const response = await fetch("/provider/accept", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      alert("Vehicle accepted successfully!");
      AllVehicles = await loadAllRequestVehicles();
      renderVehicles(AllVehicles);
    } else {
      alert("Failed to accept: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Error accepting vehicle:", err);
    alert("Error accepting vehicle. Please try again.");
  }
}

// ─────────────────────────────────────────────────────────────
// Reject a vehicle request
// ─────────────────────────────────────────────────────────────
async function rejectVehicle(vehicleId) {
  if (!confirm("Reject this vehicle request? This cannot be undone.")) return;

  try {
    const formData = new URLSearchParams();
    formData.append("vehicleId", vehicleId);

    const response = await fetch("/provider/reject", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      alert("Vehicle request rejected.");
      AllVehicles = await loadAllRequestVehicles();
      renderVehicles(AllVehicles);
    } else {
      alert("Failed to reject: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Error rejecting vehicle:", err);
    alert("Error rejecting vehicle. Please try again.");
  }
}

// ─────────────────────────────────────────────────────────────
// Empty-state card
// ─────────────────────────────────────────────────────────────
function handleEmptyCase(message, containerId = "container") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  const emptyCard = document.createElement("div");
  emptyCard.className = "empty-state-card";
  emptyCard.innerHTML = `
        <i class="fas fa-inbox empty-icon"></i>
        <h2 class="empty-title">${message}</h2>
        <p class="empty-sub">Nothing to display right now</p>
    `;

  container.appendChild(emptyCard);
}

// ─────────────────────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async function () {
  try {
    const loggedIn = await checkLogin();
    if (!loggedIn) return;

    AllVehicles = await loadAllRequestVehicles();
    renderVehicles(AllVehicles);
  } catch (err) {
    console.error("Error during initialization:", err);
  }
});
