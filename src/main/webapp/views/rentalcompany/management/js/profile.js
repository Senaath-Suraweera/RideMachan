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

        const updatedData = {

            companyName: document.getElementById("companyName").value,
            phone: document.getElementById("phoneNumber").value,
            email: document.getElementById("emailAddress").value,
            address: document.getElementById("businessAddress").value

        };

        let response = await fetch(`/updatecompanyprofile`, {

          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(updatedData)

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

    document.getElementById("companyName").value = data.companyName || "";
    document.getElementById("phoneNumber").value = "+ " + (data.phone || "");
    document.getElementById("emailAddress").value = data.email || "";
    document.getElementById("businessAddress").value = (data.street || "") + ", " + (data.city || "");

    const companyname = document.getElementById("company");

    if (companyname) {

        companyname.textContent = data.companyName || "";

    }

}

function handleProfilePictureUpload() {

    const uploadBtn = document.querySelector(".update-picture-btn");
    const avatar = document.querySelector(".profile-avatar");

    if (!uploadBtn || !avatar) {

        console.warn("Profile picture elements not found");
        return;

    }


    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.style.display = "none";

    document.body.appendChild(fileInput);


    uploadBtn.addEventListener("click", () => {

        fileInput.click();

    });


    fileInput.addEventListener("change", () => {

        const file = fileInput.files[0];
        if (!file) return;


        const reader = new FileReader();

        reader.onload = function (e) {

            avatar.innerHTML = `
                <img src="${e.target.result}" 
                     style="width:100%; height:100%; object-fit:cover; border-radius:50%;" />
            `;
        };

        reader.readAsDataURL(file);

        console.log("Selected profile picture:", file);

    });

}



document.addEventListener("DOMContentLoaded", async function() {

    try {

        const loggedIn = await checkLogin();

        if (!loggedIn) {
            return;    // stop here if not logged in
        }

        profileData = await LoadProfile();

        populateProfile(profileData);

        handleProfilePictureUpload();


    } catch (err) {

        console.error("Error during initialization:", err);

    }

});


document.getElementById("profileForm").addEventListener("submit", async(e) => {

    e.preventDefault();

    await UpdateProfile();

});