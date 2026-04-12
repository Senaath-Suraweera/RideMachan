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
let selectedStatus = null;


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



async function updateVehicleStatus(vehicle,status) {


    try {

        if(!vehicle || !status){
            return;
        }

        const response = await fetch('/vehicle/update/status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                numberplate: vehicle.numberplate,
                status: status
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let result = await response.json();

        console.log(result);


    }catch (err) {

        console.log(err);

    }


}

async function submitInspection(data) {

    try {

        const response = await fetch('/inspection/submit', {

            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },

            body: new URLSearchParams({
                numberplate: data.numberplate,
                status: data.status,
                inspectionType: data.inspectionType,
                priorityLevel: data.priorityLevel,
                issues: data.issues,
                inspectionDate: data.inspectionDate,
                checklist: JSON.stringify(data.checklist)
            })

        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        console.log(result);

    } catch (err) {

        console.log(err);

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


function toggleCheck(item) {

    const checkBox = item.querySelector(".checkbox");

    if(checkBox.classList.contains('checked')){

        checkBox.classList.remove('checked');
        item.classList.remove('checked');

    }else{

        checkBox.classList.add('checked');
        item.classList.add('checked');

    }

    updateProgress();

}


function updateProgress() {

    const checkboxes = document.querySelectorAll('.checklist-item');
    const checkedBoxes = document.querySelectorAll('.checklist-item.checked');

    const progress = (checkedBoxes.length / checkboxes.length) * 100;

    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('progressText').textContent = Math.round(progress) + '%';

}

function handleInspectionCheckList() {

    document.querySelectorAll('.checklist-item').forEach(item => {

        item.addEventListener('click', () => toggleCheck(item));

    });

}


function handleFileInput() {

    let fileInput = document.getElementById("fileInput");
    let uploadArea = document.querySelector(".file-upload-area");
    let chooseButton = document.querySelector(".choose-files-btn");


    function selectFiles() {

        const files = fileInput.files;
        const selectedFilesContainer = document.getElementById("selectedFiles");

        selectedFilesContainer.innerHTML = "";

        if (files.length === 0) {
            return;
        }

        for (let i = 0; i < files.length; i++) {

            const file = files[i];

            const fileDiv = document.createElement("div");
            fileDiv.className = "selected-file";
            fileDiv.textContent = file.name;

            selectedFilesContainer.appendChild(fileDiv);

        }

        console.log("Selected files:", files);

    }

    fileInput.addEventListener("change", selectFiles);

    uploadArea.addEventListener("click", () => {

        //fileInput.value = "";
        fileInput.click();

    });

    chooseButton.addEventListener("click", () => {

        //fileInput.value = "";
        fileInput.click();

    });


}



function handleVehicleStatusUpdate() {

    let buttons = document.querySelectorAll('.status-btn');

    buttons.forEach(btn => {

        btn.addEventListener('click',() => {

            buttons.forEach(b => b.classList.remove('selected'));

            btn.classList.add('selected');

            selectedStatus = btn.dataset.status;

        });

    });

}



function handleSubmitButton() {

    let submitButton = document.getElementById('submitbutton');

    if(!submitButton){
        return;
    }

    submitButton.addEventListener('click', async () => {

        let vehicleCard = document.querySelector('.vehicle-info .vehicle-card');

        if (!vehicleCard) {

            showNotification("Please select a vehicle first!!", "error");
            return;

        }


        let vehicleRegInput = document.getElementById('vehiclenumber');
        if (!vehicleRegInput || !vehicleRegInput.value.trim()) {

            showNotification("Please enter Vehicle Registration number!", "error");
            return;

        }


        let inspectionType = document.getElementById('inspectiontype');
        if (!inspectionType || !inspectionType.value) {

            showNotification("Please select an Inspection Type!", "error");
            return;

        }


        let priorityLevel = document.getElementById('prioritylevel');
        if (!priorityLevel || !priorityLevel.value) {

            showNotification("Please select a Priority Level!", "error");
            return;

        }


        let checklistItems = document.querySelectorAll('.checklist-item');
        let allChecked = Array.from(checklistItems).every(item => item.classList.contains('checked'));
        if (!allChecked) {

            showNotification("Please complete all checklist items!", "error");
            return;

        }


        let issuesFound = document.getElementById('issues');
        if (!issuesFound || !issuesFound.value.trim()) {

            showNotification("Please document any issues or repairs needed!", "error");
            return;

        }


        let inspectionDate = document.getElementById('inspectionDate');
        if (!inspectionDate || !inspectionDate.value) {

            showNotification("Please select an Inspection Date!", "error");
            return;

        }


        if (!selectedStatus) {

            showNotification("Please select a vehicle status!", "error");
            return;

        }




        let numberplate = vehicleCard.querySelector('h5').textContent.trim();
        let currentvehicle = null;

        for(let i=0; i<assignedVehicles.length; i++){

            if(assignedVehicles[i].numberplate == numberplate){
                currentvehicle = assignedVehicles[i];
                break;
            }

        }

        if (!currentvehicle) {

            showNotification("Vehicle not found!", "error");
            return;

        }

        let inspectionData = {

            numberplate: numberplate,
            status: selectedStatus,
            inspectionType: inspectionType.value,
            priorityLevel: priorityLevel.value,
            issues: issuesFound.value.trim(),
            inspectionDate: inspectionDate.value,
            checklist: Array.from(document.querySelectorAll('.checklist-item')).map(item => ({
                name: item.innerText.trim(),
                checked: item.classList.contains('checked')

            }))

        };

        await submitInspection(inspectionData);

        await updateVehicleStatus(currentvehicle, selectedStatus);

        showNotification("Inspection report submitted successfully!", "success");

        currentvehicle.status = selectedStatus;

        renderVehicle(currentvehicle);



        document.querySelectorAll('.checklist-item')
            .forEach(item => item.classList.remove('checked'));

        updateProgress();
        selectedStatus = null;

    });

}

function submitInspectionForm() {

    handleInspectionCheckList();

    handleFileInput();

    handleVehicleStatusUpdate();

    handleSubmitButton();

}


document.addEventListener("DOMContentLoaded", async function() {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;
        }

        //const dummyData = createDummyDataInput();

        assignedVehicles = await LoadAssignedVehicles();

        renderVehicleDropdown();


        const vehicleFilter = document.getElementById("vehicleFilter");

        vehicleFilter.addEventListener("change", function() {

            filterVehicleByNumberPlate(this.value);

        });


        if (assignedVehicles.length > 0) {

            filterVehicleByNumberPlate(assignedVehicles[0].numberplate);

        }


        submitInspectionForm();


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
