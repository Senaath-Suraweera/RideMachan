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

let profileData;

async function LoadProfile() {

    try {

        let response = await fetch(`/load/maintenance/profile`);

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


async function UpdateProfile() {

    try {

        const firstname = document.getElementById("firstNameInput").value;
        const lastname  = document.getElementById("lastNameInput").value;
        const phone     = document.getElementById("phoneInput").value;
        const email     = document.getElementById("emailInput").value;


        if (!validate(firstname, rules.name, "First Name")) return;
        if (!validate(lastname, rules.name, "Last Name")) return;
        if (!validate(phone, rules.phone, "Phone Number")) return;
        if (!validate(email, rules.email, "Email")) return;

        let params = new URLSearchParams({
            firstname,
            lastname,
            phone,
            email
        });

        let response = await fetch(`/update/maintenance/profile?${params.toString()}`, {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {

            showNotification("Profile updated successfully!", "success");

        } else {

            showNotification("Update failed!", "error");

        }

    } catch (err) {

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

function populateProfile(data) {

    if (!data) {
        return;
    }


    document.getElementById("staffName").innerText = (data.firstname || "") + " " + (data.lastname || "");

    document.getElementById("staffPhone").innerText = data.contactNumber || "";
    document.getElementById("staffEmail").innerText = data.email || "";


    document.getElementById("companyName").innerText = data.companyName || "";
    document.getElementById("garage").innerText = data.companyCity || "";


    document.getElementById("employeeId").innerText = data.staffId || "";
    document.getElementById("shiftTime").innerText = data.status || "";


}

function openStaffEditModel(data) {


    const existingModal = document.getElementById("editModal");
    if(existingModal) {
        existingModal.remove();
    }

    let editStaffModel = document.createElement("div");
    editStaffModel.id = "editModal";
    editStaffModel.style.position = "fixed";
    editStaffModel.style.top = "0";
    editStaffModel.style.left = "0";
    editStaffModel.style.width = "100%";
    editStaffModel.style.height = "100vh";
    editStaffModel.style.background = "rgba(0,0,0,0.5)";
    editStaffModel.style.display = "flex";
    editStaffModel.style.justifyContent = "center";
    editStaffModel.style.alignItems = "center";
    editStaffModel.style.zIndex = "1000";
    editStaffModel.style.padding = "2px";

    editStaffModel.innerHTML = `
                        <div style="
                            background:white; 
                            padding:20px;
                            max-height:70vh;
                            overflow-y:auto;
                            border-radius:12px; 
                            width:720px; 
                            height: 140vh;
                            margin: auto 0;
                            box-shadow: 0 5px 20px rgba(0,0,0,0.3); 
                            display:flex; 
                            gap:30px;
                            flex-direction:column;
                            align-items:center;
                        ">
                            <h3 style="margin-bottom:20px;">Edit Maintenance Staff</h3>
                
                            <div class="form-row" style="
                                width:100%;
                                display:grid;
                                grid-template-columns: 1fr 1fr;
                                gap:15px 30px;
                            ">
                            
                                <div class="form-group" style="display:flex; flex-direction:column;">
                                    <label>First Name</label>
                                    <input id="firstNameInput" type="text" value="${data.firstname || ''}"
                                        style="padding:8px; border-radius:5px; border:1px solid #ccc;"/>
                                </div>
                            
                                <div class="form-group" style="display:flex; flex-direction:column;">
                                    <label>Last Name</label>
                                    <input id="lastNameInput" type="text" value="${data.lastname || ''}"
                                        style="padding:8px; border-radius:5px; border:1px solid #ccc;"/>
                                </div>
                            
                                <div class="form-group" style="display:flex; flex-direction:column;">
                                    <label>Phone Number</label>
                                    <input id="phoneInput" type="text" value="${data.contactNumber || ''}"
                                        style="padding:8px; border-radius:5px; border:1px solid #ccc;"/>
                                </div>
                            
                                <div class="form-group" style="display:flex; flex-direction:column;">
                                    <label>Email</label>
                                    <input id="emailInput" type="email" value="${data.email || ''}"
                                        style="padding:8px; border-radius:5px; border:1px solid #ccc;"/>
                                </div>                            
                            </div>
                
                            <div style="margin-top:25px; display:flex; gap:10px; width:100%; justify-content:flex-end;">
                
                                <button onclick="closeStaffEditModel()"
                                    style="padding:8px 15px; border:none; border-radius:6px; cursor:pointer; background:#ccc; color:#000;">
                                    Cancel
                                </button>
                
                                <button id="update-POPUp-btn" style="padding:8px 15px; border:none; border-radius:6px; cursor:pointer; background:linear-gradient(135deg, #3a0ca3, #4361ee); color:white;">
                                    Update
                                </button>
                
                            </div>
                        </div>
                    `;

    document.body.appendChild(editStaffModel);

}

function closeStaffEditModel(){

    document.getElementById('editModal').remove();

}

document.addEventListener("DOMContentLoaded", async function() {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;    // stop here if not logged in
        }

        profileData = await LoadProfile();

        populateProfile(profileData);

        document.getElementById("update-UI-btn").addEventListener("click",() => {

            openStaffEditModel(profileData);

            document.getElementById("update-POPUp-btn").addEventListener("click", async() => {

                await UpdateProfile();

                closeStaffEditModel();

                profileData = await LoadProfile();

                populateProfile(profileData);

            })

        })


        document.getElementById("changePasswordUIbtn").addEventListener("click", () =>{

            openPasswordEditModel();

            await ;

        })



        //handleProfilePictureUpload();
        //setupChangePassword();
        //setupUpdateProfileModal();



    } catch (err) {

        console.error("Error during initialization:", err);

    }

});












// ===============================
// GENERIC VALIDATION FUNCTION
// ===============================
function validate(value, rules, fieldName = "Field") {

    value = (value ?? "").toString().trim();

    // REQUIRED CHECK
    if (rules.required && value === "") {
        showNotification(`${fieldName} is required`, "error");
        return false;
    }

    // MIN LENGTH
    if (rules.minLength && value.length < rules.minLength) {
        showNotification(`${fieldName} must be at least ${rules.minLength} characters`, "error");
        return false;
    }

    // MAX LENGTH
    if (rules.maxLength && value.length > rules.maxLength) {
        showNotification(`${fieldName} must be less than ${rules.maxLength} characters`, "error");
        return false;
    }

    // PATTERN CHECK
    if (rules.pattern && !rules.pattern.test(value)) {
        showNotification(rules.message || `Invalid ${fieldName}`, "error");
        return false;
    }

    return true;
}

// ===============================
// VALIDATION RULES
// ===============================
const rules = {

    name: {
        required: true,
        minLength: 2,
        maxLength: 50,
        pattern: /^[A-Za-z\s]+$/,
        message: "Name must contain only letters"
    },

    phone: {
        required: true,
        pattern: /^(?:\+94|0)(7\d{8})$/,
        message: "Invalid Sri Lankan phone number"
    },

    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Invalid email format"
    },

    nic: {
        required: true,
        minLength: 10,
        maxLength: 12
    }
};






    function openPasswordEditModel() {

        let existingModal = document.getElementById("editPasswordModal");
        if (existingModal) {
            existingModal.remove();
        }


        let modal = document.createElement("div");
        modal.id = "editPasswordModal";

        modal.style.position = "fixed";
        modal.style.top = "0";
        modal.style.left = "0";
        modal.style.width = "100%";
        modal.style.height = "100vh";
        modal.style.background = "rgba(0,0,0,0.5)";
        modal.style.display = "flex";
        modal.style.justifyContent = "center";
        modal.style.alignItems = "center";
        modal.style.zIndex = "1000";

        modal.innerHTML = `
        <div style="
            background:white; 
            padding:20px;
            border-radius:12px; 
            width:400px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3); 
            display:flex; 
            flex-direction:column;
            gap:15px;
        ">

            <h3>Change Password</h3>

            <input id="newPasswordInput" type="password" placeholder="New Password"/>
            <input id="confirmPasswordInput" type="password" placeholder="Confirm Password"/>

            <div style="display:flex; justify-content:flex-end; gap:10px;">

                <button onclick="closePasswordEditModel()"
                    style="padding:8px 15px; border:none; border-radius:6px; background:#ccc;">
                    Cancel
                </button>

                <button id="change-password-btn"
                    style="padding:8px 15px; border:none; border-radius:6px; background:linear-gradient(135deg, #3a0ca3, #4361ee); color:white;">
                    Update
                </button>

            </div>
        </div>
    `;

      document.body.appendChild(modal)

}

function closePasswordEditModel(){

    document.getElementById('editPasswordModal').remove();

}
