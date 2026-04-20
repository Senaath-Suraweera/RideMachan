


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

    return true;
  } catch (err) {
    console.error("Error checking login:", err);
    return false;
  }
}


let profileData;

async function LoadProfile() {
  try {
    const response = await fetch(`/load/maintenance/profile`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

function populateProfile(data) {
  if (!data) return;


  const greetingEl = document.getElementById("staffGreeting");
  if (greetingEl) {
    const username = (data.username || "").trim();
    const fullName = (
      (data.firstname || "") +
      " " +
      (data.lastname || "")
    ).trim();
    greetingEl.innerText = "Hi, " + (username || fullName || "there");
  }

  document.getElementById("staffName").innerText =
    (data.firstname || "") + " " + (data.lastname || "");
  document.getElementById("staffPhone").innerText = data.contactNumber || "";
  document.getElementById("staffEmail").innerText = data.email || "";

  document.getElementById("companyName").innerText = data.companyName || "";
  document.getElementById("garage").innerText = data.companyCity || "";

  document.getElementById("employeeId").innerText = data.staffId || "";


  const usernameEl = document.getElementById("staffUsername");
  const specEl = document.getElementById("staffSpecialization");
  const yearsEl = document.getElementById("staffYearsOfExperience");
  const statusEl = document.getElementById("staffStatus");

  if (usernameEl) usernameEl.innerText = data.username || "";
  if (specEl) specEl.innerText = data.specialization || "Not set";
  if (yearsEl)
    yearsEl.innerText =
      (data.yearsOfExperience != null ? data.yearsOfExperience : 0) + " yrs";
  if (statusEl) {
    statusEl.innerText = data.status || "";
    statusEl.className =
      "info-value status-badge " +
      (data.status === "available" ? "ok" : "busy");
  }


  const avatar = document.querySelector(".profile-avatar");
  if (avatar) {
    const initials =
      ((data.firstname || "?")[0] || "") + ((data.lastname || "")[0] || "");
    avatar.innerText = initials.toUpperCase();
  }
}


async function UpdateProfile() {
  const username = document.getElementById("usernameInput").value;
  const firstname = document.getElementById("firstNameInput").value;
  const lastname = document.getElementById("lastNameInput").value;
  const phone = document.getElementById("phoneInput").value;
  const email = document.getElementById("emailInput").value;
  const specialization = document.getElementById("specializationInput").value;
  const status = document.getElementById("statusInput").value;
  const years = document.getElementById("yearsInput").value;

  if (!validate(username, rules.username, "Username")) return false;
  if (!validate(firstname, rules.name, "First Name")) return false;
  if (!validate(lastname, rules.name, "Last Name")) return false;
  if (!validate(phone, rules.phone, "Phone Number")) return false;
  if (!validate(email, rules.email, "Email")) return false;
  if (!validate(years, rules.years, "Years of Experience")) return false;

  try {
    const params = new URLSearchParams({
      username,
      firstname,
      lastname,
      phone,
      email,
      specialization: specialization || "",
      status: status || "available",
      yearsOfExperience: years || "0",
    });

    const response = await fetch(`/update/maintenance/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    if (!response.ok && response.status !== 200) {
      showNotification("Update failed", "error");
      return false;
    }

    const result = await response.json();

    if (result.success) {
      showNotification(
        result.message || "Profile updated successfully!",
        "success",
      );
      return true;
    } else {
      showNotification(result.message || "Update failed", "error");
      return false;
    }
  } catch (err) {
    console.error(err);
    showNotification("Network error", "error");
    return false;
  }
}


async function changePassword() {
  const currentPass = document.getElementById("currentPasswordInput").value;
  const newPass = document.getElementById("newPasswordInput").value;
  const confirm = document.getElementById("confirmPasswordInput").value;

  if (!currentPass || !newPass || !confirm) {
    showNotification("All fields are required", "error");
    return false;
  }

  if (newPass.length < 6) {
    showNotification("New password must be at least 6 characters", "error");
    return false;
  }

  if (newPass !== confirm) {
    showNotification("Passwords do not match", "error");
    return false;
  }

  if (newPass === currentPass) {
    showNotification(
      "New password must be different from current password",
      "error",
    );
    return false;
  }

  try {
    const params = new URLSearchParams({
      currentPassword: currentPass,
      newPassword: newPass,
    });

    const response = await fetch(`/change/maintenance/password`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });

    const result = await response.json();

    if (result.success) {
      showNotification(
        result.message || "Password updated successfully",
        "success",
      );
      return true;
    } else {
      showNotification(result.message || "Update failed", "error");
      return false;
    }
  } catch (err) {
    console.error(err);
    showNotification("Network error", "error");
    return false;
  }
}


function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.textContent = message;

  Object.assign(notification.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "12px 18px",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "14px",
    zIndex: "10000",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    transition: "opacity 0.3s ease",
  });

  if (type === "success") notification.style.background = "#28a745";
  else if (type === "error") notification.style.background = "#dc3545";
  else if (type === "info") notification.style.background = "#17a2b8";
  else notification.style.background = "#333";

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}


function openStaffProfileEditModel(data) {
  const existing = document.getElementById("editModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "editModal";
  modal.className = "sp-modal-overlay";

  modal.innerHTML = `
      <div class="sp-modal-card">
        <div class="sp-modal-header">
          <h3>Edit Profile</h3>
          <button type="button" class="sp-modal-close" id="closeEditProfileBtn" aria-label="Close">&times;</button>
        </div>

        <div class="sp-modal-body">
          <div class="sp-form-grid">
            <div class="sp-form-group">
              <label>Username</label>
              <input id="usernameInput" type="text" value="${escapeAttr(data.username)}" />
            </div>

            <div class="sp-form-group">
              <label>Status</label>
              <select id="statusInput">
                <option value="available" ${data.status === "available" ? "selected" : ""}>Available</option>
                <option value="on Job"    ${data.status === "on Job" ? "selected" : ""}>On Job</option>
                <option value="offline"   ${data.status === "offline" ? "selected" : ""}>Offline</option>
              </select>
            </div>

            <div class="sp-form-group">
              <label>First Name</label>
              <input id="firstNameInput" type="text" value="${escapeAttr(data.firstname)}" />
            </div>

            <div class="sp-form-group">
              <label>Last Name</label>
              <input id="lastNameInput" type="text" value="${escapeAttr(data.lastname)}" />
            </div>

            <div class="sp-form-group">
              <label>Phone Number</label>
              <input id="phoneInput" type="text" placeholder="+947XXXXXXXX or 07XXXXXXXX"
                     value="${escapeAttr(data.contactNumber)}" />
            </div>

            <div class="sp-form-group">
              <label>Email</label>
              <input id="emailInput" type="email" value="${escapeAttr(data.email)}" />
            </div>

            <div class="sp-form-group">
              <label>Specialization</label>
              <input id="specializationInput" type="text"
                     placeholder="e.g. Engine, Electrical, Brakes"
                     value="${escapeAttr(data.specialization)}" />
            </div>

            <div class="sp-form-group">
              <label>Years of Experience</label>
              <input id="yearsInput" type="number" min="0" max="60" step="0.5"
                     value="${data.yearsOfExperience != null ? data.yearsOfExperience : 0}" />
            </div>
          </div>
        </div>

        <div class="sp-modal-footer">
          <button type="button" class="sp-btn sp-btn-secondary" id="cancelEditProfileBtn">Cancel</button>
          <button type="button" class="sp-btn sp-btn-primary" id="update-Profile-POPUP-btn">Save Changes</button>
        </div>
      </div>
    `;

  document.body.appendChild(modal);


  document
    .getElementById("closeEditProfileBtn")
    .addEventListener("click", closeStaffProfileEditModel);
  document
    .getElementById("cancelEditProfileBtn")
    .addEventListener("click", closeStaffProfileEditModel);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeStaffProfileEditModel();
  });


  document
    .getElementById("update-Profile-POPUP-btn")
    .addEventListener("click", async () => {
      const ok = await UpdateProfile();
      if (ok) {
        closeStaffProfileEditModel();
        profileData = await LoadProfile();
        populateProfile(profileData);
      }
    });
}

function closeStaffProfileEditModel() {
  const m = document.getElementById("editModal");
  if (m) m.remove();
}


function openPasswordEditModel() {
  const existing = document.getElementById("editPasswordModal");
  if (existing) existing.remove();

  const modal = document.createElement("div");
  modal.id = "editPasswordModal";
  modal.className = "sp-modal-overlay";

  modal.innerHTML = `
      <div class="sp-modal-card sp-modal-card-sm">
        <div class="sp-modal-header">
          <h3>Change Password</h3>
          <button type="button" class="sp-modal-close" id="closePasswordBtn" aria-label="Close">&times;</button>
        </div>

        <div class="sp-modal-body">
          <div class="sp-form-group">
            <label>Current Password</label>
            <input id="currentPasswordInput" type="password" placeholder="Enter current password" autocomplete="current-password" />
          </div>

          <div class="sp-form-group">
            <label>New Password</label>
            <input id="newPasswordInput" type="password" placeholder="At least 6 characters" autocomplete="new-password" />
          </div>

          <div class="sp-form-group">
            <label>Confirm New Password</label>
            <input id="confirmPasswordInput" type="password" placeholder="Re-enter new password" autocomplete="new-password" />
          </div>
        </div>

        <div class="sp-modal-footer">
          <button type="button" class="sp-btn sp-btn-secondary" id="cancelPasswordBtn">Cancel</button>
          <button type="button" class="sp-btn sp-btn-primary" id="update-Password-POPUP-btn">Update Password</button>
        </div>
      </div>
    `;

  document.body.appendChild(modal);

  document
    .getElementById("closePasswordBtn")
    .addEventListener("click", closePasswordEditModel);
  document
    .getElementById("cancelPasswordBtn")
    .addEventListener("click", closePasswordEditModel);

  modal.addEventListener("click", (e) => {
    if (e.target === modal) closePasswordEditModel();
  });

  document
    .getElementById("update-Password-POPUP-btn")
    .addEventListener("click", async () => {
      const ok = await changePassword();
      if (ok) closePasswordEditModel();
    });
}

function closePasswordEditModel() {
  const m = document.getElementById("editPasswordModal");
  if (m) m.remove();
}


document.addEventListener("DOMContentLoaded", async function () {
  try {
    const loggedIn = await checkLogin();
    if (!loggedIn) return;

    profileData = await LoadProfile();
    populateProfile(profileData);


    const editProfileBtn = document.getElementById("update-Profile-UI-btn");
    const editPasswordBtn = document.getElementById("update-Password-UI-btn");

    if (editProfileBtn) {
      editProfileBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openStaffProfileEditModel(profileData);
      });
    }

    if (editPasswordBtn) {
      editPasswordBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openPasswordEditModel();
      });
    }
  } catch (err) {
    console.error("Error during initialization:", err);
  }
});


function validate(value, rules, fieldName = "Field") {
  value = (value ?? "").toString().trim();

  if (rules.required && value === "") {
    showNotification(`${fieldName} is required`, "error");
    return false;
  }
  if (rules.minLength && value.length < rules.minLength) {
    showNotification(
      `${fieldName} must be at least ${rules.minLength} characters`,
      "error",
    );
    return false;
  }
  if (rules.maxLength && value.length > rules.maxLength) {
    showNotification(
      `${fieldName} must be less than ${rules.maxLength} characters`,
      "error",
    );
    return false;
  }
  if (rules.pattern && !rules.pattern.test(value)) {
    showNotification(rules.message || `Invalid ${fieldName}`, "error");
    return false;
  }
  return true;
}

const rules = {
  username: {
    required: true,
    minLength: 3,
    maxLength: 50,
    pattern: /^[A-Za-z0-9_.\-]+$/,
    message: "Username may only contain letters, numbers, _ . -",
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[A-Za-z\s]+$/,
    message: "Name must contain only letters",
  },
  phone: {
    required: true,
    pattern: /^(?:\+94|0)(7\d{8})$/,
    message: "Invalid Sri Lankan phone number",
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: "Invalid email format",
  },
  years: {
    required: false,
    pattern: /^(?:\d{1,2}(?:\.\d+)?)?$/,
    message: "Years of experience must be a non-negative number",
  },
  nic: {
    required: true,
    minLength: 10,
    maxLength: 12,
  },
};

// ---------- Helpers -----------------------------------------------------------
function escapeAttr(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
