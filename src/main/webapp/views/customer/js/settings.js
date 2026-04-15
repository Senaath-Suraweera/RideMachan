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
// Toast notification helper
// ---------------------------
function showToast(message, type = 'info') {
    const notification = document.createElement('div');
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        info: 'fa-info-circle'
    };
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        info: '#3498db'
    };

    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,.15);
        z-index: 99999;
        max-width: 300px;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
    `;
    notification.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> &nbsp;${message}`;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
}

// ---------------------------
// Edit / Save toggle + Change Password
// ---------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadProfile();

    // ================================================
    // PROFILE EDIT TOGGLE
    // ================================================
    const toggleBtn = document.getElementById("toggleEditBtn");
    let editMode = false;

    // Only these fields are ever editable
    const editableIds = ["firstname", "lastname", "phone", "street", "city", "zipCode", "country"];

    if (toggleBtn) {
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
    }

    // ================================================
    // CHANGE PASSWORD FLOW
    // ================================================
    const currentPwInput   = document.getElementById('currentPassword');
    const newPwInput       = document.getElementById('newPassword');
    const confirmPwInput   = document.getElementById('confirmPassword');
    const verifyCurrentBtn = document.getElementById('verifyCurrentBtn');
    const updateBtn        = document.getElementById('updatePasswordBtn');
    const currentPwStatus  = document.getElementById('currentPwStatus');

    const otpModal      = document.getElementById('otpModal');
    const otpInput      = document.getElementById('otpInput');
    const otpError      = document.getElementById('otpError');
    const confirmOtpBtn = document.getElementById('confirmOtpBtn');
    const cancelOtpBtn  = document.getElementById('cancelOtpBtn');
    const resendOtpLink = document.getElementById('resendOtpLink');

    // Guard: only run if the change-password section exists
    if (!currentPwInput || !verifyCurrentBtn || !updateBtn) return;

    let currentVerified = false;

    // If user re-edits current password, lock everything again
    currentPwInput.addEventListener('input', () => {
        currentVerified = false;
        newPwInput.disabled = true;
        confirmPwInput.disabled = true;
        updateBtn.disabled = true;
        newPwInput.value = '';
        confirmPwInput.value = '';
        currentPwStatus.textContent = '';
    });

    // ---------- Step 1: verify current password ----------
    verifyCurrentBtn.addEventListener('click', async () => {
        const currentPassword = currentPwInput.value.trim();
        if (!currentPassword) {
            showToast('Enter your current password', 'error');
            return;
        }
        try {
            const res = await fetch('/customer/changePassword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verifyCurrent', currentPassword })
            });
            const data = await res.json();
            if (data.status === 'success') {
                currentVerified = true;
                newPwInput.disabled = false;
                confirmPwInput.disabled = false;
                updateBtn.disabled = false;
                currentPwStatus.innerHTML =
                    '<span style="color:#27ae60;"><i class="fas fa-check-circle"></i> Verified</span>';
                showToast('Current password verified', 'success');
            } else {
                currentPwStatus.innerHTML =
                    '<span style="color:#e74c3c;"><i class="fas fa-times-circle"></i> Incorrect</span>';
                showToast(data.message || 'Incorrect password', 'error');
            }
        } catch (e) {
            showToast('Network error', 'error');
        }
    });

    // ---------- Step 2: click Update → validate → send OTP → open modal ----------
    updateBtn.addEventListener('click', async () => {
        if (!currentVerified) {
            showToast('Verify your current password first', 'error');
            return;
        }
        const newPassword     = newPwInput.value;
        const confirmPassword = confirmPwInput.value;

        if (!newPassword || !confirmPassword) {
            showToast('Fill in all password fields', 'error');
            return;
        }
        if (newPassword.length < 8) {
            showToast('New password must be at least 8 characters', 'error');
            return;
        }
        if (newPassword !== confirmPassword) {
            showToast('New passwords do not match', 'error');
            return;
        }
        if (newPassword === currentPwInput.value) {
            showToast('New password must differ from current', 'error');
            return;
        }

        // Send OTP via existing /verify servlet
        try {
            const res = await fetch('/verify', { method: 'POST' });
            const data = await res.json();
            if (data.status === 'success') {
                otpInput.value = '';
                otpError.textContent = '';
                otpModal.style.display = 'flex';
                showToast('OTP sent to your email', 'success');
            } else {
                showToast(data.message || 'Failed to send OTP', 'error');
            }
        } catch (e) {
            showToast('Network error sending OTP', 'error');
        }
    });

    // ---------- Cancel OTP ----------
    cancelOtpBtn.addEventListener('click', () => {
        otpModal.style.display = 'none';
    });

    // ---------- Resend OTP ----------
    resendOtpLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/verify', { method: 'POST' });
            const data = await res.json();
            if (data.status === 'success') {
                showToast('New OTP sent', 'success');
            } else {
                showToast(data.message || 'Failed to resend', 'error');
            }
        } catch {
            showToast('Network error', 'error');
        }
    });

    // ---------- Step 3: confirm OTP → final update ----------
    confirmOtpBtn.addEventListener('click', async () => {
        const code = otpInput.value.trim();
        if (code.length !== 6) {
            otpError.textContent = 'Enter the 6-digit code';
            return;
        }
        try {
            const res = await fetch('/customer/changePassword', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updatePassword',
                    currentPassword: currentPwInput.value,
                    newPassword: newPwInput.value,
                    code: code
                })
            });
            const data = await res.json();
            if (data.status === 'success') {
                otpModal.style.display = 'none';
                showToast('Password updated successfully!', 'success');
                // Reset form
                currentPwInput.value = '';
                newPwInput.value = '';
                confirmPwInput.value = '';
                newPwInput.disabled = true;
                confirmPwInput.disabled = true;
                updateBtn.disabled = true;
                currentPwStatus.textContent = '';
                currentVerified = false;
            } else {
                otpError.textContent = data.message || 'Verification failed';
            }
        } catch (e) {
            otpError.textContent = 'Network error';
        }
    });
});