const BASE_URL = "http://localhost:8080";
let companyId = null;


let vehicle;
let AllMaintenanceStaff;
let AllVehicles;

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

async function assignStaff(staffId) {

    try {

        const vehicleId = getVehicleIdFromURL();

        const response = await fetch(`${BASE_URL}/assignstaff`, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `staffId=${encodeURIComponent(staffId)}&vehicleId=${encodeURIComponent(vehicleId)}`
        });

        if (!response.ok) {
            throw new Error("Failed to assign staff");
        }

        const data = await response.json();

        console.log(data);

        showNotification("Assigned successfully", "success");

        AllMaintenanceStaff = await loadAllMaintenanceStaff();
        renderAllMaintenanceStaffWithAssociatedVehicleNumberPlate(AllMaintenanceStaff);

    } catch (err) {

        console.error(err);
        showNotification("Assign failed", "error");

    }

}


async function loadAllMaintenanceStaff() {

    try {

        const response = await fetch("/display/maintenancestaff", {
            method: "POST"
        });

        if(!response.ok){
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();

        console.log(data);


        return data;

    }catch(err) {

        console.log(err);

    }

}


async function LoadAllSchedule(date) {

    try {

        const response = await fetch("/getallschedule", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ date })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        console.log("All schedule data:", data);

        return data;

    } catch (err) {

        console.log(err);

    }

}

async function LoadStatistics(date) {

    try {

        const response = await fetch("/displaydaystatistics", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ date })
        });



        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }


        const data = await response.json();

        console.log("Statistics for", date, ":", data);


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


function findTodayDate() {

    const today = new Date();
    const options = { month: "long", day: "numeric", year: "numeric" };
    return today.toLocaleDateString(undefined, options);

}

function getTodayForInput() {

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;

}

function handleDateSection() {

    const calenderControls = document.getElementsByClassName("calendar-controls")[0];

    calenderControls.innerHTML = `
        <div class="date-selection">
            <label for="calendarDate">Select Date:</label>
            <input type="date" id="calendarDate" value="${getTodayForInput()}">
        </div>

        <div class="date-info">
            <span id="todayInfo">Today: ${findTodayDate()}</span>
        </div>
    `;

}

function openStaffModal() {

    const modal = document.getElementById("staffModal");
    modal.style.display = "flex";

    renderAllMaintenanceStaffWithAssociatedVehicleNumberPlate(AllMaintenanceStaff);

}

function closeStaffModal() {

    document.getElementById("staffModal").style.display = "none";

}

function renderAllMaintenanceStaffWithAssociatedVehicleNumberPlate(allMaintenanceStaff) {

    const container = document.getElementById("staffContainer");

    if (!container) {
        console.log("staffContainer not found");
        return;
    }

    container.innerHTML = "";

    if (!allMaintenanceStaff || allMaintenanceStaff.length === 0) {
        container.innerHTML = "<p>No maintenance staff available</p>";
        return;
    }

    allMaintenanceStaff.forEach(staff => {

        const card = document.createElement("div");
        card.className = "staff-card";

        let vehicleText = "No assigned vehicles";

        if (staff.vehicles && staff.vehicles.length > 0) {
            vehicleText = staff.vehicles.join(", ");
        }

        card.innerHTML = `
            <h3>${staff.firstname} ${staff.lastname}</h3>

            <p><b>ID:</b> ${staff.staffId}</p>

            <p><b>Experience:</b> ${staff.yearsOfExperience} years</p>

            <p><b>Vehicles:</b> ${vehicleText}</p>

            <span class="staff-status ${staff.status ? staff.status.toLowerCase() : "unknown"}">
                ${staff.status}
            </span>

            <button class="assign-staff-btn" data-id="${staff.staffId}">
                Assign
            </button>
        `;
        container.appendChild(card);
    });

}

function renderVehicleCard(vehicle) {

    let vehicleInformation = document.getElementsByClassName("vehicle-info")[0];
    vehicleInformation.innerHTML = "";


    if (!vehicle) {
        return;
    }


    const vehicleCard = document.createElement("div");
    vehicleCard.className = "vehicle-card";


    vehicleCard.innerHTML = `

                         <div class="vehicle-image">
                            <i class="fas fa-car"></i>
                         </div>
                        
                         <div class="vehicle-details">
                            <h3>${vehicle.vehicleBrand} ${vehicle.vehicleModel} ${vehicle.year}</h3>
                            <div class="vehicle-status">
                                <span class="status-label">Current Status:</span>
                                <span class="status-badge ${vehicle.availabilityStatus.toLowerCase()}">
                                    ${vehicle.availabilityStatus}
                                </span>
                            </div>
                        </div>      
                                                      
                    `;


    vehicleInformation.appendChild(vehicleCard);

}

function splitOnlyHourPartStartTime(time) {

    let hours = "";
    let minutes = "";
    let foundColon = false;

    for (let i = 0; i < time.length; i++) {
        let char = time[i];

        if (char === ":") {
            foundColon = true;
            continue;
        }

        if (!foundColon) {
            hours += char;
        } else {
            minutes += char;
        }
    }

    return hours;
}

function splitOnlyHourPartEndTime(time) {

    let hours = "";
    let minutes = "";
    let foundColon = false;

    for (let i = 0; i < time.length; i++) {
        let char = time[i];

        if (char === ":") {
            foundColon = true;
            continue;
        }

        if (!foundColon) {
            hours += char;
        } else {
            minutes += char;
        }
    }

    let h = parseInt(hours, 10);
    let m = parseInt(minutes, 10);


    if (m > 0) {
        return h;
    } else {
        return h - 1;
    }

}

function findSlotWork(schedule, hour) {

    let result = "Available";

    if(schedule.bookings) {

        schedule.bookings.forEach(booking => {

            let startHour = splitOnlyHourPartStartTime(booking.startTime);
            let endHour = splitOnlyHourPartEndTime(booking.endTime);

            if (hour >= startHour && hour <= endHour) {
                result = {...booking, type: "booking"};

            }

        });

    }

    if (schedule.maintenance) {

        schedule.maintenance.forEach(task => {

            let startHour = splitOnlyHourPartStartTime(task.startTime);
            let endHour = splitOnlyHourPartEndTime(task.endTime);


            if (hour >= startHour && hour <= endHour) {
                result = {...task, type: "maintenance", maintenanceType: task.type}; // include startHour, endHour
            }

        });

    }

    return result;
}


function renderScheduleSection(schedule) {

    let scheduleSection = document.getElementsByClassName("schedule-section")[0];

    scheduleSection.innerHTML = `
                        <h3><i class="fas fa-calendar-alt"></i> Schedule</h3>
                        <div class="schedule-timeline"></div>
                    `;

    let timeline = scheduleSection.querySelector(".schedule-timeline");

    let startHour = 8;
    let endHour = 18;



    for(let hour=startHour; hour <= endHour; hour++) {

        let time = (hour < 10 ? "0" + hour : hour) + ":00";

        let slot = document.createElement("div");
        slot.className = "time-slot";

        let slotStatus = findSlotWork(schedule, hour);

        let innerHTML = `<div class="time-label">${time}</div>`;

        if (slotStatus !== "Available") {
            if (slotStatus.type === "booking") {
                innerHTML += `
                    <div class="schedule-item booking ${slotStatus.status.toLowerCase()}">
                        <div class="booking-header">
                            <span class="booking-id">${slotStatus.id}</span>
                            <span class="booking-status">${slotStatus.status}</span>
                        </div>
                        <div class="booking-details">
                            <div class="booking-info">
                                <i class="fas fa-user"></i>
                                <span>Customer: ${slotStatus.customer}</span>
                            </div>
                            <div class="booking-info">
                                <i class="fas fa-id-card"></i>
                                <span>Driver: ${slotStatus.driver}</span>
                            </div>
                        </div>
                        <div class="booking-time">
                            <i class="fas fa-clock"></i>
                            <span>Time: ${slotStatus.startTime < 10 ? "0" + slotStatus.startTime : slotStatus.startTime}-${slotStatus.endTime < 10 ? "0" + slotStatus.endTime : slotStatus.endTime}</span>
                        </div>
                    </div>
                `;
            } else if (slotStatus.type === "maintenance") {
                innerHTML += `
                        <div class="schedule-item maintenance ${slotStatus.status.toLowerCase()}">
                            <div class="maintenance-header">
                                <span class="maintenance-type">${slotStatus.maintenanceType}</span>
                                <span class="maintenance-status">${slotStatus.status}</span>
                            </div>
                            <div class="maintenance-time">
                                <i class="fas fa-clock"></i>
                                <span>${slotStatus.startTime < 10 ? "0" + slotStatus.startTime : slotStatus.startTime}-${slotStatus.endTime < 10 ? "0" + slotStatus.endTime : slotStatus.endTime}</span>
                            </div>
                        </div>
                    `;
            }
        } else {
            innerHTML += `<div class="schedule-item available">Available</div>`;
        }

        slot.innerHTML = innerHTML;
        timeline.appendChild(slot);
    }

}

function renderStatistics(stats) {

    let dailyStatsContainer = document.getElementsByClassName("daily-stats")[0];
    dailyStatsContainer.innerHTML = "";


    function createStatsCard(label, value) {
            return `
                <div class="stat-card">
                <div class="stat-number">${value}</div>
                <div class="stat-label">${label}</div>
                </div>
            `;
    }

    dailyStatsContainer.innerHTML += createStatsCard("Total Trips Today", stats.totalTripsToday);
    dailyStatsContainer.innerHTML += createStatsCard("Maintenance Tasks Today", stats.maintenanceTasksToday);
    dailyStatsContainer.innerHTML += createStatsCard("Assigned Drivers Today", stats.assignedDriversToday);

}


document.addEventListener("DOMContentLoaded", async function () {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;    // stop here if not logged in
        }

        handleDateSection();

        const selectedDate = document.getElementById("calendarDate").value;

        const dummyData = createDummyDataInput();

        AllVehicles = await LoadVehicles();

        let vehicleIdFromURL = getVehicleIdFromURL();
        vehicle = getVehicle(vehicleIdFromURL);



        renderVehicleCard(vehicle);

        let schedule = createDummyDataInput().schedule;
        //let schedule = LoadAllSchedule(selectedDate);
        renderScheduleSection(schedule);

        let stats = dummyData.stats;
        //let stats = LoadStatistics(selectedDate);

        if (stats) {
            renderStatistics(stats)
        }

        AllMaintenanceStaff = await loadAllMaintenanceStaff();

    } catch (err) {

        console.error("Error during initialization:", err);

    }

});


document.getElementById("Vehicleassgin").addEventListener("click", openStaffModal);


document.addEventListener("click", async function (e) {

    if (e.target.classList.contains("assign-staff-btn")) {

        const staffId = e.target.getAttribute("data-id");

        console.log("Assign clicked for staff:", staffId);

        await assignStaff(staffId);
    }

});

















function createDummyDataInput() {
    return {
        vehicle: {
            numberplate: "ABC-1234",
            brand: "Toyota",
            model: "Prius",
            year: 2020,
            status: "Available"
        },
        schedule: {
            bookings: [
                {
                    id: "BK001",
                    customer: "John Smith",
                    driver: "Mike Johnson",
                    startTime: "08:55",
                    endTime: "11:48",
                    status: "Ongoing"
                },
                {
                    id: "BK002",
                    customer: "Sarah Wilson",
                    driver: "Mike Johnson",
                    startTime: "16:00",
                    endTime: "18:00",
                   status: "Ongoing"
                }
            ]
        },
        maintenanceStaff: [
            {
                id: 1,
                name: "Kamal Perera",
                status: "Available",
                vehicles: ["ABC-1234", "KJ-8890"]
            },
            {
                id: 2,
                name: "Nimal Silva",
                status: "Busy",
                vehicles: ["LM-7788"]
            },
            {
                id: 3,
                name: "Suresh Fernando",
                status: "Available",
                vehicles: []
            }
        ]
    };
}