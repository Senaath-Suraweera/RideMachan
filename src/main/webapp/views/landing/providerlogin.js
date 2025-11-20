const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    // ✅ Link to VehicleProviderLoginServlet
    const response = await fetch("http://localhost:8080/provider/login", {
      method: "POST",
      body: new URLSearchParams({
        email: email,
        password: password,
      }),
      credentials: "include",
    });

    const result = await response.json();

    if (result.status === "success") {
      // ✅ Redirect to the new dashboard path
      window.location.href = "/views/individualprovider/html/dashboard.html";
    } else {
      errorMsg.style.display = "block";
      errorMsg.textContent = result.message || "Invalid email or password";
    }
  } catch (error) {
    console.error("Login error:", error);
    errorMsg.style.display = "block";
    errorMsg.textContent = "⚠️ Server connection error";
  }
});
