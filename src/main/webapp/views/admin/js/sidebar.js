// Sidebar Navigation JavaScript (theme-aligned logout block)
class SidebarManager {
  constructor() {
    this.sidebar = null;
    this.toggleBtn = null;
    this.overlay = null;
    this.activeLink = null;
    this.init();
  }

  init() {
    this.createSidebar();
    this.setupEventListeners();
    this.setActiveNavigation();
  }

  createSidebar() {
    const sidebarHTML = `
      <div class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <div class="logo-icon"></div>
          </div>
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section">
            <h3 class="nav-section-title">General</h3>
            <ul class="nav-menu">
              <li class="nav-item"><a href="dashboard.html" class="nav-link" data-page="dashboard"><span class="nav-icon dashboard"></span>Dashboard</a></li>
              <li class="nav-item"><a href="earnings.html" class="nav-link" data-page="earnings"><span class="nav-icon earnings"></span>Earnings</a></li>
              <li class="nav-item"><a href="promotions.html" class="nav-link" data-page="promotions"><span class="nav-icon promotions"></span>Promotions</a></li>
            </ul>
          </div>
          <div class="nav-section">
            <h3 class="nav-section-title">Users</h3>
            <ul class="nav-menu">
              <li class="nav-item"><a href="admins.html" class="nav-link" data-page="admins"><span class="nav-icon admins"></span>Admins</a></li>
              <li class="nav-item"><a href="individual-renters.html" class="nav-link" data-page="individual-renters"><span class="nav-icon individual-renters"></span>Individual Providers</a></li>
              <li class="nav-item"><a href="customers.html" class="nav-link" data-page="customers"><span class="nav-icon customers"></span>Customers</a></li>
              <li class="nav-item"><a href="rental-companies.html" class="nav-link" data-page="rental-companies"><span class="nav-icon rental-companies"></span>Rental Companies</a></li>
              <li class="nav-item"><a href="drivers.html" class="nav-link" data-page="drivers"><span class="nav-icon drivers"></span>Drivers</a></li>
            </ul>
          </div>
          <div class="nav-section">
            <h3 class="nav-section-title">Others</h3>
            <ul class="nav-menu">
              <li class="nav-item"><a href="support-ticket-view.html" class="nav-link" data-page="support-tickets"><span class="nav-icon support"></span>Support Tickets</a></li>
              <li class="nav-item"><a href="report-view.html" class="nav-link" data-page="reports"><span class="nav-icon reports"></span>Reports</a></li>
              <li class="nav-item"><a href="messages.html" class="nav-link" data-page="messages"><span class="nav-icon messages"></span>Messages</a></li>
            </ul>
          </div>
        </nav>
        <div class="sidebar-footer">
          <button class="logout-btn" onclick="handleLogout()">
            <span class="nav-icon"><i class="fas fa-sign-out-alt"></i></span>
            Logout
          </button>
        </div>
      </div>
      <button class="sidebar-toggle" id="sidebarToggle">☰</button>
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;

    document.body.insertAdjacentHTML("afterbegin", sidebarHTML);
    this.sidebar = document.getElementById("sidebar");
    this.toggleBtn = document.getElementById("sidebarToggle");
    this.overlay = document.getElementById("sidebarOverlay");
  }

  setupEventListeners() {
    this.toggleBtn?.addEventListener("click", () => this.toggleSidebar());
    this.overlay?.addEventListener("click", () => this.closeSidebar());

    document.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("nav-link") ||
        e.target.closest(".nav-link")
      ) {
        this.handleNavClick(e);
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeSidebar();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) this.closeSidebar();
    });
  }

  toggleSidebar() {
    this.sidebar.classList.toggle("open");
    this.overlay.classList.toggle("active");
    document.body.style.overflow = this.sidebar.classList.contains("open")
      ? "hidden"
      : "";
  }
  closeSidebar() {
    this.sidebar.classList.remove("open");
    this.overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  handleNavClick(e) {
    const link = e.target.closest(".nav-link");
    if (!link) return;
    document
      .querySelectorAll(".nav-link")
      .forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    if (window.innerWidth <= 768) this.closeSidebar();
    const page = link.getAttribute("data-page");
    if (page) localStorage.setItem("activePage", page);
  }

  setActiveNavigation() {
    const currentPage = this.getCurrentPage();
    if (currentPage) {
      const activeLink = document.querySelector(`[data-page="${currentPage}"]`);
      if (activeLink) {
        document
          .querySelectorAll(".nav-link")
          .forEach((l) => l.classList.remove("active"));
        activeLink.classList.add("active");
      }
    }
  }

  getCurrentPage() {
    const filename = window.location.pathname
      .split("/")
      .pop()
      .replace(".html", "");
    const pageMap = {
      dashboard: "dashboard",
      "ongoing-orders": "ongoing-orders",
      "past-orders": "past-orders",
      earnings: "earnings",
      promotions: "promotions",
      settings: "settings",
      admins: "admins",
      "individual-renters": "individual-renters",
      customers: "customers",
      "rental-companies": "rental-companies",
      "support-ticket-view": "support-tickets",
      reports: "reports",
      messages: "messages",
      drivers: "drivers",
      "driver-view": "drivers",
      "customer-view": "customers",
    };
    return (
      pageMap[filename] || localStorage.getItem("activePage") || "dashboard"
    );
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    fetch("/admin/logout", {
      method: "GET",
      credentials: "include", // ensure session cookie is sent
    })
      .then(() => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/views/admin/login.html"; // go back to login page
      })
      .catch((err) => {
        console.error("Logout failed:", err);
        window.location.href = "/views/admin/login.html";
      });
  }
}

document.addEventListener("DOMContentLoaded", () => new SidebarManager());
window.SidebarManager = SidebarManager;
