// Dashboard JavaScript - REAL Chart (Chart.js) + REAL Map (Leaflet)
class Dashboard {
  constructor() {
    // If your app runs under a context path (ex: /ridemachan),
    // then build API base using window.location.pathname.
    // Simple safe default: use absolute origin + known context if needed.
    // If your endpoint works already, keep it as-is:
    this.API_BASE = "/api/admin/dashboard";

    this.chart = null;
    this.map = null;
    this.cityMarkers = [];

    console.log("Dashboard initialized with API base:", this.API_BASE);
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadDashboardData();
    this.startRealTimeUpdates();
  }

  async loadDashboardData() {
    try {
      await Promise.all([
        this.updateStats(),
        this.loadTopCustomers(),
        this.loadTopRenters(),
        this.loadCompanyLocations(),
        this.loadMonthlyIncomeChart(), // NEW
      ]);

      // After locations are loaded -> render map
      this.renderSriLankaMap(); // NEW
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
          <span class="star">⭐</span>
          <span>${rating}</span>
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

  // =========================
  // REAL CHART (Chart.js)
  // =========================
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
      const data = await res.json(); // {labels:[], values:[]}

      // Destroy old chart if reloading
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
          plugins: {
            legend: { display: true },
          },
          scales: {
            y: {
              ticks: {
                callback: (v) => `Rs ${v}`,
              },
            },
          },
        },
      });
    } catch (e) {
      console.error("Chart load failed:", e);

      // Fallback message inside chart container
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

  // =========================
  // REAL MAP (Leaflet)
  // =========================
  async renderSriLankaMap() {
    const mapDiv = document.getElementById("slMap");
    if (!mapDiv) {
      console.warn("slMap div not found");
      return;
    }

    // Init map once
    if (!this.map) {
      this.map = L.map("slMap").setView([7.8731, 80.7718], 7); // Sri Lanka center
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(this.map);
    }

    // Clear old markers
    this.cityMarkers.forEach((m) => m.remove());
    this.cityMarkers = [];

    const cityCounts = (this.locationData?.cityCounts || []).filter(
      (c) => c.city,
    );

    if (cityCounts.length === 0) {
      // No data
      L.popup()
        .setLatLng([7.8731, 80.7718])
        .setContent("No company location data found.")
        .openOn(this.map);
      return;
    }

    // Geocode each city once (cache in localStorage)
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

    // Fit bounds if we have markers
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
      // Nominatim (OpenStreetMap) geocoding
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        city + ", Sri Lanka",
      )}`;

      const res = await fetch(url, {
        headers: {
          // Nominatim likes having a User-Agent (browsers set one automatically)
          Accept: "application/json",
        },
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

  setupEventListeners() {
    document.querySelectorAll(".stat-card").forEach((card, index) => {
      card.addEventListener("click", () => this.handleStatCardClick(index));
    });
  }

  handleStatCardClick(index) {
    const pages = [
      "earnings.html",
      "ongoing-orders.html",
      "support-tickets.html",
      "reports.html",
    ];
    if (pages[index]) window.location.href = pages[index];
  }

  startRealTimeUpdates() {
    setInterval(async () => {
      await this.updateStats();
      await this.loadMonthlyIncomeChart(); // keep chart fresh too
    }, 60000);
  }

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
