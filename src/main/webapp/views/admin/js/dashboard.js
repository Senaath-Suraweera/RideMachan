// Dashboard JavaScript - Admin Dashboard

class Dashboard {
  constructor() {
    this.API_BASE = "/api/admin/dashboard";
    this.chart = null;
    this.map = null;
    this.cityMarkers = [];
    this.pollTimer = null;

    console.log("Dashboard initialized with API base:", this.API_BASE);
    this.init();
  }

  init() {
    this.wireHeaderActions();
    this.updateLastModified();
    this.setupEventListeners();
    this.loadDashboardData();
    this.startRealTimeUpdates();
  }

  /* ==========================================================
     HEADER ACTIONS — Profile, Notifications, Logout
     (Matches Provider Dashboard exactly)
     ========================================================== */

  wireHeaderActions() {
    const notifBtn = document.getElementById("notifBtn");
    const notifPopover = document.getElementById("notifPopover");
    const notifCloseBtn = document.getElementById("notifCloseBtn");
    const notifBadge = document.getElementById("notifBadge");
    const notifList = document.getElementById("notifList");
    const markAllSeenBtn = document.getElementById("markAllSeenBtn");

    const profileToggle = document.getElementById("profileToggle");
    const profileDropdown = document.getElementById("profileDropdown");

    // Profile dropdown toggle
    if (profileToggle && profileDropdown) {
      profileToggle.addEventListener("click", (event) => {
        event.stopPropagation();
        profileDropdown.classList.toggle("show");
        // Close notif popover if open
        if (notifPopover) notifPopover.style.display = "none";
      });

      document.addEventListener("click", (event) => {
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

    // Logout
    const logoutLink = document.getElementById("logoutLink");
    if (logoutLink) {
      logoutLink.addEventListener("click", (event) => {
        event.preventDefault();
        this.handleLogout();
      });
    }

    // Load admin info into header
    this.loadAdminInfo();

    // --- Notification bell ---
    const self = this;

    if (notifBtn) {
      notifBtn.addEventListener("click", (ev) => {
        ev.stopPropagation();
        if (profileDropdown) profileDropdown.classList.remove("show");

        const visible = notifPopover && notifPopover.style.display === "block";
        if (visible) {
          self.closeNotifPopover();
        } else {
          self.openNotifPopover();
        }
      });
    }

    if (notifCloseBtn) {
      notifCloseBtn.addEventListener("click", () => self.closeNotifPopover());
    }

    // Close popover on outside click
    document.addEventListener("click", (ev) => {
      if (!notifPopover) return;
      if (notifPopover.style.display !== "block") return;
      if (
        notifPopover.contains(ev.target) ||
        (notifBtn && notifBtn.contains(ev.target))
      ) {
        return;
      }
      self.closeNotifPopover();
    });

    // Mark all as seen
    if (markAllSeenBtn) {
      markAllSeenBtn.addEventListener("click", async () => {
        try {
          await this.apiPost("/api/notifications/readAll");
          await this.refreshNotificationCount();
          await this.refreshNotifications();
        } catch (e) {
          console.error("Mark all as read failed:", e.message);
        }
      });
    }

    // Initial load + polling
    this.refreshNotificationCount();
    this.refreshNotifications();

    this.pollTimer = setInterval(() => {
      this.refreshNotificationCount();
      this.refreshNotifications();
    }, 30000);

    window.addEventListener("beforeunload", () => {
      if (this.pollTimer) clearInterval(this.pollTimer);
    });
  }

  openNotifPopover() {
    const popover = document.getElementById("notifPopover");
    if (!popover) return;
    popover.style.display = "block";
    this.refreshNotifications();
    this.refreshNotificationCount();
  }

  closeNotifPopover() {
    const popover = document.getElementById("notifPopover");
    if (!popover) return;
    popover.style.display = "none";
  }

  async refreshNotificationCount() {
    const notifBadge = document.getElementById("notifBadge");
    try {
      const data = await this.apiGet("/api/notifications/count");
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

  async refreshNotifications() {
    const notifList = document.getElementById("notifList");
    try {
      const data = await this.apiGet("/api/notifications?limit=10&offset=0");
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
          const meta = this.formatNotificationMeta(n);

          const div = document.createElement("div");
          div.className = `notif-item ${!n.isRead ? "unseen" : ""}`;
          div.innerHTML = `
            <div class="notif-title">${this.escapeHtml(n.title || "Notification")}</div>
            <div class="notif-msg">${this.escapeHtml(n.body || "")}</div>
            <div class="notif-meta">
              <span>${this.escapeHtml(meta.left || "")}</span>
              <span>${this.escapeHtml(meta.right || "")}</span>
            </div>
          `;

          div.addEventListener("click", async () => {
            try {
              if (!n.isRead) {
                await this.apiPost(
                  `/api/notifications/read?id=${encodeURIComponent(n.notificationId)}`,
                );
              }
              await this.refreshNotificationCount();
              await this.refreshNotifications();
              this.redirectFromNotification(n);
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

  formatNotificationMeta(n) {
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

  redirectFromNotification(n) {
    const refType = (n.referenceType || "").toUpperCase();
    const refId = n.referenceId;

    if (!refType || refId === null || refId === undefined) return;

    switch (refType) {
      case "PROVIDER_REQUEST":
        window.location.href = `rental-company-requests.html?requestId=${encodeURIComponent(refId)}`;
        break;
      case "BOOKING":
        window.location.href = `bookings.html?bookingId=${encodeURIComponent(refId)}`;
        break;
      case "TICKET":
        window.location.href = `support-ticket-view.html?ticketId=${encodeURIComponent(refId)}`;
        break;
      case "REPORT":
        window.location.href = `report-view.html?reportId=${encodeURIComponent(refId)}`;
        break;
      default:
        break;
    }
  }

  /* Load admin name/initial into the header */
  loadAdminInfo() {
    const userNameEl = document.getElementById("userName");
    const profileInitialEl = document.getElementById("profileInitial");

    fetch("/api/admin/profile", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    })
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

  handleLogout() {
    if (confirm("Are you sure you want to logout?")) {
      fetch("/admin/logout", {
        method: "GET",
        credentials: "include",
      })
        .then((response) => {
          if (response.redirected) {
            window.location.href = response.url;
          } else {
            window.location.href = "login.html";
          }
        })
        .catch((error) => {
          console.error("Logout failed:", error);
          window.location.href = "login.html";
        });
    }
  }

  updateLastModified() {
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

  /* ==========================================================
     API helpers (match provider pattern)
     ========================================================== */

  async apiGet(url) {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(txt || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async apiPost(url, body = null) {
    const options = { method: "POST", credentials: "include" };
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

  async loadDashboardData() {
    try {
      await Promise.all([
        this.updateStats(),
        this.loadTopCustomers(),
        this.loadTopRenters(),
        this.loadCompanyLocations(),
        this.loadMonthlyIncomeChart(),
      ]);

      this.renderSriLankaMap();
      console.log("All dashboard data loaded successfully");
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      this.showError("Failed to load dashboard data. Please refresh the page.");
    }
  }

  async updateStats() {
    try {
      const response = await fetch(`${this.API_BASE}/stats`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "login.html";
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      this.updateStatCard(0, {
        value: `Rs ${this.formatCurrency(data.thisMonthIncome)}`,
        change: `${data.monthChangePct >= 0 ? "+" : ""}${data.monthChangePct.toFixed(1)}% from Last month`,
        trend: data.monthChangePct >= 0 ? "positive" : "negative",
      });

      this.updateStatCard(1, {
        value: String(data.newRentalRequests),
        change: "Pending approval",
        trend: "positive",
      });

      this.updateStatCard(2, {
        value: String(data.supportTickets),
        change: "Open or In Progress",
        trend: "negative",
      });

      this.updateStatCard(3, {
        value: String(data.reports),
        label: "Pending Reports",
      });
    } catch (error) {
      console.error("Error updating stats:", error);
      this.showError("Failed to load statistics");
    }
  }

  updateStatCard(index, data) {
    const cards = document.querySelectorAll(".stat-card");
    if (!cards[index]) return;

    const card = cards[index];
    const valueEl = card.querySelector(".stat-value");
    const changeEl = card.querySelector(".stat-change");
    const labelEl = card.querySelector(".stat-label");

    if (valueEl && data.value != null) valueEl.textContent = data.value;

    if (changeEl && data.change) {
      changeEl.textContent = data.change;
      if (data.trend) changeEl.className = `stat-change ${data.trend}`;
    }

    if (labelEl && data.label) labelEl.textContent = data.label;
  }

  async loadTopCustomers() {
    try {
      const response = await fetch(`${this.API_BASE}/top-customers?limit=3`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.customers && data.customers.length > 0) {
        this.updateTopList(
          ".top-customers .top-list",
          data.customers,
          "customer",
        );
      } else {
        this.showEmptyState(
          ".top-customers .top-list",
          "No customer data available",
        );
      }
    } catch (error) {
      console.error("Error loading top customers:", error);
      this.showEmptyState(
        ".top-customers .top-list",
        "Failed to load customers",
      );
    }
  }

  async loadTopRenters() {
    try {
      const response = await fetch(`${this.API_BASE}/top-renters?limit=3`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      if (data.renters && data.renters.length > 0) {
        this.updateTopList(".top-renters .top-list", data.renters, "renter");
      } else {
        this.showEmptyState(
          ".top-renters .top-list",
          "No rental company data available",
        );
      }
    } catch (error) {
      console.error("Error loading top renters:", error);
      this.showEmptyState(
        ".top-renters .top-list",
        "Failed to load rental companies",
      );
    }
  }

  async loadCompanyLocations() {
    try {
      const response = await fetch(`${this.API_BASE}/company-locations`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      this.locationData = data;
    } catch (error) {
      console.error("Error loading company locations:", error);
      this.locationData = { cityCounts: [], companies: [] };
    }
  }

  updateTopList(selector, data, type) {
    const container = document.querySelector(selector);
    if (!container) return;
    container.innerHTML = "";

    data.forEach((item) => {
      const topItem = document.createElement("div");
      topItem.className = "top-item";

      let name = "Unknown";
      let detail = "";
      let rating = "—";

      if (type === "customer") {
        name = item.name || "Unknown Customer";
        detail = `${item.bookings} booking${item.bookings !== 1 ? "s" : ""} • Rs ${this.formatCurrency(item.totalSpent)}`;
      } else {
        name = item.companyName || "Unknown Company";
        detail = `${item.bookings} booking${item.bookings !== 1 ? "s" : ""} • Rs ${this.formatCurrency(item.totalRevenue)}`;
      }

      topItem.innerHTML = `
        <div class="avatar"></div>
        <div class="item-info">
          <div class="item-name">${this.escapeHtml(name)}</div>
          <div class="item-detail">${detail}</div>
        </div>
        <div class="item-rating">
          <span class="star"><i class="fa-solid fa-star"></i></span>
        </div>
      `;

      container.appendChild(topItem);
    });
  }

  showEmptyState(selector, message) {
    const container = document.querySelector(selector);
    if (!container) return;

    container.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #999;">
        <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
        <p style="margin: 0; font-size: 14px;">${message}</p>
      </div>
    `;
  }

  /* =========================
     CHART (Chart.js)
     ========================= */
  async loadMonthlyIncomeChart() {
    const canvas = document.getElementById("monthlyIncomeChart");
    if (!canvas) {
      console.warn("monthlyIncomeChart canvas not found");
      return;
    }

    try {
      const res = await fetch(`${this.API_BASE}/monthly-income?months=6`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error(`Chart API error ${res.status}`);
      const data = await res.json();

      if (this.chart) this.chart.destroy();

      this.chart = new Chart(canvas, {
        type: "line",
        data: {
          labels: data.labels || [],
          datasets: [
            {
              label: "Platform Income (Rs)",
              data: data.values || [],
              tension: 0.3,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: true } },
          scales: {
            y: {
              ticks: { callback: (v) => `Rs ${v}` },
            },
          },
        },
      });
    } catch (e) {
      console.error("Chart load failed:", e);
      const chartContainer = document.querySelector(".chart-container");
      if (chartContainer) {
        chartContainer.innerHTML = `
          <div style="text-align:center;padding:20px;color:#999;">
            <div style="font-size:40px;margin-bottom:10px;">⚠️</div>
            <div>Chart failed to load</div>
            <div style="font-size:12px;margin-top:6px;">Check /monthly-income endpoint + Chart.js script</div>
          </div>
        `;
      }
    }
  }

  /* =========================
     MAP (Leaflet)
     ========================= */
  async renderSriLankaMap() {
    const mapDiv = document.getElementById("slMap");
    if (!mapDiv) {
      console.warn("slMap div not found");
      return;
    }

    if (!this.map) {
      this.map = L.map("slMap").setView([7.8731, 80.7718], 7);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(this.map);
    }

    this.cityMarkers.forEach((m) => m.remove());
    this.cityMarkers = [];

    const cityCounts = (this.locationData?.cityCounts || []).filter(
      (c) => c.city,
    );

    if (cityCounts.length === 0) {
      L.popup()
        .setLatLng([7.8731, 80.7718])
        .setContent("No company location data found.")
        .openOn(this.map);
      return;
    }

    for (const c of cityCounts) {
      const city = String(c.city).trim();
      const count = Number(c.count || 0);
      const coords = await this.geocodeCity(city);
      if (!coords) continue;

      const marker = L.circleMarker([coords.lat, coords.lng], {
        radius: Math.min(18, 6 + count * 2),
      }).addTo(this.map);

      marker.bindPopup(
        `<b>${this.escapeHtml(city)}</b><br/>Companies: ${count}`,
      );
      this.cityMarkers.push(marker);
    }

    if (this.cityMarkers.length > 0) {
      const group = L.featureGroup(this.cityMarkers);
      this.map.fitBounds(group.getBounds().pad(0.3));
    }
  }

  async geocodeCity(city) {
    const key = `geo_city_${city.toLowerCase()}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) {}
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city + ", Sri Lanka")}`;
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      const arr = await res.json();
      if (!arr || arr.length === 0) return null;

      const lat = parseFloat(arr[0].lat);
      const lng = parseFloat(arr[0].lon);
      const coords = { lat, lng };
      localStorage.setItem(key, JSON.stringify(coords));
      return coords;
    } catch (e) {
      console.warn("Geocode failed for city:", city, e);
      return null;
    }
  }

  /* =========================
     Event Listeners & Navigation
     ========================= */
  setupEventListeners() {
    document.querySelectorAll(".stat-card").forEach((card, index) => {
      card.addEventListener("click", () => this.handleStatCardClick(index));
    });
  }

  handleStatCardClick(index) {
    const pages = [
      "earnings.html",
      "rental-company-requests.html",
      "support-ticket-view.html",
      "report-view.html",
    ];
    if (pages[index]) window.location.href = pages[index];
  }

  startRealTimeUpdates() {
    setInterval(async () => {
      await this.updateStats();
      await this.loadMonthlyIncomeChart();
    }, 60000);
  }

  /* =========================
     Utilities
     ========================= */
  formatCurrency(amount) {
    amount = typeof amount === "number" ? amount : parseFloat(amount) || 0;
    if (amount >= 10000000) return (amount / 10000000).toFixed(2) + "Cr";
    if (amount >= 100000) return (amount / 100000).toFixed(2) + "L";
    if (amount >= 1000) return (amount / 1000).toFixed(2) + "K";
    return amount.toFixed(2);
  }

  escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
      position: fixed; top: 20px; right: 20px;
      background: #f44336; color: white;
      padding: 16px 24px; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000; font-weight: 500;
    `;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new Dashboard();
});
