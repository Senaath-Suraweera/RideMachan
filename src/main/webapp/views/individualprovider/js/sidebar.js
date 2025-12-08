// Sidebar Navigation JavaScript (links + pageMap aligned to the other sidebar)
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
              <li class="nav-item">
                <a href="dashboard.html" class="nav-link" data-page="dashboard">
                  <span class="nav-icon dashboard"></span>
                  Dashboard
                </a>
              </li>
              <li class="nav-item">
                <a href="my-vehicles.html" class="nav-link" data-page="my-vehicles">
                  <span class="nav-icon vehicles"></span>
                  My Vehicles
                </a>
              </li>
              <li class="nav-item">
                <a href="ongoing-bookings.html" class="nav-link" data-page="ongoing-bookings">
                  <span class="nav-icon bookings"></span>
                  Ongoing Bookings
                </a>
              </li>
              <li class="nav-item">
                <a href="past-bookings.html" class="nav-link" data-page="past-bookings">
                  <span class="nav-icon past-bookings"></span>
                  Past Bookings
                </a>
              </li>
              <li class="nav-item">
                <a href="earnings.html" class="nav-link" data-page="earnings">
                  <span class="nav-icon earnings"></span>
                  Earnings
                </a>
              </li>
              <li class="nav-item">
                <a href="apply-for-rental-company.html" class="nav-link" data-page="apply-rental-company">
                  <span class="nav-icon apply"></span>
                  Apply for Rental Company
                </a>
              </li>
              <li class="nav-item">
                <a href="messages.html" class="nav-link" data-page="messages">
                  <span class="nav-icon messages"></span>
                  Messages
                </a>
              </li>
            </ul>
          </div>
        </nav>

        <div class="sidebar-footer">
          <button class="logout-btn" onclick="handleLogout()">Logout</button>
        </div>
      </div>

      <button class="sidebar-toggle" id="sidebarToggle">☰</button>
      <div class="sidebar-overlay" id="sidebarOverlay"></div>
    `;

    // Insert sidebar into body
    document.body.insertAdjacentHTML("afterbegin", sidebarHTML);

    // Cache elements
    this.sidebar = document.getElementById("sidebar");
    this.toggleBtn = document.getElementById("sidebarToggle");
    this.overlay = document.getElementById("sidebarOverlay");
  }

  setupEventListeners() {
    // Toggle sidebar on mobile
    this.toggleBtn?.addEventListener("click", () => {
      this.toggleSidebar();
    });

    // Close sidebar when clicking overlay
    this.overlay?.addEventListener("click", () => {
      this.closeSidebar();
    });

    // Handle navigation clicks
    document.addEventListener("click", (e) => {
      if (
        e.target.classList.contains("nav-link") ||
        e.target.closest(".nav-link")
      ) {
        this.handleNavClick(e);
      }
    });

    // Close sidebar on escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this.closeSidebar();
    });

    // Handle window resize
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) this.closeSidebar();
    });
  }

  toggleSidebar() {
    if (this.sidebar.classList.contains("open")) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    this.sidebar.classList.add("open");
    this.overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  }

  closeSidebar() {
    this.sidebar.classList.remove("open");
    this.overlay.classList.remove("active");
    document.body.style.overflow = "";
  }

  handleNavClick(e) {
    const link = e.target.closest(".nav-link");
    if (!link) return;

    // Remove active class from all links
    document
      .querySelectorAll(".nav-link")
      .forEach((l) => l.classList.remove("active"));
    // Add active class to clicked link
    link.classList.add("active");

    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      this.closeSidebar();
    }

    // Store active page
    const page = link.getAttribute("data-page");
    if (page) {
      localStorage.setItem("activePage", page);
    }
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
    // Get filename (e.g., "my-vehicles" from "my-vehicles.html")
    const filename = window.location.pathname
      .split("/")
      .pop()
      .replace(".html", "");

    // Map filenames to nav data-page values (aligned with links above)
    const pageMap = {
      dashboard: "dashboard",
      "my-vehicles": "my-vehicles",
      "ongoing-bookings": "ongoing-bookings",
      "past-bookings": "past-bookings",
      earnings: "earnings",
      "apply-for-rental-company": "apply-rental-company",
      messages: "messages",
    };

    return (
      pageMap[filename] || localStorage.getItem("activePage") || "dashboard"
    );
  }
}

// Utility Functions
function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "login.html";
  }
}

// Initialize sidebar when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new SidebarManager();
});

// Export for use in other scripts
window.SidebarManager = SidebarManager;
