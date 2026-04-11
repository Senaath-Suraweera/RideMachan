// ================= HEADER INITIALIZATION =================
function initializeHeader() {
  loadUserData();
  updateNotificationCounts();

  // Attach programmatic click listener to user profile (reliable after injection)
  const userProfileEl = document.getElementById("userProfile");
  if (userProfileEl && !userProfileEl.__pmListAttached) {
    userProfileEl.addEventListener("click", function (e) {
      e.stopPropagation(); // prevent document-level handler from closing immediately
      toggleProfileDropdown(); // programmatic call (no event needed)
    });
    userProfileEl.__pmListAttached = true;
  }

  // Close dropdown when clicking outside (add only once)
  if (!window.__rideMachanHeaderInit) {
    document.addEventListener("click", function () {
      const dropdown = document.getElementById("profileDropdown");
      if (dropdown) {
        dropdown.classList.remove("show");
      }
    });
    window.__rideMachanHeaderInit = true;
  }
}

// ================= LOAD USER =================
function loadUserData() {
  fetch("/customer/profile/info", {
    method: "GET",
    credentials: "include"
  })
      .then(response => {
        if (!response.ok) throw new Error("Not logged in");
        return response.json();
      })
      .then(userData => {
        const firstName = userData.firstname?.trim();

        const userNameEl = document.getElementById("userName");
        const profileInitialEl = document.getElementById("profileInitial");

        // 🔥 FORCE overwrite (removes old Kamal)
        if (userNameEl) userNameEl.textContent = firstName || "User";
        if (profileInitialEl)
          profileInitialEl.textContent = (firstName || "U").charAt(0).toUpperCase();

        setPageTitle(`Welcome back ${firstName || ""}`.trim());
      })
      .catch(() => {
        // Guest fallback
        const userNameEl = document.getElementById("userName");
        const profileInitialEl = document.getElementById("profileInitial");

        if (userNameEl) userNameEl.textContent = "Guest";
        if (profileInitialEl) profileInitialEl.textContent = "G";

        setPageTitle("Welcome back");
      });
}

// ================= PAGE TITLE =================
function setPageTitle(title) {
  const pageTitleEl = document.getElementById("pageTitle");
  if (pageTitleEl) {
    pageTitleEl.textContent = title;
  }

  document.title = `${title} - Ride Machan`;
}

// ================= NOTIFICATIONS =================
function updateNotificationCounts() {
  const counts = { notifications: 3, messages: 5 };

  const n = document.getElementById("notificationCount");
  const m = document.getElementById("messageCount");

  if (n) n.textContent = counts.notifications;
  if (m) m.textContent = counts.messages;
}

// ================= DROPDOWN =================
function toggleProfileDropdown(event) {
  // Support both inline callers that pass an event and programmatic callers that don't.
  if (event && typeof event.stopPropagation === "function") {
    event.stopPropagation();
  }

  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) {
    dropdown.classList.toggle("show");
  }
}

// ================= ACTIONS =================
function showNotifications() {
  window.location.href = "../pages/notifications.html";
}

function showMessages() {
  alert("Messages feature coming soon!");
}

function handleLogout() {
  if (!confirm("Are you sure you want to logout?")) return;

  fetch("/customer/logout")
      .then(() => {
        window.location.href = "/views/landing/index.html";
      })
      .catch(() => {
        window.location.href = "/views/landing/index.html";
      });
}

// Expose functions globally so onclick attributes and dynamic loader can call them
window.initializeHeader = initializeHeader;
window.toggleProfileDropdown = toggleProfileDropdown;
window.showNotifications = showNotifications;
window.showMessages = showMessages;
window.handleLogout = handleLogout;
