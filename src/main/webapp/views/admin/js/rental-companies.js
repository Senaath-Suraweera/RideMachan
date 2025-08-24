// Listing page: filters + grid + navigate to view page
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // Demo data (replace with API)
  const companies = [
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

  let minRating = 0;
  let filtered = [...companies];

  // Init
  document.addEventListener("DOMContentLoaded", () => {
    bindFilters();
    apply();
  });

  function bindFilters() {
    $("#nameSearch")?.addEventListener("input", apply);
    $("#locationSearch")?.addEventListener("input", apply);
    $("#sortSelect")?.addEventListener("change", apply);
    $("#withDriverFilter")?.addEventListener("change", apply);

    // stars
    const stars = $$("#ratingFilter .star");
    const paint = (v) =>
      stars.forEach((s) =>
        s.classList.toggle("active", Number(s.dataset.value) <= v)
      );
    stars.forEach((star) => {
      star.addEventListener("click", () => {
        minRating = Number(star.dataset.value || 0);
        paint(minRating);
        apply();
      });
      star.addEventListener("mouseenter", () =>
        paint(Number(star.dataset.value || 0))
      );
    });
    $("#ratingFilter")?.addEventListener("mouseleave", () => paint(minRating));

    // expose buttons used in HTML
    window.searchCompanies = apply;
    window.clearFilters = () => {
      $("#nameSearch").value = "";
      $("#locationSearch").value = "";
      $("#sortSelect").value = "name_asc";
      $("#withDriverFilter").checked = false;
      minRating = 0;
      paint(0);
      apply();
    };

    // tabs (stubs)
    window.showPendingRequests = () => {
      location.href = "rental-company-requests.html";
    };
    window.showAllCompanies = () => apply();
  }

  function apply() {
    const qName = ($("#nameSearch")?.value || "").toLowerCase().trim();
    const qLoc = ($("#locationSearch")?.value || "").toLowerCase().trim();
    const sort = $("#sortSelect")?.value || "name_asc";
    const withD = $("#withDriverFilter")?.checked || false;

    filtered = companies.filter((c) => {
      const byName = c.name.toLowerCase().includes(qName);
      const byLoc = c.location.toLowerCase().includes(qLoc);
      const byDrv = withD ? !!c.withDriver : true;
      const byRate = c.rating >= (minRating || 0);
      return byName && byLoc && byDrv && byRate;
    });

    switch (sort) {
      case "name_asc":
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "rating_desc":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "rating_asc":
        filtered.sort((a, b) => a.rating - b.rating);
        break;
    }

    render();
  }

  function render() {
    const grid = $("#companiesGrid");
    grid.innerHTML = "";
    filtered.forEach((c) => grid.appendChild(card(c)));
  }

  function card(c) {
    const el = document.createElement("div");
    el.className = "company-card";
    el.dataset.companyId = c.id;
    el.innerHTML = `
      <a class="card-link" href="rental-company-view.html?id=${
        c.id
      }" aria-label="Open ${escapeHTML(c.name)}">
        <div class="company-image"><span class="image-placeholder">Image</span></div>
        <div class="company-info">
          <h3 class="company-name">${escapeHTML(c.name)}</h3>
          <div class="company-location">${escapeHTML(c.location)}</div>
          <div class="company-description"><p>${escapeHTML(
            c.description
          )}</p></div>
          <div class="company-rating">
            <div class="rating-stars">${stars(c.rating)}</div>
            <span class="review-count">No of reviews: ${c.reviews}</span>
          </div>
        </div>
      </a>
    `;
    // keep fast-load behavior
    el.querySelector(".card-link").addEventListener("click", () => {
      sessionStorage.setItem("selectedCompany", JSON.stringify({ id: c.id }));
    });
    return el;
  }

  function stars(r) {
    const full = Math.round(r);
    let html = "";
    for (let i = 1; i <= 5; i++)
      html += `<span class="star ${i <= full ? "active" : ""}">⭐</span>`;
    return html;
  }

  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }
})();
