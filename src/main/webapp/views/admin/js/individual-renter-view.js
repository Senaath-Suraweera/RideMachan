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

  // ---------------- API helpers ----------------
  async function apiJson(url, method = "GET", bodyObj) {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (bodyObj !== undefined) opts.body = JSON.stringify(bodyObj);

    const res = await fetch(url, opts);

    // Try to parse JSON even on errors, because backend returns JSON errors
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(
        payload.error || payload.message || `Request failed (${res.status})`,
      );
    }

    return payload;
  }

  async function loadProvider() {
    // Provider details
    const providerResp = await apiJson(`${API}/${providerId}`);
    provider = providerResp.data || providerResp;

    // Vehicles for this provider
    try {
      const vehiclesResp = await apiJson(`${API}/${providerId}/vehicles`);
      vehicles = Array.isArray(vehiclesResp)
        ? vehiclesResp
        : Array.isArray(vehiclesResp.data)
          ? vehiclesResp.data
          : [];
    } catch (e) {
      console.warn("Failed to load vehicles:", e);
      vehicles = [];
    }

    renderAll();
  }

  // ---------------- UI helpers ----------------
  function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString();
    } catch {
      return dateStr;
    }
  }

  function renderProfile() {
    const root = $("#renterProfile");
    if (!root || !provider) return;

    // Backend returns: { id, name, email, phone, location, status, joinDate }
    const fullName = provider.name || provider.username || "—";
    const location = provider.location || provider.city || "—";
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

    // Toggle Ban/Unban label
    const banBtn = $("#banUserBtn");
    if (banBtn)
      banBtn.textContent = status === "suspended" ? "Unban User" : "Ban User";
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
      card.dataset.vehicleId = v.vehicleid || v.id;

      // Backend returns: { id, make, model, regNo, seats, pricePerDay, rentalCompany }
      const make = v.make || v.vehiclebrand || "—";
      const model = v.model || v.vehiclemodel || "—";
      const regNo = v.regNo || v.numberplatenumber || "—";
      const seats = v.seats ?? v.numberofpassengers ?? "—";
      const pricePerDay = v.pricePerDay ?? v.daily_rate ?? 0;

      const companyName = v.rentalCompany || v.companyName || "Not assigned";

      card.innerHTML = `
        <h4>${esc(make)} ${esc(model)}</h4>
        <div class="vehicle-meta">
          <span>Reg: ${esc(regNo)}</span>
          <span>Seats: ${esc(seats)}</span>
          <span>Price/Day: Rs. ${Number(pricePerDay || 0).toLocaleString()}</span>
          <span>Rented under: <strong>${esc(companyName)}</strong></span>
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

  // ---------------- Modals ----------------
  function openVehicleModal(v) {
    const modal = $("#vehicleModal");
    const body = $("#vehicleModalBody");
    if (!modal || !body) return;

    const make = v.make || v.vehiclebrand || "—";
    const model = v.model || v.vehiclemodel || "—";
    const regNo = v.regNo || v.numberplatenumber || "—";
    const seats = v.seats ?? v.numberofpassengers ?? "—";
    const pricePerDay = v.pricePerDay ?? v.daily_rate ?? 0;

    const companyName = v.rentalCompany || v.companyName || "Not assigned";

    body.innerHTML = `
      <div style="display:grid;gap:10px;">
        <div><strong>Make:</strong> ${esc(make)}</div>
        <div><strong>Model:</strong> ${esc(model)}</div>
        <div><strong>Reg No:</strong> ${esc(regNo)}</div>
        <div><strong>Seats:</strong> ${esc(seats)}</div>
        <div><strong>Price per day:</strong> Rs. ${Number(pricePerDay || 0).toLocaleString()}</div>
        <div><strong>Rental Company:</strong> ${esc(companyName)}</div>
      </div>
    `;

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  window.closeVehicleModal = function () {
    const modal = $("#vehicleModal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  };

  function openVehicleForm(vOrNull) {
    const modal = $("#vehicleFormModal");
    const title = $("#vehicleFormTitle");
    const btn = $("#vehicleFormSubmitBtn");
    const form = $("#vehicleForm");
    if (!modal || !title || !btn || !form) return;

    const isEdit = !!vOrNull;
    editVehicleId = isEdit ? Number(vOrNull.vehicleid || vOrNull.id) : null;
    title.textContent = isEdit ? "Edit Vehicle" : "Add Vehicle";

    if (isEdit) {
      $("#vf_make").value = vOrNull.make || vOrNull.vehiclebrand || "";
      $("#vf_model").value = vOrNull.model || vOrNull.vehiclemodel || "";
      $("#vf_reg").value = vOrNull.regNo || vOrNull.numberplatenumber || "";
      $("#vf_seats").value = vOrNull.seats ?? vOrNull.numberofpassengers ?? "";
      $("#vf_rate").value = vOrNull.pricePerDay ?? vOrNull.daily_rate ?? "";

      // company id is NOT returned by backend in current vehicles list.
      // Keep it blank unless your backend includes it.
      const companyIdEl = $("#vf_companyId");
      if (companyIdEl)
        companyIdEl.value = vOrNull.companyId || vOrNull.company_id || "";
    } else {
      form.reset();
      const companyIdEl = $("#vf_companyId");
      if (companyIdEl) companyIdEl.value = "";
    }

    btn.onclick = async () => {
      try {
        await submitVehicleForm();
        closeVehicleForm();
        await loadProvider();
      } catch (e) {
        console.error(e);
        alert(e.message);
      }
    };

    modal.classList.add("show");
    modal.setAttribute("aria-hidden", "false");
  }

  window.closeVehicleForm = function () {
    const modal = $("#vehicleFormModal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden", "true");
  };

  async function submitVehicleForm() {
    const make = $("#vf_make").value.trim();
    const model = $("#vf_model").value.trim();
    const regNo = $("#vf_reg").value.trim();
    const seats = Number($("#vf_seats").value);
    const pricePerDay = Number($("#vf_rate").value);

    const companyIdRaw = ($("#vf_companyId")?.value || "").trim();
    const companyId = companyIdRaw ? Number(companyIdRaw) : null;

    if (
      !make ||
      !model ||
      !regNo ||
      !Number.isFinite(seats) ||
      seats <= 0 ||
      !Number.isFinite(pricePerDay)
    ) {
      throw new Error("Please fill all required fields correctly.");
    }

    // ✅ MUST match servlet expected keys:
    const payload = { make, model, regNo, seats, pricePerDay, companyId };

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

  // ---------------- Ban / Unban User ----------------
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

  // ---------------- events ----------------
  function bind() {
    $("#backToRentersBtn")?.addEventListener("click", () => {
      window.location.href = "individual-renters.html";
    });

    $("#banUserBtn")?.addEventListener("click", banUser);

    $("#addVehicleBtn")?.addEventListener("click", () => openVehicleForm(null));

    document.addEventListener("click", async (e) => {
      const card = e.target.closest(".vehicle-card");
      if (!card) return;

      const id = Number(card.dataset.vehicleId);
      const v = vehicles.find((x) => Number(x.vehicleid || x.id) === id);
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

  // ---------------- init ----------------
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
