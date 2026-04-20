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

let profileData;

async function LoadProfile() {

    try {

        let response = await fetch(`/loadcompanyprofile`);

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

        let fullAddress = document.getElementById("businessAddress").value;
        let street = fullAddress;
        let city = "";

        const parts = fullAddress.split(",");

        if (parts.length >= 2) {
            street = parts[0].trim();
            city = parts.slice(1).join(",").trim();
        }

        const params = new URLSearchParams({
            companyName: document.getElementById("companyName").value,
            phone: document.getElementById("phoneNumber").value,
            email: document.getElementById("emailAddress").value,
            street: street,
            city: city
        });

        let response = await fetch(`/updatecompanyprofile?${params.toString()}`, {
            method: "POST"
        });


        if(!response.ok){
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();

        console.log(result);

        if (result.success) {

            showNotification("Profile updated successfully!", "success");

        } else {

            showNotification("Update failed!", "error");

        }


    }catch(err) {

        console.log(err);

    }

}

function showNotification(message, type = "info") {

    const notification = document.createElement("div");

    notification.textContent = message;


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


    setTimeout(() => {

        notification.style.opacity = "0";
        setTimeout(() => notification.remove(), 300);

    }, 3000);

}

function populateProfile(data) {

    if (!data) {
        return;
    }

    document.getElementById("companyName").value = data.companyName || "";
    document.getElementById("phoneNumber").value = "+ " + (data.phone || "");
    document.getElementById("emailAddress").value = data.email || "";
    document.getElementById("businessAddress").value = (data.street || "") + ", " + (data.city || "");

    const companyname = document.getElementById("company");

    if (companyname) {

        companyname.textContent = data.companyName || "";

    }

}


document.addEventListener("DOMContentLoaded", async function() {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;    // stop here if not logged in
        }

        profileData = await LoadProfile();

        populateProfile(profileData);




    } catch (err) {

        console.error("Error during initialization:", err);

    }

});


document.getElementById("profileForm").addEventListener("submit", async(e) => {

    e.preventDefault();

    await UpdateProfile();

});