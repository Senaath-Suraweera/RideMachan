// Header functionality
function initializeHeader() {
  // Load user data and update header
  loadUserData();

  // Load notification counts
  updateNotificationCounts();

  // Close dropdown when clicking outside
  document.addEventListener("click", function (event) {
    const dropdown = document.getElementById("profileDropdown");
    const profile = document.querySelector(".user-profile");

    if (dropdown && profile && !profile.contains(event.target)) {
      dropdown.classList.remove("show");
    }
  });

  // Close sidebar when clicking overlay
  const overlay = document.querySelector(".sidebar-overlay");
  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }
}

function loadUserData() {
  // In a real application, this would fetch from an API
  const userData = {
    name: "Kamal Silva",
    email: "kamal@example.com",
    phone: "+94 77 123 4567",
    initial: "K",
  };

  // Update header elements
  const userNameEl = document.getElementById("userName");
  const profileInitialEl = document.getElementById("profileInitial");

  if (userNameEl) {
    userNameEl.textContent = userData.name.split(" ")[0];
  }

  if (profileInitialEl) {
    profileInitialEl.textContent = userData.initial;
  }

  // Update welcome message if it exists
  const welcomeMessageEl = document.getElementById("welcomeMessage");
  if (welcomeMessageEl) {
    welcomeMessageEl.textContent = `Welcome back ${
      userData.name.split(" ")[0]
    }`;
  }
}

function updateNotificationCounts() {
  // In a real application, this would fetch from an API
  const counts = {
    notifications: 3,
    messages: 5,
  };

  const notificationCountEl = document.getElementById("notificationCount");
  const messageCountEl = document.getElementById("messageCount");

  if (notificationCountEl) {
    notificationCountEl.textContent = counts.notifications;

    // Hide badge if count is 0
    if (counts.notifications === 0) {
      notificationCountEl.style.display = "none";
    }
  }

  if (messageCountEl) {
    messageCountEl.textContent = counts.messages;

    // Hide badge if count is 0
    if (counts.messages === 0) {
      messageCountEl.style.display = "none";
    }
  }
}

function toggleProfileDropdown(event) {
  if (event) {
    event.stopPropagation();
  }

  const dropdown = document.getElementById("profileDropdown");
  if (dropdown) {
    dropdown.classList.toggle("show");
  }
}

function showNotifications() {
  // In a real application, this would show notifications panel or navigate to notifications page
  window.location.href = "../pages/notifications.html";
}

function showMessages() {
  // In a real application, this would show messages panel or navigate to messages page
  console.log("Show messages");
  alert("Messages feature coming soon!");
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    // Send request to backend logout servlet
    fetch("/customer/logout", { method: "GET" })
      .then((response) => {
        if (response.redirected) {
          // If servlet redirects, follow it
          window.location.href = response.url;
        } else {
          // Fallback manual redirect
          window.location.href = "/views/landing/index.html";
        }
      })
      .catch((error) => {
        console.error("Logout failed:", error);
        // Redirect anyway as a fallback
        window.location.href = "/views/landing/index.html";
      });
  }
}

function showLogoutMessage() {
  // Create and show logout notification
  const notification = document.createElement("div");
  notification.className = "logout-notification";
  notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: var(--success);
            color: white;
            padding: 15px 20px;
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            z-index: 9999;
            animation: slideIn 0.3s ease;
        ">
            <i class="fas fa-check-circle"></i>
            Logged out successfully!
        </div>
    `;

  document.body.appendChild(notification);

  // Remove notification after delay
  setTimeout(() => {
    notification.remove();
  }, 1200);
}

// Mobile Sidebar Toggle Functions
function toggleSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = getOrCreateOverlay();

  if (sidebar) {
    sidebar.classList.toggle("active");
    overlay.classList.toggle("active");

    // Change icon based on state
    const menuToggle = document.getElementById("menuToggle");
    if (menuToggle) {
      const icon = menuToggle.querySelector("i");
      if (sidebar.classList.contains("active")) {
        icon.className = "fas fa-times";
      } else {
        icon.className = "fas fa-bars";
      }
    }
  }
}

function closeSidebar() {
  const sidebar = document.querySelector(".sidebar");
  const overlay = document.querySelector(".sidebar-overlay");
  const menuToggle = document.getElementById("menuToggle");

  if (sidebar) {
    sidebar.classList.remove("active");
  }

  if (overlay) {
    overlay.classList.remove("active");
  }

  if (menuToggle) {
    const icon = menuToggle.querySelector("i");
    if (icon) {
      icon.className = "fas fa-bars";
    }
  }
}

function getOrCreateOverlay() {
  let overlay = document.querySelector(".sidebar-overlay");

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    document.body.appendChild(overlay);

    // Add click listener to close sidebar
    overlay.addEventListener("click", closeSidebar);
  }

  return overlay;
}

// Set page title dynamically
function setPageTitle(title) {
  const pageTitleEl = document.getElementById("pageTitle");
  if (pageTitleEl) {
    pageTitleEl.textContent = title;
  }

  // Also update document title
  document.title = `${title} - Vehicle Rental System`;
}

// Initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeHeader);
} else {
  initializeHeader();
}

// Add CSS animation for logout notification
const style = document.createElement("style");
style.textContent = `
@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}
`;
document.head.appendChild(style);
