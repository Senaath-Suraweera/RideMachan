const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(
        password
      )}`,
    });

    if (response.redirected) {
      window.location.href = response.url; // redirect to dashboard
    } else {
      errorMsg.style.display = "block";
    }
  } catch (err) {
    errorMsg.style.display = "block";
  }
});