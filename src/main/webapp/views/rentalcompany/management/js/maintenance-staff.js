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

    maintenanceStaffs.forEach(maintenanceStaff => {

        maintenanceStaff.initials = maintenanceStaff.initials || maintenanceStaff.firstname?.[0] || "";
        maintenanceStaff.status = maintenanceStaff.status || "Unknown";
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
                                  <p class="staff-specialization">${maintenanceStaff.specialization}</p>
                                  <div class="staff-jobs">
                                      <span class="job-count">(${maintenanceStaff.completedJobs} jobs)</span>
                                  </div>
                              </div>
                              <div class="status-badge ${maintenanceStaff.status}">${maintenanceStaff.status}</div>
                          </div>
                          <div class="vehicle-assignments">
                              <h4>Vehicle Assignments</h4>
                              <div class="assignment-badge">${maintenanceStaff.assignedVehicles.length}</div>
                              <div class="vehicle-list">
                                  ${maintenanceStaff.assignedVehicles.map(v => `<div class="vehicle-item">${v}</div>`).join('')}
                                  ${maintenanceStaff.moreVehiclesCount ? `<div class="vehicle-more">+${maintenanceStaff.moreVehiclesCount} more vehicles</div>` : ''}
                              </div>
                          </div>
                          <div class="staff-details">
                              <div class="detail-item"><i class="fas fa-phone"></i><span>${maintenanceStaff.contactNumber}</span></div>
                              <div class="detail-item"><i class="fas fa-calendar"></i><span>${maintenanceStaff.yearsOfExperience} years exp.</span></div>
                              <div class="detail-item"><i class="fas fa-car"></i><span>${maintenanceStaff.assignedVehicles.length} vehicles</span></div>
                          </div>
                          <div class="staff-badges">
                              ${maintenanceStaff.certifications.map(cert => `<span class="badge">${cert}</span>`).join('')}
                          </div>
                          <div class="staff-actions">
                              <a href="maintenance-staffprofile1.html">
                                  <button class="btn-secondary" onclick="viewStaffDetails('${maintenanceStaff.staffId}')">
                                      <i class="fas fa-eye"></i>
                                      View Details
                                  </button>
                              </a>
                              <button class="btn-secondary" onclick="messageStaff('${maintenanceStaff.staffId}')">
                                  <i class="fas fa-comment"></i>
                                  Message
                              </button>
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
        alert("Staff added successfully!");
        closeAddStaffModal();

        AllMaintenaceStaff = await loadAllMaintenanceStaff();
        renderMaintenanceStaff(AllMaintenaceStaff);

        const stats = await loadStaffStatistics();

        if (stats) {
            renderStaffStatistics(stats);
        }

    }else{
        alert("Error: " + result.message);
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