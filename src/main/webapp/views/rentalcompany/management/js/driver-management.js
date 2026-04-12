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

async function AssignBooking(driverId) {

    try {

        const bookingId = document.getElementById("bookingIdInput").value.trim();


        if (!bookingId) {
            alert("Please fill all fields!");
            return;
        }





        let response = await fetch("/assignbookingdriver", {

            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `driverId=${driverId}&bookingId=${bookingId}`

        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Booking assigned:", data);

        alert("Booking assigned successfully!");


        document.getElementById("assignBookingModal").remove();


        AllDrivers = await LoadAllDrivers();
        renderdrivers(AllDrivers);

        return data;

    } catch (err) {

        console.error("Error assigning booking:", err);
        alert("Failed to assign booking. See console for details.");

    }

}

function renderdrivers(drivers) {

    let driversGrid = document.getElementById("driversGrid");
    driversGrid.innerHTML = "";

    let status;

    drivers.forEach(driver => {

        const rating = driver.rating || 0;
        const trips = driver.trips || 0;

        status = (driver.status || "").toLowerCase();

        let bookingsHtml = "";
        if (driver.bookings && driver.bookings.length > 0) {
            for (let i = 0; i < driver.bookings.length; i++) {
                const booking = driver.bookings[i];
                bookingsHtml += `
                    <div class="booking-card">
                        <div class="booking-header">
                            <span class="booking-id">Booking: ${booking.bookingId}</span>
                        </div>
                        <div class="booking-body">
                            <p><i class="fas fa-car"></i> Ride: ${booking.rideId}</p>
                            <p><i class="fas fa-money-bill"></i> Amount: Rs${booking.totalAmount} </p>
                            ${booking.customerName ? `<p><i class="fas fa-user"></i> Customer: ${booking.customerName}</p>` : ""}
                            <p>Trip Start Date: ${booking.tripStartDate}</p>
                            <p>Trip End Date: ${booking.tripEndDate}</p>
                        </div>
                    </div>
                `;
            }
        }

        const driverCard = document.createElement("div");
        driverCard.className = "driver-card";



        driverCard.innerHTML = `                                    
                                    <div class="driver-status status-${status}">
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
    
                                    ${bookingsHtml}
        
    
                                   <div class="driver-actions">
                                       <button class="action-btn" onclick="window.driverManager.messageDriver('${driver.driverId}')">
                                           <i class="fas fa-comment"></i>
                                           Message
                                       </button>    
                                       <button class="action-btn primary" data-driver-id="${driver.driverId}" onclick="openAssignBookingModel('${driver.driverId}')">
                                           Assign Booking
                                       </button>
                                   </div>
                                `;

        driversGrid.appendChild(driverCard);


    })

}


function openAssignBookingModel(driverId) {


    const existingModal = document.getElementById("assignBookingModal");
    if(existingModal) existingModal.remove();

    let assignBookingModel = document.createElement("div");
    assignBookingModel.id = "assignBookingModal";
    assignBookingModel.style.position = "fixed";
    assignBookingModel.style.top = "0";
    assignBookingModel.style.left = "0";
    assignBookingModel.style.width = "100%";
    assignBookingModel.style.height = "100%";
    assignBookingModel.style.background = "rgba(0,0,0,0.5)";
    assignBookingModel.style.display = "flex";
    assignBookingModel.style.justifyContent = "center";
    assignBookingModel.style.alignItems = "center";
    assignBookingModel.style.zIndex = "1000";

    assignBookingModel.innerHTML = `
        <div style="
            background:white; 
            padding:30px 40px; 
            border-radius:12px; 
            width:400px; 
            box-shadow: 0 5px 20px rgba(0,0,0,0.3); 
            display:flex; 
            flex-direction:column;
            align-items:center;
        ">
            <h3 style="margin-bottom:20px;">Assign Booking</h3>

            <div class="form-row" style="width:100%; display:flex; flex-direction:column; gap:15px;">                                   
                <div class="form-group" style="display:flex; flex-direction:column; width:100%;">
                    <label>Booking Id</label>
                    <input id="bookingIdInput" type="number" name="bookingid" required style="padding:8px; border-radius:5px; border:1px solid #ccc;"/>
                </div>
                <div class="form-group" style="display:flex; flex-direction:column; width:100%;">
                    <label>Pickup Location</label>
                    <input type="text" name="pickuplocation" required style="padding:8px; border-radius:5px; border:1px solid #ccc;"/>
                </div>
                <div class="form-group" style="display:flex; flex-direction:column; width:100%;">
                    <label>Drop Off Location</label>
                    <input id="dropoffLocationInput" type="text" name="dropofflocation" required style="padding:8px; border-radius:5px; border:1px solid #ccc;"/>
                </div>
            </div>

            <div style="margin-top:25px; display:flex; gap:10px; width:100%; justify-content:flex-end;">
                <button onclick="document.getElementById('assignBookingModal').remove()" 
                    style="padding:8px 15px; border:none; border-radius:6px; cursor:pointer; background:#ccc; color:#000;">
                    Cancel
                </button>
                <button onclick="AssignBooking('${driverId}')" style="padding:8px 15px; border:none; border-radius:6px; cursor:pointer; background:linear-gradient(135deg, #3a0ca3, #4361ee); color:white;">
                    Assign
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(assignBookingModel);

}



function OpenAddDriverModel() {

    const AddDriverModel = document.getElementById("Add-Driver-Modal");
    AddDriverModel.classList.add("active");

}

function CLoseAddDriverModel() {

    let AddDriverModel = document.getElementById("Add-Driver-Modal");
    AddDriverModel.classList.remove("active");
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
        CLoseAddDriverModel();

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

    let driverInput = document.getElementsByClassName("search-input")[0];
    let inputValue = driverInput.value.trim();


    console.log("Input value:", inputValue, "isNaN:", isNaN(inputValue));

    if(inputValue === "") {
        AllDrivers = await LoadAllDrivers();
        renderdrivers(AllDrivers);
        return;
    }

    if(!isNaN(inputValue)) {
        filterDriversByDriverId(inputValue);
    }else {
        filterDriversByText(inputValue);
    }

});

document.getElementById("Add-Driver-Button").addEventListener("click",function() {

    OpenAddDriverModel();

})

document.getElementById("addDriverform").addEventListener("submit",async function(e) {

    e.preventDefault();

    await addDriver();

})























//for search by staff id
function filterDriversByDriverId(driverId) {

    const driverGrid = document.getElementsByClassName("drivers-grid")[0];
    driverGrid.innerHTML = "";

    let filteredDrivers = [];


    for(let i=0; i<AllDrivers.length; i++) {

        if(AllDrivers[i].driverId == driverId) {
            filteredDrivers.push(AllDrivers[i]);
        }

    }

    renderdrivers(filteredDrivers);

}

// Search driver by name
function filterDriversByText(searchText) {

    const driverGrid = document.getElementsByClassName("drivers-grid")[0];
    driverGrid.innerHTML = "";

    let inputLower = searchText.toLowerCase().trim();
    let filteredDrivers = [];

    for(let i=0; i<AllDrivers.length; i++) {

        let driver = AllDrivers[i];
        let driverName =
            (driver.firstName + " " + driver.lastName)
                .toLowerCase()
                .trim();

        if (driverName.includes(inputLower)) {
            filteredDrivers.push(driver);
        }

    }

    console.log("Filtered driver count:", filteredDrivers.length);
    renderdrivers(filteredDrivers);

}

//search available,on-trip,offline drivers
function filterDriversByDriverStatus(status) {

    const driverGrid = document.getElementsByClassName("drivers-grid")[0];
    driverGrid.innerHTML = "";

    let filteredDrivers = [];

    let selectedStatus = status.toLowerCase().trim();


    for(let i=0; i<AllDrivers.length; i++) {

        let driverStatus =
            (AllDrivers[i].status || "").toLowerCase().trim();

        //DEBUG 1
        console.log("driver status:- ", AllDrivers[i].status)
        console.log("selected driver status:- ", selectedStatus)



        //DEBUG 2
        console.log("Comparing:- ", AllDrivers[i].status , "with ", selectedStatus)
        console.log("Match?:- ", AllDrivers[i].status == selectedStatus)

        if(driverStatus === selectedStatus) {
            filteredDrivers.push(AllDrivers[i]);
        }

    }

    console.log("Filtered drivers count:", filteredDrivers.length);
    console.log("About to render...");
    renderdrivers(filteredDrivers);
    console.log("Render complete!");

}



