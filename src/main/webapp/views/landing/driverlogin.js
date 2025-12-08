const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    // ✅ Send JSON to DriverLoginServlet
    const response = await fetch("http://localhost:8080/driver/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const result = await response.json();

    if (result.status === "success") {
      alert("✅ Login successful!");
      window.location.href = "/views/rentalcompany/driver/dashboard.html";
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
