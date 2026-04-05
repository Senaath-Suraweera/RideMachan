// apply-rental-company.js (REAL API version)

const BASE_URL = "http://localhost:8080";
// If you use context path, uncomment:
// const BASE_URL = "http://localhost:8080/RideMachan";

const VEHICLES_API = `${BASE_URL}/api/vehicles`; // has /me
const PROVIDER_REQ_API = `${BASE_URL}/api/provider/rental-requests`;

let providerId = null;
let companies = [];
let myRequests = [];

document.addEventListener("DOMContentLoaded", async () => {
  providerId = await getProviderIdFromSession();
  if (!providerId) {
    alert("Session expired / not logged in as Provider.");
    return;
  }

  await Promise.all([loadCompanies(), loadMyRequests()]);
  renderCompanies(companies);
  bindForm();
});

async function apiFetch(url, options = {}) {
  return fetch(url, { ...options, credentials: "include" }); // ✅ send JSESSIONID cookie
}

async function getProviderIdFromSession() {
  try {
    const res = await apiFetch(`${VEHICLES_API}/me`);
    if (!res.ok) return null;
    const me = await res.json();
    return Number(me.providerId) || null;
  } catch (e) {
    console.error("Failed /me", e);
    return null;
  }
}

async function loadCompanies() {
  const res = await apiFetch(`${PROVIDER_REQ_API}/companies`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  companies = data.companies || [];
}

async function loadCompanyDetails(companyId) {
  try {
    const res = await apiFetch(`${PROVIDER_REQ_API}/companies/${companyId}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return data.company || null;
  } catch (e) {
    console.error("Failed to load company details", e);
    return null;
  }
}

async function loadMyRequests() {
  const res = await apiFetch(`${PROVIDER_REQ_API}/mine`);
  if (!res.ok) {
    myRequests = [];
    return;
  }
  const data = await res.json();
  myRequests = data.requests || [];
}

function hasAnyPendingForCompany(companyId) {
  return myRequests.some(
    (r) =>
      Number(r.company_id) === Number(companyId) &&
      String(r.status).toLowerCase() === "pending",
  );
}

function renderCompanies(list) {
  const container = document.querySelector(".companies-container");
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `<p>No companies available.</p>`;
    return;
  }

  container.innerHTML = "";

  list.forEach((c) => {
    const companyId = c.companyid;
    const pending = hasAnyPendingForCompany(companyId);

    const rating = Number(c.rating || 4);
    const reviews = Number(c.reviews || 0);
    const location = (c.location || "N/A").toString();

    const card = document.createElement("div");
    card.className = "company-card";
    card.dataset.rating = String(rating);
    card.dataset.location = location.toLowerCase();
    card.dataset.companyId = String(companyId);

    card.innerHTML = `
      <div class="company-header">
        <div class="company-logo">
          <div class="logo-placeholder">Logo</div>
        </div>
        <div class="company-main-info">
          <h3 class="company-name">${escapeHtml(c.companyname || "Rental Company")}</h3>
          <div class="company-rating">
            <div class="stars">${renderStars(rating)}</div>
            <span class="rating-text">No of reviews: ${reviews}</span>
          </div>
          <div class="company-location">📍 ${escapeHtml(location)}</div>
        </div>
        <div class="company-actions">
          <button class="btn btn-primary apply-btn" ${pending ? "disabled" : ""}>
            ${pending ? "Application Sent" : "Apply Now"}
          </button>
          ${pending ? `<div class="status-badge status-pending" style="margin-top:8px;">Application Pending</div>` : ""}
        </div>
      </div>

      <div class="company-description">
        <p>${escapeHtml(c.description || "No description available.")}</p>
      </div>

      <div class="company-details">
        <div class="detail-item">
          <strong>Drivers:</strong>
          <span class="driver-count">${Number(c.drivers || 0)}</span>
          <span class="driver-note">(Click card to view more details)</span>
        </div>
        <div class="business-license">
          <strong>Business License Number:</strong> ${escapeHtml(c.businesslicensenumber || "N/A")}
        </div>
      </div>
    `;

    const btn = card.querySelector(".apply-btn");
    btn.addEventListener("click", (e) => {
      e.stopPropagation(); // Prevent card click event
      openApplicationModal(companyId, c.companyname || "Company");
    });

    // Add click event to card for detail view
    card.addEventListener("click", (e) => {
      // Don't open details if clicking the apply button
      if (e.target.closest(".apply-btn")) return;
      openCompanyDetailModal(companyId);
    });

    container.appendChild(card);
  });
}

// Filters/sorting (keep your UI)
function applyFilters() {
  const locationFilter =
    document.getElementById("locationFilter")?.value?.toLowerCase() || "";
  const minRating = parseInt(
    document.getElementById("ratingFilter")?.value || "0",
    10,
  );

  const cards = document.querySelectorAll(".company-card");
  cards.forEach((card) => {
    const cardLoc = (card.dataset.location || "").toLowerCase();
    const cardRating = parseInt(card.dataset.rating || "0", 10);

    const okLoc = !locationFilter || cardLoc.includes(locationFilter);
    const okRating = cardRating >= minRating;

    card.style.display = okLoc && okRating ? "" : "none";
  });

  updateResultsCount();
}

function applySorting() {
  const sortValue = document.getElementById("sortSelect").value;
  const container = document.querySelector(".companies-container");
  const companyCards = Array.from(container.querySelectorAll(".company-card"));

  companyCards.sort((a, b) => {
    switch (sortValue) {
      case "Sort by Name (A-Z)":
        return a
          .querySelector(".company-name")
          .textContent.localeCompare(
            b.querySelector(".company-name").textContent,
          );
      case "Sort by Name (Z-A)":
        return b
          .querySelector(".company-name")
          .textContent.localeCompare(
            a.querySelector(".company-name").textContent,
          );
      case "Sort by Location":
        return a
          .querySelector(".company-location")
          .textContent.localeCompare(
            b.querySelector(".company-location").textContent,
          );
      case "Sort by Reviews": {
        const reviewsA = parseInt(
          a.querySelector(".rating-text").textContent.match(/\d+/)?.[0] || "0",
          10,
        );
        const reviewsB = parseInt(
          b.querySelector(".rating-text").textContent.match(/\d+/)?.[0] || "0",
          10,
        );
        return reviewsB - reviewsA;
      }
      case "Sort by Rating":
      default: {
        const ratingA = parseInt(a.dataset.rating || "0", 10);
        const ratingB = parseInt(b.dataset.rating || "0", 10);
        return ratingB - ratingA;
      }
    }
  });

  companyCards.forEach((card) => container.appendChild(card));
}

function searchCompanies() {
  applyFilters();
  const searchButton = event?.target;
  if (!searchButton) return;

  const originalText = searchButton.textContent;
  searchButton.textContent = "🔄 Searching...";
  searchButton.disabled = true;

  setTimeout(() => {
    searchButton.textContent = originalText;
    searchButton.disabled = false;
  }, 600);
}

function updateResultsCount() {
  const visibleCards = document.querySelectorAll(
    '.company-card:not([style*="display: none"])',
  ).length;
  const totalCards = document.querySelectorAll(".company-card").length;
  console.log(`Showing ${visibleCards} of ${totalCards} companies`);
}

// ---------------- COMPANY DETAIL MODAL ----------------
async function openCompanyDetailModal(companyId) {
  const detailOverlay = document.getElementById("companyDetailOverlay");
  if (!detailOverlay) return;

  // Show loading state
  const detailBody = detailOverlay.querySelector(".company-detail-body");
  if (detailBody) {
    detailBody.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p>Loading company details...</p>
      </div>
    `;
  }

  detailOverlay.classList.add("active");
  document.body.style.overflow = "hidden";

  // Load company details
  const company = await loadCompanyDetails(companyId);
  if (!company) {
    if (detailBody) {
      detailBody.innerHTML = `
        <div style="text-align: center; padding: 40px;">
          <p>Failed to load company details.</p>
        </div>
      `;
    }
    return;
  }

  // Update modal content
  const modalTitle = detailOverlay.querySelector(".company-detail-header h2");
  if (modalTitle) {
    modalTitle.textContent = company.companyname || "Company Details";
  }

  if (detailBody) {
    const location = buildLocationString(company.street, company.city);
    const rating = Number(company.rating || 4);
    const reviews = Number(company.reviews || 0);
    const drivers = Number(company.drivers || 0);
    const vehicles = Number(company.vehicles || 0);

    detailBody.innerHTML = `
      <div class="company-detail-info">
        <div class="detail-section">
          <h3>About ${escapeHtml(company.companyname || "Company")}</h3>
          <p>${escapeHtml(company.description || "No description available.")}</p>
        </div>

        <div class="detail-section">
          <h3>Contact Information</h3>
          <div class="detail-grid">
            <div class="detail-row">
              <strong>Email:</strong>
              <span>${escapeHtml(company.companyemail || "N/A")}</span>
            </div>
            <div class="detail-row">
              <strong>Phone:</strong>
              <span>${escapeHtml(company.phone || "N/A")}</span>
            </div>
            <div class="detail-row">
              <strong>Location:</strong>
              <span>${escapeHtml(location || "N/A")}</span>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h3>Company Information</h3>
          <div class="detail-grid">
            <div class="detail-row">
              <strong>Registration Number:</strong>
              <span>${escapeHtml(company.registrationnumber || "N/A")}</span>
            </div>
            <div class="detail-row">
              <strong>Tax ID:</strong>
              <span>${escapeHtml(company.taxid || "N/A")}</span>
            </div>
            <div class="detail-row">
              <strong>Business License:</strong>
              <span>${escapeHtml(company.businesslicensenumber || "N/A")}</span>
            </div>
          </div>
        </div>

        ${
          company.terms
            ? `
        <div class="detail-section">
          <h3>Terms & Conditions</h3>
          <div class="terms-content">
            <p>${escapeHtml(company.terms)}</p>
          </div>
        </div>
        `
            : ""
        }
      </div>

      <div class="company-detail-stats">
        <h3>Company Statistics</h3>
        <div class="stat-item">
          <span>Rating</span>
          <span>${rating.toFixed(1)} ⭐</span>
        </div>
        <div class="stat-item">
          <span>Reviews</span>
          <span>${reviews}</span>
        </div>
        <div class="stat-item">
          <span>Active Drivers</span>
          <span>${drivers}</span>
        </div>
        <div class="stat-item">
          <span>Total Vehicles</span>
          <span>${vehicles}</span>
        </div>
      </div>
    `;
  }

  // Update footer button
  const applyBtn = detailOverlay.querySelector(
    ".company-detail-footer .btn-primary",
  );
  if (applyBtn) {
    const pending = hasAnyPendingForCompany(companyId);
    applyBtn.textContent = pending ? "Application Pending" : "Apply Now";
    applyBtn.disabled = pending;

    // Remove old event listeners by cloning
    const newApplyBtn = applyBtn.cloneNode(true);
    applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);

    if (!pending) {
      newApplyBtn.addEventListener("click", () => {
        closeCompanyDetailModal();
        setTimeout(() => {
          openApplicationModal(companyId, company.companyname || "Company");
        }, 300);
      });
    }
  }
}

function closeCompanyDetailModal() {
  const detailOverlay = document.getElementById("companyDetailOverlay");
  if (!detailOverlay) return;

  detailOverlay.classList.remove("active");
  document.body.style.overflow = "";
}

function buildLocationString(street, city) {
  const s = trimToNull(street);
  const c = trimToNull(city);
  if (!s && !c) return null;
  if (!s) return c;
  if (!c) return s;
  return `${s}, ${c}`;
}

function trimToNull(str) {
  if (!str) return null;
  const trimmed = String(str).trim();
  return trimmed === "" ? null : trimmed;
}

// ---------------- MODAL ----------------
async function openApplicationModal(companyId, companyName) {
  const modal = document.getElementById("applicationModal");
  const form = document.getElementById("applicationForm");

  document.getElementById("modalCompanyName").textContent = companyName;

  // ✅ reset FIRST (so it doesn't wipe company_id later)
  if (form) form.reset();

  // hidden company id
  let hidden = document.getElementById("modalCompanyId");
  if (!hidden) {
    hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.id = "modalCompanyId";
    hidden.name = "company_id";
    form.appendChild(hidden);
  }
  hidden.value = String(companyId);

  // ✅ Auto-fill provider fields
  await fillProviderDetailsIntoModal();

  // ✅ Load vehicles (radio button list for single selection)
  await loadEligibleVehiclesIntoModal();

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

async function fillProviderDetailsIntoModal() {
  try {
    const res = await apiFetch(`${PROVIDER_REQ_API}/profile`);
    if (!res.ok) return;

    const data = await res.json();
    const p = data.provider || {};

    // These IDs/names must exist in your HTML inputs
    setInputValue("providerName", p.fullName || p.username || "");
    setInputValue("providerEmail", p.email || "");
    setInputValue("providerPhone", p.phone || "");
    setInputValue(
      "providerIdDisplay",
      p.providerId != null ? String(p.providerId) : "",
    );
  } catch (e) {
    console.error("Failed to auto-fill provider details", e);
  }
}

function setInputValue(idOrName, value) {
  const el =
    document.getElementById(idOrName) ||
    document.querySelector(`[name="${idOrName}"]`);
  if (!el) return;
  el.value = value;
}

function closeApplicationModal() {
  const modal = document.getElementById("applicationModal");
  const modalContent = modal.querySelector(".modal");

  modalContent.style.transform = "scale(0.7)";
  modalContent.style.opacity = "0";

  setTimeout(() => {
    modal.classList.remove("active");
    document.body.style.overflow = "";
    modalContent.style.transform = "";
    modalContent.style.opacity = "";
    modalContent.style.transition = "";
  }, 300);
}

async function loadEligibleVehiclesIntoModal() {
  const listContainer =
    document.querySelector(".vehicle-selection") ||
    document.querySelector(".vehicle-options") ||
    document.querySelector("#vehicleSelectionContainer");

  if (!listContainer) return;

  listContainer.innerHTML = `<p>Loading eligible vehicles...</p>`;

  const res = await apiFetch(`${PROVIDER_REQ_API}/eligible-vehicles`);
  if (!res.ok) {
    listContainer.innerHTML = `<p>Failed to load vehicles.</p>`;
    return;
  }
  const data = await res.json();
  const vehicles = data.vehicles || [];

  if (!vehicles.length) {
    listContainer.innerHTML = `<p>No eligible vehicles (all assigned or already pending).</p>`;
    return;
  }

  // ✅ Changed from checkboxes to radio buttons for single selection
  listContainer.innerHTML = vehicles
    .map(
      (v) => `
      <label class="vehicle-option" style="display:block;margin:8px 0;cursor:pointer;">
        <input type="radio" name="vehicle" value="${Number(v.vehicleid)}" required />
        ${escapeHtml(v.vehiclebrand || "")} ${escapeHtml(v.vehiclemodel || "")}
        – ${escapeHtml(v.numberplatenumber || "")}
        ${v.price_per_day ? ` – Rs ${escapeHtml(String(v.price_per_day))}/day` : ""}
      </label>
    `,
    )
    .join("");
}

function bindForm() {
  const form = document.getElementById("applicationForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const companyId = Number(document.getElementById("modalCompanyId")?.value);

    // ✅ Changed to get single radio button value
    const selectedRadio = form.querySelector('input[name="vehicle"]:checked');

    if (!companyId || !selectedRadio) {
      alert("Please select a vehicle.");
      return;
    }

    const vehicleId = Number(selectedRadio.value);

    // ✅ Get message and experience values from form
    const message = document.getElementById("message")?.value?.trim() || "";
    const experience = document.getElementById("experience")?.value || "";

    // Validate terms checkbox
    const termsChecked = document.getElementById("terms")?.checked;
    if (!termsChecked) {
      alert("Please agree to the terms and conditions.");
      return;
    }

    if (!experience) {
      alert("Please select your years of experience.");
      return;
    }

    // Find submit button - it's outside the form in modal-footer
    const submitButton = document.querySelector(
      '#applicationModal button[type="submit"]',
    );
    if (!submitButton) {
      alert("Submit button not found");
      return;
    }
    const originalText = submitButton.textContent;
    submitButton.textContent = "Submitting...";
    submitButton.disabled = true;

    try {
      // ✅ Include message and experience in the request
      const res = await apiFetch(PROVIDER_REQ_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          vehicle_id: vehicleId,
          message: message,
          experience: experience,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }

      alert("Application submitted successfully!");
      closeApplicationModal();

      // refresh UI
      await loadMyRequests();
      renderCompanies(companies);
    } catch (err) {
      console.error(err);
      alert("Failed to submit application.\n" + err.message);
    } finally {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    }
  });

  // close on outside click
  document.addEventListener("click", (e) => {
    const modal = document.getElementById("applicationModal");
    if (e.target === modal) closeApplicationModal();

    const detailOverlay = document.getElementById("companyDetailOverlay");
    if (e.target === detailOverlay) closeCompanyDetailModal();
  });

  // close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeApplicationModal();
      closeCompanyDetailModal();
    }
  });

  // hook sort change
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) sortSelect.addEventListener("change", applySorting);

  // hook filters (if your ids exist)
  const ratingFilter = document.getElementById("ratingFilter");
  const locationFilter = document.getElementById("locationFilter");
  if (ratingFilter) ratingFilter.addEventListener("change", applyFilters);
  if (locationFilter) locationFilter.addEventListener("input", applyFilters);
}

// helpers
function renderStars(rating) {
  const r = Math.max(0, Math.min(5, rating));
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html += `<span class="star ${i <= r ? "filled" : "empty"}">★</span>`;
  }
  return html;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// keep your existing button (Load More) behavior
function loadMoreCompanies() {
  alert("No more companies available at the moment");
}
