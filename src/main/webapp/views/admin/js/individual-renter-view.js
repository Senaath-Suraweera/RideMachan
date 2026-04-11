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
          <div class="status-badge ${status === "pending" ? "status-pending" : ""}">
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

  function renderVehicles() {
    const grid = $("#vehiclesGrid");
    if (!grid) return;

    if (!vehicles.length) {
      grid.innerHTML = `<div style="padding:12px;color:#6b7280;">No vehicles listed for this provider.</div>`;
      return;
    }

    grid.innerHTML = "";

    vehicles.forEach((v) => {
      const card = document.createElement("div");
      card.className = "vehicle-card";
      card.dataset.vehicleId = v.id;

      card.innerHTML = `
        <h4>${esc(v.make || "—")} ${esc(v.model || "—")}</h4>
        <div class="vehicle-meta">
          <span>Reg: ${esc(v.regNo || "—")}</span>
          <span>Seats: ${esc(v.seats ?? "—")}</span>
          <span>Price/Day: Rs. ${Number(v.pricePerDay || 0).toLocaleString()}</span>
          <span>Fuel: ${esc(v.fuelType || "—")}</span>
          <span>Transmission: ${esc(v.transmission || "—")}</span>
          <span>Status: ${esc(v.availabilityStatus || "—")}</span>
          <span>Rented under: <strong>${esc(v.rentalCompany || "Not assigned")}</strong></span>
        </div>
        <div class="vehicle-actions">
          <button class="btn btn-secondary" data-action="view">View</button>
          <button class="btn btn-primary" data-action="edit">Edit</button>
          <button class="btn btn-danger" data-action="delete">Delete</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function renderAll() {
    renderProfile();
    renderVehicles();
  }

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

  function openVehicleModal(v) {
    const body = $("#vehicleModalBody");

    body.innerHTML = `
      <div style="display:grid;gap:10px;">
        <div><strong>Make:</strong> ${esc(v.make || "—")}</div>
        <div><strong>Model:</strong> ${esc(v.model || "—")}</div>
        <div><strong>Registration No:</strong> ${esc(v.regNo || "—")}</div>
        <div><strong>Year:</strong> ${esc(v.manufactureYear || "—")}</div>
        <div><strong>Color:</strong> ${esc(v.color || "—")}</div>
        <div><strong>Seats:</strong> ${esc(v.seats ?? "—")}</div>
        <div><strong>Engine Capacity:</strong> ${esc(v.engineCapacity || "—")}</div>
        <div><strong>Engine Number:</strong> ${esc(v.engineNumber || "—")}</div>
        <div><strong>Chassis Number:</strong> ${esc(v.chasisNumber || "—")}</div>
        <div><strong>Mileage:</strong> ${esc(v.milage || "—")}</div>
        <div><strong>Price per day:</strong> Rs. ${Number(v.pricePerDay || 0).toLocaleString()}</div>
        <div><strong>Location:</strong> ${esc(v.location || "—")}</div>
        <div><strong>Fuel Type:</strong> ${esc(v.fuelType || "—")}</div>
        <div><strong>Transmission:</strong> ${esc(v.transmission || "—")}</div>
        <div><strong>Availability:</strong> ${esc(v.availabilityStatus || "—")}</div>
        <div><strong>Description:</strong> ${esc(v.description || "—")}</div>
        <div><strong>Rental Company:</strong> ${esc(v.rentalCompany || "Not assigned")}</div>
      </div>
    `;

    $("#vehicleModal").classList.add("show");
    $("#vehicleModal").setAttribute("aria-hidden", "false");
  }

  window.closeVehicleModal = function () {
    $("#vehicleModal").classList.remove("show");
    $("#vehicleModal").setAttribute("aria-hidden", "true");
  };

  function openVehicleForm(vOrNull) {
    const isEdit = !!vOrNull;
    editVehicleId = isEdit ? Number(vOrNull.id) : null;

    $("#vehicleFormTitle").textContent = isEdit
      ? "Edit Vehicle"
      : "Add Vehicle";

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
    } else {
      $("#vehicleForm").reset();
      $("#vf_availability").value = "available";
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

    const payload = {
      make: $("#vf_make").value.trim(),
      model: $("#vf_model").value.trim(),
      regNo: $("#vf_reg").value.trim(),
      manufactureYear: $("#vf_year").value ? Number($("#vf_year").value) : null,
      color: $("#vf_color").value.trim(),
      seats: $("#vf_seats").value ? Number($("#vf_seats").value) : null,
      engineCapacity: $("#vf_enginecapacity").value
        ? Number($("#vf_enginecapacity").value)
        : null,
      engineNumber: $("#vf_engineno").value.trim(),
      chasisNumber: $("#vf_chasisno").value.trim(),
      milage: $("#vf_milage").value.trim(),
      pricePerDay: $("#vf_rate").value ? Number($("#vf_rate").value) : null,
      location: $("#vf_location").value.trim(),
      fuelType: $("#vf_fuel").value,
      transmission: $("#vf_trans").value,
      availabilityStatus: $("#vf_availability").value,
      companyId: companyIdRaw ? Number(companyIdRaw) : null,
      description: $("#vf_description").value.trim(),
    };

    if (
      !payload.make ||
      !payload.model ||
      !payload.regNo ||
      !Number.isFinite(payload.seats) ||
      !Number.isFinite(payload.pricePerDay)
    ) {
      throw new Error("Please fill all required vehicle fields.");
    }

    if (!editVehicleId) {
      await apiJson(`${API}/${providerId}/vehicles`, "POST", payload);
    } else {
      await apiJson(
        `${API}/${providerId}/vehicles/${editVehicleId}`,
        "PUT",
        payload,
      );
    }
  }

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
  }

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
