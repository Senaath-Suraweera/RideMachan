// rental-company-view.js — show all vehicles/drivers + add new via modals
(function () {
  const $ = (s, root = document) => root.querySelector(s);

  // Seed data now includes full vehicles/drivers arrays
  const DATA = [
    {
      id: 1,
      name: "ABC Rentals",
      location: "Colombo",
      description: "Trusted city rentals with large fleet.",
      rating: 4.7,
      reviews: 214,
      withDriver: true,
      licenseNumber: "RC-89123",
      email: "hello@abcrentals.lk",
      phone: "+94 71 123 4567",
      address: "12 Flower Rd, Colombo 07",
      city: "Colombo",
      fleetSize: 120,
      vehicles: [
        {
          name: "Toyota Axio",
          price: 9500,
          company: "ABC Rentals",
          rating: 4.6,
          features: ["AC", "Auto", "Hybrid"],
        },
        {
          name: "Suzuki WagonR",
          price: 6500,
          company: "ABC Rentals",
          rating: 4.2,
          features: ["AC", "Auto"],
        },
        {
          name: "Toyota Prius C",
          price: 8800,
          company: "ABC Rentals",
          rating: 4.4,
          features: ["AC", "Auto", "Hybrid"],
        },
      ],
      drivers: [
        { name: "Ruwan Perera", rides: 820, rating: 4.9 },
        { name: "Ishan Silva", rides: 610, rating: 4.7 },
        { name: "Amila D.", rides: 190, rating: 4.5 },
      ],
      terms: "Full insurance; 200km/day cap.",
      contactNote: "Open 8:00–20:00 daily.",
    },
    {
      id: 2,
      name: "Quick Drive Co",
      location: "Kandy",
      description: "Affordable mountain routes, optional driver.",
      rating: 4.4,
      reviews: 132,
      withDriver: false,
      licenseNumber: "RC-55201",
      email: "info@quickdrive.lk",
      phone: "+94 76 222 3344",
      address: "45 Hill St, Kandy",
      city: "Kandy",
      fleetSize: 70,
      vehicles: [
        {
          name: "Honda Fit",
          price: 8200,
          company: "Quick Drive Co",
          rating: 4.5,
          features: ["AC", "Auto"],
        },
        {
          name: "Perodua Bezza",
          price: 7000,
          company: "Quick Drive Co",
          rating: 4.1,
          features: ["AC", "Auto"],
        },
      ],
      drivers: [{ name: "Kasun D.", rides: 410, rating: 4.6 }],
      terms: "Deposit required; fuel not included.",
      contactNote: "Mon–Sat 9:00–18:00.",
    },
    {
      id: 3,
      name: "Premium Cars",
      location: "Negombo",
      description: "Executive sedans & SUVs; chauffeurs available.",
      rating: 4.9,
      reviews: 89,
      withDriver: true,
      licenseNumber: "RC-77110",
      email: "contact@premiumcars.lk",
      phone: "+94 77 888 7777",
      address: "7 Airport Rd, Negombo",
      city: "Negombo",
      fleetSize: 48,
      vehicles: [
        {
          name: "Toyota Camry",
          price: 15000,
          company: "Premium Cars",
          rating: 4.9,
          features: ["Leather", "Auto", "AC"],
        },
      ],
      drivers: [{ name: "Sameera F.", rides: 350, rating: 4.9 }],
      terms: "Chauffeur-only rentals; premium insurance.",
      contactNote: "24/7 hotline.",
    },
  ];

  let currentCompanyIndex = -1;

  document.addEventListener("DOMContentLoaded", () => {
    const { id, name } = getParams();

    // Resolve company
    let company = null;
    if (Number.isFinite(id)) {
      currentCompanyIndex = DATA.findIndex((d) => d.id === id);
      company = DATA[currentCompanyIndex] || null;
    }
    if (!company && name) {
      currentCompanyIndex = DATA.findIndex(
        (d) => normalize(d.name) === normalize(name)
      );
      company = DATA[currentCompanyIndex] || null;
    }
    if (!company) {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("selectedCompany") || "null"
        );
        if (saved && Number.isFinite(Number(saved.id))) {
          currentCompanyIndex = DATA.findIndex(
            (d) => d.id === Number(saved.id)
          );
          company = DATA[currentCompanyIndex] || null;
        }
      } catch {}
    }
    if (!company) {
      return renderEmpty(
        'Company not found. <a href="rental-companies.html">Back</a>'
      );
    }

    render(company);
    wireModals(company);
  });

  function render(c) {
    const mount = $("#companyView");
    const initials = c.name
      .split(" ")
      .map((p) => p[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // vehicles/drivers arrays (fallback if older data keys exist)
    const vehicles = Array.isArray(c.vehicles)
      ? c.vehicles
      : c.topVehicles || [];
    const drivers = Array.isArray(c.drivers) ? c.drivers : c.topDrivers || [];

    mount.innerHTML = `
      <section class="profile-header">
        <div class="profile-logo">${initials}</div>
        <div class="profile-info">
          <h2>${esc(c.name)}</h2>
          <div class="profile-license">License: ${esc(c.licenseNumber)}</div>
          <div class="profile-description">${esc(c.description)}</div>
        </div>
      </section>

      <section class="business-info">
        <div class="info-section">
          <h3>Business Info</h3>
          <div class="info-item"><span class="info-label">Location</span><span class="info-value">${esc(
            c.location
          )}</span></div>
          <div class="info-item"><span class="info-label">City</span><span class="info-value">${esc(
            c.city
          )}</span></div>
          <div class="info-item"><span class="info-label">Fleet Size</span><span class="info-value">${fmt(
            c.fleetSize
          )}</span></div>
          <div class="info-item"><span class="info-label">With Driver</span><span class="info-value">${
            c.withDriver ? "Yes" : "Optional/No"
          }</span></div>
        </div>

        <div class="info-section">
          <h3>Contact</h3>
          <div class="info-item"><span class="info-label">Email</span><span class="info-value">${esc(
            c.email
          )}</span></div>
          <div class="info-item"><span class="info-label">Phone</span><span class="info-value">${esc(
            c.phone
          )}</span></div>
          <div class="info-item"><span class="info-label">Address</span><span class="info-value">${esc(
            c.address
          )}</span></div>
        </div>

        <div class="info-section">
          <h3>Rating</h3>
          <div class="info-item"><span class="info-label">Average</span><span class="info-value">${Number(
            c.rating || 0
          ).toFixed(1)} / 5</span></div>
          <div class="info-item"><span class="info-label">Reviews</span><span class="info-value">${fmt(
            c.reviews
          )}</span></div>
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
          ${vehicles
            .map(
              (v) => `
            <div class="vehicle-card">
              <div class="vehicle-name">${esc(v.name)}</div>
              <div class="vehicle-price">Rs. ${fmt(v.price)}/day</div>
              <div class="vehicle-company">${esc(v.company || c.name)}</div>
              <div class="vehicle-features">
                ${(v.features || [])
                  .map((f) => `<span class="feature-tag">${esc(f)}</span>`)
                  .join("")}
              </div>
              <div class="vehicle-rating">Rating: ${Number(
                v.rating || 0
              ).toFixed(1)} / 5</div>
            </div>
          `
            )
            .join("")}
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
          ${drivers
            .map(
              (d) => `
            <div class="driver-card">
              <div class="driver-avatar">${avatar(d.name)}</div>
              <div class="driver-name">${esc(d.name)}</div>
              <div class="driver-stats">Rides: ${fmt(
                d.rides || 0
              )} • ★ ${Number(d.rating || 0).toFixed(1)}</div>
            </div>
          `
            )
            .join("")}
        </div>
      </section>

      <section class="reviews-section">
        <div class="reviews-summary">
          <div class="overall-rating">
            <div class="rating-number">${Number(c.rating || 0).toFixed(1)}</div>
            <div class="rating-text">Average Rating</div>
          </div>
          <div>Based on ${fmt(c.reviews)} reviews</div>
        </div>
        <div class="reviews-placeholder">Reviews UI coming soon…</div>
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

  /* ===== Modal wiring & handlers ===== */
  function wireModals(company) {
    const rvModal = $("#registerVehicleModal");
    const rdModal = $("#registerDriverModal");

    const openModal = (m) => m?.classList.add("show");
    const closeModal = (m) => m?.classList.remove("show");

    // expose for onclick in rendered buttons
    window.openRegisterVehicle = () => openModal(rvModal);
    window.openRegisterDriver = () => openModal(rdModal);

    // close buttons + backdrop click
    document.querySelectorAll("[data-close]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-close");
        closeModal(document.getElementById(id));
      });
    });
    [rvModal, rdModal].forEach((m) =>
      m?.addEventListener("click", (e) => {
        if (e.target === m) closeModal(m);
      })
    );

    // submit handlers
    $("#registerVehicleForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#rvName").value.trim();
      const price = Number($("#rvPrice").value || 0);
      const feats = $("#rvFeatures")
        .value.split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!name) return alert("Vehicle name is required");

      // persist into DATA
      if (currentCompanyIndex >= 0) {
        const c = DATA[currentCompanyIndex];
        c.vehicles = c.vehicles || [];
        c.vehicles.push({
          name,
          price,
          company: c.name,
          rating: 0,
          features: feats,
        });
        render(c);
        closeModal(rvModal);
        e.target.reset();
      }
    });

    $("#registerDriverForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = $("#rdName").value.trim();
      const rides = Number($("#rdRides").value || 0);
      const rating = Number($("#rdRating").value || 0);
      if (!name) return alert("Driver name is required");

      if (currentCompanyIndex >= 0) {
        const c = DATA[currentCompanyIndex];
        c.drivers = c.drivers || [];
        c.drivers.push({ name, rides, rating });
        render(c);
        closeModal(rdModal);
        e.target.reset();
      }
    });
  }

  /* ===== helpers ===== */
  function getParams() {
    const q = new URLSearchParams(location.search);
    const id = Number(q.get("id"));
    const name = (q.get("name") || "").trim();
    return { id: Number.isFinite(id) ? id : null, name };
  }
  function normalize(s) {
    return String(s).toLowerCase().replace(/\s+/g, " ").trim();
  }
  function renderEmpty(message) {
    const mount = $("#companyView");
    mount.innerHTML = `<div class="content-placeholder" style="background:#fff;border:1px solid #e6e8ec;border-radius:12px;padding:20px;text-align:center;">${message}</div>`;
  }
  function esc(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
  function fmt(v) {
    return Number(v || 0).toLocaleString();
  }
  function avatar(name) {
    return String(name)
      .split(/\s+/)
      .map((n) => n[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
})();
