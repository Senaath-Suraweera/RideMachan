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




let AllBookings;
let selectedBookingId = null;

async function LoadAllBookings() {

    try {

        let response = await fetch(`/displaybookings`);

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

async function LoadAllTripAvailableDrivers(bookingId) {

    try {

        let response = await fetch(`/display/trip/available/drivers?bookingId=${bookingId}`);


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


    setTimeout(() => {

        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 300);

    }, 3000);

}


function renderBookings(bookings) {

    const bookingGrid = document.getElementById("bookingGrid");


    bookings.forEach(booking => {

        let bookingCard = document.createElement("div");
        bookingCard.className = "booking-card";

        let statusClass = `status-${booking.status.toLowerCase()}`;
        let showAssignDriver = shouldShowAssignDriver(booking);

        bookingCard.innerHTML = `
                            <div class="booking-header">
                                <div class="booking-info">
                                    <h3 class="booking-id">Booking ${booking.bookingId}</h3>
                                    <span class="booking-date">Booked on ${booking.bookedDate}</span>
                                    <span class="status-badge ${statusClass}">${booking.status}</span>
                                </div>
                                <div class="booking-amount">
                                    <span class="amount">Rs ${booking.totalAmount}</span>
                                    <span class="payment-status">Payment: ${booking.paymentStatus}</span>
                                </div>
                            </div>

                            <div class="booking-details">
                                <div class="detail-section">
                                    <div class="section-header">
                                        <i class="fas fa-user"></i>
                                        <span>Customer Details</span>
                                    </div>
                                    <div class="section-content">
                                        <p class="customer-name">${booking.customerName}</p>
                                        <p class="customer-contact">
                                            <i class="fas fa-phone"></i> ${booking.customerPhoneNumber}
                                        </p>
                                        <p class="customer-email">${booking.customerEmail}</p>
                                    </div>
                                </div>

                                <div class="detail-section">
                                    <div class="section-header">
                                        <i class="fas fa-car"></i>
                                        <span>Vehicle & Driver</span>
                                    </div>
                                    <div class="section-content">
                                        <p class="vehicle-name">${booking.vehicleBrand || "N/A"} ${booking.vehicleModel || ""}</p>
                                        <p class="vehicle-plate">Plate: ${booking.numberPlate || "N/A"}</p>
                                        <p class="driver-name">Driver: ${booking.driverName || "Not assigned"}</p>
                                    </div>
                                </div>

                                <div class="detail-section">
                                    <div class="section-header">
                                        <i class="fas fa-route"></i>
                                        <span>Trip Details</span>
                                    </div>
                                    <div class="section-content">
                                        <p class="trip-date">${booking.tripStartDate} - ${booking.tripEndDate}</p>
                                        <p class="trip-time">${booking.startTimeStr} - ${booking.endTimeStr}</p>
                                        <p class="trip-route">
                                            <i class="fas fa-map-marker-alt"></i> From: ${booking.pickupLocation}<br>
                                            <i class="fas fa-flag-checkered"></i> To: ${booking.dropLocation}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div class="booking-actions">
                                ${showAssignDriver ? `
                                                    <a id="assignment" style="text-decoration: none" onclick="handleAssignDriverClick(${booking.bookingId})">
                                                        <button class="btn btn-outline">
                                                            Assign Driver
                                                        </button>
                                                    </a>
                                                ` : ``}
                            </div>
                        `;

        bookingGrid.appendChild(bookingCard);

    })

}

function addHeading(text) {

    const bookingGrid = document.getElementById("bookingGrid");
    const heading = document.createElement("h1");
    heading.textContent = text;
    bookingGrid.appendChild(heading);

}


//for differentiate Current and Past Bookings
function filterBookingsByDate() {

    const bookingGrid = document.getElementById("bookingGrid");
    bookingGrid.innerHTML = "";

    if (!Array.isArray(AllBookings)) {
        console.error("Expected an array from the server", AllBookings);
        return;
    }

    let filteredCurrentBookings = [];
    let filteredPastBookings = [];

    for(let i=0; i<AllBookings.length; i++) {

        if(AllBookings[i].status.toLowerCase() === 'completed') {
            filteredPastBookings.push(AllBookings[i]);
        }else {
            filteredCurrentBookings.push(AllBookings[i]);
        }

    }

    if(filteredCurrentBookings.length > 0) {
        addHeading("Current Bookings");

        renderBookings(filteredCurrentBookings);
    }

    if(filteredPastBookings.length > 0) {
        addHeading("Past Bookings");

        renderBookings(filteredPastBookings);
    }

}

//for search by booking id
function filterBookingByBookingId(bookingId) {

    const bookingGrid = document.getElementById("bookingGrid");
    bookingGrid.innerHTML = "";

    let filteredBookings = [];


    for(let i=0; i<AllBookings.length; i++) {

        if(AllBookings[i].bookingId == bookingId) {
            filteredBookings.push(AllBookings[i]);
        }

    }

    renderBookings(filteredBookings);

}

//for search by customer name or vehicleBrand or vehicleModel
function filterBookingsByText(searchText) {

    const bookingGrid = document.getElementById("bookingGrid");
    bookingGrid.innerHTML = "";

    let inputLower = searchText.toLowerCase();
    let filteredBookings = [];

    for(let i=0; i<AllBookings.length; i++) {

        //DEBUGGING 1
        console.log("Customer name:- ", AllBookings[i].customerName)
        console.log("Search text:- ", inputLower)

        let customerName = AllBookings[i].customerName || "";
        let customerLower = customerName.toLowerCase().trim();
        let vehicleBrand = AllBookings[i].vehicleBrand || "";
        let vehicleModel = AllBookings[i].vehicleModel || "";
        let vehicleLower = (vehicleBrand + " " + vehicleModel).toLowerCase().trim();

        //DEBUGGING 2
        console.log("Comparing:- ", customerLower, "with ",inputLower)
        console.log("Match?:- ", customerLower.includes(inputLower))

        if(customerLower.includes(inputLower) || vehicleLower.includes(inputLower)) {
            filteredBookings.push(AllBookings[i]);
        }

    }

    console.log("Filtered bookings count:", filteredBookings.length);
    console.log("About to render...");
    renderBookings(filteredBookings);
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

        let tripStatus =  AllBookings[i].status.toLowerCase() || "";

        //DEBUG 2
        console.log("Comparing:- ", tripStatus , "with ", status.toLowerCase())
        console.log("Match?:- ", tripStatus == status.toLowerCase())

        if(tripStatus == status.toLowerCase()) {
            filteredBookings.push(AllBookings[i]);
        }

    }

    console.log("Filtered bookings count:", filteredBookings.length);
    console.log("About to render...");
    renderBookings(filteredBookings);
    console.log("Render complete!");

}

function shouldShowAssignDriver(booking) {

    let instruction = (booking.specialInstructions || "").toLowerCase();

    return instruction.includes("self drive") && !(booking.driverName);

}

function renderActiveDrivers(Alldrivers) {

    let container = document.getElementById("driversContainer");
    container.innerHTML = "";

    if (!Array.isArray(Alldrivers)) {
        console.error("Drivers data invalid");
        return;
    }

    Alldrivers.forEach(driver => {

        const card = document.createElement("div");

        card.style.background = "linear-gradient(135deg, #4facfe, #00c6ff)";
        card.style.color = "white";
        card.style.padding = "16px";
        card.style.borderRadius = "14px";
        card.style.cursor = "pointer";
        card.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
        card.style.transition = "all 0.25s ease";
        card.style.display = "flex";
        card.style.flexDirection = "column";
        card.style.justifyContent = "space-between";
        card.style.minHeight = "130px";
        card.style.position = "relative";
        card.styleoverflow = "hidden";

        card.innerHTML = `
            <div>
                <div style="
                    font-size:16px;
                    font-weight:700;
                    letter-spacing:0.5px;
                ">
                    🚗 ${driver.firstName} ${driver.lastName}
                </div>

                <div style="
                    font-size:12px;
                    margin-top:6px;
                    opacity:0.9;
                ">
                    Active Driver
                </div>
            </div>

            <button
                style="
                    margin-top:14px;
                    padding:8px 12px;
                    border:none;
                    border-radius:10px;
                    background:rgba(255,255,255,0.2);
                    color:white;
                    font-weight:600;
                    cursor:pointer;
                    transition:0.2s ease;
                "
            >
                Assign Driver
            </button>
        `;

        // hover effect
        card.onmouseover = () => {
            card.style.transform = "translateY(-5px) scale(1.03)";
            card.style.boxShadow = "0 12px 25px rgba(0,0,0,0.35)";
        };

        card.onmouseout = () => {
            card.style.transform = "translateY(0) scale(1)";
            card.style.boxShadow = "0 8px 20px rgba(0,0,0,0.25)";
        };

        let button = card.querySelector("button");

        button.onclick = async (e) => {
            e.stopPropagation();

            await AssignBooking(driver.driverId)



            closeDriversModal();

            if(document.getElementById("assignment")) {
                document.getElementById("assignment").remove();
            }

            showNotification(
                `Driver assigned successfully`,
                "success"
            );

        };

        container.appendChild(card);
    });
}

function openDriversModal() {

    let modal = document.getElementById("driversModal");

    if (!modal) {

        modal = document.createElement("div");
        modal.id = "driversModal";

        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100%";
        modal.style.background = "rgba(0,0,0,0.6)";
        modal.style.display = "flex";
        modal.style.justifyContent = "center";
        modal.style.alignItems = "center";
        modal.style.zIndex = "9999";

        modal.innerHTML = `
            <div style="
                width: 70%;
                max-height: 80%;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            ">

                <div style="
                    display:flex;
                    justify-content:space-between;
                    align-items:center;
                    padding:15px;
                    background:#222;
                    color:white;
                ">
                    <h2 style="margin:0;">Active Drivers</h2>
                    <button id="closeDriversBtn" style="
                        background:red;
                        color:white;
                        border:none;
                        padding:5px 10px;
                        cursor:pointer;
                    ">✖</button>
                </div>

                <div id="driversContainer" style="
                    display:grid;
                    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
                    gap:15px;
                    padding:15px;
                    overflow-y:auto;
                "></div>

            </div>
            
        `;

        document.body.appendChild(modal);


        document.getElementById("closeDriversBtn").onclick = closeDriversModal;

    }

    modal.style.display = "flex";

}

function closeDriversModal() {

    let modal = document.getElementById("driversModal");

    if (modal) {

        modal.style.display = "none";

    }

}

async function handleAssignDriverClick(bookingId) {

    selectedBookingId = bookingId;


    openDriversModal();

    let activeDrivers = await LoadAllTripAvailableDrivers(bookingId);



    renderActiveDrivers(activeDrivers);

}


document.addEventListener("DOMContentLoaded", async function() {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;    // stop here if not logged in
        }

        AllBookings = await LoadAllBookings();
        filterBookingsByDate();

        document.addEventListener("input", function() {

            let bookingInput = document.getElementById("searchInput");
            let inputValue = bookingInput.value;

            inputValue = inputValue.trim();

            console.log("Input value:", inputValue, "isNaN:", isNaN(inputValue));

            if(inputValue === "") {
                filterBookingsByDate();
                return;
            }

            if(!isNaN(inputValue)) {
                filterBookingByBookingId(inputValue);
            }else {
                filterBookingsByText(inputValue);
            }

        });

        document.addEventListener("change", function() {

            let statusFilter = document.getElementById("statusFilter");

            let selectedStatus = statusFilter.value;

            if(selectedStatus == "all") {
                filterBookingsByDate();
                return;
            }

            filterBookingsByTripStatus(selectedStatus);

        });



    } catch (err) {

        console.error("Error during initialization:", err);

    }

});
















async function AssignBooking(driverId) {

    try {

        let bookingId = selectedBookingId;


        if (!bookingId) {
            showNotification("Please fill all fields!", "error");
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

        showNotification("Booking assigned successfully!", "success");


        return data;

    } catch (err) {

        console.error("Error assigning booking:", err);
        showNotification("Failed to assign booking. See console for details!", "error");

    }

}