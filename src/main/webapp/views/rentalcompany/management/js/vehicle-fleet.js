
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

        const response = await fetch("/displayvehiclestatistics", {method: "POST"});
        console.log(response);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }


        const data = await response.json();

        console.log(data);


        return data;

    }catch (err) {

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
                    <div class="stat-number">${value}</div> <!-- CHANGE: matches your HTML style -->
                    <div class="stat-label">${label}</div>
                </div>
            </div>
        `;
    }

    statsGrid.innerHTML += createStatsCard("fas fa-car","total","Total Vehicles",stats.totalVehicles || 0);
    statsGrid.innerHTML += createStatsCard("fas fa-check-circle","available","Available",stats.availableVehicles || 0);
    statsGrid.innerHTML += createStatsCard("fas fa-route","on-trip","On Trip",stats.onTripVehicles || 0);
    statsGrid.innerHTML += createStatsCard("fas fa-wrench","maintenance","Maintenance",stats.maintenanceVehicles || 0);

}

async function loadVehicles(searchQuery = "") {

    const vehicleGrid = document.getElementById("vehicleGrid");
    vehicleGrid.innerHTML = `<p>Loading vehicles...</p>`;

    try {

        const response = await fetch(`${BASE_URL}/vehicle/list?company_id=${companyId}`);

        if (!response.ok) {
            throw new Error("Failed to fetch vehicles");
        }

        const vehicles = await response.json();

        allVehicles = vehicles;

        console.log("Loaded vehicles:", allVehicles);

        vehicleGrid.innerHTML = "";

        if (!vehicles || vehicles.length === 0) {
            vehicleGrid.innerHTML = `<p>No vehicles registered yet.</p>`;
            return;
        }

        vehicles.forEach((v) => {

            const vehicleId = v.vehicleId;
            const imageUrl = `${BASE_URL}/vehicle/image?vehicleid=${vehicleId}`;

            const card = document.createElement("div");
            card.className = "vehicle-card";
            card.innerHTML = `
                        <div>
                            <h3 class="label">${v.status}</h3>
                        </div>
                        <div class="vehicle-image">
                              <img src="${imageUrl}" alt="${v.vehicleBrand} ${v.vehicleModel }" onerror="this.src='../assets/no-image.png'">
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
                                <button class="redirect" onclick="redirectMaintenanceView(${vehicleId})">Maintenance View</button>
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

//delete vehicle
async function removeVehicle(vehicleId) {

    console.log("Deleting vehicle ID:", vehicleId); // Debug log

    if (!vehicleId || vehicleId === undefined || vehicleId === "undefined") {

        alert("Invalid vehicle ID");
        return;

    }

    if (!confirm("Are you sure you want to delete this vehicle?")) {

        return;

    }

    try {

        const response = await fetch(`${BASE_URL}/vehicle/delete`, {

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

                // not a JSON response, use generic message

            }

            throw new Error(errorMessage);

        }

        alert("Vehicle deleted successfully!");
        loadVehicles();
        loadVehicleStatistics().then(stats => { if(stats) renderVehicleStatistics(stats); });

    } catch (err) {

        console.error("Error deleting vehicle:", err);
        alert("Failed to delete vehicle: " + err.message);

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

// update vehicle (Refactored to fetch all details)
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


        document.getElementById("editVehicleId").value = v.vehicleId || "";
        document.getElementById("editBrand").value = v.vehicleBrand || "";
        document.getElementById("editModel").value = v.vehicleModel || "";
        document.getElementById("editPlate").value = v.numberPlateNumber || "";
        document.getElementById("editColor").value = v.color || "";
        document.getElementById("editTareWeight").value = v.tareWeight || "";
        document.getElementById("editEngineCapacity").value = v.engineCapacity || "";
        document.getElementById("editPassengers").value = v.numberOfPassengers || "";
        document.getElementById("editMilage").value = v.milage || "";
        document.getElementById("editEngineNumber").value = v.engineNumber || "";
        document.getElementById("editChasisNumber").value = v.chasisNumber || "";
        document.getElementById("editDescription").value = v.description || "";

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

function redirectCalenderView(vehicleId) {

    if (!vehicleId) {
        alert("Invalid vehicle ID");
        return;
    }

    window.location.href = `/views/rentalcompany/management/html/fleet-calender.html?vehicleId=${encodeURIComponent(vehicleId)}`;

}

function redirectMaintenanceView(vehicleId) {

    if (!vehicleId) {
        alert("Invalid vehicle ID");
        return;
    }

    window.location.href = `/views/rentalcompany/management/html/maintenance-fleet.html?vehicleId=${encodeURIComponent(vehicleId)}`;

}


document.addEventListener("DOMContentLoaded", async () => {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;    // stop here if not logged in
        }


        await loadVehicles();

        const stats = await loadVehicleStatistics();

        if (stats) {
            renderVehicleStatistics(stats);
        }


    } catch (err) {

        console.error("Error during initialization:", err);

    }

});

document.getElementById("addVehicleBtn").addEventListener("click", openAddModal);


//Add vehicle (Refactored to match provider style)
document.getElementById("addVehicleForm").addEventListener("submit", async function (e) {

        e.preventDefault();
        const formData = new FormData(this);
        formData.append("company_id", companyId);

        try {

            const response = await fetch(`${BASE_URL}/vehicle/add?company_id=${companyId}`, {

                method: "POST",
                body: formData,

            });

            const data = await response.json();

            console.log("data:", data);

            if (data.status === "success") {

                alert("Vehicle registered successfully!");
                closeAddModal();
                this.reset(); // Reset the form after success
                loadVehicles();
                loadVehicleStatistics().then(stats => { if(stats) renderVehicleStatistics(stats); });

            } else {

                throw new Error(data.message || "Failed to add vehicle");

            }

        } catch (err) {

            console.error("Error adding vehicle:", err);
            alert("Failed to register vehicle: " + err.message);

        }

});

document.getElementById("closeAddVehicleModal").addEventListener("click", closeAddModal);


//save changes
document.getElementById("editVehicleForm").addEventListener("submit", async function (e) {

    e.preventDefault();

    const formData = new FormData(this);
    formData.append("company_id", companyId);

    try {

        const response = await fetch(`${BASE_URL}/vehicle/update`, {
            method: "POST",
            body: formData,

        });


        const data = await response.json();

        if (data.status === "success") {

            alert("Vehicle updated successfully!");
            closeEditModal();
            loadVehicles();
            loadVehicleStatistics().then(stats => { if(stats) renderVehicleStatistics(stats); });

        } else {

            throw new Error(data.message || "Update failed");

        }

    } catch (err) {

        console.error("Error updating vehicle:", err);
        alert("Failed to update vehicle: " + err.message);

    }

});

document.getElementById("closeEditVehicleModal").addEventListener("click", closeEditModal);























//for search by model or plate number
function filterVehiclessByText(searchText) {

    const vehicleGrid = document.getElementById("vehicleGrid");
    vehicleGrid.innerHTML = "";

    let inputLower = searchText.toLowerCase();
    let filteredVehicles = [];

    for(let i=0; i<allVehicles.length; i++) {

        //DEBUGGING
        console.log("model name:- ", allVehicles[i].vehicleModel);
        console.log("plate number:- ", allVehicles[i].numberPlateNumber);
        console.log("Search text:- ", inputLower)

        let modelName = allVehicles[i].vehicleModel || "";
        let numberPlate = allVehicles[i].numberPlateNumber || "";


        //DEBUGGING 2
        console.log("Comparing:- ", modelName, "with ",inputLower)
        console.log("Comparing:- ", numberPlate, "with ",inputLower)
        console.log("Match?:- ", modelName.includes(inputLower))
        console.log("Match?:- ", modelName.includes(inputLower))

        if(modelName.includes(inputLower) || numberPlate.includes(inputLower)) {
            filteredVehicles.push(allVehicles[i]);
        }

    }

    console.log("Filtered vehicles count:", filteredVehicles.length);
    console.log("About to render...");
    renderBookings(filteredVehicles);
    console.log("Render complete!");



}

//search pending,completed,active,cancelled bookings
function filterBookingsByTripStatus(status) {

    const bookingGrid = document.getElementById("bookingGrid");
    bookingGrid.innerHTML = "";

    let filteredBookings = [];

    for(let i=0; i<AllBookings.length; i++) {

        //DEBUG 1
        console.log("Trip status:- ", AllBookings[i].status)
        console.log("selected trip status:- ", status)

        let tripStatus =  AllBookings[i].status || "";

        //DEBUG 2
        console.log("Comparing:- ", tripStatus , "with ", status)
        console.log("Match?:- ", tripStatus == status)

        if(tripStatus == status) {
            filteredBookings.push(AllBookings[i]);
        }

    }

    console.log("Filtered bookings count:", filteredBookings.length);
    console.log("About to render...");
    renderBookings(filteredBookings);
    console.log("Render complete!");

}




























