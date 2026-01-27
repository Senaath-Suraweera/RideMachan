// rental-companies.js — list, filters, + register company modal (NOW uses backend)

class RentalCompaniesApp {
  constructor() {
    this.companies = [];
    this.filteredCompanies = [];
    this.minRating = 0;

    // backend endpoint created in your servlet
    this.API_LIST = "/admin/rentalcompanies";

    this.init();
  }

  async init() {
    this.bindElements();
    this.initializeRatingFilter();
    this.bindEventListeners();
    this.bindRegisterCompanyModal();

    await this.loadCompanies();
    this.populateLocationFilter();
    this.applyFilters();
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

  async loadCompanies() {
    this.countEl.textContent = "Loading companies...";

    try {
      const res = await fetch(this.API_LIST, {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (
        !data ||
        data.status !== "success" ||
        !Array.isArray(data.companies)
      ) {
        throw new Error("Unexpected response from server");
      }

      // server already returns fields matching UI:
      // id, name, rating, reviews, location, offersDriver, fleets, phone, email, description
      this.companies = data.companies.map((c) => ({
        id: Number(c.id),
        name: c.name || "",
        rating: Number(c.rating || 0),
        reviews: Number(c.reviews || 0),
        location: c.location || "",
        offersDriver: Boolean(c.offersDriver),
        fleets: Number(c.fleets || 0),
        phone: c.phone || "",
        email: c.email || "",
        description: c.description || "",
      }));

      this.filteredCompanies = [...this.companies];
      this.updateCount();
    } catch (err) {
      console.error("Failed to load companies:", err);
      this.companies = [];
      this.filteredCompanies = [];
      this.grid.innerHTML =
        '<div class="no-results">Failed to load companies from server.</div>';
      this.countEl.textContent = "0 companies";
    }
  }

  populateLocationFilter() {
    const locations = [
      ...new Set(this.companies.map((c) => c.location).filter(Boolean)),
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
      this.updateRatingDisplay(),
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

  /* ===== Register Company modal (unchanged; uses your existing signup endpoint) ===== */
  bindRegisterCompanyModal() {
    const open = () => {
      this.modal.classList.add("show");
      this.modal.setAttribute("aria-hidden", "false");
    };
    const close = () => {
      this.modal.classList.remove("show");
      this.modal.setAttribute("aria-hidden", "true");
      this.formRegister.reset();
    };

    this.btnOpenRegister?.addEventListener("click", open);
    this.btnCloseRegister?.addEventListener("click", close);
    this.btnCancelRegister?.addEventListener("click", close);
    this.modal?.addEventListener("click", (e) => {
      if (e.target === this.modal) close();
    });

    this.formRegister?.addEventListener("submit", async (e) => {
      e.preventDefault();

      const companyname =
        document.getElementById("rcCompanyName")?.value?.trim() || "";
      const companyemail =
        document.getElementById("rcCompanyEmail")?.value?.trim() || "";
      const phone = document.getElementById("rcPhone")?.value?.trim() || "";
      const registrationnumber =
        document.getElementById("rcRegNo")?.value?.trim() || "";
      const taxid = document.getElementById("rcTaxId")?.value?.trim() || "";
      const street = document.getElementById("rcStreet")?.value?.trim() || "";
      const city = document.getElementById("rcCity")?.value?.trim() || "";
      const description =
        document.getElementById("rcDescription")?.value?.trim() || "";
      const terms = document.getElementById("rcTerms")?.value?.trim() || "";
      const password = document.getElementById("rcPassword")?.value || "";
      const password2 = document.getElementById("rcPassword2")?.value || "";

      const certificateInput = document.getElementById("rcCertificate");
      const taxDocInput = document.getElementById("rcTaxDoc");
      const certificateFile = certificateInput?.files?.[0];
      const taxDocFile = taxDocInput?.files?.[0];

      if (!companyname || !companyemail || !city) {
        alert("Please fill Company name, Company email, and City.");
        return;
      }
      if (password.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
      }
      if (password !== password2) {
        alert("Passwords do not match.");
        return;
      }
      if (!certificateFile || !taxDocFile) {
        alert("Please upload BOTH Business certificate and Tax document.");
        return;
      }

      const fd = new FormData();
      fd.append("companyname", companyname);
      fd.append("email", companyemail);
      fd.append("phone", phone);
      fd.append("registrationnumber", registrationnumber);
      fd.append("taxid", taxid);
      fd.append("street", street);
      fd.append("city", city);
      fd.append("description", description);
      fd.append("terms", terms);
      fd.append("password", password);
      fd.append("certificate", certificateFile);
      fd.append("taxdocument", taxDocFile);

      try {
        const res = await fetch("/rentalcompanies/signup", {
          method: "POST",
          body: fd,
        });

        if (!res.ok) {
          const ct = res.headers.get("content-type") || "";
          const msg = ct.includes("application/json")
            ? (await res.json().catch(() => ({}))).message
            : await res.text().catch(() => "");
          throw new Error(msg || `Signup failed (HTTP ${res.status})`);
        }

        alert("Company registration submitted successfully!");
        close();

        // refresh list after signup (in case your admin auto-creates company)
        await this.loadCompanies();
        this.populateLocationFilter();
        this.applyFilters();
      } catch (err) {
        alert(err?.message || "Signup failed");
      }
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
      const desc = (c.description || "").toLowerCase();

      if (
        filters.name &&
        !c.name.toLowerCase().includes(filters.name) &&
        !desc.includes(filters.name)
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
      <div class="company-card" data-company-id="${company.id}" onclick="app.viewCompany(${company.id})">
        <div class="company-avatar"><span class="avatar-text">${initials}</span></div>
        <div class="company-info">
          <h3 class="company-name">${this.escapeHtml(company.name)}</h3>
          <div class="company-meta">
            <div class="meta-item">📍 ${this.escapeHtml(company.location)}</div>
            <div class="meta-item">👨‍✈️ ${company.offersDriver ? "Driver available" : "Self-drive only"}</div>
            <div class="meta-item">🚗 ${company.fleets} vehicles</div>
          </div>
          <p class="company-desc">${this.escapeHtml(company.description || "")}</p>
          <div class="company-rating">
            <div class="rating-stars">${stars}</div>
            <span class="rating-value">${Number(company.rating || 0).toFixed(1)}</span>
            <span class="review-count">(${company.reviews || 0})</span>
          </div>
        </div>
      </div>
    `;
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

    // optional cache (used only if needed)
    if (c) {
      sessionStorage.setItem(
        "selectedCompany",
        JSON.stringify({ id: c.id, name: c.name }),
      );
    }

    const url = new URL("rental-company-view.html", location.href);
    url.searchParams.set("id", String(id));
    location.href = url.toString();
  }

  // utils
  parseNumber(v) {
    const n = parseFloat(v);
    return Number.isNaN(n) ? null : n;
  }

  getInitials(name) {
    return String(name || "")
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  renderStars(r) {
    const full = Math.floor(Number(r || 0));
    return Array.from(
      { length: 5 },
      (_, i) => `<span class="star ${i < full ? "active" : ""}">⭐</span>`,
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
