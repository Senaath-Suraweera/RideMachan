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

function renderVehicles(vehicles) {

    const container = document.getElementById("container");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    vehicles.forEach(vehicle => {

        const card = document.createElement("div");
        card.className = "vehicle-card";

        card.innerHTML = `
            <div class="vehicle-image">
                <i class="fas fa-car"></i>
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
                    <span class="feature-tag">${vehicle.availabilityStatus}</span>
                </div>
            </div>

            <div class="vehicle-actions">
                <button class="assign-btn" onclick="assignVehicle(${vehicle.vehicleId})">
                    <i class="fas fa-tools"></i> Assign
                </button>
            </div>
        `;

        container.appendChild(card);
    });
}



document.addEventListener("DOMContentLoaded", async function() {

    try {

        /*const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;    // stop here if not logged in
        }*/


        renderVehicles(vehicles);

    } catch (err) {

        console.error("Error during initialization:", err);

    }

});





















const vehicles = [
    {
        vehicleId: 1,
        vehicleBrand: "Toyota",
        vehicleModel: "Axio",
        pricePerDay: 12000,
        vehicleType: "Car",
        fuelType: "Petrol",
        availabilityStatus: "available",
        location: "Colombo"
    },
    {
        vehicleId: 2,
        vehicleBrand: "Suzuki",
        vehicleModel: "Wagon R",
        pricePerDay: 8500,
        vehicleType: "Car",
        fuelType: "Petrol",
        availabilityStatus: "available",
        location: "Kandy"
    },
    {
        vehicleId: 3,
        vehicleBrand: "Toyota",
        vehicleModel: "Hiace",
        pricePerDay: 18000,
        vehicleType: "Van",
        fuelType: "Diesel",
        availabilityStatus: "maintenance",
        location: "Galle"
    }
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

    vehicles.forEach(vehicle => {
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
                    ${vehicle.availabilityStatus === 'available' ? '<span class="feature-tag">Available</span>' : ''}
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