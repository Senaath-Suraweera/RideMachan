console.log("🚀 script.js loaded successfully!");

document.addEventListener("DOMContentLoaded", () => {
  // ==========================
  // Login Popup Functionality
  // ==========================
  const loginPopup = document.getElementById("loginPopup");
  const popupOverlay = document.getElementById("popupOverlay");
  const closePopup = document.getElementById("closePopup");

  const showLoginPopup = () => {
    if (loginPopup) {
      loginPopup.style.display = "flex";
      document.body.style.overflow = "hidden";
      popupOverlay?.classList.add("active");
    }
  };

  const hideLoginPopup = () => {
    if (loginPopup) {
      loginPopup.style.display = "none";
      document.body.style.overflow = "auto";
      popupOverlay?.classList.remove("active");
    }
  };

  closePopup?.addEventListener("click", hideLoginPopup);
  popupOverlay?.addEventListener("click", hideLoginPopup);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && loginPopup?.style.display === "flex")
      hideLoginPopup();
  });

  // ==========================
  // Smooth Scrolling
  // ==========================
  const navLinks = document.querySelectorAll('a[href^="#"]');
  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        const header = document.querySelector(".header");
        const offset = header ? header.offsetHeight : 0;
        window.scrollTo({
          top: targetSection.offsetTop - offset,
          behavior: "smooth",
        });
      }
    });
  });

  // ==========================
  // Hero Buttons
  // ==========================
  document
    .getElementById("book-ride-btn")
    ?.addEventListener("click", showLoginPopup);
  document
    .getElementById("start-journey-btn")
    ?.addEventListener("click", (e) => {
      e.preventDefault();
      window.location.href = "customer_sign-in.html";
    });
  document
    .getElementById("cta-start-journey")
    ?.addEventListener("click", () => {
      window.location.href = "customer_sign-in.html";
    });

  // ==========================
  // Partner Navigation
  // ==========================
  const scrollToPartner = () => {
    const partnerSection = document.querySelector(".partner-network");
    if (partnerSection) {
      const header = document.querySelector(".header");
      const offset = header ? header.offsetHeight : 0;
      window.scrollTo({
        top: partnerSection.offsetTop - offset,
        behavior: "smooth",
      });
    }
  };

  document
    .getElementById("become-partner-btn")
    ?.addEventListener("click", scrollToPartner);
  document
    .getElementById("start-partnership-btn")
    ?.addEventListener("click", scrollToPartner);
  document
    .querySelector(".partner-card .btn-dark")
    ?.addEventListener("click", () => {
      window.location.href = "company_sign-in.html";
    });
  const listVehicleBtn = document.querySelector(".partner-card .btn-primary");
  if (listVehicleBtn && listVehicleBtn.textContent.includes("List")) {
    listVehicleBtn.addEventListener("click", () => {
      window.location.href = "individual_renters_sign-in.html";
    });
  }

  // ==========================
  // Header Scroll Effect
  // ==========================
  window.addEventListener("scroll", () => {
    const header = document.querySelector(".header");
    if (!header) return;
    if (window.scrollY > 100) {
      header.style.background = "rgba(14, 21, 43, 0.95)";
      header.style.backdropFilter = "blur(10px)";
    } else {
      header.style.background = "#0E152B";
      header.style.backdropFilter = "none";
    }
  });

  // ==========================
  // Scroll Animations
  // ==========================
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
  );

  const animatedElements = document.querySelectorAll(
    ".feature-card, .step-card, .partner-card"
  );
  animatedElements.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(20px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });

  // ==========================
  // Stat Number Animation
  // ==========================
  const statNumbers = document.querySelectorAll(".stat-number");
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const finalValue = el.textContent;
          const isPercent = finalValue.includes("%");
          const isPlus = finalValue.includes("+");
          const numericValue = parseInt(finalValue.replace(/[^\d]/g, ""), 10);
          let current = 0;
          const increment = numericValue / 50;

          const counter = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
              current = numericValue;
              clearInterval(counter);
            }
            let display = Math.floor(current);
            if (isPlus) display += "+";
            if (isPercent) display += "%";
            el.textContent = display;
          }, 30);

          statsObserver.unobserve(el);
        }
      });
    },
    { threshold: 0.5 }
  );
  statNumbers.forEach((el) => statsObserver.observe(el));

  // 💥 REMOVED THE CONFLICTING addLoadingState FUNCTION AND ITS LISTENER 💥

  // ==========================
  // Field Validation
  // ==========================
  document
    .querySelectorAll("input[required], select[required]")
    .forEach((input) => {
      input.addEventListener("blur", function () {
        this.style.borderColor = this.value ? "#ddd" : "#ef4444";
      });
    });

  // ==========================
  // Responsive Hero Layout
  // ==========================
  function adjustHeroLayout() {
    const isMobile = window.innerWidth <= 768;
    const heroButtons = document.querySelector(".hero-buttons");
    const heroFeatures = document.querySelector(".hero-features");

    if (heroButtons) {
      heroButtons.style.flexDirection = isMobile ? "column" : "row";
      heroButtons.style.gap = "1rem";
    }
    if (heroFeatures) {
      heroFeatures.style.flexDirection = isMobile ? "column" : "row";
      heroFeatures.style.gap = isMobile ? "1rem" : "2rem";
    }
  }
  adjustHeroLayout();
  window.addEventListener("resize", adjustHeroLayout);

  // ==========================
  // Customer Login Integration (Fixed)
  // ==========================
  const customerLoginForm = document.getElementById("customerLoginForm");

  if (customerLoginForm) {
    customerLoginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("🔵 Login form submitted");

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();

      let errorMsg = document.getElementById("loginError");
      if (!errorMsg) {
        errorMsg = document.createElement("div");
        errorMsg.id = "loginError";
        errorMsg.style.cssText =
          "color: #ef4444; margin-bottom: 1rem; display: none; padding: 0.5rem; background: #fee2e2; border-radius: 4px; font-size: 0.9rem;";
        customerLoginForm.insertBefore(errorMsg, customerLoginForm.firstChild);
      }
      errorMsg.style.display = "none";

      if (!email || !password) {
        errorMsg.textContent = "Please enter both email and password.";
        errorMsg.style.display = "block";
        return;
      }

      const submitBtn = customerLoginForm.querySelector(
        'button[type="submit"]'
      );
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Logging in...";
      submitBtn.disabled = true;

      const bodyData = new URLSearchParams();
      bodyData.append("email", email);
      bodyData.append("password", password);

      console.log("📤 Sending request to backend...");

      try {
        // We use fetch with credentials: 'include' to handle the session/cookie
        const response = await fetch("http://localhost:8080/customer/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: bodyData,
          credentials: "include",
        });

        console.log("📥 Response received:", response);

        // ✅ Backend is configured to send a redirect on success (302)
        if (response.redirected) {
          console.log("✅ Redirect detected:", response.url);
          // Allow the browser to follow the redirect, navigating to home.html
          window.location.href = response.url;
          return;
        }

        // ✅ If response.ok (e.g., a 200 status) but no redirect was followed,
        // we assume success and manually redirect to the expected home page.
        if (response.ok) {
          console.log("✅ Login successful — redirecting manually");
          window.location.href =
            "http://localhost:8080/views/customer/pages/home.html";
          return;
        }

        // ❌ If failed (e.g., server returned a 401 or similar status)
        console.log("❌ Login failed (Invalid credentials)");
        errorMsg.textContent = "Invalid email or password.";
        errorMsg.style.display = "block";
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;

        // Hide popup if the server redirected to the landing page with the error query parameter
        if (response.url.includes("error=invalid")) {
          hideLoginPopup();
        }
      } catch (error) {
        // 💥 Handle network/server connection errors
        console.error("💥 Fetch error:", error);
        errorMsg.textContent = "Server connection failed. Please try again.";
        errorMsg.style.display = "block";
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  // ==========================
  // Auto Show Login Popup if ?error=invalid
  // ==========================
  if (window.location.search.includes("error=invalid")) {
    showLoginPopup(); // Use the existing function to show it
    // Optional: show a message inside the popup as well
    let errorMsg = document.getElementById("loginError");
    if (errorMsg) {
      errorMsg.textContent = "Login failed. Invalid email or password.";
      errorMsg.style.display = "block";
    }
  }
});

// ==========================
// Scroll-to-Top Button
// ==========================
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

const scrollToTopBtn = document.createElement("button");
scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
scrollToTopBtn.className = "scroll-to-top";
scrollToTopBtn.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 50px;
  height: 50px;
  background: #fbbf24;
  color: #0E152B;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: none;
  z-index: 1000;
  transition: all 0.3s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  align-items: center;
  justify-content: center;
`;

document.body.appendChild(scrollToTopBtn);
scrollToTopBtn.addEventListener("click", scrollToTop);

window.addEventListener("scroll", () => {
  scrollToTopBtn.style.display = window.scrollY > 500 ? "flex" : "none";
});

// ==========================
// Vehicle Provider Signup Only
// ==========================
document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("providerSignupForm");

  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(signupForm);

      // Force companyid = 1
      formData.append("companyid", "1");

      const responseBox = document.getElementById("signupResponse");
      responseBox.textContent = "Registering...";
      responseBox.style.color = "#555";

      try {
        const res = await fetch("http://localhost:8080/provider/signup", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (data.status === "success") {
          responseBox.textContent = "✅ Registration successful!";
          responseBox.style.color = "green";
          signupForm.reset();
        } else {
          responseBox.textContent = "❌ " + data.message;
          responseBox.style.color = "red";
        }
      } catch (err) {
        responseBox.textContent = "Server error: " + err.message;
        responseBox.style.color = "red";
      }
    });
  }
});
