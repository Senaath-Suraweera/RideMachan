export function initSidebar() {


    const logoutBtn = document.getElementsByClassName("logout-section")[0];

    if (!logoutBtn) {
      return;
    }


    logoutBtn.addEventListener("click", async function (e) {

        e.preventDefault();

        const confirmLogout = confirm("Are you sure you want to logout?");
        if (!confirmLogout) {
            return;
        }

        try {

            const response = await fetch("/rentalcompanies/logout", {
                method: "GET",
                credentials: "include"
            });

            if (response.ok) {

                window.location.href = "/views/landing/companylogin.html";

            } else {

                alert("Logout failed!");

            }

        } catch (error) {

            console.error("Error during logout:", error);
            alert("Something went wrong!");

        }

    });


    async function loadCompanyProfile() {

        try {

            const response = await fetch("/rentalcompanies/profile", {
                method: "GET",
                credentials: "include"
            });

            if (response.ok) {

                const company = await response.json();
                updateSidebarProfile(company);

            } else {

                console.warn("Not logged in, redirecting to login page");
                window.location.href = "/views/landing/companylogin.html";

            }

        } catch (error) {

            console.error("Error fetching company profile:", error);

        }
    }

    function updateSidebarProfile(company) {

        const userAvatar = document.querySelector(".user-profile .user-avatar");
        const userName = document.querySelector(".user-profile span");

        if (!userAvatar || !userName) {
            return;
        }


        userName.textContent = company.companyName;


        if (company.profileImage && company.profileImage.trim() !== "") {

            userAvatar.style.backgroundImage = `url('../assets/${company.profileImage}')`;
            userAvatar.textContent = "";

        } else {

            const initials = company.companyName
                .split(" ")
                .map(n => n[0])
                .join("")
                .toUpperCase();
            userAvatar.textContent = initials;
            userAvatar.style.backgroundImage = "none";
        }
    }

    loadCompanyProfile();
}