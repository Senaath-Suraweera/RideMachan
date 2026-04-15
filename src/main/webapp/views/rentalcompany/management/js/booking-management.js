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


function renderBookings(bookings) {

    const bookingGrid = document.getElementById("bookingGrid");


    bookings.forEach(booking => {

        const bookingCard = document.createElement("div");
        bookingCard.className = "booking-card";

        const statusClass = `status-${booking.status.toLowerCase()}`;

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
                                <a href="customer-profile1.html" id="customerLink">
                                    <button class="btn btn-outline">
                                        <i class="fas fa-edit"></i>
                                        View Customer
                                    </button>
                                </a>
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


document.addEventListener("DOMContentLoaded", async function() {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;    // stop here if not logged in
        }

        AllBookings = await LoadAllBookings();
        filterBookingsByDate();


    } catch (err) {

        console.error("Error during initialization:", err);

    }

});

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
