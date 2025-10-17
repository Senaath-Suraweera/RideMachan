document.addEventListener("DOMContentLoaded", () => {
  // Profile form handling
  const profileForm = document.getElementById("profileForm")
  const saveBtn = document.querySelector(".save-changes-btn")

  // Handle form submission
  profileForm.addEventListener("submit", (e) => {
    e.preventDefault()

    // Add loading state
    profileForm.classList.add("form-saving")
    saveBtn.disabled = true

    // Simulate API call
    setTimeout(() => {
      // Remove loading state
      profileForm.classList.remove("form-saving")
      saveBtn.disabled = false

      // Show success message
      showNotification("Profile updated successfully!", "success")
    }, 2000)
  }) 

  // Handle profile picture update
  const updatePictureBtn = document.querySelector(".update-picture-btn")
  updatePictureBtn.addEventListener("click", () => {
    // Create file input
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = "image/*"

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0]
      if (file) {
        // Simulate file upload
        showNotification("Profile picture updated successfully!", "success")
      }
    })

    fileInput.click()
  })

  // Handle notification toggles
  const toggles = document.querySelectorAll('.toggle-switch input[type="checkbox"]')
  toggles.forEach((toggle) => {
    toggle.addEventListener("change", function () {
      const notificationName = this.id.replace(/([A-Z])/g, " $1").toLowerCase()
      const status = this.checked ? "enabled" : "disabled"
      showNotification(`${notificationName} notifications ${status}`, "info")
    })
  })

  // Notification system
  function showNotification(message, type = "info") {
    // Remove existing notifications
    const existingNotification = document.querySelector(".notification-toast")
    if (existingNotification) {
      existingNotification.remove()
    }

    // Create notification element
    const notification = document.createElement("div")
    notification.className = `notification-toast notification-${type}`
    notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === "success" ? "check-circle" : type === "error" ? "exclamation-circle" : "info-circle"}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `

    // Add styles
    notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6"};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 1rem;
            min-width: 300px;
            animation: slideIn 0.3s ease;
        `

    // Add animation keyframes
    if (!document.querySelector("#notification-styles")) {
      const style = document.createElement("style")
      style.id = "notification-styles"
      style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    flex: 1;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    opacity: 0.8;
                    transition: opacity 0.2s ease;
                }
                
                .notification-close:hover {
                    opacity: 1;
                }
            `
      document.head.appendChild(style)
    }

    // Add to page
    document.body.appendChild(notification)

    // Handle close button
    const closeBtn = notification.querySelector(".notification-close")
    closeBtn.addEventListener("click", () => {
      notification.remove()
    })

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove()
      }
    }, 5000)
  }

  // Form validation
  const inputs = document.querySelectorAll(".profile-form input")
  inputs.forEach((input) => {
    input.addEventListener("blur", function () {
      validateField(this)
    })

    input.addEventListener("input", function () {
      // Remove error state on input
      this.classList.remove("error")
      const errorMsg = this.parentNode.querySelector(".error-message")
      if (errorMsg) {
        errorMsg.remove()
      }
    })
  })

  function validateField(field) {
    const value = field.value.trim()
    let isValid = true
    let errorMessage = ""

    // Remove existing error
    field.classList.remove("error")
    const existingError = field.parentNode.querySelector(".error-message")
    if (existingError) {
      existingError.remove()
    }

    // Validation rules
    switch (field.type) {
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (value && !emailRegex.test(value)) {
          isValid = false
          errorMessage = "Please enter a valid email address"
        }
        break
      case "tel":
        const phoneRegex = /^[+]?[1-9][\d]{0,15}$/
        if (value && !phoneRegex.test(value.replace(/[-\s]/g, ""))) {
          isValid = false
          errorMessage = "Please enter a valid phone number"
        }
        break
      default:
        if (field.hasAttribute("required") && !value) {
          isValid = false
          errorMessage = "This field is required"
        }
    }

    if (!isValid) {
      field.classList.add("error")
      const errorDiv = document.createElement("div")
      errorDiv.className = "error-message"
      errorDiv.textContent = errorMessage
      errorDiv.style.cssText = `
                color: #ef4444;
                font-size: 0.75rem;
                margin-top: 0.25rem;
            `
      field.parentNode.appendChild(errorDiv)

      // Add error styles to input
      field.style.borderColor = "#ef4444"
    } else {
      field.style.borderColor = "#d1d5db"
    }

    return isValid
  }
})
