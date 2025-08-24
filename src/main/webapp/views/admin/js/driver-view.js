// Robust Driver View renderer (merges saved data with defaults to avoid undefined errors)
(function () {
  // Align with sidebar if present
  if (document.querySelector(".sidebar"))
    document.body.classList.add("with-sidebar");

  // ----- COMPLETE local dataset (acts as the source of truth) -----
  const DATA = [
    {
      id: 1,
      name: "Rajesh Kumar",
      company: "Lanka Express",
      rating: 4.9,
      reviews: 156,
      description:
        "Top-rated driver with extensive knowledge of Colombo routes. Available 24/7.",
      appliedDate: "2024-01-13",
      phone: "+94 77 123 4567",
      email: "rajesh.kumar@lankaexpress.com",
      age: 32,
      experience: 8,
      location: "Colombo",
      status: "active",
      totalRides: 247,
      totalKm: 12400,
      onTimePercentage: 98,
      licenseNumber: "B1234567",
      nicNumber: "901234567V",
      licenseExpiry: "December 2027",
      categories: ["A, B1, B"],
    },
    {
      id: 2,
      name: "Maria Fernando",
      company: "Metro Cabs",
      rating: 4.6,
      reviews: 89,
      description:
        "Professional driver specializing in airport transfers. Fluent in English and Sinhala.",
      appliedDate: "2024-01-14",
      phone: "+94 71 555 0123",
      email: "maria.fernando@metrocabs.lk",
      age: 29,
      experience: 5,
      location: "Negombo",
      status: "active",
      totalRides: 189,
      totalKm: 8950,
      onTimePercentage: 95,
      licenseNumber: "B2345678",
      nicNumber: "912345678V",
      licenseExpiry: "March 2026",
      categories: ["B1, B"],
    },
    {
      id: 3,
      name: "John Silva",
      company: "City Taxi Service",
      rating: 4.8,
      reviews: 124,
      description:
        "Experienced driver with 8 years of service. Clean driving record and excellent customer service.",
      appliedDate: "2024-01-15",
      phone: "+94 76 987 6543",
      email: "john.silva@citytaxi.com",
      age: 35,
      experience: 8,
      location: "Kandy",
      status: "active",
      totalRides: 312,
      totalKm: 15600,
      onTimePercentage: 97,
      licenseNumber: "B3456789",
      nicNumber: "923456789V",
      licenseExpiry: "August 2025",
      categories: ["A, B1, B, C1"],
    },
  ];

  // Defaults to guarantee every field exists
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
    onTimePercentage: 0,
    licenseNumber: "—",
    nicNumber: "—",
    licenseExpiry: "—",
    categories: [],
  };

  // ---------- Helpers ----------
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  const n = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d); // coerce to number or default
  const fmt = (v) => n(v, 0).toLocaleString(); // safe number formatting

  function getIdFromURL() {
    const q = new URLSearchParams(location.search);
    const id = Number(q.get("id"));
    return Number.isFinite(id) ? id : null;
  }

  // Merge precedence: DEFAULTS <- BASE(DATA) <- SAVED(sessionStorage)
  function getNormalizedDriver(id) {
    const base = DATA.find((d) => d.id === id) || null;

    let saved = null;
    const raw = sessionStorage.getItem("selectedDriver");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // allow either {id} or full object; ensure it matches current id
        if (parsed && Number(parsed.id) === id) saved = parsed;
      } catch {}
    }

    if (!base && !saved) return null;
    return { ...DEFAULTS, ...(base || {}), ...(saved || {}) };
  }

  function renderEmpty(message) {
    const mount = $("#driverView");
    if (!mount) return;
    mount.innerHTML = `
      <div class="empty-state" style="background:#fff;border:1px solid #e6e8ec;border-radius:12px;padding:20px;text-align:center;">
        <p style="margin:0 0 12px;color:#374151;">${esc(message)}</p>
        <a class="btn" href="drivers.html" style="display:inline-block;padding:10px 14px;border-radius:10px;background:#4f46e5;color:#fff;text-decoration:none;">Back to Drivers</a>
      </div>
    `;
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
            <div class="stat-item"><span class="stat-value">${fmt(
              drv.totalRides
            )}</span><span class="stat-label">Total Rides</span></div>
            <div class="stat-item"><span class="stat-value">${n(
              drv.rating,
              0
            ).toFixed(1)}</span><span class="stat-label">Avg Rating</span></div>
            <div class="stat-item"><span class="stat-value">${n(
              drv.onTimePercentage,
              0
            )}%</span><span class="stat-label">On Time</span></div>
            <div class="stat-item"><span class="stat-value">${fmt(
              drv.totalKm
            )} KM</span><span class="stat-label">Total KM</span></div>
          </div>
        </div>
      </section>

      <section class="profile-details">
        <div class="detail-section">
          <h3>📋 Driver Information</h3>
          <div class="detail-item"><span class="detail-label">Driver Name</span><span class="detail-value">${esc(
            drv.name
          )}</span></div>
          <div class="detail-item"><span class="detail-label">Age</span><span class="detail-value">${n(
            drv.age,
            0
          )} years</span></div>
          <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">${esc(
            drv.phone
          )}</span></div>
          <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${esc(
            drv.email
          )}</span></div>
          <div class="detail-item"><span class="detail-label">Location</span><span class="detail-value">${esc(
            drv.location
          )}</span></div>
          <div class="detail-item"><span class="detail-label">Experience</span><span class="detail-value">${n(
            drv.experience,
            0
          )} years</span></div>
          <div class="detail-item"><span class="detail-label">Joined</span><span class="detail-value">${esc(
            drv.appliedDate
          )}</span></div>
        </div>

        <div class="detail-section">
          <h3>📊 Driver Statistics</h3>
          <div class="detail-item"><span class="detail-label">Total Rides</span><span class="detail-value">${fmt(
            drv.totalRides
          )}</span></div>
          <div class="detail-item"><span class="detail-label">Average Rating</span><span class="detail-value">${n(
            drv.rating,
            0
          ).toFixed(1)}/5.0</span></div>
          <div class="detail-item"><span class="detail-label">Total Reviews</span><span class="detail-value">${fmt(
            drv.reviews
          )}</span></div>
          <div class="detail-item"><span class="detail-label">On Time %</span><span class="detail-value">${n(
            drv.onTimePercentage,
            0
          )}%</span></div>
          <div class="detail-item"><span class="detail-label">Total Distance</span><span class="detail-value">${fmt(
            drv.totalKm
          )} KM</span></div>
          <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value">${esc(
            String(drv.status).toUpperCase()
          )}</span></div>
        </div>

        <div class="detail-section document-section">
          <h3>📄 Documents & Verification</h3>
          <div class="documents-grid">
            <div class="document-card">
              <div class="document-icon">🆔</div>
              <div class="document-title">NIC Document</div>
              <div class="document-status verified">Verified</div>
              <div class="document-id">ID: ${esc(drv.nicNumber)}</div>
              <div class="document-actions">
                <button class="btn" data-doc="nic">View</button>
                <button class="btn btn-primary" data-doc="nic">Download</button>
              </div>
            </div>
            <div class="document-card">
              <div class="document-icon">🚗</div>
              <div class="document-title">Driving License</div>
              <div class="document-status verified">Verified</div>
              <div class="document-id">License: ${esc(drv.licenseNumber)}</div>
              <div class="document-info">Expires: ${esc(
                drv.licenseExpiry
              )} • Categories: ${esc(String(drv.categories))}</div>
              <div class="document-actions">
                <button class="btn" data-doc="license">View</button>
                <button class="btn btn-primary" data-doc="license">Download</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;

    mount.querySelectorAll(".document-actions .btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.getAttribute("data-doc");
        alert(
          `${type === "nic" ? "NIC" : "License"} document action triggered`
        );
      });
    });
  }

  // ---------- Bootstrap ----------
  document.addEventListener("DOMContentLoaded", () => {
    const id = getIdFromURL();
    if (!Number.isFinite(id))
      return renderEmpty("Missing driver id in the URL.");

    const driver = getNormalizedDriver(id);
    if (!driver) return renderEmpty(`Driver not found for id ${id}.`);

    renderDriver(driver);
  });
})();
