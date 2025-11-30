// Dashboard JavaScript
class Dashboard {
  constructor() {
    this.init();
  }

  init() {
    this.loadDashboardData();
    this.setupEventListeners();
    this.initializeChart();
    this.startRealTimeUpdates();
  }

  loadDashboardData() {
    // Simulate loading dashboard data
    this.updateStats();
    this.loadTopCustomers();
    this.loadTopRenters();
  }

  updateStats() {
    // This would typically fetch data from an API
    const stats = {
      totalIncome: {
        value: "Rs 15,000,000",
        change: "+20.1 from Last month",
        trend: "positive",
      },
      newRentals: {
        value: "120",
        change: "+12 from yesterday",
        trend: "positive",
      },
      supportTickets: {
        value: "23",
        change: "-5 from last week",
        trend: "negative",
      },
      reports: {
        value: "42",
        label: "Available Reports",
      },
    };

    // Update the DOM with stats (already populated in HTML)
    console.log("Stats loaded:", stats);
  }

  loadTopCustomers() {
    const customers = [
      { name: "John Doe", rides: 45, rating: 4.9 },
      { name: "Sarah Wilson", rides: 38, rating: 4.8 },
      { name: "Mike Johnson", rides: 32, rating: 4.7 },
    ];

    this.updateTopList(".top-customers .top-list", customers);
  }

  loadTopRenters() {
    const renters = [
      { name: "Premium Cars", rides: 156, rating: 4.9 },
      { name: "Elite Motors", rides: 142, rating: 4.8 },
      { name: "Quick Rentals", rides: 128, rating: 4.7 },
    ];

    this.updateTopList(".top-renters .top-list", renters);
  }

  updateTopList(selector, data) {
    const container = document.querySelector(selector);
    if (!container) return;

    const items = container.querySelectorAll(".top-item");

    data.forEach((item, index) => {
      if (items[index]) {
        const nameEl = items[index].querySelector(".item-name");
        const detailEl = items[index].querySelector(".item-detail");
        const ratingEl = items[index].querySelector(
          ".item-rating span:last-child"
        );

        if (nameEl) nameEl.textContent = item.name;
        if (detailEl) detailEl.textContent = `${item.rides} rides`;
        if (ratingEl) ratingEl.textContent = item.rating;
      }
    });
  }

  setupEventListeners() {
    // Map button click
    const mapBtn = document.querySelector(".map-btn");
    if (mapBtn) {
      mapBtn.addEventListener("click", () => {
        this.loadMapView();
      });
    }

    // Stats card click events
    document.querySelectorAll(".stat-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        this.handleStatCardClick(e);
      });
    });

    // Top item click events
    document.querySelectorAll(".top-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        this.handleTopItemClick(e);
      });
    });
  }

  handleStatCardClick(e) {
    const card = e.currentTarget;
    const title = card.querySelector(".stat-title")?.textContent.toLowerCase();

    // Navigate to relevant page based on stat card
    switch (title) {
      case "total income":
        window.location.href = "earnings.html";
        break;
      case "new rental requests":
        window.location.href = "ongoing-orders.html";
        break;
      case "support tickets":
        window.location.href = "support-tickets.html";
        break;
      case "reports":
        window.location.href = "reports.html";
        break;
    }
  }

  handleTopItemClick(e) {
    const item = e.currentTarget;
    const name = item.querySelector(".item-name")?.textContent;

    // You can implement navigation to detailed view
    console.log("Clicked on:", name);
  }

  loadMapView() {
    const mapContainer = document.querySelector(".map-container");
    const placeholder = mapContainer.querySelector(".map-placeholder");
    const button = mapContainer.querySelector(".map-btn");

    if (placeholder && button) {
      button.textContent = "Loading...";
      button.disabled = true;

      // Simulate loading
      setTimeout(() => {
        placeholder.innerHTML = `
                    <div style="width: 100%; height: 100%; background: linear-gradient(135deg, #a8e6cf 0%, #7fcdcd 50%, #81c784 100%); position: relative; display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 48px;">📍</div>
                        <div style="position: absolute; top: 30%; left: 60%; font-size: 24px;">🚗</div>
                        <div style="position: absolute; bottom: 40%; right: 30%; font-size: 24px;">🚕</div>
                        <div style="text-align: center; background: rgba(255,255,255,0.9); padding: 16px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <h4 style="margin: 0 0 8px 0; color: #2e7d32;">Sri Lanka Map</h4>
                            <p style="margin: 0; font-size: 14px; color: #555;">Active vehicles and locations</p>
                        </div>
                    </div>
                `;
        button.style.display = "none";
      }, 1000);
    }
  }

  initializeChart() {
    // Simulate chart initialization
    // In a real application, you would use a charting library like Chart.js
    const chartContainer = document.querySelector(".chart-container");
    if (chartContainer) {
      setTimeout(() => {
        chartContainer.innerHTML = `
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%); border-radius: 8px;">
                        <div style="text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 16px;">📈</div>
                            <h4 style="margin: 0 0 8px 0; color: #1976d2;">Monthly Revenue Chart</h4>
                            <p style="margin: 0; color: #666; font-size: 14px;">Interactive chart would be rendered here</p>
                            <div style="margin-top: 16px; display: flex; gap: 16px; justify-content: center;">
                                <span style="color: #4caf50; font-weight: bold;">↗ +20.1%</span>
                                <span style="color: #666;">vs last month</span>
                            </div>
                        </div>
                    </div>
                `;
      }, 500);
    }
  }

  startRealTimeUpdates() {
    // Simulate real-time updates
    setInterval(() => {
      this.updateRealTimeData();
    }, 30000); // Update every 30 seconds
  }

  updateRealTimeData() {
    // Simulate updating real-time data
    const elements = {
      newRentals: document.querySelector(".stat-card:nth-child(2) .stat-value"),
      supportTickets: document.querySelector(
        ".stat-card:nth-child(3) .stat-value"
      ),
    };

    // Randomly update some values to simulate real-time changes
    if (Math.random() > 0.7) {
      if (elements.newRentals) {
        const current = parseInt(elements.newRentals.textContent);
        elements.newRentals.textContent =
          current + Math.floor(Math.random() * 3);
      }
    }

    if (Math.random() > 0.8) {
      if (elements.supportTickets) {
        const current = parseInt(elements.supportTickets.textContent);
        const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
        elements.supportTickets.textContent = Math.max(0, current + change);
      }
    }
  }

  // Utility method to format numbers
  formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
  }

  // Method to export dashboard data
  exportDashboardData() {
    const data = {
      timestamp: new Date().toISOString(),
      stats: {
        totalIncome: 15000000,
        newRentals: 120,
        supportTickets: 23,
        reports: 42,
      },
      topCustomers: [
        { name: "John Doe", rides: 45, rating: 4.9 },
        { name: "Sarah Wilson", rides: 38, rating: 4.8 },
        { name: "Mike Johnson", rides: 32, rating: 4.7 },
      ],
      topRenters: [
        { name: "Premium Cars", rides: 156, rating: 4.9 },
        { name: "Elite Motors", rides: 142, rating: 4.8 },
        { name: "Quick Rentals", rides: 128, rating: 4.7 },
      ],
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dashboard-data-${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.dashboard = new Dashboard();
});

// Global functions
window.exportDashboard = () => {
  if (window.dashboard) {
    window.dashboard.exportDashboardData();
  }
};