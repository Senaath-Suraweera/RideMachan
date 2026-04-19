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

    console.log("User is logged in.");
    return true;
  } catch (err) {
    console.error("Error checking login:", err);
    return false;
  }
}

let maintenaceStaff;

async function loadAssignedVehiclesByStaffId(staffId) {
  try {
    const response = await fetch(
      `/display/assigned/vehicles/bystaffId?staffId=${staffId}`,
      {
        method: "POST",
      },
    );

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

function renderVehicles(vehicles) {
  let container = document.getElementById("container");

  if (!container) {
    return;
  }

  container.innerHTML = "";

  if (!vehicles || vehicles.length === 0) {
    handleEmptyCase("No vehicles assigned", "container");
    return;
  }

  let imageUrl;

  vehicles.forEach((vehicle) => {
    const card = document.createElement("div");
    card.className = "vehicle-card";

    imageUrl = `/company/vehicle/image?vehicleid=${vehicle.vehicleId}`;

    card.innerHTML = `
            <div class="vehicle-image">
                <img
                    src="${imageUrl}"
                    alt="${vehicle.vehicleBrand} ${vehicle.vehicleModel}"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                    style="width:100%;height:100%;object-fit:cover;border-radius:8px 8px 0 0;"
                />
            </div>

            <div class="vehicle-info">
                <h4>${vehicle.vehicleBrand} ${vehicle.vehicleModel}</h4>

                <p class="price">
                    LKR ${vehicle.pricePerDay.toLocaleString()}/day
                </p>

                <p class="location">
                    📍 ${vehicle.location}
                </p>

                <div class="features">
                    <span class="feature-tag">${vehicle.fuelType}</span>
                    <span class="feature-tag">${vehicle.vehicleType}</span>
                    <span class="feature-tag" style="${vehicle.availabilityStatus?.toLowerCase().includes("maintenance") ? "background:#dc3545; color:#fff;" : ""}">
                        ${vehicle.availabilityStatus}
                    </span>
                </div>
            </div>

            <div class="vehicle-actions">
            </div>
        `;

    container.appendChild(card);
  });
}

function getStaffIdFromURL() {
  let params = new URLSearchParams(window.location.search);
  return params.get("staffId");
}

function getFullNameFromURL() {
  let params = new URLSearchParams(window.location.search);
  let firstname = params.get("firstname");
  let lastname = params.get("lastname");

  let fullname = firstname + " " + lastname;

  return fullname;
}

function getVehicle(staffId) {
  for (let i = 0; i < AllVehicles.length; i++) {
    if (AllVehicles[i].vehicleId == vehicleId) {
      return AllVehicles[i];
    }
  }

  return null;
}

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const loggedIn = await checkLogin();

    if (!loggedIn) {
      return; // stop here if not logged in
    }

    let staffId = getStaffIdFromURL();

    if (!staffId) {
      console.error("staffId not found in URL");
      return;
    }

    let vehicles = await loadAssignedVehiclesByStaffId(staffId);

    console.log("Loaded vehicles:", vehicles);

    renderVehicles(vehicles);
  } catch (err) {
    console.error("Error during initialization:", err);
  }
});

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
  emptyCard.style.top = "80px";

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

const vehicles = [
  {
    vehicleId: 1,
    vehicleBrand: "Toyota",
    vehicleModel: "Axio",
    pricePerDay: 12000,
    vehicleType: "Car",
    fuelType: "Petrol",
    availabilityStatus: "available",
    location: "Colombo",
  },
  {
    vehicleId: 2,
    vehicleBrand: "Suzuki",
    vehicleModel: "Wagon R",
    pricePerDay: 8500,
    vehicleType: "Car",
    fuelType: "Petrol",
    availabilityStatus: "available",
    location: "Kandy",
  },
  {
    vehicleId: 3,
    vehicleBrand: "Toyota",
    vehicleModel: "Hiace",
    pricePerDay: 18000,
    vehicleType: "Van",
    fuelType: "Diesel",
    availabilityStatus: "maintenance",
    location: "Galle",
  },
];

function displayVehicles(vehicles) {
  const container = document.getElementById("searchResults");

  if (!container) {
    console.error("searchResults container not found");
    return;
  }

  container.innerHTML = ""; // Clear previous content

  if (vehicles.length === 0) {
    container.innerHTML = `
            <p style="text-align: center; color: var(--text-light); padding: 40px;">
                No vehicles found matching your criteria.
            </p>
        `;
    return;
  }

  vehicles.forEach((vehicle) => {
    const vehicleCard = document.createElement("div");
    vehicleCard.className = "vehicle-card";
    vehicleCard.onclick = () => viewVehicle(vehicle.vehicleId);

    vehicleCard.innerHTML = `
            <div class="vehicle-image">
                <i class="fas fa-car"></i>
            </div>

            <div class="vehicle-info">
                <!-- Vehicle name -->
                <h4>${vehicle.vehicleBrand} ${vehicle.vehicleModel}</h4>

                <!-- Price -->
                <p class="price">
                    LKR ${vehicle.pricePerDay ? vehicle.pricePerDay.toLocaleString() : "N/A"}/day
                </p>

                <!-- Company -->
                <p class="category"
                   style="cursor:pointer; color:var(--primary); text-decoration:underline;"
                   onclick="event.stopPropagation(); viewCompany(${vehicle.companyId})">
                   ${getCompanyName(vehicle.companyId)}
                </p>

                <!-- Location -->
                <p class="location">Sri Lanka</p>

                <!-- Rating - Always 5 stars -->
                <div class="rating">
                    <div class="stars">
                        ${generateStars(5)}
                    </div>
                    <span class="review-count">Excellent Service</span>
                </div>

                <!-- Seats -->
                <div class="seats-info">
                    <i class="fas fa-users"></i>
                    ${vehicle.numberOfPassengers} seats
                </div>

                <!-- Features -->
                <div class="features">
                    <span class="feature-tag">${vehicle.fuelType || "Fuel"}</span>
                    <span class="feature-tag">${vehicle.vehicleType || "Vehicle"}</span>
                    ${vehicle.availabilityStatus === "available" ? '<span class="feature-tag">Available</span>' : ""}
                </div>
            </div>

            <div class="vehicle-actions">
                <button class="message-btn"
                    onclick="event.stopPropagation(); sendMessage(${vehicle.vehicleId}, '${vehicle.vehicleBrand} ${vehicle.vehicleModel}')">
                    Message
                </button>
            </div>
        `;

    container.appendChild(vehicleCard);
  });
}
