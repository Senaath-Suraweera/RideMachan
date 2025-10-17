document.addEventListener("DOMContentLoaded", () => {
  // Navigation active state management
  const navLinks = document.querySelectorAll(".nav-link")

  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      

      // Remove active class from all nav items
      document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.remove("active")
      })

      // Add active class to clicked item
      this.parentElement.classList.add("active")
    })
  })
 
  // Stats cards animation on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1"
        entry.target.style.transform = "translateY(0)"
      }
    })
  }, observerOptions)

  // Observe stat cards
  document.querySelectorAll(".stat-card").forEach((card) => {
    card.style.opacity = "0"
    card.style.transform = "translateY(20px)"
    card.style.transition = "all 0.6s ease"
    observer.observe(card)
  })

  // Action items click handlers
  document.querySelectorAll(".action-item").forEach((item) => {
    item.addEventListener("click", function () {
      const title = this.querySelector(".action-title").textContent
      console.log(`[v0] Action clicked: ${title}`)

      // Add click animation
      this.style.transform = "translateX(5px) scale(0.98)"
      setTimeout(() => {
        this.style.transform = "translateX(5px)"
      }, 150)
    })
  })

  // Notification bell animation
  const notificationIcon = document.querySelector(".notification-icon")
  if (notificationIcon) {
    notificationIcon.addEventListener("click", function () {
      this.style.animation = "shake 0.5s ease-in-out"
      setTimeout(() => {
        this.style.animation = ""
      }, 500)
    })
  }

  // Button hover effects
  document.querySelectorAll(".btn-primary, .btn-secondary").forEach((btn) => {
    btn.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-2px)"
    })

    btn.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)"
    })
  })

  // Booking items hover effect
  document.querySelectorAll(".booking-item").forEach((item) => {
    item.addEventListener("mouseenter", function () {
      this.style.backgroundColor = "rgba(58, 12, 163, 0.02)"
      this.style.borderRadius = "8px"
      this.style.margin = "0 -8px"
      this.style.padding = "16px 8px"
    })

    item.addEventListener("mouseleave", function () {
      this.style.backgroundColor = ""
      this.style.borderRadius = ""
      this.style.margin = ""
      this.style.padding = "16px 0"
    })
  })
})

// Add shake animation for notification
const style = document.createElement("style")
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`
document.head.appendChild(style)






























document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".action-item").forEach((item) => {
    item.addEventListener("click", function () {
      const title = this.querySelector(".action-title").textContent
      console.log(`[v0] Action clicked: ${title}`)

      // Add click animation
      this.style.transform = "translateX(5px) scale(0.98)"
      setTimeout(() => {
        this.style.transform = "translateX(5px)"
      }, 150)

      // Redirect Add Driver
      if (title.trim() === "Add Driver") {
        window.location.href = "driver-management.html?openAddDriver=true";
      }
    })
  })
});

