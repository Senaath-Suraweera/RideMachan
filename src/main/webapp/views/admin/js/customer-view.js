// js/customer-view.js  (API-wired version with edit support)
(function () {
  const API_BASE = "/api/admin/customers";

  const $ = (s) => document.querySelector(s);
  const esc = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");

  const q = new URLSearchParams(location.search);
  const id = Number(q.get("id"));

  // Current customer data (shared across functions)
  let currentCustomer = null;

  // Edit modal step state
  let editStep = 1;
  const editTotalSteps = 3;

  function initials(n) {
    return String(n || "—")
      .trim()
      .split(/\s+/)
      .map((p) => p[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function formatDate(d) {
    if (!d) return "—";
    try {
      const date = new Date(d);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (_) {
      return d;
    }
  }

  function statusClass(status) {
    const s = String(status || "").toLowerCase();
    if (s === "active") return "status-active";
    return "status-inactive";
  }

  function statusLabel(status) {
    const s = String(status || "").toLowerCase();
    return s === "active" ? "Active" : "Inactive";
  }

  /* ================================================================
     RENDER PROFILE HEADER
     ================================================================ */
  function render(c) {
    currentCustomer = c;
    const mount = $("#customerView");
    if (!mount) return;

    const status = String(c.status || "—").toLowerCase();
    const joined = formatDate(c.joinDate);
    const verified = c.verified ? "Verified" : "Not Verified";
    const verifiedClass = c.verified ? "badge-verified" : "badge-unverified";

    mount.innerHTML = `
      <div class="profile-header">
        <div class="profile-avatar"><span>${esc(initials(c.name))}</span></div>
        <div class="profile-basic">
          <h2>${esc(c.name || "—")}</h2>
          <div class="profile-meta">
            <span><i class="fa-solid fa-at"></i> ${esc(c.username || "—")}</span>
            <span><i class="fa-solid fa-location-dot"></i> ${esc(c.city || c.location || "—")}</span>
            <span><i class="fa-regular fa-calendar"></i> Joined ${esc(joined)}</span>
            <span><i class="fa-solid fa-car"></i> ${Number(c.bookings) || 0} bookings</span>
            <span><i class="fa-solid fa-star"></i> ${(Number(c.rating) || 0).toFixed(1)} (${Number(c.reviews) || 0} reviews)</span>
          </div>
          <div class="profile-badges">
            <span class="profile-badge ${esc(c.customerType === "FOREIGN" ? "badge-foreign" : "badge-local")}">
              <i class="fa-solid ${c.customerType === "FOREIGN" ? "fa-globe" : "fa-house"}"></i>
              ${esc(c.customerType || "—")}
            </span>
            <span class="profile-badge ${verifiedClass}">
              <i class="fa-solid ${c.verified ? "fa-circle-check" : "fa-circle-xmark"}"></i>
              ${verified}
            </span>
          </div>
          <div class="profile-desc">${esc(c.description || "—")}</div>
        </div>
        <div class="profile-contact">
          <div><i class="fa-solid fa-phone"></i> ${esc(c.phone || "—")}</div>
          <div><i class="fa-regular fa-envelope"></i> ${esc(c.email || "—")}</div>
          <div class="status-badge ${statusClass(status)}">
            ${esc(statusLabel(status))}
          </div>
        </div>
      </div>
    `;

    renderAccountInfo(c);
    renderAddressInfo(c);
    renderIdentityInfo(c);
    renderStatsInfo(c);

    // Load iframe pages
    const qs = new URLSearchParams({
      customerId: String(c.id),
      customerName: c.name || "",
    });
    $("#ongoingFrame").src = `ongoing-bookings.html?${qs.toString()}`;
    $("#pastFrame").src = `past-bookings.html?${qs.toString()}`;

    // Ban button wiring
    wireBanButton(c);
  }

  /* ================================================================
     DETAIL INFO CARDS
     ================================================================ */
  function renderAccountInfo(c) {
    const body = $("#accountInfoBody");
    if (!body) return;
    body.innerHTML = `
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Username</span>
          <span class="info-value">${esc(c.username || "—")}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Email</span>
          <span class="info-value">${esc(c.email || "—")}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Mobile Number</span>
          <span class="info-value">${esc(c.phone || "—")}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Customer Type</span>
          <span class="info-value">
            <span class="inline-badge ${c.customerType === "FOREIGN" ? "badge-foreign" : "badge-local"}">
              ${esc(c.customerType || "—")}
            </span>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Status</span>
          <span class="info-value">
            <span class="inline-badge ${statusClass(c.status)}">${esc(statusLabel(c.status))}</span>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Verified</span>
          <span class="info-value">
            <span class="inline-badge ${c.verified ? "badge-verified" : "badge-unverified"}">
              ${c.verified ? "Yes" : "No"}
            </span>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Joined Date</span>
          <span class="info-value">${esc(formatDate(c.joinDate))}</span>
        </div>
      </div>
    `;
  }

  function renderAddressInfo(c) {
    const body = $("#addressInfoBody");
    if (!body) return;

    const fullAddress = [c.street, c.city, c.zipCode, c.country]
      .filter(Boolean)
      .join(", ");

    body.innerHTML = `
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">Street</span>
          <span class="info-value">${esc(c.street || "—")}</span>
        </div>
        <div class="info-item">
          <span class="info-label">City</span>
          <span class="info-value">${esc(c.city || "—")}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Zip Code</span>
          <span class="info-value">${esc(c.zipCode || "—")}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Country</span>
          <span class="info-value">${esc(c.country || "—")}</span>
        </div>
        <div class="info-item full-width">
          <span class="info-label">Full Address</span>
          <span class="info-value">${esc(fullAddress || "—")}</span>
        </div>
      </div>
    `;
  }

  function renderIdentityInfo(c) {
    const body = $("#identityInfoBody");
    if (!body) return;

    const type = String(c.customerType || "").toUpperCase();

    let html = "";
    if (type === "LOCAL") {
      html = `
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">NIC Number</span>
            <span class="info-value">${esc(c.nic || "—")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Driver's License No.</span>
            <span class="info-value">${esc(c.license || "—")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">NIC Image</span>
            <span class="info-value">
              ${
                c.hasNicImage
                  ? `<button class="btn-view-doc" onclick="viewDocument(${c.id}, 'nic')"><i class="fa-solid fa-eye"></i> View Document</button>`
                  : '<span class="text-muted">Not uploaded</span>'
              }
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">License Image</span>
            <span class="info-value">
              ${
                c.hasLicenseImage
                  ? `<button class="btn-view-doc" onclick="viewDocument(${c.id}, 'license')"><i class="fa-solid fa-eye"></i> View Document</button>`
                  : '<span class="text-muted">Not uploaded</span>'
              }
            </span>
          </div>
        </div>
      `;
    } else if (type === "FOREIGN") {
      html = `
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">Passport Number</span>
            <span class="info-value">${esc(c.nic || "—")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">International License No.</span>
            <span class="info-value">${esc(c.license || "—")}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Passport Image</span>
            <span class="info-value">
              ${
                c.hasPassportImage
                  ? `<button class="btn-view-doc" onclick="viewDocument(${c.id}, 'passport')"><i class="fa-solid fa-eye"></i> View Document</button>`
                  : '<span class="text-muted">Not uploaded</span>'
              }
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">Int'l License Image</span>
            <span class="info-value">
              ${
                c.hasIntlLicenseImage
                  ? `<button class="btn-view-doc" onclick="viewDocument(${c.id}, 'intl-license')"><i class="fa-solid fa-eye"></i> View Document</button>`
                  : '<span class="text-muted">Not uploaded</span>'
              }
            </span>
          </div>
        </div>
      `;
    } else {
      html = `<div class="text-muted" style="padding:12px;">Customer type not specified.</div>`;
    }

    body.innerHTML = html;
  }

  function renderStatsInfo(c) {
    const body = $("#statsInfoBody");
    if (!body) return;
    body.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-number">${Number(c.bookings) || 0}</div>
          <div class="stat-label">Total Bookings</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${(Number(c.rating) || 0).toFixed(1)}</div>
          <div class="stat-label">Avg Rating</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${Number(c.reviews) || 0}</div>
          <div class="stat-label">Reviews</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${esc(formatDate(c.joinDate))}</div>
          <div class="stat-label">Member Since</div>
        </div>
      </div>
    `;
  }

  /* ================================================================
     FETCH CUSTOMER
     ================================================================ */
  async function fetchCustomer(customerId) {
    const res = await fetch(`${API_BASE}/${customerId}`, {
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  /* ================================================================
     TABS
     ================================================================ */
  function wireTabs() {
    const tabs = document.querySelectorAll(".tab");
    const panels = {
      ongoing: document.getElementById("panel-ongoing"),
      past: document.getElementById("panel-past"),
    };

    tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabs.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const key = btn.getAttribute("data-tab");
        Object.values(panels).forEach((p) => p.classList.remove("active"));
        panels[key]?.classList.add("active");
      });
    });
  }

  /* ================================================================
     TOAST
     ================================================================ */
  function toast(message, type) {
    const el = document.createElement("div");
    el.textContent = message;
    const bg =
      type === "success"
        ? "linear-gradient(135deg, #10b981, #34d399)"
        : type === "error"
          ? "linear-gradient(135deg, #ef4444, #f87171)"
          : "#1a1a2e";
    el.style.cssText = `position:fixed;right:16px;bottom:16px;background:${bg};color:#fff;padding:12px 20px;border-radius:12px;box-shadow:0 8px 24px rgba(0,0,0,.2);z-index:1300;font-size:14px;font-weight:500;animation:fadeInUp 0.3s ease;max-width:360px;`;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity 0.3s";
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }

  /* ================================================================
     BAN BUTTON
     ================================================================ */
  function wireBanButton(customer) {
    const btn = document.getElementById("banCustomerBtn");
    if (!btn) return;

    const isActive = String(customer.status || "").toLowerCase() === "active";

    btn.innerHTML = isActive
      ? '<i class="fa-solid fa-user-slash"></i> Deactivate Customer'
      : '<i class="fa-solid fa-user-check"></i> Activate Customer';

    btn.classList.remove("btn-danger", "btn-primary");
    btn.classList.add(isActive ? "btn-danger" : "btn-primary");

    btn.onclick = async () => {
      const nextStatus = isActive ? "inactive" : "active";

      const confirmMsg = isActive
        ? "Deactivate this customer? They won’t be able to use the platform."
        : "Activate this customer?";

      if (!confirm(confirmMsg)) return;

      try {
        const res = await fetch(`${API_BASE}/${customer.id}/status`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ status: nextStatus }),
        });

        const out = await res.json().catch(() => ({}));
        if (!res.ok || !out.success) {
          throw new Error(out.error || `HTTP ${res.status}`);
        }

        toast(
          nextStatus === "active"
            ? "Customer activated"
            : "Customer deactivated",
          "success",
        );

        const fresh = await fetchCustomer(customer.id);
        render(fresh);
      } catch (e) {
        console.error(e);
        toast("Failed to update status", "error");
      }
    };
  }

  /* ================================================================
     VIEW DOCUMENT (placeholder — needs backend endpoint)
     ================================================================ */
  window.viewDocument = function (customerId, docType) {
    const url = `${API_BASE}/${customerId}/document/${encodeURIComponent(docType)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ================================================================
     EDIT MODAL — STEP NAVIGATION
     ================================================================ */
  function goToEditStep(n) {
    editStep = n;

    document
      .querySelectorAll("#editModal .form-step")
      .forEach((el) => el.classList.remove("active"));
    const target = document.getElementById(`editStep${n}`);
    if (target) target.classList.add("active");

    document.querySelectorAll("#editStepIndicator .step").forEach((el) => {
      const s = Number(el.dataset.step);
      el.classList.remove("active", "completed");
      if (s === n) el.classList.add("active");
      else if (s < n) el.classList.add("completed");
    });

    const lines = document.querySelectorAll("#editStepIndicator .step-line");
    lines.forEach((line, i) => {
      line.classList.toggle("done", i + 1 < n);
    });

    $("#editPrevBtn").style.display = n > 1 ? "" : "none";
    $("#editNextBtn").style.display = n < editTotalSteps ? "" : "none";
    $("#editSubmitBtn").style.display = n === editTotalSteps ? "" : "none";

    if (n === 3) updateEditIdentityFields();
  }

  function updateEditIdentityFields() {
    const type =
      document.querySelector('#editForm select[name="customerType"]')?.value ||
      "";
    const localDiv = document.getElementById("editLocalFields");
    const foreignDiv = document.getElementById("editForeignFields");
    const noTypeMsg = document.getElementById("editNoTypeMsg");

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

  function validateEditStep() {
    const step = document.getElementById(`editStep${editStep}`);
    if (!step) return true;

    let valid = true;
    step.querySelectorAll(".form-control, .form-select").forEach((input) => {
      input.classList.remove("error");
    });

    const requiredInputs = step.querySelectorAll("[required]");
    requiredInputs.forEach((input) => {
      if (!String(input.value || "").trim()) {
        input.classList.add("error");
        valid = false;
      }
    });

    if (!valid) {
      toast("Please fill in all required fields", "error");
    }
    return valid;
  }

  /* ================================================================
     EDIT MODAL — OPEN / CLOSE / POPULATE
     ================================================================ */
  window.openEditModal = function () {
    if (!currentCustomer) {
      toast("No customer data loaded", "error");
      return;
    }

    const modal = document.getElementById("editModal");
    if (!modal) return;

    const c = currentCustomer;
    const form = document.getElementById("editForm");

    // Populate form fields
    const setVal = (name, val) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el) el.value = val || "";
    };

    setVal("username", c.username);
    setVal("email", c.email);
    setVal("mobileNumber", c.phone);
    setVal("customerType", c.customerType);

    // Derive status for the select
    const status = String(c.status || "active").toLowerCase();
    setVal("status", status);
    setVal("verified", c.verified ? "true" : "false");

    // Split name into first/last
    const nameParts = String(c.name || "")
      .trim()
      .split(/\s+/);
    setVal("firstname", c.firstname || nameParts[0] || "");
    setVal("lastname", c.lastname || nameParts.slice(1).join(" ") || "");

    setVal("street", c.street);
    setVal("city", c.city);
    setVal("zipCode", c.zipCode);
    setVal("country", c.country);

    // Identity fields
    if (c.customerType === "LOCAL") {
      setVal("nicNumber", c.nic);
      setVal("driversLicenseNumber", c.license);
    } else if (c.customerType === "FOREIGN") {
      setVal("passportNumber", c.nic);
      setVal("internationalDriversLicenseNumber", c.license);
    }

    // Clear file inputs and error states
    form
      .querySelectorAll(".form-control.error, .form-select.error")
      .forEach((el) => el.classList.remove("error"));

    form
      .querySelectorAll(".file-upload-area")
      .forEach((el) =>
        el.classList.remove("has-file", "error-border", "dragover"),
      );

    form.querySelectorAll(".file-upload-area .file-text").forEach((el) => {
      el.textContent = el.dataset.default || "Drop file or click to browse";
    });

    form.querySelectorAll('input[type="file"]').forEach((fi) => {
      fi.value = "";
    });

    // Wire customer type change for identity fields
    const typeSelect = form.querySelector('select[name="customerType"]');
    typeSelect.onchange = () => updateEditIdentityFields();

    goToEditStep(1);
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  };

  window.closeEditModal = function () {
    const modal = document.getElementById("editModal");
    if (!modal) return;
    modal.classList.remove("show");
    document.body.style.overflow = "";
  };

  window.editNextStep = function () {
    if (!validateEditStep()) return;
    if (editStep < editTotalSteps) {
      goToEditStep(editStep + 1);
    }
  };

  window.editPrevStep = function () {
    if (editStep > 1) {
      goToEditStep(editStep - 1);
    }
  };

  /* ================================================================
     EDIT MODAL — SUBMIT
     ================================================================ */
  window.submitEdit = async function () {
    if (!validateEditStep()) return;
    if (!currentCustomer) return;

    const form = document.getElementById("editForm");
    const formData = new FormData(form);

    // Build JSON payload for the PUT endpoint
    const payload = {};
    payload.username = (formData.get("username") || "").toString().trim();

    payload.email = (formData.get("email") || currentCustomer.email || "")
      .toString()
      .trim();

    payload.phone = (formData.get("mobileNumber") || "").toString().trim();

    // Customer type is DISABLED — not in FormData. Pull from currentCustomer.
    payload.customerType = String(
      currentCustomer.customerType || "",
    ).toUpperCase();

    payload.status = (formData.get("status") || "active").toString().trim();

    // Verified is DISABLED — not in FormData. Pull from currentCustomer.
    payload.verified = Boolean(currentCustomer.verified);

    payload.firstName = (formData.get("firstname") || "").toString().trim();
    payload.lastName = (formData.get("lastname") || "").toString().trim();
    payload.street = (formData.get("street") || "").toString().trim();
    payload.city = (formData.get("city") || "").toString().trim();
    payload.zipCode = (formData.get("zipCode") || "").toString().trim();
    payload.country = (formData.get("country") || "").toString().trim();

    if (payload.customerType === "LOCAL") {
      // These are readonly — use currentCustomer as source of truth
      payload.nicNumber = String(currentCustomer.nic || "").trim();
      payload.driversLicenseNumber = String(
        currentCustomer.license || "",
      ).trim();
    } else if (payload.customerType === "FOREIGN") {
      payload.passportNumber = String(currentCustomer.nic || "").trim();
      payload.internationalDriversLicenseNumber = String(
        currentCustomer.license || "",
      ).trim();
    }

    const submitBtn = document.getElementById("editSubmitBtn");
    const spinner = document.getElementById("editSpinner");

    try {
      submitBtn.disabled = true;
      spinner.style.display = "";

      const res = await fetch(`${API_BASE}/${currentCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || data.success === false) {
        throw new Error(data.error || data.message || "Update failed");
      }

      // Handle file uploads separately if any files were selected
      const fileInputs = form.querySelectorAll('input[type="file"]');
      let hasFiles = false;
      fileInputs.forEach((fi) => {
        if (fi.files && fi.files.length > 0) hasFiles = true;
      });

      if (hasFiles) {
        const fileData = new FormData();

        fileInputs.forEach((fi) => {
          if (fi.files && fi.files.length > 0) {
            fileData.append(fi.name, fi.files[0]);
          }
        });

        const fileRes = await fetch(
          `${API_BASE}/${currentCustomer.id}/documents`,
          {
            method: "POST",
            credentials: "include",
            body: fileData,
          },
        );

        const fileOut = await fileRes.json().catch(() => ({}));

        if (!fileRes.ok || fileOut.success === false) {
          throw new Error(
            fileOut.error || fileOut.message || "Document upload failed",
          );
        }
      }

      closeEditModal();

      // Show success modal
      const successModal = document.getElementById("editSuccessModal");
      if (successModal) {
        successModal.classList.add("show");
        document.body.style.overflow = "hidden";
      }

      // Refresh customer data
      const fresh = await fetchCustomer(currentCustomer.id);
      render(fresh);
    } catch (err) {
      console.error("Edit error:", err);
      toast(err.message || "Failed to update customer", "error");
    } finally {
      submitBtn.disabled = false;
      spinner.style.display = "none";
    }
  };

  window.closeEditSuccessModal = function () {
    const modal = document.getElementById("editSuccessModal");
    if (!modal) return;
    modal.classList.remove("show");
    document.body.style.overflow = "";
  };

  /* ================================================================
     FILE INPUT STYLING (for edit modal)
     ================================================================ */
  function setupEditFileInputs() {
    document
      .querySelectorAll("#editModal .file-upload-area")
      .forEach((area) => {
        const input = area.querySelector(".file-input");
        if (!input) return;

        input.addEventListener("change", () => {
          const file = input.files[0];
          const textEl = area.querySelector(".file-text");
          if (file) {
            area.classList.add("has-file");
            area.classList.remove("error-border");
            if (textEl) textEl.textContent = file.name;
          } else {
            area.classList.remove("has-file");
            if (textEl) {
              textEl.textContent =
                textEl.dataset.default || "Drop file or click to browse";
            }
          }
        });

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
     MODAL BACKDROP CLOSE
     ================================================================ */
  function setupModalBackdrops() {
    document.querySelectorAll(".modal").forEach((modal) => {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("show");
          document.body.style.overflow = "";
        }
      });
    });
  }

  /* ================================================================
     INIT
     ================================================================ */
  document.addEventListener("DOMContentLoaded", async () => {
    // back button
    document
      .getElementById("backToCustomersBtn")
      ?.addEventListener("click", () => {
        window.location.href = "customers.html";
      });

    setupEditFileInputs();
    setupModalBackdrops();

    if (!Number.isFinite(id)) {
      $("#customerView").innerHTML =
        `<p style="margin:0;color:#374151;">Missing customer id.</p>`;
      return;
    }

    try {
      const customer = await fetchCustomer(id);
      render(customer);
      wireTabs();
    } catch (e) {
      console.error(e);
      $("#customerView").innerHTML =
        `<p style="margin:0;color:#b91c1c;">Failed to load customer ${esc(
          id,
        )}. Check session/login and API.</p>`;
    }
  });
})();
