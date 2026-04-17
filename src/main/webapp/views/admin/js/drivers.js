const API_BASE = "/api/admin/drivers";

class DriversManager {
  constructor() {
    this.drivers = [];
    this.filteredDrivers = [];
    this.minRating = 0;

    this.grid = document.getElementById("driversGrid");
    this.nameInput = document.getElementById("driverNameFilter");
    this.licenseInput = document.getElementById("driverLicenseFilter");
    this.sortInput = document.getElementById("sortOrder");

    this.companyInput = document.getElementById("companyFilter");
    this.statusInput = document.getElementById("statusFilter");
    this.locationInput = document.getElementById("locationFilter");
    this.minRidesInput = document.getElementById("minRidesFilter");

    this.ratingText = document.getElementById("ratingText");

    // Pagination
    this.currentPage = 1;
    this.pageSize = 10;
    this.paginationWrap = document.getElementById("driversPagination");
    this.paginationInfo = document.getElementById("driversPaginationInfo");
    this.paginationControls = document.getElementById(
      "driversPaginationControls",
    );
    this.pageSizeSelect = document.getElementById("driversPageSize");

    this.wireEvents();
    this.initializeRatingFilter();
    this.searchDrivers();
  }

  wireEvents() {
    const instantApply = () => this.applyFilters();

    this.companyInput?.addEventListener("change", instantApply);
    this.statusInput?.addEventListener("change", instantApply);
    this.locationInput?.addEventListener("input", instantApply);
    this.minRidesInput?.addEventListener("input", instantApply);

    this.nameInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.searchDrivers();
    });
    this.licenseInput?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.searchDrivers();
    });
    this.sortInput?.addEventListener("change", () => this.searchDrivers());

    this.pageSizeSelect?.addEventListener("change", () => {
      this.pageSize = Number(this.pageSizeSelect.value) || 10;
      this.currentPage = 1;
      this.renderDrivers();
      this.renderPagination();
    });

    this.grid?.addEventListener("click", (e) => {
      const card = e.target.closest(".driver-card");
      if (!card) return;
      const id = card.dataset.driverId;
      if (!id) return;
      window.location.href = `driver-view.html?id=${encodeURIComponent(id)}`;
    });

    this.grid?.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const card = e.target.closest(".driver-card");
      if (!card) return;
      const id = card.dataset.driverId;
      if (!id) return;
      window.location.href = `driver-view.html?id=${encodeURIComponent(id)}`;
    });
  }

  initializeRatingFilter() {
    const container = document.getElementById("ratingFilter");
    if (!container) return;

    const stars = Array.from(container.querySelectorAll(".star"));

    const paint = (v) => {
      stars.forEach((s) =>
        s.classList.toggle("active", Number(s.dataset.value) <= v),
      );
      if (this.ratingText) this.ratingText.textContent = v ? `${v}+` : "Any";
    };

    stars.forEach((star) => {
      star.addEventListener("click", () => {
        this.minRating = Number(star.dataset.value || 0);
        paint(this.minRating);
        this.searchDrivers();
      });
      star.addEventListener("mouseenter", () =>
        paint(Number(star.dataset.value || 0)),
      );
    });

    container.addEventListener("mouseleave", () => paint(this.minRating));
    paint(this.minRating);
  }

  async searchDrivers() {
    const name = (this.nameInput?.value || "").trim();
    const license = (this.licenseInput?.value || "").trim();
    const sort = (this.sortInput?.value || "ascending").trim();

    const params = new URLSearchParams();
    params.set("name", name);
    params.set("license", license);
    params.set("minRating", String(this.minRating || 0));
    params.set("sort", sort);

    try {
      const res = await fetch(`${API_BASE}?${params.toString()}`, {
        headers: { Accept: "application/json" },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      if (!data || data.success !== true)
        throw new Error("API returned failure");

      this.drivers = Array.isArray(data.drivers) ? data.drivers : [];
      this.buildCompanyOptions();
      this.applyFilters();
    } catch (e) {
      console.error("Drivers load error:", e);
      this.drivers = [];
      this.filteredDrivers = [];
      this.renderDrivers();
      this.updateCount();
      this.renderPagination();
      this.showEmptyState("Failed to load drivers.");
    }
  }

  buildCompanyOptions() {
    if (!this.companyInput) return;

    const current = this.companyInput.value || "";

    const companies = Array.from(
      new Set(
        (this.drivers || [])
          .map((d) => (d.company || "").trim())
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));

    this.companyInput.innerHTML = `<option value="">All companies</option>`;
    companies.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      this.companyInput.appendChild(opt);
    });

    if (companies.includes(current)) this.companyInput.value = current;
  }

  applyFilters() {
    const company = (this.companyInput?.value || "").trim().toLowerCase();
    const status = (this.statusInput?.value || "").trim().toLowerCase();
    const location = (this.locationInput?.value || "").trim().toLowerCase();

    const minRides = Number(this.minRidesInput?.value || 0) || 0;

    this.filteredDrivers = (this.drivers || []).filter((d) => {
      const dCompany = String(d.company || "").toLowerCase();
      const dStatus = String(d.status || "").toLowerCase();
      const dLocation = String(d.location || "").toLowerCase();

      const rides = Number(d.totalRides || 0) || 0;

      if (company && dCompany !== company) return false;
      if (status && dStatus !== status) return false;
      if (location && !dLocation.includes(location)) return false;
      if (rides < minRides) return false;

      return true;
    });

    this.currentPage = 1;

    this.renderDrivers();
    this.updateCount();
    this.renderPagination();
  }

  clearFilters() {
    if (this.nameInput) this.nameInput.value = "";
    if (this.licenseInput) this.licenseInput.value = "";
    if (this.sortInput) this.sortInput.value = "ascending";

    if (this.companyInput) this.companyInput.value = "";
    if (this.statusInput) this.statusInput.value = "";
    if (this.locationInput) this.locationInput.value = "";
    if (this.minRidesInput) this.minRidesInput.value = "";

    this.minRating = 0;
    document
      .querySelectorAll("#ratingFilter .star")
      .forEach((s) => s.classList.remove("active"));
    if (this.ratingText) this.ratingText.textContent = "Any";

    if (this.pageSizeSelect) this.pageSizeSelect.value = "10";
    this.pageSize = 10;
    this.currentPage = 1;

    this.searchDrivers();
  }

  renderDrivers() {
    if (!this.grid) return;
    this.grid.innerHTML = "";

    if (!this.filteredDrivers.length) {
      this.showEmptyState("No drivers found.");
      return;
    }

    const totalPages = Math.max(
      1,
      Math.ceil(this.filteredDrivers.length / this.pageSize),
    );
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    const pageItems = this.filteredDrivers.slice(start, end);

    pageItems.forEach((d) => this.grid.appendChild(this.createCard(d)));
  }

  renderPagination() {
    if (!this.paginationWrap) return;

    const total = this.filteredDrivers.length;
    const totalPages = Math.max(1, Math.ceil(total / this.pageSize));

    if (total === 0) {
      this.paginationWrap.style.display = "none";
      return;
    }

    this.paginationWrap.style.display = "flex";

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, total);

    if (this.paginationInfo) {
      this.paginationInfo.innerHTML = `Showing <strong>${start}</strong>–<strong>${end}</strong> of <strong>${total}</strong>`;
    }

    if (!this.paginationControls) return;
    this.paginationControls.innerHTML = "";

    const makeBtn = (
      label,
      page,
      { disabled = false, active = false } = {},
    ) => {
      const btn = document.createElement("button");
      btn.className = "pagination-btn" + (active ? " active" : "");
      btn.textContent = label;
      btn.disabled = disabled;
      if (!disabled && !active) {
        btn.addEventListener("click", () => {
          this.currentPage = page;
          this.renderDrivers();
          this.renderPagination();
          this.grid?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      return btn;
    };

    const makeEllipsis = () => {
      const s = document.createElement("span");
      s.className = "pagination-ellipsis";
      s.textContent = "…";
      return s;
    };

    // Prev
    this.paginationControls.appendChild(
      makeBtn("‹ Prev", this.currentPage - 1, {
        disabled: this.currentPage === 1,
      }),
    );

    // Page numbers
    const pages = this.getPageList(this.currentPage, totalPages);
    pages.forEach((p) => {
      if (p === "…") {
        this.paginationControls.appendChild(makeEllipsis());
      } else {
        this.paginationControls.appendChild(
          makeBtn(String(p), p, { active: p === this.currentPage }),
        );
      }
    });

    // Next
    this.paginationControls.appendChild(
      makeBtn("Next ›", this.currentPage + 1, {
        disabled: this.currentPage === totalPages,
      }),
    );
  }

  getPageList(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const pages = [1];
    if (current > 3) pages.push("…");

    const startP = Math.max(2, current - 1);
    const endP = Math.min(total - 1, current + 1);
    for (let i = startP; i <= endP; i++) pages.push(i);

    if (current < total - 2) pages.push("…");
    pages.push(total);
    return pages;
  }

  showEmptyState(message) {
    if (!this.grid) return;
    this.grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1/-1; background:#fff; border:1px solid #e6e8ec; border-radius:12px; padding:18px; text-align:center;">
        <p style="margin:0; color:#374151;">${this.escape(message)}</p>
      </div>
    `;
  }

  createCard(d) {
    const card = document.createElement("div");
    card.className = "driver-card";
    card.dataset.driverId = d.id;
    card.tabIndex = 0;
    card.role = "button";

    const initials = this.getInitials(d.name || "");
    const stars = this.generateStarsHTML(Number(d.rating || 0));
    const status = String(d.status || "—").trim() || "—";

    card.innerHTML = `
      <div class="driver-avatar"><span class="avatar-text">${initials}</span></div>

      <div class="driver-info">
        <div class="driver-title-row">
          <h4 class="driver-name">${this.escape(d.name || "—")}</h4>
          <span class="status-pill">${this.escape(status)}</span>
        </div>

        <p class="driver-company">${this.escape(d.company || "—")}</p>

        <div class="driver-details">
          <span><i class="fas fa-location-dot"></i>  ${this.escape(d.location || "—")}</span>
          <span><i class="fas fa-id-card"></i> ${this.escape(d.licenseNumber || "—")}</span>
          <span><i class="fas fa-road"></i> Joined ${this.escape(d.appliedDate || "—")}</span>
          <span><i class="fas fa-building"></i> ${Number(d.totalRides || 0)} rides</span>
        </div>

        <div class="driver-description"><p>${this.escape(d.description || "")}</p></div>

        <div class="driver-rating">
          <div class="rating-stars-inline">${stars}</div>
          <span class="rating-value">${(Number(d.rating) || 0).toFixed(1)}</span>
          <span class="review-count">${Number(d.reviews || 0)} reviews</span>
        </div>
      </div>
    `;

    return card;
  }

  generateStarsHTML(r) {
    const f = Math.round(r || 0);
    return Array.from(
      { length: 5 },
      (_, i) => `<span class="star ${i + 1 <= f ? "active" : ""}">★</span>`,
    ).join("");
  }

  updateCount() {
    const el = document.querySelector(".drivers-section .section-title");
    if (el) el.textContent = `Driver List (${this.filteredDrivers.length})`;
  }

  getInitials(name) {
    const p = String(name || "")
      .trim()
      .split(/\s+/);
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
