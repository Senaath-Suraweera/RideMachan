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




function renderVehicleTypesDropdown() {

    let vehicleTypeFilter = document.getElementById("typeFilter");
    vehicleTypeFilter.innerHTML = "";

    let allTypesOption = document.createElement("option");
    allTypesOption.value = "alltype";
    allTypesOption .textContent = `All Types`;


    vehicleTypeFilter.appendChild(allTypesOption);

    let typeOptions = [];

    assignedVehicles.forEach(vehicle => {

        if(!typeOptions.includes(vehicle.type)){

            typeOptions.push(vehicle.type);

            const option = document.createElement("option");
            option.value = vehicle.type.toLowerCase();
            option.textContent = vehicle.type;
            vehicleTypeFilter.appendChild(option);

        }

    });

}

function viewVehicle(vehiclenumberplate) {

    window.location.href = `maintenancelog.html?reg=${encodeURIComponent(vehiclenumberplate)}`;

}

function scheduleMaintenance(vehiclenumberplate) {

    window.location.href = `maintenance-calender.html?reg=${encodeURIComponent(vehiclenumberplate)}`;

}

function renderVehicleRecords(vehicles) {

    const tableCard = document.getElementsByClassName("table-card")[0];
    tableCard.innerHTML = "";

    if (!vehicles || vehicles.length === 0) {

        let emptyDivTag = document.createElement("div");
        emptyDivTag.className = 'empty-div';
        emptyDivTag.innerHTML = `<p>No Vehicles Found.</p>`;
        tableCard.appendChild(emptyDivTag);
        return;

    }


    const table = document.createElement("table");
    table.id = "vehicleTable";
    table.className = "data-table";

    table.innerHTML = `

                <thead>
                    <tr>
                        <th>Registration</th>
                        <th>Make & Model</th>
                        <th>Type</th>
                        <th>Year</th>
                        <th>Status</th>
                        <th>Last Service</th>
                        <th>Next Service</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                
            `;


    let tableBody = document.createElement("tbody");

    vehicles.forEach(vehicle => {

        const statusClass = (vehicle.status || "").toLowerCase().replace(/\s+/g, '-');

        tableBody.innerHTML += `

                    <tr>
                        <td><strong>${vehicle.numberplate}</strong></td>
                        <td>${vehicle.model}</td>
                        <td>${vehicle.type}</td>
                        <td>${vehicle.year}</td>
                        <td><span class="status ${statusClass}"><i class="fas fa-check-circle"></i> ${vehicle.status}</span></td>
                        <td>${vehicle.lastServiceDate || '-'}</td>
                        <td>${vehicle.nextServiceDate || '-'}</td>
                        <td>
                        
                            <div class="action-buttons">

                                <button class="action-btn view-btn" onclick="viewVehicle('${vehicle.numberplate}')" title="View Details">
                                    <i class="fas fa-eye"></i>
                                </button>            
                               
                                <button class="action-btn calendar-btn" onclick="scheduleMaintenance('${vehicle.numberplate}')" title="Schedule Maintenance">
                                    <i class="fas fa-calendar"></i>
                                </button>
            
                            </div>
                            
                        </td>
                    </tr>

          `
        ;

    });

    table.appendChild(tableBody);

    tableCard.appendChild(table);


}


function filterVehicleByStatus(status) {

    const statusFilter = document.getElementById("statusFilter");

    let filteredVehicles = [];



    for(let i=0; i<assignedVehicles.length; i++) {

        //DEBUG 1
        console.log("Vehicle status:- ", assignedVehicles[i].status)
        console.log("selected vehicle status:- ", status)

        let vehicleStatus =  assignedVehicles[i].status || "";

        //DEBUG 2
        console.log("Comparing:- ", vehicleStatus , "with ", status)
        console.log("Match?:- ", vehicleStatus == status)

        if(vehicleStatus.toLowerCase() == status.toLowerCase()) {
            filteredVehicles.push(assignedVehicles[i]);
        }

    }

    return filteredVehicles;

}


function filterVehicleByType(type) {

    const typeFilter = document.getElementById("typeFilter");

    let filteredVehicles = [];


    for(let i=0; i<assignedVehicles.length; i++) {

        //DEBUG 1
        console.log("Vehicle type:- ", assignedVehicles[i].type)
        console.log("selected vehicle type:- ", type)

        let vehicleType =  assignedVehicles[i].type || "";

        //DEBUG 2
        console.log("Comparing:- ", vehicleType , "with ", type)
        console.log("Match?:- ", vehicleType == type)

        if(vehicleType.toLowerCase() == type.toLowerCase()) {
            filteredVehicles.push(assignedVehicles[i]);
        }

    }

    return filteredVehicles;

}

function compareVehicle(filteredVehiclesByStatus, filteredVehiclesByType) {

    let result = [];

    if (!filteredVehiclesByStatus) {
        return filteredVehiclesByType || [];
    }

    if (!filteredVehiclesByType) {
        return filteredVehiclesByStatus || [];
    }

    for(let i=0; i<filteredVehiclesByStatus.length; i++) {

        let vehicleByStatus = filteredVehiclesByStatus[i];

        for(let j=0; j<filteredVehiclesByType.length; j++) {

            let vehicleByType = filteredVehiclesByType[j];

            if (vehicleByStatus.numberplate === vehicleByType.numberplate) {
                result.push(vehicleByStatus);
                break;
            }

        }

    }

    return result;

}


function filterVehicleRecords() {

    const statusFilter = document.getElementById("statusFilter");
    const typeFilter = document.getElementById("typeFilter");

    function updateFilteredVehicles() {

        const selectedStatus = statusFilter.value;
        const selectedType = typeFilter.value;

        const filteredByStatus = (selectedStatus === "allstatus")
            ? assignedVehicles
            : filterVehicleByStatus(selectedStatus);

        const filteredByType = (selectedType === "alltype")
            ? assignedVehicles
            : filterVehicleByType(selectedType);

        const finalFiltered = compareVehicle(filteredByStatus, filteredByType);
        renderVehicleRecords(finalFiltered);

    }

    statusFilter.addEventListener("change", updateFilteredVehicles);
    typeFilter.addEventListener("change", updateFilteredVehicles);

    updateFilteredVehicles();

}

function filterByNumberPlate() {

    let searchInput = document.getElementById("searchInput");
    let filteredVehicle = [];



    searchInput.addEventListener("input", function() {

        let inputValue = searchInput.value.trim().toLowerCase();

        if (!inputValue) {
            filterVehicleRecords();
            return;
        }

        const matchedVehicle = assignedVehicles.find(vehicle =>
            vehicle.numberplate.toLowerCase() === inputValue
        );

        if (matchedVehicle) {

            renderVehicleRecords([matchedVehicle]);

        }

    });

}


document.addEventListener("DOMContentLoaded", async function () {

    try {

        /*const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;
        }*/

        //const dummyData = createDummyDataInput();

        const response = await LoadAssignedVehicles();
        assignedVehicles = response.assignedvehicles;


        renderVehicleTypesDropdown();

        filterVehicleRecords();

        filterByNumberPlate();


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
        ]
    };

}
