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

async function loadStatistics() {

    try {

        const response = await fetch("/display/maintenancestatistics", {method: "POST"});
        console.log(response);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }


        const data = await response.json();

        console.log(data);


        return data;

    }catch (err) {

        console.log(err);

    }

}

async function loadMaintenanceDistribution() {

    try {

        const response = await fetch("/display/maintenance/distribution", {method: "POST"});
        console.log(response);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }


        const data = await response.json();

        console.log(data);


        return data;

    }catch (err) {

        console.log(err);

    }

}

async function loadRecentMaintenance() {

    try {

        const response = await fetch("/display/recent/maintenance", {method: "POST"});
        console.log(response);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }


        const data = await response.json();

        console.log(data);


        return data;

    }catch (err) {

        console.log(err);

    }

}

async function loadUpcomingMaintenance() {

    try {

        const response = await fetch("/displayupcomingmaintenance", {method: "POST"});
        console.log(response);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }


        const data = await response.json();

        console.log(data);


        return data;

    }catch (err) {

        console.log(err);

    }

}

async function loadFleetHealth() {

    try {

        const response = await fetch("/displayfleethealth", {method: "POST"});
        console.log(response);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }


        const data = await response.json();

        console.log(data);


        return data;

    }catch (err) {

        console.log(err);

    }

}

function renderStatistics(stats) {

    const statsGrid = document.getElementsByClassName("stats-cards")[0];
    statsGrid.innerHTML = "";


    function createStatsCard(iconClass, colorClass, label, value, changeText = "", isPositive = true) {
        return `
            <div class="stat-card">
                <div class="card-header">
                    <div>
                        <div class="card-value">${value}</div>
                        <div class="card-label">${label}</div>
                    </div>
                    <div class="card-icon ${colorClass}">
                        <i class="${iconClass}"></i>
                    </div>
                </div>
                ${changeText ? `
                    <div class="card-change ${isPositive ? "positive" : ""}">
                        ${isPositive && changeText.includes("+") ? '<i class="fas fa-arrow-up"></i>' : ""}
                        <span>${changeText}</span>
                    </div>` : ""}
            </div>
        `;
    }

    statsGrid.innerHTML += createStatsCard("fas fa-car", "purple", "OverdueMaintenance", stats.overdueMaintenance || 0, "Higher Priority", true);
    statsGrid.innerHTML += createStatsCard("fas fa-calendar-check", "blue", "Completed Today Jobs", stats.completedToday || 0, "Jobs completed", true);
    statsGrid.innerHTML += createStatsCard("fas fa-car-side", "green", "Linked Vehicles", stats.linkedVehicles || 0, "Under management", false);
    statsGrid.innerHTML += createStatsCard("fas fa-clock", "orange", "Pending Maintenance", stats.pendingMaintenance || 0, "Require attention", false);

}


function renderMaintenanceDistribution(distribution) {

    const container = document.querySelector(".distribution-card");
    container.innerHTML = "";

    container.innerHTML += `
                    <div class="card-header">
                        <h3 class="card-title">Maintenance Types Distribution</h3>
                        <p class="card-subtitle">Breakdown of maintenance activities</p>
                    </div>
                `;

    const listContainer = document.createElement("div");
    listContainer.className = "distribution-list";
    container.appendChild(listContainer);


    function createDistributionItem(type, percentage) {

        const dataType = type.toLowerCase().split(" ")[0];

        return `
            <div class="distribution-item">
                <div class="distribution-info">
                    <span class="distribution-label">${type}</span>
                    <span class="distribution-percentage">${percentage}%</span>
                </div>
                <div class="distribution-bar">
                    <div class="distribution-fill" data-type="${dataType}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;

    }


    distribution.forEach(item => {

        listContainer.innerHTML += createDistributionItem(item.type, item.percentage);

    });

}

function renderRecentMaintenance(recentMaintenance) {

    const recentContainer = document.getElementsByClassName("recent-activity")[0];
    recentContainer.innerHTML = "";

    recentContainer.innerHTML += `<h3>Recent Maintenance</h3>
                                  <div class="activity-list" id="recentActivityList"></div>
                                  `;

    const activityList = document.getElementById("recentActivityList");

    function createActivityItem(iconClass, title, description, timeText) {

        return `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}"></div>
                <div class="activity-content">
                    <div class="activity-title">${title}</div>
                    <div class="activity-description">${description}</div>
                </div>
                <div class="activity-time">${timeText}</div>
            </div>
        `;

    }


    recentMaintenance.forEach(item => {

        activityList.innerHTML += createActivityItem(item.status, item.title, item.description, item.time);

    });

}

function renderUpcomingTasks(upcomingTasks) {

    const upcomingContainer = document.getElementsByClassName("upcoming-activity")[0];
    upcomingContainer.innerHTML = "";

    upcomingContainer.innerHTML += `
        <h3>Upcoming Tasks</h3>
        <div class="activity-list" id="upcomingActivityList"></div>
    `;

    const activityList = document.getElementById("upcomingActivityList");

    function createActivityItem(iconClass, title, description, timeText) {

        return `
            <div class="activity-item">
                <div class="activity-icon ${iconClass}"></div>
                <div class="activity-content">
                    <div class="activity-title">${title}</div>
                    <div class="activity-description">${description}</div>
                </div>
                <div class="activity-time">${timeText}</div>
            </div>
        `;

    }

    const statusToIcon = {
        "Pending": "warning",
        "Scheduled": "info"
    };

    upcomingTasks.forEach(item => {

        const iconClass = statusToIcon[item.status] || "info";
        activityList.innerHTML += createActivityItem(iconClass, item.title, item.description, item.status);

    });

}

function renderFleetHealth(fleetHealth) {

    const container = document.querySelector(".content-card.fleet-health-card");
    if (!container) return;

    container.innerHTML = `

        <div class="card-header">
            <h3 class="card-title">Fleet Health Status</h3>
            <p class="card-subtitle">Overall condition of your vehicle fleet</p>
        </div>
        <div class="card-content"></div>
        
    `;

    const cardContent = container.querySelector(".card-content");


    const labelToClass = {

        "Excellent Condition": "excellent",
        "Good Condition": "good",
        "Needs Attention": "warning",
        "Critical": "critical"

    };

    fleetHealth.forEach(item => {

        const cssClass = labelToClass[item.label] || "good";

        cardContent.innerHTML += `

            <div class="health-item">
                <div class="health-info">
                    <div class="health-indicator ${cssClass}"></div>
                    <span class="health-label">${item.label}</span>
                </div>
                <div class="health-progress">
                    <div class="progress-bar">
                        <div class="progress-fill ${cssClass}" style="width: ${item.percentage}%"></div>
                    </div>
                    <span class="health-count">${item.count} vehicles</span>
                </div>
            </div>
            
        `;

    });

}



document.addEventListener("DOMContentLoaded", async function() {

    try {



          const loggedIn = await checkLogin();

          if (!loggedIn) {
              return;    // stop here if not logged in
          }



        const dummyData = createDummyDataInput();

        const stats = await loadStatistics();
        const maintenanceDistribution = await loadMaintenanceDistribution();
        const recentMaintenance = dummyData.recentMaintenance;
        const upcomingTasks = dummyData.upcomingTasks;
        const fleetHealth = dummyData.fleetHealth;

        renderStatistics(stats);
        renderMaintenanceDistribution(maintenanceDistribution);
        renderRecentMaintenance(recentMaintenance);
        renderUpcomingTasks(upcomingTasks);
        renderFleetHealth(fleetHealth);

    } catch (err) {

        console.error("Error during initialization:", err);

    }

});




























function createDummyDataInput() {
    return {
        statsCards: {
            overdueMaintenance: 87,
            completedToday: 5,
            linkedVehicles: 6,
            pendingMaintenance: 2
        },

        maintenanceDistribution: [
            { type: "Oil Changes", percentage: 35 },
            { type: "Brake Services", percentage: 28 },
            { type: "Tire Services", percentage: 22 },
            { type: "Other Services", percentage: 15 }
        ],

        recentMaintenance: [
            {status: "success",title: "Oil Change - Vehicle ABC-1234",description: "Completed 2 hours ago",time: "Completed"},
            {status: "success",title: "Brake Check - Vehicle XYZ-5678",description: "Completed yesterday",time: "Completed"}
        ],

        upcomingTasks: [
            { title: "Tire Rotation - Vehicle DEF-9012", description: "Due tomorrow", status: "Pending" },
            { title: "Engine Service - Vehicle GHI-3456", description: "Due in 3 days", status: "Scheduled" }
        ],

        fleetHealth: [
            { label: "Excellent Condition", count: 156, percentage: 63 },
            { label: "Good Condition", count: 79, percentage: 32 },
            { label: "Needs Attention", count: 8, percentage: 3 },
            { label: "Critical", count: 5, percentage: 2 }
        ]
    };
}
