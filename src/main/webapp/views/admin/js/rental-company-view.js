// rental-company-view.js — robust resolver (?id=... OR ?name=...) with aliases
(function () {
  const $ = (s, root = document) => root.querySelector(s);

  // ---- Dataset (unchanged) ----
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
      topVehicles: [
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
      ],
      topDrivers: [
        { name: "Ruwan Perera", rides: 820, rating: 4.9 },
        { name: "Ishan Silva", rides: 610, rating: 4.7 },
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
      topVehicles: [
        {
          name: "Honda Fit",
          price: 8200,
          company: "Quick Drive",
          rating: 4.5,
          features: ["AC", "Auto"],
        },
      ],
      topDrivers: [{ name: "Kasun D.", rides: 410, rating: 4.6 }],
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
      topVehicles: [
        {
          name: "Toyota Camry",
          price: 15000,
          company: "Premium Cars",
          rating: 4.9,
          features: ["Leather", "Auto", "AC"],
        },
      ],
      topDrivers: [{ name: "Sameera F.", rides: 350, rating: 4.9 }],
      terms: "Chauffeur-only rentals; premium insurance.",
      contactNote: "24/7 hotline.",
    },
  ];

  // Map request names → dataset names (expand as needed)
  const ALIASES = {
    "abc transport services": "abc rentals",
    "quick ride solutions": "quick drive co",
    // add more aliases here if your requests list uses different branding
  };

  document.addEventListener("DOMContentLoaded", () => {
    // single bootstrap
    const { id, name } = getParams();

    let company = null;

    // 1) By ID
    if (Number.isFinite(id)) {
      company = DATA.find((d) => d.id === id) || null;
    }

    // 2) By name (with aliases + lenient match)
    if (!company && name) {
      const target = normalize(ALIASES[normalize(name)] || name);

      // exact normalized match
      company = DATA.find((d) => normalize(d.name) === target) || null;

      // lenient contains/contained-by match
      if (!company) {
        company =
          DATA.find((d) => {
            const dn = normalize(d.name);
            return dn.includes(target) || target.includes(dn);
          }) || null;
      }
    }

    // 3) As a last resort, if no URL params and we came from the list
    if (!company && !id && !name) {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("selectedCompany") || "null"
        );
        if (saved && Number.isFinite(Number(saved.id))) {
          company = DATA.find((d) => d.id === Number(saved.id)) || null;
        }
      } catch {}
    }

    if (!company) {
      const ctx = name
        ? ` for “${name}”`
        : Number.isFinite(id)
        ? ` for id ${id}`
        : "";
      return renderEmpty(
        `Company not found${ctx}. <a href="rental-companies.html">Back</a>`
      );
    }

    render(company);
  });

  /* ============ helpers ============ */
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
    if (!mount) return;
    mount.innerHTML = `
      <div class="content-placeholder" style="background:#fff;border:1px solid #e6e8ec;border-radius:12px;padding:20px;text-align:center;">
        ${message}
      </div>`;
  }

  function render(c) {
    const mount = $("#companyView");
    const initials = c.name
      .split(" ")
      .map((p) => p[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

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
        <h3>Top Vehicles</h3>
        <div class="vehicles-grid">
          ${(c.topVehicles || [])
            .map(
              (v) => `
            <div class="vehicle-card">
              <div class="vehicle-name">${esc(v.name)}</div>
              <div class="vehicle-price">Rs. ${fmt(v.price)}/day</div>
              <div class="vehicle-company">${esc(v.company)}</div>
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
        <h3>Top Drivers</h3>
        <div class="drivers-grid">
          ${(c.topDrivers || [])
            .map(
              (d) => `
            <div class="driver-card">
              <div class="driver-avatar">${avatar(d.name)}</div>
              <div class="driver-name">${esc(d.name)}</div>
              <div class="driver-stats">Rides: ${fmt(d.rides)} • ★ ${Number(
                d.rating || 0
              ).toFixed(1)}</div>
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
