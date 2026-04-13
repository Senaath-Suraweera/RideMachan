(function () {
  const API_BASE = "http://localhost:8080";
  const API = `${API_BASE}/api/admin/vehicle-providers`;

  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const q = new URLSearchParams(location.search);
  const providerId = Number(q.get("id"));

  let provider = null;
  let vehicles = [];
  let editVehicleId = null;

  // Track selected files for upload
  let selectedRegDoc = null;
  let selectedVehicleImages = [];

  async function apiJson(url, method = "GET", bodyObj) {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (bodyObj !== undefined) opts.body = JSON.stringify(bodyObj);

    const res = await fetch(url, opts);
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        payload.error || payload.message || `Request failed (${res.status})`,
      );
    }
    return payload;
  }

  async function apiMultipart(url, method, formData) {
    const res = await fetch(url, { method, body: formData });
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        payload.error || payload.message || `Request failed (${res.status})`,
      );
    }
    return payload;
  }

  async function loadProvider() {
    const providerResp = await apiJson(`${API}/${providerId}`);
    provider = providerResp.data || providerResp;

    const vehiclesResp = await apiJson(`${API}/${providerId}/vehicles`);
    vehicles = Array.isArray(vehiclesResp.data) ? vehiclesResp.data : [];

    renderAll();
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  }

  // ─── Profile Rendering ────────────────────────────────────
  function renderProfile() {
    const root = $("#renterProfile");
    if (!root || !provider) return;

    const fullName =
      `${provider.firstname || ""} ${provider.lastname || ""}`.trim() ||
      provider.name ||
      provider.username ||
      "—";

    const location =
      [provider.housenumber, provider.street, provider.city, provider.zipcode]
        .filter(Boolean)
        .join(", ") ||
      provider.location ||
      provider.city ||
      "—";

    const joinDate = formatDate(provider.joinDate || provider.created_at);
    const phone = provider.phone || provider.phonenumber || "—";
    const email = provider.email || "—";
    const status = String(provider.status || "pending").toLowerCase();
    const initial = (fullName.trim()[0] || "?").toUpperCase();

    root.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar">
          <span>${esc(initial)}</span>
        </div>
        <div class="profile-basic">
          <h2>${esc(fullName)}</h2>
          <div class="profile-meta">
            <span>📍 ${esc(location)}</span>
            <span>🗓️ Joined: ${esc(joinDate)}</span>
          </div>
          <div class="profile-desc" style="color:#6b7280;">
            Vehicle Provider (Individual Renter)
          </div>
        </div>
        <div class="profile-contact">
          <div>📞 ${esc(phone)}</div>
          <div>📧 ${esc(email)}</div>
          <div class="status-badge ${status === "pending" ? "status-pending" : status === "suspended" ? "status-suspended" : ""}">
            ${esc(status.toUpperCase())}
          </div>
        </div>
      </div>
    `;

    const banBtn = $("#banUserBtn");
    if (banBtn) {
      banBtn.textContent = status === "suspended" ? "Unban User" : "Ban User";
    }
  }

  // ─── Vehicle Cards ────────────────────────────────────────
  function renderVehicles() {
    const grid = $("#vehiclesGrid");
    if (!grid) return;

    if (!vehicles.length) {
      grid.innerHTML = `<div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="1.5">
          <rect x="1" y="3" width="15" height="13" rx="2"/>
          <polygon points="16 8 20 12 20 16 16 16 16 8"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
        <p>No vehicles listed for this provider.</p>
      </div>`;
      return;
    }

    grid.innerHTML = "";

    vehicles.forEach((v) => {
      const card = document.createElement("div");
      card.className = "vehicle-card";
      card.dataset.vehicleId = v.id;

      const availability = (v.availabilityStatus || "unknown").toLowerCase();
      let statusClass = "status-available";
      if (availability === "unavailable") statusClass = "status-unavailable";
      else if (availability === "maintenance")
        statusClass = "status-maintenance";

      // Build thumbnail from vehicle image if available
      const thumbSrc = v.hasImages
        ? `${API}/${providerId}/vehicles/${v.id}/image`
        : null;

      card.innerHTML = `
        <div class="vehicle-card-header">
          ${
            thumbSrc
              ? `<div class="vehicle-thumb"><img src="${thumbSrc}" alt="${esc(v.make)} ${esc(v.model)}" onerror="this.parentElement.innerHTML='<div class=\\'vehicle-thumb-placeholder\\'>${esc((v.make || "?")[0])}</div>'"/></div>`
              : `<div class="vehicle-thumb"><div class="vehicle-thumb-placeholder">${esc((v.make || "?")[0])}</div></div>`
          }
          <div class="vehicle-card-title">
            <h4>${esc(v.make || "—")} ${esc(v.model || "—")}</h4>
            <span class="vehicle-year">${esc(v.manufactureYear || "—")}</span>
          </div>
          <span class="availability-badge ${statusClass}">${esc(availability)}</span>
        </div>
        <div class="vehicle-card-body">
          <div class="vehicle-spec-grid">
            <div class="spec-item">
              <span class="spec-label">Reg. No</span>
              <span class="spec-value">${esc(v.regNo || "—")}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Seats</span>
              <span class="spec-value">${esc(v.seats ?? "—")}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Price/Day</span>
              <span class="spec-value price">Rs. ${Number(v.pricePerDay || 0).toLocaleString()}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Fuel</span>
              <span class="spec-value">${esc(v.fuelType || "—")}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Transmission</span>
              <span class="spec-value">${esc(v.transmission || "—")}</span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Company</span>
              <span class="spec-value">${esc(v.rentalCompany || "Not assigned")}</span>
            </div>
          </div>
        </div>
        <div class="vehicle-card-footer">
          <button class="btn btn-sm btn-secondary" data-action="view">View Details</button>
          <button class="btn btn-sm btn-primary" data-action="edit">Edit</button>
          <button class="btn btn-sm btn-danger" data-action="delete">Delete</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function renderAll() {
    renderProfile();
    renderVehicles();
  }

  // ─── Profile Form ─────────────────────────────────────────
  function openProfileForm() {
    if (!provider) return;

    $("#pf_firstname").value = provider.firstname || "";
    $("#pf_lastname").value = provider.lastname || "";
    $("#pf_email").value = provider.email || "";
    $("#pf_phone").value = provider.phone || provider.phonenumber || "";
    $("#pf_house").value = provider.housenumber || "";
    $("#pf_street").value = provider.street || "";
    $("#pf_city").value = provider.city || provider.location || "";
    $("#pf_zipcode").value = provider.zipcode || "";
    $("#pf_companyId").value = provider.companyId || provider.company_id || "";
    $("#pf_status").value = provider.status || "active";

    $("#profileFormSubmitBtn").onclick = async () => {
      try {
        await submitProfileForm();
        closeProfileForm();
        await loadProvider();
        alert("Provider profile updated successfully.");
      } catch (e) {
        console.error(e);
        alert(e.message);
      }
    };

    $("#profileFormModal").classList.add("show");
    $("#profileFormModal").setAttribute("aria-hidden", "false");
  }

  async function submitProfileForm() {
    const companyIdRaw = $("#pf_companyId").value.trim();

    const payload = {
      firstname: $("#pf_firstname").value.trim(),
      lastname: $("#pf_lastname").value.trim(),
      email: $("#pf_email").value.trim(),
      phone: $("#pf_phone").value.trim(),
      housenumber: $("#pf_house").value.trim(),
      street: $("#pf_street").value.trim(),
      city: $("#pf_city").value.trim(),
      zipcode: $("#pf_zipcode").value.trim(),
      companyId: companyIdRaw ? Number(companyIdRaw) : null,
      status: $("#pf_status").value,
    };

    await apiJson(`${API}/${providerId}`, "PUT", payload);
  }

  window.closeProfileForm = function () {
    const modal = $("#profileFormModal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  };

  // ─── Vehicle Details Modal (Professional) ─────────────────
  function openVehicleModal(v) {
    const body = $("#vehicleModalBody");
    const title = $("#vehicleModalTitle");
    title.textContent = `${v.make || "—"} ${v.model || "—"} — Details`;

    const availability = (v.availabilityStatus || "unknown").toLowerCase();
    let statusClass = "status-available";
    if (availability === "unavailable") statusClass = "status-unavailable";
    else if (availability === "maintenance") statusClass = "status-maintenance";

    // Build image URLs
    const regDocUrl = v.hasRegDoc
      ? `${API}/${providerId}/vehicles/${v.id}/regdoc`
      : null;
    const vehicleImageUrl = v.hasImages
      ? `${API}/${providerId}/vehicles/${v.id}/image`
      : null;

    body.innerHTML = `
      <div class="detail-layout">
        <!-- Vehicle Images Section -->
        <div class="detail-images-section">
          ${
            vehicleImageUrl
              ? `<div class="detail-main-image">
                <img src="${vehicleImageUrl}" alt="${esc(v.make)} ${esc(v.model)}"
                     onclick="openLightbox(this.src)"
                     onerror="this.parentElement.innerHTML='<div class=\\'no-image-placeholder\\'>No Vehicle Image</div>'" />
                <span class="click-hint">Click to enlarge</span>
              </div>`
              : `<div class="detail-main-image"><div class="no-image-placeholder">No Vehicle Image Available</div></div>`
          }
        </div>

        <!-- Vehicle Info Section -->
        <div class="detail-info-section">
          <div class="detail-title-row">
            <div>
              <h2 class="detail-vehicle-name">${esc(v.make || "")} ${esc(v.model || "")}</h2>
              <p class="detail-vehicle-year">${esc(v.manufactureYear || "—")} · ${esc(v.color || "—")}</p>
            </div>
            <span class="availability-badge ${statusClass}">${esc(availability)}</span>
          </div>

          <div class="detail-price">
            <span class="price-amount">Rs. ${Number(v.pricePerDay || 0).toLocaleString()}</span>
            <span class="price-unit">/ day</span>
          </div>

          <div class="detail-specs">
            <div class="detail-spec-group">
              <h4>Identification</h4>
              <div class="spec-row"><span>Registration No.</span><strong>${esc(v.regNo || "—")}</strong></div>
              <div class="spec-row"><span>Engine Number</span><strong>${esc(v.engineNumber || "—")}</strong></div>
              <div class="spec-row"><span>Chassis Number</span><strong>${esc(v.chasisNumber || "—")}</strong></div>
            </div>

            <div class="detail-spec-group">
              <h4>Specifications</h4>
              <div class="spec-row"><span>Seats</span><strong>${esc(v.seats ?? "—")}</strong></div>
              <div class="spec-row"><span>Engine Capacity</span><strong>${esc(v.engineCapacity || "—")} cc</strong></div>
              <div class="spec-row"><span>Fuel Type</span><strong>${esc(v.fuelType || "—")}</strong></div>
              <div class="spec-row"><span>Transmission</span><strong>${esc(v.transmission || "—")}</strong></div>
              <div class="spec-row"><span>Mileage</span><strong>${esc(v.milage || "—")}</strong></div>
            </div>

            <div class="detail-spec-group">
              <h4>Location &amp; Company</h4>
              <div class="spec-row"><span>Location</span><strong>${esc(v.location || "—")}</strong></div>
              <div class="spec-row"><span>Rental Company</span><strong>${esc(v.rentalCompany || "Not assigned")}</strong></div>
            </div>
          </div>

          ${
            v.description
              ? `
          <div class="detail-description">
            <h4>Description</h4>
            <p>${esc(v.description)}</p>
          </div>`
              : ""
          }
        </div>
      </div>

      <!-- Registration Documentation Section -->
      <div class="detail-documents-section">
        <h4>Registration Documentation</h4>
        ${
          regDocUrl
            ? `<div class="doc-preview">
              <img src="${regDocUrl}" alt="Registration Document"
                   onclick="openLightbox(this.src)"
                   onerror="this.parentElement.innerHTML='<div class=\\'no-doc-placeholder\\'>Document could not be loaded (may be PDF format)</div>'" />
              <span class="click-hint">Click to enlarge</span>
            </div>`
            : `<div class="no-doc-placeholder">No registration documentation uploaded</div>`
        }
      </div>
    `;

    $("#vehicleModal").classList.add("show");
    $("#vehicleModal").setAttribute("aria-hidden", "false");
  }

  window.closeVehicleModal = function () {
    $("#vehicleModal").classList.remove("show");
    $("#vehicleModal").setAttribute("aria-hidden", "true");
  };

  // ─── Image Lightbox ───────────────────────────────────────
  window.openLightbox = function (src) {
    const lb = $("#imageLightbox");
    const img = $("#lightboxImage");
    img.src = src;
    lb.classList.add("active");
  };

  window.closeLightbox = function () {
    const lb = $("#imageLightbox");
    lb.classList.remove("active");
    $("#lightboxImage").src = "";
  };

  // ─── File Upload Handlers ────────────────────────────────
  window.handleRegDocSelect = function (input) {
    if (!input.files || !input.files[0]) return;
    selectedRegDoc = input.files[0];

    const preview = $("#regDocPreview");
    const placeholder = $("#regDocPlaceholder");
    const img = $("#regDocPreviewImg");
    const filename = $("#regDocFilename");

    filename.textContent = selectedRegDoc.name;

    if (selectedRegDoc.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target.result;
        img.style.display = "block";
      };
      reader.readAsDataURL(selectedRegDoc);
    } else {
      // PDF or other
      img.style.display = "none";
    }

    placeholder.style.display = "none";
    preview.style.display = "flex";
  };

  window.clearRegDoc = function () {
    selectedRegDoc = null;
    $("#vf_regDoc").value = "";
    $("#regDocPreview").style.display = "none";
    $("#regDocPlaceholder").style.display = "flex";
    $("#regDocPreviewImg").src = "";
  };

  window.handleVehicleImgSelect = function (input) {
    if (!input.files || !input.files.length) return;
    selectedVehicleImages = Array.from(input.files);

    const previewGrid = $("#vehicleImgPreview");
    const placeholder = $("#vehicleImgPlaceholder");

    previewGrid.innerHTML = "";

    selectedVehicleImages.forEach((file, idx) => {
      const item = document.createElement("div");
      item.className = "upload-preview-item";

      const reader = new FileReader();
      reader.onload = (e) => {
        item.innerHTML = `
          <img src="${e.target.result}" alt="Vehicle image ${idx + 1}" />
          <button type="button" class="remove-img-btn" onclick="removeVehicleImg(${idx})">×</button>
          <span class="img-filename">${esc(file.name)}</span>
        `;
      };
      reader.readAsDataURL(file);
      previewGrid.appendChild(item);
    });

    placeholder.style.display = selectedVehicleImages.length ? "none" : "flex";

    // Add "Add More" button
    if (selectedVehicleImages.length > 0) {
      const addMore = document.createElement("div");
      addMore.className = "upload-preview-item add-more-item";
      addMore.innerHTML = `<span>+ Add More</span>`;
      addMore.onclick = () => document.getElementById("vf_vehicleImg").click();
      previewGrid.appendChild(addMore);
    }
  };

  window.removeVehicleImg = function (idx) {
    selectedVehicleImages.splice(idx, 1);

    // Re-render preview
    const fakeInput = { files: selectedVehicleImages };
    if (selectedVehicleImages.length === 0) {
      $("#vehicleImgPreview").innerHTML = "";
      $("#vehicleImgPlaceholder").style.display = "flex";
    } else {
      handleVehicleImgSelect(fakeInput);
    }
  };

  // ─── Vehicle Form ─────────────────────────────────────────
  function setVehicleFormMode(isEdit) {
    const readonlyInputIds = [
      "vf_make",
      "vf_model",
      "vf_reg",
      "vf_year",
      "vf_color",
      "vf_enginecapacity",
      "vf_engineno",
      "vf_chasisno",
    ];
    const disabledSelectIds = ["vf_fuel", "vf_trans"];

    readonlyInputIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.readOnly = isEdit;
    });
    disabledSelectIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.disabled = isEdit;
    });
  }

  function openVehicleForm(vOrNull) {
    const isEdit = !!vOrNull;
    editVehicleId = isEdit ? Number(vOrNull.id) : null;

    // Reset file selections
    selectedRegDoc = null;
    selectedVehicleImages = [];
    clearRegDoc();
    $("#vehicleImgPreview").innerHTML = "";
    $("#vehicleImgPlaceholder").style.display = "flex";
    $("#vf_vehicleImg").value = "";

    $("#vehicleFormTitle").textContent = isEdit
      ? "Edit Vehicle"
      : "Add Vehicle";
    setVehicleFormMode(isEdit);

    if (isEdit) {
      $("#vf_make").value = vOrNull.make || "";
      $("#vf_model").value = vOrNull.model || "";
      $("#vf_reg").value = vOrNull.regNo || "";
      $("#vf_year").value = vOrNull.manufactureYear || "";
      $("#vf_color").value = vOrNull.color || "";
      $("#vf_seats").value = vOrNull.seats ?? "";
      $("#vf_enginecapacity").value = vOrNull.engineCapacity || "";
      $("#vf_engineno").value = vOrNull.engineNumber || "";
      $("#vf_chasisno").value = vOrNull.chasisNumber || "";
      $("#vf_milage").value = vOrNull.milage || "";
      $("#vf_rate").value = vOrNull.pricePerDay ?? "";
      $("#vf_location").value = vOrNull.location || "";
      $("#vf_fuel").value = vOrNull.fuelType || "";
      $("#vf_trans").value = vOrNull.transmission || "";
      $("#vf_availability").value = vOrNull.availabilityStatus || "available";
      $("#vf_companyId").value = vOrNull.companyId || "";
      $("#vf_description").value = vOrNull.description || "";

      // Show existing reg doc as read-only in edit mode
      const regDocZone = $("#regDocZone");
      if (regDocZone) regDocZone.classList.add("upload-disabled");
      if (vOrNull.hasRegDoc) {
        const preview = $("#regDocPreview");
        const placeholder = $("#regDocPlaceholder");
        const img = $("#regDocPreviewImg");
        const filename = $("#regDocFilename");
        img.src = `${API}/${providerId}/vehicles/${vOrNull.id}/regdoc`;
        img.style.display = "block";
        filename.textContent = "Registration document (read-only)";
        placeholder.style.display = "none";
        preview.style.display = "flex";
        // Hide the remove button for reg doc in edit mode
        const removeBtn = preview.querySelector(".btn-danger");
        if (removeBtn) removeBtn.style.display = "none";
      } else {
        // No existing doc — hide the upload placeholder too
        $("#regDocPlaceholder").style.display = "none";
      }

      if (vOrNull.hasImages) {
        const previewGrid = $("#vehicleImgPreview");
        const placeholder = $("#vehicleImgPlaceholder");
        previewGrid.innerHTML = `
          <div class="upload-preview-item existing-img">
            <img src="${API}/${providerId}/vehicles/${vOrNull.id}/image" alt="Existing vehicle image"
                 onerror="this.parentElement.style.display='none'" />
            <span class="img-filename">Current image</span>
          </div>
          <div class="upload-preview-item add-more-item" id="replaceImgBtn">
            <span>Replace Image</span>
          </div>
        `;
        placeholder.style.display = "none";
        // Bind replace button
        $("#replaceImgBtn").onclick = () =>
          document.getElementById("vf_vehicleImg").click();
      }
    } else {
      $("#vehicleForm").reset();
      const regDocZone = $("#regDocZone");
      if (regDocZone) regDocZone.classList.remove("upload-disabled");
      $("#vf_availability").value = "available";
      $("#vf_companyId").value =
        provider?.companyId || provider?.company_id || "";
    }

    $("#vehicleFormSubmitBtn").onclick = async () => {
      try {
        await submitVehicleForm();
        closeVehicleForm();
        await loadProvider();
        alert(
          isEdit
            ? "Vehicle updated successfully."
            : "Vehicle added successfully.",
        );
      } catch (e) {
        console.error(e);
        alert(e.message);
      }
    };

    $("#vehicleFormModal").classList.add("show");
    $("#vehicleFormModal").setAttribute("aria-hidden", "false");
  }

  window.closeVehicleForm = function () {
    $("#vehicleFormModal").classList.remove("show");
    $("#vehicleFormModal").setAttribute("aria-hidden", "true");
  };

  async function submitVehicleForm() {
    const companyIdRaw = $("#vf_companyId").value.trim();

    // Validate required fields
    const make = $("#vf_make").value.trim();
    const model = $("#vf_model").value.trim();
    const regNo = $("#vf_reg").value.trim();
    const seats = $("#vf_seats").value ? Number($("#vf_seats").value) : null;
    const pricePerDay = $("#vf_rate").value
      ? Number($("#vf_rate").value)
      : null;

    if (
      !make ||
      !model ||
      !regNo ||
      !Number.isFinite(seats) ||
      !Number.isFinite(pricePerDay)
    ) {
      throw new Error("Please fill all required vehicle fields.");
    }

    // Use FormData for multipart upload
    const fd = new FormData();
    fd.append("make", make);
    fd.append("model", model);
    fd.append("regNo", regNo);
    fd.append("manufactureYear", $("#vf_year").value || "");
    fd.append("color", $("#vf_color").value.trim());
    fd.append("seats", seats);
    fd.append("engineCapacity", $("#vf_enginecapacity").value || "0");
    fd.append("engineNumber", $("#vf_engineno").value.trim());
    fd.append("chasisNumber", $("#vf_chasisno").value.trim());
    fd.append("milage", $("#vf_milage").value.trim());
    fd.append("pricePerDay", pricePerDay);
    fd.append("location", $("#vf_location").value.trim());
    fd.append("fuelType", $("#vf_fuel").value);
    fd.append("transmission", $("#vf_trans").value);
    fd.append("availabilityStatus", $("#vf_availability").value);
    fd.append("companyId", companyIdRaw || "");
    fd.append("description", $("#vf_description").value.trim());

    // Attach files
    if (selectedRegDoc) {
      fd.append("registrationDoc", selectedRegDoc);
    }
    if (selectedVehicleImages.length > 0) {
      selectedVehicleImages.forEach((file) => {
        fd.append("vehicleImages", file);
      });
    }

    if (!editVehicleId) {
      await apiMultipart(`${API}/${providerId}/vehicles`, "POST", fd);
    } else {
      await apiMultipart(
        `${API}/${providerId}/vehicles/${editVehicleId}`,
        "PUT",
        fd,
      );
    }
  }

  // ─── Ban / Unban ──────────────────────────────────────────
  async function banUser() {
    const status = String(provider?.status || "pending").toLowerCase();
    const isSuspended = status === "suspended";
    const action = isSuspended ? "unban" : "ban";
    const verb = isSuspended ? "unban" : "ban";

    if (!confirm(`Are you sure you want to ${verb} this provider?`)) return;

    try {
      await apiJson(`${API}/${providerId}/${action}`, "PUT");
      alert(`Provider has been ${isSuspended ? "unbanned" : "banned"}.`);
      await loadProvider();
    } catch (e) {
      console.error(e);
      alert(`Failed to ${verb} provider: ${e.message}`);
    }
  }

  // ─── Event Binding ────────────────────────────────────────
  function bind() {
    $("#backToRentersBtn")?.addEventListener("click", () => {
      window.location.href = "individual-renters.html";
    });

    $("#editProfileBtn")?.addEventListener("click", openProfileForm);
    $("#banUserBtn")?.addEventListener("click", banUser);
    $("#addVehicleBtn")?.addEventListener("click", () => openVehicleForm(null));

    document.addEventListener("click", async (e) => {
      const card = e.target.closest(".vehicle-card");
      if (!card) return;

      const id = Number(card.dataset.vehicleId);
      const v = vehicles.find((x) => Number(x.id) === id);
      if (!v) return;

      const action = e.target.getAttribute("data-action");

      if (action === "view") openVehicleModal(v);
      if (action === "edit") openVehicleForm(v);

      if (action === "delete") {
        if (!confirm("Delete this vehicle?")) return;
        try {
          await apiJson(`${API}/${providerId}/vehicles/${id}`, "DELETE");
          await loadProvider();
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      }
    });

    // Close lightbox on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeLightbox();
      }
    });
  }

  // ─── Init ─────────────────────────────────────────────────
  (async function init() {
    if (!providerId) {
      alert("Missing provider id in URL");
      return;
    }

    bind();

    try {
      await loadProvider();
    } catch (e) {
      console.error(e);
      alert(`Failed to load provider: ${e.message}`);
    }
  })();
})();
