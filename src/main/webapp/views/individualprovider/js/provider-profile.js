document.addEventListener("DOMContentLoaded", async () => {
  try {
    const providerId = await ensureProviderId();

    document.getElementById("backBtn").addEventListener("click", () => {
      window.location.href = "./dashboard.html";
    });

    document.getElementById("saveBtn").addEventListener("click", () => {
      saveProfile(providerId);
    });

    document
      .getElementById("changePasswordBtn")
      .addEventListener("click", changePassword);

    initPasswordToggles();
    initPasswordStrengthMeter();
    initPasswordMatchHint();

    loadProfile(providerId);
  } catch (e) {
    alert(e.message);
    // send to login page if you have one:
    // window.location.href = "./login.html";
  }
});

async function ensureProviderId() {
  let providerId = sessionStorage.getItem("providerId");
  if (providerId) return providerId;

  // Try to fetch from backend session
  const res = await fetch("http://localhost:8080/api/provider/me");
  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.providerId) {
    throw new Error(data.error || "Not logged in as provider.");
  }

  sessionStorage.setItem("providerId", String(data.providerId));
  return String(data.providerId);
}

async function apiGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function apiPut(url, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json().catch(() => ({}));
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error || "Request failed";
    throw new Error(msg);
  }
  return data;
}

function toast(type, msg, which = "toast") {
  const el = document.getElementById(which);
  if (!el) return;
  el.className = `toast ${type}`;
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 3000);
}

async function loadProfile(providerId) {
  const url = `http://localhost:8080/api/provider/profile?providerId=${encodeURIComponent(
    providerId,
  )}`;

  try {
    const p = await apiGet(url);

    setValue("username", p.username);
    setValue("email", p.email);
    setValue("firstName", p.firstName);
    setValue("lastName", p.lastName);
    setValue("phoneNumber", p.phoneNumber);
    setValue("houseNumber", p.houseNumber);
    setValue("street", p.street);
    setValue("city", p.city);
    setValue("zipCode", p.zipCode);

    document.getElementById("providerIdText").textContent = p.providerId ?? "-";
  } catch (e) {
    console.error(e);
    toast("error", "Failed to load profile");
  }
}

async function saveProfile(providerId) {
  const url = `http://localhost:8080/api/provider/profile?providerId=${encodeURIComponent(
    providerId,
  )}`;

  // Email is read-only on the UI and shouldn't be changed — we still send
  // the current value so the backend payload stays consistent.
  const payload = {
    username: getValue("username"),
    email: getValue("email"),
    firstName: getValue("firstName"),
    lastName: getValue("lastName"),
    phoneNumber: getValue("phoneNumber"),
    houseNumber: getValue("houseNumber"),
    street: getValue("street"),
    city: getValue("city"),
    zipCode: getValue("zipCode"),
  };

  try {
    await apiPut(url, payload);
    toast("success", "Profile updated successfully");
  } catch (e) {
    console.error(e);
    toast("error", "Update failed (check username duplicates)");
  }
}

/* ============================================================
   Password Change
   ============================================================ */
async function changePassword() {
  const email = getValue("email");
  const currentPassword = getValue("currentPassword");
  const newPassword = getValue("newPassword");
  const confirmPassword = getValue("confirmPassword");

  // ── Client-side validation (mirrors servlet rules) ──
  if (!email) {
    toast("error", "Email not loaded yet — please try again", "pwToast");
    return;
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    toast("error", "Please fill in all password fields", "pwToast");
    return;
  }

  if (newPassword.length < 8) {
    toast("error", "New password must be at least 8 characters", "pwToast");
    return;
  }

  if (currentPassword === newPassword) {
    toast(
      "error",
      "New password must be different from current password",
      "pwToast",
    );
    return;
  }

  if (newPassword !== confirmPassword) {
    toast("error", "New password and confirmation do not match", "pwToast");
    return;
  }

  const btn = document.getElementById("changePasswordBtn");
  const originalHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

  try {
    await apiPost("http://localhost:8080/provider/change-password", {
      email,
      currentPassword,
      newPassword,
    });

    toast("success", "Password changed successfully", "pwToast");

    // Clear the password fields
    setValue("currentPassword", "");
    setValue("newPassword", "");
    setValue("confirmPassword", "");
    resetStrengthMeter();
    resetMatchHint();
  } catch (e) {
    console.error(e);
    toast("error", e.message || "Failed to change password", "pwToast");
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

/* ============================================================
   Password UX: show/hide toggles, strength meter, match hint
   ============================================================ */
function initPasswordToggles() {
  document.querySelectorAll(".toggle-password").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-target");
      const input = document.getElementById(targetId);
      const icon = btn.querySelector("i");
      if (!input) return;

      if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
      } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
      }
    });
  });
}

function initPasswordStrengthMeter() {
  const input = document.getElementById("newPassword");
  if (!input) return;

  input.addEventListener("input", () => {
    const val = input.value;
    const meter = document.getElementById("strengthMeter");
    const bar = meter.querySelector(".strength-bar");
    const label = meter.querySelector(".strength-label");

    if (!val) {
      resetStrengthMeter();
      return;
    }

    meter.classList.add("active");
    const score = scorePassword(val);

    bar.classList.remove("weak", "medium", "strong");

    if (score <= 2) {
      bar.classList.add("weak");
      label.textContent = "Weak password";
    } else if (score === 3) {
      bar.classList.add("medium");
      label.textContent = "Medium strength";
    } else {
      bar.classList.add("strong");
      label.textContent = "Strong password";
    }
  });
}

function scorePassword(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function resetStrengthMeter() {
  const meter = document.getElementById("strengthMeter");
  if (!meter) return;
  meter.classList.remove("active");
  const bar = meter.querySelector(".strength-bar");
  if (bar) bar.classList.remove("weak", "medium", "strong");
}

function initPasswordMatchHint() {
  const newPw = document.getElementById("newPassword");
  const confirm = document.getElementById("confirmPassword");
  const hint = document.getElementById("matchHint");
  if (!newPw || !confirm || !hint) return;

  const update = () => {
    if (!confirm.value) {
      resetMatchHint();
      return;
    }
    if (newPw.value === confirm.value) {
      hint.textContent = "✓ Passwords match";
      hint.className = "match-hint ok";
    } else {
      hint.textContent = "✗ Passwords do not match";
      hint.className = "match-hint bad";
    }
  };

  newPw.addEventListener("input", update);
  confirm.addEventListener("input", update);
}

function resetMatchHint() {
  const hint = document.getElementById("matchHint");
  if (!hint) return;
  hint.textContent = "";
  hint.className = "match-hint";
}

function setValue(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v ?? "";
}
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}
