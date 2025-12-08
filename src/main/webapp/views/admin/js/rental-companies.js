// rental-companies.js — list, filters, + register company modal

const DEFAULT_COMPANIES = [
  {
    id: 1,
    name: "ABC Rentals",
    rating: 4.7,
    reviews: 128,
    location: "Colombo",
    offersDriver: true,
    fleets: 56,
    phone: "+94 11 234 5678",
    email: "contact@abcrentals.lk",
    description:
      "Well-maintained fleet, popular for city trips and airport runs.",
  },
  {
    id: 2,
    name: "Hill Country Motors",
    rating: 4.3,
    reviews: 64,
    location: "Kandy",
    offersDriver: false,
    fleets: 22,
    phone: "+94 81 555 0192",
    email: "info@hillcountry.lk",
    description: "Great for hill country routes. Self-drive specialists.",
  },
  {
    id: 3,
    name: "Beachside Wheels",
    rating: 4.5,
    reviews: 91,
    location: "Galle",
    offersDriver: true,
    fleets: 34,
    phone: "+94 91 222 3344",
    email: "hello@beachsidewheels.lk",
    description: "Premium SUVs and vans for coastal trips.",
  },
  {
    id: 4,
    name: "Negombo Express",
    rating: 3.9,
    reviews: 37,
    location: "Negombo",
    offersDriver: true,
    fleets: 18,
    phone: "+94 31 222 1188",
    email: "support@negomboexpress.lk",
    description: "Airport transfer experts with 24/7 availability.",
  },
  {
    id: 5,
    name: "Central Auto Hire",
    rating: 4.9,
    reviews: 210,
    location: "Colombo",
    offersDriver: true,
    fleets: 80,
    phone: "+94 11 777 0000",
    email: "team@centralauto.lk",
    description: "Largest fleet, enterprise accounts, and VIP support.",
  },
];

class RentalCompaniesApp {
  constructor() {
    this.companies = [...DEFAULT_COMPANIES];
    this.filteredCompanies = [...this.companies];
    this.minRating = 0;
    this.init();
  }

  init() {
    this.bindElements();
    this.populateLocationFilter();
    this.initializeRatingFilter();
    this.bindEventListeners();
    this.applyFilters();
    this.bindRegisterCompanyModal(); // NEW
  }

  bindElements() {
    this.grid = document.getElementById("companiesGrid");
    this.countEl = document.querySelector(".companies-count");
    this.nameEl = document.getElementById("nameSearch");
    this.locationEl = document.getElementById("locationFilter");
    this.sortEl = document.getElementById("sortSelect");
    this.driverEl = document.getElementById("withDriverFilter");
    this.fleetMinEl = document.getElementById("fleetMin");
    this.fleetMaxEl = document.getElementById("fleetMax");
    this.reviewsMinEl = document.getElementById("reviewsMin");
    this.ratingEl = document.getElementById("ratingFilter");

    // modal bits
    this.btnOpenRegister = document.getElementById("btnOpenRegisterCompany");
    this.modal = document.getElementById("registerCompanyModal");
    this.btnCloseRegister = document.getElementById("closeRegisterCompany");
    this.btnCancelRegister = document.getElementById("cancelRegisterCompany");
    this.formRegister = document.getElementById("registerCompanyForm");

    this.searchBtn = document.getElementById("btnSearch");
    this.resetBtn = document.getElementById("btnReset");
  }

  populateLocationFilter() {
    const locations = [
      ...new Set(this.companies.map((c) => c.location)),
    ].sort();
    // ensure "All" stays on top; we clear and rebuild
    this.locationEl.innerHTML = "";
    const all = document.createElement("option");
    all.value = "";
    all.textContent = "All";
    this.locationEl.appendChild(all);
    locations.forEach((loc) => {
      const opt = document.createElement("option");
      opt.value = loc;
      opt.textContent = loc;
      this.locationEl.appendChild(opt);
    });
  }

  initializeRatingFilter() {
    const stars = this.ratingEl.querySelectorAll(".star");
    stars.forEach((star) => {
      star.addEventListener("click", () => {
        this.minRating = parseInt(star.dataset.value);
        this.updateRatingDisplay();
        this.applyFilters();
      });
      star.addEventListener("mouseenter", () => {
        this.highlightStars(parseInt(star.dataset.value));
      });
    });
    this.ratingEl.addEventListener("mouseleave", () =>
      this.updateRatingDisplay()
    );
  }

  highlightStars(rating) {
    const stars = this.ratingEl.querySelectorAll(".star");
    stars.forEach((star, i) => star.classList.toggle("active", i < rating));
  }
  updateRatingDisplay() {
    this.highlightStars(this.minRating);
  }

  bindEventListeners() {
    const onChange = () => this.applyFilters();
    const onType = this.debounce(() => this.applyFilters(), 300);

    this.nameEl.addEventListener("input", onType);
    this.fleetMinEl.addEventListener("input", onType);
    this.fleetMaxEl.addEventListener("input", onType);
    this.reviewsMinEl.addEventListener("input", onType);

    this.locationEl.addEventListener("change", onChange);
    this.sortEl.addEventListener("change", onChange);
    this.driverEl.addEventListener("change", onChange);

    this.searchBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.applyFilters();
    });
    this.resetBtn.addEventListener("click", (e) => {
      e.preventDefault();
      this.resetFilters();
    });
  }

  /* ===== Register Company modal ===== */
  bindRegisterCompanyModal() {
    const open = () => this.modal.classList.add("show");
    const close = () => {
      this.modal.classList.remove("show");
      this.formRegister.reset();
    };

    this.btnOpenRegister?.addEventListener("click", open);
    this.btnCloseRegister?.addEventListener("click", close);
    this.btnCancelRegister?.addEventListener("click", close);
    this.modal?.addEventListener("click", (e) => {
      if (e.target === this.modal) close();
    });

    this.formRegister?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("rcName").value.trim();
      const location = document.getElementById("rcLocation").value.trim();
      const fleets =
        this.parseNumber(document.getElementById("rcFleet").value) || 0;
      const offersDriver = document.getElementById("rcWithDriver").checked;
      const phone = document.getElementById("rcPhone").value.trim();
      const email = document.getElementById("rcEmail").value.trim();
      const description = document.getElementById("rcDesc").value.trim();

      if (!name || !location) {
        alert("Please fill at least Company name and Location.");
        return;
      }

      const newCompany = {
        id: Date.now(),
        name,
        rating: 0,
        reviews: 0,
        location,
        offersDriver,
        fleets,
        phone,
        email,
        description,
      };

      this.companies.unshift(newCompany); // add to top
      this.populateLocationFilter(); // refresh locations
      this.applyFilters(); // re-render grid
      close();
    });
  }

  applyFilters() {
    const filters = {
      name: this.nameEl.value.toLowerCase().trim(),
      location: this.locationEl.value,
      sort: this.sortEl.value,
      withDriver: this.driverEl.checked,
      fleetMin: this.parseNumber(this.fleetMinEl.value),
      fleetMax: this.parseNumber(this.fleetMaxEl.value),
      reviewsMin: this.parseNumber(this.reviewsMinEl.value),
      minRating: this.minRating,
    };

    this.filteredCompanies = this.companies.filter((c) => {
      if (
        filters.name &&
        !c.name.toLowerCase().includes(filters.name) &&
        !c.description.toLowerCase().includes(filters.name)
      )
        return false;
      if (filters.location && c.location !== filters.location) return false;
      if (filters.withDriver && !c.offersDriver) return false;
      if (filters.fleetMin !== null && c.fleets < filters.fleetMin)
        return false;
      if (filters.fleetMax !== null && c.fleets > filters.fleetMax)
        return false;
      if (filters.reviewsMin !== null && c.reviews < filters.reviewsMin)
        return false;
      if (filters.minRating > 0 && c.rating < filters.minRating) return false;
      return true;
    });

    this.sortCompanies(filters.sort);
    this.renderCompanies();
    this.updateCount();
  }

  sortCompanies(sortBy) {
    switch (sortBy) {
      case "name_desc":
        this.filteredCompanies.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "rating_desc":
        this.filteredCompanies.sort((a, b) => b.rating - a.rating);
        break;
      case "rating_asc":
        this.filteredCompanies.sort((a, b) => a.rating - b.rating);
        break;
      default:
        this.filteredCompanies.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  renderCompanies() {
    if (!this.filteredCompanies.length) {
      this.grid.innerHTML =
        '<div class="no-results">No companies match your filters. Try adjusting your search criteria.</div>';
      return;
    }
    this.grid.innerHTML = this.filteredCompanies
      .map((c) => this.createCompanyCard(c))
      .join("");
  }

  createCompanyCard(company) {
    const initials = this.getInitials(company.name);
    const stars = this.renderStars(company.rating);
    return `
    <div class="company-card" data-company-id="${
      company.id
    }" onclick="app.viewCompany(${company.id})">
      <div class="company-avatar"><span class="avatar-text">${initials}</span></div>
      <div class="company-info">
        <h3 class="company-name">${this.escapeHtml(company.name)}</h3>
        <div class="company-meta">
          <div class="meta-item">📍 ${this.escapeHtml(company.location)}</div>
          <div class="meta-item">👨‍✈️ ${
            company.offersDriver ? "Driver available" : "Self-drive only"
          }</div>
          <div class="meta-item">🚗 ${company.fleets} vehicles</div>
        </div>
        <p class="company-desc">${this.escapeHtml(
          company.description || ""
        )}</p>
        <div class="company-rating">
          <div class="rating-stars">${stars}</div>
          <span class="rating-value">${Number(company.rating).toFixed(1)}</span>
          <span class="review-count">(${company.reviews})</span>
        </div>
      </div>
    </div>`;
  }

  updateCount() {
    const total = this.companies.length;
    const filtered = this.filteredCompanies.length;
    this.countEl.textContent = `Showing ${filtered} of ${total} companies`;
  }

  resetFilters() {
    this.nameEl.value = "";
    this.locationEl.value = "";
    this.sortEl.value = "name_asc";
    this.driverEl.checked = false;
    this.fleetMinEl.value = "";
    this.fleetMaxEl.value = "";
    this.reviewsMinEl.value = "";
    this.minRating = 0;
    this.updateRatingDisplay();
    this.applyFilters();
  }

  viewCompany(id) {
    const c = this.companies.find((x) => x.id === id);
    if (!c) return;
    sessionStorage.setItem(
      "selectedCompany",
      JSON.stringify({ id: c.id, name: c.name })
    );
    const url = new URL("rental-company-view.html", location.href);
    url.searchParams.set("id", String(c.id));
    url.searchParams.set("name", c.name);
    location.href = url.toString();
  }

  messageCompany(id) {
    const c = this.companies.find((x) => x.id === id);
    alert(`Starting conversation with ${c ? c.name : "Unknown Company"}`);
  }

  // utils
  parseNumber(v) {
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }
  getInitials(name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  renderStars(r) {
    const full = Math.floor(r || 0);
    return Array.from(
      { length: 5 },
      (_, i) => `<span class="star ${i < full ? "active" : ""}">⭐</span>`
    ).join("");
  }
  escapeHtml(t) {
    const d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  }
  debounce(fn, wait) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), wait);
    };
  }
}

let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new RentalCompaniesApp();
});
