// Drivers page behavior — list, filters, register driver modal
class DriversManager {
  constructor() {
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
    this.minRating = 0;
    this.init();
  }

  init() {
    this.cacheEls();
    this.setupEventListeners();
    this.initializeRatingFilter();
    this.bindRegisterModal(); // NEW
    this.renderDrivers();
    this.updateCount();
  }

  cacheEls() {
    this.grid = document.getElementById("driversGrid");
    this.nameInput = document.getElementById("driverNameFilter");
    this.licenseInput = document.getElementById("licenseFilter");
    this.sortInput = document.getElementById("sortOrder");
    this.searchBtn = document.querySelector(".search-actions .btn-primary");
    this.clearBtn = document.querySelector(".search-actions .btn-secondary");

    // Modal bits
    this.btnOpenRegister = document.getElementById("btnOpenRegisterDriver");
    this.modal = document.getElementById("registerDriverModal");
    this.btnCloseRegister = document.getElementById("closeRegisterDriver");
    this.btnCancelRegister = document.getElementById("cancelRegisterDriver");
    this.formRegister = document.getElementById("registerDriverForm");
  }

  setupEventListeners() {
    this.searchBtn?.addEventListener("click", () => this.searchDrivers());
    this.clearBtn?.addEventListener("click", () => this.clearFilters());
    [this.nameInput, this.licenseInput].forEach((el) =>
      el?.addEventListener("input", () => this.applyFilters())
    );
    this.sortInput?.addEventListener("change", () => this.applyFilters());

    // Card click → driver view
    this.grid?.addEventListener("click", (e) => {
      const card = e.target.closest(".driver-card");
      if (!card || !this.grid.contains(card)) return;
      const id = Number(card.dataset.driverId);
      const driver = this.drivers.find((d) => d.id === id);
      if (driver)
        sessionStorage.setItem("selectedDriver", JSON.stringify(driver));
      location.href = `driver-view.html?id=${id}`;
    });
    this.grid?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const card = e.target.closest(".driver-card");
      if (!card || !this.grid.contains(card)) return;
      const id = Number(card.dataset.driverId);
      location.href = `driver-view.html?id=${id}`;
    });
  }

  /* ===== Register Driver modal ===== */
  bindRegisterModal() {
    const open = () => this.modal?.classList.add("show");
    const close = () => {
      this.modal?.classList.remove("show");
      this.formRegister?.reset();
    };

    this.btnOpenRegister?.addEventListener("click", open);
    this.btnCloseRegister?.addEventListener("click", close);
    this.btnCancelRegister?.addEventListener("click", close);
    this.modal?.addEventListener("click", (e) => {
      if (e.target === this.modal) close();
    });

    this.formRegister?.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("rdName").value.trim();
      const company = document.getElementById("rdCompany").value.trim();
      const licenseNumber = document.getElementById("rdLicense").value.trim();
      if (!name || !licenseNumber)
        return alert("Please fill Name and License number.");

      const nicNumber = document.getElementById("rdNIC").value.trim();
      const email = document.getElementById("rdEmail").value.trim();
      const phone = document.getElementById("rdPhone").value.trim();
      const location = document.getElementById("rdLocation").value.trim();
      const appliedDate =
        document.getElementById("rdApplied").value ||
        new Date().toISOString().slice(0, 10);
      const rating = Number(document.getElementById("rdRating").value || 0);
      const reviews = Number(document.getElementById("rdReviews").value || 0);
      const description = document.getElementById("rdDesc").value.trim();

      const newDriver = {
        id: Date.now(),
        name,
        company,
        licenseNumber,
        nicNumber,
        email,
        phone,
        location,
        appliedDate,
        rating,
        reviews,
        description,
      };
      this.drivers.unshift(newDriver);
      this.filteredDrivers = [...this.drivers];
      this.applyFilters();
      close();
    });
  }

  /* ===== Filters ===== */
  initializeRatingFilter() {
    const container = document.getElementById("ratingFilter");
    if (!container) return;
    const stars = Array.from(container.querySelectorAll(".star"));
    const paint = (v) =>
      stars.forEach((s) =>
        s.classList.toggle("active", Number(s.dataset.value) <= v)
      );
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
  searchDrivers() {
    this.applyFilters();
  }
  applyFilters() {
    const name = (this.nameInput?.value || "").toLowerCase();
    const lic = (this.licenseInput?.value || "").toLowerCase();
    const order = this.sortInput?.value || "ascending";
    this.filteredDrivers = this.drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(name) &&
        (d.licenseNumber.toLowerCase().includes(lic) ||
          (d.nicNumber || "").toLowerCase().includes(lic)) &&
        d.rating >= (this.minRating || 0)
    );
    this.filteredDrivers.sort((a, b) =>
      order === "ascending"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
    this.renderDrivers();
    this.updateCount();
  }
  clearFilters() {
    if (this.nameInput) this.nameInput.value = "";
    if (this.licenseInput) this.licenseInput.value = "";
    if (this.sortInput) this.sortInput.value = "ascending";
    this.minRating = 0;
    document
      .querySelectorAll("#ratingFilter .star")
      .forEach((s) => s.classList.remove("active"));
    this.filteredDrivers = [...this.drivers];
    this.renderDrivers();
    this.updateCount();
  }

  /* ===== Render ===== */
  renderDrivers() {
    if (!this.grid) return;
    this.grid.innerHTML = "";
    this.filteredDrivers.forEach((d) =>
      this.grid.appendChild(this.createCard(d))
    );
  }
  createCard(d) {
    const card = document.createElement("div");
    card.className = "driver-card";
    card.dataset.driverId = d.id;
    card.tabIndex = 0;
    card.role = "button";
    const initials = this.getInitials(d.name);
    const stars = this.generateStarsHTML(d.rating);
    card.innerHTML = `
      <div class="driver-avatar"><span class="avatar-text">${initials}</span></div>
      <div class="driver-info">
        <h4 class="driver-name">${this.escape(d.name)}</h4>
        <p class="driver-company">${this.escape(d.company || "")}</p>
        <div class="driver-details">
          <span>📍 ${this.escape(d.location || "—")}</span>
          <span>🪪 ${this.escape(d.licenseNumber)}</span>
          <span>📅 Applied ${this.escape(d.appliedDate || "—")}</span>
        </div>
        <div class="driver-description"><p>${this.escape(
          d.description || ""
        )}</p></div>
        <div class="driver-rating">
          <div class="rating-stars-inline">${stars}</div>
          <span class="rating-value">${(Number(d.rating) || 0).toFixed(
            1
          )}</span>
          <span class="review-count">${Number(d.reviews || 0)} reviews</span>
        </div>
      </div>`;
    return card;
  }
  generateStarsHTML(r) {
    const f = Math.round(r || 0);
    return Array.from(
      { length: 5 },
      (_, i) => `<span class="star ${i + 1 <= f ? "active" : ""}">⭐</span>`
    ).join("");
  }
  updateCount() {
    const el = document.querySelector(".drivers-section .section-title");
    if (el) el.textContent = `Driver List (${this.filteredDrivers.length})`;
  }

  /* Utils */
  getInitials(name) {
    const p = name.trim().split(/\s+/);
    return (
      ((p[0] || "")[0] || "").toUpperCase() +
      ((p[1] || "")[0] || "").toUpperCase()
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
window.addEventListener("DOMContentLoaded", () => {
  window.driversManager = new DriversManager();
});
function searchDrivers() {
  window.driversManager?.searchDrivers();
}
function clearFilters() {
  window.driversManager?.clearFilters();
}
