document.addEventListener("DOMContentLoaded", async () => {
  try {
    const providerId = await ensureProviderId();

    document.getElementById("backBtn").addEventListener("click", () => {
      window.location.href = "./dashboard.html";
    });

    document.getElementById("saveBtn").addEventListener("click", () => {
      saveProfile(providerId);
    });

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

function toast(type, msg) {
  const el = document.getElementById("toast");
  el.className = `toast ${type}`;
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => (el.style.display = "none"), 2500);
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
    document.getElementById("companyIdText").textContent = p.companyId ?? "-";
  } catch (e) {
    console.error(e);
    toast("error", "Failed to load profile");
  }
}

async function saveProfile(providerId) {
  const url = `http://localhost:8080/api/provider/profile?providerId=${encodeURIComponent(
    providerId,
  )}`;

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
    toast("error", "Update failed (check username/email duplicates)");
  }
}

function setValue(id, v) {
  const el = document.getElementById(id);
  if (el) el.value = v ?? "";
}
function getValue(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
}
