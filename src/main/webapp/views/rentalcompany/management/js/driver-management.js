
let AllDrivers;

async function LoadAllDrivers() {

    try {

        let response = await fetch(`/displaydrivers`);

        if(!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }


        let data = await response.json();

        console.log(data);

        return data;

    }catch (err) {

        console.log(err);

    }

}

function OpenAddDriverModel() {

    const AddDriverButton = document.getElementById("Add-Driver-Button");
    const AddDriverModel = document.getElementById("Add-Driver-Modal");

    AddDriverButton.addEventListener("click",function() {

        AddDriverModel.classList.add("active");

    })

}

function CLoseAddDriverModel() {

    const AddDriverModel = document.getElementById("Add-Driver-Modal");
    const CloseButton = document.querySelector(".modal-close");
    const SubmitButton = document.getElementById("add-driver-submit-button");

    CloseButton.addEventListener("click", function() {

        AddDriverModel.classList.remove("active");

    });

    SubmitButton.addEventListener("click", function() {

        AddDriverModel.classList.remove("active");

    });

}

function OpenMessagePopUp() {

    const

}

function DisplayWithAddedDriver() {

    const addDriverForm = document.getElementById("addDriverform");

    addDriverForm.addEventListener("submit", async function(e) {

        e.preventDefault();

        const formData = new FormData(addDriverForm);

        const response = await fetch("/driver/add", {

            method:"POST",
            body:formData

        });

        if(response.ok) {
          AllDrivers = await LoadAllDrivers();
          renderDrivers(AllDrivers);
        }

    });

}



function renderDrivers(drivers) {

    let driversGrid = document.getElementById("driversGrid");


    drivers.forEach(driver => {

        const driverCard = document.createElement("div");
        driverCard.className = "driver-card";

        driverCard.innerHTML = `
                           <div class="driver-card">
                                <div class="driver-status status-${driver.status}">
                                    ${driver.status}
                                </div>
                                
                                <div class="driver-header">
                                    <div class="driver-info">
                                        <h3>${driver.firstName} ${driver.lastName}</h3>
                                        <p class="driver-id">Driver ID: ${driver.driverId}</p>
                                    </div>
                                </div>
                                
                                <div class="driver-rating">
                                    <i class="fas fa-star"></i>
                                    <span><strong>${driver.rating}</strong></span>
                                    <span class="rating-text">(${driver.trips} trips)</span>                                   
                                </div>
                                
                                <div class="driver-details">
                                    <div class="detail-item">
                                        <i class="fas fa-map-marker-alt detail-icon"></i>
                                        <span>Area: ${driver.area}</span>
                                    </div>
                                </div>
                           </div> 
                       `;

    })

}


document.addEventListener("DOMContentLoaded", async function() {

    AllDrivers = await LoadAllDrivers();
    renderDrivers(AllDrivers);

});

OpenAddDriverModel();

CLoseAddDriverModel();

DisplayWithAddedDriver();
