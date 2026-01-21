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




  document.addEventListener("DOMContentLoaded", async function() {

      try {

          const loggedIn = await checkLogin();

          if (!loggedIn) {
              return;    // stop here if not logged in
          }



      } catch (err) {

          console.error("Error during initialization:", err);

      }

  });
