// js/customers.js  (API-wired version)
class CustomersManager {
  constructor() {
    this.customers = [];
    this.filteredCustomers = [];
    this.minRating = 0;

    // simple paging (optional; UI doesn't have pager, we keep it internal)
    this.page = 1;
    this.pageSize = 50;

    this.API_BASE = "/api/admin/customers";

    this.init();
  }

  init() {
    this.cacheEls();
    this.initializeRatingFilter();
    this.setupEventListeners();
    this.loadCustomers(); // <-- fetch from backend
  }

  cacheEls() {
    this.grid = document.querySelector(".customers-grid");
    this.listTitle = document.querySelector(
      ".customers-section .section-title",
    );

    this.nameEl = document.getElementById("customerNameFilter");
    this.nicEl = document.getElementById("nicFilter");
    this.locEl = document.getElementById("locationFilter");
    this.statEl = document.getElementById("statusFilter");
    this.joinFrom = document.getElementById("joinFrom");
    this.joinTo = document.getElementById("joinTo");
    this.bookMinEl = document.getElementById("bookingsMin");
    this.bookMaxEl = document.getElementById("bookingsMax");
    this.sortEl = document.getElementById("sortOrder");
  }

  setupEventListeners() {
    document
      .querySelector(".search-actions .btn-primary")
      ?.addEventListener("click", () => this.loadCustomers());

    document
      .querySelector(".search-actions .btn-secondary")
      ?.addEventListener("click", () => this.clearFiltersAndReload());

    // type-to-filter -> re-fetch
    [this.nameEl, this.nicEl, this.bookMinEl, this.bookMaxEl].forEach((el) =>
      el?.addEventListener("input", () => this.debouncedReload()),
    );

    // change-to-filter -> re-fetch
    [this.locEl, this.statEl, this.sortEl, this.joinFrom, this.joinTo].forEach(
      (el) => el?.addEventListener("change", () => this.loadCustomers()),
    );

    // card click -> go to view page and store selected customer
    document.addEventListener("click", (e) => {
      const card = e.target.closest(".customer-card");
      if (!card) return;

      const id = Number(card.dataset.customerId);
      if (!Number.isFinite(id)) return;

      const selected = this.customers.find((c) => Number(c.id) === id) || null;
      if (selected) {
        try {
          sessionStorage.setItem("selectedCustomer", JSON.stringify(selected));
        } catch (_) {}
      }

      window.location.href = `customer-view.html?id=${id}`;
    });

    // register modal submit (if you use form submit)
    document.getElementById("registerForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.registerCustomer();
    });
  }

  debouncedReload() {
    clearTimeout(this._t);
    this._t = setTimeout(() => this.loadCustomers(), 250);
  }

  /* ---------- Rating Filter ---------- */
  initializeRatingFilter() {
    const container = document.getElementById("ratingFilter");
    if (!container) return;
    const stars = Array.from(container.querySelectorAll(".star"));
    const paint = (value) =>
      stars.forEach((s) =>
        s.classList.toggle("active", Number(s.dataset.value) <= value),
      );

    stars.forEach((star) => {
      star.addEventListener("click", () => {
        this.minRating = Number(star.dataset.value || 0);
        paint(this.minRating);
        this.loadCustomers();
      });
      star.addEventListener("mouseenter", () =>
        paint(Number(star.dataset.value || 0)),
      );
    });

    container.addEventListener("mouseleave", () => paint(this.minRating));
    paint(this.minRating);
  }

  /* ---------- API ---------- */
  buildQueryFromUI() {
    const qs = new URLSearchParams();

    const name = (this.nameEl?.value || "").trim();
    const nic = (this.nicEl?.value || "").trim();
    const location = (this.locEl?.value || "").trim(); // exact match from dropdown
    const status = (this.statEl?.value || "").trim();
    const joinFrom = (this.joinFrom?.value || "").trim();
    const joinTo = (this.joinTo?.value || "").trim();
    const minBookings = (this.bookMinEl?.value || "").trim();
    const maxBookings = (this.bookMaxEl?.value || "").trim();

    if (name) qs.set("name", name);
    if (nic) qs.set("nic", nic);

    // backend supports location as free text; dropdown gives exact city -> still fine
    if (location) qs.set("location", location);

    if (status) qs.set("status", status);

    if (joinFrom) qs.set("joinFrom", joinFrom);
    if (joinTo) qs.set("joinTo", joinTo);

    if (minBookings) qs.set("minBookings", minBookings);
    if (maxBookings) qs.set("maxBookings", maxBookings);

    if (this.minRating > 0) qs.set("minRating", String(this.minRating));

    qs.set("page", String(this.page));
    qs.set("pageSize", String(this.pageSize));

    return qs;
  }

  async loadCustomers() {
    const qs = this.buildQueryFromUI();
    const url = `${this.API_BASE}?${qs.toString()}`;

    try {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // expects: { customers: [...], total, page, pageSize }
      this.customers = Array.isArray(data.customers) ? data.customers : [];
      this.filteredCustomers = [...this.customers];

      // Populate location dropdown based on current dataset
      this.populateLocationFilterFromData(this.customers);

      // Sort locally (UI sortOrder is client-only)
      this.applyLocalSort();

      this.renderCustomers();
      this.updateCustomerCount(this.filteredCustomers.length);
    } catch (err) {
      console.error("Failed to load customers:", err);
      this.renderError(
        "Failed to load customers. Check admin login/session and servlet mapping.",
      );
    }
  }

  populateLocationFilterFromData(customers) {
    if (!this.locEl) return;

    const current = this.locEl.value;
    const uniq = [
      ...new Set(customers.map((c) => c.location).filter(Boolean)),
    ].sort((a, b) => String(a).localeCompare(String(b)));

    // rebuild options but keep "All"
    this.locEl.innerHTML = `<option value="">All</option>`;
    uniq.forEach((loc) => {
      const o = document.createElement("option");
      o.value = loc;
      o.textContent = loc;
      this.locEl.appendChild(o);
    });

    // restore selection if still exists
    if (current) this.locEl.value = current;
  }

  applyLocalSort() {
    const sortOrder = this.sortEl?.value || "ascending";
    this.filteredCustomers.sort(
      (a, b) =>
        (sortOrder === "ascending" ? 1 : -1) *
        String(a.name || "").localeCompare(String(b.name || "")),
    );
  }

  renderError(msg) {
    if (!this.grid) return;
    this.grid.innerHTML = `<div style="padding:16px;color:#b91c1c;">${msg}</div>`;
  }

  /* ---------- Rendering ---------- */
  renderCustomers() {
    if (!this.grid) return;

    this.grid.innerHTML = "";
    if (!this.filteredCustomers.length) {
      this.grid.innerHTML = `<div style="padding:16px;color:#6b7280;">No customers match your filters.</div>`;
      return;
    }

    this.filteredCustomers.forEach((c) =>
      this.grid.appendChild(this.createCustomerCard(c)),
    );
  }

  createCustomerCard(c) {
    const card = document.createElement("div");
    card.className = "customer-card";
    card.dataset.customerId = c.id;

    const initials = this.getInitials(c.name || "");
    const stars = this.generateStarsHTML(Number(c.rating || 0));

    // backend returns: name, nic, email, phone, joinDate, bookings, location, rating, reviews, status, description
    card.innerHTML = `
      <div class="customer-avatar"><span class="avatar-text">${initials}</span></div>
      <div class="customer-info">
        <h4 class="customer-name">${this.esc(c.name || "—")}</h4>
        <div class="customer-details">
          <div class="detail-item"><span class="detail-icon">NIC:</span><span class="detail-text">${this.esc(c.nic || "—")}</span></div>
          <div class="detail-item"><span class="detail-icon">📧</span><span class="detail-text">${this.esc(c.email || "—")}</span></div>
          <div class="detail-item"><span class="detail-icon">📞</span><span class="detail-text">${this.esc(c.phone || "—")}</span></div>
          <div class="detail-item"><span class="detail-icon">📍</span><span class="detail-text">${this.esc(c.location || "—")}</span></div>
        </div>
        <div class="customer-description"><p>${this.esc(c.description || "")}</p></div>
        <div class="customer-rating">
          <div class="rating-stars">${stars}</div>
          <span class="rating-value">${Number(c.rating || 0).toFixed(1)}</span>
          <span class="review-count">${Number(c.reviews || 0)} reviews</span>
          <div class="status-badge ${
            String(c.status || "").toLowerCase() === "active"
              ? "status-active"
              : "status-inactive"
          }">${this.esc(
            String(c.status || "—").toLowerCase() === "active"
              ? "Active"
              : "Inactive",
          )}</div>
        </div>
      </div>
    `;
    return card;
  }

  generateStarsHTML(rating) {
    const filled = Math.round(rating);
    return Array.from(
      { length: 5 },
      (_, i) => `<span class="star ${i < filled ? "active" : ""}">⭐</span>`,
    ).join("");
  }

  updateCustomerCount(n) {
    if (this.listTitle) this.listTitle.textContent = `Customer List (${n})`;
  }

  getInitials(name) {
    const p = String(name).trim().split(/\s+/);
    return ((p[0] || "")[0] || "") + ((p[1] || "")[0] || "");
  }

  esc(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  /* ---------- Clear Filters ---------- */
  clearFiltersAndReload() {
    const ids = [
      "customerNameFilter",
      "nicFilter",
      "sortOrder",
      "locationFilter",
      "statusFilter",
      "joinFrom",
      "joinTo",
      "bookingsMin",
      "bookingsMax",
    ];

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (el.tagName === "SELECT")
        el.value = id === "sortOrder" ? "ascending" : "";
      else el.value = "";
    });

    this.minRating = 0;
    document
      .querySelectorAll("#ratingFilter .star")
      .forEach((s) => s.classList.remove("active"));

    this.page = 1;
    this.loadCustomers();
  }

  /* ---------- Modal helpers (keep your existing HTML onclicks) ---------- */
  openRegisterModal() {
    const modal = document.getElementById("registerModal");
    if (!modal) return;
    modal.classList.add("show");
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  closeRegisterModal() {
    const modal = document.getElementById("registerModal");
    if (!modal) return;
    modal.classList.remove("show");
    modal.style.display = "none";
    document.body.style.overflow = "";
    document.getElementById("registerForm")?.reset();
  }

  splitName(full) {
    const parts = String(full || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return { firstName: "", lastName: "" };
    if (parts.length === 1) return { firstName: parts[0], lastName: "" };
    return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
  }

  async registerCustomer() {
    const form = document.getElementById("registerForm");
    if (!form) return;

    const data = Object.fromEntries(new FormData(form).entries());

    const { firstName, lastName } = this.splitName(data.fullName);

    const payload = {
      firstName,
      lastName,
      nic: (data.nicNumber || "").trim(),
      email: (data.email || "").trim(),
      phone: (data.phone || "").trim(),
      city: (data.city || "").trim(),
      address: (data.address || "").trim(),
    };

    if (!payload.firstName || !payload.nic || !payload.email) {
      this.toast("Full name, NIC, Email are required");
      return;
    }

    try {
      const res = await fetch(this.API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const out = await res.json().catch(() => ({}));

      if (!res.ok || !out.success) {
        throw new Error(out.error || `HTTP ${res.status}`);
      }

      this.closeRegisterModal();
      this.toast("Customer registered successfully");
      this.loadCustomers(); // refresh list from DB
    } catch (err) {
      console.error("Register failed:", err);
      this.toast("Register failed. Check servlet and DB constraints.");
    }
  }

  toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = `position:fixed;right:16px;bottom:16px;background:#2c3e50;color:#fff;padding:10px 14px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.2);z-index:1001;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }
}

// Boot
window.addEventListener("DOMContentLoaded", () => {
  window.customersManager = new CustomersManager();
});

// Keep your existing inline onclicks working
function searchCustomers() {
  window.customersManager?.loadCustomers();
}
function clearFilters() {
  window.customersManager?.clearFiltersAndReload();
}
function openRegisterModal() {
  window.customersManager?.openRegisterModal();
}
function closeRegisterModal() {
  window.customersManager?.closeRegisterModal();
}
function registerCustomer() {
  window.customersManager?.registerCustomer();
}
