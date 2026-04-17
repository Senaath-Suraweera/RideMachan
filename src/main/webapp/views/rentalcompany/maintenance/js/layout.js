/* =========================================================================
 * layout.js — Shared Sidebar + Header for Ride Machan
 *
 * HOW TO USE
 * ----------
 * 1. In each page, add two empty mount points:
 *        <aside id="sidebar-mount"></aside>
 *        <header id="header-mount"></header>
 *
 * 2. Include this script with `defer`:
 *        <script src="../js/layout.js" defer></script>
 *
 * 3. (Optional) Set a data attribute on <body> to override auto-detection
 *    of the active nav item:
 *        <body data-active-page="dashboard">
 *    Valid values: dashboard | inspection | vehiclerecords | calendar |
 *                  notification | profile
 *
 * The header behaviour mirrors notification.html — the bell badge is
 * populated from GET /api/notifications/count and hides when count is 0.
 * ========================================================================= */

(function () {
  "use strict";

  const API_BASE = "/api/notifications";

  // ---------------------------------------------------------------------------
  // Nav definition — single source of truth for the sidebar
  // ---------------------------------------------------------------------------
  const NAV_ITEMS = [
    {
      key: "dashboard",
      href: "dashboard.html",
      icon: "fa-tachometer-alt",
      label: "Dashboard",
    },
    {
      key: "inspection",
      href: "inspection.html",
      icon: "fa-tools",
      label: "Maintenance Logs",
    },
    {
      key: "vehiclerecords",
      href: "vehiclerecords.html",
      icon: "fa-file",
      label: "Vehicle Records",
    },
    {
      key: "calendar",
      href: "maintenance-calender.html",
      icon: "fa-calendar",
      label: "Calendar",
    },
    {
      key: "notification",
      href: "notification.html",
      icon: "fa-bell",
      label: "Notifications",
    },
    {
      key: "messages",
      href: "messages.html",
      icon: "fa-comments",
      label: "Messages",
    },
  ];

  // Pages on which the Notifications nav item should be shown in the sidebar.
  // (Original project only showed it on notification.html itself.)
  const SHOW_NOTIFICATION_IN_SIDEBAR = true;

  // ---------------------------------------------------------------------------
  // Figure out which nav item should be "active" for the current page
  // ---------------------------------------------------------------------------
  function detectActivePage() {
    const override = document.body.getAttribute("data-active-page");
    if (override) return override;

    const path = window.location.pathname.split("/").pop().toLowerCase();
    if (path.includes("dashboard")) return "dashboard";
    if (path.includes("inspection")) return "inspection";
    if (path.includes("maintenancelog")) return "inspection"; // maintenance log lives under the inspection tab
    if (path.includes("vehiclerecords")) return "vehiclerecords";
    if (path.includes("calender") || path.includes("calendar"))
      return "calendar";
    if (path.includes("notification")) return "notification";
    if (path.includes("staffprofile") || path.includes("profile"))
      return "profile";
    if (path.includes("messages")) return "messages";
    return "";
  }

  // ---------------------------------------------------------------------------
  // Render sidebar
  // ---------------------------------------------------------------------------
  function renderSidebar(activeKey) {
    const items = NAV_ITEMS.filter(
      (item) => SHOW_NOTIFICATION_IN_SIDEBAR || item.key !== "notification",
    )
      .map((item) => {
        const activeClass = item.key === activeKey ? " active" : "";
        return `
          <li class="nav-item${activeClass}">
            <a href="${item.href}" class="nav-link">
              <i class="fas ${item.icon}"></i>
              <span>${item.label}</span>
            </a>
          </li>`;
      })
      .join("");

    return `
      <div class="logo-section">
        <img src="../assets/ridemachan-logo.png" alt="RideMachan Logo" class="logo">
      </div>

      <nav class="nav-menu">
        <ul>
          <h3>Main Navigation</h3>
          ${items}
        </ul>
      </nav>

      <div class="logout-section">
        <a href="#" class="nav-link" id="layoutLogoutBtn">
          <i class="fas fa-sign-out-alt"></i>
          <span>Logout</span>
        </a>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Render header — mirrors notification.html's markup & behaviour
  // ---------------------------------------------------------------------------
  function renderHeader() {
    return `
      <div class="search-bar">
        <i class="fas fa-search"></i>
        <input type="text" placeholder="Search vehicles, maintenance records..." id="searchInput">
      </div>

      <div class="header-actions">
        <div class="notification">
          <a href="notification.html" class="notification">
            <i class="fas fa-bell"></i>
            <div class="badge" id="notificationCount">0</div>
          </a>
        </div>
        <div class="user-profile" id="layoutUserProfile">
          <div class="profile-img" id="layoutProfileImg">..</div>
          <div class="user-info">
            <div class="user-name" id="layoutUserName">Loading...</div>
            <div class="user-role">Maintenance Staff</div>
          </div>
        </div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Live notification-count polling (same endpoint as notification.html)
  // ---------------------------------------------------------------------------
  async function loadNotificationCount() {
    const badge = document.getElementById("notificationCount");
    if (!badge) return;

    try {
      const response = await fetch(`${API_BASE}/count`, {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (response.status === 401) {
        // Not logged in — hide badge silently
        badge.style.display = "none";
        return;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data && data.ok) {
        const count = Number(data.count) || 0;
        badge.textContent = count;
        badge.style.display = count > 0 ? "flex" : "none";
      }
    } catch (err) {
      console.error("layout.js: failed to load notification count:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // Load the logged-in staff's info into the header (name + avatar initials)
  // ---------------------------------------------------------------------------
  async function loadHeaderUserInfo() {
    const nameEl = document.getElementById("layoutUserName");
    const imgEl = document.getElementById("layoutProfileImg");
    if (!nameEl && !imgEl) return;

    try {
      const response = await fetch("/load/maintenance/profile", {
        method: "GET",
        credentials: "include",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (!data || data.error) return;

      // Prefer the username; fall back to full name if username is missing.
      const username = (data.username || "").trim();
      const fullName = (
        (data.firstname || "") +
        " " +
        (data.lastname || "")
      ).trim();

      if (nameEl) {
        nameEl.textContent = username || fullName || "User";
      }

      if (imgEl) {
        let initials = "";
        if (data.firstname) initials += data.firstname.charAt(0);
        if (data.lastname) initials += data.lastname.charAt(0);
        if (!initials && username) initials = username.charAt(0);
        imgEl.textContent = (initials || "U").toUpperCase();
      }
    } catch (err) {
      console.error("layout.js: failed to load header user info:", err);
    }
  }

  // ---------------------------------------------------------------------------
  // Wire up user-profile click → profile page (matches existing behaviour)
  // ---------------------------------------------------------------------------
  function bindHeaderEvents() {
    const profile = document.getElementById("layoutUserProfile");
    if (profile) {
      profile.style.cursor = "pointer";
      profile.addEventListener("click", () => {
        // Preserve old `toggleUserMenu()` semantics if the page defines it.
        if (typeof window.toggleUserMenu === "function") {
          window.toggleUserMenu();
        } else {
          window.location.href = "staffprofile.html";
        }
      });
    }

    const logout = document.getElementById("layoutLogoutBtn");
    if (logout) {
      logout.addEventListener("click", (e) => {
        if (typeof window.handleLogout === "function") {
          e.preventDefault();
          window.handleLogout();
        }
        // else: fall through to href="#"
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Mount into the page
  // ---------------------------------------------------------------------------
  function mount() {
    const sidebarMount = document.getElementById("sidebar-mount");
    const headerMount = document.getElementById("header-mount");
    const activeKey = detectActivePage();

    if (sidebarMount) {
      // Ensure the mount element carries the required layout classes
      sidebarMount.classList.add("sidebar");
      sidebarMount.innerHTML = renderSidebar(activeKey);
    }

    if (headerMount) {
      headerMount.classList.add("header");
      // notification.html uses an extra "own" class; preserve it by default
      // because its CSS rules are scoped to `.header.own`.
      headerMount.classList.add("own");
      headerMount.innerHTML = renderHeader();
      bindHeaderEvents();
      loadNotificationCount();
      loadHeaderUserInfo();

      // Refresh the badge every 60s so it stays accurate across pages
      setInterval(loadNotificationCount, 60_000);
    }

    // Expose a manual refresh hook — useful after pages perform actions
    // that should update the badge (e.g. marking notifications read).
    window.refreshNotificationBadge = loadNotificationCount;
  }

  window.handleLogout = async function () {
    try {
      const response = await fetch("/maintenancestaff/logout", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.status === "success") {
        window.location.href = "/views/landing/index.html";
      } else {
        alert("Logout failed");
      }
    } catch (err) {
      console.error("Logout error:", err);
      alert("Something went wrong during logout");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
