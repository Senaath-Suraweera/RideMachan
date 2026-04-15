const loginForm = document.getElementById("loginForm");
const errorMsg = document.getElementById("errorMsg");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    // ✅ Send JSON data to servlet
    const response = await fetch("http://localhost:8080/maintenance/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });

    const result = await response.json();

    if (result.status === "success") {
      showNotification("Login successful", "success");
      //alert("✅ Login successful!");
      window.location.href =
        "/views/rentalcompany/maintenance/html/dashboard.html";
    } else {
      errorMsg.style.display = "block";
      errorMsg.textContent = result.message || "Invalid email or password";
    }
  } catch (error) {
    console.error("Login error:", error);
    errorMsg.style.display = "block";
    errorMsg.textContent = "Server connection error";
  }
});


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
