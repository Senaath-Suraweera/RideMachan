// driver-view.js — Full driver detail view with all DB fields, image uploads, read-only enforcement
(function () {
  if (document.querySelector(".sidebar"))
    document.body.classList.add("with-sidebar");

  const API_BASE = "/api/admin/drivers";

  const DEFAULTS = {
    id: 0,
    username: "—",
    firstName: "",
    lastName: "",
    name: "—",
    company: "—",
    companyId: 0,
    rating: 0,
    reviews: 0,
    description: "—",
    appliedDate: "—",
    phone: "—",
    email: "—",
    age: 0,
    experience: 0,
    area: "—",
    assignedArea: "—",
    homeAddress: "—",
    shiftTime: "—",
    reportingManager: "—",
    status: "—",
    availability: "—",
    totalRides: 0,
    totalKm: 0,
    onTimePercentage: 0,
    licenseNumber: "—",
    licenseExpiry: "—",
    licenseCategories: "—",
    nicNumber: "—",
    active: true,
    banned: false,
    hasProfileImage: false,
    hasNicImage: false,
    hasLicenseImage: false,
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
    wireDocumentModal();
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

  function getProfileImageUrl(drv) {
    return drv.hasProfileImage ? `${API_BASE}/${drv.id}/profile-image` : null;
  }

  /* ======================= RENDER DRIVER VIEW ======================= */
  function renderDriver(drv) {
    const mount = $("#driverView");
    if (!mount) return;

    const initials = String(drv.name)
      .split(" ")
      .map((n) => n[0] || "")
      .join("")
      .toUpperCase();

    const profileImgUrl = getProfileImageUrl(drv);
    const avatarContent = profileImgUrl
      ? `<img src="${profileImgUrl}" alt="${esc(drv.name)}" class="profile-avatar-img" onerror="this.style.display='none';this.nextElementSibling.style.display='grid';" /><span class="profile-avatar-fallback" style="display:none">${esc(initials)}</span>`
      : `<span>${esc(initials)}</span>`;

    const location = drv.area || drv.assignedArea || "—";

    mount.innerHTML = `
      <section class="profile-header">
        <div class="profile-avatar">${avatarContent}</div>
        <div class="profile-basic-info">
          <h2>${esc(drv.name)}</h2>
          <div class="profile-company">${esc(drv.company)}</div>
          <div class="profile-stats">
            <div class="stat-item"><span class="stat-value">${fmt(drv.totalRides)}</span><span class="stat-label">Total Rides</span></div>
            <div class="stat-item"><span class="stat-value">${num(drv.rating, 0).toFixed(1)}</span><span class="stat-label">Avg Rating</span></div>
            <div class="stat-item"><span class="stat-value">${fmt(drv.totalKm)} KM</span><span class="stat-label">Total KM</span></div>
            <div class="stat-item"><span class="stat-value">${num(drv.onTimePercentage)}%</span><span class="stat-label">On-Time</span></div>
          </div>
        </div>
      </section>

      <section class="profile-details">

        <!-- Personal Information -->
        <div class="detail-section">
          <h3>Personal Information</h3>
          <div class="detail-item"><span class="detail-label">Driver ID</span><span class="detail-value">#${drv.id}</span></div>
          <div class="detail-item"><span class="detail-label">Username</span><span class="detail-value">${esc(drv.username)}</span></div>
          <div class="detail-item"><span class="detail-label">Full Name</span><span class="detail-value">${esc(drv.name)}</span></div>
          <div class="detail-item"><span class="detail-label">Age</span><span class="detail-value">${num(drv.age)} years</span></div>
          <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">${esc(drv.phone)}</span></div>
          <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${esc(drv.email)}</span></div>
          <div class="detail-item"><span class="detail-label">Home Address</span><span class="detail-value">${esc(drv.homeAddress)}</span></div>
          <div class="detail-item"><span class="detail-label">Joined</span><span class="detail-value">${esc(drv.appliedDate)}</span></div>
        </div>

        <!-- Work & Assignment -->
        <div class="detail-section">
          <h3>Work & Assignment</h3>
          <div class="detail-item"><span class="detail-label">Company</span><span class="detail-value">${esc(drv.company)}</span></div>
          <div class="detail-item"><span class="detail-label">Area</span><span class="detail-value">${esc(drv.area)}</span></div>
          <div class="detail-item"><span class="detail-label">Assigned Area</span><span class="detail-value">${esc(drv.assignedArea)}</span></div>
          <div class="detail-item"><span class="detail-label">Shift Time</span><span class="detail-value">${esc(drv.shiftTime)}</span></div>
          <div class="detail-item"><span class="detail-label">Reporting Manager</span><span class="detail-value">${esc(drv.reportingManager)}</span></div>
          <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value status-badge">${esc(String(drv.status || "").toUpperCase())}</span></div>
          <div class="detail-item"><span class="detail-label">Availability</span><span class="detail-value">${esc(drv.availability)}</span></div>
          <div class="detail-item"><span class="detail-label">Experience</span><span class="detail-value">${num(drv.experience)} years</span></div>
        </div>

        <!-- Performance Statistics -->
        <div class="detail-section">
          <h3>Performance Statistics</h3>
          <div class="detail-item"><span class="detail-label">Total Rides</span><span class="detail-value">${fmt(drv.totalRides)}</span></div>
          <div class="detail-item"><span class="detail-label">Total Distance</span><span class="detail-value">${fmt(drv.totalKm)} KM</span></div>
          <div class="detail-item"><span class="detail-label">On-Time %</span><span class="detail-value">${num(drv.onTimePercentage)}%</span></div>
          <div class="detail-item"><span class="detail-label">Average Rating</span><span class="detail-value">${num(drv.rating).toFixed(1)} / 5.0</span></div>
          <div class="detail-item"><span class="detail-label">Total Reviews</span><span class="detail-value">${fmt(drv.reviews)}</span></div>
        </div>

        <!-- License & NIC -->
        <div class="detail-section">
          <h3>License & Identification</h3>
          <div class="detail-item"><span class="detail-label">NIC Number</span><span class="detail-value">${esc(drv.nicNumber)}</span></div>
          <div class="detail-item"><span class="detail-label">License Number</span><span class="detail-value">${esc(drv.licenseNumber)}</span></div>
          <div class="detail-item"><span class="detail-label">License Expiry</span><span class="detail-value">${esc(drv.licenseExpiry)}</span></div>
          <div class="detail-item"><span class="detail-label">License Categories</span><span class="detail-value">${esc(drv.licenseCategories)}</span></div>
          <div class="detail-item"><span class="detail-label">Active</span><span class="detail-value">${drv.active ? "Yes" : "No"}</span></div>
          <div class="detail-item"><span class="detail-label">Banned</span><span class="detail-value">${drv.banned ? "Yes" : "No"}</span></div>
        </div>

        <!-- Description -->
        <div class="detail-section description-section">
          <h3>Description</h3>
          <p class="description-text">${esc(drv.description)}</p>
        </div>

        <!-- Documents -->
        <div class="detail-section document-section">
          <h3>Documents & Photos</h3>
          <div class="documents-grid">
            <div class="document-card ${drv.hasProfileImage ? "clickable" : ""}" ${drv.hasProfileImage ? `onclick="viewDocument('profile')"` : ""}>
              <div class="document-icon doc-icon-profile"></div>
              <div class="document-title">Profile Photo</div>
              <div class="document-status ${drv.hasProfileImage ? "verified" : "pending"}">${drv.hasProfileImage ? "Uploaded" : "No Photo"}</div>
              ${drv.hasProfileImage ? '<div class="document-action">Click to view</div>' : ""}
            </div>

            <div class="document-card ${drv.hasNicImage ? "clickable" : ""}" ${drv.hasNicImage ? `onclick="viewDocument('nic')"` : ""}>
              <div class="document-icon doc-icon-nic"></div>
              <div class="document-title">NIC Document</div>
              <div class="document-status ${drv.hasNicImage ? "verified" : "pending"}">${drv.hasNicImage ? "Verified" : "No Document"}</div>
              <div class="document-id">ID: ${esc(drv.nicNumber || "—")}</div>
              ${drv.hasNicImage ? '<div class="document-action">Click to view</div>' : ""}
            </div>

            <div class="document-card ${drv.hasLicenseImage ? "clickable" : ""}" ${drv.hasLicenseImage ? `onclick="viewDocument('license')"` : ""}>
              <div class="document-icon doc-icon-license"></div>
              <div class="document-title">Driver's License</div>
              <div class="document-status ${drv.hasLicenseImage ? "verified" : "pending"}">${drv.hasLicenseImage ? "Verified" : "No Document"}</div>
              <div class="document-id">License: ${esc(drv.licenseNumber || "—")}</div>
              <div class="document-info">Expires: ${esc(drv.licenseExpiry || "—")}</div>
              ${drv.hasLicenseImage ? '<div class="document-action">Click to view</div>' : ""}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  /* ======================= DOCUMENT VIEWER ======================= */
  window.viewDocument = function (type) {
    const modal = $("#documentViewModal");
    const img = $("#documentViewImage");
    const title = $("#documentViewTitle");
    if (!modal || !img || !title) return;

    let url = "";
    let titleText = "";

    switch (type) {
      case "nic":
        url = `${API_BASE}/${currentDriver.id}/nic-image`;
        titleText = "NIC Document";
        break;
      case "license":
        url = `${API_BASE}/${currentDriver.id}/license-image`;
        titleText = "Driver's License";
        break;
      case "profile":
        url = `${API_BASE}/${currentDriver.id}/profile-image`;
        titleText = "Profile Photo";
        break;
    }

    title.textContent = titleText;
    img.src = url;
    img.alt = titleText;
    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  };

  function wireDocumentModal() {
    const modal = $("#documentViewModal");
    const closeBtn = $("#closeDocumentView");
    if (!modal) return;

    const close = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      const img = $("#documentViewImage");
      if (img) img.src = "";
    };

    if (closeBtn) closeBtn.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });
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

  /* ======================= EDIT MODAL ======================= */
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
      updateImagePreviews(driver);
    };

    const close = () => {
      modal.classList.remove("show");
      modal.setAttribute("aria-hidden", "true");
      resetFileInputs();
    };

    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    if (cancelBtn) cancelBtn.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) close();
    });

    // Wire file input previews
    wireFilePreview("edProfileImage", "profilePreviewImg", "profilePreview");
    wireFilePreview("edNicImage", "nicPreviewImg", "nicPreview");
    wireFilePreview("edLicenseImage", "licensePreviewImg", "licensePreview");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const profileFile = $("#edProfileImage")?.files?.[0];
      const nicFile = $("#edNicImage")?.files?.[0];
      const licenseFile = $("#edLicenseImage")?.files?.[0];
      const hasFiles = profileFile || nicFile || licenseFile;

      try {
        let res;

        if (hasFiles) {
          // Use FormData for multipart
          const formData = new FormData();
          formData.append("name", $("#edName").value.trim());
          formData.append("phone", $("#edPhone").value.trim());
          formData.append("area", $("#edArea").value.trim());
          formData.append("assignedArea", $("#edAssignedArea").value.trim());
          formData.append("homeAddress", $("#edHomeAddress").value.trim());
          formData.append("status", $("#edStatus").value.trim());
          formData.append("availability", $("#edAvailability").value.trim());
          formData.append("shiftTime", $("#edShiftTime").value.trim());
          formData.append(
            "reportingManager",
            $("#edReportingManager").value.trim(),
          );
          formData.append("licenseExpiry", $("#edLicenseExpiry").value.trim());
          formData.append(
            "licenseCategories",
            $("#edLicenseCategories").value.trim(),
          );
          formData.append("age", $("#edAge").value.trim());
          formData.append("experience", $("#edExp").value.trim());
          formData.append("description", $("#edDesc").value.trim());

          if (profileFile) formData.append("profileImage", profileFile);
          if (nicFile) formData.append("nicImage", nicFile);
          if (licenseFile) formData.append("licenseImage", licenseFile);

          res = await fetch(`${API_BASE}/${driver.id}`, {
            method: "PUT",
            headers: { Accept: "application/json" },
            body: formData,
          });
        } else {
          // JSON body
          const updated = {
            name: $("#edName").value.trim(),
            phone: $("#edPhone").value.trim(),
            area: $("#edArea").value.trim(),
            assignedArea: $("#edAssignedArea").value.trim(),
            homeAddress: $("#edHomeAddress").value.trim(),
            status: $("#edStatus").value.trim(),
            availability: $("#edAvailability").value.trim(),
            shiftTime: $("#edShiftTime").value.trim(),
            reportingManager: $("#edReportingManager").value.trim(),
            licenseExpiry: $("#edLicenseExpiry").value.trim(),
            licenseCategories: $("#edLicenseCategories").value.trim(),
            age: num($("#edAge").value),
            experience: num($("#edExp").value),
            description: $("#edDesc").value.trim(),
          };

          res = await fetch(`${API_BASE}/${driver.id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(updated),
          });
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data || data.success !== true)
          throw new Error(data?.message || "Update failed");

        // Refresh
        const fresh = await fetchDriver(driver.id);
        if (fresh) {
          currentDriver = normalizeDriver(fresh);
          Object.assign(driver, currentDriver);
          renderDriver(currentDriver);
          wireBanButton(currentDriver);
          wireDocumentModal();
        }

        close();
        alert("Driver updated successfully.");
      } catch (err) {
        console.error("Update error:", err);
        alert("Failed to update driver. Check console for details.");
      }
    });
  }

  function wireFilePreview(inputId, imgId, wrapperId) {
    const input = $(`#${inputId}`);
    if (!input) return;

    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const img = $(`#${imgId}`);
      const wrapper = $(`#${wrapperId}`);
      if (!img || !wrapper) return;

      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          img.src = ev.target.result;
          wrapper.classList.add("has-image");
        };
        reader.readAsDataURL(file);
      } else if (file) {
        // Non-image file (e.g., PDF) – show placeholder
        img.src = "";
        wrapper.classList.add("has-image");
      }
    });
  }

  function resetFileInputs() {
    ["edProfileImage", "edNicImage", "edLicenseImage"].forEach((id) => {
      const el = $(`#${id}`);
      if (el) el.value = "";
    });
  }

  function updateImagePreviews(driver) {
    // Profile
    const profilePreview = $("#profilePreview");
    const profileImg = $("#profilePreviewImg");
    if (profilePreview && profileImg) {
      if (driver.hasProfileImage) {
        profileImg.src = `${API_BASE}/${driver.id}/profile-image`;
        profilePreview.classList.add("has-image");
      } else {
        profileImg.src = "";
        profilePreview.classList.remove("has-image");
      }
    }

    // NIC
    const nicPreview = $("#nicPreview");
    const nicImg = $("#nicPreviewImg");
    if (nicPreview && nicImg) {
      if (driver.hasNicImage) {
        nicImg.src = `${API_BASE}/${driver.id}/nic-image`;
        nicPreview.classList.add("has-image");
      } else {
        nicImg.src = "";
        nicPreview.classList.remove("has-image");
      }
    }

    // License
    const licensePreview = $("#licensePreview");
    const licenseImg = $("#licensePreviewImg");
    if (licensePreview && licenseImg) {
      if (driver.hasLicenseImage) {
        licenseImg.src = `${API_BASE}/${driver.id}/license-image`;
        licensePreview.classList.add("has-image");
      } else {
        licenseImg.src = "";
        licensePreview.classList.remove("has-image");
      }
    }
  }

  function prefill(d) {
    const set = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.value = v ?? "";
    };

    // Editable fields
    set("edName", d.name);
    set("edPhone", d.phone);
    set("edAge", d.age);
    set("edExp", d.experience);
    set("edArea", d.area);
    set("edAssignedArea", d.assignedArea);
    set("edHomeAddress", d.homeAddress);
    set("edStatus", d.status);
    set("edAvailability", d.availability);
    set("edShiftTime", d.shiftTime);
    set("edReportingManager", d.reportingManager);
    set("edLicenseExpiry", d.licenseExpiry);
    set("edLicenseCategories", d.licenseCategories);
    set("edDesc", d.description);

    // Read-only display fields
    const setRo = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v ?? "—";
    };

    setRo("edIdDisplay", `#${d.id}`);
    setRo("edUsernameDisplay", d.username);
    setRo("edEmailDisplay", d.email);
    setRo("edCompanyDisplay", d.company);
    setRo("edRatingDisplay", `${num(d.rating).toFixed(1)} / 5.0`);
    setRo("edReviewsDisplay", `${fmt(d.reviews)} reviews`);
    setRo("edAppliedDisplay", d.appliedDate);
    setRo("edNICDisplay", d.nicNumber);
    setRo("edLicenseDisplay", d.licenseNumber);
    setRo("edRidesDisplay", fmt(d.totalRides));
    setRo("edKmDisplay", `${fmt(d.totalKm)} KM`);
    setRo("edOnTimeDisplay", `${num(d.onTimePercentage)}%`);
  }

  /* ======================= BAN BUTTON ======================= */
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
          wireDocumentModal();
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
