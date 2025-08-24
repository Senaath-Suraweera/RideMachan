// Drivers page behavior — mirrors CustomersManager filters (name, second field, sort, min rating)
class DriversManager {
  constructor() {
    // Seed demo data (replace with API)
    this.drivers = [
      {
        id: 1,
        name: "Rajesh Kumar",
        company: "Lanka Express",
        licenseNumber: "B1234567",
        nicNumber: "901234567V",
        email: "rajesh.kumar@lankaexpress.com",
        phone: "+94 77 123 4567",
        location: "Colombo",
        appliedDate: "2024-01-13",
        rating: 4.9,
        reviews: 156,
        description:
          "Top-rated driver with extensive knowledge of Colombo routes.",
      },
      {
        id: 2,
        name: "Maria Fernando",
        company: "Metro Cabs",
        licenseNumber: "B2345678",
        nicNumber: "912345678V",
        email: "maria.fernando@metrocabs.lk",
        phone: "+94 71 555 0123",
        location: "Negombo",
        appliedDate: "2024-01-14",
        rating: 4.6,
        reviews: 89,
        description:
          "Specialist in airport transfers. Fluent in English and Sinhala.",
      },
      {
        id: 3,
        name: "John Silva",
        company: "City Taxi Service",
        licenseNumber: "B3456789",
        nicNumber: "923456789V",
        email: "john.silva@citytaxi.com",
        phone: "+94 76 987 6543",
        location: "Kandy",
        appliedDate: "2024-01-15",
        rating: 4.8,
        reviews: 124,
        description: "8 years' experience, clean record, excellent service.",
      },
    ];

    this.filteredDrivers = [...this.drivers];

    // Minimum rating filter state (0 = off), mirroring customers.js
    this.minRating = 0;

    this.init();
  }

  // ---------- Init ----------
  init() {
    this.setupEventListeners();
    this.initializeRatingFilter(); // new stars in filter row
    this.renderDrivers();
    this.updateCount();
  }

  setupEventListeners() {
    // Search / Clear actions (same pattern as customers.js)
    const searchBtn = document.querySelector(".search-actions .btn-primary");
    const clearBtn = document.querySelector(".search-actions .btn-secondary");
    if (searchBtn)
      searchBtn.addEventListener("click", () => this.searchDrivers());
    if (clearBtn) clearBtn.addEventListener("click", () => this.clearFilters());

    // Live filter inputs
    const nameInput = document.getElementById("driverNameFilter");
    const licenseInput = document.getElementById("licenseFilter");
    const sortInput = document.getElementById("sortOrder");
    [nameInput, licenseInput, sortInput].forEach((el) => {
      if (!el) return;
      const evt = el.tagName === "SELECT" ? "change" : "input";
      el.addEventListener(evt, () => this.applyFilters());
    });

    // Card click → navigate to driver-view.html?id=ID
    const grid = document.getElementById("driversGrid");
    if (grid) {
      grid.addEventListener("click", (e) => {
        const card = e.target.closest(".driver-card");
        if (!card || !grid.contains(card)) return;
        const id = Number(card.dataset.driverId);
        if (Number.isFinite(id)) {
          const driver = this.drivers.find((d) => d.id === id);
          if (driver) {
            sessionStorage.setItem("selectedDriver", JSON.stringify(driver));
          }
          window.location.href = `driver-view.html?id=${id}`;
        }
      });
      grid.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        const card = e.target.closest(".driver-card");
        if (!card || !grid.contains(card)) return;
        const id = Number(card.dataset.driverId);
        if (Number.isFinite(id))
          window.location.href = `driver-view.html?id=${id}`;
      });
    }
  }

  // ---------- Rating stars in filter bar (like Customers) ----------
  initializeRatingFilter() {
    const container = document.getElementById("ratingFilter");
    if (!container) return;
    const stars = Array.from(container.querySelectorAll(".star"));

    const paint = (value) => {
      stars.forEach((s) => {
        const v = Number(s.dataset.value || 0);
        s.classList.toggle("active", v <= value);
      });
    };

    stars.forEach((star) => {
      star.addEventListener("click", () => {
        this.minRating = Number(star.dataset.value || 0);
        paint(this.minRating);
        this.applyFilters();
      });
      star.addEventListener("mouseenter", () =>
        paint(Number(star.dataset.value || 0))
      );
    });

    container.addEventListener("mouseleave", () => paint(this.minRating));
    paint(this.minRating);
  }

  // ---------- Filtering / Sorting ----------
  searchDrivers() {
    this.applyFilters();
  }

  applyFilters() {
    const nameFilter = (
      document.getElementById("driverNameFilter")?.value || ""
    ).toLowerCase();
    const licFilter = (
      document.getElementById("licenseFilter")?.value || ""
    ).toLowerCase();
    const sortOrder =
      document.getElementById("sortOrder")?.value || "ascending";

    this.filteredDrivers = this.drivers.filter((d) => {
      const byName = d.name.toLowerCase().includes(nameFilter);
      const byLicense =
        d.licenseNumber.toLowerCase().includes(licFilter) ||
        (d.nicNumber || "").toLowerCase().includes(licFilter);
      const byRating = d.rating >= (this.minRating || 0);
      return byName && byLicense && byRating;
    });

    this.filteredDrivers.sort((a, b) => {
      const c = a.name.localeCompare(b.name);
      return sortOrder === "ascending" ? c : -c;
    });

    this.renderDrivers();
    this.updateCount();
  }

  clearFilters() {
    const nameInput = document.getElementById("driverNameFilter");
    const licenseInput = document.getElementById("licenseFilter");
    const sortInput = document.getElementById("sortOrder");
    if (nameInput) nameInput.value = "";
    if (licenseInput) licenseInput.value = "";
    if (sortInput) sortInput.value = "ascending";

    // Reset min rating and unpaint
    this.minRating = 0;
    document
      .querySelectorAll("#ratingFilter .star")
      .forEach((s) => s.classList.remove("active"));

    this.filteredDrivers = [...this.drivers];
    this.renderDrivers();
    this.updateCount();
  }

  // ---------- Render ----------
  renderDrivers() {
    const grid = document.getElementById("driversGrid");
    if (!grid) return;
    grid.innerHTML = "";
    this.filteredDrivers.forEach((driver) =>
      grid.appendChild(this.createCard(driver))
    );
  }

  createCard(driver) {
    const card = document.createElement("div");
    card.className = "driver-card";
    card.dataset.driverId = driver.id;
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${driver.name}'s profile`);

    const initials = this.getInitials(driver.name);
    const starsHTML = this.generateStarsHTML(driver.rating);

    card.innerHTML = `
      <div class="driver-avatar"><span class="avatar-text">${initials}</span></div>
      <div class="driver-info">
        <h4 class="driver-name">${this.escape(driver.name)}</h4>
        <p class="driver-company">${this.escape(driver.company)}</p>

        <div class="driver-details">
          <span>📍 ${this.escape(driver.location)}</span>
          <span>🪪 ${this.escape(driver.licenseNumber)}</span>
          <span>📅 Applied ${this.escape(driver.appliedDate)}</span>
        </div>

        <div class="driver-description"><p>${this.escape(
          driver.description
        )}</p></div>

        <div class="driver-rating">
          <div class="rating-stars-inline">${starsHTML}</div>
          <span class="rating-value">${driver.rating.toFixed(1)}</span>
          <span class="review-count">${driver.reviews} reviews</span>
        </div>
      </div>
    `;
    return card;
  }

  generateStarsHTML(rating) {
    const filled = Math.round(rating);
    let html = "";
    for (let i = 1; i <= 5; i++) {
      html += `<span class="star ${i <= filled ? "active" : ""}">⭐</span>`;
    }
    return html;
  }

  updateCount() {
    const el = document.querySelector(".drivers-section .section-title");
    if (el) el.textContent = `Driver List (${this.filteredDrivers.length})`;
  }

  // ---------- Utils ----------
  getInitials(name) {
    const parts = name.trim().split(/\s+/);
    return (
      ((parts[0] || "")[0] || "").toUpperCase() +
      ((parts[1] || "")[0] || "").toUpperCase()
    );
  }
  escape(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}

/* Bootstrap manager and inline helpers (same pattern as customers.js) */
window.addEventListener("DOMContentLoaded", () => {
  window.driversManager = new DriversManager();
});
function searchDrivers() {
  window.driversManager?.searchDrivers();
}
function clearFilters() {
  window.driversManager?.clearFilters();
}
