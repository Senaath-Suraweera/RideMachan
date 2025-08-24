// Individual Renters/Drivers JavaScript
class DriversManager {
  constructor() {
    this.drivers = [
      {
        id: 1,
        name: "Rajesh Kumar",
        company: "Lanka Express",
        rating: 4.9,
        reviews: 156,
        description:
          "Top-rated driver with extensive knowledge of Colombo routes. Available 24/7.",
        appliedDate: "1/13/2024",
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
        appliedDate: "1/14/2024",
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
        appliedDate: "1/15/2024",
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

    this.filteredDrivers = [...this.drivers];
    this.currentDriver = null;
    this.init();
  }

  init() {
    this.renderDrivers();
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Search
    const searchInput = document.getElementById("driverSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchDrivers(e.target.value);
      });
    }

    // Sort
    const sortSelect = document.getElementById("sortOrder");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this.sortDrivers(e.target.value);
      });
    }

    // Close modals when clicking the backdrop
    window.addEventListener("click", (e) => {
      const driverModal = document.getElementById("driverModal");
      const registerModal = document.getElementById("registerDriverModal");
      if (e.target === driverModal) this.closeDriverModal();
      if (e.target === registerModal) this.closeRegisterDriverModal();
    });

    // ✅ Driver card clicks (delegate on the grid, not on document)
    const grid = document.getElementById("driversGrid");
    if (grid) {
      grid.addEventListener("click", (e) => {
        const card = e.target.closest(".driver-card");
        if (!card || !grid.contains(card)) return;
        const driverId = Number(card.dataset.driverId);
        if (Number.isFinite(driverId)) this.showDriverProfile(driverId);
      });

      // Keyboard accessibility: Enter to open
      grid.addEventListener("keydown", (e) => {
        if (e.key !== "Enter") return;
        const card = e.target.closest(".driver-card");
        if (!card || !grid.contains(card)) return;
        const driverId = Number(card.dataset.driverId);
        if (Number.isFinite(driverId)) this.showDriverProfile(driverId);
      });
    }
  }

  renderDrivers() {
    const container = document.getElementById("driversGrid");
    if (!container) return;

    container.innerHTML = "";
    this.filteredDrivers.forEach((driver) => {
      const driverCard = this.createDriverCard(driver);
      container.appendChild(driverCard);
    });
  }

  createDriverCard(driver) {
    const card = document.createElement("div");
    card.className = "driver-card";
    card.dataset.driverId = driver.id;

    // Accessibility
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open ${driver.name}'s profile`);

    const initials = driver.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
    const starsHTML = this.generateStarsHTML(driver.rating);

    card.innerHTML = `
      <div class="driver-header">
        <div class="driver-avatar">
          <span class="avatar-text">${initials}</span>
        </div>
        <div class="driver-basic-info">
          <h3 class="driver-name">${driver.name}</h3>
          <p class="driver-company">${driver.company}</p>
          <div class="driver-rating">
            <span class="rating-value">${driver.rating}</span>
            <div class="rating-stars">${starsHTML}</div>
            <span class="review-count">${driver.reviews} reviews</span>
          </div>
        </div>
      </div>

      <div class="driver-description">
        <p>${driver.description}</p>
      </div>

      <div class="driver-meta">
        <span class="meta-item">Applied: ${driver.appliedDate}</span>
      </div>
    `;

    return card;
  }

  generateStarsHTML(rating) {
    let starsHTML = "";
    for (let i = 1; i <= 5; i++) {
      const activeClass = i <= Math.floor(rating) ? "active" : "";
      starsHTML += `<span class="star ${activeClass}">★</span>`;
    }
    return starsHTML;
  }

  showDriverProfile(driverId) {
    const driver = this.drivers.find((d) => d.id === Number(driverId));
    if (!driver) return;
    this.currentDriver = driver;
    this.loadDriverProfileModal(driver);
  }

  loadDriverProfileModal(driver) {
    const modal = document.getElementById("driverModal");
    const content = document.getElementById("driverProfileContent");
    const title = document.getElementById("driverModalTitle");

    title.textContent = `${driver.name} - Driver Profile`;

    const initials = driver.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();

    content.innerHTML = `
      <div class="driver-profile-content">
        <div class="profile-header">
          <div class="profile-avatar"><span>${initials}</span></div>
          <div class="profile-basic-info">
            <h2>${driver.name}</h2>
            <div class="profile-company">${driver.company}</div>
            <div class="profile-stats">
              <div class="stat-item"><span class="stat-value">${
                driver.totalRides
              }</span><span class="stat-label">Total Rides</span></div>
              <div class="stat-item"><span class="stat-value">${
                driver.rating
              }</span><span class="stat-label">Avg Rating</span></div>
              <div class="stat-item"><span class="stat-value">${
                driver.onTimePercentage
              }%</span><span class="stat-label">On Time</span></div>
              <div class="stat-item"><span class="stat-value">${driver.totalKm.toLocaleString()} KM</span><span class="stat-label">Total KM</span></div>
            </div>
          </div>
        </div>

        <div class="profile-details">
          <div class="detail-section">
            <h3>📋 Driver Information</h3>
            <div class="detail-item"><span class="detail-label">Driver Name</span><span class="detail-value">${
              driver.name
            }</span></div>
            <div class="detail-item"><span class="detail-label">Age</span><span class="detail-value">${
              driver.age
            } years</span></div>
            <div class="detail-item"><span class="detail-label">Phone</span><span class="detail-value">${
              driver.phone
            }</span></div>
            <div class="detail-item"><span class="detail-label">Email</span><span class="detail-value">${
              driver.email
            }</span></div>
            <div class="detail-item"><span class="detail-label">Location</span><span class="detail-value">${
              driver.location
            }</span></div>
            <div class="detail-item"><span class="detail-label">Experience</span><span class="detail-value">${
              driver.experience
            } years</span></div>
            <div class="detail-item"><span class="detail-label">Joined</span><span class="detail-value">${
              driver.appliedDate
            }</span></div>
          </div>

          <div class="detail-section">
            <h3>📊 Driver Statistics</h3>
            <div class="detail-item"><span class="detail-label">Total Rides</span><span class="detail-value">${
              driver.totalRides
            }</span></div>
            <div class="detail-item"><span class="detail-label">Average Rating</span><span class="detail-value">${
              driver.rating
            }/5.0</span></div>
            <div class="detail-item"><span class="detail-label">Total Reviews</span><span class="detail-value">${
              driver.reviews
            }</span></div>
            <div class="detail-item"><span class="detail-label">On Time %</span><span class="detail-value">${
              driver.onTimePercentage
            }%</span></div>
            <div class="detail-item"><span class="detail-label">Total Distance</span><span class="detail-value">${driver.totalKm.toLocaleString()} KM</span></div>
            <div class="detail-item"><span class="detail-label">Status</span><span class="detail-value status-${
              driver.status
            }">${driver.status.toUpperCase()}</span></div>
          </div>

          <div class="detail-section document-section">
            <h3>📄 Documents & Verification</h3>
            <div class="documents-grid">
              <div class="document-card">
                <div class="document-icon">🆔</div>
                <div class="document-title">NIC Document</div>
                <div class="document-status verified">Verified</div>
                <div class="document-id">ID: ${driver.nicNumber}</div>
                <div class="document-actions">
                  <button class="btn btn-sm btn-secondary" onclick="viewDocument('nic', ${
                    driver.id
                  })">View</button>
                  <button class="btn btn-sm btn-primary" onclick="downloadDocument('nic', ${
                    driver.id
                  })">Download</button>
                </div>
              </div>

              <div class="document-card">
                <div class="document-icon">🚗</div>
                <div class="document-title">Driving License</div>
                <div class="document-status verified">Verified</div>
                <div class="document-id">License: ${driver.licenseNumber}</div>
                <div class="document-info">
                  <div>Expires: ${driver.licenseExpiry}</div>
                  <div>Categories: ${driver.categories}</div>
                </div>
                <div class="document-actions">
                  <button class="btn btn-sm btn-secondary" onclick="viewDocument('license', ${
                    driver.id
                  })">View</button>
                  <button class="btn btn-sm btn-primary" onclick="downloadDocument('license', ${
                    driver.id
                  })">Download</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>`;

    modal.classList.add("show");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  closeDriverModal() {
    const modal = document.getElementById("driverModal");
    modal.classList.remove("show");
    modal.style.display = "none";
    document.body.style.overflow = "";
    this.currentDriver = null;
  }

  searchDrivers(query) {
    const searchTerm = (query || "").toLowerCase().trim();
    this.filteredDrivers = this.drivers.filter(
      (d) =>
        d.name.toLowerCase().includes(searchTerm) ||
        d.company.toLowerCase().includes(searchTerm) ||
        d.location.toLowerCase().includes(searchTerm)
    );
    this.renderDrivers();
    this.showSearchResults(searchTerm);
  }

  sortDrivers(criteria) {
    switch (criteria) {
      case "name_asc":
        this.filteredDrivers.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name_desc":
        this.filteredDrivers.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "rating_desc":
        this.filteredDrivers.sort((a, b) => b.rating - a.rating);
        break;
      case "rating_asc":
        this.filteredDrivers.sort((a, b) => a.rating - b.rating);
        break;
      default:
        this.filteredDrivers.sort((a, b) => a.name.localeCompare(b.name));
    }
    this.renderDrivers();
  }

  showSearchResults(query) {
    if (query) {
      this.showSuccessMessage(
        `Found ${this.filteredDrivers.length} driver(s) matching "${query}"`
      );
    }
  }

  openRegisterDriverModal() {
    const modal = document.getElementById("registerDriverModal");
    modal.classList.add("show");
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  closeRegisterDriverModal() {
    const modal = document.getElementById("registerDriverModal");
    modal.classList.remove("show");
    modal.style.display = "none";
    document.body.style.overflow = "";
    this.resetRegisterForm();
  }

  resetRegisterForm() {
    const form = document.getElementById("registerDriverForm");
    if (form) {
      form.reset();
      form
        .querySelectorAll(".form-control")
        .forEach((i) => i.classList.remove("success", "error"));
      form.querySelectorAll(".form-feedback").forEach((f) => f.remove());
    }
  }

  registerDriver() {
    const form = document.getElementById("registerDriverForm");
    const formData = new FormData(form);

    const driverData = {
      id: this.drivers.length + 1,
      name: formData.get("fullName"),
      age: parseInt(formData.get("age")),
      phone: formData.get("phone"),
      email: formData.get("email"),
      location: formData.get("location"),
      company: formData.get("company") || "Independent",
      experience: parseInt(formData.get("experience")),
      licenseNumber: formData.get("licenseNumber"),
      nicNumber: formData.get("nicNumber"),
      appliedDate: new Date().toLocaleDateString(),
      rating: 0,
      reviews: 0,
      totalRides: 0,
      totalKm: 0,
      onTimePercentage: 0,
      status: "pending",
      description: "New driver awaiting verification",
    };

    if (!this.validateDriverForm(driverData)) return;

    this.drivers.push(driverData);
    this.filteredDrivers = [...this.drivers];
    this.renderDrivers();
    this.closeRegisterDriverModal();
    this.showSuccessMessage(
      "Driver registered successfully! Verification pending."
    );
  }

  validateDriverForm(data) {
    let isValid = true;
    const form = document.getElementById("registerDriverForm");

    // Clear previous feedback
    form.querySelectorAll(".form-feedback").forEach((f) => f.remove());

    // Requireds
    const required = {
      fullName: "Full Name is required",
      age: "Age is required",
      phone: "Phone Number is required",
      location: "Location is required",
      experience: "Experience is required",
      licenseNumber: "License Number is required",
      nicNumber: "NIC Number is required",
    };

    Object.entries(required).forEach(([field, message]) => {
      const input = form.querySelector(`[name="${field}"]`);
      const value = data[field === "fullName" ? "name" : field];
      if (!value || (typeof value === "string" && value.trim() === "")) {
        this.showFieldError(input, message);
        isValid = false;
      } else {
        this.showFieldSuccess(input);
      }
    });

    // Age range
    if (data.age && (data.age < 21 || data.age > 65)) {
      this.showFieldError(
        form.querySelector('[name="age"]'),
        "Age must be between 21 and 65"
      );
      isValid = false;
    }

    // Phone format
    const phoneRegex = /^(\+94|0)?[0-9]{9,10}$/;
    if (
      data.phone &&
      !phoneRegex.test(String(data.phone).replace(/\s+/g, ""))
    ) {
      this.showFieldError(
        form.querySelector('[name="phone"]'),
        "Please enter a valid phone number"
      );
      isValid = false;
    }

    // Email (optional)
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        this.showFieldError(
          form.querySelector('[name="email"]'),
          "Please enter a valid email address"
        );
        isValid = false;
      }
    }

    return isValid;
  }

  showFieldError(input, message) {
    input.classList.remove("success");
    input.classList.add("error");
    const feedback = document.createElement("div");
    feedback.className = "form-feedback error";
    feedback.textContent = message;
    input.parentNode.appendChild(feedback);
  }

  showFieldSuccess(input) {
    input.classList.remove("error");
    input.classList.add("success");
  }

  showSuccessMessage(message) {
    const el = document.createElement("div");
    el.className = "success-notification";
    el.textContent = message;
    el.style.cssText = `
      position: fixed; top: 20px; right: 20px; background: #28a745; color: white;
      padding: 12px 20px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1001; animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  editDriver() {
    if (!this.currentDriver) return;
    console.log("Edit driver:", this.currentDriver);
    this.showSuccessMessage("Driver profile editing opened!");
  }

  getDriverStats() {
    return {
      total: this.drivers.length,
      active: this.drivers.filter((d) => d.status === "active").length,
      pending: this.drivers.filter((d) => d.status === "pending").length,
      averageRating:
        this.drivers.reduce((s, d) => s + d.rating, 0) / this.drivers.length,
      totalRides: this.drivers.reduce((s, d) => s + d.totalRides, 0),
      averageExperience:
        this.drivers.reduce((s, d) => s + d.experience, 0) /
        this.drivers.length,
    };
  }
}

/* ---- Global wrappers for HTML inline handlers ---- */
function openRegisterDriverModal() {
  window.driversManager?.openRegisterDriverModal();
}
function closeRegisterDriverModal() {
  window.driversManager?.closeRegisterDriverModal();
}
function registerDriver() {
  window.driversManager?.registerDriver();
}
function closeDriverModal() {
  window.driversManager?.closeDriverModal();
}
function editDriver() {
  window.driversManager?.editDriver();
}
function viewDocument(type, driverId) {
  console.log(`Viewing ${type} for #${driverId}`);
  alert(`Opening ${type} document viewer...`);
}
function downloadDocument(type, driverId) {
  console.log(`Downloading ${type} for #${driverId}`);
  alert(`Downloading ${type} document...`);
}

/* ---- Bootstrap on DOM ready ---- */
document.addEventListener("DOMContentLoaded", () => {
  window.driversManager = new DriversManager();
});

/* ---- Inline CSS for form feedback animations ---- */
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  .form-control.success { border-color: #28a745; box-shadow: 0 0 0 2px rgba(40,167,69,0.2); }
  .form-control.error   { border-color: #dc3545; box-shadow: 0 0 0 2px rgba(220,53,69,0.2); }
  .form-feedback { font-size: 12px; margin-top: 4px; }
  .form-feedback.success { color: #28a745; }
  .form-feedback.error   { color: #dc3545; }
  .document-info { font-size: 11px; color: #6c757d; margin-top: 4px; }
  .document-id   { font-size: 11px; color: #495057; margin-top: 4px; font-family: monospace; }
`;
document.head.appendChild(style);
