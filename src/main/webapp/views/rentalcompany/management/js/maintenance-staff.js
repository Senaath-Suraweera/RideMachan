let companyId = null;

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
        companyId: companyId
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

        console.log("login status:",loggedIn);


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