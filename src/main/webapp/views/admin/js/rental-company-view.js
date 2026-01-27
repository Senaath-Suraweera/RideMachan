// rental-company-view.js — fetch company + reviews from backend
(function () {
  const $ = (s, root = document) => root.querySelector(s);

  // context-safe base (works even if your app runs under /RideMachan)
  function getContextPath() {
    // Works for:
    //  - /RideMachan/views/admin/...
    //  - /views/admin/...
    const p = window.location.pathname;
    const idx = p.indexOf("/views/");
    if (idx >= 0) return p.substring(0, idx); // "" or "/RideMachan"
    // fallback: assume first segment is context
    return "/" + p.split("/")[1];
  }

  const CONTEXT = getContextPath(); // "" or "/RideMachan"
  const API_BASE = `${CONTEXT}/admin/rentalcompanies`;

  document.addEventListener("DOMContentLoaded", async () => {
    const { id } = getParams();

    // fallback to sessionStorage if URL missing
    let companyId = Number.isFinite(id) ? id : null;
    if (!companyId) {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("selectedCompany") || "null",
        );
        const sid = Number(saved?.id);
        if (Number.isFinite(sid)) companyId = sid;
      } catch {}
    }

    if (!companyId) {
      return renderEmpty(
        'Company not found. <a href="rental-companies.html">Back</a>',
      );
    }

    renderLoading();

    const company = await fetchCompany(companyId);
    if (!company) {
      return renderEmpty(
        'Company not found. <a href="rental-companies.html">Back</a>',
      );
    }

    // ✅ NEW: fetch reviews list from /admin/rentalcompanies/{id}/reviews
    const reviewsList = await fetchCompanyReviews(companyId);
    company._reviewsList = reviewsList;

    render(company);
    wireModals(company); // still local-only (UI only)
  });

  async function fetchCompany(companyId) {
    try {
      const res = await fetch(`${API_BASE}/${encodeURIComponent(companyId)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        console.error(`Company API returned status ${res.status}`);
        return null;
      }

      const data = await res.json();
      if (!data || data.status !== "success" || !data.company) {
        console.error("Invalid company response structure:", data);
        return null;
      }

      return data.company;
    } catch (e) {
      console.error("Failed to load company details:", e);
      return null;
    }
  }

  // ✅ NEW: reviews endpoint
  async function fetchCompanyReviews(companyId) {
    try {
      const res = await fetch(
        `${API_BASE}/${encodeURIComponent(companyId)}/reviews`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
        },
      );

      if (!res.ok) {
        console.error(`Reviews API returned status ${res.status}`);
        return [];
      }

      const data = await res.json();
      if (!data || data.status !== "success" || !Array.isArray(data.reviews)) {
        console.error("Invalid reviews response structure:", data);
        return [];
      }

      return data.reviews;
    } catch (e) {
      console.error("Failed to load reviews:", e);
      return [];
    }
  }

  function renderLoading() {
    const mount = $("#companyView");
    if (!mount) return;

    mount.innerHTML = `
      <div class="content-placeholder" style="background:#fff;border:1px solid #e6e8ec;border-radius:12px;padding:20px;text-align:center;">
        Loading company details...
      </div>
    `;
  }

  function render(c) {
    const mount = $("#companyView");
    if (!mount) return;

    const initials = String(c.name || "")
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const vehicles = Array.isArray(c.vehicles) ? c.vehicles : [];
    const drivers = Array.isArray(c.drivers) ? c.drivers : [];

    // ✅ reviews list from backend
    const reviewsList = Array.isArray(c._reviewsList) ? c._reviewsList : [];

    mount.innerHTML = `
      <section class="profile-header">
        <div class="profile-logo">${initials}</div>
        <div class="profile-info">
          <h2>${esc(c.name)}</h2>
          <div class="profile-license">License: ${esc(c.licenseNumber || "—")}</div>
          <div class="profile-description">${esc(c.description || "—")}</div>
        </div>
      </section>

      <section class="business-info">
        <div class="info-section">
          <h3>Business Info</h3>
          <div class="info-item"><span class="info-label">Location</span><span class="info-value">${esc(c.location || "")}</span></div>
          <div class="info-item"><span class="info-label">City</span><span class="info-value">${esc(c.city || "")}</span></div>
          <div class="info-item"><span class="info-label">Fleet Size</span><span class="info-value">${fmt(c.fleetSize || 0)}</span></div>
          <div class="info-item"><span class="info-label">With Driver</span><span class="info-value">${c.withDriver ? "Yes" : "Optional/No"}</span></div>
        </div>

        <div class="info-section">
          <h3>Contact</h3>
          <div class="info-item"><span class="info-label">Email</span><span class="info-value">${esc(c.email || "")}</span></div>
          <div class="info-item"><span class="info-label">Phone</span><span class="info-value">${esc(c.phone || "")}</span></div>
          <div class="info-item"><span class="info-label">Address</span><span class="info-value">${esc(c.address || "")}</span></div>
        </div>

        <div class="info-section">
          <h3>Rating</h3>
          <div class="info-item"><span class="info-label">Average</span><span class="info-value">${Number(c.rating || 0).toFixed(1)} / 5</span></div>
          <div class="info-item"><span class="info-label">Reviews</span><span class="info-value">${fmt(c.reviews || 0)}</span></div>
        </div>
      </section>

      <section class="info-section vehicles-section">
        <div class="section-header">
          <h3>Vehicles (${vehicles.length})</h3>
          <div class="actions">
            <button class="btn btn-primary btn-sm" onclick="window.openRegisterVehicle()">+ Register Vehicle</button>
          </div>
        </div>
        <div class="vehicles-grid">
          ${
            vehicles.length
              ? vehicles
                  .map(
                    (v) => `
            <div class="vehicle-card">
              <div class="vehicle-name">${esc(v.name || "")}</div>
              <div class="vehicle-price">Rs. ${fmt(v.price || 0)}/day</div>
              <div class="vehicle-company">${esc(v.company || c.name || "")}</div>
              <div class="vehicle-features">
                ${(Array.isArray(v.features) ? v.features : [])
                  .map((f) => `<span class="feature-tag">${esc(f)}</span>`)
                  .join("")}
              </div>
              <div class="vehicle-rating">Rating: ${Number(v.rating || 0).toFixed(1)} / 5</div>
            </div>
          `,
                  )
                  .join("")
              : `<div class="content-placeholder">No vehicles found.</div>`
          }
        </div>
      </section>

      <section class="info-section">
        <div class="section-header">
          <h3>Drivers (${drivers.length})</h3>
          <div class="actions">
            <button class="btn btn-primary btn-sm" onclick="window.openRegisterDriver()">+ Register Driver</button>
          </div>
        </div>
        <div class="drivers-grid">
          ${
            drivers.length
              ? drivers
                  .map(
                    (d) => `
            <div class="driver-card">
              <div class="driver-avatar">${avatar(d.name || "")}</div>
              <div class="driver-name">${esc(d.name || "")}</div>
              <div class="driver-stats">Rides: ${fmt(d.rides || 0)} • ★ ${Number(d.rating || 0).toFixed(1)}</div>
            </div>
          `,
                  )
                  .join("")
              : `<div class="content-placeholder">No drivers found.</div>`
          }
        </div>
      </section>

      <!-- ✅ Reviews rendered from backend -->
      <section class="reviews-section">
        <div class="reviews-summary">
          <div class="overall-rating">
            <div class="rating-number">${Number(c.rating || 0).toFixed(1)}</div>
            <div class="rating-text">Average Rating</div>
          </div>
          <div>Based on ${fmt(c.reviews || 0)} reviews</div>
        </div>

        ${
          reviewsList.length === 0
            ? `<div class="content-placeholder">No reviews yet.</div>`
            : `<div class="reviews-list">
                ${reviewsList.map(renderReviewCard).join("")}
              </div>`
        }
      </section>

      <section class="terms-section">
        <h3>Terms</h3>
        <div class="content-placeholder">${esc(c.terms || "—")}</div>
      </section>

      <section class="contact-section">
        <h3>Notes</h3>
        <div class="content-placeholder">${esc(c.contactNote || "—")}</div>
      </section>
    `;
  }

  function renderReviewCard(r) {
    // backend returns:
    // { id, rating, review, createdAt, customer:{id,name}, target:{type,id,name} }
    const customerName = r?.customer?.name || "Anonymous";
    const rating = Number(r?.rating || 0).toFixed(1);
    const createdAt = formatDateTime(r?.createdAt);
    const text = r?.review || "";
    const targetType = r?.target?.type || "";
    const targetName = r?.target?.name || "";

    const targetLine =
      targetType && targetName
        ? `<div class="review-target">For: ${esc(targetType)} • ${esc(targetName)}</div>`
        : "";

    return `
      <div class="review-card" style="background:#fff;border:1px solid #e6e8ec;border-radius:12px;padding:12px;margin-top:10px;">
        <div style="display:flex;justify-content:space-between;gap:10px;">
          <div><strong>${esc(customerName)}</strong></div>
          <div>★ ${rating}</div>
        </div>
        <div style="opacity:.7;font-size:12px;margin-top:4px;">${esc(createdAt)}</div>
        ${targetLine}
        <div style="margin-top:8px;">${esc(text)}</div>
      </div>
    `;
  }

  /* ===== Modal wiring (UI-only; no backend endpoints given for adding vehicles/drivers) ===== */
  function wireModals(company) {
    const rvModal = $("#registerVehicleModal");
    const rdModal = $("#registerDriverModal");

    const openModal = (m) => m?.classList.add("show");
    const closeModal = (m) => m?.classList.remove("show");

    window.openRegisterVehicle = () => openModal(rvModal);
    window.openRegisterDriver = () => openModal(rdModal);

    document.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-close");
        closeModal(document.getElementById(id));
      });
    });

    [rvModal, rdModal].forEach((m) =>
      m?.addEventListener("click", (e) => {
        if (e.target === m) closeModal(m);
      }),
    );

    $("#registerVehicleForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#rvName").value.trim();
      const price = Number($("#rvPrice").value || 0);
      const feats = $("#rvFeatures")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (!name) return alert("Vehicle name is required");

      company.vehicles = company.vehicles || [];
      company.vehicles.push({
        id: Date.now(), // UI-only
        name,
        price,
        company: company.name,
        rating: 0,
        features: feats,
      });

      render(company);
      closeModal(rvModal);
      e.target.reset();
    });

    $("#registerDriverForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#rdName").value.trim();
      const rides = Number($("#rdRides").value || 0);
      const rating = Number($("#rdRating").value || 0);

      if (!name) return alert("Driver name is required");

      company.drivers = company.drivers || [];
      company.drivers.push({
        id: Date.now(), // UI-only
        name,
        rides,
        rating,
      });

      render(company);
      closeModal(rdModal);
      e.target.reset();
    });
  }

  /* ===== helpers ===== */
  function getParams() {
    const q = new URLSearchParams(location.search);
    const id = Number(q.get("id"));
    return { id: Number.isFinite(id) ? id : null };
  }

  function renderEmpty(message) {
    const mount = $("#companyView");
    if (!mount) return;
    mount.innerHTML = `<div class="content-placeholder" style="background:#fff;border:1px solid #e6e8ec;border-radius:12px;padding:20px;text-align:center;">${message}</div>`;
  }

  function esc(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function fmt(v) {
    return Number(v || 0).toLocaleString();
  }

  function avatar(name) {
    return String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function formatDateTime(s) {
    if (!s) return "";
    // your servlet sends Timestamp.toString() like "2026-01-27 14:20:11.0"
    // keep it simple, but remove ".0" if present
    return String(s).replace(/\.0$/, "");
  }
})();
