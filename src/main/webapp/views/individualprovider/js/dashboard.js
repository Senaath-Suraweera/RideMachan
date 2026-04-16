document.addEventListener("DOMContentLoaded", function () {
  const providerId = sessionStorage.getItem("providerId"); // used for dashboard/profile endpoints
  const baseUrl = "http://localhost:8080/api/provider/dashboard";

  loadSummary(baseUrl, providerId);
  loadMonthlyIncome(baseUrl, providerId);
  loadSessions(baseUrl, providerId);
  loadMaintenance(baseUrl, providerId);
  loadAvailable(baseUrl, providerId);

  wireHeaderActions(providerId);
  updateLastModified();
});

async function apiGet(url) {
  const res = await fetch(url, {
    credentials: "include",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }

  return res.json();
}

async function apiPut(url, body) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body ?? {}),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }

  return res.json().catch(() => ({}));
}

async function apiPost(url, body = null) {
  const options = {
    method: "POST",
    credentials: "include",
  };

  if (body !== null) {
    options.headers = { "Content-Type": "application/json" };
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }

  return res.json().catch(() => ({}));
}

function formatLKR(amount) {
  const n = Number(amount || 0);
  return `Rs ${Math.round(n).toLocaleString()}`;
}

/* =========================
   Header actions — profile & notifications
========================= */
function wireHeaderActions(providerId) {
  const notifBtn = document.getElementById("notifBtn");
  const notifPopover = document.getElementById("notifPopover");
  const notifCloseBtn = document.getElementById("notifCloseBtn");
  const notifBadge = document.getElementById("notifBadge");
  const notifList = document.getElementById("notifList");
  const markAllSeenBtn = document.getElementById("markAllSeenBtn");

  const profileToggle = document.getElementById("profileToggle");
  const profileDropdown = document.getElementById("profileDropdown");

  if (profileToggle && profileDropdown) {
    profileToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      profileDropdown.classList.toggle("show");
    });

    document.addEventListener("click", function (event) {
      if (
        profileToggle &&
        !profileToggle.contains(event.target) &&
        profileDropdown &&
        !profileDropdown.contains(event.target)
      ) {
        profileDropdown.classList.remove("show");
      }
    });
  }

  const logoutLink = document.getElementById("logoutLink");
  if (logoutLink) {
    logoutLink.addEventListener("click", function (event) {
      event.preventDefault();
      handleLogout();
    });
  }

  loadProviderInfo(providerId);

  let pollTimer = null;

  async function refreshNotificationCount() {
    try {
      const data = await apiGet(
        "http://localhost:8080/api/notifications/count",
      );
      const count = Number(data.count || 0);

      if (notifBadge) {
        if (count > 0) {
          notifBadge.style.display = "flex";
          notifBadge.textContent = String(count);
        } else {
          notifBadge.style.display = "none";
          notifBadge.textContent = "0";
        }
      }
    } catch (e) {
      console.error("Notification count load failed:", e.message);
    }
  }

  function formatNotificationMeta(n) {
    const createdAt = n.createdAt ? new Date(n.createdAt) : null;

    let dateText = "";
    if (createdAt && !Number.isNaN(createdAt.getTime())) {
      dateText = createdAt.toLocaleString();
    } else {
      dateText = n.createdAt || "";
    }

    const refType = n.referenceType || "";
    const refId =
      n.referenceId !== null && n.referenceId !== undefined
        ? String(n.referenceId)
        : "";

    if (refType && refId) {
      return { left: dateText, right: `${refType} #${refId}` };
    }

    if (refType) {
      return { left: dateText, right: refType };
    }

    return { left: dateText, right: n.type || "" };
  }

  function redirectFromNotification(n) {
    const refType = (n.referenceType || "").toUpperCase();
    const refId = n.referenceId;

    if (!refType || refId === null || refId === undefined) return;

    switch (refType) {
      case "PROVIDER_REQUEST":
        window.location.href = `./provider-requests.html?requestId=${encodeURIComponent(refId)}`;
        break;
      case "BOOKING":
        window.location.href = `./bookings.html?bookingId=${encodeURIComponent(refId)}`;
        break;
      case "TICKET":
        window.location.href = `./support.html?ticketId=${encodeURIComponent(refId)}`;
        break;
      case "REPORT":
        window.location.href = `./reports.html?reportId=${encodeURIComponent(refId)}`;
        break;
      default:
        // stay on page if no target screen exists yet
        break;
    }
  }

  async function markNotificationRead(notificationId) {
    await apiPost(
      `http://localhost:8080/api/notifications/read?id=${encodeURIComponent(notificationId)}`,
    );
  }

  async function refreshNotifications() {
    try {
      const data = await apiGet(
        "http://localhost:8080/api/notifications?limit=10&offset=0",
      );

      const items = data.notifications || [];

      if (notifList) {
        notifList.innerHTML = "";

        if (items.length === 0) {
          notifList.innerHTML = `
            <div class="notif-item">
              <div class="notif-title">No notifications</div>
              <div class="notif-msg">You're all caught up.</div>
            </div>
          `;
          return;
        }

        items.forEach((n) => {
          const meta = formatNotificationMeta(n);

          const div = document.createElement("div");
          div.className = `notif-item ${!n.isRead ? "unseen" : ""}`;
          div.innerHTML = `
            <div class="notif-title">${escapeHtml(n.title || "Notification")}</div>
            <div class="notif-msg">${escapeHtml(n.body || "")}</div>
            <div class="notif-meta">
              <span>${escapeHtml(meta.left || "")}</span>
              <span>${escapeHtml(meta.right || "")}</span>
            </div>
          `;

          div.addEventListener("click", async () => {
            try {
              if (!n.isRead) {
                await markNotificationRead(n.notificationId);
              }

              await refreshNotificationCount();
              await refreshNotifications();

              redirectFromNotification(n);
            } catch (e) {
              console.error("Notification click failed:", e.message);
            }
          });

          notifList.appendChild(div);
        });
      }
    } catch (e) {
      console.error("Notifications load failed:", e.message);
    }
  }

  function openPopover() {
    if (!notifPopover) return;
    notifPopover.style.display = "block";
    refreshNotifications();
    refreshNotificationCount();
  }

  function closePopover() {
    if (!notifPopover) return;
    notifPopover.style.display = "none";
  }

  if (notifBtn) {
    notifBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();

      if (profileDropdown) profileDropdown.classList.remove("show");

      const visible = notifPopover && notifPopover.style.display === "block";
      if (visible) closePopover();
      else openPopover();
    });
  }

  if (notifCloseBtn) {
    notifCloseBtn.addEventListener("click", closePopover);
  }

  document.addEventListener("click", (ev) => {
    if (!notifPopover) return;
    if (notifPopover.style.display !== "block") return;
    if (
      notifPopover.contains(ev.target) ||
      (notifBtn && notifBtn.contains(ev.target))
    ) {
      return;
    }
    closePopover();
  });

  if (markAllSeenBtn) {
    markAllSeenBtn.addEventListener("click", async () => {
      try {
        await apiPost("http://localhost:8080/api/notifications/readAll");
        await refreshNotificationCount();
        await refreshNotifications();
      } catch (e) {
        console.error("Mark all as read failed:", e.message);
      }
    });
  }

  refreshNotificationCount();
  refreshNotifications();

  pollTimer = setInterval(() => {
    refreshNotificationCount();
    refreshNotifications();
  }, 30000);

  window.addEventListener("beforeunload", () => {
    if (pollTimer) clearInterval(pollTimer);
  });
}

/* Load provider name/initial into the header */
function loadProviderInfo(providerId) {
  const userNameEl = document.getElementById("userName");
  const profileInitialEl = document.getElementById("profileInitial");

  if (providerId) {
    const url = `http://localhost:8080/api/provider/profile?providerId=${encodeURIComponent(providerId)}`;
    fetch(url, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.firstName) {
          const firstName = data.firstName;
          if (userNameEl) userNameEl.textContent = firstName;
          if (profileInitialEl) {
            profileInitialEl.textContent = firstName.charAt(0).toUpperCase();
          }
        }
      })
      .catch(() => {
        // keep defaults
      });
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    fetch("/provider/logout", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => {
        if (response.redirected) {
          window.location.href = response.url;
        } else {
          window.location.href = "/views/landing/index.html";
        }
      })
      .catch((error) => {
        console.error("Logout failed:", error);
        window.location.href = "/views/landing/index.html";
      });
  }
}

/* =========================
   Dashboard data loaders
========================= */

async function loadSummary(baseUrl, providerId) {
  const url = `${baseUrl}/summary${providerId ? `?providerId=${providerId}` : ""}`;

  try {
    const data = await apiGet(url);

    const statValues = document.querySelectorAll(".stat-card .stat-value");
    const statChanges = document.querySelectorAll(".stat-card .stat-change");

    statValues[0].textContent = formatLKR(data.totalIncome);
    statValues[1].textContent = `${Number(data.acceptanceRate || 0).toFixed(1)}%`;
    statValues[2].textContent = `${data.totalBookings || 0}`;
    statValues[3].textContent = formatLKR(data.pendingPayout);

    if (statChanges[0]) {
      const pctNum = Number(data.incomeChangePct || 0);
      const pctText = pctNum.toFixed(1);
      statChanges[0].textContent = `${pctNum >= 0 ? "+" : ""}${pctText}%`;
      statChanges[0].className = `stat-change ${pctNum >= 0 ? "positive" : "negative"}`;
    }

    if (statChanges[3]) {
      statChanges[3].textContent = "Pending";
      statChanges[3].className = "stat-change pending";
    }
  } catch (e) {
    console.error("Summary load failed:", e.message);
  }
}

let __lastChart = null; // { months, income } — used for resize redraws

async function loadMonthlyIncome(baseUrl, providerId) {
  const url = `${baseUrl}/monthly-income?months=12${providerId ? `&providerId=${providerId}` : ""}`;

  try {
    const data = await apiGet(url);
    const points = data.points || [];

    const months = points.map((p) => p.label);
    const income = points.map((p) => Number(p.income || 0));

    __lastChart = { months, income };

    const canvas = document.getElementById("incomeChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    drawIncomeChart(ctx, canvas, months, income);

    // Redraw on resize (debounced) so the chart stays crisp.
    if (!window.__chartResizeWired) {
      window.__chartResizeWired = true;
      let t = null;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          if (!__lastChart) return;
          const c = document.getElementById("incomeChart");
          if (!c) return;
          drawIncomeChart(
            c.getContext("2d"),
            c,
            __lastChart.months,
            __lastChart.income,
          );
        }, 120);
      });
    }
  } catch (e) {
    console.error("Monthly income load failed:", e.message);
  }
}

async function loadSessions(baseUrl, providerId) {
  const url = `${baseUrl}/sessions?limit=8${providerId ? `&providerId=${providerId}` : ""}`;

  try {
    const data = await apiGet(url);

    const list = document.querySelector(".sessions-list");
    const total = document.querySelector(".total-sessions strong");

    if (list) {
      list.innerHTML = "";
      (data.locations || []).forEach((row) => {
        const item = document.createElement("div");
        item.className = "session-item";
        item.innerHTML = `
          <span class="district-dot"></span>
          <span class="district-name">${escapeHtml(row.location || "Unknown")}</span>
          <span class="session-count">${row.sessions || 0} sessions</span>
        `;
        list.appendChild(item);
      });
    }

    if (total) {
      total.textContent = `Total Sessions: ${data.totalSessions || 0}`;
    }
  } catch (e) {
    console.error("Sessions load failed:", e.message);
  }
}

async function loadMaintenance(baseUrl, providerId) {
  const url = `${baseUrl}/vehicles/maintenance?limit=6${providerId ? `&providerId=${providerId}` : ""}`;

  try {
    const data = await apiGet(url);
    const maintenanceCard = document.querySelector(
      ".maintenance-section .vehicle-list",
    );
    if (!maintenanceCard) return;

    maintenanceCard.innerHTML = "";

    const vehicles = data.vehicles || [];
    if (vehicles.length === 0) {
      maintenanceCard.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-wrench"></i>
          <div class="empty-title">No vehicles in maintenance</div>
          <div class="empty-msg">All your vehicles are road-ready.</div>
        </div>
      `;
      return;
    }

    vehicles.forEach((v) => {
      const div = document.createElement("div");
      div.className = "vehicle-item";
      const locationLine = v.location ? ` • ${escapeHtml(v.location)}` : "";
      div.innerHTML = `
        <div class="vehicle-info">
          <span class="vehicle-icon"></span>
          <div>
            <div class="vehicle-name">${escapeHtml(v.name || "")}</div>
            <div class="vehicle-id">${escapeHtml(v.plate || "")}${locationLine}</div>
          </div>
        </div>
        <span class="status-badge status-maintenance">${escapeHtml(v.serviceType || "Maintenance")}</span>
      `;
      maintenanceCard.appendChild(div);
    });
  } catch (e) {
    console.error("Maintenance load failed:", e.message);
    const maintenanceCard = document.querySelector(
      ".maintenance-section .vehicle-list",
    );
    if (maintenanceCard) {
      maintenanceCard.innerHTML = `
        <div class="empty-state error">
          <i class="fas fa-triangle-exclamation"></i>
          <div class="empty-title">Couldn't load maintenance list</div>
          <div class="empty-msg">${escapeHtml(e.message || "Please try again.")}</div>
        </div>
      `;
    }
  }
}

async function loadAvailable(baseUrl, providerId) {
  const url = `${baseUrl}/vehicles/available?limit=6${providerId ? `&providerId=${providerId}` : ""}`;

  try {
    const data = await apiGet(url);
    const availableCard = document.querySelector(
      ".available-section .vehicle-list",
    );
    if (!availableCard) return;

    availableCard.innerHTML = "";

    const vehicles = data.vehicles || [];
    if (vehicles.length === 0) {
      availableCard.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-car-side"></i>
          <div class="empty-title">No vehicles available</div>
          <div class="empty-msg">Add a vehicle or mark one as available.</div>
        </div>
      `;
      return;
    }

    vehicles.forEach((v) => {
      const div = document.createElement("div");
      div.className = "vehicle-item";
      div.innerHTML = `
        <div class="vehicle-info">
          <span class="vehicle-icon"></span>
          <div>
            <div class="vehicle-name">${escapeHtml(v.name || "")}</div>
            <div class="vehicle-id">${escapeHtml(v.plate || "")} • ${escapeHtml(v.location || "")}</div>
          </div>
        </div>
        <span class="status-badge status-active">Available</span>
        <span class="price">Rs ${Math.round(Number(v.pricePerDay || 0)).toLocaleString()}/day</span>
      `;
      availableCard.appendChild(div);
    });
  } catch (e) {
    console.error("Available vehicles load failed:", e.message);
  }
}

// --- chart ---
// Smooth area chart with gradient fill, niceified y-axis, and hover tooltip.
function drawIncomeChart(ctx, canvas, months, data) {
  // --- HiDPI setup ---
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.offsetWidth;
  const cssHeight = canvas.offsetHeight;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const width = cssWidth;
  const height = cssHeight;

  const padLeft = 64;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 36;
  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  ctx.clearRect(0, 0, width, height);

  if (!data || data.length === 0) {
    ctx.font = '14px "Poppins", sans-serif';
    ctx.fillStyle = "#a0aec0";
    ctx.textAlign = "center";
    ctx.fillText("No income data yet", width / 2, height / 2);
    return;
  }

  // --- Nice y-axis bounds (round to sensible step) ---
  const rawMax = Math.max(...data, 1);
  const niceMax = niceCeil(rawMax);
  const tickCount = 5;
  const step = niceMax / tickCount;

  const xFor = (i) => padLeft + (chartW / Math.max(1, data.length - 1)) * i;
  const yFor = (v) => padTop + chartH - (v / niceMax) * chartH;

  // --- Gridlines + y labels ---
  ctx.font = '11px "Poppins", sans-serif';
  ctx.fillStyle = "#a0aec0";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(203, 213, 225, 0.5)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= tickCount; i++) {
    const y = padTop + (chartH / tickCount) * i;
    const value = niceMax - step * i;

    ctx.beginPath();
    ctx.setLineDash(i === tickCount ? [] : [3, 4]);
    ctx.moveTo(padLeft, y);
    ctx.lineTo(width - padRight, y);
    ctx.stroke();

    ctx.fillText(formatAxis(value), padLeft - 10, y);
  }
  ctx.setLineDash([]);

  // --- X labels ---
  ctx.fillStyle = "#718096";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (let i = 0; i < months.length; i++) {
    ctx.fillText(months[i], xFor(i), padTop + chartH + 10);
  }

  // --- Build smooth path once, reuse for fill + stroke ---
  const points = data.map((v, i) => ({ x: xFor(i), y: yFor(v) }));
  const linePath = buildSmoothPath(points);

  // --- Gradient area fill ---
  const areaPath = new Path2D(linePath);
  areaPath.lineTo(points[points.length - 1].x, padTop + chartH);
  areaPath.lineTo(points[0].x, padTop + chartH);
  areaPath.closePath();

  const gradient = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
  gradient.addColorStop(0, "rgba(67, 97, 238, 0.35)");
  gradient.addColorStop(1, "rgba(67, 97, 238, 0.02)");
  ctx.fillStyle = gradient;
  ctx.fill(areaPath);

  // --- Line stroke ---
  const strokePath = new Path2D(linePath);
  ctx.strokeStyle = "#4361ee";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(strokePath);

  // --- Points on top ---
  for (const p of points) {
    ctx.beginPath();
    ctx.fillStyle = "#ffffff";
    ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "#3a0ca3";
    ctx.arc(p.x, p.y, 2.75, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- Wire hover tooltip (once) ---
  attachChartHover(canvas, points, data, months, {
    padLeft,
    padTop,
    chartH,
  });
}

// Catmull-Rom -> Bezier smoothing. Gives a clean curve without overshoot.
function buildSmoothPath(pts) {
  if (pts.length === 0) return "";
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;

  let d = `M ${pts[0].x} ${pts[0].y}`;
  const tension = 0.5; // 0 = straight lines, 1 = very loose
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension * 2;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension * 2;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension * 2;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension * 2;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function niceCeil(v) {
  if (v <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / exp;
  let niceN;
  if (n <= 1) niceN = 1;
  else if (n <= 2) niceN = 2;
  else if (n <= 2.5) niceN = 2.5;
  else if (n <= 5) niceN = 5;
  else niceN = 10;
  return niceN * exp;
}

function formatAxis(v) {
  if (v >= 1_000_000) return `Rs ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `Rs ${Math.round(v / 1000)}k`;
  return `Rs ${Math.round(v)}`;
}

// Lightweight hover tooltip — renders into an absolutely-positioned div
// that sits on top of the canvas. Created once per canvas.
function attachChartHover(canvas, points, data, months, metrics) {
  const parent = canvas.parentElement;
  if (!parent) return;
  if (getComputedStyle(parent).position === "static") {
    parent.style.position = "relative";
  }

  let tooltip = parent.querySelector(".chart-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip";
    parent.appendChild(tooltip);
  }

  let marker = parent.querySelector(".chart-marker");
  if (!marker) {
    marker = document.createElement("div");
    marker.className = "chart-marker";
    parent.appendChild(marker);
  }

  // Replace existing handlers so redraws don't stack listeners.
  canvas.onmousemove = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // find nearest point by x
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const d = Math.abs(points[i].x - x);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    }

    const p = points[best];
    tooltip.style.display = "block";
    tooltip.innerHTML = `
      <div class="chart-tooltip-label">${months[best] ?? ""}</div>
      <div class="chart-tooltip-value">Rs ${Math.round(data[best]).toLocaleString()}</div>
    `;

    // position tooltip above the point, keep inside parent bounds
    const tipRect = tooltip.getBoundingClientRect();
    const tipW = tipRect.width || 120;
    let left = p.x - tipW / 2;
    left = Math.max(6, Math.min(canvas.offsetWidth - tipW - 6, left));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${Math.max(0, p.y - tipRect.height - 12)}px`;

    marker.style.display = "block";
    marker.style.left = `${p.x}px`;
    marker.style.top = `${metrics.padTop}px`;
    marker.style.height = `${metrics.chartH}px`;
  };

  canvas.onmouseleave = () => {
    tooltip.style.display = "none";
    marker.style.display = "none";
  };
}

function updateLastModified() {
  const timestamp = document.querySelector(".last-updated");
  if (timestamp) {
    const now = new Date();
    const formatted = now.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
    timestamp.textContent = `Last updated: ${formatted}`;
  }
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
