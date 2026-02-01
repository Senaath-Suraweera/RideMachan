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

function renderdrivers(drivers) {

    let driversGrid = document.getElementById("driversGrid");
    driversGrid.innerHTML = "";


    drivers.forEach(driver => {

        const rating = driver.rating || 0;
        const trips = driver.trips || 0;

        const driverCard = document.createElement("div");
        driverCard.className = "driver-card";

        driverCard.innerHTML = `                                    
                                    <div class="driver-status status-${driver.status}">
                                        ${driver.status}
                                    </div>
    
                                    <div class="driver-header">   
                                        <div class="driver-avatar" style="border: 1px solid red">${driver.initials}</div>                                                 
                                        <div class="driver-info">
                                            <h3>${driver.firstName} ${driver.lastName}</h3>
                                            <p class="driver-id">Driver ID: ${driver.driverId}</p>
                                        </div>
                                    </div>
    
                                    <div class="driver-rating">
                                        <i class="fas fa-star rating-star"></i>
                                        <span><strong>${rating}</strong></span>
                                        <span class="rating-text">(${trips} trips)</span>
                                    </div>
    
                                    <div class="driver-details">
                                        <div class="detail-item">
                                            <i class="fas fa-map-marker-alt detail-icon"></i>
                                            <span>Area: ${driver.area}</span>
                                        </div>
                                        <div class="detail-item">
                                            <i class="fas fa-phone detail-icon"></i>
                                            <span>${driver.mobileNumber}</span>
                                        </div>
                                        <div class="detail-item">
                                            <i class="fas fa-id-card detail-icon"></i>
                                            <span>License: ${driver.driverLicenceNumber}</span>
                                        </div>
                                        <div class="detail-item">
                                            <i class="fas fa-calendar detail-icon"></i>
                                            <span>Expires: ${driver.licenceExpiration}</span>
                                        </div>
                                    </div>
    
                                    ${driver.currentBooking    ?

            `
                                                               <div class="current-booking">
                                                                   <div class="booking-header">
                                                                       <span class="booking-title">Current Booking</span>
                                                                       <span class="booking-id">${driver.currentBooking.id}</span>
                                                                   </div>
                                                                   <div class="booking-details">
                                                                       <span><i class="fas fa-clock"></i> ${driver.currentBooking.time}</span>
                                                                       <span><i class="fas fa-car"></i> ${driver.currentBooking.vehicle}</span>
                                                                   </div>
                                                                   <div class="booking-details">
                                                                       <span><i class="fas fa-user"></i> Customer: ${driver.currentBooking.customer}</span>
                                                                   </div>
                                                               </div>
                                                                `
                                                              : ""
        }
    
                                   <div class="driver-actions">
                                       <button class="action-btn" onclick="window.driverManager.messageDriver('${driver.driverId}')">
                                           <i class="fas fa-comment"></i>
                                           Message
                                       </button>    
                                       <button class="action-btn primary" data-driver-id="${driver.driverId}">
                                           Assign Booking
                                       </button>
                                   </div>
                                `;

        driversGrid.appendChild(driverCard);


    })

}

function OpenAddDrivermodel() {

    const AddDriverModel = document.getElementById("Add-Driver-Modal");
    AddDriverModel.style.display = "block";
    AddDriverModel.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

}

function CLoseAddDrivermodel() {

    let AddDriverModel = document.getElementById("Add-Driver-Modal");
    AddDriverModel.style.display = "none";
    document.body.style.overflow = "auto";
    const form = document.getElementById("addDriverform");
    form.reset();





}

async function addDriver() {

    const addDriverForm = document.getElementById("addDriverform");

    const formData = new FormData(addDriverForm);

    const response = await fetch("/driver/signup", {

        method:"POST",
        body:formData

    });

    if(response.ok) {

        alert("Driver added successfully!");
        CLoseAddDrivermodel();

        AllDrivers = await LoadAllDrivers();
        renderdrivers(AllDrivers);
    }


}






document.addEventListener("DOMContentLoaded", async function() {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;    // stop here if not logged in
        }

        AllDrivers = await LoadAllDrivers();
        renderdrivers(AllDrivers);


    } catch (err) {

        console.error("Error during initialization:", err);

    }

});

document.addEventListener("input", async function() {

    let driverSearchInput = document.getElementsByClassName("search-input")[0];
    let inputValue = driverSearchInput.value;

    inputValue = driverSearchInput.trim();

    console.log("Input value:", inputValue, "isNaN:", isNaN(inputValue));

    if(inputValue === "") {
        AllDrivers = await LoadAllDrivers();
        renderdrivers(AllDrivers);
        return;
    }

    if(!isNaN(inputValue)) {
        filterDriverByDriverId(inputValue);
    }else {
        filterDriversByText(inputValue);
    }

});

document.getElementById("Add-Driver-Button").addEventListener("click",function() {

    openAddStaffModal();

})

document.getElementById("addDriverform").addEventListener("submit",async function(e) {

    e.preventDefault();

    await addDriver();

})















//OpenAddDrivermodel();

//CLoseAddDrivermodel();

//DisplayWithAddedDriver();