// profile.js
let editMode = false, driverData = {}, newPic = null;
const FIELDS = [
    ["firstname", "firstName"], ["lastname", "lastName"], ["email", "email"],
    ["mobilenumber", "mobileNumber"], ["homeaddress", "homeAddress"], ["licensenumber", "licenseNumber"],
    ["driverid", "driverId"], ["nicnumber", "nicNumber"] ];
const $ = (id) => document.getElementById(id);

document.addEventListener("DOMContentLoaded", () => {
    $(".logout")?.addEventListener("click", handleLogout);
    $("profilePictureInput")?.addEventListener("change", onPicChange);
    loadProfile();
});

function toggleSidebar() { $("sidebar")?.classList.toggle("active"); }
function triggerFileUpload() { $("profilePictureInput")?.click(); }

async function loadProfile() {
    setLoading(true);
    try {
        const res = await fetch("/driver/profile", { credentials: "include" });
        if (res.status === 401) return (location.href = "/views/landing/driverlogin.html");
        const data = await res.json();
        if (data?.status === "error") throw new Error(data.message || "Failed to load profile");

        driverData = data;
        fillProfile(data);
        msg("success", "");
    } catch (e) {
        msg("error", e.message || "Failed to load profile");
    } finally {
        setLoading(false);
    }
}

function fillProfile(d) {
    const full = `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Driver";
    $("headerName").textContent = d.firstName || "Driver";
    $("profileFullName").textContent = full;

    const initial = (d.firstName || d.username || "D").charAt(0).toUpperCase();
    $("headerInitial").textContent = initial;
    $("profileAvatar").textContent = initial;

    FIELDS.forEach(([id, key]) => $(id) && ($(id).value = d[key] ?? ""));
    setPic(d.profilePicture || null);
}

function toggleEditMode(e) {
    e?.preventDefault();
    if (!editMode) return enableEdit(true);

    saveProfile(); // keep edit mode if save fails
}

function enableEdit(on) {
    editMode = on;
    const btnText = $("edit-button-text");
    const icon = $("editIcon");
    const camBtn = $("editAvatarBtn");

    ["firstname","lastname","email","mobilenumber","homeaddress","licensenumber"].forEach(id => {
        const el = $(id); if (!el) return;
        on ? el.removeAttribute("readonly") : el.setAttribute("readonly", "readonly");
        el.classList.toggle("editable", on);
    });

    if (camBtn) camBtn.style.display = on ? "flex" : "none";
    if (btnText) btnText.textContent = on ? "Save Profile" : "Edit Profile";
    if (icon) icon.className = on ? "fas fa-save info-icon" : "fas fa-edit info-icon";
}

async function saveProfile() {
    const payload = {
        firstname: $("firstname")?.value?.trim() || "",
        lastname: $("lastname")?.value?.trim() || "",
        email: $("email")?.value?.trim() || "",
        mobilenumber: $("mobilenumber")?.value?.trim() || "",
        homeaddress: $("homeaddress")?.value?.trim() || "",
        licensenumber: $("licensenumber")?.value?.trim() || ""
        // nicnumber intentionally not sent (do not allow change)
    };

    if (!payload.firstname || !payload.lastname || !payload.email) return msg("error", "First name, last name, and email are required");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return msg("error", "Invalid email address");

    if (newPic && newPic !== driverData.profilePicture) payload.profilepicture = newPic;

    try {
        const res = await fetch("/driver/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            credentials: "include",
            body: JSON.stringify(payload)
        });
        const out = await res.json();

        if (res.status === 401) return (location.href = "/views/landing/driverlogin.html");
        if (out.status !== "success") throw new Error(out.message || "Update failed");

        // update UI immediately
        $("headerName").textContent = payload.firstname;
        $("profileFullName").textContent = `${payload.firstname} ${payload.lastname}`.trim();
        if (!newPic) {
            const init = payload.firstname.charAt(0).toUpperCase();
            $("headerInitial").textContent = init;
            $("profileAvatar").textContent = init;
        }

        driverData = { ...driverData,
            firstName: payload.firstname, lastName: payload.lastname, email: payload.email,
            mobileNumber: payload.mobilenumber, homeAddress: payload.homeaddress, licenseNumber: payload.licensenumber,
            profilePicture: payload.profilepicture ?? driverData.profilePicture
        };

        enableEdit(false);
        msg("success", out.message || "Profile updated successfully");
    } catch (e) {
        msg("error", e.message || "Failed to save profile");
    }
}

function onPicChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return msg("error", "Select an image file");
    if (file.size > 5 * 1024 * 1024) return msg("error", "Image must be < 5MB");

    const r = new FileReader();
    r.onload = () => { newPic = r.result; setPic(newPic); msg("success", 'Picture updated. Click "Save Profile".'); };
    r.onerror = () => msg("error", "Failed to read image");
    r.readAsDataURL(file);
}

function setPic(base64) {
    const img = $("profileImage"), avatar = $("profileAvatar"), header = $("headerInitial");
    if (base64) {
        if (img) { img.src = base64; img.style.display = "block"; }
        if (avatar) avatar.style.display = "none";
        if (header) { header.style.backgroundImage = `url(${base64})`; header.style.backgroundSize = "cover"; header.style.backgroundPosition = "center"; header.textContent = ""; }
    } else {
        if (img) img.style.display = "none";
        if (avatar) avatar.style.display = "flex";
        if (header) { header.style.backgroundImage = ""; header.textContent = (driverData.firstName || "D").charAt(0).toUpperCase(); }
    }
}

function handleLogout() {
    if (confirm("Are you sure you want to logout?")) location.href = "/driver/logout";
}

function setLoading(on) {
    const L = $("loadingIndicator");
    ["profileHeader","personalInfo","companyInfo"].forEach(id => $(id) && ($(id).style.display = on ? "none" : "block"));
    if (L) L.style.display = on ? "block" : "none";
}

function msg(type, text) {
    const isErr = type === "error";
    const box = $(isErr ? "errorMessage" : "successMessage");
    const other = $(isErr ? "successMessage" : "errorMessage");
    const t = $(isErr ? "errorText" : "successText");

    if (other) other.style.display = "none";
    if (!box || !t) return text ? alert(text) : null;

    if (!text) return (box.style.display = "none");
    t.textContent = text;
    box.style.display = "block";
    setTimeout(() => (box.style.display = "none"), 4000);
}

// used by inline onclick in HTML
window.toggleSidebar = toggleSidebar;
window.toggleEditMode = toggleEditMode;
window.triggerFileUpload = triggerFileUpload;
window.handleLogout = handleLogout;