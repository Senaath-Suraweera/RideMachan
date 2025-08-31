// Mobile menu toggle
document.addEventListener("DOMContentLoaded", () => {
  // Smooth scrolling for navigation links
  const navLinks = document.querySelectorAll('a[href^="#"]')
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault()
      const targetId = this.getAttribute("href")
      const targetSection = document.querySelector(targetId)
      if (targetSection) {
        const headerHeight = document.querySelector(".header").offsetHeight
        const targetPosition = targetSection.offsetTop - headerHeight
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })
      }
    })
  })

  // Booking form submission
  const bookingForm = document.querySelector(".booking-form")
  if (bookingForm) {
    bookingForm.addEventListener("submit", (e) => {
      e.preventDefault()
      alert("Booking search functionality would be implemented here!")
    })
  }

  // CTA buttons
  const ctaButtons = document.querySelectorAll(".btn-primary")
  ctaButtons.forEach((button) => {
    if (
      button.textContent.includes("Book") ||
      button.textContent.includes("Start") ||
      button.textContent.includes("Search")
    ) {
      button.addEventListener("click", () => {
        alert("Booking system would be integrated here!")
      })
    }
  })

  // Partner registration buttons
  const partnerButtons = document.querySelectorAll(".btn-dark, .btn-primary")
  partnerButtons.forEach((button) => {
    if (button.textContent.includes("Register") || button.textContent.includes("List")) {
      button.addEventListener("click", () => {
        alert("Partner registration system would be implemented here!")
      })
    }
  })

  // Specific navigation functionality for main CTA buttons
  const bookRideBtn = document.getElementById("book-ride-btn")
  const becomePartnerBtn = document.getElementById("become-partner-btn")
  const startJourneyBtn = document.getElementById("start-journey-btn")
  const ctaStartJourneyBtn = document.getElementById("cta-start-journey")

  // Book Your Ride button - scroll to booking form
  if (bookRideBtn) {
    bookRideBtn.addEventListener("click", () => {
      const bookingCard = document.querySelector(".booking-card")
      if (bookingCard) {
        const headerHeight = document.querySelector(".header").offsetHeight
        const targetPosition = bookingCard.offsetTop - headerHeight - 20
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })
      }
    })
  }

  // Become a Partner button - scroll to partner network section
  if (becomePartnerBtn) {
    becomePartnerBtn.addEventListener("click", () => {
      const partnerSection = document.querySelector(".partner-network")
      if (partnerSection) {
        const headerHeight = document.querySelector(".header").offsetHeight
        const targetPosition = partnerSection.offsetTop - headerHeight
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })
      }
    })
  }

  // Start Your Journey buttons - scroll to booking form
  if (startJourneyBtn) {
    startJourneyBtn.addEventListener("click", () => {
      const bookingCard = document.querySelector(".booking-card")
      if (bookingCard) {
        const headerHeight = document.querySelector(".header").offsetHeight
        const targetPosition = bookingCard.offsetTop - headerHeight - 20
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })
      }
    })
  }

  if (ctaStartJourneyBtn) {
    ctaStartJourneyBtn.addEventListener("click", () => {
      const bookingCard = document.querySelector(".booking-card")
      if (bookingCard) {
        const headerHeight = document.querySelector(".header").offsetHeight
        const targetPosition = bookingCard.offsetTop - headerHeight - 20
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        })
      }
    })
  }

  // Header scroll effect
  window.addEventListener("scroll", () => {
    const header = document.querySelector(".header")
    if (window.scrollY > 100) {
      header.style.background = "rgba(14, 21, 43, 0.95)"
      header.style.backdropFilter = "blur(10px)"
    } else {
      header.style.background = "#0E152B"
      header.style.backdropFilter = "none"
    }
  })

  // Animate elements on scroll
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

  // Observe feature cards and step cards
  const animatedElements = document.querySelectorAll(".feature-card, .step-card, .partner-card")
  animatedElements.forEach((el) => {
    el.style.opacity = "0"
    el.style.transform = "translateY(20px)"
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease"
    observer.observe(el)
  })

  // Counter animation for stats
  const statNumbers = document.querySelectorAll(".stat-number")
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target
          const finalNumber = target.textContent
          const isPercentage = finalNumber.includes("%")
          const isPlus = finalNumber.includes("+")
          const numericValue = Number.parseInt(finalNumber.replace(/[^\d]/g, ""))

          let current = 0
          const increment = numericValue / 50
          const timer = setInterval(() => {
            current += increment
            if (current >= numericValue) {
              current = numericValue
              clearInterval(timer)
            }

            let displayValue = Math.floor(current).toString()
            if (isPlus) displayValue += "+"
            if (isPercentage) displayValue += "%"

            target.textContent = displayValue
          }, 30)

          statsObserver.unobserve(target)
        }
      })
    },
    { threshold: 0.5 },
  )

  statNumbers.forEach((stat) => {
    statsObserver.observe(stat)
  })

  // Form validation
  const inputs = document.querySelectorAll("input, select")
  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      if (this.hasAttribute("required") && !this.value) {
        this.style.borderColor = "#ef4444"
      } else {
        this.style.borderColor = "#ddd"
      }
    })
  })

  // Mobile responsiveness check
  function checkMobile() {
    const isMobile = window.innerWidth <= 768
    const heroButtons = document.querySelector(".hero-buttons")
    const heroFeatures = document.querySelector(".hero-features")

    if (isMobile) {
      if (heroButtons) {
        heroButtons.style.flexDirection = "column"
        heroButtons.style.gap = "1rem"
      }
      if (heroFeatures) {
        heroFeatures.style.flexDirection = "column"
        heroFeatures.style.gap = "1rem"
      }
    } else {
      if (heroButtons) {
        heroButtons.style.flexDirection = "row"
        heroButtons.style.gap = "1rem"
      }
      if (heroFeatures) {
        heroFeatures.style.flexDirection = "row"
        heroFeatures.style.gap = "2rem"
      }
    }
  }

  // Check on load and resize
  checkMobile()
  window.addEventListener("resize", checkMobile)

  // Add loading states to buttons
  function addLoadingState(button) {
    const originalText = button.textContent
    button.textContent = "Loading..."
    button.disabled = true

    setTimeout(() => {
      button.textContent = originalText
      button.disabled = false
    }, 2000)
  }

  // Apply loading states to form submissions
  const submitButtons = document.querySelectorAll('button[type="submit"]')
  submitButtons.forEach((button) => {
    button.addEventListener("click", function () {
      addLoadingState(this)
    })
  })
})

// Utility functions
function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  })
}

// Add scroll to top functionality
const scrollToTopBtn = document.createElement("button")
scrollToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>'
scrollToTopBtn.className = "scroll-to-top"
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
`

document.body.appendChild(scrollToTopBtn)

scrollToTopBtn.addEventListener("click", scrollToTop)

window.addEventListener("scroll", () => {
  if (window.scrollY > 500) {
    scrollToTopBtn.style.display = "flex"
    scrollToTopBtn.style.alignItems = "center"
    scrollToTopBtn.style.justifyContent = "center"
  } else {
    scrollToTopBtn.style.display = "none"
  }
})
