// driver-view.js — DB-powered detail + edit modal + ban/unban toggle
(function () {
  if (document.querySelector(".sidebar"))
    document.body.classList.add("with-sidebar");

  const API_BASE = "/api/admin/drivers";

  const DEFAULTS = {
    id: 0,
    name: "—",
    company: "—",
    rating: 0,
    reviews: 0,
    description: "—",
    appliedDate: "—",
    phone: "—",
    email: "—",
    age: 0,
    experience: 0,
    location: "—",
    status: "—",
    totalRides: 0,
    totalKm: 0,
    licenseNumber: "—",
    nicNumber: "—",
    licenseExpiry: "—",
    active: true,
    banned: false,
  };

  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const fmt = (v) => num(v, 0).toLocaleString();

  let currentId = null;
  let currentDriver = { ...DEFAULTS };

  document.addEventListener("DOMContentLoaded", async () => {
    currentId = getIdFromURL();
    if (!Number.isFinite(Number(currentId))) {
      renderEmpty("Missing driver id.");
      wireEditModal(currentDriver);
      wireBanButton(currentDriver);
      return;
    }

    const drv = await fetchDriver(currentId);
    if (!drv) {
      renderEmpty("Driver not found.");
      wireEditModal(currentDriver);
      wireBanButton(currentDriver);
      return;
    }

    currentDriver = normalizeDriver(drv);

    renderDriver(currentDriver);
    wireEditModal(currentDriver);
    wireBanButton(currentDriver);
  });

  async function fetchDriver(id) {
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.success !== true) return null;
      return data.driver || null;
    } catch (e) {
      console.error("Driver detail load error:", e);
      return null;
    }
  }

  function normalizeDriver(d) {
    return { ...DEFAULTS, ...(d || {}) };
  }

  function renderDriver(drv) {
    const mount = $("#driverView");
    if (!mount) return;

    const initials = String(drv.name)
      .split(" ")
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase();

    mount.innerHTML = `
      <section class="profile-header">
        <div class="profile-avatar"><span>${esc(initials)}</span></div>
        <div class="profile-basic-info">
          <h2>${esc(drv.name)}</h2>
          <div class="profile-company">${esc(drv.company)}</div>
          <div class="profile-stats">
            <div class="stat-item"><span class="stat-value">${fmt(drv.totalRides)}</span><span class="stat-label">Total Rides</span></div>
            <div class="stat-item"><span class="stat-value">${num(drv.rating, 0).toFixed(1)}</span><span class="stat-label">Avg Rating</span></div>
            <div class="stat-item"><span class="stat-value">${fmt(drv.totalKm)} KM</span><span class="stat-label">Total KM</span></div>
          </div>
        </div>
      </section>

      <section class="profile-details">
        <div class="detail-section">
          <h3> Driver Information</h3>
          <div class="detail-item"><span class="detail-label">Driver Name</span><span class="detail-value">${esc(drv.name)}</span></div>
          <div class="detail-item"><span class="detail-label">Age</span><span class="detail-value">${num(drv.age)} years</span></div>
          <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">${esc(drv.phone)}</span></div>
          <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${esc(drv.email)}</span></div>
          <div class="detail-item"><span class="detail-label">Location</span><span class="detail-value">${esc(drv.location)}</span></div>
          <div class="detail-item"><span class="detail-label">Experience</span><span class="detail-value">${num(drv.experience)} years</span></div>
          <div class="detail-item"><span class="detail-label">Joined</span><span class="detail-value">${esc(drv.appliedDate)}</span></div>
        </div>

        <div class="detail-section">
          <h3> Driver Statistics</h3>
          <div class="detail-item"><span class="detail-label">Total Rides</span><span class="detail-value">${fmt(drv.totalRides)}</span></div>
          <div class="detail-item"><span class="detail-label">Average Rating</span><span class="detail-value">${num(drv.rating).toFixed(1)}/5.0</span></div>
          <div class="detail-item"><span class="detail-label">Total Reviews</span><span class="detail-value">${fmt(drv.reviews)}</span></div>
          <div class="detail-item"><span class="detail-label">Total Distance</span><span class="detail-value">${fmt(drv.totalKm)} KM</span></div>
          <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">${esc(String(drv.status || "").toUpperCase())}</span></div>
        </div>

        <div class="detail-section document-section">
          <h3> Documents & Verification</h3>
          <div class="documents-grid">
            <div class="document-card">
              <div class="document-icon"></div>
              <div class="document-title">NIC Document</div>
              <div class="document-status verified">Verified</div>
              <div class="document-id">ID: ${esc(drv.nicNumber || "—")}</div>
            </div>

            <div class="document-card">
              <div class="document-icon"></div>
              <div class="document-title">Driver License</div>
              <div class="document-status verified">Verified</div>
              <div class="document-id">License: ${esc(drv.licenseNumber || "—")}</div>
              <div class="document-info">Expires: ${esc(drv.licenseExpiry || "—")}</div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderEmpty(msg) {
    const mount = $("#driverView");
    if (!mount) return;
    mount.innerHTML = `
      <div style="background:#fff;border:1px solid #e6e8ec;border-radius:12px;padding:18px;">
        ${esc(msg)}
      </div>
    `;
  }

  function wireEditModal(driver) {
    const modal = $("#editDriverModal");
    const openBtn = $("#btnOpenEditDriver");
    const closeBtn = $("#closeEditDriver");
    const cancelBtn = $("#cancelEditDriver");
    const form = $("#editDriverForm");

    if (!modal || !openBtn || !closeBtn || !form) return;

    const open = () => {
      modal.classList.add("show");
      modal.setAttribute("aria-hidden", "false");
      prefill(driver);
    };

    const close = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
    };

    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    if (cancelBtn) cancelBtn.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Collect all form data
      const updated = {
        id: driver.id,
        name: $("#edName").value.trim(),
        company: $("#edCompany").value.trim(),
        phone: $("#edPhone").value.trim(),
        email: $("#edEmail").value.trim(),
        location: $("#edLocation").value.trim(),
        age: num($("#edAge").value),
        experience: num($("#edExp").value),
        status: $("#edStatus").value.trim(),
        appliedDate: $("#edApplied").value.trim(),
        nicNumber: $("#edNIC").value.trim(),
        licenseNumber: $("#edLicense").value.trim(),
        licenseExpiry: $("#edExpiry").value.trim(),
        description: $("#edDesc").value.trim(),
        rating: num($("#edRating").value),
        reviews: num($("#edReviews").value),
      };

      try {
        const res = await fetch(`${API_BASE}/${driver.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(updated),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || data.success !== true)
          throw new Error(data?.message || "Update failed");

        // Refresh driver data from server
        const fresh = await fetchDriver(driver.id);
        if (fresh) {
          currentDriver = normalizeDriver(fresh);
          // Update the driver reference passed to wireEditModal
          Object.assign(driver, currentDriver);
          renderDriver(currentDriver);
          wireBanButton(currentDriver);
        }

        close();
        alert("Driver updated successfully.");
      } catch (err) {
        console.error("Update error:", err);
        alert("Failed to update driver. Check console for details.");
      }
    });
  }

  function prefill(d) {
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v ?? "";
    };

    set("edName", d.name);
    set("edCompany", d.company);
    set("edPhone", d.phone);
    set("edEmail", d.email);
    set("edLocation", d.location);
    set("edAge", d.age);
    set("edExp", d.experience);
    set("edRides", d.totalRides); // read-only
    set("edKm", d.totalKm); // read-only
    set("edStatus", d.status);
    set("edApplied", d.appliedDate);
    set("edNIC", d.nicNumber);
    set("edLicense", d.licenseNumber);
    set("edExpiry", d.licenseExpiry);
    set("edDesc", d.description);
    set("edRating", d.rating);
    set("edReviews", d.reviews);
  }

  function wireBanButton(driver) {
    const btn = $("#banDriverBtn");
    if (!btn) return;

    const render = () => {
      const banned = !!driver.banned;
      btn.textContent = banned ? "Unban Driver" : "Ban Driver";
      btn.classList.toggle("btn-danger", !banned);
      btn.classList.toggle("btn-primary", banned);
    };

    render();

    btn.onclick = async () => {
      try {
        const action = driver.banned ? "unban" : "ban";
        const res = await fetch(`${API_BASE}/${driver.id}/${action}`, {
          method: "POST",
          headers: { Accept: "application/json" },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || data.success !== true)
          throw new Error(data?.message || "Action failed");

        const fresh = await fetchDriver(driver.id);
        if (fresh) {
          currentDriver = normalizeDriver(fresh);
          driver.banned = currentDriver.banned;
          renderDriver(currentDriver);
          render();
        }
        alert(data.message || "Done");
      } catch (e) {
        console.error(e);
        alert("Failed. Check console.");
      }
    };
  }

  function getIdFromURL() {
    const u = new URL(window.location.href);
    return u.searchParams.get("id");
  }
})();
