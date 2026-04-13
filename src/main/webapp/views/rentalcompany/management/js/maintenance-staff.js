let companyId = null;
let AllMaintenaceStaff;

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

async function loadStaffStatistics() {

    try {

        const response = await fetch("/displaystaffstatistics", {method: "POST"});
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


function renderStaffStatistics(stats) {

    const statsGrid = document.getElementsByClassName("stats-grid")[0];
    statsGrid.innerHTML = "";

    function createStatsCard(statusClass, label, value) {
        return `
            <div class="stat-card ${statusClass}">
                <div class="stat-number">${value}</div>
                <div class="stat-label">${label}</div>
            </div>
        `;
    }

    statsGrid.innerHTML += createStatsCard("", "Total Staff", stats.totalStaff || 0);
    statsGrid.innerHTML += createStatsCard("available", "Available", stats.availableStaff || 0);
    statsGrid.innerHTML += createStatsCard("on-job", "On Job", stats.onJobStaff || 0);
    statsGrid.innerHTML += createStatsCard("offline", "Offline", stats.offlineStaff || 0);
    statsGrid.innerHTML += createStatsCard("vehicles", "Total Vehicles", stats.totalVehicles || 0);

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

function renderMaintenanceStaff(maintenanceStaffs) {

    const staffGrid = document.getElementsByClassName("staff-grid")[0];
    staffGrid.innerHTML = "";

    let status;

    maintenanceStaffs.forEach(maintenanceStaff => {

        maintenanceStaff.initials = maintenanceStaff.initials || maintenanceStaff.firstname?.[0] || "";

        status = maintenanceStaff.status ? maintenanceStaff.status.charAt(0).toUpperCase() + maintenanceStaff.status.slice(1).toLowerCase(): "";

        maintenanceStaff.specialization = maintenanceStaff.specialization || "";
        maintenanceStaff.completedJobs = maintenanceStaff.completedJobs || 0;
        maintenanceStaff.assignedVehicles = maintenanceStaff.assignedVehicles || [];
        maintenanceStaff.moreVehiclesCount = maintenanceStaff.moreVehiclesCount || 0;
        maintenanceStaff.certifications = maintenanceStaff.certifications || [];
        maintenanceStaff.yearsOfExperience = maintenanceStaff.yearsOfExperience || 0;

        const staffCard = document.createElement("div");
        staffCard.className = "staff-card";
        staffCard.dataset.status = maintenanceStaff.status;

        staffCard.innerHTML = `                  
                          <div class="staff-header">
                              <div class="staff-avatar">${maintenanceStaff.initials}</div>
                              <div class="staff-info">
                                  <h3 class="staff-name">${maintenanceStaff.firstname + " " + maintenanceStaff.lastname}</h3>
                                  <p class="staff-id">Staff ID: ${maintenanceStaff.staffId}</p>
                                  <div class="staff-jobs">
                                      <i class="fas fa-star rating-star"></i>  
                                      <span class="job-count">(${maintenanceStaff.completedJobs} jobs)</span>
                                  </div>
                              </div>
                              <div class="staff-status status-badge ${maintenanceStaff.status}">${status}</div>
                          </div>
                          <div class="staff-details">
                              <div class="detail-item"><i class="fas fa-phone detail-icon"></i><span>+ ${maintenanceStaff.contactNumber}</span></div>
                              <div class="detail-item"><i class="fas fa-calendar detail-icon"></i><span>Years of Experience: ${maintenanceStaff.yearsOfExperience}</span></div>
                              <div class="detail-item"><i class="fas fa-car detail-icon"></i><span>Assigned Vehicles: ${maintenanceStaff.assignedVehicles.length}</span></div>
                              <div class="detail-item"><i class="fas fa-wrench detail-icon"></i><span>${maintenanceStaff.specialization}</span></div>  
                          </div>
                          <div class="staff-badges">
                              ${maintenanceStaff.certifications.map(cert => `<span class="badge">${cert}</span>`).join('')}
                          </div>
                          <div class="staff-actions">
                              <button class="action-btn" onclick="messageStaff('${maintenanceStaff.staffId}')">
                                      <i class="fas fa-comment"></i>
                                      Message
                              </button>
                              <a href="maintenance-vehicle-assignment.html">
                                  <button class="action-btn primary" data-staff-id="${maintenanceStaff.staffId}">
                                          View Assign Vehicles
                                  </button> 
                              </a>
                              
                              <!--<button class="action-btn primary" data-staff-id="${maintenanceStaff.staffId}" onclick="viewAssignedVehicles('${maintenanceStaff.staffId}')">
                                      View Assign Vehicles
                              </button> -->                                                          
                          </div>                         
                       `;

        staffGrid.appendChild(staffCard);

    })

}

//for search by staff id
function filterStaffByStaffId(staffId) {

    const staffGrid = document.getElementsByClassName("staff-grid")[0];
    staffGrid.innerHTML = "";

    let filteredStaff = [];


    for(let i=0; i<AllMaintenaceStaff.length; i++) {

        if(AllMaintenaceStaff[i].staffId == staffId) {
            filteredStaff.push(AllMaintenaceStaff[i]);
        }

    }

    renderMaintenanceStaff(filteredStaff);

}

// Search staff by name or specialization
function filterStaffByText(searchText) {

    const staffGrid = document.getElementsByClassName("staff-grid")[0];
    staffGrid.innerHTML = "";

    let inputLower = searchText.toLowerCase().trim();
    let filteredStaff = [];

    for(let i=0; i<AllMaintenaceStaff.length; i++) {

        let staff = AllMaintenaceStaff[i];


        let staffName = (staff.firstname + " " + staff.lastname).toLowerCase().trim();
        let specialization = (staff.specialization || "").toLowerCase().trim();


        if (staffName.includes(inputLower) || specialization.includes(inputLower)) {
            filteredStaff.push(staff);
        }

    }

    console.log("Filtered staff count:", filteredStaff.length);
    renderMaintenanceStaff(filteredStaff);

}

//search Available,On Job,available staff
function filterStaffByStaffStatus(status) {

    const staffGrid = document.getElementsByClassName("staff-grid")[0];
    staffGrid.innerHTML = "";

    let filteredStaff = [];

    let selectedStatus = status.toLowerCase().trim();
    AllMaintenaceStaff[i].status = AllMaintenaceStaff[i].status.toLowerCase().trim();

    for(let i=0; i<AllMaintenaceStaff.length; i++) {

        //DEBUG 1
        console.log("staff status:- ", AllMaintenaceStaff[i].status)
        console.log("selected staff status:- ", status)

        let staffStatus =  AllMaintenaceStaff[i].status || "";

        //DEBUG 2
        console.log("Comparing:- ", staffStatus , "with ", status)
        console.log("Match?:- ", staffStatus == selectedStatus)

        if(staffStatus == status) {
            filteredStaff.push(AllMaintenaceStaff[i]);
        }

    }

    console.log("Filtered staff count:", filteredStaff.length);
    console.log("About to render...");
    renderMaintenanceStaff(filteredStaff);
    console.log("Render complete!");

}



function openAddStaffModal() {

    const modal = document.getElementById("addStaffModal");
    modal.style.display = "block";
    modal.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

}

function closeAddStaffModal() {

    let addStaffModal = document.getElementById("addStaffModal");
    addStaffModal.style.display = "none";
    document.body.style.overflow = "auto";

    const form = document.getElementById("addStaffForm");
    form.reset();

}

async function addMaintenanceStaff() {

    const addStaffForm = document.getElementById("addStaffForm");


    const data = {
        username: addStaffForm.username.value,
        firstname: addStaffForm.firstname.value,
        lastname: addStaffForm.lastname.value,
        contactNumber: addStaffForm.contactNumber.value,
        email: addStaffForm.email.value,
        password: addStaffForm.password.value,
        companyId: companyId,
        specialization: addStaffForm.specialization.value,
        yearsOfExperience: parseFloat(addStaffForm.yearsOfExperience.value)
    };

    const response = await fetch("/maintenancestaff/signup", {

        method:"POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    const result = await response.json();

    if(result.status === "success") {
        showNotification("Staff added successfully!", "success");
        closeAddStaffModal();

        AllMaintenaceStaff = await loadAllMaintenanceStaff();
        renderMaintenanceStaff(AllMaintenaceStaff);

        const stats = await loadStaffStatistics();

        if (stats) {
            renderStaffStatistics(stats);
        }

    }else{
        showNotification("Staff adding is Failrd", "error");
    }

}


document.addEventListener("DOMContentLoaded", async function() {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;    // stop here if not logged in
        }

        AllMaintenaceStaff = await loadAllMaintenanceStaff();
        renderMaintenanceStaff(AllMaintenaceStaff);

        const stats = await loadStaffStatistics();

        if (stats) {
            renderStaffStatistics(stats);
        }


    } catch (err) {

        console.error("Error during initialization:", err);

    }

});

document.getElementById("addStaffModal").addEventListener("click", function (event){

    if (event.target === this) {
        closeAddStaffModal();
    }

});

document.getElementById("addStaffForm").addEventListener("submit",async function (e){

    e.preventDefault();

    await addMaintenanceStaff();

});


document.addEventListener("input", async function() {

    let staffInput = document.getElementById("staffSearch");
    let inputValue = staffInput.value;

    inputValue = inputValue.trim();

    console.log("Input value:", inputValue, "isNaN:", isNaN(inputValue));

    if(inputValue === "") {
        AllMaintenaceStaff = await loadAllMaintenanceStaff();
        renderMaintenanceStaff(AllMaintenaceStaff);
        return;
    }

    if(!isNaN(inputValue)) {
        filterStaffByStaffId(inputValue);
    }else {
        filterStaffByText(inputValue);
    }

});

document.addEventListener("change", async function() {

    let statusFilter = document.getElementById("staffFilter");

    let selectedStatus = statusFilter.value;

    if(selectedStatus == "all") {
        AllMaintenaceStaff = await loadAllMaintenanceStaff();
        renderMaintenanceStaff(AllMaintenaceStaff);
        return;
    }

    filterStaffByStaffStatus(selectedStatus);

});