// Earnings JavaScript (ADMIN API integrated)

// --- CONFIG ---
const API_BASE = "/api/admin/earnings"; // adjust context path if needed

document.addEventListener("DOMContentLoaded", function () {
  initializeChartControls();

  // Load data from backend
  loadAll();

  // Responsive redraw
  window.addEventListener("resize", function () {
    setTimeout(() => {
      if (
        window.__earningsChartCache?.labels &&
        window.__earningsChartCache?.data
      ) {
        const canvas = document.getElementById("earningsChart");
        if (canvas)
          drawEarningsChart(
            canvas.getContext("2d"),
            canvas,
            window.__earningsChartCache.labels,
            window.__earningsChartCache.data,
          );
      }
    }, 300);
  });
});

// ---------------------------
// MAIN LOADERS
// ---------------------------
async function loadAll() {
  await loadSummary();
  await loadMonthlyChartFromDropdown();
  await loadRecentBookings();
  await loadTopVehicles();
}

async function loadTopVehicles() {
  const sortSelect = document.getElementById("vehicleSortSelect");
  const sortText = sortSelect?.value || "Sort";
  const sort = mapVehicleSort(sortText);

  try {
    const res = await fetch(
      `${API_BASE}/vehicles?sort=${encodeURIComponent(sort)}&limit=10`,
    );
    const payload = await res.json();

    if (!res.ok) throw new Error(payload?.error || "Failed to load vehicles");

    const list = document.querySelector(".vehicle-earnings-list");
    if (!list) return;

    list.innerHTML = "";

    (payload.vehicles || []).forEach((v) => {
      const trend = "up"; // optional: you can compute later
      const item = document.createElement("div");
      item.className = "vehicle-earning-item";
      item.innerHTML = `
        <div class="ranking">#${v.rank}</div>
        <div class="vehicle-info">
          <div class="vehicle-name">${escapeHtml(v.name)}</div>
        </div>
        <div class="earnings-amount">
          ${formatRs(v.platformEarnings)} <span class="trend ${trend}">↗</span>
        </div>
      `;
      list.appendChild(item);
    });
  } catch (e) {
    console.error("Vehicle earnings load error:", e);
  }
}

function mapVehicleSort(text) {
  switch (text) {
    case "Earnings (High to Low)":
      return "earnings_desc";
    case "Earnings (Low to High)":
      return "earnings_asc";
    case "Bookings (Most to Least)":
      return "bookings_desc";
    case "Name (A-Z)":
      return "name_asc";
    default:
      return "earnings_desc";
  }
}

async function loadSummary() {
  try {
    const res = await fetch(`${API_BASE}/summary`);
    const data = await res.json();

    if (!res.ok) throw new Error(data?.error || "Failed to load summary");

    // Update stats cards in earnings.html (same DOM, admin values)
    const statCards = document.querySelectorAll(".stats-grid .stat-card");
    const incomeCard = statCards[0];
    const bookingsCard = statCards[1];

    // Card 1: This Month's Income -> currentMonthEarnings (platform earnings)
    incomeCard.querySelector(".stat-value").textContent = formatRs(
      data.currentMonthEarnings,
    );

    // Use monthChangePct from backend
    incomeCard.querySelector(".stat-change").textContent =
      `${formatChangePct(data.monthChangePct)} from last month`;
    setChangeClass(
      incomeCard.querySelector(".stat-change"),
      data.monthChangePct,
    );

    // Card 2: Total Bookings -> totalBookings (admin-wide)
    bookingsCard.querySelector(".stat-value").textContent = String(
      data.totalBookings ?? 0,
    );

    // No bookingsChange exists in admin summary -> show useful admin info instead
    // e.g., "Paid: X | This month: Y"
    const paid = data.paidBookings ?? 0;
    const thisMonthBookings = data.currentMonthBookings ?? 0;
    bookingsCard.querySelector(".stat-change").textContent =
      `Paid: ${paid} | This month: ${thisMonthBookings}`;

    // Keep positive style for info text
    bookingsCard.querySelector(".stat-change").classList.remove("negative");
    bookingsCard.querySelector(".stat-change").classList.add("positive");

    animateStats();
  } catch (err) {
    console.error("Summary load error:", err);
  }
}

async function loadMonthlyChartFromDropdown() {
  const select = document.getElementById("chartPeriod");
  const periodText = select?.value || "Last 12 months";
  const apiPeriod = mapDropdownToApiPeriod(periodText);
  await loadMonthlyChart(apiPeriod);
}

async function loadMonthlyChart(period) {
  try {
    const res = await fetch(
      `${API_BASE}/monthly?period=${encodeURIComponent(period)}`,
    );
    const payload = await res.json();

    if (!res.ok)
      throw new Error(payload?.error || "Failed to load monthly chart");

    const labels = payload.labels || [];
    const values = payload.data || [];

    const canvas = document.getElementById("earningsChart");
    if (!canvas) return;

    window.__earningsChartCache = { labels, data: values };

    drawEarningsChart(canvas.getContext("2d"), canvas, labels, values);
  } catch (err) {
    console.error("Monthly chart load error:", err);
  }
}

async function loadRecentBookings() {
  try {
    const res = await fetch(`${API_BASE}/recent-bookings?limit=10`);
    const payload = await res.json();

    if (!res.ok)
      throw new Error(payload?.error || "Failed to load recent bookings");

    const container = document.querySelector(".bookings-list");
    if (!container) return;

    container.innerHTML = "";

    (payload.bookings || []).forEach((b) => {
      const status = (b.status || "").toLowerCase();
      const statusClass = status === "completed" ? "completed" : "ongoing";

      const bookingIdText = b.bookingId
        ? `BK${String(b.bookingId).padStart(7, "0")}`
        : "BK0000000";

      const vehicleCode = `VH${String(b.vehicleId || 0).padStart(3, "0")}`;
      const durationText = buildDurationText(b.tripStartDate, b.tripEndDate);

      // Admin API returns:
      // fareAmount, platformFee, companyFee, netToCompany
      const fare = b.fareAmount ?? 0;
      const platformFee = b.platformFee ?? 0;
      const companyFee = b.companyFee ?? 0;
      const netToCompany = b.netToCompany ?? 0;

      const item = document.createElement("div");
      item.className = `booking-item ${statusClass}`;
      item.innerHTML = `
        <div class="booking-info">
          <div class="booking-header">
            <span class="vehicle-id">Vehicle ${escapeHtml(vehicleCode)}</span>
            <span class="booking-status ${statusClass}">${escapeHtml(status)}</span>
          </div>

          <div class="booking-details">
            <div class="booking-id">Booking ID: ${escapeHtml(bookingIdText)}</div>
            <div class="rental-company">Rental Company: ${escapeHtml(b.companyName || "")}</div>
            <div class="customer">Customer: ${escapeHtml(b.customerName || "")}</div>
            <div class="duration">⏱️ ${escapeHtml(durationText)}</div>
          </div>
        </div>

        <div class="booking-progress">
          <div class="progress-step completed">● Accepted</div>
          <div class="progress-step completed">● Paid</div>
          <div class="progress-step completed">● Pick-up</div>
          ${
            statusClass === "completed"
              ? `<div class="progress-step completed">● Drop-off</div>`
              : `<div class="progress-step pending">Drop-off</div>`
          }
        </div>

        <div class="booking-earnings">
          <div class="fare-breakdown">
            <div class="fare-item">
              <span>Fare Amount</span>
              <span>${formatRs(fare)}</span>
            </div>
            <div class="fare-item platform-fee">
              <span>Platform Fee (Admin)</span>
              <span>-${formatRs(platformFee)}</span>
            </div>
            <div class="fare-item company-fee">
              <span>Company Fee</span>
              <span>-${formatRs(companyFee)}</span>
            </div>
            <div class="fare-item net-earnings">
              <span>Net To Company</span>
              <span>${formatRs(netToCompany)}</span>
            </div>
          </div>
        </div>
      `;

      item.style.cursor = "pointer";
      item.addEventListener("click", () => {
        console.log("Viewing booking:", b.bookingId);
      });

      container.appendChild(item);
    });
  } catch (err) {
    console.error("Recent bookings load error:", err);
  }
}

// ---------------------------
// CONTROLS
// ---------------------------
function initializeChartControls() {
  const chartPeriod = document.getElementById("chartPeriod");
  if (!chartPeriod) return;

  chartPeriod.addEventListener("change", async () => {
    await loadMonthlyChartFromDropdown();
  });
}

// ---------------------------
// ADMIN: hide vehicle section (no endpoint)
// ---------------------------
function hideVehicleSection() {
  const vehicleSection = document.querySelector(".vehicle-earnings-section");
  if (vehicleSection) vehicleSection.style.display = "none";
}

// ---------------------------
// EXISTING DRAW CHART (kept + reused)
// ---------------------------
function drawEarningsChart(ctx, canvas, months, data) {
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  const padding = 80;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  ctx.clearRect(0, 0, width, height);
  if (!data || data.length === 0) return;

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const valueRange = Math.max(1, maxValue - minValue);

  ctx.strokeStyle = "#e8eaed";
  ctx.lineWidth = 1;
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
  ctx.fillStyle = "#5f6368";

  for (let i = 0; i <= 6; i++) {
    const y = padding + (chartHeight / 6) * i;
    const value = maxValue - (valueRange / 6) * i;

    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();

    ctx.fillText(`Rs ${(value / 1000).toFixed(0)}k`, 10, y + 4);
  }

  for (let i = 0; i < months.length; i++) {
    const x = padding + (chartWidth / (months.length - 1)) * i;
    ctx.fillText(months[i], x - 15, height - 30);
  }

  const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  gradient.addColorStop(0, "rgba(26, 188, 156, 0.3)");
  gradient.addColorStop(1, "rgba(26, 188, 156, 0.05)");

  ctx.fillStyle = gradient;
  ctx.strokeStyle = "#1abc9c";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.moveTo(padding, height - padding);

  for (let i = 0; i < data.length; i++) {
    const x = padding + (chartWidth / (data.length - 1)) * i;
    const y =
      padding + chartHeight - ((data[i] - minValue) / valueRange) * chartHeight;
    ctx.lineTo(x, y);
  }

  ctx.lineTo(width - padding, height - padding);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = padding + (chartWidth / (data.length - 1)) * i;
    const y =
      padding + chartHeight - ((data[i] - minValue) / valueRange) * chartHeight;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    ctx.fillStyle = "#1abc9c";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.stroke();

  ctx.fillStyle = "#202124";
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
  ctx.textAlign = "center";
  ctx.fillText("Monthly Earnings Trend", width / 2, 30);
  ctx.textAlign = "left";
}

// ---------------------------
// STATS ANIMATION (kept)
// ---------------------------
function animateStats() {
  const statValues = document.querySelectorAll(".stat-value");

  statValues.forEach((stat, index) => {
    const finalValue = stat.textContent;
    const numericValue = parseFloat(finalValue.replace(/[^\d.]/g, ""));
    stat.textContent = "0";

    setTimeout(() => {
      animateValue(stat, 0, numericValue, 800, finalValue);
    }, index * 150);
  });
}

function animateValue(element, start, end, duration, finalText) {
  const range = end - start;
  const startTime = Date.now();

  function updateValue() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = start + range * easeOutCubic(progress);

    if (finalText.includes("Rs")) {
      element.textContent = `Rs ${Math.floor(current).toLocaleString()}`;
    } else {
      element.textContent = Math.floor(current).toString();
    }

    if (progress < 1) requestAnimationFrame(updateValue);
    else element.textContent = finalText;
  }

  updateValue();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// ---------------------------
// HELPERS
// ---------------------------
function mapDropdownToApiPeriod(text) {
  switch (text) {
    case "Last 6 months":
      return "6m";
    case "Last 3 months":
      return "3m";
    case "This year":
      return "year";
    case "Last 12 months":
    default:
      return "12m";
  }
}

function formatRs(n) {
  const num = Number(n || 0);
  return `Rs ${Math.round(num).toLocaleString()}`;
}

function formatChangePct(n) {
  const num = Number(n || 0);
  const sign = num >= 0 ? "+ " : "- ";
  return `${sign}${Math.abs(num).toFixed(1)}%`;
}

function setChangeClass(el, value) {
  if (!el) return;
  el.classList.remove("positive", "negative");
  if (Number(value) >= 0) el.classList.add("positive");
  else el.classList.add("negative");
}

function buildDurationText(startDateStr, endDateStr) {
  // startDateStr/endDateStr come like "2026-01-10" or null
  if (!startDateStr || !endDateStr) return "Duration: -";
  try {
    const s = new Date(startDateStr);
    const e = new Date(endDateStr);
    const ms = e - s;
    const days = Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
    return `Duration: ${days} days`;
  } catch {
    return "Duration: -";
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
