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


      } catch (err) {

          console.error("Error during initialization:", err);

      }

  });
