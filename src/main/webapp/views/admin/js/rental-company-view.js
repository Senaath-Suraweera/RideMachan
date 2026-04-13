// rental-company-view.js — Full CRUD for company details, vehicles, drivers, maintenance staff
(function () {
  const $ = (s, root = document) => root.querySelector(s);

  function getContextPath() {
    const p = window.location.pathname;
    const idx = p.indexOf("/views/");
    if (idx >= 0) return p.substring(0, idx);
    return "/" + p.split("/")[1];
  }

  const CONTEXT = getContextPath();
  const API_COMPANY = `${CONTEXT}/admin/rentalcompanies`;
  const API_VEHICLES = `${CONTEXT}/api/admin/vehicles`;
  const API_DRIVERS = `${CONTEXT}/api/admin/drivers`;
  const API_MAINTENANCE = `${CONTEXT}/api/admin/maintenance-staff`;

  let currentCompany = null;
  let currentTab = "overview";

  document.addEventListener("DOMContentLoaded", async () => {
    const { id } = getParams();
    let companyId = Number.isFinite(id) ? id : null;

    if (!companyId) {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("selectedCompany") || "null",
        );
        const sid = Number(saved?.id);
        if (Number.isFinite(sid)) companyId = sid;
      } catch {}
    }

    if (!companyId) {
      return renderEmpty(
        'Company not found. <a href="rental-companies.html">Back</a>',
      );
    }

    renderLoading();
    await loadCompanyData(companyId);
  });

  async function loadCompanyData(companyId) {
    const company = await fetchCompany(companyId);
    if (!company) {
      return renderEmpty(
        'Company not found. <a href="rental-companies.html">Back</a>',
      );
    }

    const reviewsList = await fetchCompanyReviews(companyId);
    company._reviewsList = reviewsList;

    // Load maintenance staff from the dedicated maintenance endpoint
    try {
      const mRes = await fetch(
        `${API_MAINTENANCE}?companyId=${encodeURIComponent(companyId)}`,
      );
      if (mRes.ok) {
        const mData = await mRes.json();
        if (mData.success && Array.isArray(mData.staff)) {
          company.maintenanceStaff = mData.staff;
          company.maintenanceStaffCount = mData.staff.length;
        }
      }
    } catch (e) {
      console.error("Failed to load maintenance staff:", e);
    }

    let stats = null;
    try {
      const sRes = await fetch(`${API_COMPANY}/${companyId}/stats`);
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.status === "success") stats = sData.stats;
      }
    } catch {}

    company._stats = stats;
    currentCompany = company;
    render(company);
    wireAll(company);
  }

  async function fetchCompany(companyId) {
    try {
      const res = await fetch(
        `${API_COMPANY}/${encodeURIComponent(companyId)}`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.status !== "success" || !data.company) return null;
      return data.company;
    } catch (e) {
      console.error("Failed to load company:", e);
      return null;
    }
  }

  async function fetchCompanyReviews(companyId) {
    try {
      const res = await fetch(
        `${API_COMPANY}/${encodeURIComponent(companyId)}/reviews`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      if (!data || data.status !== "success" || !Array.isArray(data.reviews)) {
        return [];
      }
      return data.reviews;
    } catch {
      return [];
    }
  }

  function renderLoading() {
    const mount = $("#companyView");
    if (!mount) return;
    mount.innerHTML = `<div class="content-placeholder" style="padding:40px;text-align:center;">Loading company details...</div>`;
  }

  function render(c) {
    const mount = $("#companyView");
    if (!mount) return;

    const initials = String(c.name || "")
      .split(" ")
      .filter(Boolean)
      .map((p) => p[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const vehicles = Array.isArray(c.vehicles) ? c.vehicles : [];
    const drivers = Array.isArray(c.drivers) ? c.drivers : [];
    const maintenance = Array.isArray(c.maintenanceStaff)
      ? c.maintenanceStaff
      : [];
    const reviewsList = Array.isArray(c._reviewsList) ? c._reviewsList : [];

    mount.innerHTML = `
      <section class="profile-header">
        <div class="profile-logo">${initials}</div>
        <div class="profile-info">
          <h2>${esc(c.name)}</h2>
          <div class="profile-license">License: ${esc(c.licenseNumber || "—")}</div>
          <div class="profile-description">${esc(c.description || "—")}</div>
        </div>
      </section>

      <section class="company-stats-grid">
        <div class="mini-stat-card">
          <div class="mini-stat-icon" style="background:linear-gradient(135deg,#3a0ca3,#4361ee)">
            <i class="fas fa-car-side"></i>
          </div>
          <div class="mini-stat-content">
            <div class="mini-stat-value">${fmt(vehicles.length)}</div>
            <div class="mini-stat-label">Vehicles</div>
          </div>
        </div>

        <div class="mini-stat-card">
          <div class="mini-stat-icon" style="background:linear-gradient(135deg,#4895ef,#4cc9f0)">
            <i class="fas fa-user-tie"></i>
          </div>
          <div class="mini-stat-content">
            <div class="mini-stat-value">${fmt(drivers.length)}</div>
            <div class="mini-stat-label">Drivers</div>
          </div>
        </div>

        <div class="mini-stat-card">
          <div class="mini-stat-icon" style="background:linear-gradient(135deg,#f8961e,#ffbd59)">
            <i class="fas fa-screwdriver-wrench"></i>
          </div>
          <div class="mini-stat-content">
            <div class="mini-stat-value">${fmt(c.maintenanceStaffCount || maintenance.length)}</div>
            <div class="mini-stat-label">Maintenance Staff</div>
          </div>
        </div>

        <div class="mini-stat-card">
          <div class="mini-stat-icon" style="background:linear-gradient(135deg,#4cc9f0,#36d399)">
            <i class="fas fa-star"></i>
          </div>
          <div class="mini-stat-content">
            <div class="mini-stat-value">${Number(c.rating || 0).toFixed(1)}</div>
            <div class="mini-stat-label">${fmt(c.reviews || 0)} Reviews</div>
          </div>
        </div>
      </section>

      <section class="tab-navigation">
        <button class="tab-btn active" data-tab="overview">Overview</button>
        <button class="tab-btn" data-tab="vehicles">Vehicles (${vehicles.length})</button>
        <button class="tab-btn" data-tab="drivers">Drivers (${drivers.length})</button>
        <button class="tab-btn" data-tab="maintenance">Maintenance (${maintenance.length})</button>
        <button class="tab-btn" data-tab="reviews">Reviews (${reviewsList.length})</button>
      </section>

      <div id="tabContent">
        ${renderOverviewTab(c)}
      </div>

      ${renderEditCompanyModal(c)}
      ${renderVehicleModal()}
      ${renderDriverModal()}
      ${renderMaintenanceModal()}
      ${renderDeleteConfirmModal()}
    `;
  }

  function renderOverviewTab(c) {
    return `
    <div class="tab-panel active" id="tab-overview">
      <div class="business-info">
        <div class="info-section">
          <h3>Business Info</h3>
          <div class="info-item"><span class="info-label">Location</span><span class="info-value">${esc(c.location || "")}</span></div>
          <div class="info-item"><span class="info-label">City</span><span class="info-value">${esc(c.city || "")}</span></div>
          <div class="info-item"><span class="info-label">Fleet Size</span><span class="info-value">${fmt(c.fleetSize || 0)}</span></div>
          <div class="info-item"><span class="info-label">With Driver</span><span class="info-value">${c.withDriver ? "Yes" : "Optional/No"}</span></div>
          <div class="info-item"><span class="info-label">Tax ID</span><span class="info-value">${esc(c.taxId || "—")}</span></div>
        </div>

        <div class="info-section">
          <h3>Contact</h3>
          <div class="info-item"><span class="info-label">Email</span><span class="info-value">${esc(c.email || "")}</span></div>
          <div class="info-item"><span class="info-label">Phone</span><span class="info-value">${esc(c.phone || "")}</span></div>
          <div class="info-item"><span class="info-label">Address</span><span class="info-value">${esc(c.address || "")}</span></div>
        </div>

        <div class="info-section">
          <h3>Rating</h3>
          <div class="info-item"><span class="info-label">Average</span><span class="info-value">${Number(c.rating || 0).toFixed(1)} / 5</span></div>
          <div class="info-item"><span class="info-label">Reviews</span><span class="info-value">${fmt(c.reviews || 0)}</span></div>
        </div>

        <div class="info-section">
          <h3>Company Documents</h3>

          <div class="info-item">
            <span class="info-label">Registration Document</span>
            <span class="info-value">
              ${
                c.hasCertificate
                  ? `<a class="btn btn-secondary btn-sm" href="${esc(c.certificateUrl || "#")}" target="_blank">
                       <i class="fas fa-eye"></i> View
                     </a>`
                  : "Not uploaded"
              }
            </span>
          </div>

          <div class="info-item">
            <span class="info-label">Tax Document</span>
            <span class="info-value">
              ${
                c.hasTaxDocument
                  ? `<a class="btn btn-secondary btn-sm" href="${esc(c.taxDocumentUrl || "#")}" target="_blank">
                       <i class="fas fa-eye"></i> View
                     </a>`
                  : "Not uploaded"
              }
            </span>
          </div>

          <div style="margin-top: 14px;">
            <button class="btn btn-primary btn-sm" onclick="openModal('editCompanyModal')">
              <i class="fas fa-file-pen"></i> Edit Documents
            </button>
          </div>
        </div>
      </div>

      <section class="terms-section" style="margin-top:20px">
        <h3>Terms & Conditions</h3>
        <div class="content-placeholder">${esc(c.terms || "—")}</div>
      </section>
    </div>`;
  }

  function renderVehiclesTab(c) {
    const vehicles = Array.isArray(c.vehicles) ? c.vehicles : [];
    return `
    <div class="tab-panel active" id="tab-vehicles">
      <div class="section-header">
        <h3>Fleet Management</h3>
        <button class="btn btn-primary btn-sm" onclick="window._openVehicleModal()">
          <i class="fas fa-plus"></i> Add Vehicle
        </button>
      </div>
      ${
        vehicles.length
          ? `
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Plate</th>
                <th>Type</th>
                <th>Fuel</th>
                <th>Price/Day</th>
                <th>Status</th>
                <th>Rating</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${vehicles
                .map(
                  (v) => `
                <tr>
                  <td>
                    <div class="cell-main">${esc(v.name || v.brand + " " + v.model)}</div>
                    <div class="cell-sub">${esc(v.color || "")} • ${v.passengers || 0} seats</div>
                  </td>
                  <td>${esc(v.numberPlate || "")}</td>
                  <td><span class="badge badge-info">${esc(v.vehicleType || "—")}</span></td>
                  <td>${esc(v.fuelType || "—")}</td>
                  <td class="text-right">Rs. ${fmt(v.price || 0)}</td>
                  <td>
                    <span class="status-badge status-${(v.availabilityStatus || "available").toLowerCase()}">
                      ${esc(v.availabilityStatus || "available")}
                    </span>
                  </td>
                  <td><i class="fas fa-star table-star"></i> ${Number(v.rating || 0).toFixed(1)}</td>
                  <td>
                    <div class="action-btns">
                      ${
                        v.hasImage
                          ? `
                          <a class="btn-icon" title="View Image"
                             href="${API_VEHICLES}/${v.id}/image"
                             target="_blank"
                             onclick="event.stopPropagation();">
                            <i class="fas fa-image"></i>
                          </a>
                        `
                          : ""
                      }

                      <a class="btn-icon" title="View Registration Document"
                         href="${API_VEHICLES}/${v.id}/registration-doc"
                         target="_blank"
                         onclick="event.stopPropagation();">
                        <i class="fas fa-file-lines"></i>
                      </a>

                      <button class="btn-icon" title="Edit" onclick="window._editVehicle(${v.id})">
                        <i class="fas fa-pen"></i>
                      </button>

                      <button class="btn-icon btn-icon-danger" title="Delete" onclick="window._confirmDelete('vehicle',${v.id},'${esc(v.name || "")}')">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
          : `<div class="content-placeholder">No vehicles registered yet.</div>`
      }
    </div>`;
  }

  function renderDriversTab(c) {
    const drivers = Array.isArray(c.drivers) ? c.drivers : [];
    return `
    <div class="tab-panel active" id="tab-drivers">
      <div class="section-header">
        <h3>Driver Management</h3>
        <button class="btn btn-primary btn-sm" onclick="window._openDriverModal()">
          <i class="fas fa-plus"></i> Add Driver
        </button>
      </div>
      ${
        drivers.length
          ? `
        <div class="data-table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Driver</th><th>License</th><th>Phone</th>
                <th>Status</th><th>Rides</th><th>Rating</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${drivers
                .map(
                  (d) => `
                <tr>
                  <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                      <div class="driver-avatar-sm">${avatar(d.name || "")}</div>
                      <div>
                        <div class="cell-main">${esc(d.name || "")}</div>
                        <div class="cell-sub">${esc(d.email || "")}</div>
                      </div>
                    </div>
                  </td>
                  <td>${esc(d.license || "—")}</td>
                  <td>${esc(d.phone || "")}</td>
                  <td><span class="status-badge status-${(d.availability || "available").toLowerCase()}">${esc(d.availability || d.status || "available")}</span></td>
                  <td>${fmt(d.rides || 0)}</td>
                  <td><i class="fas fa-star table-star"></i> ${Number(d.rating || 0).toFixed(1)}</td>
                  <td>
                    <div class="action-btns">
                      <button class="btn-icon" title="View" onclick="window.location.href='drivers.html?id=${d.id}'">
                        <i class="fas fa-eye"></i>
                      </button>
                      <button class="btn-icon btn-icon-danger" title="Ban" onclick="window._confirmDelete('driver',${d.id},'${esc(d.name || "")}')">
                        <i class="fas fa-ban"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `
          : `<div class="content-placeholder">No drivers registered yet.</div>`
      }
    </div>`;
  }

  function renderMaintenanceTab(c) {
    const staff = Array.isArray(c.maintenanceStaff) ? c.maintenanceStaff : [];
    return `
  <div class="tab-panel active" id="tab-maintenance">
    <div class="section-header">
      <h3>Maintenance Staff</h3>
      <button class="btn btn-primary btn-sm" onclick="window._openMaintenanceModal()">
        <i class="fas fa-plus"></i> Add Staff
      </button>
    </div>
    ${
      staff.length
        ? `<div class="maintenance-cards-grid">
        ${staff
          .map(
            (m) => `
          <div class="maintenance-staff-card">
            <div class="msc-header">
              <div class="msc-avatar">${avatar(m.name || "")}</div>
              <div class="msc-info">
                <div class="msc-name">${esc(m.name || "")}</div>
                <div class="msc-sub">${esc(m.email || "")}</div>
                <div class="msc-sub">@${esc(m.username || "—")}</div>
              </div>
              <span class="status-badge status-${(m.status || "available").replace(/\\s+/g, "-").toLowerCase()}">
                ${esc(m.status || "available")}
              </span>
            </div>

            <div class="msc-details">
              <div class="msc-detail-item">
                <span class="msc-detail-label">Specialization</span>
                <span class="msc-detail-value">${esc(m.specialization || "—")}</span>
              </div>
              <div class="msc-detail-item">
                <span class="msc-detail-label">Experience</span>
                <span class="msc-detail-value">${m.yearsOfExperience || 0} yrs</span>
              </div>
              <div class="msc-detail-item">
                <span class="msc-detail-label">Assigned Vehicles</span>
                <span class="msc-detail-value">${m.assignedVehicleCount || 0}</span>
              </div>
              <div class="msc-detail-item">
                <span class="msc-detail-label">Active Jobs</span>
                <span class="msc-detail-value">${m.activeJobs || 0}</span>
              </div>
              <div class="msc-detail-item">
                <span class="msc-detail-label">Completed</span>
                <span class="msc-detail-value">${m.completedJobs || 0}</span>
              </div>
            </div>

            <div class="msc-actions">
              <button class="btn btn-primary btn-sm" onclick="window._openStaffDetailsModal(${m.id})">
                <i class="fas fa-link"></i> Assign Vehicle
              </button>
              <button class="btn btn-secondary btn-sm" onclick="window._openStaffDetailsModal(${m.id})">
                <i class="fas fa-clock-rotate-left"></i> History
              </button>
              <button class="btn-icon" title="Edit" onclick="window._editMaintenance(${m.id})">
                <i class="fas fa-pen"></i>
              </button>
              <button class="btn-icon btn-icon-danger" title="Delete" onclick="window._confirmDelete('maintenance',${m.id},'${esc(m.name || "")}')">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `,
          )
          .join("")}
      </div>`
        : `<div class="content-placeholder">No maintenance staff registered yet.</div>`
    }
  </div>`;
  }

  function renderReviewsTab(c) {
    const reviewsList = Array.isArray(c._reviewsList) ? c._reviewsList : [];
    return `
      <div class="tab-panel active" id="tab-reviews">
        <div class="reviews-summary">
          <div class="overall-rating">
            <div class="rating-number">${Number(c.rating || 0).toFixed(1)}</div>
            <div class="rating-text">Average Rating</div>
          </div>
          <div>Based on ${fmt(c.reviews || 0)} reviews</div>
        </div>
        ${
          reviewsList.length === 0
            ? `<div class="content-placeholder">No reviews yet.</div>`
            : `<div class="reviews-list">${reviewsList.map(renderReviewCard).join("")}</div>`
        }
      </div>`;
  }

  function renderReviewCard(r) {
    const customerName = r?.customer?.name || "Anonymous";
    const rating = Number(r?.rating || 0).toFixed(1);
    const createdAt = formatDateTime(r?.createdAt);
    const text = r?.review || "";
    const targetType = r?.target?.type || "";
    const targetName = r?.target?.name || "";
    const targetLine =
      targetType && targetName
        ? `<div class="review-target" style="font-size:12px;opacity:.7;margin-top:4px;">For: ${esc(targetType)} • ${esc(targetName)}</div>`
        : "";

    return `
      <div class="review-card">
        <div style="display:flex;justify-content:space-between;gap:10px;">
          <div><strong>${esc(customerName)}</strong></div>
          <div>★ ${rating}</div>
        </div>
        <div style="opacity:.7;font-size:12px;margin-top:4px;">${esc(createdAt)}</div>
        ${targetLine}
        <div style="margin-top:8px;">${esc(text)}</div>
      </div>`;
  }

  function renderEditCompanyModal(c) {
    return `
    <div class="modal" id="editCompanyModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>Edit Company</h3>
          <button class="modal-close" onclick="closeModal('editCompanyModal')">&times;</button>
        </div>

        <form id="editCompanyForm" enctype="multipart/form-data">
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Company Name</label>
                <input id="ecName" name="name" class="form-control" value="${esc(c.name || "")}" required>
              </div>

              <div class="form-group">
                <label class="form-label">Email</label>
                <input id="ecEmail" name="email" class="form-control" type="email" value="${esc(c.email || "")}">
              </div>

              <div class="form-group">
                <label class="form-label">Phone</label>
                <input id="ecPhone" name="phone" class="form-control" value="${esc(c.phone || "")}">
              </div>

              <div class="form-group">
                <label class="form-label">License Number</label>
                <input id="ecLicense" name="licenseNumber" class="form-control" value="${esc(c.licenseNumber || "")}">
              </div>

              <div class="form-group">
                <label class="form-label">Tax ID</label>
                <input id="ecTaxId" name="taxId" class="form-control" value="${esc(c.taxId || "")}">
              </div>

              <div class="form-group">
                <label class="form-label">Street Address</label>
                <input id="ecAddress" name="address" class="form-control" value="${esc(c.address || "")}">
              </div>

              <div class="form-group">
                <label class="form-label">City</label>
                <input id="ecCity" name="city" class="form-control" value="${esc(c.city || "")}">
              </div>

              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Description</label>
                <textarea id="ecDescription" name="description" class="form-control" rows="3">${esc(c.description || "")}</textarea>
              </div>

              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Terms</label>
                <textarea id="ecTerms" name="terms" class="form-control" rows="3">${esc(c.terms || "")}</textarea>
              </div>

              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Replace Registration Document</label>
                <input id="ecCertificate" name="certificate" class="form-control" type="file" accept=".pdf,image/*">
              </div>

              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Replace Tax Document</label>
                <input id="ecTaxDocument" name="taxdocument" class="form-control" type="file" accept=".pdf,image/*">
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('editCompanyModal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </div>
    </div>`;
  }

  function renderVehicleModal() {
    return `
    <div class="modal" id="vehicleModal">
      <div class="modal-content" style="max-width:900px">
        <div class="modal-header">
          <h3 id="vehicleModalTitle">Add Vehicle</h3>
          <button class="modal-close" onclick="closeModal('vehicleModal')">&times;</button>
        </div>

        <form id="vehicleForm" enctype="multipart/form-data">
          <input type="hidden" id="vfId" value="">
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Brand</label>
                <input id="vfBrand" class="form-control" required placeholder="e.g., Toyota">
              </div>

              <div class="form-group">
                <label class="form-label">Model</label>
                <input id="vfModel" class="form-control" required placeholder="e.g., Axio">
              </div>

              <div class="form-group">
                <label class="form-label">Number Plate</label>
                <input id="vfPlate" class="form-control" required placeholder="e.g., ABC-1234">
              </div>

              <div class="form-group">
                <label class="form-label">Color</label>
                <input id="vfColor" class="form-control" placeholder="e.g., White">
              </div>

              <div class="form-group">
                <label class="form-label">Vehicle Type</label>
                <select id="vfType" class="form-select">
                  <option value="">Select</option>
                  <option value="car">Car</option>
                  <option value="van">Van</option>
                  <option value="suv">SUV</option>
                  <option value="bus">Bus</option>
                  <option value="bike">Bike</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Fuel Type</label>
                <select id="vfFuel" class="form-select">
                  <option value="">Select</option>
                  <option value="petrol">Petrol</option>
                  <option value="diesel">Diesel</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="electric">Electric</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Transmission</label>
                <select id="vfTransmission" class="form-select">
                  <option value="">Select</option>
                  <option value="auto">Auto</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label">Passengers</label>
                <input id="vfPassengers" class="form-control" type="number" min="1" value="4">
              </div>

              <div class="form-group">
                <label class="form-label">Price/Day (Rs.)</label>
                <input id="vfPrice" class="form-control" type="number" min="0" required placeholder="e.g., 9500">
              </div>

              <div class="form-group">
                <label class="form-label">Manufacture Year</label>
                <input id="vfYear" class="form-control" type="number" placeholder="e.g., 2020">
              </div>

              <div class="form-group">
                <label class="form-label">Engine Capacity (cc)</label>
                <input id="vfEngine" class="form-control" type="number" min="0">
              </div>

              <div class="form-group">
                <label class="form-label">Engine Number</label>
                <input id="vfEngineNumber" class="form-control" placeholder="e.g., ENG123456">
              </div>

              <div class="form-group">
                <label class="form-label">Chassis Number</label>
                <input id="vfChassisNumber" class="form-control" placeholder="e.g., CHS123456">
              </div>

              <div class="form-group">
                <label class="form-label">Tare Weight</label>
                <input id="vfTareWeight" class="form-control" type="number" min="0" placeholder="e.g., 1200">
              </div>

              <div class="form-group">
                <label class="form-label">Mileage</label>
                <input id="vfMileage" class="form-control" placeholder="e.g., 45000 km">
              </div>

              <div class="form-group">
                <label class="form-label">Location</label>
                <input id="vfLocation" class="form-control" placeholder="e.g., Colombo">
              </div>

              <div class="form-group">
                <label class="form-label">Status</label>
                <select id="vfStatus" class="form-select">
                  <option value="available">Available</option>
                  <option value="rented">Rented</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Features (comma separated)</label>
                <input id="vfFeatures" class="form-control" placeholder="AC, GPS, Bluetooth">
              </div>

              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Description</label>
                <textarea id="vfDescription" class="form-control" rows="2"></textarea>
              </div>

              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Vehicle Image</label>
                <input id="vfVehicleImage" class="form-control" type="file" accept="image/*">
                <small id="vfVehicleImageHint" style="display:block;margin-top:6px;color:#6b7280;">
                  Required when adding a vehicle. Optional when editing.
                </small>
                <div id="vfVehicleImagePreviewWrap" style="display:none;margin-top:10px;">
                  <img
                    id="vfVehicleImagePreview"
                    alt="Vehicle Preview"
                    style="max-width:220px;max-height:140px;border-radius:10px;border:1px solid #e5e7eb;object-fit:cover;"
                  >
                </div>
              </div>

              <div class="form-group" style="grid-column:1/-1">
                <label class="form-label">Registration Document</label>
                <input id="vfRegistrationDoc" class="form-control" type="file" accept=".pdf,image/*">
                <small id="vfRegistrationDocHint" style="display:block;margin-top:6px;color:#6b7280;">
                  Required when adding a vehicle. Optional when editing.
                </small>
                <div id="vfRegistrationDocPreviewWrap" style="display:none;margin-top:10px;">
                  <a
                    id="vfRegistrationDocLink"
                    href="#"
                    target="_blank"
                    class="btn btn-secondary btn-sm"
                  >
                    <i class="fas fa-file-lines"></i> View Current Registration Document
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('vehicleModal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Vehicle</button>
          </div>
        </form>
      </div>
    </div>`;
  }

  function renderDriverModal() {
    return `
    <div class="modal" id="driverModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 id="driverModalTitle">Add Driver</h3>
          <button class="modal-close" onclick="closeModal('driverModal')">&times;</button>
        </div>
        <form id="driverForm">
          <div class="modal-body">
            <p style="color:var(--text-light);font-size:13px;margin-bottom:16px;">
              Note: Drivers are registered through the driver registration flow. This form creates a basic driver record.
            </p>
            <div class="form-row">
              <div class="form-group"><label class="form-label">First Name</label><input id="dfFirstName" class="form-control" required></div>
              <div class="form-group"><label class="form-label">Last Name</label><input id="dfLastName" class="form-control" required></div>
              <div class="form-group"><label class="form-label">Email</label><input id="dfEmail" class="form-control" type="email" required></div>
              <div class="form-group"><label class="form-label">Phone</label><input id="dfPhone" class="form-control" placeholder="+94 ..."></div>
              <div class="form-group"><label class="form-label">NIC Number</label><input id="dfNic" class="form-control" required></div>
              <div class="form-group"><label class="form-label">License Number</label><input id="dfLicense" class="form-control"></div>
              <div class="form-group" style="grid-column:1/-1"><label class="form-label">Description</label><textarea id="dfDescription" class="form-control" rows="2"></textarea></div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" onclick="closeModal('driverModal')">Cancel</button>
            <button type="submit" class="btn btn-primary">Save Driver</button>
          </div>
        </form>
      </div>
    </div>`;
  }

  function renderMaintenanceModal() {
    return `
  <div class="modal" id="maintenanceModal">
    <div class="modal-content" style="max-width: 760px;">
      <div class="modal-header">
        <h3 id="maintenanceModalTitle">Add Maintenance Staff</h3>
        <button class="modal-close" onclick="closeModal('maintenanceModal')">&times;</button>
      </div>

      <form id="maintenanceForm">
        <input type="hidden" id="mfId" value="">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">First Name</label>
              <input id="mfFirstName" class="form-control" required>
            </div>

            <div class="form-group">
              <label class="form-label">Last Name</label>
              <input id="mfLastName" class="form-control" required>
            </div>

            <div class="form-group">
              <label class="form-label">Username</label>
              <input id="mfUsername" class="form-control" placeholder="e.g., chanaka.mech">
            </div>

            <div class="form-group">
              <label class="form-label">Email</label>
              <input id="mfEmail" class="form-control" type="email" required>
            </div>

            <div class="form-group">
              <label class="form-label">Phone</label>
              <input id="mfPhone" class="form-control" placeholder="+94 ...">
            </div>

            <div class="form-group">
              <label class="form-label">Specialization</label>
              <select id="mfSpecialization" class="form-select">
                <option value="General">General</option>
                <option value="Oil Change">Oil Change</option>
                <option value="Brake Services">Brake Services</option>
                <option value="Tire Services">Tire Services</option>
                <option value="Engine">Engine</option>
                <option value="Electrical">Electrical</option>
                <option value="Body Work">Body Work</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Years of Experience</label>
              <input id="mfExperience" class="form-control" type="number" min="0" step="0.5" value="0">
            </div>

            <div class="form-group">
              <label class="form-label">Status</label>
              <select id="mfStatus" class="form-select">
                <option value="available">Available</option>
                <option value="on Job">On Job</option>
                <option value="offline">Offline</option>
              </select>
            </div>

            <div class="form-group" id="mfPasswordWrap">
              <label class="form-label">Password</label>
              <input id="mfPassword" class="form-control" type="password" placeholder="Minimum 6 characters">
            </div>

            <div class="form-group" id="mfConfirmPasswordWrap">
              <label class="form-label">Confirm Password</label>
              <input id="mfConfirmPassword" class="form-control" type="password" placeholder="Re-enter password">
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('maintenanceModal')">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Staff</button>
        </div>
      </form>
    </div>
  </div>

  <div class="modal" id="staffDetailsModal">
    <div class="modal-content" style="max-width: 980px;">
      <div class="modal-header">
        <h3 id="staffDetailsModalTitle">Staff Details</h3>
        <button class="modal-close" onclick="closeModal('staffDetailsModal')">&times;</button>
      </div>

      <div class="modal-body">
        <input type="hidden" id="sdStaffId" value="">

        <div id="staffDetailsAssignWrap" style="margin-bottom:22px;">
          <h4 style="margin:0 0 10px 0;">Assign Vehicle</h4>
          <div class="form-row" style="align-items:end;">
            <div class="form-group" style="grid-column: span 2;">
              <label class="form-label">Available Company Vehicles</label>
              <select id="sdAssignableVehicle" class="form-select">
                <option value="">Select a vehicle</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select id="sdAssignPriority" class="form-select">
                <option value="Low">Low</option>
                <option value="Medium" selected>Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>
            <div class="form-group" style="display:flex;align-items:end;">
              <button type="button" class="btn btn-primary btn-sm" id="sdAssignVehicleBtn">
                <i class="fas fa-link"></i> Assign Vehicle
              </button>
            </div>
          </div>
        </div>

        <div id="staffDetailsAssignedVehiclesWrap" style="margin-bottom:22px;">
          <h4 style="margin:0 0 10px 0;">Assigned Vehicles</h4>
          <div id="staffDetailsAssignedVehiclesList" class="content-placeholder">No assigned vehicles.</div>
        </div>

        <div id="staffDetailsJobHistoryWrap">
          <h4 style="margin:0 0 10px 0;">Maintenance Job History</h4>
          <div id="staffDetailsJobHistoryList" class="content-placeholder">No maintenance history.</div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" onclick="closeModal('staffDetailsModal')">Close</button>
      </div>
    </div>
  </div>`;
  }

  function renderDeleteConfirmModal() {
    return `
    <div class="modal" id="deleteConfirmModal">
      <div class="modal-content" style="max-width:440px">
        <div class="modal-header" style="background:rgba(247,37,133,0.06)">
          <h3 style="color:#c4184a">Confirm Delete</h3>
          <button class="modal-close" onclick="closeModal('deleteConfirmModal')">&times;</button>
        </div>
        <div class="modal-body">
          <p id="deleteConfirmText">Are you sure you want to delete this item?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeModal('deleteConfirmModal')">Cancel</button>
          <button class="btn btn-danger" id="deleteConfirmBtn">Delete</button>
        </div>
      </div>
    </div>`;
  }

  function renderDetailsAssignedVehicles(staff) {
    const list = $("#staffDetailsAssignedVehiclesList");
    if (!list) return;

    const assignedVehicles = Array.isArray(staff?.assignedVehicles)
      ? staff.assignedVehicles
      : [];

    if (!assignedVehicles.length) {
      list.className = "content-placeholder";
      list.innerHTML = "No assigned vehicles.";
      return;
    }

    list.className = "";
    list.innerHTML = `
    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Plate</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${assignedVehicles
            .map(
              (v) => `
                <tr>
                  <td>
                    <div class="cell-main">${esc(v.name || "")}</div>
                    <div class="cell-sub">${esc(v.description || "")}</div>
                  </td>
                  <td>${esc(v.numberPlate || "—")}</td>
                  <td>${esc(v.status || "—")}</td>
                  <td>${esc(v.priority || "—")}</td>
                  <td>
                    <button class="btn-icon btn-icon-danger" title="Unassign" onclick="window._unassignVehicle(${v.vehicleId})">
                      <i class="fas fa-unlink"></i>
                    </button>
                  </td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  }

  function renderDetailsJobHistory(staff) {
    const list = $("#staffDetailsJobHistoryList");
    if (!list) return;

    const history = Array.isArray(staff?.jobHistory) ? staff.jobHistory : [];

    if (!history.length) {
      list.className = "content-placeholder";
      list.innerHTML = "No maintenance history.";
      return;
    }

    list.className = "";
    list.innerHTML = `
    <div class="data-table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Service Type</th>
            <th>Status</th>
            <th>Date</th>
            <th>Bay</th>
          </tr>
        </thead>
        <tbody>
          ${history
            .map(
              (h) => `
                <tr>
                  <td>
                    <div class="cell-main">${esc(h.vehicleName || "—")}</div>
                    <div class="cell-sub">${esc(h.numberPlate || "")}</div>
                  </td>
                  <td>${esc(h.serviceType || "—")}</td>
                  <td>${esc(h.status || "—")}</td>
                  <td>${esc(h.scheduledDate || "—")} ${esc(h.scheduledTime || "")}</td>
                  <td>${esc(h.serviceBay || "—")}</td>
                </tr>
              `,
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
  }

  async function loadDetailsAssignableVehicles(staffId) {
    const select = $("#sdAssignableVehicle");
    if (!select) return;

    select.innerHTML = `<option value="">Loading vehicles...</option>`;

    try {
      const res = await fetch(
        `${API_MAINTENANCE}/${staffId}/assignable-vehicles`,
      );
      const data = await res.json();

      if (!data.success || !Array.isArray(data.vehicles)) {
        select.innerHTML = `<option value="">No vehicles available</option>`;
        return;
      }

      const options = [`<option value="">Select a vehicle</option>`]
        .concat(
          data.vehicles.map(
            (v) =>
              `<option value="${v.id}">${esc(v.name || "")} (${esc(v.numberPlate || "—")})</option>`,
          ),
        )
        .join("");

      select.innerHTML = options;
    } catch (err) {
      console.error(err);
      select.innerHTML = `<option value="">Failed to load vehicles</option>`;
    }
  }

  function resetMaintenanceForm() {
    $("#maintenanceForm")?.reset();
    $("#mfId").value = "";

    const pwWrap = $("#mfPasswordWrap");
    const cpwWrap = $("#mfConfirmPasswordWrap");

    if (pwWrap) pwWrap.style.display = "";
    if (cpwWrap) cpwWrap.style.display = "";
  }

  function wireAll(company) {
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".tab-btn")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const tab = btn.dataset.tab;
        currentTab = tab;
        const content = $("#tabContent");

        switch (tab) {
          case "overview":
            content.innerHTML = renderOverviewTab(company);
            break;
          case "vehicles":
            content.innerHTML = renderVehiclesTab(company);
            break;
          case "drivers":
            content.innerHTML = renderDriversTab(company);
            break;
          case "maintenance":
            content.innerHTML = renderMaintenanceTab(company);
            break;
          case "reviews":
            content.innerHTML = renderReviewsTab(company);
            break;
        }
      });
    });

    const editBtn = $("#editCompanyBtn");
    if (editBtn) editBtn.onclick = () => openModal("editCompanyModal");

    const ecForm = $("#editCompanyForm");
    if (ecForm) {
      ecForm.onsubmit = async (e) => {
        e.preventDefault();

        const fd = new FormData();
        fd.append("name", $("#ecName").value.trim());
        fd.append("email", $("#ecEmail").value.trim());
        fd.append("phone", $("#ecPhone").value.trim());
        fd.append("licenseNumber", $("#ecLicense").value.trim());
        fd.append("taxId", $("#ecTaxId").value.trim());
        fd.append("address", $("#ecAddress").value.trim());
        fd.append("city", $("#ecCity").value.trim());
        fd.append("description", $("#ecDescription").value.trim());
        fd.append("terms", $("#ecTerms").value.trim());

        const certificateFile = $("#ecCertificate")?.files?.[0];
        const taxDocumentFile = $("#ecTaxDocument")?.files?.[0];

        if (certificateFile) fd.append("certificate", certificateFile);
        if (taxDocumentFile) fd.append("taxdocument", taxDocumentFile);

        try {
          const res = await fetch(`${API_COMPANY}/${company.id}`, {
            method: "PUT",
            body: fd,
          });

          const data = await res.json();

          if (data.status === "success") {
            closeModal("editCompanyModal");
            await loadCompanyData(company.id);
          } else {
            alert(data.message || "Update failed");
          }
        } catch {
          alert("Failed to update company");
        }
      };
    }

    const banBtn = $("#banCompanyBtn");
    if (banBtn) {
      banBtn.onclick = async () => {
        if (
          !confirm(
            `Are you sure you want to delete "${company.name}"? This will also remove all vehicles, drivers, and maintenance staff.`,
          )
        ) {
          return;
        }

        try {
          const res = await fetch(`${API_COMPANY}/${company.id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (data.status === "success") {
            alert("Company deleted successfully");
            window.location.href = "rental-companies.html";
          } else {
            alert(data.message || "Delete failed");
          }
        } catch {
          alert("Failed to delete company");
        }
      };
    }

    function resetVehicleFilePreview() {
      const imgWrap = $("#vfVehicleImagePreviewWrap");
      const img = $("#vfVehicleImagePreview");
      const docWrap = $("#vfRegistrationDocPreviewWrap");
      const docLink = $("#vfRegistrationDocLink");

      if (imgWrap) imgWrap.style.display = "none";
      if (img) img.src = "";
      if (docWrap) docWrap.style.display = "none";
      if (docLink) docLink.href = "#";
    }

    function setVehicleModalMode(isEdit, vehicleId = "") {
      $("#vehicleModalTitle").textContent = isEdit
        ? "Edit Vehicle"
        : "Add Vehicle";
      $("#vfId").value = vehicleId || "";

      const imgHint = $("#vfVehicleImageHint");
      const docHint = $("#vfRegistrationDocHint");

      if (imgHint) {
        imgHint.textContent = isEdit
          ? "Optional when editing. Leave empty to keep the current image."
          : "Required when adding a vehicle.";
      }

      if (docHint) {
        docHint.textContent = isEdit
          ? "Optional when editing. Leave empty to keep the current document."
          : "Required when adding a vehicle.";
      }
    }

    window._openVehicleModal = () => {
      $("#vehicleForm").reset();
      setVehicleModalMode(false, "");
      resetVehicleFilePreview();
      openModal("vehicleModal");
    };

    window._editVehicle = async (vehicleId) => {
      try {
        const res = await fetch(`${API_VEHICLES}/${vehicleId}`);
        const data = await res.json();

        if (!data.success || !data.vehicle) {
          alert("Vehicle not found");
          return;
        }

        const v = data.vehicle;

        $("#vehicleForm").reset();
        setVehicleModalMode(true, v.id);

        $("#vfBrand").value = v.brand || "";
        $("#vfModel").value = v.model || "";
        $("#vfPlate").value = v.numberPlate || "";
        $("#vfColor").value = v.color || "";
        $("#vfType").value = v.vehicleType || "";
        $("#vfFuel").value = v.fuelType || "";
        $("#vfTransmission").value = v.transmission || "";
        $("#vfPassengers").value = v.passengers || 4;
        $("#vfPrice").value = v.pricePerDay || 0;
        $("#vfYear").value = v.manufactureYear || "";
        $("#vfEngine").value = v.engineCapacity || "";
        $("#vfEngineNumber").value = v.engineNumber || "";
        $("#vfChassisNumber").value = v.chassisNumber || "";
        $("#vfTareWeight").value = v.tareWeight || "";
        $("#vfMileage").value = v.mileage || "";
        $("#vfLocation").value = v.location || "";
        $("#vfStatus").value = v.availabilityStatus || "available";
        $("#vfFeatures").value = v.features || "";
        $("#vfDescription").value = v.description || "";

        resetVehicleFilePreview();

        if (v.hasImage) {
          const imgWrap = $("#vfVehicleImagePreviewWrap");
          const img = $("#vfVehicleImagePreview");
          if (imgWrap && img) {
            img.src = `${API_VEHICLES}/${v.id}/image?t=${Date.now()}`;
            imgWrap.style.display = "block";
          }
        }

        if (v.hasRegDoc) {
          const docWrap = $("#vfRegistrationDocPreviewWrap");
          const docLink = $("#vfRegistrationDocLink");
          if (docWrap && docLink) {
            docLink.href = `${API_VEHICLES}/${v.id}/registration-doc?t=${Date.now()}`;
            docWrap.style.display = "block";
          }
        }

        openModal("vehicleModal");
      } catch (err) {
        console.error(err);
        alert("Failed to load vehicle details");
      }
    };

    const vForm = $("#vehicleForm");
    if (vForm) {
      vForm.onsubmit = async (e) => {
        e.preventDefault();

        const vehicleId = $("#vfId").value.trim();
        const isEdit = !!vehicleId;

        const brand = $("#vfBrand").value.trim();
        const model = $("#vfModel").value.trim();
        const numberPlate = $("#vfPlate").value.trim();
        const color = $("#vfColor").value.trim();
        const vehicleType = $("#vfType").value;
        const fuelType = $("#vfFuel").value;
        const transmission = $("#vfTransmission").value;
        const passengers = $("#vfPassengers").value;
        const pricePerDay = $("#vfPrice").value;
        const manufactureYear = $("#vfYear").value;
        const engineCapacity = $("#vfEngine").value;
        const engineNumber = $("#vfEngineNumber").value.trim();
        const chassisNumber = $("#vfChassisNumber").value.trim();
        const tareWeight = $("#vfTareWeight").value;
        const mileage = $("#vfMileage").value.trim();
        const location = $("#vfLocation").value.trim();
        const availabilityStatus = $("#vfStatus").value;
        const features = $("#vfFeatures").value.trim();
        const description = $("#vfDescription").value.trim();

        const vehicleImageFile = $("#vfVehicleImage")?.files?.[0] || null;
        const registrationDocFile = $("#vfRegistrationDoc")?.files?.[0] || null;

        if (!brand || !model || !numberPlate) {
          alert("Brand, model, and number plate are required.");
          return;
        }

        if (!isEdit) {
          if (!vehicleImageFile) {
            alert("Please upload a vehicle image.");
            return;
          }
          if (!registrationDocFile) {
            alert("Please upload a registration document.");
            return;
          }
        }

        const fd = new FormData();
        fd.append("brand", brand);
        fd.append("model", model);
        fd.append("numberPlate", numberPlate);
        fd.append("color", color);
        fd.append("vehicleType", vehicleType);
        fd.append("fuelType", fuelType);
        fd.append("transmission", transmission);
        fd.append("passengers", passengers);
        fd.append("pricePerDay", pricePerDay);
        fd.append("manufactureYear", manufactureYear);
        fd.append("engineCapacity", engineCapacity);
        fd.append("engineNumber", engineNumber);
        fd.append("chassisNumber", chassisNumber);
        fd.append("tareWeight", tareWeight);
        fd.append("mileage", mileage);
        fd.append("location", location);
        fd.append("availabilityStatus", availabilityStatus);
        fd.append("features", features);
        fd.append("description", description);
        fd.append("companyId", String(company.id));

        if (vehicleImageFile) fd.append("vehicleImage", vehicleImageFile);
        if (registrationDocFile) {
          fd.append("registrationDoc", registrationDocFile);
        }

        try {
          const url = isEdit ? `${API_VEHICLES}/${vehicleId}` : API_VEHICLES;
          const method = isEdit ? "PUT" : "POST";

          const res = await fetch(url, {
            method,
            body: fd,
          });

          const data = await res.json();

          if (data.success) {
            closeModal("vehicleModal");
            await loadCompanyData(company.id);

            setTimeout(() => {
              const vTab = document.querySelector('[data-tab="vehicles"]');
              if (vTab) vTab.click();
            }, 100);
          } else {
            alert(data.message || "Save failed");
          }
        } catch (err) {
          console.error(err);
          alert("Failed to save vehicle");
        }
      };
    }

    window._openDriverModal = () => {
      $("#driverModalTitle").textContent = "Add Driver";
      $("#driverForm").reset();
      openModal("driverModal");
    };

    const dForm = $("#driverForm");
    if (dForm) {
      dForm.onsubmit = async (e) => {
        e.preventDefault();
        alert(
          "Driver registration requires NIC and license document uploads. Please use the full driver registration flow.",
        );
        closeModal("driverModal");
      };
    }

    window._openMaintenanceModal = () => {
      resetMaintenanceForm();
      $("#maintenanceModalTitle").textContent = "Add Maintenance Staff";
      openModal("maintenanceModal");
    };

    window._editMaintenance = async (staffId) => {
      try {
        const res = await fetch(`${API_MAINTENANCE}/${staffId}`);
        const data = await res.json();

        if (!data.success || !data.staff) {
          alert("Staff not found");
          return;
        }

        const m = data.staff;
        resetMaintenanceForm();

        $("#maintenanceModalTitle").textContent = "Edit Staff";
        $("#mfId").value = m.id || "";
        $("#mfFirstName").value = m.firstName || "";
        $("#mfLastName").value = m.lastName || "";
        $("#mfUsername").value = m.username || "";
        $("#mfEmail").value = m.email || "";
        $("#mfPhone").value = m.phone || "";
        $("#mfSpecialization").value = m.specialization || "General";
        $("#mfExperience").value = m.yearsOfExperience || 0;
        $("#mfStatus").value = m.status || "available";

        const pwWrap = $("#mfPasswordWrap");
        const cpwWrap = $("#mfConfirmPasswordWrap");
        if (pwWrap) pwWrap.style.display = "none";
        if (cpwWrap) cpwWrap.style.display = "none";

        openModal("maintenanceModal");
      } catch (err) {
        console.error(err);
        alert("Failed to load staff details");
      }
    };

    window._openStaffDetailsModal = async (staffId) => {
      try {
        const res = await fetch(`${API_MAINTENANCE}/${staffId}`);
        const data = await res.json();

        if (!data.success || !data.staff) {
          alert("Staff not found");
          return;
        }

        const m = data.staff;
        $("#sdStaffId").value = staffId;
        $("#staffDetailsModalTitle").textContent =
          `${m.firstName || ""} ${m.lastName || ""} — Details`;

        renderDetailsAssignedVehicles(m);
        renderDetailsJobHistory(m);
        await loadDetailsAssignableVehicles(staffId);

        openModal("staffDetailsModal");
      } catch (err) {
        console.error(err);
        alert("Failed to load staff details");
      }
    };

    window._unassignVehicle = async (vehicleId) => {
      const staffId = $("#sdStaffId")?.value;
      if (!staffId || !vehicleId) return;
      if (!confirm("Are you sure you want to unassign this vehicle?")) return;

      try {
        const res = await fetch(
          `${API_MAINTENANCE}/${staffId}/assign-vehicle/${vehicleId}`,
          { method: "DELETE" },
        );
        const data = await res.json();

        if (!data.success) {
          alert(data.message || "Failed to unassign vehicle");
          return;
        }

        // Refresh the details modal
        const freshRes = await fetch(`${API_MAINTENANCE}/${staffId}`);
        const freshData = await freshRes.json();
        if (freshData.success && freshData.staff) {
          renderDetailsAssignedVehicles(freshData.staff);
          renderDetailsJobHistory(freshData.staff);
        }
        await loadDetailsAssignableVehicles(staffId);
        await loadCompanyData(company.id);

        setTimeout(() => {
          const mTab = document.querySelector('[data-tab="maintenance"]');
          if (mTab) mTab.click();
        }, 100);
      } catch (err) {
        console.error(err);
        alert("Failed to unassign vehicle");
      }
    };

    const sdAssignVehicleBtn = $("#sdAssignVehicleBtn");
    if (sdAssignVehicleBtn) {
      sdAssignVehicleBtn.onclick = async () => {
        const staffId = $("#sdStaffId").value.trim();
        const vehicleId = $("#sdAssignableVehicle").value;
        const priority = $("#sdAssignPriority").value;

        if (!staffId) {
          alert("No staff member selected.");
          return;
        }

        if (!vehicleId) {
          alert("Please select a vehicle.");
          return;
        }

        try {
          const res = await fetch(
            `${API_MAINTENANCE}/${staffId}/assign-vehicle`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ vehicleId, priority }),
            },
          );

          const data = await res.json();

          if (!data.success) {
            alert(data.message || "Failed to assign vehicle");
            return;
          }

          alert(data.message || "Vehicle assigned successfully");

          const freshRes = await fetch(`${API_MAINTENANCE}/${staffId}`);
          const freshData = await freshRes.json();
          if (freshData.success && freshData.staff) {
            renderDetailsAssignedVehicles(freshData.staff);
            renderDetailsJobHistory(freshData.staff);
          }

          await loadDetailsAssignableVehicles(staffId);
          await loadCompanyData(company.id);

          setTimeout(() => {
            const mTab = document.querySelector('[data-tab="maintenance"]');
            if (mTab) mTab.click();
          }, 100);
        } catch (err) {
          console.error(err);
          alert("Failed to assign vehicle");
        }
      };
    }

    const mForm = $("#maintenanceForm");
    if (mForm) {
      mForm.onsubmit = async (e) => {
        e.preventDefault();

        const staffId = $("#mfId").value.trim();
        const isEdit = !!staffId;

        const firstName = $("#mfFirstName").value.trim();
        const lastName = $("#mfLastName").value.trim();
        const username = $("#mfUsername").value.trim();
        const email = $("#mfEmail").value.trim();
        const phone = $("#mfPhone").value.trim();
        const specialization = $("#mfSpecialization").value;
        const yearsOfExperience = $("#mfExperience").value;
        const status = $("#mfStatus").value;
        const password = $("#mfPassword").value;
        const confirmPassword = $("#mfConfirmPassword").value;

        if (!firstName || !lastName || !email) {
          alert("First name, last name, and email are required.");
          return;
        }

        if (!isEdit) {
          if (!password) {
            alert("Password is required for new maintenance staff.");
            return;
          }
          if (password.length < 6) {
            alert("Password must be at least 6 characters.");
            return;
          }
          if (password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
          }
        }

        const payload = {
          firstName,
          lastName,
          username,
          email,
          phone,
          specialization,
          yearsOfExperience,
          status,
          companyId: String(company.id),
        };

        if (!isEdit) {
          payload.password = password;
        }

        try {
          const url = isEdit
            ? `${API_MAINTENANCE}/${staffId}`
            : API_MAINTENANCE;
          const method = isEdit ? "PUT" : "POST";

          const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

          const data = await res.json();

          if (data.success) {
            closeModal("maintenanceModal");
            await loadCompanyData(company.id);

            setTimeout(() => {
              const mTab = document.querySelector('[data-tab="maintenance"]');
              if (mTab) mTab.click();
            }, 100);
          } else {
            alert(data.message || "Save failed");
          }
        } catch (err) {
          console.error(err);
          alert("Failed to save staff");
        }
      };
    }

    let deleteTarget = { type: "", id: 0 };

    window._confirmDelete = (type, id, name) => {
      deleteTarget = { type, id };
      const text =
        type === "driver"
          ? `Are you sure you want to ban driver "${name}"?`
          : `Are you sure you want to delete ${type} "${name}"?`;
      $("#deleteConfirmText").textContent = text;
      openModal("deleteConfirmModal");
    };

    const delBtn = $("#deleteConfirmBtn");
    if (delBtn) {
      delBtn.onclick = async () => {
        const { type, id } = deleteTarget;
        try {
          let res;
          if (type === "vehicle") {
            res = await fetch(`${API_VEHICLES}/${id}`, { method: "DELETE" });
          } else if (type === "driver") {
            res = await fetch(`${API_DRIVERS}/${id}/ban`, { method: "POST" });
          } else if (type === "maintenance") {
            res = await fetch(`${API_MAINTENANCE}/${id}`, { method: "DELETE" });
          }

          if (!res) return;

          const data = await res.json();
          if (data.success || data.status === "success") {
            closeModal("deleteConfirmModal");
            await loadCompanyData(company.id);

            setTimeout(() => {
              const tab = document.querySelector(
                `[data-tab="${type === "vehicle" ? "vehicles" : type === "driver" ? "drivers" : "maintenance"}"]`,
              );
              if (tab) tab.click();
            }, 100);
          } else {
            alert(data.message || "Action failed");
          }
        } catch {
          alert("Action failed");
        }
      };
    }
  }

  window.openModal = (id) => {
    const m = document.getElementById(id);
    if (m) m.classList.add("show");
  };

  window.closeModal = (id) => {
    const m = document.getElementById(id);
    if (m) m.classList.remove("show");
  };

  function getParams() {
    const q = new URLSearchParams(location.search);
    const id = Number(q.get("id"));
    return { id: Number.isFinite(id) ? id : null };
  }

  function renderEmpty(message) {
    const mount = $("#companyView");
    if (!mount) return;
    mount.innerHTML = `<div class="content-placeholder" style="padding:40px;text-align:center;">${message}</div>`;
  }

  function esc(s) {
    return String(s || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function fmt(v) {
    return Number(v || 0).toLocaleString();
  }

  function avatar(name) {
    return String(name || "")
      .split(/\s+/)
      .filter(Boolean)
      .map((n) => n[0] || "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  function formatDateTime(s) {
    if (!s) return "";
    return String(s).replace(/\.0$/, "");
  }
})();
