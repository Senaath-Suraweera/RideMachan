// js/customers.js  (API-wired version with signup + OTP flow)

class CustomersManager {
  constructor() {
    this.customers = [];
    this.filteredCustomers = [];
    this.minRating = 0;
    this.page = 1;
    this.pageSize = 50;

    this.API_BASE = "/api/admin/customers";

    // Registration state
    this.currentStep = 1;
    this.totalSteps = 3;
    this.otpTimer = null;
    this.otpSeconds = 300; // 5 minutes

    this.init();
  }

  init() {
    this.cacheEls();
    this.initializeRatingFilter();
    this.setupEventListeners();
    this.setupOtpInputs();
    this.setupFileInputs();
    this.loadCustomers();
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

    [this.nameEl, this.nicEl, this.bookMinEl, this.bookMaxEl].forEach((el) =>
      el?.addEventListener("input", () => this.debouncedReload()),
    );

    [this.locEl, this.statEl, this.sortEl, this.joinFrom, this.joinTo].forEach(
      (el) => el?.addEventListener("change", () => this.loadCustomers()),
    );

    // Card click -> customer view
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

    const emailInput = document.querySelector(
      '#registerForm input[name="email"]',
    );
    if (emailInput) {
      emailInput.addEventListener("blur", async () => {
        const email = emailInput.value.trim();
        if (!email) return;

        emailInput.classList.remove("error");

        const result = await this.checkEmailExists(email);

        if (result.status === "success" && result.exists) {
          emailInput.classList.add("error");
          this.toast("This email is already registered");
        }
      });
    }

    // Customer type change -> show/hide identity fields on step 3
    const typeSelect = document.querySelector('select[name="customerType"]');
    if (typeSelect) {
      typeSelect.addEventListener("change", () => this.updateIdentityFields());
    }

    // Close modals on backdrop click
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          // Don't close OTP modal on backdrop click (prevent accidental close)
          if (modal.id !== "otpModal") {
            modal.classList.remove("show");
            document.body.style.overflow = "";
          }
        }
      });
    });
  }

  debouncedReload() {
    clearTimeout(this._t);
    this._t = setTimeout(() => this.loadCustomers(), 250);
  }

  /* ================================================================
     RATING FILTER
     ================================================================ */
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

  async checkEmailExists(email) {
    if (!email || !email.trim()) {
      return { status: "error", message: "Email is required", exists: false };
    }

    try {
      const res = await fetch("/customer/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }

      return data;
    } catch (err) {
      console.error("Email check failed:", err);
      return {
        status: "error",
        message: err.message || "Failed to validate email",
        exists: false,
      };
    }
  }

  /* ================================================================
     OTP INPUT BOXES
     ================================================================ */
  setupOtpInputs() {
    const boxes = document.querySelectorAll(".otp-box");
    boxes.forEach((box, i) => {
      box.addEventListener("input", (e) => {
        const val = e.target.value.replace(/\D/g, "");
        e.target.value = val;
        if (val) {
          e.target.classList.add("filled");
          // Move to next
          if (i < boxes.length - 1) boxes[i + 1].focus();
        } else {
          e.target.classList.remove("filled");
        }
        // Hide error on typing
        document.getElementById("otpError").style.display = "none";
        boxes.forEach((b) => b.classList.remove("error"));
      });

      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !e.target.value && i > 0) {
          boxes[i - 1].focus();
          boxes[i - 1].value = "";
          boxes[i - 1].classList.remove("filled");
        }
        // Enter to submit
        if (e.key === "Enter") {
          e.preventDefault();
          verifyOtp();
        }
      });

      // Paste support
      box.addEventListener("paste", (e) => {
        e.preventDefault();
        const paste = (e.clipboardData.getData("text") || "")
          .replace(/\D/g, "")
          .slice(0, 6);
        paste.split("").forEach((ch, j) => {
          if (boxes[j]) {
            boxes[j].value = ch;
            boxes[j].classList.add("filled");
          }
        });
        if (paste.length > 0) {
          const target = Math.min(paste.length, boxes.length) - 1;
          boxes[target].focus();
        }
      });
    });
  }

  /* ================================================================
     FILE INPUT STYLING
     ================================================================ */
  setupFileInputs() {
    document.querySelectorAll(".file-upload-area").forEach((area) => {
      const input = area.querySelector(".file-input");
      if (!input) return;

      input.addEventListener("change", () => {
        const file = input.files[0];
        const textEl = area.querySelector(".file-text");
        if (file) {
          area.classList.add("has-file");
          if (textEl) textEl.textContent = file.name;
        } else {
          area.classList.remove("has-file");
          if (textEl)
            textEl.textContent =
              area.querySelector(".file-text")?.dataset.default ||
              "Drop file or click to browse";
        }
      });

      // Drag events
      ["dragover", "dragenter"].forEach((evt) =>
        area.addEventListener(evt, (e) => {
          e.preventDefault();
          area.classList.add("dragover");
        }),
      );
      ["dragleave", "drop"].forEach((evt) =>
        area.addEventListener(evt, () => area.classList.remove("dragover")),
      );
    });
  }

  /* ================================================================
     CUSTOMER TYPE -> IDENTITY FIELDS
     ================================================================ */
  updateIdentityFields() {
    const type =
      document.querySelector('select[name="customerType"]')?.value || "";
    const localDiv = document.getElementById("localFields");
    const foreignDiv = document.getElementById("foreignFields");
    const noTypeMsg = document.getElementById("noTypeMsg");

    if (type === "LOCAL") {
      localDiv.style.display = "block";
      foreignDiv.style.display = "none";
      noTypeMsg.style.display = "none";
    } else if (type === "FOREIGN") {
      localDiv.style.display = "none";
      foreignDiv.style.display = "block";
      noTypeMsg.style.display = "none";
    } else {
      localDiv.style.display = "none";
      foreignDiv.style.display = "none";
      noTypeMsg.style.display = "flex";
    }
  }

  /* ================================================================
     MULTI-STEP NAVIGATION
     ================================================================ */
  goToStep(n) {
    this.currentStep = n;

    // Update step content
    document
      .querySelectorAll(".form-step")
      .forEach((el) => el.classList.remove("active"));
    const target = document.getElementById(`step${n}`);
    if (target) target.classList.add("active");

    // Update step indicator
    document.querySelectorAll(".step-indicator .step").forEach((el) => {
      const s = Number(el.dataset.step);
      el.classList.remove("active", "completed");
      if (s === n) el.classList.add("active");
      else if (s < n) el.classList.add("completed");
    });

    // Update step lines
    const lines = document.querySelectorAll(".step-indicator .step-line");
    lines.forEach((line, i) => {
      line.classList.toggle("done", i + 1 < n);
    });

    // Show/hide buttons
    document.getElementById("prevStepBtn").style.display = n > 1 ? "" : "none";
    document.getElementById("nextStepBtn").style.display =
      n < this.totalSteps ? "" : "none";
    document.getElementById("submitRegBtn").style.display =
      n === this.totalSteps ? "" : "none";

    // If step 3, update identity fields based on type
    if (n === 3) this.updateIdentityFields();
  }

  validateCurrentStep() {
    const step = document.getElementById(`step${this.currentStep}`);
    if (!step) return true;

    // Check required fields only within the visible step
    const requiredInputs = step.querySelectorAll("[required]");
    let valid = true;

    requiredInputs.forEach((input) => {
      input.classList.remove("error");
      if (!input.value.trim()) {
        input.classList.add("error");
        valid = false;
      }
    });

    // Step 1 extra: password match
    if (this.currentStep === 1) {
      const pw = step.querySelector('input[name="password"]');
      const cpw = step.querySelector('input[name="confirmPassword"]');
      if (pw && cpw && pw.value !== cpw.value) {
        cpw.classList.add("error");
        this.toast("Passwords do not match");
        valid = false;
      }
    }

    // Step 3: check identity fields based on customer type
    if (this.currentStep === 3) {
      const type =
        document.querySelector('select[name="customerType"]')?.value || "";
      if (!type) {
        this.toast("Please select a customer type in Step 1");
        valid = false;
      } else {
        const containerId = type === "LOCAL" ? "localFields" : "foreignFields";
        const container = document.getElementById(containerId);
        if (container) {
          const inputs = container.querySelectorAll("input[type='text']");
          inputs.forEach((input) => {
            if (!input.value.trim()) {
              input.classList.add("error");
              valid = false;
            }
          });
          // Check file inputs
          const fileInputs = container.querySelectorAll("input[type='file']");
          fileInputs.forEach((fi) => {
            if (!fi.files || !fi.files.length) {
              fi.closest(".file-upload-area")?.classList.add("error-border");
              valid = false;
            }
          });
        }
      }
    }

    if (!valid && this.currentStep !== 3) {
      this.toast("Please fill in all required fields");
    } else if (!valid) {
      this.toast(
        "Please fill in all identity fields and upload required documents",
      );
    }

    return valid;
  }

  /* ================================================================
     REGISTRATION SUBMISSION
     ================================================================ */
  async submitRegistration() {
    if (!this.validateCurrentStep()) return;

    const form = document.getElementById("registerForm");
    if (!form) return;

    const formData = new FormData(form);
    formData.delete("confirmPassword");

    const email = (formData.get("email") || "").toString().trim();

    const emailInput = form.querySelector('input[name="email"]');
    if (emailInput) emailInput.classList.remove("error");

    const submitBtn = document.getElementById("submitRegBtn");
    const spinner = document.getElementById("regSpinner");

    try {
      submitBtn.disabled = true;
      spinner.style.display = "";

      // STEP 1: Check whether email already exists
      const emailCheck = await this.checkEmailExists(email);

      if (emailCheck.status !== "success") {
        throw new Error(emailCheck.message || "Failed to check email");
      }

      if (emailCheck.exists) {
        if (emailInput) emailInput.classList.add("error");
        throw new Error("This email is already registered");
      }

      // STEP 2: Proceed with signup
      const res = await fetch("/customer/signup", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (data.status !== "success") {
        throw new Error(data.message || "Signup request failed");
      }

      // STEP 3: Send OTP
      const otpRes = await fetch("/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const otpData = await otpRes.json().catch(() => ({}));

      if (otpData.status !== "success") {
        throw new Error(otpData.message || "Failed to send OTP");
      }

      this.closeRegisterModal();
      this.openOtpModal(email);
    } catch (err) {
      console.error("Registration error:", err);
      this.toast(err.message || "Registration failed. Please try again.");
    } finally {
      submitBtn.disabled = false;
      spinner.style.display = "none";
    }
  }

  /* ================================================================
     OTP MODAL
     ================================================================ */
  openOtpModal(email) {
    const modal = document.getElementById("otpModal");
    if (!modal) return;

    // Set email display
    document.getElementById("otpEmailDisplay").textContent = email || "—";

    // Clear inputs
    document.querySelectorAll(".otp-box").forEach((b) => {
      b.value = "";
      b.classList.remove("filled", "error");
    });
    document.getElementById("otpError").style.display = "none";

    modal.classList.add("show");
    document.body.style.overflow = "hidden";

    // Focus first box
    setTimeout(() => document.querySelector(".otp-box")?.focus(), 100);

    // Start countdown
    this.startOtpTimer();
  }

  closeOtpModal() {
    const modal = document.getElementById("otpModal");
    if (!modal) return;
    modal.classList.remove("show");
    document.body.style.overflow = "";
    this.stopOtpTimer();
  }

  startOtpTimer() {
    this.stopOtpTimer();
    this.otpSeconds = 300;
    const countdownEl = document.getElementById("otpCountdown");
    const resendBtn = document.getElementById("resendBtn");
    resendBtn.disabled = true;

    const tick = () => {
      const m = Math.floor(this.otpSeconds / 60);
      const s = this.otpSeconds % 60;
      countdownEl.textContent = `${m}:${String(s).padStart(2, "0")}`;

      if (this.otpSeconds <= 0) {
        this.stopOtpTimer();
        countdownEl.textContent = "0:00";
        resendBtn.disabled = false;
      } else {
        this.otpSeconds--;
      }
    };

    tick();
    this.otpTimer = setInterval(tick, 1000);
  }

  stopOtpTimer() {
    if (this.otpTimer) {
      clearInterval(this.otpTimer);
      this.otpTimer = null;
    }
  }

  async verifyOtp() {
    const boxes = document.querySelectorAll(".otp-box");
    const code = Array.from(boxes)
      .map((b) => b.value)
      .join("");

    if (code.length < 6) {
      boxes.forEach((b) => {
        if (!b.value) b.classList.add("error");
      });
      document.getElementById("otpError").textContent =
        "Please enter the full 6-digit code.";
      document.getElementById("otpError").style.display = "block";
      return;
    }

    const submitBtn = document.getElementById("otpSubmitBtn");
    const spinner = document.getElementById("otpSpinner");

    try {
      submitBtn.disabled = true;
      spinner.style.display = "";

      const res = await fetch("/code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code: code }),
      });

      const data = await res.json().catch(() => ({}));

      if (data.status === "success") {
        this.closeOtpModal();
        this.openSuccessModal();
        this.loadCustomers(); // Refresh list
      } else {
        boxes.forEach((b) => b.classList.add("error"));
        const errEl = document.getElementById("otpError");
        errEl.textContent = data.message || "Invalid code. Please try again.";
        errEl.style.display = "block";
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      this.toast("Verification failed. Please try again.");
    } finally {
      submitBtn.disabled = false;
      spinner.style.display = "none";
    }
  }

  async resendOtp() {
    const email = document.getElementById("otpEmailDisplay")?.textContent || "";
    if (!email || email === "—") return;

    try {
      const res = await fetch("/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email }),
      });

      const data = await res.json().catch(() => ({}));

      if (data.status === "success") {
        this.toast("New code sent!");
        this.startOtpTimer();
        // Clear inputs
        document.querySelectorAll(".otp-box").forEach((b) => {
          b.value = "";
          b.classList.remove("filled", "error");
        });
        document.getElementById("otpError").style.display = "none";
        document.querySelector(".otp-box")?.focus();
      } else {
        this.toast(data.message || "Failed to resend code");
      }
    } catch (err) {
      this.toast("Failed to resend code");
    }
  }

  /* ================================================================
     MODAL HELPERS
     ================================================================ */
  openRegisterModal() {
    const modal = document.getElementById("registerModal");
    if (!modal) return;
    // Reset form & step
    document.getElementById("registerForm")?.reset();
    this.goToStep(1);
    this.updateIdentityFields();
    // Clear any error highlights
    document
      .querySelectorAll(".form-control.error")
      .forEach((el) => el.classList.remove("error"));
    document
      .querySelectorAll(".file-upload-area.has-file")
      .forEach((el) => el.classList.remove("has-file"));
    document.querySelectorAll(".file-upload-area .file-text").forEach((el) => {
      if (el.textContent !== el.dataset?.default) {
        // Restore default text
        const parent = el.closest(".file-upload-area");
        if (parent) {
          const hint = parent.querySelector(".file-hint");
          el.textContent = el.textContent.includes("NIC")
            ? "Drop NIC image or click to browse"
            : el.textContent.includes("passport")
              ? "Drop passport image or click to browse"
              : "Drop license image or click to browse";
        }
      }
    });

    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  closeRegisterModal() {
    const modal = document.getElementById("registerModal");
    if (!modal) return;
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  openSuccessModal() {
    const modal = document.getElementById("successModal");
    if (!modal) return;
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  closeSuccessModal() {
    const modal = document.getElementById("successModal");
    if (!modal) return;
    modal.classList.remove("show");
    document.body.style.overflow = "";
  }

  /* ================================================================
     API — CUSTOMER LIST
     ================================================================ */
  buildQueryFromUI() {
    const qs = new URLSearchParams();
    const name = (this.nameEl?.value || "").trim();
    const nic = (this.nicEl?.value || "").trim();
    const location = (this.locEl?.value || "").trim();
    const status = (this.statEl?.value || "").trim();
    const joinFrom = (this.joinFrom?.value || "").trim();
    const joinTo = (this.joinTo?.value || "").trim();
    const minBookings = (this.bookMinEl?.value || "").trim();
    const maxBookings = (this.bookMaxEl?.value || "").trim();

    if (name) qs.set("name", name);
    if (nic) qs.set("nic", nic);
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

      this.customers = Array.isArray(data.customers) ? data.customers : [];
      this.filteredCustomers = [...this.customers];

      this.populateLocationFilterFromData(this.customers);
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
    this.locEl.innerHTML = `<option value="">All</option>`;
    uniq.forEach((loc) => {
      const o = document.createElement("option");
      o.value = loc;
      o.textContent = loc;
      this.locEl.appendChild(o);
    });
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
          <div class="status-badge ${String(c.status || "").toLowerCase() === "active" ? "status-active" : "status-inactive"}">${this.esc(String(c.status || "—").toLowerCase() === "active" ? "Active" : "Inactive")}</div>
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

  toast(message) {
    const el = document.createElement("div");
    el.textContent = message;
    el.style.cssText = `position:fixed;right:16px;bottom:16px;background:#1a1a2e;color:#fff;padding:12px 18px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:1100;font-size:14px;font-weight:500;animation:fadeInUp 0.3s ease;max-width:340px;`;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.3s";
      setTimeout(() => el.remove(), 300);
    }, 2500);
  }
}

/* ================================================================
   GLOBAL FUNCTIONS (called by onclick in HTML)
   ================================================================ */
let mgr;

window.addEventListener("DOMContentLoaded", () => {
  mgr = new CustomersManager();
  window.customersManager = mgr;
});

function searchCustomers() {
  mgr?.loadCustomers();
}
function clearFilters() {
  mgr?.clearFiltersAndReload();
}

function openRegisterModal() {
  mgr?.openRegisterModal();
}
function closeRegisterModal() {
  mgr?.closeRegisterModal();
}

function nextStep() {
  if (!mgr) return;
  if (!mgr.validateCurrentStep()) return;
  if (mgr.currentStep < mgr.totalSteps) {
    mgr.goToStep(mgr.currentStep + 1);
  }
}

function prevStep() {
  if (!mgr) return;
  if (mgr.currentStep > 1) {
    mgr.goToStep(mgr.currentStep - 1);
  }
}

function submitRegistration() {
  mgr?.submitRegistration();
}

function closeOtpModal() {
  mgr?.closeOtpModal();
}
function verifyOtp() {
  mgr?.verifyOtp();
}
function resendOtp() {
  mgr?.resendOtp();
}

function closeSuccessModal() {
  mgr?.closeSuccessModal();
}

function togglePassword(btn) {
  const input = btn.previousElementSibling;
  if (!input) return;
  if (input.type === "password") {
    input.type = "text";
    btn.textContent = "🙈";
  } else {
    input.type = "password";
    btn.textContent = "👁";
  }
}
