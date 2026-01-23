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

      statsGrid.innerHTML += createStatsCard("fas fa-car", "blue", "Total Vehicles", stats.totalVehicles || 0);
      statsGrid.innerHTML += createStatsCard("fas fa-users", "green", "Active Drivers", stats.activeDrivers || 0);
      statsGrid.innerHTML += createStatsCard("fas fa-calendar-check", "orange", "Active Bookings", stats.activeBookings || 0);
      statsGrid.innerHTML += createStatsCard("fas fa-rupee-sign", "purple", "Monthly Revenue", stats.monthlyRevenue || "Rs0");

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
