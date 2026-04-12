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


let vehicle;

async function LoadVehicleDetails(numberplate,date) {

    try {

        const response = await fetch("/getvehicledetails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ numberplate, date })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        console.log("Vehicle's details:", data);

        return data;

    } catch (err) {

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
                            <h3>${vehicle.brand} ${vehicle.model} ${vehicle.year}</h3>
                            <div class="vehicle-status">
                                <span class="status-label">Current Status:</span>
                                <span class="status-badge ${vehicle.status.toLowerCase()}">
                                    ${vehicle.status}
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

    schedule.bookings.forEach(booking => {

        let startHour = splitOnlyHourPartStartTime(booking.startTime);
        let endHour = splitOnlyHourPartEndTime(booking.endTime);

        if (hour >= startHour && hour <= endHour) {
            result = { ...booking, type: "booking" };

        }

    });

    schedule.maintenance.forEach(task => {

        let startHour = splitOnlyHourPartStartTime(task.startTime);
        let endHour = splitOnlyHourPartEndTime(task.endTime);


        if (hour >= startHour && hour <= endHour) {
            result = { ...task, type: "maintenance", maintenanceType: task.type }; // include startHour, endHour
        }

    });

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


        vehicle = dummyData.vehicle;
        //vehicle = LoadVehicleDetails("ABC-1234", selectedDate);


        renderVehicleCard(vehicle);

        let schedule = createDummyDataInput().schedule;
        //let schedule = LoadAllSchedule(selectedDate);
        renderScheduleSection(schedule);

        let stats = dummyData.stats;
        //let stats = LoadStatistics(selectedDate);

        if (stats) {
            renderStatistics(stats)
        }


    } catch (err) {

        console.error("Error during initialization:", err);

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
                    startTime: "8:55",
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
            ],
            maintenance: [
                {
                    type: "Oil Change",
                    startTime: "13:15",
                    endTime: "15:34",
                    status: "Scheduled"
                }
            ]
        },
        stats: {
            totalTripsToday: 2,
            maintenanceTasksToday: 1,
            assignedDriversToday: 1
        }
    };
}
