// Global dashboard data
let dashboardData = null;

// Load dashboard data on page load
document.addEventListener("DOMContentLoaded", async function () {
  console.log("Dashboard loaded, fetching data...");
  await loadDashboardData();
  initializeEventListeners();
});

// Fetch dashboard data from backend
async function loadDashboardData() {
  try {
    console.log("Fetching dashboard data from: /driver/dashboard");

    const response = await fetch("/driver/dashboard", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
    });

    console.log("Response status:", response.status);
    console.log("Response ok:", response.ok);

    if (response.status === 401) {
      // Not authenticated, redirect to login
      console.error("Not authenticated - redirecting to login");
      alert("Session expired. Please login again.");
      window.location.href = "/views/landing/driverlogin.html";
      return;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Response not OK:", errorText);
      throw new Error("Failed to load dashboard data: " + response.status);
    }

    const data = await response.json();
    console.log("Dashboard data received:", data);

    dashboardData = data;
    updateDashboard(data);
  } catch (error) {
    console.error("Error loading dashboard:", error);

    // Show more detailed error message
    const errorMsg =
      "Failed to load dashboard data: " +
      error.message +
      "\n\nPlease check:\n" +
      "1. Backend server is running\n" +
      "2. You are logged in\n" +
      "3. URL path is correct: /driver/dashboard";

    showError(errorMsg);

    // Load default/empty data to prevent blank page
    loadDefaultData();
  }
}

// Load default data when backend fails
function loadDefaultData() {
  console.log("Loading default data...");

  const defaultData = {
    driver: {
      firstName: "Driver",
      lastName: "User",
      fullName: "Driver User",
      email: "driver@example.com",
      mobile: "N/A",
      companyName: "N/A",
    },
    stats: {
      monthlyIncome: 0,
      weeklyBookings: 0,
      dailyHours: 0,
    },
    bookingSummary: {
      completed: 0,
      pending: 0,
      cancelled: 0,
      total: 0,
    },
    monthlyIncomeChart: [0, 0, 0, 0, 0, 0, 0],
    weeklyBookingsChart: [0, 0, 0, 0, 0, 0, 0],
    dailyHoursChart: [0, 0, 0, 0, 0, 0, 0],
    notificationCount: 0,
    messageCount: 0,
  };

  updateDashboard(defaultData);
}

// Update dashboard UI with fetched data
function updateDashboard(data) {
  console.log("Updating dashboard UI with data:", data);

  try {
    // Update driver name in header
    if (data.driver) {
      const userNameElement = document.querySelector(".user-name");
      if (userNameElement) {
        userNameElement.textContent = data.driver.firstName || "Driver";
        console.log("Updated user name:", data.driver.firstName);
      }

      // Update profile initial
      const profileImg = document.querySelector(".profile-img");
      if (profileImg) {
        const initial = (data.driver.firstName || "D").charAt(0).toUpperCase();
        profileImg.textContent = initial;
        console.log("Updated profile initial:", initial);
      }
    }

    // Update stats cards
    if (data.stats) {
      console.log("Updating stats:", data.stats);

      // Monthly Income
      const monthlyIncomeElement = document.querySelector(
        ".stat-card:nth-child(1) .stat-value",
      );
      if (monthlyIncomeElement) {
        const income = data.stats.monthlyIncome || 0;
        monthlyIncomeElement.textContent = "$" + formatNumber(income);
        console.log("Updated monthly income:", income);
      }

      // Weekly Bookings
      const weeklyBookingsElement = document.querySelector(
        ".stat-card:nth-child(2) .stat-value",
      );
      if (weeklyBookingsElement) {
        const bookings = data.stats.weeklyBookings || 0;
        weeklyBookingsElement.textContent = bookings;
        console.log("Updated weekly bookings:", bookings);
      }

      // Daily Hours
      const dailyHoursElement = document.querySelector(
        ".stat-card:nth-child(3) .stat-value",
      );
      if (dailyHoursElement) {
        const hours = data.stats.dailyHours || 0;
        dailyHoursElement.textContent = hours.toFixed(1) + "h";
        console.log("Updated daily hours:", hours);
      }
    }

    // Update charts
    if (data.monthlyIncomeChart) {
      console.log("Updating monthly income chart:", data.monthlyIncomeChart);
      updateBarChart(
        ".stat-card:nth-child(1) .bar-chart",
        data.monthlyIncomeChart,
      );
    }

    if (data.weeklyBookingsChart) {
      console.log("Updating weekly bookings chart:", data.weeklyBookingsChart);
      updateBarChart(
        ".stat-card:nth-child(2) .bar-chart",
        data.weeklyBookingsChart,
      );
    }

    if (data.dailyHoursChart) {
      console.log("Updating daily hours chart:", data.dailyHoursChart);
      updateBarChart(
        ".stat-card:nth-child(3) .bar-chart",
        data.dailyHoursChart,
      );
    }

    // Update booking summary
    if (data.bookingSummary) {
      console.log("Updating booking summary:", data.bookingSummary);
      updateBookingSummary(data.bookingSummary);
    }

    // Update notification badges
    if (data.notificationCount !== undefined) {
      const bellBadge = document.getElementById("bellBadge");
      if (bellBadge) {
        bellBadge.textContent = data.notificationCount;
        bellBadge.style.display =
          data.notificationCount === 0 ? "none" : "flex";
        console.log("Updated notification count:", data.notificationCount);
      }
    }

    if (data.messageCount !== undefined) {
      const messageBadge = document.getElementById("messageBadge");
      if (messageBadge) {
        messageBadge.textContent = data.messageCount;
        messageBadge.style.display = data.messageCount === 0 ? "none" : "flex";
        console.log("Updated message count:", data.messageCount);
      }
    }

    console.log("Dashboard update complete");
  } catch (error) {
    console.error("Error updating dashboard UI:", error);
  }
}

// Update bar chart with data
function updateBarChart(selector, data) {
  try {
    const chartContainer = document.querySelector(selector);
    if (!chartContainer) {
      console.warn("Chart container not found:", selector);
      return;
    }

    const bars = chartContainer.querySelectorAll(".bar");
    if (!bars || bars.length === 0) {
      console.warn("No bars found in chart:", selector);
      return;
    }

    // Ensure data is an array
    if (!Array.isArray(data)) {
      console.error("Chart data is not an array:", data);
      return;
    }

    const maxValue = Math.max(...data, 1); // Avoid division by zero
    console.log("Chart max value:", maxValue);

    data.forEach((value, index) => {
      if (bars[index]) {
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        bars[index].style.height = percentage + "%";
        bars[index].setAttribute("data-value", value);

        // Add tooltip
        bars[index].title = `Value: ${value}`;
      }
    });

    console.log("Chart updated:", selector, data);
  } catch (error) {
    console.error("Error updating bar chart:", error);
  }
}

// Update booking summary pie chart
function updateBookingSummary(summary) {
  try {
    console.log("Updating booking summary with:", summary);

    // Calculate percentage
    const total = summary.total || 0;
    const completed = summary.completed || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update pie chart percentage text
    const percentageElement = document.querySelector(".percentage");
    if (percentageElement) {
      percentageElement.textContent = percentage + "%";
    }

    // Update pie chart visual
    const pieChart = document.querySelector(".pie-chart");
    if (pieChart) {
      const degrees = (percentage / 100) * 360;
      pieChart.style.background = `conic-gradient(
                var(--primary) 0deg ${degrees}deg, 
                #e3f2fd ${degrees}deg 360deg
            )`;
    }

    // Update stat numbers
    const statItems = document.querySelectorAll(".pie-stat-item");
    if (statItems.length >= 4) {
      statItems[0].querySelector(".stat-number").textContent =
        summary.completed || 0;
      statItems[1].querySelector(".stat-number").textContent =
        summary.pending || 0;
      statItems[2].querySelector(".stat-number").textContent =
        summary.cancelled || 0;
      statItems[3].querySelector(".stat-number").textContent =
        summary.total || 0;
    }

    console.log("Booking summary updated - Completed:", percentage + "%");
  } catch (error) {
    console.error("Error updating booking summary:", error);
  }
}

// ==========================================
// Event Listeners
// ==========================================

function initializeEventListeners() {
  console.log("Initializing event listeners...");

  // Sidebar toggle for mobile
  const sidebarToggle = document.getElementById("sidebarToggle");
  if (sidebarToggle) {
    sidebarToggle.addEventListener("click", toggleSidebar);
  }

  // Message company button
  const messageBtn = document.querySelector(".message-btn");
  if (messageBtn) {
    messageBtn.addEventListener("click", handleMessageCompany);
  }

  // Contact admin button
  const contactBtn = document.querySelector(".contact-btn");
  if (contactBtn) {
    contactBtn.addEventListener("click", handleContactAdmin);
  }

  // Logout button
  const logoutBtn = document.querySelector(".logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  // Navigation hover effects
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("mouseenter", function () {
      if (!this.classList.contains("active")) {
        this.style.transform = "translateX(5px)";
        this.style.transition = "transform 0.2s ease";
      }
    });

    item.addEventListener("mouseleave", function () {
      if (!this.classList.contains("active")) {
        this.style.transform = "translateX(0)";
      }
    });
  });

  // Stat card click effects
  document.querySelectorAll(".stat-card").forEach((card) => {
    card.addEventListener("click", function () {
      this.style.transform = "scale(0.98)";
      setTimeout(() => {
        this.style.transform = "scale(1)";
      }, 150);
    });
  });

  // Close sidebar when clicking outside on mobile
  document.addEventListener("click", function (event) {
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("sidebarToggle");

    if (window.innerWidth <= 992) {
      if (
        sidebar &&
        toggle &&
        !sidebar.contains(event.target) &&
        !toggle.contains(event.target)
      ) {
        sidebar.classList.remove("active");
      }
    }
  });

  // Handle window resize
  window.addEventListener("resize", function () {
    const sidebar = document.getElementById("sidebar");
    if (sidebar && window.innerWidth > 992) {
      sidebar.classList.remove("active");
    }
  });
}

// Toggle sidebar for mobile
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) {
    sidebar.classList.toggle("active");
  }
}

// Handle logout
async function handleLogout() {
  if (!confirm("Are you sure you want to logout?")) {
    return;
  }

  try {
    // Call logout endpoint if you have one
    const response = await fetch("/driver/logout", {
      method: "POST",
      credentials: "include",
    });

    // Redirect to login regardless of response
    window.location.href = "http://localhost:8080/views/landing/index.html";
  } catch (error) {
    console.error("Logout error:", error);
    // Redirect anyway
    window.location.href = "http://localhost:8080/views/landing/index.html";
  }
}

// Handle message company button
async function handleMessageCompany() {
  const btn = document.querySelector(".message-btn");
  if (!btn) return;

  const originalText = btn.innerHTML;

  // Show loading state
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
  btn.disabled = true;
  btn.style.opacity = "0.7";

  try {
    // Redirect to messages page
    setTimeout(() => {
      window.location.href = "messages.html";
    }, 500);
  } catch (error) {
    console.error("Error:", error);
    btn.innerHTML = '<i class="fas fa-times"></i> Failed';
    btn.style.backgroundColor = "#dc3545";

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.style.backgroundColor = "";
    }, 2000);
  }
}

// Handle contact admin button
function handleContactAdmin() {
  const btn = document.querySelector(".contact-btn");
  if (!btn) return;

  const originalText = btn.innerHTML;

  // Show loading state
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
  btn.disabled = true;
  btn.style.opacity = "0.7";

  // Simulate connection
  setTimeout(() => {
    // Show connected state
    btn.innerHTML = '<i class="fas fa-phone-alt"></i> Connected!';
    btn.style.backgroundColor = "#28a745";

    // Show call in progress
    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-phone-alt fa-pulse"></i> In Call...';

      // End call after 3 seconds
      setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-phone-slash"></i> Call Ended';
        btn.style.backgroundColor = "#6c757d";

        // Reset after 2 seconds
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.backgroundColor = "";
        }, 2000);
      }, 3000);
    }, 1000);
  }, 1500);
}

// Format number with commas
function formatNumber(num) {
  if (typeof num !== "number") {
    num = parseFloat(num) || 0;
  }
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Show error message
function showError(message) {
  console.error("Showing error:", message);
  alert(message);
}

// Refresh dashboard data
function refreshDashboard() {
  console.log("Refreshing dashboard...");
  loadDashboardData();
}

// Set interval to refresh dashboard every 5 minutes
setInterval(refreshDashboard, 300000);

// Manual refresh button (if you want to add one)
window.manualRefresh = function () {
  console.log("Manual refresh triggered");
  loadDashboardData();
};
