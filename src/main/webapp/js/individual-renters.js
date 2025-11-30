// Individual Renters — Card list + navigation to renter view
class IndividualRentersManager {
  constructor() {
    // seed with vehicles per renter
    this.renters = [
      {
        id: 1,
        name: "Rajesh Kumar",
        company: "Independent",
        rating: 4.9,
        reviews: 156,
        description: "Trusted renter with well-maintained fleet in Colombo.",
        joinDate: "2024-01-13",
        phone: "+94 77 123 4567",
        email: "rajesh.kumar@email.com",
        location: "Colombo",
        status: "active",
        vehicles: [
          {
            id: "V-101",
            make: "Toyota",
            model: "Axio",
            year: 2018,
            regNo: "CAX-1234",
            dailyRate: 12500,
            fuelType: "Petrol",
            transmission: "Auto",
            seats: 5,
            rentalCompany: "Lanka Express",
          },
          {
            id: "V-102",
            make: "Honda",
            model: "Vezel",
            year: 2017,
            regNo: "CBA-2245",
            dailyRate: 14500,
            fuelType: "Hybrid",
            transmission: "Auto",
            seats: 5,
            rentalCompany: "Lanka Express",
          },
        ],
      },
      {
        id: 2,
        name: "Maria Fernando",
        company: "Independent",
        rating: 4.6,
        reviews: 89,
        description: "Airport transfer specialist — Negombo/Katunayake.",
        joinDate: "2024-01-14",
        phone: "+94 71 555 0123",
        email: "maria.fernando@email.com",
        location: "Negombo",
        status: "active",
        vehicles: [
          {
            id: "V-201",
            make: "Suzuki",
            model: "Wagon R",
            year: 2019,
            regNo: "CAA-9087",
            dailyRate: 9000,
            fuelType: "Hybrid",
            transmission: "Auto",
            seats: 4,
            rentalCompany: "Metro Cabs",
          },
        ],
      },
      {
        id: 3,
        name: "John Silva",
        company: "Independent",
        rating: 4.8,
        reviews: 124,
        description: "8 years experience. Clean record. Based in Kandy.",
        joinDate: "2024-01-15",
        phone: "+94 76 987 6543",
        email: "john.silva@email.com",
        location: "Kandy",
        status: "pending",
        vehicles: [
          {
            id: "V-301",
            make: "Nissan",
            model: "Sunny",
            year: 2016,
            regNo: "CAR-5511",
            dailyRate: 8000,
            fuelType: "Petrol",
            transmission: "Manual",
            seats: 5,
            rentalCompany: "City Taxi Service",
          },
          {
            id: "V-302",
            make: "Toyota",
            model: "Aqua",
            year: 2015,
            regNo: "KB-8899",
            dailyRate: 9500,
            fuelType: "Hybrid",
            transmission: "Auto",
            seats: 5,
            rentalCompany: "City Taxi Service",
          },
        ],
      },
    ];

    this.filtered = [...this.renters];
    this.minRating = 0;
    this.query = "";

    this.cacheEls();
    this.populateLocationFilter();
    this.bindEvents();
    this.render();
  }

  cacheEls() {
    this.grid = document.getElementById("rentersGrid");
    this.title = document.getElementById("rentersListTitle");
    this.searchInput = document.getElementById("renterSearch");
    this.locationFilter = document.getElementById("locationFilter");
    this.statusFilter = document.getElementById("statusFilter");
    this.minRatingFilter = document.getElementById("minRatingFilter");
    this.sortSelect = document.getElementById("sortOrder");
    this.applyBtn = document.getElementById("applyFiltersBtn");
    this.resetBtn = document.getElementById("resetFiltersBtn");
  }

  bindEvents() {
    this.searchInput?.addEventListener("input", (e) => {
      this.query = e.target.value;
      this.applyFilters();
    });
    [
      this.locationFilter,
      this.statusFilter,
      this.minRatingFilter,
      this.sortSelect,
    ].forEach((el) =>
      el?.addEventListener("change", () => this.applyFilters())
    );
    this.applyBtn?.addEventListener("click", () => this.applyFilters());
    this.resetBtn?.addEventListener("click", () => this.resetFilters());

    document.addEventListener("click", (e) => {
      const card = e.target.closest(".renter-card");
      if (!card) return;
      const id = Number(card.dataset.renterId);
      const renter = this.renters.find((r) => r.id === id);
      if (!renter) return;

      // stash and go to view page
      try {
        sessionStorage.setItem("selectedRenter", JSON.stringify(renter));
      } catch {}
      window.location.href = `individual-renter-view.html?id=${id}`;
    });
  }

  populateLocationFilter() {
    if (!this.locationFilter) return;
    [...new Set(this.renters.map((r) => r.location))].sort().forEach((loc) => {
      const o = document.createElement("option");
      o.value = loc;
      o.textContent = loc;
      this.locationFilter.appendChild(o);
    });
  }

  applyFilters() {
    const q = (this.query || "").toLowerCase().trim();
    const loc = this.locationFilter?.value || "";
    const status = this.statusFilter?.value || "";
    const minR = Number(this.minRatingFilter?.value || 0);
    const sort = this.sortSelect?.value || "name_asc";

    this.filtered = this.renters.filter((r) => {
      const matchQ =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.company || "").toLowerCase().includes(q) ||
        String(r.id) === q.replace(/^#/, "");
      const matchLoc = !loc || r.location === loc;
      const matchStatus = !status || r.status === status;
      const matchRating = !minR || (r.rating || 0) >= minR;
      return matchQ && matchLoc && matchStatus && matchRating;
    });

    this.sort(sort);
    this.render();
  }

  resetFilters() {
    if (this.searchInput) this.searchInput.value = "";
    if (this.locationFilter) this.locationFilter.value = "";
    if (this.statusFilter) this.statusFilter.value = "";
    if (this.minRatingFilter) this.minRatingFilter.value = "";
    if (this.sortSelect) this.sortSelect.value = "name_asc";
    this.query = "";
    this.filtered = [...this.renters];
    this.render();
  }

  sort(key) {
    const byName = (a, b) => a.name.localeCompare(b.name);
    const byId = (a, b) => a.id - b.id;
    const byRating = (a, b) => (b.rating || 0) - (a.rating || 0);

    switch (key) {
      case "name_desc":
        this.filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "id_asc":
        this.filtered.sort(byId);
        break;
      case "id_desc":
        this.filtered.sort((a, b) => b.id - a.id);
        break;
      case "rating_asc":
        this.filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case "rating_desc":
        this.filtered.sort(byRating);
        break;
      default:
        this.filtered.sort(byName);
    }
  }

  render() {
    if (!this.grid) return;
    this.grid.innerHTML = "";
    if (!this.filtered.length) {
      this.grid.innerHTML = `<div style="padding:16px;color:#6b7280;">No renters match your filters.</div>`;
    } else {
      this.filtered.forEach((r) => this.grid.appendChild(this.card(r)));
    }
    if (this.title)
      this.title.textContent = `Individual Renters (${this.filtered.length})`;
  }

  card(r) {
    const el = document.createElement("div");
    el.className = "renter-card";
    el.dataset.renterId = String(r.id);
    const initials = this.initials(r.name);
    const stars = this.stars(r.rating);
    el.innerHTML = `
      <div class="renter-avatar"><span class="avatar-text">${initials}</span></div>
      <div class="renter-info">
        <h4>${r.name}</h4>
        <div class="renter-details">
          <span>📍 ${r.location}</span>
          <span>🆔 #${r.id}</span>
          <span>🏷️ ${r.company || "Independent"}</span>
        </div>
        <div class="renter-desc">${r.description || ""}</div>
        <div class="renter-rating">
          <div class="rating-stars">${stars}</div>
          <span class="rating-value">${(r.rating || 0).toFixed(1)}</span>
          <span class="review-count" style="color:#6c757d;font-size:12px;">${
            r.reviews
          } reviews</span>
          <span class="status-badge ${
            r.status === "active" ? "active" : "pending"
          }">${r.status.toUpperCase()}</span>
        </div>
      </div>
    `;
    return el;
  }

  initials(name) {
    return String(name)
      .trim()
      .split(/\s+/)
      .map((p) => p[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  stars(rating) {
    const filled = Math.round(rating || 0);
    return Array.from(
      { length: 5 },
      (_, i) => `<span class="star ${i < filled ? "active" : ""}">⭐</span>`
    ).join("");
  }

  // Register modal helpers
  openRegisterDriverModal() {
    const m = document.getElementById("registerDriverModal");
    m?.classList.add("show");
    m.style.display = "flex";
    document.body.style.overflow = "hidden";
  }
  closeRegisterDriverModal() {
    const m = document.getElementById("registerDriverModal");
    m?.classList.remove("show");
    m.style.display = "none";
    document.body.style.overflow = "";
    document.getElementById("registerDriverForm")?.reset();
  }
  registerDriver() {
    const form = document.getElementById("registerDriverForm");
    const fd = new FormData(form);
    const renter = {
      id: Math.max(0, ...this.renters.map((r) => r.id)) + 1,
      name: fd.get("fullName"),
      age: Number(fd.get("age")),
      phone: fd.get("phone"),
      email: fd.get("email"),
      location: fd.get("location"),
      company: fd.get("company") || "Independent",
      description: "New individual renter awaiting verification",
      joinDate: new Date().toISOString().slice(0, 10),
      rating: 0,
      reviews: 0,
      status: "pending",
      vehicles: [],
    };
    this.renters.push(renter);
    this.applyFilters();
    this.closeRegisterDriverModal();
    this.toast("Renter registered successfully! Verification pending.");
  }

  toast(msg) {
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText =
      "position:fixed;right:16px;bottom:16px;background:#2c3e50;color:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.2);z-index:1001;";
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
}

// global handlers for inline onclicks
function openRegisterDriverModal() {
  window.__rMgr?.openRegisterDriverModal();
}
function closeRegisterDriverModal() {
  window.__rMgr?.closeRegisterDriverModal();
}
function registerDriver() {
  window.__rMgr?.registerDriver();
}

// boot
document.addEventListener("DOMContentLoaded", () => {
  window.__rMgr = new IndividualRentersManager();
});