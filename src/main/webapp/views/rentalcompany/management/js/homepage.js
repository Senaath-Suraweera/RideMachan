  async function checkLogin() {

      try {

          const response = await fetch("/checklogin");
          const data = await response.json();

          if (!data.loggedIn) {

              const modal = document.getElementById("loginModal");
              modal.style.display = "flex";


              document.getElementById("loginOkBtn").onclick = () => {

                  window.location.href = "/companylogin";

              };

              return false;

          }

          console.log("User is logged in.");
          return true;

      } catch (err) {

          console.error("Error checking login:", err);
          return false;

      }

  }

  async function loadStatistics() {

      try {

          const response = await fetch("/displaystatistics", {method: "POST"});
          console.log(response);

          if (!response.ok) {
              throw new Error(`HTTP error! Status: ${response.status}`);
          }


          const data = await response.json();

          console.log(data);


          return data;

      }catch (err) {

          console.log(err);

      }

  }


  function showNotification(message, type = "info") {

      const notification = document.createElement("div");

      notification.textContent = message;

      // basic styling
      notification.style.position = "fixed";
      notification.style.top = "20px";
      notification.style.right = "20px";
      notification.style.padding = "12px 18px";
      notification.style.borderRadius = "8px";
      notification.style.color = "#fff";
      notification.style.fontSize = "14px";
      notification.style.zIndex = "9999";
      notification.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
      notification.style.transition = "0.3s ease";

      // color based on type
      if (type === "success") {
          notification.style.background = "#28a745";
      } else if (type === "error") {
          notification.style.background = "#dc3545";
      } else if (type === "info") {
          notification.style.background = "#17a2b8";
      } else {
          notification.style.background = "#333";
      }

      document.body.appendChild(notification);

      // auto remove after 3 seconds
      setTimeout(() => {

          notification.style.opacity = "0";
          setTimeout(() => notification.remove(), 300);

      }, 3000);

  }


  function renderStatistics(stats) {

      const statsGrid = document.getElementById("stats-grid");
      statsGrid.innerHTML = "";

      function createStatsCard(iconClass, colorClass, label, value) {

            return `
            
                <div class="stat-card">
                    <div class="stat-icon ${colorClass}">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="stat-content">
                        <div class="stat-label">${label}</div>
                        <div class="stat-value">${value}</div>
                    </div>
                </div>            
            
            `;

      }

      statsGrid.innerHTML += createStatsCard("fas fa-users", "green", "Active Drivers", stats.activeDrivers || 0);
      statsGrid.innerHTML += createStatsCard("fas fa-calendar-check", "blue", "Active Bookings", stats.ConfirmedBookings || 6);
      statsGrid.innerHTML += createStatsCard("fas fa-calendar-check", "orange", "Cancelled Bookings", stats.CancelledBookings || 6);
      statsGrid.innerHTML += createStatsCard("fas fa-rupee-sign", "purple", "Monthly Revenue", stats.MonthlyRevenue || "Rs120070");
      statsGrid.innerHTML += createStatsCard("fas fa-rupee-sign", "purple", "Monthly Revenue Lost", stats.MonthlyRevenueLostDueToCancelled || "Rs120070")

  }

  let recentBookings;

  async function loadRecentBookings() {

      try {

          let response = await fetch(`/displayrecentbookings`, {
              method: "POST",
              headers: {
                  "Content-Type": "application/json"
              }
          });

          if(!response.ok){
              throw new Error(`HTTP error! Status: ${response.status}`);
          }

          let data = await response.json();

          console.log(data);


          return data;

      }catch (err) {

          console.log(err);

      }

  }

  function renderRecentBookings(bookings) {

      const bookingList = document.getElementsByClassName("bookings-list")[0];

      bookingList.innerHTML = "";

      if (!bookings || bookings.length === 0) {
          handleEmptyCase("No Recent Bookings Found", "bookings-list");
          return;
      }


      if(bookings && bookings.length > 0) {

          bookings.forEach(b => {
              bookingList.innerHTML += `
                <div class="booking-item">
                    <div class="booking-info">
                        <div class="vehicle-name">${b.vehicleBrand || "Unknown Brand"} ${b.vehicleModel || ""}</div>
                        <div class="customer-name">${b.customerName || "Unknown Customer"}</div>
                        <div class="booking-date">${b.tripStartDate} - ${b.tripEndDate}</div>
                    </div>
                    <div class="booking-status">
                        <span class="status-badge ${b.status.toLowerCase()}">${b.status}</span>
                        <div class="booking-price">Rs ${b.totalAmount}</div>
                    </div>
                </div>
            `;
          });

      }

  }

  function formatDate(dateStr) {


  }


  function handleEmptyCase(message, containerId = "container") {

      const container = document.getElementById(containerId);

      if (!container) return;

      container.innerHTML = "";

      const emptyCard = document.createElement("div");

      emptyCard.innerHTML = `
        <h2 class="empty-title">${message}</h2>
        <p class="empty-sub">Nothing to display right now</p>
    `;


      emptyCard.style.width = "100%";
      emptyCard.style.maxWidth = "900px";
      emptyCard.style.margin = "0 auto";
      emptyCard.style.padding = "50px 25px";
      emptyCard.style.borderRadius = "18px";
      emptyCard.style.background = "linear-gradient(135deg, #ffffff, #f8f9ff)";
      emptyCard.style.boxShadow = "0 10px 30px rgba(58, 12, 163, 0.15)";
      emptyCard.style.border = "1px solid rgba(58, 12, 163, 0.1)";
      emptyCard.style.textAlign = "center";
      emptyCard.style.gridColumn = "1 / -1";

      emptyCard.style.transition = "all 0.3s ease";
      emptyCard.style.cursor = "default";


      emptyCard.style.position = "relative";

      const title = emptyCard.querySelector(".empty-title");

      title.style.margin = "0";
      title.style.fontSize = "22px";
      title.style.fontWeight = "700";
      title.style.background = "linear-gradient(90deg, #3a0ca3, #4361ee, #f72585)";
      title.style.webkitBackgroundClip = "text";
      title.style.webkitTextFillColor = "transparent";
      title.style.backgroundClip = "text";
      title.style.letterSpacing = "0.5px";


      const sub = emptyCard.querySelector(".empty-sub");

      sub.style.marginTop = "10px";
      sub.style.fontSize = "14px";
      sub.style.color = "#6c757d";
      sub.style.opacity = "0.9";


      emptyCard.onmouseover = () => {
          emptyCard.style.transform = "translateY(-6px) scale(1.01)";
          emptyCard.style.boxShadow = "0 18px 40px rgba(67, 97, 238, 0.25)";
      };

      emptyCard.onmouseout = () => {
          emptyCard.style.transform = "translateY(0) scale(1)";
          emptyCard.style.boxShadow = "0 10px 30px rgba(58, 12, 163, 0.15)";
      };

      container.appendChild(emptyCard);
  }

  document.addEventListener("DOMContentLoaded", async function() {

      try {

          const loggedIn = await checkLogin();

          if (!loggedIn) {
              return;    // stop here if not logged in
          }

          const stats = await loadStatistics();

          if(stats) {
              renderStatistics(stats)
          }

          recentBookings = await loadRecentBookings();

          console.log("Recent Bookings:", recentBookings);

          renderRecentBookings(recentBookings);


      } catch (err) {

          console.error("Error during initialization:", err);

      }

  });




