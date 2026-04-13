document.addEventListener("DOMContentLoaded", function () {
  wireHeaderActions();
  loadAdminProfile();
  wireProfileEdit();
  wireChangePassword();
  wirePasswordToggles();
});

/* ==========================================================
   API helpers
   ========================================================== */

async function apiGet(url) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPost(url, body = null) {
  const options = {
    method: "POST",
    credentials: "include",
  };

  if (body !== null) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res.json().catch(() => ({}));
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* ==========================================================
   HEADER ACTIONS
   ========================================================== */

function wireHeaderActions() {
  const notifBtn = document.getElementById("notifBtn");
  const notifPopover = document.getElementById("notifPopover");
  const notifCloseBtn = document.getElementById("notifCloseBtn");
  const markAllSeenBtn = document.getElementById("markAllSeenBtn");

  const profileToggle = document.getElementById("profileToggle");
  const profileDropdown = document.getElementById("profileDropdown");

  if (profileToggle && profileDropdown) {
    profileToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      profileDropdown.classList.toggle("show");
      if (notifPopover) notifPopover.style.display = "none";
    });

    document.addEventListener("click", function (event) {
      if (
        profileToggle &&
        !profileToggle.contains(event.target) &&
        profileDropdown &&
        !profileDropdown.contains(event.target)
      ) {
        profileDropdown.classList.remove("show");
      }
    });
  }

  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (event) {
      event.preventDefault();
      handleLogout();
    });
  }

  if (notifBtn) {
    notifBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      if (profileDropdown) profileDropdown.classList.remove("show");

      const visible = notifPopover && notifPopover.style.display === "block";
      if (visible) {
        notifPopover.style.display = "none";
      } else {
        notifPopover.style.display = "block";
        refreshNotifications();
        refreshNotificationCount();
      }
    });
  }

  if (notifCloseBtn) {
    notifCloseBtn.addEventListener("click", () => {
      if (notifPopover) notifPopover.style.display = "none";
    });
  }

  document.addEventListener("click", (ev) => {
    if (!notifPopover) return;
    if (notifPopover.style.display !== "block") return;
    if (
      notifPopover.contains(ev.target) ||
      (notifBtn && notifBtn.contains(ev.target))
    ) {
      return;
    }
    notifPopover.style.display = "none";
  });

  if (markAllSeenBtn) {
    markAllSeenBtn.addEventListener("click", async () => {
      try {
        await apiPost("/api/notifications/readAll");
        await refreshNotificationCount();
        await refreshNotifications();
      } catch (e) {
        console.error("Mark all as read failed:", e.message);
      }
    });
  }

  refreshNotificationCount();
  refreshNotifications();

  setInterval(() => {
    refreshNotificationCount();
    refreshNotifications();
  }, 30000);
}

async function refreshNotificationCount() {
  const notifBadge = document.getElementById("notifBadge");
  try {
    const data = await apiGet("/api/notifications/count");
    const count = Number(data.count || 0);
    if (notifBadge) {
      notifBadge.style.display = count > 0 ? "flex" : "none";
      notifBadge.textContent = String(count);
    }
  } catch (e) {
    console.error("Notification count load failed:", e.message);
  }
}

async function refreshNotifications() {
  const notifList = document.getElementById("notifList");
  try {
    const data = await apiGet("/api/notifications?limit=10&offset=0");
    const items = data.notifications || [];

    if (notifList) {
      notifList.innerHTML = "";

      if (items.length === 0) {
        notifList.innerHTML = `
          <div class="notif-item">
            <div class="notif-title">No notifications</div>
            <div class="notif-msg">You're all caught up.</div>
          </div>
        `;
        return;
      }

      items.forEach((n) => {
        const createdAt = n.createdAt ? new Date(n.createdAt) : null;
        const dateText =
          createdAt && !Number.isNaN(createdAt.getTime())
            ? createdAt.toLocaleString()
            : n.createdAt || "";

        const refType = n.referenceType || "";
        const refId =
          n.referenceId !== null && n.referenceId !== undefined
            ? String(n.referenceId)
            : "";

        let rightMeta = n.type || "";
        if (refType && refId) rightMeta = `${refType} #${refId}`;
        else if (refType) rightMeta = refType;

        const div = document.createElement("div");
        div.className = `notif-item ${!n.isRead ? "unseen" : ""}`;
        div.innerHTML = `
          <div class="notif-title">${escapeHtml(n.title || "Notification")}</div>
          <div class="notif-msg">${escapeHtml(n.body || "")}</div>
          <div class="notif-meta">
            <span>${escapeHtml(dateText)}</span>
            <span>${escapeHtml(rightMeta)}</span>
          </div>
        `;

        div.addEventListener("click", async () => {
          try {
            if (!n.isRead) {
              await apiPost(
                `/api/notifications/read?id=${encodeURIComponent(n.notificationId)}`,
              );
            }
            await refreshNotificationCount();
            await refreshNotifications();
          } catch (e) {
            console.error("Notification click failed:", e.message);
          }
        });

        notifList.appendChild(div);
      });
    }
  } catch (e) {
    console.error("Notifications load failed:", e.message);
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    fetch("/admin/logout", { method: "GET", credentials: "include" })
      .then((response) => {
        if (response.redirected) {
          window.location.href = response.url;
        } else {
          window.location.href = "login.html";
        }
      })
      .catch(() => {
        window.location.href = "login.html";
      });
  }
}

/* ==========================================================
   PROFILE
   ========================================================== */

let currentProfile = {};

async function loadAdminProfile() {
  try {
    const data = await apiGet("/admin/profile");
    currentProfile = data;

    const displayName = data.username || "Admin";
    const initial = displayName.charAt(0).toUpperCase();

    const userNameEl = document.getElementById("userName");
    const profileInitialEl = document.getElementById("profileInitial");

    if (userNameEl) userNameEl.textContent = displayName;
    if (profileInitialEl) profileInitialEl.textContent = initial;

    document.getElementById("profileFullName").textContent = displayName;
    document.getElementById("avatarLarge").textContent = initial;
    document.getElementById("profileEmail").textContent =
      data.email || "Not set";
    document.getElementById("profilePhone").textContent =
      data.phoneNumber || "Not set";
    document.getElementById("profileJoined").textContent = "—";
    document.getElementById("profileLastLogin").textContent = "—";

    document.getElementById("inputUsername").value = data.username || "";
    document.getElementById("inputEmail").value = data.email || "";
    document.getElementById("inputPhone").value = data.phoneNumber || "";
  } catch (e) {
    console.error("Failed to load admin profile:", e.message);
    showToast("Failed to load profile data", "error");
  }
}

function wireProfileEdit() {
  const editBtn = document.getElementById("editProfileBtn");
  const saveBtn = document.getElementById("saveProfileBtn");
  const cancelBtn = document.getElementById("cancelProfileBtn");
  const formActions = document.getElementById("profileFormActions");

  const inputs = [
    document.getElementById("inputUsername"),
    document.getElementById("inputEmail"),
    document.getElementById("inputPhone"),
  ];

  editBtn.addEventListener("click", () => {
    inputs.forEach((inp) => (inp.disabled = false));
    formActions.style.display = "flex";
    editBtn.style.display = "none";
    inputs[0].focus();
  });

  cancelBtn.addEventListener("click", () => {
    document.getElementById("inputUsername").value =
      currentProfile.username || "";
    document.getElementById("inputEmail").value = currentProfile.email || "";
    document.getElementById("inputPhone").value =
      currentProfile.phoneNumber || "";

    inputs.forEach((inp) => (inp.disabled = true));
    formActions.style.display = "none";
    editBtn.style.display = "";
  });

  saveBtn.addEventListener("click", async () => {
    const payload = {
      adminId: currentProfile.adminId,
      username: document.getElementById("inputUsername").value.trim(),
      email: document.getElementById("inputEmail").value.trim(),
      phoneNumber: document.getElementById("inputPhone").value.trim(),
    };

    if (!payload.username) {
      showToast("Username is required", "error");
      return;
    }

    if (!payload.email) {
      showToast("Email is required", "error");
      return;
    }

    try {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      const result = await apiPost("/admin/update", payload);

      if (result.status && result.status !== "success") {
        throw new Error(result.message || "Update failed");
      }

      showToast("Profile updated successfully", "success");
      await loadAdminProfile();

      inputs.forEach((inp) => (inp.disabled = true));
      formActions.style.display = "none";
      editBtn.style.display = "";
    } catch (e) {
      console.error("Profile update failed:", e.message);
      showToast("Failed to update profile: " + e.message, "error");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Changes';
    }
  });
}

/* ==========================================================
   CHANGE PASSWORD
   ========================================================== */

function wireChangePassword() {
  const newPasswordInput = document.getElementById("inputNewPassword");
  const confirmPasswordInput = document.getElementById("inputConfirmPassword");
  const changeBtn = document.getElementById("changePasswordBtn");

  newPasswordInput.addEventListener("input", () => {
    const pw = newPasswordInput.value;
    updatePasswordStrength(pw);
    updatePasswordRequirements(pw);
  });

  changeBtn.addEventListener("click", async () => {
    const currentPassword = document.getElementById(
      "inputCurrentPassword",
    ).value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!currentPassword) {
      showToast("Please enter your current password", "error");
      return;
    }

    if (!newPassword) {
      showToast("Please enter a new password", "error");
      return;
    }

    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match", "error");
      return;
    }

    if (currentPassword === newPassword) {
      showToast("New password must be different from current", "error");
      return;
    }

    if (!currentProfile.email) {
      showToast("Admin email not loaded", "error");
      return;
    }

    try {
      changeBtn.disabled = true;
      changeBtn.innerHTML =
        '<i class="fas fa-spinner fa-spin"></i> Updating...';

      const result = await apiPost("/admin/change-password", {
        email: currentProfile.email,
        currentPassword,
        newPassword,
      });

      if (result.status && result.status !== "success") {
        throw new Error(result.message || "Password update failed");
      }

      showToast("Password changed successfully", "success");

      document.getElementById("inputCurrentPassword").value = "";
      newPasswordInput.value = "";
      confirmPasswordInput.value = "";

      const strengthEl = document.getElementById("passwordStrength");
      if (strengthEl) strengthEl.style.display = "none";
      updatePasswordRequirements("");
    } catch (e) {
      console.error("Password change failed:", e.message);
      showToast("Failed to change password: " + e.message, "error");
    } finally {
      changeBtn.disabled = false;
      changeBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
    }
  });
}

function updatePasswordStrength(pw) {
  const strengthEl = document.getElementById("passwordStrength");
  const fill = document.getElementById("strengthFill");
  const label = document.getElementById("strengthLabel");

  if (!pw) {
    strengthEl.style.display = "none";
    return;
  }

  strengthEl.style.display = "flex";

  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  const levels = ["weak", "weak", "fair", "good", "good", "strong"];
  const labels = ["Weak", "Weak", "Fair", "Good", "Good", "Strong"];

  const level = levels[score] || "weak";
  const text = labels[score] || "Weak";

  fill.className = `strength-fill ${level}`;
  label.className = `strength-label ${level}`;
  label.textContent = text;
}

function updatePasswordRequirements(pw) {
  const checks = {
    reqLength: pw.length >= 8,
    reqUpper: /[A-Z]/.test(pw),
    reqLower: /[a-z]/.test(pw),
    reqNumber: /[0-9]/.test(pw),
    reqSpecial: /[^A-Za-z0-9]/.test(pw),
  };

  for (const [id, met] of Object.entries(checks)) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("met", met);
  }
}

function wirePasswordToggles() {
  document.querySelectorAll(".password-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      if (!input) return;

      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.querySelector("i").className = isPassword
        ? "fas fa-eye-slash"
        : "fas fa-eye";
    });
  });
}

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    info: "fa-info-circle",
  };

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i> ${escapeHtml(message)}`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toastOut 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
