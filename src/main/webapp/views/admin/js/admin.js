// Admins Manager - with validation and email uniqueness check
class AdminsManager {
  constructor() {
    this.admins = [];
    this.filteredAdmins = [];
    this.tempSignupData = null;
    this.emailCheckTimeout = null;
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadAdmins();
  }

  setupEventListeners() {
    const regForm = document.getElementById("registerAdminForm");
    if (regForm) {
      regForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.registerAdmin();
      });

      // Live validation on input fields
      const fields = regForm.querySelectorAll(".form-control");
      fields.forEach((field) => {
        field.addEventListener("input", () => this.validateFieldLive(field));
        field.addEventListener("blur", () => this.validateFieldLive(field));
      });

      // Async email check with debounce
      const emailField = regForm.querySelector('[name="email"]');
      if (emailField) {
        emailField.addEventListener("input", () => {
          clearTimeout(this.emailCheckTimeout);
          this.emailCheckTimeout = setTimeout(() => {
            this.checkEmailAvailability(emailField);
          }, 500);
        });
      }
    }
  }

  // ---------- Live Field Validation ----------
  validateFieldLive(field) {
    const name = field.name;
    const value = field.value.trim();
    const group = field.closest(".form-group");
    if (!group) return;

    // Clear previous state
    this.clearFieldState(group, field);

    // Don't validate empty on live (only on submit)
    if (value.length === 0) return;

    switch (name) {
      case "fullName":
        this.validateName(value, group, field);
        break;
      case "email":
        this.validateEmail(value, group, field);
        break;
      case "phone":
        this.validatePhone(value, group, field);
        break;
      case "password":
        this.validatePassword(value, group, field);
        // Also revalidate confirm password if it has a value
        const confirmField = document.querySelector(
          '#registerAdminForm [name="confirmPassword"]',
        );
        if (confirmField && confirmField.value.trim().length > 0) {
          this.validateFieldLive(confirmField);
        }
        break;
      case "confirmPassword":
        this.validateConfirmPassword(value, group, field);
        break;
    }
  }

  validateName(value, group, field) {
    if (value.length < 2) {
      this.setFieldError(group, field, "Name must be at least 2 characters");
      return false;
    }
    if (value.length > 100) {
      this.setFieldError(group, field, "Name must be under 100 characters");
      return false;
    }
    if (!/^[a-zA-Z\s.\-']+$/.test(value)) {
      this.setFieldError(
        group,
        field,
        "Name can only contain letters, spaces, dots, hyphens, and apostrophes",
      );
      return false;
    }
    this.setFieldSuccess(group, field);
    return true;
  }

  validateEmail(value, group, field) {
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      this.setFieldError(group, field, "Please enter a valid email address");
      return false;
    }
    // Don't set success yet — email availability check will handle it
    return true;
  }

  validatePhone(value, group, field) {
    // Remove spaces and dashes for validation
    const cleaned = value.replace(/[\s\-()]/g, "");
    if (!/^\+?\d{7,15}$/.test(cleaned)) {
      this.setFieldError(
        group,
        field,
        "Enter a valid phone number (7-15 digits, optional + prefix)",
      );
      return false;
    }
    this.setFieldSuccess(group, field);
    return true;
  }

  validatePassword(value, group, field) {
    const checks = {
      length: value.length >= 8,
      uppercase: /[A-Z]/.test(value),
      lowercase: /[a-z]/.test(value),
      digit: /\d/.test(value),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value),
    };

    // Update strength meter if present
    this.updatePasswordStrength(group, checks);

    const passed = Object.values(checks).filter(Boolean).length;

    if (!checks.length) {
      this.setFieldError(
        group,
        field,
        "Password must be at least 8 characters",
      );
      return false;
    }
    if (passed < 4) {
      this.setFieldError(
        group,
        field,
        "Include uppercase, lowercase, digit, and special character",
      );
      return false;
    }
    this.setFieldSuccess(group, field);
    return true;
  }

  validateConfirmPassword(value, group, field) {
    const password = document
      .querySelector('#registerAdminForm [name="password"]')
      ?.value.trim();
    if (value !== password) {
      this.setFieldError(group, field, "Passwords do not match");
      return false;
    }
    this.setFieldSuccess(group, field);
    return true;
  }

  // ---------- Async Email Check ----------
  async checkEmailAvailability(field) {
    const value = field.value.trim();
    const group = field.closest(".form-group");
    if (!group) return;

    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) return; // Skip if invalid format

    // Show checking state
    this.setFieldChecking(group, field, "Checking availability...");

    try {
      const res = await fetch("/admin/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      });
      const result = await res.json();

      // Only update if the field value hasn't changed during the request
      if (field.value.trim() === value) {
        if (result.exists) {
          this.setFieldError(
            group,
            field,
            "An admin with this email already exists",
          );
        } else {
          this.setFieldSuccess(group, field, "Email is available");
        }
      }
    } catch (err) {
      console.error("Email check failed:", err);
      // Don't show error for network issues — will be caught on submit
      this.clearFieldState(group, field);
    }
  }

  // ---------- Field State Management ----------
  setFieldError(group, field, message) {
    group.classList.remove("field-success", "field-checking");
    group.classList.add("field-error");
    field.classList.remove("input-success", "input-checking");
    field.classList.add("input-error");

    let hint = group.querySelector(".field-hint");
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "field-hint";
      group.appendChild(hint);
    }
    hint.className = "field-hint error-hint";
    hint.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg> ${this.escape(message)}`;
  }

  setFieldSuccess(group, field, message) {
    group.classList.remove("field-error", "field-checking");
    group.classList.add("field-success");
    field.classList.remove("input-error", "input-checking");
    field.classList.add("input-success");

    let hint = group.querySelector(".field-hint");
    if (message) {
      if (!hint) {
        hint = document.createElement("div");
        hint.className = "field-hint";
        group.appendChild(hint);
      }
      hint.className = "field-hint success-hint";
      hint.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ${this.escape(message)}`;
    } else if (hint) {
      hint.remove();
    }
  }

  setFieldChecking(group, field, message) {
    group.classList.remove("field-error", "field-success");
    group.classList.add("field-checking");
    field.classList.remove("input-error", "input-success");
    field.classList.add("input-checking");

    let hint = group.querySelector(".field-hint");
    if (!hint) {
      hint = document.createElement("div");
      hint.className = "field-hint";
      group.appendChild(hint);
    }
    hint.className = "field-hint checking-hint";
    hint.innerHTML = `<span class="spinner-dot"></span> ${this.escape(message)}`;
  }

  clearFieldState(group, field) {
    group.classList.remove("field-error", "field-success", "field-checking");
    field.classList.remove("input-error", "input-success", "input-checking");
    const hint = group.querySelector(".field-hint");
    if (hint) hint.remove();
  }

  updatePasswordStrength(group, checks) {
    let meter = group.querySelector(".password-strength");
    if (!meter) {
      meter = document.createElement("div");
      meter.className = "password-strength";
      meter.innerHTML = `<div class="strength-bar"><div class="strength-fill"></div></div><span class="strength-label"></span>`;
      // Insert after the input
      const input = group.querySelector("input");
      if (input) input.after(meter);
    }

    const passed = Object.values(checks).filter(Boolean).length;
    const fill = meter.querySelector(".strength-fill");
    const label = meter.querySelector(".strength-label");
    const pct = (passed / 5) * 100;

    fill.style.width = pct + "%";

    if (passed <= 1) {
      fill.className = "strength-fill strength-weak";
      label.textContent = "Weak";
    } else if (passed <= 3) {
      fill.className = "strength-fill strength-fair";
      label.textContent = "Fair";
    } else if (passed === 4) {
      fill.className = "strength-fill strength-good";
      label.textContent = "Good";
    } else {
      fill.className = "strength-fill strength-strong";
      label.textContent = "Strong";
    }
  }

  // ---------- Full Form Validation (on submit) ----------
  validateForm() {
    const form = document.getElementById("registerAdminForm");
    const data = Object.fromEntries(new FormData(form).entries());
    let isValid = true;

    this.clearAllErrors("#registerAdminForm");

    // Full Name
    const nameField = form.querySelector('[name="fullName"]');
    const nameGroup = nameField?.closest(".form-group");
    if (!data.fullName || data.fullName.trim().length === 0) {
      this.setFieldError(nameGroup, nameField, "Full name is required");
      isValid = false;
    } else if (!this.validateName(data.fullName.trim(), nameGroup, nameField)) {
      isValid = false;
    }

    // Email
    const emailField = form.querySelector('[name="email"]');
    const emailGroup = emailField?.closest(".form-group");
    if (!data.email || data.email.trim().length === 0) {
      this.setFieldError(emailGroup, emailField, "Email is required");
      isValid = false;
    } else if (!this.validateEmail(data.email.trim(), emailGroup, emailField)) {
      isValid = false;
    } else if (emailGroup.classList.contains("field-error")) {
      // Email exists error is already set from async check
      isValid = false;
    }

    // Phone
    const phoneField = form.querySelector('[name="phone"]');
    const phoneGroup = phoneField?.closest(".form-group");
    if (!data.phone || data.phone.trim().length === 0) {
      this.setFieldError(phoneGroup, phoneField, "Phone number is required");
      isValid = false;
    } else if (!this.validatePhone(data.phone.trim(), phoneGroup, phoneField)) {
      isValid = false;
    }

    // Password
    const pwField = form.querySelector('[name="password"]');
    const pwGroup = pwField?.closest(".form-group");
    if (!data.password || data.password.trim().length === 0) {
      this.setFieldError(pwGroup, pwField, "Password is required");
      isValid = false;
    } else if (!this.validatePassword(data.password.trim(), pwGroup, pwField)) {
      isValid = false;
    }

    // Confirm Password
    const cpField = form.querySelector('[name="confirmPassword"]');
    const cpGroup = cpField?.closest(".form-group");
    if (!data.confirmPassword || data.confirmPassword.trim().length === 0) {
      this.setFieldError(cpGroup, cpField, "Please confirm your password");
      isValid = false;
    } else if (data.password !== data.confirmPassword) {
      this.setFieldError(cpGroup, cpField, "Passwords do not match");
      isValid = false;
    }

    return isValid;
  }

  clearAllErrors(formSelector) {
    document
      .querySelectorAll(`${formSelector} .field-hint`)
      .forEach((e) => e.remove());
    document
      .querySelectorAll(`${formSelector} .error`)
      .forEach((e) => e.remove());
    document
      .querySelectorAll(`${formSelector} .form-group`)
      .forEach((g) =>
        g.classList.remove("field-error", "field-success", "field-checking"),
      );
    document
      .querySelectorAll(`${formSelector} .form-control`)
      .forEach((f) =>
        f.classList.remove("input-error", "input-success", "input-checking"),
      );
  }

  // ---------- Load & Render Admins ----------
  async loadAdmins() {
    try {
      const res = await fetch("/admin/list");
      if (res.ok) {
        const result = await res.json();
        this.admins = result.admins || [];
      }
    } catch (err) {
      console.error("Failed to load admins:", err);
    }
    this.applyFilters();
  }

  applyFilters() {
    const nameFilter =
      document.getElementById("adminNameFilter")?.value.trim().toLowerCase() ||
      "";
    const idFilter =
      document.getElementById("adminIdFilter")?.value.trim() || "";

    this.filteredAdmins = this.admins.filter((admin) => {
      const matchName =
        !nameFilter ||
        (admin.username || "").toLowerCase().includes(nameFilter);
      const matchId = !idFilter || String(admin.adminId).includes(idFilter);
      return matchName && matchId;
    });

    // Sort
    const sortOrder =
      document.getElementById("sortOrder")?.value || "ascending";
    switch (sortOrder) {
      case "ascending":
        this.filteredAdmins.sort((a, b) =>
          (a.username || "").localeCompare(b.username || ""),
        );
        break;
      case "descending":
        this.filteredAdmins.sort((a, b) =>
          (b.username || "").localeCompare(a.username || ""),
        );
        break;
      case "recent":
        this.filteredAdmins.sort((a, b) => b.adminId - a.adminId);
        break;
    }

    this.renderAdmins();
    this.updateAdminsCount();
  }

  renderAdmins() {
    const list = document.getElementById("adminsList");
    if (!list) return;
    list.innerHTML = "";

    if (this.filteredAdmins.length === 0) {
      list.innerHTML = `<div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-light, #6c757d)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <p>No admins found</p>
      </div>`;
      return;
    }

    this.filteredAdmins.forEach((admin) => {
      const card = this.createAdminCard(admin);

      const deleteBtn = card.querySelector('[data-action="delete"]');
      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          if (
            confirm(`Are you sure you want to delete admin #${admin.adminId}?`)
          ) {
            this.deleteAdmin(admin.adminId);
          }
        });
      }

      list.appendChild(card);
    });
  }

  createAdminCard(admin) {
    const card = document.createElement("div");
    card.className = "admin-card";
    card.dataset.adminId = admin.adminId;

    const initials = (admin.username || "?")
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    card.innerHTML = `
    <div class="admin-info">
      <div class="admin-id" title="Admin #${admin.adminId}">${initials}</div>
      <div class="admin-details">
        <h3 class="admin-name">${this.escape(admin.username)}</h3>
        <p class="admin-permission">${this.escape(admin.email)}</p>
        <p>${this.escape(admin.phoneNumber)}</p>
      </div>
    </div>
    <div class="admin-actions">
      <button class="btn btn-secondary btn-sm" data-action="edit">Edit</button>
      <button class="btn btn-danger btn-sm" data-action="delete">Delete</button>
    </div>
  `;

    const editBtn = card.querySelector('[data-action="edit"]');
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        this.populateEditModal(admin);
        this.openEditAdminModal();
      });
    }

    return card;
  }

  populateEditModal(admin) {
    document.getElementById("editAdminId").value = admin.adminId;
    document.getElementById("editFullName").value = admin.username;
    document.getElementById("editEmail").value = admin.email;
    document.getElementById("editPhone").value = admin.phoneNumber;
  }

  async updateAdmin() {
    const id = document.getElementById("editAdminId").value;
    const username = document.getElementById("editFullName").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const phoneNumber = document.getElementById("editPhone").value.trim();

    const payload = { adminId: id, username, email, phoneNumber };

    try {
      const res = await fetch("/admin/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (result.status === "success") {
        this.closeEditAdminModal();
        this.toast("Admin updated successfully", "success");
        await this.loadAdmins();
      } else {
        this.toast("Error: " + (result.message || "Update failed"), "error");
      }
    } catch (err) {
      console.error("Update failed:", err);
      this.toast("Server error", "error");
    }
  }

  async deleteAdmin(adminId) {
    try {
      const res = await fetch("/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId }),
      });
      const result = await res.json();
      if (result.status === "success") {
        this.toast("Admin deleted successfully", "success");
        await this.loadAdmins();
      } else {
        this.toast("Error: " + (result.message || "Delete failed"), "error");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      this.toast("Server error", "error");
    }
  }

  updateAdminsCount() {
    const title = document.querySelector(".page-title");
    if (title) title.textContent = `Admins (${this.filteredAdmins.length})`;
  }

  // ---------- Modals ----------
  openRegisterAdminModal() {
    const modal = document.getElementById("registerAdminModal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
    // Reset form and validation states
    this.clearAllErrors("#registerAdminForm");
    document.getElementById("registerAdminForm")?.reset();
    // Remove any lingering password strength meters
    document
      .querySelectorAll("#registerAdminForm .password-strength")
      .forEach((m) => m.remove());
  }

  closeRegisterAdminModal() {
    const modal = document.getElementById("registerAdminModal");
    modal.classList.remove("show");
    document.body.style.overflow = "";
    document.getElementById("registerAdminForm")?.reset();
    this.clearAllErrors("#registerAdminForm");
    document
      .querySelectorAll("#registerAdminForm .password-strength")
      .forEach((m) => m.remove());
  }

  openEditAdminModal() {
    const modal = document.getElementById("editAdminModal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  closeEditAdminModal() {
    const modal = document.getElementById("editAdminModal");
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  openOtpModal() {
    const modal = document.getElementById("otpModal");
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  closeOtpModal() {
    const modal = document.getElementById("otpModal");
    modal.classList.remove("show");
    document.body.style.overflow = "";
    document.getElementById("otpInput").value = "";
  }

  // ---------- Register Admin ----------
  async registerAdmin() {
    // Run full validation
    if (!this.validateForm()) {
      this.toast("Please fix the errors in the form", "error");
      return;
    }

    const form = document.getElementById("registerAdminForm");
    const data = Object.fromEntries(new FormData(form).entries());

    const payload = {
      username: data.fullName.trim(),
      email: data.email.trim(),
      phoneNumber: data.phone.trim(),
      password: data.password.trim(),
    };

    // Final server-side email check before submitting
    try {
      const emailCheck = await fetch("/admin/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email }),
      });
      const emailResult = await emailCheck.json();
      if (emailResult.exists) {
        const emailField = form.querySelector('[name="email"]');
        const emailGroup = emailField?.closest(".form-group");
        this.setFieldError(
          emailGroup,
          emailField,
          "An admin with this email already exists",
        );
        this.toast("This email is already registered", "error");
        return;
      }
    } catch (err) {
      console.error("Email check failed:", err);
      this.toast("Could not verify email availability", "error");
      return;
    }

    // Disable submit button during request
    const submitBtn = document.querySelector(
      "#registerAdminModal .modal-footer .btn-primary",
    );
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Registering...";
    }

    try {
      // STEP 1: SIGNUP REQUEST
      const signupRes = await fetch("/admin/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const signupResult = await signupRes.json();

      if (signupResult.status === "success") {
        this.tempSignupData = payload;
        this.closeRegisterAdminModal();

        // STEP 2: Request OTP
        const otpRes = await fetch("/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        const otpResult = await otpRes.json();

        if (otpResult.status === "success") {
          this.openOtpModal();
          this.toast("OTP sent to email. Please check your inbox.", "success");
        } else {
          this.toast(
            "Failed to send OTP: " + (otpResult.message || "Unknown error"),
            "error",
          );
        }
      } else {
        this.toast(
          "Error: " + (signupResult.message || "Signup failed"),
          "error",
        );
      }
    } catch (err) {
      console.error("Registration process failed:", err);
      this.toast("Server error during registration", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Register";
      }
    }
  }

  // ---------- Toast ----------
  toast(message, type = "info") {
    const colors = {
      success: { bg: "#059669", icon: "✓" },
      error: { bg: "#dc2626", icon: "✕" },
      info: { bg: "#0f172a", icon: "ℹ" },
    };
    const cfg = colors[type] || colors.info;

    const el = document.createElement("div");
    el.className = "toast-notification toast-" + type;
    el.innerHTML = `<span class="toast-icon">${cfg.icon}</span><span>${this.escape(message)}</span>`;
    document.body.appendChild(el);

    // Trigger reflow for animation
    requestAnimationFrame(() => el.classList.add("toast-show"));

    setTimeout(() => {
      el.classList.remove("toast-show");
      el.classList.add("toast-hide");
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }

  escape(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

// ---------- Global helpers ----------
window.addEventListener("DOMContentLoaded", () => {
  window.adminsManager = new AdminsManager();
});

function searchAdmins() {
  window.adminsManager?.applyFilters();
}

function openRegisterAdminModal() {
  window.adminsManager?.openRegisterAdminModal();
}

function closeRegisterAdminModal() {
  window.adminsManager?.closeRegisterAdminModal();
}

function closeEditAdminModal() {
  window.adminsManager?.closeEditAdminModal();
}

function updateAdmin() {
  window.adminsManager?.updateAdmin();
}

function openOtpModal() {
  window.adminsManager?.openOtpModal();
}

function closeOtpModal() {
  window.adminsManager?.closeOtpModal();
}

// --- Submit OTP to /code ---
async function submitOtpCode() {
  const otp = document.getElementById("otpInput").value.trim();
  if (otp.length === 0) {
    window.adminsManager.toast("Please enter the OTP", "error");
    return;
  }

  if (!/^\d{4,6}$/.test(otp)) {
    window.adminsManager.toast("OTP must be 4-6 digits", "error");
    return;
  }

  try {
    const res = await fetch("/code", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `code=${encodeURIComponent(otp)}`,
    });

    const result = await res.json();

    if (result.status === "success") {
      closeOtpModal();
      window.adminsManager.toast(
        "Admin verified & registered successfully!",
        "success",
      );
      setTimeout(async () => {
        await window.adminsManager.loadAdmins();
      }, 1000);
    } else {
      window.adminsManager.toast(
        "Invalid OTP: " + (result.message || "Please try again"),
        "error",
      );
    }
  } catch (err) {
    console.error("OTP verify error:", err);
    window.adminsManager.toast("Server error during verification", "error");
  }
}
