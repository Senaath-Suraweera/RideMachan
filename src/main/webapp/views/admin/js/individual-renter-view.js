(function () {
  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  const q = new URLSearchParams(location.search);
  const id = Number(q.get("id"));

  // ---------- Storage helpers ----------
  const KEY = (id) => `renter_${id}`;
  function loadRenter(id) {
    // 1) sessionStorage selection (from list page)
    try {
      const raw = sessionStorage.getItem("selectedRenter");
      const fromSession = raw ? JSON.parse(raw) : null;
      if (fromSession && Number(fromSession.id) === id) return fromSession;
    } catch {}
    // 2) localStorage persisted copy
    try {
      const raw = localStorage.getItem(KEY(id));
      if (raw) return JSON.parse(raw);
    } catch {}
    // 3) fallback stub (ensures page works directly)
    return {
      id,
      name: "Unknown Renter",
      location: "—",
      phone: "—",
      email: "—",
      rating: 0,
      reviews: 0,
      status: "pending",
      description: "Renter details not found in session; using fallback.",
      vehicles: [],
    };
  }
  function saveRenter(r) {
    try {
      sessionStorage.setItem("selectedRenter", JSON.stringify(r));
    } catch {}
    try {
      localStorage.setItem(KEY(r.id), JSON.stringify(r));
    } catch {}
  }

  // ---------- State ----------
  let renter = null;
  let editVehicleId = null; // null => add, else edit that id

  // ---------- UI render ----------
  function initials(n) {
    return String(n)
      .trim()
      .split(/\s+/)
      .map((p) => p[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function renderProfile(r) {
    const root = $("#renterProfile");
    if (!root) return;
    root.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar"><span>${esc(
          initials(r.name || "")
        )}</span></div>
        <div class="profile-basic">
          <h2>${esc(r.name || "—")}</h2>
          <div class="profile-meta">
            <span>📍 ${esc(r.location || "—")}</span>
            <span>⭐ ${(Number(r.rating) || 0).toFixed(1)} (${
      Number(r.reviews) || 0
    } reviews)</span>
          </div>
          <div class="profile-desc">${esc(r.description || "")}</div>
        </div>
        <div class="profile-contact">
          <div>📞 ${esc(r.phone || "—")}</div>
          <div>📧 ${esc(r.email || "—")}</div>
          <div class="status-badge ${
            r.status === "pending" ? "status-pending" : ""
          }">${esc(String(r.status || "—").toUpperCase())}</div>
        </div>
      </div>
    `;
  }

  function renderVehicles(r) {
    const grid = $("#vehiclesGrid");
    if (!grid) return;
    const list = Array.isArray(r.vehicles) ? r.vehicles : [];
    if (!list.length) {
      grid.innerHTML = `<div style="padding:12px;color:#6b7280;">No vehicles listed for this renter.</div>`;
      return;
    }
    grid.innerHTML = "";
    list.forEach((v) => {
      const card = document.createElement("div");
      card.className = "vehicle-card";
      card.innerHTML = `
        <h4>${esc(v.make)} ${esc(v.model)} • ${esc(v.year)}</h4>
        <div class="vehicle-meta">
          <span>Reg: ${esc(v.regNo)}</span>
          <span>Seats: ${esc(v.seats)}</span>
          <span>Fuel: ${esc(v.fuelType)}</span>
          <span>Gear: ${esc(v.transmission)}</span>
          <span>Rate: Rs. ${Number(v.dailyRate).toLocaleString()}</span>
          <span>Rented under: <strong>${esc(v.rentalCompany)}</strong></span>
        </div>
        <div class="vehicle-actions">
          <button class="btn btn-outline" data-view="${esc(v.id)}">View</button>
          <button class="btn btn-secondary" data-edit="${esc(
            v.id
          )}">Edit</button>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  // ---------- Modals: View ----------
  function showVehicleModal(v, r) {
    const modal = $("#vehicleModal");
    const title = $("#vehicleModalTitle");
    const body = $("#vehicleModalBody");
    if (!modal || !title || !body) return;

    title.textContent = `${v.make} ${v.model} (${v.year})`;
    body.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <h4 style="margin:0 0 8px;font-size:16px;">Vehicle Info</h4>
          <div>Registration: <strong>${esc(v.regNo)}</strong></div>
          <div>Fuel: <strong>${esc(v.fuelType)}</strong></div>
          <div>Transmission: <strong>${esc(v.transmission)}</strong></div>
          <div>Seats: <strong>${esc(v.seats)}</strong></div>
          <div>Daily Rate: <strong>Rs. ${Number(
            v.dailyRate
          ).toLocaleString()}</strong></div>
        </div>
        <div>
          <h4 style="margin:0 0 8px;font-size:16px;">Rented Under</h4>
          <div>Rental Company: <strong>${esc(v.rentalCompany)}</strong></div>
          <div>Renter: <strong>${esc(r.name)}</strong></div>
          <div>Location: <strong>${esc(r.location || "—")}</strong></div>
          <div>Contact: <strong>${esc(r.phone || "—")}</strong></div>
        </div>
      </div>
      <div style="margin-top:12px;display:flex;justify-content:flex-end;gap:8px;">
        <button class="btn btn-secondary" data-edit-from-view="${esc(
          v.id
        )}">Edit</button>
      </div>
    `;
    modal.classList.add("show");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
  window.closeVehicleModal = function () {
    const modal = $("#vehicleModal");
    modal?.classList.remove("show");
    modal.style.display = "none";
    document.body.style.overflow = "";
  };

  // ---------- Modals: Add/Edit Form ----------
  function openVehicleForm(mode = "add", v = null) {
    editVehicleId = mode === "edit" ? String(v.id) : null;
    $("#vehicleFormTitle").textContent =
      mode === "edit" ? "Edit Vehicle" : "Add Vehicle";

    // Prefill
    $("#vf_id").value = v?.id ?? "";
    $("#vf_make").value = v?.make ?? "";
    $("#vf_model").value = v?.model ?? "";
    $("#vf_year").value = v?.year ?? "";
    $("#vf_reg").value = v?.regNo ?? "";
    $("#vf_rate").value = v?.dailyRate ?? "";
    $("#vf_fuel").value = v?.fuelType ?? "";
    $("#vf_trans").value = v?.transmission ?? "";
    $("#vf_seats").value = v?.seats ?? "";
    $("#vf_company").value = v?.rentalCompany ?? "";

    const modal = $("#vehicleFormModal");
    modal.classList.add("show");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
  window.closeVehicleForm = function () {
    const modal = $("#vehicleFormModal");
    modal?.classList.remove("show");
    modal.style.display = "none";
    document.body.style.overflow = "";
    $("#vehicleForm")?.reset();
    editVehicleId = null;
  };

  function collectVehicleFromForm() {
    const form = $("#vehicleForm");
    if (!form.reportValidity()) return null;

    const data = {
      id: $("#vf_id").value.trim(),
      make: $("#vf_make").value.trim(),
      model: $("#vf_model").value.trim(),
      year: Number($("#vf_year").value),
      regNo: $("#vf_reg").value.trim(),
      dailyRate: Number($("#vf_rate").value),
      fuelType: $("#vf_fuel").value,
      transmission: $("#vf_trans").value,
      seats: Number($("#vf_seats").value),
      rentalCompany: $("#vf_company").value.trim(),
    };

    // Generate id if adding new
    if (!data.id) data.id = `V-${id}-${Date.now().toString().slice(-6)}`;
    return data;
  }

  function upsertVehicle(vehicle) {
    renter.vehicles = Array.isArray(renter.vehicles) ? renter.vehicles : [];
    const idx = renter.vehicles.findIndex(
      (v) => String(v.id) === String(vehicle.id)
    );
    if (idx >= 0) {
      renter.vehicles[idx] = vehicle; // update
    } else {
      renter.vehicles.push(vehicle); // add
    }
    saveRenter(renter);
    renderVehicles(renter);
    toast(idx >= 0 ? "Vehicle updated." : "Vehicle added.");
  }

  // ---------- Utilities ----------
  function toast(msg) {
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText =
      "position:fixed;right:16px;bottom:16px;background:#2c3e50;color:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.2);z-index:1001;";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  // ---------- Event wiring ----------
  document.addEventListener("DOMContentLoaded", () => {
    if (!Number.isFinite(id)) {
      $(
        "#renterProfile"
      ).innerHTML = `<p style="margin:0;color:#374151;">Missing renter id.</p>`;
      return;
    }
    renter = loadRenter(id);
    renderProfile(renter);
    renderVehicles(renter);

    // Add Vehicle button
    $("#addVehicleBtn")?.addEventListener("click", () =>
      openVehicleForm("add")
    );

    // Save form
    $("#vehicleFormSubmitBtn")?.addEventListener("click", () => {
      const v = collectVehicleFromForm();
      if (!v) return;
      upsertVehicle(v);
      closeVehicleForm();
    });

    // Clicks inside vehicle grid (view/edit)
    $("#vehiclesGrid")?.addEventListener("click", (e) => {
      const viewBtn = e.target.closest("[data-view]");
      if (viewBtn) {
        const vid = viewBtn.getAttribute("data-view");
        const v = renter.vehicles.find((x) => String(x.id) === String(vid));
        if (v) showVehicleModal(v, renter);
        return;
      }
      const editBtn = e.target.closest("[data-edit]");
      if (editBtn) {
        const vid = editBtn.getAttribute("data-edit");
        const v = renter.vehicles.find((x) => String(x.id) === String(vid));
        if (v) openVehicleForm("edit", v);
      }
    });

    // Edit from inside the view modal
    $("#vehicleModalBody")?.addEventListener("click", (e) => {
      const editFromView = e.target.closest("[data-edit-from-view]");
      if (!editFromView) return;
      const vid = editFromView.getAttribute("data-edit-from-view");
      const v = renter.vehicles.find((x) => String(x.id) === String(vid));
      closeVehicleModal();
      if (v) openVehicleForm("edit", v);
    });
  });
})();
