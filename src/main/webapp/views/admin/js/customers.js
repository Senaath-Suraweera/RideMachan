// Customers Page JavaScript (clean, fully wired for filterable Minimum Rating inside the filter bar)
class CustomersManager {
  constructor() {
    // --- Seed data (you can replace with your API/db) ---
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

    // Old standalone rating widget state (if used): keep, but we filter with minRating
    this.currentRating = 5;

    // Minimum rating filter (0 = no minimum)
    this.minRating = 0;

    this.init();
  }

  // -------- Init & Events --------
  init() {
    this.setupEventListeners();
    this.initializeRatingSystem(); // legacy #customerRating (if present)
    this.initializeRatingFilter(); // new #ratingFilter (in the filter bar)
    this.renderCustomers();
    this.updateCustomerCount();
  }

  setupEventListeners() {
    // Search button (inline onclick exists in HTML, but add listeners too)
    const searchBtn = document.querySelector(".search-actions .btn-primary");
    if (searchBtn) {
      searchBtn.addEventListener("click", () => this.searchCustomers());
    }

    // Clear filters button
    const clearBtn = document.querySelector(".search-actions .btn-secondary");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearFilters());
    }

    // Filter inputs live-typing
    const nameInput = document.getElementById("customerNameFilter");
    const nicInput = document.getElementById("nicFilter");
    const sortInput = document.getElementById("sortOrder");

    [nameInput, nicInput, sortInput].forEach((input) => {
      if (input) {
        const eventName = input.tagName === "SELECT" ? "change" : "input";
        input.addEventListener(eventName, () => this.applyFilters());
      }
    });

    // Customer card click (open details, optional)
    document.addEventListener("click", (e) => {
      const card = e.target.closest(".customer-card");
      if (card) this.showCustomerDetails(Number(card.dataset.customerId));
    });

    // Register form submission (if modal exists)
    const form = document.getElementById("registerForm");
    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.registerCustomer();
      });
    }
  }

  // -------- Rating widgets --------
  // New: stars inside the search filter bar (id="ratingFilter")
  initializeRatingFilter() {
    const container = document.getElementById("ratingFilter");
    if (!container) return;

    const stars = Array.from(container.querySelectorAll(".star"));

    const paint = (value) => {
      stars.forEach((s) => {
        const v =
          Number(s.dataset.value || s.textContent.trim().length || 0) ||
          Number(s.dataset.value) ||
          0;
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

  // Legacy: the big “Customer Rating Section” widget (id="customerRating")
  // We’ll keep it interactive; clicking a star here ALSO acts as a minimum-rating filter.
  initializeRatingSystem() {
    const ratingStars = document.querySelectorAll("#customerRating .star");
    if (!ratingStars.length) return;

    ratingStars.forEach((star, index) => {
      star.addEventListener("click", () => {
        this.setRating(index + 1);
        this.minRating = index + 1;
        this.applyFilters();
      });
      star.addEventListener("mouseenter", () => {
        this.highlightStars(index + 1);
      });
    });

    const ratingContainer = document.getElementById("customerRating");
    if (ratingContainer) {
      ratingContainer.addEventListener("mouseleave", () => {
        this.highlightStars(this.currentRating);
      });
    }

    this.highlightStars(this.currentRating);
  }

  setRating(rating) {
    this.currentRating = rating;
    this.highlightStars(rating);
  }

  highlightStars(rating) {
    document.querySelectorAll("#customerRating .star").forEach((star, i) => {
      if (i < rating) star.classList.add("active");
      else star.classList.remove("active");
    });
  }

  // -------- Filtering --------
  searchCustomers() {
    this.applyFilters();
    this.showSearchResults();
  }

  applyFilters() {
    const nameFilter = (
      document.getElementById("customerNameFilter")?.value || ""
    ).toLowerCase();
    const nicFilter = (
      document.getElementById("nicFilter")?.value || ""
    ).toLowerCase();
    const sortOrder =
      document.getElementById("sortOrder")?.value || "ascending";

    this.filteredCustomers = this.customers.filter((customer) => {
      const matchesName = customer.name.toLowerCase().includes(nameFilter);
      const matchesNIC = customer.nic.toLowerCase().includes(nicFilter);
      const matchesRating = customer.rating >= (this.minRating || 0);
      return matchesName && matchesNIC && matchesRating;
    });

    // Sort by Name A→Z / Z→A
    this.filteredCustomers.sort((a, b) => {
      const c = a.name.localeCompare(b.name);
      return sortOrder === "ascending" ? c : -c;
    });

    this.renderCustomers();
    this.updateCustomerCount();
  }

  clearFilters() {
    const nameInput = document.getElementById("customerNameFilter");
    const nicInput = document.getElementById("nicFilter");
    const sortInput = document.getElementById("sortOrder");

    if (nameInput) nameInput.value = "";
    if (nicInput) nicInput.value = "";
    if (sortInput) sortInput.value = "ascending";

    // Reset minimum rating and unpaint stars in filter bar
    this.minRating = 0;
    document
      .querySelectorAll("#ratingFilter .star")
      .forEach((s) => s.classList.remove("active"));

    this.filteredCustomers = [...this.customers];
    this.renderCustomers();
    this.updateCustomerCount();
  }

  showSearchResults() {
    // Optionally show a toast/snackbar or a small note.
    // Keeping it minimal to avoid UI conflicts.
  }

  // -------- Rendering --------
  renderCustomers() {
    const container = document.querySelector(".customers-grid");
    if (!container) return;
    container.innerHTML = "";

    this.filteredCustomers.forEach((customer) => {
      const card = this.createCustomerCard(customer);
      container.appendChild(card);
    });
  }

  createCustomerCard(customer) {
    const card = document.createElement("div");
    card.className = "customer-card";
    card.dataset.customerId = customer.id;

    const initials = this.getInitials(customer.name);
    const starsHTML = this.generateStarsHTML(customer.rating);

    card.innerHTML = `
      <div class="customer-avatar"><span class="avatar-text">${initials}</span></div>
      <div class="customer-info">
        <h4 class="customer-name">${customer.name}</h4>
        <div class="customer-details">
          <div class="detail-item"><span class="detail-icon">ID: </span><span class="detail-text">${
            customer.nic
          }</span></div>
          <div class="detail-item"><span class="detail-icon">📧</span><span class="detail-text">${
            customer.email
          }</span></div>
          <div class="detail-item"><span class="detail-icon">📞</span><span class="detail-text">${
            customer.phone
          }</span></div>
          <div class="detail-item"><span class="detail-icon">📍</span><span class="detail-text">${
            customer.location
          }</span></div>
        </div>
        <div class="customer-description"><p>${
          customer.description || ""
        }</p></div>
        <div class="customer-rating">
          <div class="rating-stars">${starsHTML}</div>
          <span class="rating-value">${customer.rating.toFixed(1)}</span>
          <span class="review-count">${customer.reviews} reviews</span>
          <div class="status-badge ${
            customer.status === "active" ? "status-active" : "status-inactive"
          }">
            ${customer.status === "active" ? "Active" : "Inactive"}
          </div>
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

  updateCustomerCount() {
    const countEl = document.querySelector(".section-title");
    if (countEl)
      countEl.textContent = `Customer List (${this.filteredCustomers.length})`;
  }

  // -------- Details & Utilities --------
  showCustomerDetails(customerId) {
    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer) return;
    // If you have a dedicated details modal/page, wire it here.
    // For now, just a lightweight alert to confirm click wiring:
    console.log("Customer details:", customer);
  }

  getInitials(name) {
    const parts = name.trim().split(/\s+/);
    const a = (parts[0] || "")[0] || "";
    const b = (parts[1] || "")[0] || "";
    return (a + b).toUpperCase();
  }

  // -------- Register Modal (optional) --------
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
    const form = document.getElementById("registerForm");
    if (form) form.reset();
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

    // Requireds
    if (!data.fullName?.trim()) {
      setError("fullName", "Full name is required");
      ok = false;
    } else setError("fullName", "");
    if (!data.nic?.trim()) {
      setError("nic", "NIC is required");
      ok = false;
    } else setError("nic", "");
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
      nic: data.nic.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      joinDate: new Date().toISOString().slice(0, 10),
      bookings: Number(data.bookings || 0),
      location: data.location || "Colombo",
      rating: Number(data.rating || 4.0),
      reviews: Number(data.reviews || 0),
      status: "active",
      description: data.description || "",
    };

    this.customers.push(newCustomer);
    this.applyFilters();
    this.closeRegisterModal();
    this.toast("Customer registered successfully");
  }

  toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = `
      position: fixed; right: 16px; bottom: 16px;
      background: #2c3e50; color: #fff; padding: 10px 14px;
      border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      z-index: 1001;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2200);
  }

  // Optional utility to export visible customers as JSON
  exportCustomers() {
    const data = {
      exportDate: new Date().toISOString(),
      total: this.filteredCustomers.length,
      customers: this.filteredCustomers,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customers_export_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// ------- Global helpers for inline onclicks in HTML -------
window.addEventListener("DOMContentLoaded", () => {
  window.customersManager = new CustomersManager();
});

// For <button onclick="searchCustomers()"> etc.
function searchCustomers() {
  window.customersManager?.searchCustomers();
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
// Optional: expose export (if you add a button for it)
function exportCustomers() {
  window.customersManager?.exportCustomers();
}
