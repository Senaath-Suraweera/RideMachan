const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch(
      "http://localhost:8080/rentalcompanies/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    const result = await response.json();

    if (result.status === "success") {
      // ✅ Redirect to company home page
      alert("Login successful!");
      window.location.href = "../rentalcompany/management/html/homepage.html";
    } else {
      errorMsg.style.display = "block";
      errorMsg.textContent = "Invalid email or password";
    }
  } catch (error) {
    console.error("Login error:", error);
    errorMsg.style.display = "block";
    errorMsg.textContent = "Server connection error";
  }
});
