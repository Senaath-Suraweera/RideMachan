let AllVehicles;
let vehicle;
const BASE_URL = "http://localhost:8080";
let companyId = null;

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



async function LoadVehicles() {

     try {

        const response = await fetch(`${BASE_URL}/vehicle/list?company_id=${companyId}`);

        if (!response.ok) {
            throw new Error("Failed to fetch vehicles");
        }

        let data = await response.json();

        console.log(data);

        return data;


    } catch (err) {

         console.log(err);

    }

}

async function LoadMaintenanceRecords(vehicleId) {

    try {

        const response = await fetch(`${BASE_URL}/maintenancerecords/list?vehicleId=${vehicleId}`);

        if (!response.ok) {
            throw new Error("Failed to fetch maintenance records");
        }

        let data = await response.json();

        console.log(data);

        return data;

    } catch (err) {

        console.error(err);

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


function renderVehicle(vehicle) {

    if (!vehicle) {
        return;
    }

    const container = document.querySelector(".vehicle-info");
    container.innerHTML = `

                <div class="vehicle-image">
                    <i class="fas fa-car"></i>
                </div>
                <h3>${vehicle.vehicleBrand} ${vehicle.vehicleModel}</h3>
                <div class="status-badge status-${vehicle.status.toLowerCase()}">${vehicle.status}</div>
                <div class="vehicle-stats">
                    <div class="stat-item"><span class="stat-label">AssignedStaff:</span> <span class="stat-value">${vehicle.lastService || 'NA'}</span></div>
                    <div class="stat-item"><span class="stat-label">Last Service:</span> <span class="stat-value">${vehicle.lastService || 'NA'}</span></div>
                    <div class="stat-item"><span class="stat-label">Next Service:</span> <span class="stat-value">${vehicle.nextService || 'NA'}</span></div>
                    <div class="stat-item"><span class="stat-label">Insurance Expiry:</span> <span class="stat-value">${vehicle.insuranceExpiry || 'NA'}</span></div>
                    <div class="stat-item"><span class="stat-label">Emission Test:</span> <span class="stat-value">${vehicle.emissionTest || 'NA'}</span></div>
                </div>
            `;

}

function renderMaintenanceLogs(maintenanceLogs) {

    const tableBody = document.getElementsByClassName("table-body")[0];
    tableBody.innerHTML = "";


    if (!maintenanceLogs || maintenanceLogs.length === 0) {

        let emptyDivTag = document.createElement("div");
        emptyDivTag.className = 'empty-div';
        emptyDivTag.innerHTML = `<p>No maintenance records found for this vehicle.</p>`;
        tableBody.appendChild(emptyDivTag);
        return;

    }


    let status;

    maintenanceLogs.forEach(log => {

        if (log.status === 'pending') {

            status = 'Pending';

        } if(log.status === 'onJob') {

            status = 'On Job';

        }else if (log.status === 'completed') {

            status = 'Completed';

        }if(log.status === 'overdue') {

            status = 'Overdue';

        }

        tableBody.innerHTML += `

                    <div className="table-row">
                        <div className="col-date">
                            <div className="date">${log.date}</div>
                            <div className="id">ID: ${log.recordId}</div>
                        </div>
                        <div className="col-service">
                            <div className="service-name">${log.serviceName}</div>
                        </div>
                        <div className="col-description">
                            <div className="description">${log.description}</div>
                            <div className="mileage">Mileage: ${log.mileage} km</div>
                        </div>
                        <div className="col-action">
                            <span className="status-badge status-${log.status.toLowerCase()}">${status}</span>
                        </div>
                    </div>

                `
        ;

    });

}

function getVehicleIdFromURL() {

    const params = new URLSearchParams(window.location.search);
    return params.get("vehicleId");

}

function getVehicle(vehicleId) {

    for (let i = 0; i < AllVehicles.length; i++) {

        if (AllVehicles[i].vehicleId == vehicleId) {

            return AllVehicles[i];

        }

    }

    return null;

}


document.addEventListener("DOMContentLoaded", async () => {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;    // stop here if not logged in
        }


        AllVehicles = await LoadVehicles();

        let vehicleIdFromURL = getVehicleIdFromURL();
        let selectedVehicle = getVehicle(vehicleIdFromURL);

        renderVehicle(selectedVehicle);


        const maintenanceRecords = await LoadMaintenanceRecords(vehicleIdFromURL);
        renderMaintenanceLogs(maintenanceRecords);

    } catch (err) {

        console.error("Error during initialization:", err);

    }

});
