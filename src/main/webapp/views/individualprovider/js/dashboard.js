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
      const pct = Number(data.incomeChangePct || 0).toFixed(1);
      statChanges[0].textContent = `${pct >= 0 ? "+" : ""} ${pct}%`;
      statChanges[0].className = `stat-change ${pct >= 0 ? "positive" : "negative"}`;
    }

    if (statChanges[3]) {
      statChanges[3].textContent = "Pending";
      statChanges[3].className = "stat-change pending";
    }
  } catch (e) {
    console.error("Summary load failed:", e.message);
  }
}

async function loadMonthlyIncome(baseUrl, providerId) {
  const url = `${baseUrl}/monthly-income?months=12${providerId ? `&providerId=${providerId}` : ""}`;

  try {
    const data = await apiGet(url);
    const points = data.points || [];

    const months = points.map((p) => p.label);
    const income = points.map((p) => Number(p.income || 0));

    const canvas = document.getElementById("incomeChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    drawIncomeChart(ctx, canvas, months, income);
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
    (data.vehicles || []).forEach((v) => {
      const div = document.createElement("div");
      div.className = "vehicle-item";
      div.innerHTML = `
        <div class="vehicle-info">
          <span class="vehicle-icon"></span>
          <div>
            <div class="vehicle-name">${escapeHtml(v.name || "")}</div>
            <div class="vehicle-id">${escapeHtml(v.plate || "")}</div>
          </div>
        </div>
        <span class="status-badge status-maintenance">${escapeHtml(v.serviceType || "Maintenance")}</span>
        <span class="eta">ETA: ${Number(v.etaHours || 0)} hours</span>
      `;
      maintenanceCard.appendChild(div);
    });
  } catch (e) {
    console.error("Maintenance load failed:", e.message);
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
    (data.vehicles || []).forEach((v) => {
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
function drawIncomeChart(ctx, canvas, months, data) {
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  const padding = 60;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  ctx.clearRect(0, 0, width, height);

  if (!data || data.length === 0) {
    ctx.font = '14px "Poppins", sans-serif';
    ctx.fillStyle = "#718096";
    ctx.fillText("No income data", padding, padding);
    return;
  }

  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const valueRange = Math.max(1, maxValue - minValue);

  ctx.strokeStyle = "#e9ecef";
  ctx.lineWidth = 1;
  ctx.font = '12px "Poppins", sans-serif';
  ctx.fillStyle = "#718096";

  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    const value = maxValue - (valueRange / 5) * i;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.fillText(`Rs ${(value / 1000).toFixed(0)}k`, 10, y + 4);
  }

  for (let i = 0; i < months.length; i++) {
    const x = padding + (chartWidth / Math.max(1, months.length - 1)) * i;
    ctx.fillText(months[i], x - 15, height - 20);
  }

  ctx.strokeStyle = "#4361ee";
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let i = 0; i < data.length; i++) {
    const x = padding + (chartWidth / Math.max(1, data.length - 1)) * i;
    const y =
      padding + chartHeight - ((data[i] - minValue) / valueRange) * chartHeight;

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    ctx.fillStyle = "#3a0ca3";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.strokeStyle = "#4361ee";
  ctx.stroke();
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
