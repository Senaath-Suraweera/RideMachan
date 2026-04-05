document.addEventListener("DOMContentLoaded", function () {
  loadEarningsPage().catch((e) => console.error(e));
  initializeVehicleSort();
  initializeChartControls();
});

// ---------- API base ----------
const API_ROOT = `${window.location.origin}`; // adjust if your context path differs
const EARNINGS_API = `${API_ROOT}/api/provider/earnings`;

// ---------- Main loader ----------
async function loadEarningsPage() {
  // default chart period
  const period =
    document.getElementById("chartPeriod")?.value || "Last 12 months";
  const months = periodToMonths(period);

  await Promise.all([
    loadSummary(),
    loadMonthlyChart(months),
    loadVehicleEarnings(),
    loadRecentBookings(),
  ]);
}

// ---------- Summary cards ----------
async function loadSummary() {
  const res = await fetch(`${EARNINGS_API}/summary`);
  const data = await res.json();

  if (!res.ok) throw new Error(data?.error || "Failed to load summary");

  // Total Income card
  const incomeValueEl = document.querySelector(".stat-card.income .stat-value");
  const incomeChangeEl = document.querySelector(
    ".stat-card.income .stat-change",
  );
  if (incomeValueEl)
    incomeValueEl.textContent = `Rs ${Number(data.totalIncome || 0).toLocaleString()}`;

  if (incomeChangeEl) {
    const pct = Number(data.incomeChangePct || 0);
    const sign = pct >= 0 ? "+" : "";
    incomeChangeEl.textContent = `${sign}${pct.toFixed(1)}% from last month`;
    incomeChangeEl.classList.toggle("positive", pct >= 0);
    incomeChangeEl.classList.toggle("negative", pct < 0);
  }

  // Total Bookings card
  const bookingValueEl = document.querySelector(
    ".stat-card.bookings .stat-value",
  );
  const bookingChangeEl = document.querySelector(
    ".stat-card.bookings .stat-change",
  );
  if (bookingValueEl)
    bookingValueEl.textContent = `${Number(data.totalBookings || 0)}`;

  if (bookingChangeEl) {
    const diff = Number(data.bookingChange || 0);
    const sign = diff >= 0 ? "+" : "";
    bookingChangeEl.textContent = `${sign}${diff} from last month`;
    bookingChangeEl.classList.toggle("positive", diff >= 0);
    bookingChangeEl.classList.toggle("negative", diff < 0);
  }
}

// ---------- Chart ----------
function initializeChartControls() {
  const chartPeriod = document.getElementById("chartPeriod");
  if (!chartPeriod) return;

  chartPeriod.addEventListener("change", async () => {
    const months = periodToMonths(chartPeriod.value);
    await loadMonthlyChart(months);
  });
}

function periodToMonths(periodText) {
  switch (periodText) {
    case "Last 6 months":
      return 6;
    case "Last 3 months":
      return 3;
    case "This year":
      return 12; // keep 12; backend gives last 12 months (good enough for your current UI)
    default:
      return 12;
  }
}

async function loadMonthlyChart(months = 12) {
  const canvas = document.getElementById("earningsChart");
  if (!canvas) return;

  const res = await fetch(`${EARNINGS_API}/monthly?months=${months}`);
  const payload = await res.json();
  if (!res.ok)
    throw new Error(payload?.error || "Failed to load monthly chart");

  const ctx = canvas.getContext("2d");
  drawEarningsChart(ctx, canvas, payload.labels || [], payload.data || []);
}

// Existing chart renderer kept (your original function)
function drawEarningsChart(ctx, canvas, months, data) {
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  const padding = 80;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  ctx.clearRect(0, 0, width, height);

  const maxValue = Math.max(...data, 0);
  const minValue = Math.min(...data, 0);
  const valueRange = Math.max(maxValue - minValue, 1);

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
    const x = padding + (chartWidth / (months.length - 1 || 1)) * i;
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
    const x = padding + (chartWidth / (data.length - 1 || 1)) * i;
    const y =
      padding + chartHeight - ((data[i] - minValue) / valueRange) * chartHeight;
    ctx.lineTo(x, y);
  }

  ctx.lineTo(width - padding, height - padding);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i < data.length; i++) {
    const x = padding + (chartWidth / (data.length - 1 || 1)) * i;
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

// ---------- Vehicle earnings list ----------
function initializeVehicleSort() {
  const sortSelect = document.getElementById("vehicleSortSelect");
  if (!sortSelect) return;

  sortSelect.addEventListener("change", sortVehicleEarnings);
}

async function loadVehicleEarnings() {
  const res = await fetch(`${EARNINGS_API}/vehicles?limit=50`);
  const payload = await res.json();
  if (!res.ok)
    throw new Error(payload?.error || "Failed to load vehicle earnings");

  const container = document.querySelector(".vehicle-earnings-list");
  if (!container) return;

  container.innerHTML = "";

  const vehicles = payload.vehicles || [];
  vehicles.forEach((v, idx) => {
    const div = document.createElement("div");
    div.className = "vehicle-earning-item";
    div.innerHTML = `
      <div class="ranking">#${idx + 1}</div>
      <div class="vehicle-info">
        <div class="vehicle-name">${escapeHtml(v.vehicleName || "Vehicle")}</div>
      </div>
      <div class="earnings-amount">
        Rs ${Number(v.earnings || 0).toLocaleString()}
      </div>
    `;
    // store for sorting
    div.dataset.earnings = String(v.earnings || 0);
    div.dataset.bookings = String(v.bookingCount || 0);
    div.dataset.name = String(v.vehicleName || "");
    container.appendChild(div);
  });

  // apply current sort if user already changed it
  sortVehicleEarnings();
}

function sortVehicleEarnings() {
  const sortValue = document.getElementById("vehicleSortSelect")?.value;
  const container = document.querySelector(".vehicle-earnings-list");
  if (!container) return;

  const items = Array.from(container.querySelectorAll(".vehicle-earning-item"));

  items.sort((a, b) => {
    const ea = Number(a.dataset.earnings || 0);
    const eb = Number(b.dataset.earnings || 0);
    const ba = Number(a.dataset.bookings || 0);
    const bb = Number(b.dataset.bookings || 0);
    const na = (a.dataset.name || "").toLowerCase();
    const nb = (b.dataset.name || "").toLowerCase();

    switch (sortValue) {
      case "Earnings (High to Low)":
        return eb - ea;
      case "Earnings (Low to High)":
        return ea - eb;
      case "Name (A-Z)":
        return na.localeCompare(nb);
      case "Bookings (Most to Least)":
        return bb - ba;
      default:
        return 0;
    }
  });

  items.forEach((item, index) => {
    item.querySelector(".ranking").textContent = `#${index + 1}`;
    container.appendChild(item);
  });
}

// ---------- Recent bookings ----------
async function loadRecentBookings() {
  const res = await fetch(`${EARNINGS_API}/recent-bookings?limit=10`);
  const payload = await res.json();
  if (!res.ok)
    throw new Error(payload?.error || "Failed to load recent bookings");

  const container = document.querySelector(".bookings-list");
  if (!container) return;

  container.innerHTML = "";

  const bookings = payload.bookings || [];
  bookings.forEach((b) => {
    const status = (b.status || "").toLowerCase();
    const uiStatus = status || "ongoing";

    const progress = buildProgress(uiStatus);

    const el = document.createElement("div");
    el.className = `booking-item ${uiStatus}`;
    el.innerHTML = `
      <div class="booking-info">
        <div class="booking-header">
          <span class="vehicle-id">Vehicle VH${String(b.vehicleId || "").padStart(3, "0")}</span>
          <span class="booking-status ${uiStatus}">${escapeHtml(uiStatus)}</span>
        </div>
        <div class="booking-details">
          <div class="booking-id">Booking ID: BK${b.bookingId}</div>
          <div class="rental-company">Rental Company: ${escapeHtml(b.companyName || "")}</div>
          <div class="customer">Customer: ${escapeHtml(b.customerName || "")}</div>
          <div class="duration">⏱️ Duration: ${Number(b.durationDays || 0)} days</div>
        </div>
      </div>

      <div class="booking-progress">
        <div class="progress-step ${progress.accepted}">● Accepted</div>
        <div class="progress-step ${progress.paid}">● Paid</div>
        <div class="progress-step ${progress.pickup}">● Pick-up</div>
        <div class="progress-step ${progress.dropoff}">Drop-off</div>
      </div>

      <div class="booking-earnings">
        <div class="fare-breakdown">
          <div class="fare-item"><span>Fare Amount</span><span>Rs ${Number(b.totalAmount || 0).toLocaleString()}</span></div>
          <div class="fare-item platform-fee"><span>Platform Fee</span><span>-Rs ${Number(b.platformFee || 0).toLocaleString()}</span></div>
          <div class="fare-item company-fee"><span>Company Fee</span><span>-Rs ${Number(b.companyFee || 0).toLocaleString()}</span></div>
          <div class="fare-item net-earnings"><span>Net Earnings</span><span>Rs ${Number(b.netEarnings || 0).toLocaleString()}</span></div>
        </div>
      </div>
    `;

    el.style.cursor = "pointer";
    el.addEventListener("click", () => viewBookingDetails(b.bookingId));
    container.appendChild(el);
  });
}

function buildProgress(status) {
  // Since DB has only a single status column, we approximate progress for UI
  // completed -> all completed
  // ongoing -> accepted/paid/pickup completed, dropoff pending
  // other -> accepted completed, rest pending
  const s = (status || "").toLowerCase();
  if (s === "completed") {
    return {
      accepted: "completed",
      paid: "completed",
      pickup: "completed",
      dropoff: "completed",
    };
  }
  if (s === "ongoing") {
    return {
      accepted: "completed",
      paid: "completed",
      pickup: "completed",
      dropoff: "pending",
    };
  }
  return {
    accepted: "completed",
    paid: "pending",
    pickup: "pending",
    dropoff: "pending",
  };
}

function viewBookingDetails(bookingId) {
  console.log(`Viewing details for booking: ${bookingId}`);
  // window.location.href = `booking-details.html?id=${bookingId}`;
}

// ---------- small util ----------
function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[m],
  );
}

// Responsive redraw (re-fetch only chart for correct sizing)
window.addEventListener("resize", function () {
  clearTimeout(window.__earningsResizeTimer);
  window.__earningsResizeTimer = setTimeout(async () => {
    const period =
      document.getElementById("chartPeriod")?.value || "Last 12 months";
    await loadMonthlyChart(periodToMonths(period));
  }, 300);
});
