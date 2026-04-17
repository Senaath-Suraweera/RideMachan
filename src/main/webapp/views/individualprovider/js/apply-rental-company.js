// apply-rental-company.js — Professional refactor with tabbed detail view + doc viewer

const BASE_URL = "http://localhost:8080";
// const BASE_URL = "http://localhost:8080/RideMachan";

const VEHICLES_API = `${BASE_URL}/api/vehicles`;
const PROVIDER_REQ_API = `${BASE_URL}/api/provider/rental-requests`;

let providerId = null;
let companies = [];
let filteredCompanies = [];
let myRequests = [];
let currentDetailCompany = null;
let currentDetailTab = "overview";

// Pagination state
let currentPage = 1;
let pageSize = 10;

// ─────────────────────────────────────────
// Init
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  providerId = await getProviderIdFromSession();
  if (!providerId) {
    alert("Session expired / not logged in as Provider.");
    return;
  }

  await Promise.all([loadCompanies(), loadMyRequests()]);
  applyFiltersAndSort();
  bindEvents();
});

// ─────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────
async function apiFetch(url, options = {}) {
  return fetch(url, { ...options, credentials: "include" });
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

// ─────────────────────────────────────────
// Render Company Cards
// ─────────────────────────────────────────
function hasAnyPendingForCompany(companyId) {
  return myRequests.some(
    (r) =>
      Number(r.company_id) === Number(companyId) &&
      String(r.status).toLowerCase() === "pending",
  );
}

function getCompanyInitials(name) {
  if (!name) return "RC";
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function renderCompanies(list) {
  const container = document.querySelector(".companies-container");
  if (!container) return;

  if (!list.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-light);">
        <i class="fas fa-building-circle-xmark" style="font-size:48px;margin-bottom:16px;display:block;color:#dde1e7;"></i>
        <p style="font-size:16px;font-weight:600;">No companies match your filters.</p>
        <p style="font-size:14px;margin-top:6px;">Try adjusting your search or filter criteria.</p>
      </div>`;
    renderPagination(0);
    return;
  }

  // Clamp currentPage to valid range
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageItems = list.slice(startIdx, endIdx);

  container.innerHTML = "";

  pageItems.forEach((c) => {
    const companyId = c.companyid;
    const pending = hasAnyPendingForCompany(companyId);
    // rating can be null from backend when no reviews exist yet
    const rating = c.rating != null ? Number(c.rating) : null;
    const reviews = Number(c.reviews || 0);
    const drivers = Number(c.drivers || 0);
    const location = (c.location || "N/A").toString();
    const initials = getCompanyInitials(c.companyname);

    const card = document.createElement("div");
    card.className = "company-card";
    card.dataset.rating = String(rating ?? 0);
    card.dataset.location = location.toLowerCase();
    card.dataset.companyId = String(companyId);
    card.dataset.name = (c.companyname || "").toLowerCase();

    const ratingHtml =
      rating != null
        ? `<div class="stars">${renderStars(rating)}</div>
         <span class="rating-text">
           <i class="fas fa-users" style="font-size:11px;color:var(--primary-light);"></i>
           ${rating.toFixed(1)} &bull; ${reviews} review${reviews !== 1 ? "s" : ""}
         </span>`
        : `<span class="rating-text" style="color:#adb5bd;">
           <i class="fas fa-star" style="font-size:11px;"></i> No ratings yet
         </span>`;

    card.innerHTML = `
      <div class="company-card-accent"></div>
      <div class="company-card-inner">
        <div class="company-header">
          <div class="company-avatar">${escapeHtml(initials)}</div>
          <div class="company-main-info">
            <h3 class="company-name">${escapeHtml(c.companyname || "Rental Company")}</h3>
            <div class="company-rating">${ratingHtml}</div>
            <div class="company-location">
              <i class="fas fa-location-dot"></i>
              ${escapeHtml(location)}
            </div>
          </div>
          <div class="company-actions">
            <button class="btn btn-primary apply-btn" ${pending ? "disabled" : ""}>
              ${
                pending
                  ? `<i class="fas fa-clock"></i> Application Sent`
                  : `<i class="fas fa-paper-plane"></i> Apply Now`
              }
            </button>
            ${pending ? `<span class="status-badge status-pending"><i class="fas fa-hourglass-half"></i> Pending</span>` : ""}
          </div>
        </div>

        <p class="company-description">${escapeHtml(c.description || "No description available.")}</p>

        <div class="company-footer">
          <div class="company-meta">
            <span class="meta-chip">
              <i class="fas fa-user-tie"></i>
              <strong>${drivers}</strong> Drivers
            </span>
            <span class="meta-chip">
              <i class="fas fa-id-card"></i>
              ${escapeHtml(c.businesslicensenumber || "N/A")}
            </span>
          </div>
          <span class="view-details-link">
            <i class="fas fa-circle-info"></i>
            View Details
            <i class="fas fa-arrow-right" style="font-size:11px;"></i>
          </span>
        </div>
      </div>`;

    // Apply Now button
    card.querySelector(".apply-btn").addEventListener("click", (e) => {
      e.stopPropagation();
      openApplicationModal(companyId, c.companyname || "Company");
    });

    // Card click → detail modal
    card.addEventListener("click", (e) => {
      if (e.target.closest(".apply-btn")) return;
      openCompanyDetailModal(companyId, c.companyname || "Company");
    });

    container.appendChild(card);
  });

  renderPagination(list.length);
}

// ─────────────────────────────────────────
// Pagination
// ─────────────────────────────────────────
function renderPagination(totalItems) {
  const section = document.getElementById("paginationSection");
  const infoText = document.getElementById("paginationInfoText");
  const pagesEl = document.getElementById("paginationPages");
  const prevBtn = document.getElementById("prevPageBtn");
  const nextBtn = document.getElementById("nextPageBtn");
  if (!section || !pagesEl) return;

  // Hide pagination entirely when empty
  if (totalItems === 0) {
    section.classList.add("hidden");
    return;
  }
  section.classList.remove("hidden");

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  // Info text
  infoText.innerHTML = `Showing <strong>${startIdx}–${endIdx}</strong> of <strong>${totalItems}</strong> companies`;

  // Prev / Next state
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;

  // Build page buttons (with ellipsis for long ranges)
  pagesEl.innerHTML = "";
  const pageNumbers = buildPageNumberList(currentPage, totalPages);

  pageNumbers.forEach((p) => {
    if (p === "…") {
      const span = document.createElement("span");
      span.className = "pagination-page ellipsis";
      span.textContent = "…";
      pagesEl.appendChild(span);
      return;
    }

    const btn = document.createElement("button");
    btn.className = "pagination-page" + (p === currentPage ? " active" : "");
    btn.textContent = String(p);
    btn.setAttribute("aria-label", `Page ${p}`);
    if (p === currentPage) btn.setAttribute("aria-current", "page");
    btn.addEventListener("click", () => goToPage(p));
    pagesEl.appendChild(btn);
  });
}

/**
 * Build a compact page list: [1, '…', 4, 5, 6, '…', 20]
 */
function buildPageNumberList(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  const window = 1; // how many pages to show on each side of current

  pages.push(1);
  if (current - window > 2) pages.push("…");

  const start = Math.max(2, current - window);
  const end = Math.min(total - 1, current + window);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current + window < total - 1) pages.push("…");
  pages.push(total);

  return pages;
}

function goToPage(page) {
  if (page === currentPage) return;
  currentPage = page;
  renderCompanies(filteredCompanies);
  // Scroll to top of list for a cleaner transition
  const container = document.querySelector(".companies-container");
  if (container) {
    container.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ─────────────────────────────────────────
// Company Detail Modal
// ─────────────────────────────────────────
async function openCompanyDetailModal(companyId, companyName) {
  const overlay = document.getElementById("companyDetailOverlay");
  if (!overlay) return;

  // Reset to overview tab
  currentDetailTab = "overview";
  updateTabUI("overview");

  document.getElementById("detailCompanyName").textContent =
    companyName || "Loading...";
  document.getElementById("detailAvatar").textContent =
    getCompanyInitials(companyName);

  const content = document.getElementById("detailTabContent");
  content.innerHTML = `
    <div style="text-align:center;padding:60px 0;">
      <i class="fas fa-circle-notch fa-spin" style="font-size:32px;color:var(--primary-light);"></i>
      <p style="margin-top:12px;color:var(--text-light);">Loading company details...</p>
    </div>`;

  overlay.classList.add("active");
  document.body.style.overflow = "hidden";

  const company = await loadCompanyDetails(companyId);
  currentDetailCompany = company;

  if (!company) {
    content.innerHTML = `
      <div style="text-align:center;padding:60px 20px;color:var(--text-light);">
        <i class="fas fa-triangle-exclamation" style="font-size:40px;color:#f6c90e;display:block;margin-bottom:14px;"></i>
        <p>Failed to load company details. Please try again.</p>
      </div>`;
    return;
  }

  // Update header
  document.getElementById("detailCompanyName").textContent =
    company.companyname || companyName;
  document.getElementById("detailAvatar").textContent = getCompanyInitials(
    company.companyname || companyName,
  );

  // Update apply button in footer
  const applyBtn = document.getElementById("detailApplyBtn");
  const pending = hasAnyPendingForCompany(companyId);
  applyBtn.disabled = pending;
  applyBtn.innerHTML = pending
    ? `<i class="fas fa-clock"></i> Application Pending`
    : `<i class="fas fa-paper-plane"></i> Apply Now`;

  // Remove old listener, add fresh one
  const newBtn = applyBtn.cloneNode(true);
  applyBtn.parentNode.replaceChild(newBtn, applyBtn);
  newBtn.disabled = pending;
  if (!pending) {
    newBtn.addEventListener("click", () => {
      closeCompanyDetailModal();
      setTimeout(
        () => openApplicationModal(companyId, company.companyname || "Company"),
        280,
      );
    });
  }

  renderDetailTab(company, "overview");
}

function closeCompanyDetailModal() {
  const overlay = document.getElementById("companyDetailOverlay");
  if (!overlay) return;
  overlay.classList.remove("active");
  document.body.style.overflow = "";
  currentDetailCompany = null;
}

function updateTabUI(tab) {
  document.querySelectorAll(".detail-tab").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  currentDetailTab = tab;
}

function renderDetailTab(company, tab) {
  updateTabUI(tab);
  const content = document.getElementById("detailTabContent");
  content.innerHTML = "";

  switch (tab) {
    case "overview":
      content.innerHTML = buildOverviewTab(company);
      break;
    case "contact":
      content.innerHTML = buildContactTab(company);
      break;
    case "legal":
      content.innerHTML = buildLegalTab(company);
      break;
    case "stats":
      content.innerHTML = buildStatsTab(company);
      break;
  }
}

// ── Tab: Overview ──
function buildOverviewTab(c) {
  const rating = c.rating != null ? Number(c.rating) : null;
  const reviews = Number(c.reviews || 0);

  return `
    <div class="detail-overview-grid">
      <div>
        <div class="detail-about-card">
          <div class="detail-card-header">
            <i class="fas fa-building"></i>
            <h4>About ${escapeHtml(c.companyname || "Company")}</h4>
          </div>
          <div class="detail-card-body">
            <p class="detail-about-text">${escapeHtml(c.description || "No description provided.")}</p>
          </div>
        </div>

        <div class="detail-about-card" style="margin-top:14px;">
          <div class="detail-card-header">
            <i class="fas fa-star"></i>
            <h4>Rating Overview</h4>
          </div>
          <div class="detail-card-body" style="display:flex;align-items:center;gap:20px;">
            <div style="text-align:center;">
              <div style="font-size:44px;font-weight:700;color:var(--primary);line-height:1;">${rating != null ? rating.toFixed(1) : "—"}</div>
              <div style="margin:6px 0;">${rating != null ? renderStars(rating) : `<span style="font-size:13px;color:#adb5bd;">No ratings yet</span>`}</div>
              <div style="font-size:12px;color:var(--text-light);">${reviews} review${reviews !== 1 ? "s" : ""}</div>
            </div>
            <div style="flex:1;padding-left:20px;border-left:1px solid var(--border);">
              ${[5, 4, 3, 2, 1]
                .map(
                  (s) => `
                <div style="display:flex;align-items:center;gap:10px;margin-bottom:7px;">
                  <span style="font-size:12px;color:var(--text-light);width:40px;">${s} <i class="fas fa-star" style="color:#f6c90e;font-size:10px;"></i></span>
                  <div style="flex:1;height:6px;background:#eee;border-radius:3px;">
                    <div style="height:100%;width:${s === rating ? 70 : s === rating - 1 ? 20 : 5}%;background:linear-gradient(90deg,var(--primary),var(--primary-light));border-radius:3px;"></div>
                  </div>
                </div>`,
                )
                .join("")}
            </div>
          </div>
        </div>
      </div>

      <div class="detail-stat-card">
        <div class="detail-card-header">
          <i class="fas fa-chart-pie"></i>
          <h4>Quick Stats</h4>
        </div>
        <div class="stat-grid">
          <div class="stat-row">
            <span class="stat-label"><i class="fas fa-user-tie"></i> Drivers</span>
            <span class="stat-value">${Number(c.drivers || 0)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label"><i class="fas fa-car"></i> Vehicles</span>
            <span class="stat-value">${Number(c.vehicles || 0)}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label"><i class="fas fa-star"></i> Rating</span>
            <span class="stat-value">${rating}.0</span>
          </div>
          <div class="stat-row">
            <span class="stat-label"><i class="fas fa-comments"></i> Reviews</span>
            <span class="stat-value">${reviews}</span>
          </div>
          <div class="stat-row">
            <span class="stat-label"><i class="fas fa-shield-halved"></i> Status</span>
            <span class="stat-value" style="font-size:12px;">
              <span class="status-badge status-approved"><i class="fas fa-check"></i> Active</span>
            </span>
          </div>
        </div>
      </div>
    </div>`;
}

// ── Tab: Contact ──
function buildContactTab(c) {
  const location = buildLocationString(c.street, c.city);

  const fields = [
    { icon: "fas fa-envelope", label: "Email", value: c.companyemail },
    { icon: "fas fa-phone", label: "Phone", value: c.phone },
    {
      icon: "fas fa-hashtag",
      label: "Registration Number",
      value: c.registrationnumber,
    },
    { icon: "fas fa-file-invoice", label: "Tax ID", value: c.taxid },
  ];

  const fieldHtml = fields
    .map(
      (f) => `
    <div class="contact-item">
      <div class="contact-icon"><i class="${f.icon}"></i></div>
      <div>
        <div class="contact-label">${f.label}</div>
        <div class="contact-value">${escapeHtml(f.value || "N/A")}</div>
      </div>
    </div>`,
    )
    .join("");

  return `
    <div>
      <div class="contact-grid">${fieldHtml}</div>
      ${
        location
          ? `
      <div class="address-card">
        <i class="fas fa-location-dot"></i>
        <div>
          <div class="contact-label">Address</div>
          <div class="contact-value">${escapeHtml(location)}</div>
        </div>
      </div>`
          : ""
      }
    </div>`;
}

// ── Tab: Legal & Docs ──
function buildLegalTab(c) {
  const legalFields = [
    {
      icon: "fas fa-id-badge",
      label: "Business License Number",
      value: c.businesslicensenumber,
      badge: "verified",
    },
    {
      icon: "fas fa-file-signature",
      label: "Registration Number",
      value: c.registrationnumber,
      badge: "verified",
    },
    {
      icon: "fas fa-receipt",
      label: "Tax ID",
      value: c.taxid,
      badge: "verified",
    },
  ];

  const fieldsHtml = legalFields
    .map(
      (f) => `
    <div class="legal-field">
      <div class="legal-field-left">
        <i class="${f.icon}"></i>
        <div>
          <div class="legal-field-label">${f.label}</div>
          <div class="legal-field-value">${escapeHtml(f.value || "Not provided")}</div>
        </div>
      </div>
      ${f.value ? `<span class="legal-badge ${f.badge}"><i class="fas fa-circle-check"></i> Verified</span>` : ""}
    </div>`,
    )
    .join("");

  // Document tiles — using server paths if provided, else show placeholders
  const docs = [
    {
      key: "certificatepath",
      name: "Business Certificate",
      icon: "fas fa-certificate",
    },
    {
      key: "taxdocumentpath",
      name: "Tax Document",
      icon: "fas fa-file-invoice-dollar",
    },
  ];

  const docTiles = docs
    .map((d) => {
      const path = c[d.key];
      const hasDoc = !!path;
      return `
      <div class="doc-tile" onclick="${hasDoc ? `viewDocument('${escapeHtml(path)}', '${d.name}')` : "showNoDoc()"}">
        <div class="doc-tile-preview">
          ${
            hasDoc
              ? `<img src="${BASE_URL}/${escapeHtml(path)}" alt="${d.name}" onerror="this.style.display='none';this.parentElement.querySelector('.doc-placeholder').style.display='flex';" />
               <div class="doc-placeholder" style="display:none;flex-direction:column;align-items:center;gap:6px;">
                 <i class="${d.icon}" style="font-size:32px;color:var(--primary-light);opacity:0.7;"></i>
                 <span style="font-size:12px;color:var(--text-light);font-weight:600;">${d.name}</span>
               </div>`
              : `<div class="doc-placeholder" style="display:flex;flex-direction:column;align-items:center;gap:6px;">
                 <i class="${d.icon}" style="font-size:32px;color:var(--primary-light);opacity:0.7;"></i>
                 <span style="font-size:12px;color:var(--text-light);font-weight:600;">Not uploaded</span>
               </div>`
          }
          <div class="doc-view-overlay">
            <i class="fas fa-${hasDoc ? "eye" : "ban"}"></i>
          </div>
        </div>
        <div class="doc-tile-footer">
          <span class="doc-tile-name">
            <i class="${d.icon}" style="color:var(--primary-light);margin-right:6px;"></i>
            ${d.name}
          </span>
          <span class="doc-tile-action">
            ${hasDoc ? `<i class="fas fa-eye"></i> View` : `<i class="fas fa-ban"></i> Unavailable`}
          </span>
        </div>
      </div>`;
    })
    .join("");

  const termsHtml = c.terms
    ? `
    <div class="terms-card">
      <div class="terms-card-header">
        <i class="fas fa-file-lines"></i>
        <span>Terms & Conditions</span>
      </div>
      <div class="terms-card-body">${escapeHtml(c.terms)}</div>
    </div>`
    : "";

  return `
    <div>
      <div class="legal-info-grid">${fieldsHtml}</div>
      <h4 style="font-size:14px;font-weight:700;color:var(--dark);margin:20px 0 12px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-folder-open" style="color:var(--primary-light);"></i>
        Legal Documents
      </h4>
      <div class="doc-tiles">${docTiles}</div>
      ${termsHtml}
    </div>`;
}

// ── Tab: Statistics ──
function buildStatsTab(c) {
  const stats = [
    {
      label: "Active Drivers",
      value: Number(c.drivers || 0),
      icon: "fas fa-user-tie",
      color: "#4361ee",
    },
    {
      label: "Total Vehicles",
      value: Number(c.vehicles || 0),
      icon: "fas fa-car",
      color: "#3a0ca3",
    },
    {
      label: "Average Rating",
      value:
        c.rating != null ? `${Number(c.rating).toFixed(1)} ⭐` : "No ratings",
      icon: "fas fa-star",
      color: "#f6c90e",
    },
    {
      label: "Total Reviews",
      value: Number(c.reviews || 0),
      icon: "fas fa-comments",
      color: "#7209b7",
    },
  ];

  return `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px;margin-bottom:20px;">
      ${stats
        .map(
          (s) => `
        <div style="background:#fff;border:1.5px solid var(--border);border-radius:12px;padding:20px;text-align:center;">
          <div style="width:50px;height:50px;background:${s.color}12;border-radius:12px;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;">
            <i class="${s.icon}" style="font-size:20px;color:${s.color};"></i>
          </div>
          <div style="font-size:26px;font-weight:700;color:var(--dark);margin-bottom:4px;">${s.value}</div>
          <div style="font-size:12px;font-weight:600;color:var(--text-light);text-transform:uppercase;letter-spacing:0.5px;">${s.label}</div>
        </div>`,
        )
        .join("")}
    </div>
    <div style="background:#fff;border:1.5px solid var(--border);border-radius:12px;padding:20px;">
      <div style="font-size:14px;font-weight:700;color:var(--dark);margin-bottom:14px;display:flex;align-items:center;gap:8px;">
        <i class="fas fa-circle-info" style="color:var(--primary-light);"></i>
        Company Profile
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;font-size:14px;">
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
          <span style="color:var(--text-light);display:flex;align-items:center;gap:8px;"><i class="fas fa-building" style="color:var(--primary-light);width:16px;text-align:center;"></i> Company Name</span>
          <span style="font-weight:600;color:var(--dark);">${escapeHtml(c.companyname || "N/A")}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border);">
          <span style="color:var(--text-light);display:flex;align-items:center;gap:8px;"><i class="fas fa-location-dot" style="color:var(--primary-light);width:16px;text-align:center;"></i> Location</span>
          <span style="font-weight:600;color:var(--dark);">${escapeHtml(buildLocationString(c.street, c.city) || "N/A")}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:10px 0;">
          <span style="color:var(--text-light);display:flex;align-items:center;gap:8px;"><i class="fas fa-shield-halved" style="color:var(--primary-light);width:16px;text-align:center;"></i> Status</span>
          <span class="status-badge status-approved"><i class="fas fa-check"></i> Active & Verified</span>
        </div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────
// Document Viewer Modal
// ─────────────────────────────────────────
function viewDocument(path, name) {
  const overlay = document.getElementById("docViewerOverlay");
  const title = document.getElementById("docViewerTitle");
  const body = document.getElementById("docViewerBody");
  if (!overlay) return;

  title.innerHTML = `<i class="fas fa-file-image"></i> ${escapeHtml(name)}`;

  const fullUrl = path.startsWith("http") ? path : `${BASE_URL}/${path}`;
  body.innerHTML = `
    <img
      src="${escapeHtml(fullUrl)}"
      alt="${escapeHtml(name)}"
      onerror="this.outerHTML='<div class=\\'doc-no-preview\\'><i class=\\'fas fa-file-circle-exclamation\\'></i><p>Unable to load document.<br/>The file may not be accessible.</p></div>'"
    />`;

  overlay.classList.add("active");
}

function showNoDoc() {
  const overlay = document.getElementById("docViewerOverlay");
  const title = document.getElementById("docViewerTitle");
  const body = document.getElementById("docViewerBody");
  if (!overlay) return;
  title.innerHTML = `<i class="fas fa-ban"></i> Document Unavailable`;
  body.innerHTML = `<div class="doc-no-preview"><i class="fas fa-file-circle-xmark"></i><p>This document has not been uploaded by the company.</p></div>`;
  overlay.classList.add("active");
}

function closeDocViewer() {
  const overlay = document.getElementById("docViewerOverlay");
  if (overlay) overlay.classList.remove("active");
}

// ─────────────────────────────────────────
// Application Modal
// ─────────────────────────────────────────
async function openApplicationModal(companyId, companyName) {
  const modal = document.getElementById("applicationModal");
  const form = document.getElementById("applicationForm");

  document.getElementById("modalCompanyName").textContent = companyName;
  if (form) form.reset();

  let hidden = document.getElementById("modalCompanyId");
  if (!hidden) {
    hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.id = "modalCompanyId";
    hidden.name = "company_id";
    form.appendChild(hidden);
  }
  hidden.value = String(companyId);

  await fillProviderDetailsIntoModal();
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
  if (el) el.value = value;
}

function closeApplicationModal() {
  const modal = document.getElementById("applicationModal");
  if (!modal) return;
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

async function loadEligibleVehiclesIntoModal() {
  const container = document.getElementById("vehicleSelectionContainer");
  if (!container) return;

  container.innerHTML = `
    <div style="text-align:center;padding:20px;color:var(--text-light);">
      <i class="fas fa-circle-notch fa-spin" style="font-size:24px;color:var(--primary-light);"></i>
      <p style="margin-top:8px;font-size:13px;">Loading your vehicles...</p>
    </div>`;

  const res = await apiFetch(`${PROVIDER_REQ_API}/eligible-vehicles`);
  if (!res.ok) {
    container.innerHTML = `<p style="color:#e53e3e;font-size:13px;padding:10px;">
      <i class="fas fa-circle-exclamation"></i> Failed to load vehicles.</p>`;
    return;
  }

  const data = await res.json();
  const vehicles = data.vehicles || [];

  if (!vehicles.length) {
    container.innerHTML = `
      <div style="text-align:center;padding:20px;color:var(--text-light);">
        <i class="fas fa-car-burst" style="font-size:28px;margin-bottom:10px;display:block;opacity:0.4;"></i>
        <p style="font-size:13px;">No eligible vehicles. All your vehicles are already assigned or have pending requests.</p>
      </div>`;
    return;
  }

  container.innerHTML = vehicles
    .map(
      (v) => `
    <label class="vehicle-option-label">
      <input type="radio" name="vehicle" value="${Number(v.vehicleid)}" required />
      <div class="vehicle-icon"><i class="fas fa-car"></i></div>
      <div style="flex:1;min-width:0;">
        <div class="vehicle-name-text">${escapeHtml(v.vehiclebrand || "")} ${escapeHtml(v.vehiclemodel || "")}</div>
        <div class="vehicle-plate">
          <i class="fas fa-hashtag" style="font-size:10px;"></i>
          ${escapeHtml(v.numberplatenumber || "")}
          ${v.location ? ` &bull; <i class="fas fa-location-dot" style="font-size:10px;"></i> ${escapeHtml(v.location)}` : ""}
        </div>
      </div>
      ${v.price_per_day ? `<span class="vehicle-price">Rs ${escapeHtml(String(v.price_per_day))}/day</span>` : ""}
    </label>`,
    )
    .join("");
}

// ─────────────────────────────────────────
// Filter / Sort Pipeline
// ─────────────────────────────────────────
function applyFiltersAndSort(resetPage = true) {
  const locationFilter =
    document.getElementById("locationFilter")?.value?.toLowerCase().trim() ||
    "";
  const nameFilter =
    document.getElementById("companyNameFilter")?.value?.toLowerCase().trim() ||
    "";
  const ratingRaw = document.getElementById("ratingFilter")?.value || "0";
  const minRating = parseInt(ratingRaw.match(/\d+/)?.[0] || "0", 10);
  const sortValue = document.getElementById("sortSelect")?.value || "";

  // Filter
  let result = companies.filter((c) => {
    const cardLoc = (c.location || "").toLowerCase();
    const cardName = (c.companyname || "").toLowerCase();
    const cardRating = c.rating != null ? Number(c.rating) : 0;

    const okLoc = !locationFilter || cardLoc.includes(locationFilter);
    const okName = !nameFilter || cardName.includes(nameFilter);
    const okRating = cardRating >= minRating;

    return okLoc && okName && okRating;
  });

  // Sort
  result.sort((a, b) => {
    const aName = (a.companyname || "").toLowerCase();
    const bName = (b.companyname || "").toLowerCase();
    const aLoc = (a.location || "").toLowerCase();
    const bLoc = (b.location || "").toLowerCase();
    const aRating = a.rating != null ? Number(a.rating) : 0;
    const bRating = b.rating != null ? Number(b.rating) : 0;
    const aReviews = Number(a.reviews || 0);
    const bReviews = Number(b.reviews || 0);

    switch (sortValue) {
      case "Sort by Name (A-Z)":
        return aName.localeCompare(bName);
      case "Sort by Name (Z-A)":
        return bName.localeCompare(aName);
      case "Sort by Location":
        return aLoc.localeCompare(bLoc);
      case "Sort by Reviews":
        return bReviews - aReviews;
      default: // Sort by Rating
        return bRating - aRating;
    }
  });

  filteredCompanies = result;
  if (resetPage) currentPage = 1;
  renderCompanies(filteredCompanies);
}

function searchCompanies() {
  applyFiltersAndSort();
}

// ─────────────────────────────────────────
// Bind Events
// ─────────────────────────────────────────
function bindEvents() {
  // Form submission
  const form = document.getElementById("applicationForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const companyId = Number(
        document.getElementById("modalCompanyId")?.value,
      );
      const selectedRadio = form.querySelector('input[name="vehicle"]:checked');

      if (!companyId || !selectedRadio) {
        alert("Please select a vehicle before submitting.");
        return;
      }

      const vehicleId = Number(selectedRadio.value);
      const message = document.getElementById("message")?.value?.trim() || "";
      const experience = document.getElementById("experience")?.value || "";
      const termsChecked = document.getElementById("terms")?.checked;

      if (!termsChecked) {
        alert("Please agree to the terms and conditions.");
        return;
      }
      if (!experience) {
        alert("Please select your years of experience.");
        return;
      }

      const submitBtn = document.querySelector(
        '#applicationModal button[type="submit"]',
      );
      if (!submitBtn) {
        alert("Submit button not found.");
        return;
      }

      const originalHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Submitting...`;
      submitBtn.disabled = true;

      try {
        const res = await apiFetch(PROVIDER_REQ_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            company_id: companyId,
            vehicle_id: vehicleId,
            message,
            experience,
          }),
        });

        if (!res.ok) throw new Error(await res.text());

        alert("Application submitted successfully!");
        closeApplicationModal();
        await loadMyRequests();
        applyFiltersAndSort(false); // preserve current page
      } catch (err) {
        console.error(err);
        alert("Failed to submit application.\n" + err.message);
      } finally {
        submitBtn.innerHTML = originalHtml;
        submitBtn.disabled = false;
      }
    });
  }

  // Tab buttons in detail modal
  document.querySelectorAll(".detail-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (currentDetailCompany)
        renderDetailTab(currentDetailCompany, btn.dataset.tab);
    });
  });

  // Close on backdrop click
  document.addEventListener("click", (e) => {
    if (e.target === document.getElementById("applicationModal"))
      closeApplicationModal();
    if (e.target === document.getElementById("companyDetailOverlay"))
      closeCompanyDetailModal();
    if (e.target === document.getElementById("docViewerOverlay"))
      closeDocViewer();
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeDocViewer();
      closeApplicationModal();
      closeCompanyDetailModal();
    }
  });

  // Sort select
  document
    .getElementById("sortSelect")
    ?.addEventListener("change", () => applyFiltersAndSort());

  // Filter inputs
  document
    .getElementById("ratingFilter")
    ?.addEventListener("change", () => applyFiltersAndSort());
  document
    .getElementById("locationFilter")
    ?.addEventListener("input", () => applyFiltersAndSort());
  document
    .getElementById("companyNameFilter")
    ?.addEventListener("input", () => applyFiltersAndSort());

  // Pagination controls
  document.getElementById("prevPageBtn")?.addEventListener("click", () => {
    if (currentPage > 1) goToPage(currentPage - 1);
  });
  document.getElementById("nextPageBtn")?.addEventListener("click", () => {
    const totalPages = Math.max(
      1,
      Math.ceil(filteredCompanies.length / pageSize),
    );
    if (currentPage < totalPages) goToPage(currentPage + 1);
  });
  document.getElementById("pageSizeSelect")?.addEventListener("change", (e) => {
    pageSize = parseInt(e.target.value, 10) || 10;
    currentPage = 1;
    renderCompanies(filteredCompanies);
  });
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────
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

function renderStars(rating) {
  const r = Math.max(0, Math.min(5, Math.round(rating)));
  return Array.from(
    { length: 5 },
    (_, i) =>
      `<span class="star ${i < r ? "filled" : ""}"><i class="fas fa-star"></i></span>`,
  ).join("");
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
