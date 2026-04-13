// ---------------------------
// Load customer profile
// ---------------------------
async function loadProfile() {
    try {
        const response = await fetch("/customer/profile/info");
        if (!response.ok) throw new Error("Failed to load profile");

        const data = await response.json();

        // Common fields
        document.getElementById("username").value     = data.username || "";
        document.getElementById("customerType").value = data.customerType || "";
        document.getElementById("firstname").value    = data.firstname || "";
        document.getElementById("lastname").value     = data.lastname || "";
        document.getElementById("email").value        = data.email || "";
        document.getElementById("phone").value        = data.mobileNumber || "";
        document.getElementById("street").value       = data.street || "";
        document.getElementById("city").value         = data.city || "";
        document.getElementById("zipCode").value      = data.zipCode || "";
        document.getElementById("country").value      = data.country || "";

        document.getElementById("profileName").textContent =
            `${data.firstname || ""} ${data.lastname || ""}`.trim();
        document.getElementById("profileType").textContent =
            `${data.customerType || ""} Customer`;

        // Show type-specific section
        if (data.customerType === "LOCAL") {
            document.getElementById("localSection").style.display = "block";
            document.getElementById("foreignSection").style.display = "none";

            document.getElementById("nicNumber").value = data.nicNumber || "";
            document.getElementById("driversLicenseNumber").value = data.driversLicenseNumber || "";

            if (data.hasNicImage) {
                document.getElementById("nicImage").src = "/customer/profile/image?type=nic&t=" + Date.now();
            }
            if (data.hasLicenseImage) {
                document.getElementById("licenseImageLocal").src = "/customer/profile/image?type=license&t=" + Date.now();
            }

        } else if (data.customerType === "FOREIGN") {
            document.getElementById("foreignSection").style.display = "block";
            document.getElementById("localSection").style.display = "none";

            document.getElementById("passportNumber").value = data.passportNumber || "";
            document.getElementById("intlLicenseNumber").value = data.internationalDriversLicenseNumber || "";

            if (data.hasPassportImage) {
                document.getElementById("passportImage").src = "/customer/profile/image?type=passport&t=" + Date.now();
            }
            if (data.hasLicenseImage) {
                document.getElementById("licenseImageForeign").src = "/customer/profile/image?type=license&t=" + Date.now();
            }
        }
    } catch (err) {
        console.error("Profile load error:", err);
    }
}

// ---------------------------
// Client-side validation
// ---------------------------
function validateProfile(body) {
    const errors = [];
    if (!/^[A-Za-z ]{2,50}$/.test(body.firstname))    errors.push("First name: letters only, 2–50 chars");
    if (!/^[A-Za-z ]{2,50}$/.test(body.lastname))     errors.push("Last name: letters only, 2–50 chars");
    if (!/^\+?[0-9]{10,15}$/.test(body.phone))        errors.push("Phone: 10–15 digits");
    if (!body.street || body.street.length > 100)    errors.push("Street is required");
    if (!/^[A-Za-z ]{2,50}$/.test(body.city))         errors.push("City: letters only");
    if (!/^[0-9]{4,10}$/.test(body.zipCode))          errors.push("ZIP: 4–10 digits");
    if (!/^[A-Za-z ]{2,50}$/.test(body.country))      errors.push("Country: letters only");
    return errors;
}

// ---------------------------
// Edit / Save toggle
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadProfile();

    const toggleBtn = document.getElementById("toggleEditBtn");
    let editMode = false;

    // Only these fields are ever editable
    const editableIds = ["firstname", "lastname", "phone", "street", "city", "zipCode", "country"];

    toggleBtn.addEventListener("click", async () => {

        if (!editMode) {
            // ENABLE editing
            editableIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    el.removeAttribute("readonly");
                    el.classList.add("editable");
                }
            });
            toggleBtn.innerHTML = `<i class="fas fa-save"></i> Save Profile`;
            editMode = true;
            return;
        }

        // SAVE
        const body = {
            firstname: document.getElementById("firstname").value.trim(),
            lastname:  document.getElementById("lastname").value.trim(),
            phone:     document.getElementById("phone").value.trim(),
            street:    document.getElementById("street").value.trim(),
            city:      document.getElementById("city").value.trim(),
            zipCode:   document.getElementById("zipCode").value.trim(),
            country:   document.getElementById("country").value.trim()
        };

        const errors = validateProfile(body);
        if (errors.length > 0) {
            alert("Please fix:\n• " + errors.join("\n• "));
            return;
        }

        try {
            const response = await fetch("/customer/profile/info", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (result.status === "success") {
                alert("Profile updated successfully!");
                loadProfile();
            } else {
                alert("Update failed: " + (result.message || "unknown error"));
                return;
            }
        } catch (err) {
            alert("Network error while saving profile");
            return;
        }

        // DISABLE editing
        editableIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.setAttribute("readonly", "");
                el.classList.remove("editable");
            }
        });
        toggleBtn.innerHTML = `<i class="fas fa-edit"></i> Update Profile`;
        editMode = false;
    });
});