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
                                  <div class="staff-rating">
                                      <i class="fas fa-star"></i>
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