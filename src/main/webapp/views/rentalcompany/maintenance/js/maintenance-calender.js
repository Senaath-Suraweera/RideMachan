async function checkLogin() {

    try {

        const response = await fetch("/checklogin");
        const data = await response.json();

        if (!data.loggedIn) {

            const modal = document.getElementById("loginModal");
            modal.style.display = "flex";


            document.getElementById("loginOkBtn").onclick = () => {

                window.location.href = "/login";

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

let AllEvents;
let currentYear = 2026;
let currentMonth = 3;


async function LoadCalenderEvents() {

    try {

        const response = await fetch("/maintenance/listEvents");


        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let events = await response.json();

        console.log("Events:", events);

        return events;

    } catch (err) {

        console.log(err);

    }

}

async function AddCalenderEvents() {

    try {

        const addEventForm = document.getElementById("addEventForm");

        const data = {
            vehicle_id: document.getElementById("vehicleId").value,
            service_type: document.getElementById("serviceType").value,
            status: "scheduled",
            description: document.getElementById("description").value,
            maintenance_id: 1,
            scheduled_date: document.getElementById("eventDate").value,
            scheduled_time: document.getElementById("eventTime").value,
            service_bay: document.getElementById("serviceBay").value,
            estimated_duration: document.getElementById("estimatedDuration").value,
            assigned_technician: document.getElementById("technician").value
        };

        const response = await fetch("/maintenance/addEvent", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.status === "success") {

            alert("Event added successfully!");
            closeAddAppointementModel();

            AllEvents = await LoadCalenderEvents();
            renderEvents(AllEvents);

        } else {

            alert("Error: " + result.message);

        }

    } catch (err) {

        console.log(err);

    }

}

async function UpdateCalenderEvents(event, newStatus) {

    try {

        const response = await fetch("/maintenance/updateEvent?updateType=status&eventid=" + event.id + "&status=" + newStatus, {

            method: "POST"

        });

        const result = await response.json();
        console.log(result);


        if (result.status === "success") {

            showNotification(`Event updated to "${newStatus.toUpperCase()}"`, "success");


            AllEvents = await LoadCalenderEvents();
            renderCalender();
            renderEvents(AllEvents);

        } else {

            showNotification(`Error: ${result.message}`, "error");

        }

    } catch (err) {

        console.error("Error updating event:", err);
        showNotification("Error updating event", "error");

    }

}

async function EditCalenderEvents() {



}

async function DeleteCalenderEvents(event) {

    if (!event || !event.maintenance_id) {
        showNotification("Event data is missing", "error");
        return;
    }

    const confirmDelete = confirm(`Are you sure you want to delete the event for vehicle ${event.vehicleId}?`);
    if (!confirmDelete) return;

    try {
        const response = await fetch("/maintenance/deleteEvent", {

            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ eventid: event.maintenance_id })

        });

        const result = await response.json();

        if (result.status === "success") {

            showNotification(`Event for ${event.vehicleId} deleted successfully!`, "success");


            AllEvents = await LoadCalenderEvents();
            renderCalender();
            renderEvents(AllEvents);

        } else {

            showNotification("Error: " + result.message, "error");

        }

    } catch (err) {

        console.error("Error deleting event:", err);
        showNotification("Error deleting event", "error");

    }

}

function showNotification(message, type = "info") {


    const notification = document.createElement("div");
    notification.className = `notification notification-${type}`;


    notification.innerHTML = `

                <i class="fas fa-${
                    type === "success" ? "check-circle" : "exclamation-circle"
                }"></i>
                <span>${message}</span>
                
            `;


    document.body.appendChild(notification);


    setTimeout(() => {
        notification.classList.add("show");
    }, 10);


    setTimeout(() => {

        notification.classList.remove("show");

        setTimeout(() => {

            notification.remove();

        }, 300);

    }, 3000);

}

function openAddAppointementModel() {

    let AddCalenderEventModel = document.getElementById("addEventModal");
    AddCalenderEventModel.classList.add("active");

}

function closeAddAppointementModel() {

    let AddCalenderEventModel = document.getElementById("addEventModal");
    AddCalenderEventModel.classList.remove("active");
    const form = document.getElementById("addEventForm");
    form.reset();

}



function renderEvents(events) {

    const container = document.getElementById("eventsContainer");
    if (!container) return; // safety check

    container.innerHTML = "";

    if (!events || events.length === 0) {
        container.innerHTML = "<p>No events found</p>";
        return;
    }

    events.forEach(event => {
        const div = document.createElement("div");
        div.classList.add("event-card");

        div.innerHTML = `
            <h4>${event.vehicleId} (${event.model})</h4>
            <p>Service: ${event.service}</p>
            <p>Date: ${event.scheduled_date} ${event.scheduled_time}</p>
            <p>Bay: ${event.bay}</p>
            <p>Technician: ${event.assignedTechnician}</p>
            <p>Description: ${event.description}</p>
        `;

        container.appendChild(div);
    });

}

function renderCalender() {

    let calenderDates = document.getElementById("calendarDates");
    calenderDates.innerHTML = "";

    let daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); //return last date of month

    for(let day=1; day<= daysInMonth; day++){

        let cell = document.createElement("div");
        cell.classList.add("date-cell");

        cell.innerHTML = `<strong>${day}</strong>`;

        let dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;;

        displayScheduleVehiclesNumberPlates(cell, dateString);

        calenderDates.appendChild(cell);

    }

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    document.getElementById("currentMonth").innerText = `${monthNames[currentMonth]} ${currentYear}`;

}

function displayScheduleVehiclesNumberPlates(cell,dateString) {

    if (!AllEvents || AllEvents.length === 0) {
        return;
    }

    const eventsContainer = document.createElement("div");
    eventsContainer.classList.add("date-events");

    for (let i = 0; i < AllEvents.length; i++) {

        const event = AllEvents[i];

        if (event.scheduled_date === dateString) {

            const eventIndicator = document.createElement("div");
            eventIndicator.classList.add("event-indicator", event.status || "scheduled");

            eventIndicator.textContent = event.vehicleId;

            eventIndicator.addEventListener("click", () => {

                showVehicleDetails(event);

            });

            eventsContainer.appendChild(eventIndicator);

        }

    }

    if (eventsContainer.children.length > 0) {

        cell.appendChild(eventsContainer);

    }

}

function showVehicleDetails(event) {

    let panel = document.getElementById("vehicleDetailsPanel");
    let content = document.getElementById("panelContent");

    content.innerHTML = "";

    content.innerHTML = `

                <div class="vehicle-info-content">
                    <div class="status-large ${event.status}">
                        ${event.status.replace("-", " ")}
                    </div>
            
                    <div class="vehicle-header">
                        <div class="vehicle-icon-large">
                            <i class="fas fa-car"></i>
                        </div>
                        <div>
                            <div class="vehicle-id-large">${event.vehicleId}</div>
                            <div class="vehicle-model">${event.model}</div>
                        </div>
                    </div>
            
                    <div class="appointment-details-section">
                        <div class="section-title">
                            <i class="fas fa-info-circle"></i>
                            Appointment Details
                        </div>
                        
                        <div class="detail-row">
                            <span class="detail-label">Time</span>
                            <span class="detail-value">${event.time}</span>
                        </div>
                        
                        <div class="detail-row">
                            <span class="detail-label">Bay</span>
                            <span class="detail-value">${event.bay}</span>
                        </div>
                        
                        <div class="detail-row">
                            <span class="detail-label">Duration</span>
                            <span class="detail-value">${event.estimatedDuration}</span>
                        </div>
                        
                        <div class="detail-row">
                            <span class="detail-label">Technician</span>
                            <span class="detail-value">${event.assignedTechnician}</span>
                        </div>
                    </div>
            
                    <div class="appointment-details-section">
                        <div class="section-title">
                            <i class="fas fa-wrench"></i>
                            Service Type
                        </div>
                        <div class="description-box">
                            <strong>${event.service}</strong>
                        </div>
                    </div>
            
                    <div class="appointment-details-section">
                        <div class="section-title">
                            <i class="fas fa-clipboard"></i>
                            Description
                        </div>
                        <div class="description-box">
                            ${event.description}
                        </div>
                    </div>
            
                    <div class="action-buttons" id="actionButtonsContainer">
                        <!-- Buttons will be added here -->
                    </div>
                </div>
           `;


    const actionsContainer = document.getElementById("actionButtonsContainer");


    if (event.status === "scheduled") {

        const startBtn = document.createElement("button");
        startBtn.classList.add("btn", "btn-success");
        startBtn.innerHTML = `<i class="fas fa-play"></i> Start Service`;
        startBtn.addEventListener("click", async () => {

            await UpdateCalenderEvents(event, "in-progress");


        });

        actionsContainer.appendChild(startBtn);

    }


    if (event.status === "in-progress") {

        const completeBtn = document.createElement("button");
        completeBtn.classList.add("btn", "btn-success");
        completeBtn.innerHTML = `<i class="fas fa-check"></i> Mark Complete`;
        completeBtn.addEventListener("click", async () => {

            await UpdateCalenderEvents(event, "completed");


        });
        actionsContainer.appendChild(completeBtn);

    }


    const editBtn = document.createElement("button");
    editBtn.classList.add("btn", "btn-secondary");
    editBtn.innerHTML = `<i class="fas fa-edit"></i> Edit`;
    editBtn.addEventListener("click", () => {

        editAppointment(event.maintenance_id);


    });
    actionsContainer.appendChild(editBtn);


    const deleteBtn = document.createElement("button");
    deleteBtn.classList.add("btn", "btn-danger");
    deleteBtn.innerHTML = `<i class="fas fa-trash"></i> Delete`;
    deleteBtn.addEventListener("click", async () => {

        await DeleteCalenderEvents(event);

    });
    actionsContainer.appendChild(deleteBtn);



    panel.classList.add("open");

    if (window.innerWidth <= 1200) {

        panel.scrollIntoView({ behavior: "smooth" });

    }

}

document.addEventListener("DOMContentLoaded", async function () {

    try {

        /*const loggedIn = await checkLogin();

        if (!loggedIn) {
          return;    // stop here if not logged in
        }*/

        AllEvents = await LoadCalenderEvents();
        renderEvents(AllEvents);
        renderCalender();


    } catch (err) {

        console.error("Error during initialization:", err);

    }

});

document.getElementById("addEventBtn").addEventListener("click",function() {

    openAddAppointementModel();

});

document.getElementById("addEventForm").addEventListener("submit",async function(e) {

    e.preventDefault();

    await AddCalenderEvents();

});


document.getElementById("prevMonth").addEventListener("click", () => {

    currentMonth--;

    if (currentMonth < 0) {

        currentMonth = 11;
        currentYear--;

    }

    renderCalender();

});


document.getElementById("nextMonth").addEventListener("click", () => {

    currentMonth++;

    if (currentMonth > 11) {

        currentMonth = 0;
        currentYear++;

    }

    renderCalender();

});


document.getElementById("closePanel").addEventListener("click", () => {

    const panel = document.getElementById("vehicleDetailsPanel");
    panel.classList.remove("open");

});








/*

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

}*/