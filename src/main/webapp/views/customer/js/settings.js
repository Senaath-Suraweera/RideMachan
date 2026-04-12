// ---------------------------
// Load customer profile
// ---------------------------
async function loadProfile() {
    try {
        const response = await fetch("/customer/profile");
        if (!response.ok) throw new Error("Failed to load profile");

        const data = await response.json();

        // Fill profile fields
        document.getElementById("firstname").value = data.firstname || "";
        document.getElementById("lastname").value = data.lastname || "";
        document.getElementById("email").value = data.email || "";
        document.getElementById("phone").value = data.mobileNumber || "";
        document.getElementById("street").value = data.street || "";
        document.getElementById("city").value = data.city || "";

        document.getElementById("profileName").textContent =
            `${data.firstname} ${data.lastname}`;
    } catch (err) {
        console.error("Profile load error:", err);
    }
}

// ---------------------------
// Enable editing + Save Profile
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadProfile();

    const toggleBtn = document.getElementById("toggleEditBtn");
    let editMode = false;

    toggleBtn.addEventListener("click", async () => {
        const fields = document.querySelectorAll(".form-grid input");

        if (!editMode) {
            // ENABLE editing
            fields.forEach(f => {
                if (f.id !== "email") f.removeAttribute("readonly");
            });
            toggleBtn.innerHTML = `<i class="fas fa-save"></i> Save Profile`;
            editMode = true;
        } else {
            // SAVE profile
            const body = {
                firstname: document.getElementById("firstname").value,
                lastname: document.getElementById("lastname").value,
                phone: document.getElementById("phone").value,
                street: document.getElementById("street").value,
                city: document.getElementById("city").value,
                zipCode: "",
                country: ""
            };

            const response = await fetch("/customer/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (result.status === "success") {
                alert("Profile updated successfully!");
                loadProfile();
            } else {
                alert("Update failed");
            }

            // DISABLE editing again
            fields.forEach(f => f.setAttribute("readonly", ""));
            toggleBtn.innerHTML = `<i class="fas fa-edit"></i> Update Profile`;
            editMode = false;
        }
    });
});
