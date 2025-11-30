// Customers Page JavaScript (theme-matched filters + cards render)
class CustomersManager {
  constructor() {
    this.customers = [
      {
        id: 1,
        name: "John Doe",
        nic: "123456789V",
        email: "john.doe@email.com",
        phone: "+94 77 123 4567",
        joinDate: "2023-01-15",
        bookings: 25,
        location: "Colombo",
        rating: 4.8,
        reviews: 18,
        status: "active",
        description: "Frequent customer with excellent payment history",
      },
      {
        id: 2,
        name: "Michael Chen",
        nic: "987654321V",
        email: "michael.chen@email.com",
        phone: "+94 71 555 0123",
        joinDate: "2023-11-10",
        bookings: 8,
        location: "Galle",
        rating: 4.2,
        reviews: 5,
        status: "active",
        description: "New customer showing promising booking patterns",
      },
      {
        id: 3,
        name: "Sarah Johnson",
        nic: "456789123V",
        email: "sarah.j@email.com",
        phone: "+94 76 987 6543",
        joinDate: "2023-09-22",
        bookings: 12,
        location: "Kandy",
        rating: 4.6,
        reviews: 8,
        status: "active",
        description: "Reliable customer, always on time for pickups",
      },
      {
        id: 4,
        name: "Ahmed Ali",
        nic: "223344556V",
        email: "ahmed.ali@email.com",
        phone: "+94 72 345 6789",
        joinDate: "2022-06-05",
        bookings: 3,
        location: "Negombo",
        rating: 3.8,
        reviews: 2,
        status: "inactive",
        description: "Low booking activity in recent months",
      },
      {
        id: 5,
        name: "Nimali Perera",
        nic: "991234567V",
        email: "nimali.p@email.com",
        phone: "+94 77 888 1122",
        joinDate: "2024-03-14",
        bookings: 19,
        location: "Matara",
        rating: 4.9,
        reviews: 21,
        status: "active",
        description: "Top customer with multiple repeat bookings",
      },
      {
        id: 6,
        name: "Ishara Fernando",
        nic: "200045678V",
        email: "ishara.f@email.com",
        phone: "+94 70 112 3344",
        joinDate: "2023-08-01",
        bookings: 6,
        location: "Jaffna",
        rating: 3.5,
        reviews: 4,
        status: "active",
        description: "Budget-conscious, books short trips",
      },
      {
        id: 7,
        name: "Carlos Gomez",
        nic: "778899001V",
        email: "carlos.g@email.com",
        phone: "+94 74 667 8899",
        joinDate: "2022-12-09",
        bookings: 15,
        location: "Colombo",
        rating: 4.1,
        reviews: 7,
        status: "active",
        description: "Responsive and punctual",
      },
      {
        id: 8,
        name: "Ayesha Rahman",
        nic: "314159265V",
        email: "ayesha.r@email.com",
        phone: "+94 76 000 1234",
        joinDate: "2024-05-20",
        bookings: 10,
        location: "Kandy",
        rating: 4.4,
        reviews: 6,
        status: "active",
        description: "Prefers weekend bookings",
      },
      {
        id: 9,
        name: "Tharindu Silva",
        nic: "888777666V",
        email: "tharindu@email.com",
        phone: "+94 77 234 5678",
        joinDate: "2022-02-11",
        bookings: 2,
        location: "Galle",
        rating: 2.9,
        reviews: 1,
        status: "inactive",
        description: "Dormant account",
      },
      {
        id: 10,
        name: "Emily Brown",
        nic: "135792468V",
        email: "emily.b@email.com",
        phone: "+94 71 999 0000",
        joinDate: "2024-01-05",
        bookings: 30,
        location: "Colombo",
        rating: 5.0,
        reviews: 40,
        status: "active",
        description: "VIP customer, highest loyalty score",
      },
    ];

    this.filteredCustomers = [...this.customers];
    this.minRating = 0;

    this.init();
  }

  init() {
    this.cacheEls();
    this.populateLocationFilter();
    this.initializeRatingFilter();
    this.setupEventListeners();
    this.renderCustomers();
    this.updateCustomerCount();
  }

  cacheEls() {
    // grid + counts
    this.grid = document.querySelector(".customers-grid");
    // IMPORTANT: target the list title, not the filter title
    this.listTitle = document.querySelector(
      ".customers-section .section-title"
    ); // fixes wrong heading update

    // filter inputs
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
    // search/clear buttons (also present inline in HTML)
    document
      .querySelector(".search-actions .btn-primary")
      ?.addEventListener("click", () => this.applyFilters());
    document
      .querySelector(".search-actions .btn-secondary")
      ?.addEventListener("click", () => this.clearFilters());

    // type-to-filter
    [this.nameEl, this.nicEl, this.bookMinEl, this.bookMaxEl].forEach((el) =>
      el?.addEventListener("input", () => this.applyFilters())
    );
    // change-to-filter
    [this.locEl, this.statEl, this.sortEl, this.joinFrom, this.joinTo].forEach(
      (el) => el?.addEventListener("change", () => this.applyFilters())
    );

    // card click -> optional details
    document.addEventListener("click", (e) => {
      const card = e.target.closest(".customer-card");
      if (card) this.showCustomerDetails(Number(card.dataset.customerId));
    });

    // register form submit
    document.getElementById("registerForm")?.addEventListener("submit", (e) => {
      e.preventDefault();
      this.registerCustomer();
    });
  }

  /* ---------- Helpers ---------- */
  parseDate(s) {
    return s ? new Date(s + "T00:00:00") : null;
  }
  toNum(v) {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  }

  populateLocationFilter() {
    if (!this.locEl) return;
    const uniq = [...new Set(this.customers.map((c) => c.location))].sort();
    uniq.forEach((loc) => {
      const o = document.createElement("option");
      o.value = loc;
      o.textContent = loc;
      this.locEl.appendChild(o);
    });
  }

  initializeRatingFilter() {
    const container = document.getElementById("ratingFilter");
    if (!container) return;
    const stars = Array.from(container.querySelectorAll(".star"));
    const paint = (value) =>
      stars.forEach((s) =>
        s.classList.toggle("active", Number(s.dataset.value) <= value)
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

  /* ---------- Filtering ---------- */
  applyFilters() {
    const nameFilter = (this.nameEl?.value || "").toLowerCase();
    const nicFilter = (this.nicEl?.value || "").toLowerCase();
    const sortOrder = this.sortEl?.value || "ascending";

    const loc = this.locEl?.value || "";
    const status = this.statEl?.value || "";
    const minRating = this.minRating || 0;

    const joinFrom = this.parseDate(this.joinFrom?.value);
    const joinTo = this.parseDate(this.joinTo?.value);
    const minBk = this.toNum(this.bookMinEl?.value);
    const maxBk = this.toNum(this.bookMaxEl?.value);

    this.filteredCustomers = this.customers.filter((c) => {
      const matchesName = c.name.toLowerCase().includes(nameFilter);
      const matchesNIC = c.nic.toLowerCase().includes(nicFilter);
      const matchesLoc = !loc || c.location === loc;
      const matchesStat = !status || c.status === status;
      const matchesRat = c.rating >= minRating;

      const jd = this.parseDate(c.joinDate);
      const matchesJoin =
        (!joinFrom || jd >= joinFrom) && (!joinTo || jd <= joinTo);

      const matchesBookings =
        (isNaN(minBk) || c.bookings >= minBk) &&
        (isNaN(maxBk) || c.bookings <= maxBk);

      return (
        matchesName &&
        matchesNIC &&
        matchesLoc &&
        matchesStat &&
        matchesRat &&
        matchesJoin &&
        matchesBookings
      );
    });

    // sort
    this.filteredCustomers.sort(
      (a, b) =>
        (sortOrder === "ascending" ? 1 : -1) * a.name.localeCompare(b.name)
    );

    this.renderCustomers();
    this.updateCustomerCount();
  }

  clearFilters() {
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

    this.filteredCustomers = [...this.customers];
    this.renderCustomers();
    this.updateCustomerCount();
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
      this.grid.appendChild(this.createCustomerCard(c))
    );
  }

  createCustomerCard(c) {
    const card = document.createElement("div");
    card.className = "customer-card";
    card.dataset.customerId = c.id;

    const initials = this.getInitials(c.name);
    const stars = this.generateStarsHTML(c.rating);

    card.innerHTML = `
      <div class="customer-avatar"><span class="avatar-text">${initials}</span></div>
      <div class="customer-info">
        <h4 class="customer-name">${c.name}</h4>
        <div class="customer-details">
          <div class="detail-item"><span class="detail-icon">NIC:</span><span class="detail-text">${
            c.nic
          }</span></div>
          <div class="detail-item"><span class="detail-icon">📧</span><span class="detail-text">${
            c.email
          }</span></div>
          <div class="detail-item"><span class="detail-icon">📞</span><span class="detail-text">${
            c.phone
          }</span></div>
          <div class="detail-item"><span class="detail-icon">📍</span><span class="detail-text">${
            c.location
          }</span></div>
        </div>
        <div class="customer-description"><p>${c.description || ""}</p></div>
        <div class="customer-rating">
          <div class="rating-stars">${stars}</div>
          <span class="rating-value">${c.rating.toFixed(1)}</span>
          <span class="review-count">${c.reviews} reviews</span>
          <div class="status-badge ${
            c.status === "active" ? "status-active" : "status-inactive"
          }">${c.status === "active" ? "Active" : "Inactive"}</div>
        </div>
      </div>
    `;
    return card;
  }

  generateStarsHTML(rating) {
    const filled = Math.round(rating);
    return Array.from(
      { length: 5 },
      (_, i) => `<span class="star ${i < filled ? "active" : ""}">⭐</span>`
    ).join("");
  }

  updateCustomerCount() {
    if (this.listTitle)
      this.listTitle.textContent = `Customer List (${this.filteredCustomers.length})`;
  }

  /* ---------- Misc ---------- */
  showCustomerDetails(id) {
    /* hook up details modal here if needed */
  }
  getInitials(name) {
    const p = name.trim().split(/\s+/);
    return ((p[0] || "")[0] || "") + ((p[1] || "")[0] || "");
  }

  // Register modal
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
    this.resetForm();
  }

  resetForm() {
    document.getElementById("registerForm")?.reset();
    document
      .querySelectorAll(".form-group .error")
      .forEach((el) => (el.textContent = ""));
  }

  validateForm(data) {
    let ok = true;
    const setError = (name, msg) => {
      const group = document
        .querySelector(`[name="${name}"]`)
        ?.closest(".form-group");
      if (group) {
        let err = group.querySelector(".error");
        if (!err) {
          err = document.createElement("div");
          err.className = "error";
          group.appendChild(err);
        }
        err.textContent = msg || "";
      }
    };
    if (!data.fullName?.trim()) {
      setError("fullName", "Full name is required");
      ok = false;
    } else setError("fullName", "");
    if (!data.nicNumber?.trim()) {
      setError("nicNumber", "NIC is required");
      ok = false;
    } else setError("nicNumber", "");
    if (!data.email?.trim()) {
      setError("email", "Email is required");
      ok = false;
    } else setError("email", "");
    if (!data.phone?.trim()) {
      setError("phone", "Phone is required");
      ok = false;
    } else setError("phone", "");
    return ok;
  }

  registerCustomer() {
    const form = document.getElementById("registerForm");
    if (!form) return;
    const data = Object.fromEntries(new FormData(form).entries());
    if (!this.validateForm(data)) return;

    const newCustomer = {
      id: this.customers.length
        ? Math.max(...this.customers.map((c) => c.id)) + 1
        : 1,
      name: data.fullName.trim(),
      nic: data.nicNumber.trim(), // <-- fixed mapping
      email: data.email.trim(),
      phone: data.phone.trim(),
      joinDate: new Date().toISOString().slice(0, 10),
      bookings: Number(data.bookings || 0),
      location: data.city || "Colombo",
      rating: Number(data.rating || 4.0),
      reviews: Number(data.reviews || 0),
      status: "active",
      description: data.address || "",
    };

    this.customers.push(newCustomer);
    this.applyFilters();
    this.closeRegisterModal();
    this.toast("Customer registered successfully");
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

// Global helpers for inline onclicks
function searchCustomers() {
  window.customersManager?.applyFilters();
}
function clearFilters() {
  window.customersManager?.clearFilters();
}
function openRegisterModal() {
  window.customersManager?.openRegisterModal();
}
function closeRegisterModal() {
  window.customersManager?.closeRegisterModal();
}
function exportCustomers() {
  window.customersManager?.exportCustomers?.();
}

// --- Open Customer View on card click ---
document.addEventListener("click", (e) => {
  const card = e.target.closest(".customer-card");
  if (!card) return;

  const id = Number(card.getAttribute("data-customer-id"));
  if (!Number.isFinite(id)) return;

  // Your seed data already exists here (CustomersManager.customers)
  // Find the customer and stash it for the details page.
  try {
    const manager = window.__customersManager || null;
    const data = manager?.customers || []; // if you expose it, else adapt
    const selected = Array.isArray(data) ? data.find((c) => c.id === id) : null;
    if (selected)
      sessionStorage.setItem("selectedCustomer", JSON.stringify(selected));
  } catch (_) {}

  window.location.href = `customer-view.html?id=${id}`;
});