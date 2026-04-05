// Individual Renters (Vehicle Providers) – API-backed list + navigation (FIXED)
(() => {
  const API_BASE = "http://localhost:8080";
  const API = `${API_BASE}/api/admin/vehicle-providers`;

  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const state = {
    providers: [],
    filtered: [],
  };

  // ---- elements ----
  const grid = $("#rentersGrid");
  const title = $("#rentersListTitle");
  const searchInput = $("#renterSearch");
  const locationFilter = $("#locationFilter");
  const statusFilter = $("#statusFilter");
  const minRatingFilter = $("#minRatingFilter"); // exists in HTML but not used (providers have no ratings)
  const sortSelect = $("#sortOrder");
  const applyBtn = $("#applyFiltersBtn");
  const resetBtn = $("#resetFiltersBtn");

  // ---- API ----
  async function apiGet(url) {
    const res = await fetch(url, { method: "GET" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  }

  function buildListUrl() {
    // Backend supports q, city, status
    const q = (searchInput?.value || "").trim();
    const city = locationFilter?.value || "";
    const status = statusFilter?.value || "";

    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (city) params.set("city", city);
    if (status) params.set("status", status);

    const qs = params.toString();
    return qs ? `${API}?${qs}` : API;
  }

  async function loadProviders() {
    if (title) title.textContent = "Individual Renters (Loading...)";

    const data = await apiGet(buildListUrl());

    // Backend returns: { ok:true, data:[...] }
    state.providers = Array.isArray(data)
      ? data
      : Array.isArray(data.data)
        ? data.data
        : [];

    state.filtered = [...state.providers];
    populateLocationFilter(state.providers);
    applySortAndRender();
  }

  window.openRegisterDriverModal = function () {
    const modal = document.querySelector("#registerDriverModal");
    if (!modal) return;
    modal.style.display = "flex";
    modal.classList.add("open", "show", "active");
    modal.setAttribute("aria-hidden", "false");
  };

  window.closeRegisterDriverModal = function () {
    const modal = document.querySelector("#registerDriverModal");
    const form = document.querySelector("#registerDriverForm");
    if (modal) {
      modal.style.display = "none";
      modal.classList.remove("open", "show", "active");
      modal.setAttribute("aria-hidden", "true");
    }
    if (form) form.reset();
  };

  // ---- UI helpers ----
  function populateLocationFilter(list) {
    if (!locationFilter) return;

    const keep0 = locationFilter.querySelector("option[value='']");
    locationFilter.innerHTML = "";
    if (keep0) locationFilter.appendChild(keep0);

    const unique = [
      ...new Set(list.map((p) => p.location || p.city).filter(Boolean)),
    ].sort();
    unique.forEach((loc) => {
      const o = document.createElement("option");
      o.value = loc;
      o.textContent = loc;
      locationFilter.appendChild(o);
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  }

  function applyFiltersLocal() {
    const q = (searchInput?.value || "").toLowerCase().trim();
    const loc = locationFilter?.value || "";
    const status = statusFilter?.value || "";

    // minRatingFilter exists in HTML but providers have no rating data (ignore safely)
    if (minRatingFilter && minRatingFilter.value) {
      // no-op
    }

    state.filtered = state.providers.filter((p) => {
      // Backend provider object shape:
      // { id, name, email, phone, location, status, joinDate }
      const fullName = (p.name || p.username || "").trim();

      const matchQ =
        !q ||
        fullName.toLowerCase().includes(q) ||
        String(p.email || "")
          .toLowerCase()
          .includes(q) ||
        String(p.phone || "")
          .toLowerCase()
          .includes(q) ||
        String(p.id || "").toLowerCase() === q.replace(/^#/, "");

      const matchLoc = !loc || (p.location || p.city) === loc;

      const matchStatus =
        !status ||
        String(p.status || "").toLowerCase() === status.toLowerCase();

      return matchQ && matchLoc && matchStatus;
    });
  }

  function applySortAndRender() {
    applyFiltersLocal();

    const sort = sortSelect?.value || "name_asc";

    const byNameAsc = (a, b) => (a.name || "").localeCompare(b.name || "");
    const byNameDesc = (a, b) => (b.name || "").localeCompare(a.name || "");
    const byIdDesc = (a, b) => Number(b.id || 0) - Number(a.id || 0);
    const byIdAsc = (a, b) => Number(a.id || 0) - Number(b.id || 0);

    // rating sorts are present in UI, but we don’t have ratings -> fall back to name
    if (sort === "name_desc") state.filtered.sort(byNameDesc);
    else if (sort === "id_desc") state.filtered.sort(byIdDesc);
    else if (sort === "id_asc") state.filtered.sort(byIdAsc);
    else state.filtered.sort(byNameAsc);

    render();
  }

  function render() {
    if (title)
      title.textContent = `Individual Renters (${state.filtered.length})`;
    if (!grid) return;

    if (!state.filtered.length) {
      grid.innerHTML = `<div style="padding:12px;color:#6b7280;">No providers found.</div>`;
      return;
    }

    grid.innerHTML = "";

    state.filtered.forEach((p) => {
      const id = p.id;
      const fullName = (p.name || p.username || "—").trim();
      const location = p.location || "—";
      const joinDate = formatDate(p.joinDate);
      const phone = p.phone || "—";
      const email = p.email || "—";
      const statusRaw = String(p.status || "pending").toLowerCase();
      const statusClass = statusRaw === "active" ? "active" : "pending";
      const initial = (fullName[0] || "?").toUpperCase();

      const card = document.createElement("div");
      card.className = "renter-card";
      card.dataset.renterId = id;

      // ✅ HTML matches your individual-renters.css classes:
      // .renter-avatar, .renter-info, .status-badge.active/.pending, .renter-details
      card.innerHTML = `
        <div class="renter-avatar">
          <div class="avatar-text">${esc(initial)}</div>
        </div>

        <div class="renter-info">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
            <h4 style="margin:0;">${esc(fullName)}</h4>
            <span class="status-badge ${statusClass}">${esc(statusRaw.toUpperCase())}</span>
          </div>

          <div class="renter-details">
            <span>📍 ${esc(location)}</span>
            <span>🗓️ Joined: ${esc(joinDate)}</span>
            <span>📞 ${esc(phone)}</span>
            <span>📧 ${esc(email)}</span>
            <span>#${esc(id)}</span>
          </div>

          <div class="renter-desc">Click to view provider profile and vehicles</div>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  // ---- events ----
  function bind() {
    searchInput?.addEventListener("input", applySortAndRender);
    locationFilter?.addEventListener("change", applySortAndRender);
    statusFilter?.addEventListener("change", applySortAndRender);
    sortSelect?.addEventListener("change", applySortAndRender);
    minRatingFilter?.addEventListener("change", applySortAndRender);

    applyBtn?.addEventListener("click", async () => {
      try {
        await loadProviders();
      } catch (e) {
        console.error(e);
        alert(`Failed to load providers: ${e.message}`);
      }
    });

    resetBtn?.addEventListener("click", async () => {
      if (searchInput) searchInput.value = "";
      if (locationFilter) locationFilter.value = "";
      if (statusFilter) statusFilter.value = "";
      if (minRatingFilter) minRatingFilter.value = "";
      if (sortSelect) sortSelect.value = "name_asc";

      try {
        await loadProviders();
      } catch (e) {
        console.error(e);
        alert(`Failed to load providers: ${e.message}`);
      }
    });

    // card click navigation
    document.addEventListener("click", (e) => {
      const card = e.target.closest(".renter-card");
      if (!card) return;

      const id = Number(card.dataset.renterId);
      const provider = state.providers.find((x) => Number(x.id) === id);
      if (provider) {
        try {
          sessionStorage.setItem("selectedRenter", JSON.stringify(provider));
        } catch {}
      }

      window.location.href = `individual-renter-view.html?id=${id}`;
    });
  }

  // ✅ Register Renter (Vehicle Provider) from modal
  window.registerDriver = async function registerDriver() {
    const form = document.querySelector("#registerDriverForm");
    if (!form) return alert("Form not found");

    const fd = new FormData(form);

    // Frontend uses company_id (optional). Backend servlet currently expects companyid.
    // We send BOTH to be safe.
    const companyIdRaw = (fd.get("company_id") || "").toString().trim();
    const companyId = companyIdRaw ? companyIdRaw : "0";
    fd.set("companyid", companyId); // backend legacy param
    fd.set("company_id", companyId); // backend friendly param if you update servlet

    // Basic required validation
    const username = (fd.get("username") || "").toString().trim();
    const email = (fd.get("email") || "").toString().trim();
    const password = (fd.get("password") || "").toString();

    if (!username || !email || !password) {
      return alert("Username, Email, and Password are required.");
    }

    try {
      const res = await fetch("http://localhost:8080/provider/signup", {
        method: "POST",
        body: fd, // matches @MultipartConfig servlet
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.status === "error") {
        throw new Error(data.message || `Signup failed (${res.status})`);
      }

      alert(data.message || "Provider registered successfully");
      window.closeRegisterDriverModal();

      // Refresh list after registration
      await loadProviders();
    } catch (e) {
      console.error(e);
      alert(`Failed to register renter: ${e.message}`);
    }
  };

  // ---- start ----
  (async function init() {
    bind();
    try {
      await loadProviders();
    } catch (e) {
      console.error(e);
      if (title) title.textContent = "Individual Renters (Error)";
      if (grid)
        grid.innerHTML = `<div style="padding:12px;color:#ef4444;">Failed to load providers: ${esc(e.message)}</div>`;
    }
  })();
})();
