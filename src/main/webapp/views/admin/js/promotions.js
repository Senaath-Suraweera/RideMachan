// --- Dummy data ---
let PROMOTIONS = [
  {
    id: 1,
    title: "Weekend City Saver",
    vehicleType: "sedan",
    vehicleName: "Toyota Axio",
    company: "ABC Rentals",
    location: "colombo",
    discount: 20,
    originalPrice: 6000,
    driverIncluded: true,
    startDate: "2025-09-01",
    endDate: "2025-09-30",
    description:
      "Ideal for city runs. Unlimited km within Colombo city limits.",
    imageUrl: null,
  },
  {
    id: 2,
    title: "Hill Country Escape",
    vehicleType: "suv",
    vehicleName: "Nissan X-Trail",
    company: "Quick Rentals",
    location: "kandy",
    discount: 15,
    originalPrice: 9000,
    driverIncluded: false,
    startDate: "2025-09-10",
    endDate: "2025-10-10",
    description: "Perfect for Kandy & surrounding hill country.",
    imageUrl: null,
  },
  {
    id: 3,
    title: "Beach Run Special",
    vehicleType: "hatchback",
    vehicleName: "Suzuki Alto",
    company: "XYZ Motors",
    location: "galle",
    discount: 30,
    originalPrice: 4000,
    driverIncluded: false,
    startDate: "2025-09-05",
    endDate: "2025-09-25",
    description: "Budget-friendly beach trips — limited time!",
    imageUrl: null,
  },
  {
    id: 4,
    title: "Family Van Deal",
    vehicleType: "van",
    vehicleName: "Toyota HiAce",
    company: "Premium Cars",
    location: "negombo",
    discount: 25,
    originalPrice: 12000,
    driverIncluded: true,
    startDate: "2025-09-15",
    endDate: "2025-10-15",
    description: "Spacious van with driver for airport runs & tours.",
    imageUrl: null,
  },
];

// --- Utilities ---
const byId = (id) => document.getElementById(id);
const fmtLKR = (n) => `Rs. ${Number(n).toLocaleString("en-LK")}/day`;
const parseDate = (s) => (s ? new Date(s + "T00:00:00") : null);

function datesOverlap(aStart, aEnd, bStart, bEnd) {
  if (!aStart || !aEnd || !bStart || !bEnd) return true; // if any missing, don't filter out
  return aStart <= bEnd && bStart <= aEnd;
}

// --- Render ---
function renderPromotions(list) {
  const grid = byId("promotionsGrid");
  grid.innerHTML = "";

  if (!list.length) {
    grid.innerHTML = `<div style="padding:16px;color:#6b7280;">No promotions match your filters.</div>`;
    return;
  }

  list.forEach((p) => {
    const discounted = Math.round(p.originalPrice * (1 - p.discount / 100));
    const card = document.createElement("div");
    card.className = "promotion-card";
    card.dataset.promotionId = p.id;

    card.innerHTML = `
      <div class="promotion-image">
        <div class="image-placeholder">${
          p.imageUrl ? "" : "Image of vehicle"
        }</div>
        <div class="discount-badge">${p.discount}% OFF</div>
      </div>
      <div class="promotion-content">
        <h3 class="vehicle-name">${p.title}</h3>
        <div class="company-info">
          <span class="company-label">${p.company}</span>
        </div>
        <div class="pricing">
          <span class="original-price">${fmtLKR(p.originalPrice)}</span>
          <span class="discounted-price">${fmtLKR(discounted)}</span>
        </div>
        <div class="promotion-details">
          <div class="detail-row">
            <span class="detail-label">Vehicle</span>
            <span class="detail-value">${p.vehicleName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Driver</span>
            <span class="detail-value">${
              p.driverIncluded ? "Included" : "Optional"
            }</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Type</span>
            <span class="detail-value">${p.vehicleType.toUpperCase()}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location</span>
            <span class="detail-value">${cap(p.location)}</span>
          </div>
        </div>
        <div class="promotion-period">
          <span class="period-label">Valid:</span>
          <span class="period-dates">${fmtPeriod(p.startDate, p.endDate)}</span>
        </div>
        <div class="promotion-actions">
          <button class="btn btn-primary btn-sm" onclick="bookPromotion(${
            p.id
          })">Book Now</button>
          <button class="btn btn-secondary btn-sm" onclick="viewDetails(${
            p.id
          })">View Details</button>
        </div>
      </div>
    `;
    grid.appendChild(card);
  });
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}
function fmtPeriod(a, b) {
  const d1 = new Date(a),
    d2 = new Date(b);
  const opts = { month: "short", day: "2-digit", year: "numeric" };
  return `${d1.toLocaleDateString("en-US", opts)} - ${d2.toLocaleDateString(
    "en-US",
    opts
  )}`;
}

// --- Filters ---
function currentFilters() {
  return {
    vehicleType: byId("vehicleTypeFilter").value,
    location: byId("locationFilter").value,
    discount: byId("discountFilter").value, // treat as minimum if provided
    withDriver: byId("withDriverFilter").checked,
    fromDate: parseDate(byId("fromDate").value),
    toDate: parseDate(byId("toDate").value),
  };
}

function applyFilters(data, f) {
  return data.filter((p) => {
    if (f.vehicleType && p.vehicleType !== f.vehicleType) return false;
    if (f.location && p.location !== f.location) return false;
    if (f.withDriver && !p.driverIncluded) return false;

    if (f.discount) {
      const min = Number(f.discount);
      if (!(p.discount >= min)) return false;
    }

    // overlap between promo validity and user date range
    const promoStart = parseDate(p.startDate);
    const promoEnd = parseDate(p.endDate);
    if (
      f.fromDate &&
      f.toDate &&
      !datesOverlap(promoStart, promoEnd, f.fromDate, f.toDate)
    )
      return false;

    return true;
  });
}

function searchPromotions() {
  const f = currentFilters();
  const filtered = applyFilters(PROMOTIONS, f);
  renderPromotions(filtered);
}

// --- Modal helpers ---
function openCreatePromotionModal() {
  byId("createPromotionModal").classList.add("show");
}
function closeCreatePromotionModal() {
  byId("createPromotionModal").classList.remove("show");
  byId("createPromotionForm").reset();
}

function closePromotionDetailsModal() {
  byId("promotionDetailsModal").classList.remove("show");
}

function viewDetails(id) {
  const p = PROMOTIONS.find((x) => x.id === id);
  if (!p) return;
  byId("promotionDetailsTitle").textContent = p.title;
  const discounted = Math.round(p.originalPrice * (1 - p.discount / 100));
  byId("promotionDetailsContent").innerHTML = `
    <div style="display:grid;gap:8px;">
      <div><strong>Company:</strong> ${p.company}</div>
      <div><strong>Vehicle:</strong> ${
        p.vehicleName
      } (${p.vehicleType.toUpperCase()})</div>
      <div><strong>Location:</strong> ${cap(p.location)}</div>
      <div><strong>Driver:</strong> ${
        p.driverIncluded ? "Included" : "Optional"
      }</div>
      <div><strong>Price:</strong> ${fmtLKR(
        p.originalPrice
      )} → <strong>${fmtLKR(discounted)}</strong> (${p.discount}% off)</div>
      <div><strong>Validity:</strong> ${fmtPeriod(p.startDate, p.endDate)}</div>
      ${
        p.description
          ? `<div><strong>About:</strong> ${p.description}</div>`
          : ""
      }
    </div>
  `;
  byId("promotionDetailsModal").classList.add("show");
}

function editPromotion() {
  alert(
    "Edit UI is not implemented in this demo, but the ID is preserved in the details modal."
  );
}

function bookPromotion(id) {
  const p = PROMOTIONS.find((x) => x.id === id);
  if (!p) return;
  alert(
    `Booking started for "${p.title}" at ${fmtLKR(
      Math.round(p.originalPrice * (1 - p.discount / 100))
    )}.`
  );
}

// --- Create promotion from modal ---
function createPromotion() {
  const form = byId("createPromotionForm");
  const fd = new FormData(form);

  const title = (fd.get("title") || "").toString().trim();
  const discount = Number(fd.get("discount") || 0);
  const vehicleType = fd.get("vehicleType");
  const company = fd.get("company");
  const startDate = fd.get("startDate");
  const endDate = fd.get("endDate");
  const originalPrice = Number(fd.get("originalPrice") || 0);
  const description = (fd.get("description") || "").toString().trim();
  const driverIncluded = !!fd.get("driverIncluded");

  if (
    !title ||
    !discount ||
    !vehicleType ||
    !company ||
    !startDate ||
    !endDate ||
    !originalPrice
  ) {
    alert("Please fill all required fields.");
    return;
  }

  const id = Math.max(0, ...PROMOTIONS.map((p) => p.id)) + 1;

  PROMOTIONS.push({
    id,
    title,
    vehicleType,
    vehicleName: `${vehicleType.toUpperCase()} – Special`, // placeholder
    company,
    location: "colombo", // default for demo
    discount,
    originalPrice,
    driverIncluded,
    startDate,
    endDate,
    description,
    imageUrl: null,
  });

  closeCreatePromotionModal();
  searchPromotions();
}

// --- Init ---
document.addEventListener("DOMContentLoaded", () => {
  // First render full list
  renderPromotions(PROMOTIONS);

  // Hook ESC to close any modal
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeCreatePromotionModal();
      closePromotionDetailsModal();
    }
  });
});

// Expose functions for inline HTML handlers
window.searchPromotions = searchPromotions;
window.openCreatePromotionModal = openCreatePromotionModal;
window.closeCreatePromotionModal = closeCreatePromotionModal;
window.viewDetails = viewDetails;
window.closePromotionDetailsModal = closePromotionDetailsModal;
window.editPromotion = editPromotion;
window.bookPromotion = bookPromotion;
window.createPromotion = createPromotion;
