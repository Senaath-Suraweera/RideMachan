async function checkLogin() {

    try {

        const response = await fetch("/check/login/maintenance");
        const data = await response.json();

        if (!data.loggedIn) {

            const modal = document.getElementById("loginModal");
            modal.style.display = "flex";


            document.getElementById("loginOkBtn").onclick = () => {

                window.location.href = "/views/landing/maintenancelogin.html";

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

let assignedVehicles;
let maintenanceLogs;



async function LoadAssignedVehicles() {

    try {

        let response = await fetch(`/assignedvehicles`);

        if(!response.ok){
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();

        console.log(data);


        return data;

    }catch (err) {

        console.log(err);

    }

}

function renderVehicleDropdown() {

    const vehicleFilter = document.getElementById("vehicleFilter");
    vehicleFilter.innerHTML = "";

    assignedVehicles.forEach(vehicle => {

        const option = document.createElement("option");
        option.value = vehicle.numberplate;
        option.textContent = `${vehicle.numberplate} - ${vehicle.brand} ${vehicle.model}`;

        option.dataset.status = vehicle.status.toLowerCase();
        vehicleFilter.appendChild(option);

    });

}


function filterVehicleByNumberPlate(numberplate) {

    const vehicleInformation = document.getElementsByClassName("vehicle-info")[0];
    vehicleInformation.innerHTML = "";

    let selectedVehicle = null;

    for(let i=0; i<assignedVehicles.length; i++) {

        //DEBUG 1
        console.log("Vehicle:- ", assignedVehicles[i].numberplate);
        console.log("selected assigned vehicle:- ", numberplate);

        let VehicleNumberPlate =  assignedVehicles[i].numberplate || "";

        //DEBUG 2
        console.log("Comparing:- ", VehicleNumberPlate , "with ", numberplate)
        console.log("Match?:- ", VehicleNumberPlate == numberplate)

        if(VehicleNumberPlate == numberplate) {
            selectedVehicle = assignedVehicles[i];
        }

    }

    console.log("About to render...");
    renderVehicle(selectedVehicle);
    console.log("Render complete!");


    let vehicleLogs = maintenanceLogs.filter(log => log.numberplate === numberplate);

    console.log("Filtered vehicle logs:", vehicleLogs);

    renderMaintenanceLogs(vehicleLogs);

}



function renderVehicle(vehicle) {

    const vehicleInformation = document.getElementsByClassName("vehicle-info")[0];
    vehicleInformation.innerHTML = "";


    if (!vehicle) {
        vehicleInformation.classList.remove("show");
        return;
    }

    vehicleInformation.classList.add("show");

    const vehicleCard = document.createElement("div");
    vehicleCard.className = "vehicle-card";


    vehicleCard.innerHTML = `

                        <div class="vehicle-image">
                            <i class="fas fa-car"></i>
                        </div>
                        <div class="vehicle-details">
                            <h3>${vehicle.brand} ${vehicle.model} ${vehicle.year}</h3>
                            <h5>${vehicle.numberplate}</h5>
                            <div class="vehicle-status">
                                <span class="status-label">Current Status:</span>
                                <span class="status-badge ${vehicle.status.toLowerCase().replace(/\s+/g, '-')}">
                                    ${vehicle.status}
                                </span>
                            </div>
                        </div>
                        
                    `;


    vehicleInformation.appendChild(vehicleCard);

}

function renderMaintenanceLogs(maintenanceLogs) {

    const container = document.getElementById("maintenanceContainer");
    container.innerHTML = "";


    if (!maintenanceLogs || maintenanceLogs.length === 0) {

        let emptyDivTag = document.createElement("div");
        emptyDivTag.className = 'empty-div';
        emptyDivTag.innerHTML = `<p>No maintenance records found for this vehicle.</p>`;
        container.appendChild(emptyDivTag);
        return;

    }

    const tableWrapper = document.createElement("div");
    tableWrapper.className = "table-container";
    container.appendChild(tableWrapper);



    const table = document.createElement("table");
    table.className = "maintenance-table";

    table.innerHTML = `

                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Service Type</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Next Service</th>
                    </tr>
                </thead>
                
            `;

    let priority;
    let status;

    maintenanceLogs.forEach(log => {


        if (log.priority === 'High') {

            priority = 'high';

        }else if(log.priority === 'Normal') {

            priority = 'normal';

        }


        if (log.status === 'Pending') {

            status = 'pending';

        }else if(log.status === 'Completed') {

            status = 'completed';

        }

        table.innerHTML += `

                    <tr>
                        <td>${log.date}</td>
                        <td>${log.serviceType}</td>
                        <td><span class="priority-badge ${priority}">${log.priority}</span></td>
                        <td><span class="status-badge ${status}">${log.status}</span></td>
                        <td>${log.nextService}</td>
                    </tr>

          `
        ;

    });

    tableWrapper.appendChild(table);

}

function getNumberPlateFromURL() {

    const params = new URLSearchParams(window.location.search);
    return params.get("reg");

}


document.addEventListener("DOMContentLoaded", async function () {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;
        }

        const dummyData = createDummyDataInput();

        assignedVehicles = await LoadAssignedVehicles();
        maintenanceLogs = dummyData.maintenancelogs;

        renderVehicleDropdown();


        const vehicleFilter = document.getElementById("vehicleFilter");

        vehicleFilter.addEventListener("change", function () {

            filterVehicleByNumberPlate(this.value);

        });


        const urlPlate = getNumberPlateFromURL();

        if (urlPlate) {

            vehicleFilter.value = urlPlate;
            filterVehicleByNumberPlate(urlPlate);

        }else if (assignedVehicles.length > 0) {

            filterVehicleByNumberPlate(assignedVehicles[0].numberplate);

        }


    } catch (err) {

        console.error("Error during initialization:", err);

    }

});








function createDummyDataInput() {

    return {
        assignedvehicles: [
            {
                numberplate: "ABC-1234",
                type: "Sedan",
                brand: "Toyota",
                model: "Prius",
                year: 2020,
                status: "Available",
                lastServiceDate: "2024-04-12",
                nextServiceDate: "2024-05-12"
            },
            {
                numberplate: "XYZ-5678",
                type: "Sedan",
                brand: "Honda",
                model: "Civic",
                year: 2019,
                status: "Under Maintenance",
                lastServiceDate: "2024-07-12",
                nextServiceDate: "2024-05-14"
            },
            {
                numberplate: "DEF-9012",
                type: "Sedan",
                brand: "Nissan",
                model: "Leaf",
                year: 2021,
                status: "Available",
                lastServiceDate: "2024-04-02",
                nextServiceDate: "2024-05-30"
            },
            {
                numberplate: "GHI-3456",
                type: "Hatchback",
                brand: "Suzuki",
                model: "Wagon R",
                year: 2018,
                status: "Under Maintenance",
                lastServiceDate: "2024-04-18",
                nextServiceDate: "2024-05-20"
            },
            {
                numberplate: "JKL-7890",
                type: "SUV",
                brand: "BMW",
                model: "X1",
                year: 2022,
                status: "Under Maintenance",
                lastServiceDate: "2024-04-21",
                nextServiceDate: "2024-05-23"
            },
            {
                numberplate: "MNO-1234",
                type: "Sedan",
                brand: "Hyundai",
                model: "Elantra",
                year: 2020,
                status: "Available",
                lastServiceDate: "2024-04-15",
                nextServiceDate: "2024-05-19"
            }
        ],

        maintenancelogs: [
            {
                numberplate: "ABC-1234",
                date: "2024-01-15",
                serviceType: "Brake System Repair",
                priority: "High",
                status: "Pending",
                nextService: "-"
            },
            {
                numberplate: "ABC-1234",
                date: "2024-01-13",
                serviceType: "Oil Change",
                priority: "Normal",
                status: "Completed",
                nextService: "2024-04-13"
            },
            {
                numberplate: "XYZ-5678",
                date: "2024-02-01",
                serviceType: "Inspection",
                priority: "Normal",
                status: "Completed",
                nextService: "2024-05-01"
            }
        ]
    };

}
