// Booking Management JavaScript
document.addEventListener("DOMContentLoaded", () => {
  // Initialize booking management functionality
  initializeBookingManagement()
})

function initializeBookingManagement() {
  // Search functionality
  const searchInput = document.getElementById("searchInput")
  const statusFilter = document.getElementById("statusFilter")
  const bookingsGrid = document.getElementById("bookingsGrid")

  // Search and filter functionality
  searchInput.addEventListener("input", filterBookings)
  statusFilter.addEventListener("change", filterBookings)

  // Add event listeners to booking action buttons
  addBookingActionListeners()

  // Initialize booking statistics
  updateBookingStatistics()
}

function filterBookings() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase()
  const statusFilter = document.getElementById("statusFilter").value
  const bookingCards = document.querySelectorAll(".booking-card")

  bookingCards.forEach((card) => {
    const bookingId = card.querySelector(".booking-id").textContent.toLowerCase()
    const customerName = card.querySelector(".customer-name").textContent.toLowerCase()
    const vehicleName = card.querySelector(".vehicle-name").textContent.toLowerCase()
    const status = card.dataset.status

    const matchesSearch =
      bookingId.includes(searchTerm) || customerName.includes(searchTerm) || vehicleName.includes(searchTerm)

    const matchesStatus = statusFilter === "all" || status === statusFilter

    if (matchesSearch && matchesStatus) {
      card.style.display = "block"
      card.style.animation = "fadeIn 0.3s ease"
    } else {
      card.style.display = "none"
    }
  })
}

function addBookingActionListeners() {
  // Message Customer buttons
  document.querySelectorAll(".booking-actions .editBookingBtn").forEach((button) => {
    if (button.textContent.includes("Message")) {
      button.addEventListener("click", function (e) {
        e.preventDefault()
        const bookingCard = this.closest(".booking-card")
        const customerName = bookingCard.querySelector(".customer-name").textContent
        const bookingId = bookingCard.querySelector(".booking-id").textContent

        showNotification(`Opening message dialog for ${customerName} (${bookingId})`, "info")
        // Here you would typically open a message modal or redirect to messaging system
      })
    }
  })

  // Call Customer buttons
  document.querySelectorAll(".booking-actions .editBookingBtn").forEach((button) => {
    if (button.textContent.includes("Call")) {
      button.addEventListener("click", function (e) {
        e.preventDefault()
        const bookingCard = this.closest(".booking-card")
        const customerPhone = bookingCard.querySelector(".customer-contact").textContent.trim()
        const customerName = bookingCard.querySelector(".customer-name").textContent

        showNotification(`Initiating call to ${customerName} at ${customerPhone}`, "info")
        // Here you would typically integrate with a calling system
      })
    }
  })

  // Edit Booking buttons
  document.querySelectorAll(".booking-actions .editBookingBtn").forEach((button) => {
    if (button.textContent.includes("Edit")) {
      button.addEventListener("click", function (e) {
        e.preventDefault()
        const bookingCard = this.closest(".booking-card")
        const bookingId = bookingCard.querySelector(".booking-id").textContent

        showNotification(`Opening edit dialog for ${bookingId}`, "info")
        // Here you would typically open an edit modal or redirect to edit page
      })
    }
  })

  // Confirm buttons (for pending bookings)
  document.querySelectorAll(".btn-success").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()
      const bookingCard = this.closest(".booking-card")
      const bookingId = bookingCard.querySelector(".booking-id").textContent

      if (confirm(`Are you sure you want to confirm ${bookingId}?`)) {
        confirmBooking(bookingCard, bookingId)
      }
    })
  })

  // Cancel buttons (for pending bookings)
  document.querySelectorAll(".btn-danger").forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault()
      const bookingCard = this.closest(".booking-card")
      const bookingId = bookingCard.querySelector(".booking-id").textContent

      if (confirm(`Are you sure you want to cancel ${bookingId}?`)) {
        cancelBooking(bookingCard, bookingId)
      }
    })
  })
}

function confirmBooking(bookingCard, bookingId) {
  // Update booking status to active
  const statusBadge = bookingCard.querySelector(".status-badge")
  statusBadge.textContent = "Active"
  statusBadge.className = "status-badge status-active"

  // Update payment status
  const paymentStatus = bookingCard.querySelector(".payment-status")
  paymentStatus.textContent = "Payment: Paid"
  paymentStatus.className = "payment-status paid"

  // Update data attribute
  bookingCard.dataset.status = "active"

  // Remove confirm/cancel buttons
  const confirmBtn = bookingCard.querySelector(".btn-success")
  const cancelBtn = bookingCard.querySelector(".btn-danger")
  if (confirmBtn) confirmBtn.remove()
  if (cancelBtn) cancelBtn.remove()

  // Show success notification
  showNotification(`${bookingId} has been confirmed successfully!`, "success")

  // Update statistics
  updateBookingStatistics()
}

function cancelBooking(bookingCard, bookingId) {
  // Update booking status to cancelled
  const statusBadge = bookingCard.querySelector(".status-badge")
  statusBadge.textContent = "Cancelled"
  statusBadge.className = "status-badge status-cancelled"

  // Update data attribute
  bookingCard.dataset.status = "cancelled"

  // Remove confirm/cancel buttons
  const confirmBtn = bookingCard.querySelector(".btn-success")
  const cancelBtn = bookingCard.querySelector(".btn-danger")
  if (confirmBtn) confirmBtn.remove()
  if (cancelBtn) cancelBtn.remove()

  // Show notification
  showNotification(`${bookingId} has been cancelled.`, "warning")

  // Update statistics
  updateBookingStatistics()
}

function updateBookingStatistics() {
  const bookingCards = document.querySelectorAll(".booking-card")
  const stats = {
    total: bookingCards.length,
    active: 0,
    pending: 0,
    completed: 0,
    cancelled: 0,
  }

  bookingCards.forEach((card) => {
    const status = card.dataset.status
    if (stats.hasOwnProperty(status)) {
      stats[status]++
    }
  })

  console.log("[v0] Booking Statistics Updated:", stats)
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `

  // Add notification styles
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.15);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-width: 300px;
        animation: slideInRight 0.3s ease;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
    `

  // Add to document
  document.body.appendChild(notification)

  // Add close functionality
  const closeBtn = notification.querySelector(".notification-close")
  closeBtn.addEventListener("click", () => {
    notification.style.animation = "slideOutRight 0.3s ease"
    setTimeout(() => notification.remove(), 300)
  })
 
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = "slideOutRight 0.3s ease"
      setTimeout(() => notification.remove(), 300)
    }
  }, 5000)
}

function getNotificationIcon(type) {
  const icons = {
    success: "check-circle",
    error: "exclamation-circle",
    warning: "exclamation-triangle",
    info: "info-circle",
  }
  return icons[type] || "info-circle"
}

function getNotificationColor(type) {
  const colors = {
    success: "linear-gradient(135deg, #48bb78, #38a169)",
    error: "linear-gradient(135deg, #f56565, #e53e3e)",
    warning: "linear-gradient(135deg, #ed8936, #dd6b20)",
    info: "linear-gradient(135deg, #3a0ca3, #4361ee)",
  }
  return colors[type] || colors.info
}

// Add CSS animations
const style = document.createElement("style")
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: background 0.2s ease;
    }
    
    .notification-close:hover {
        background: rgba(255,255,255,0.2);
    }
`
document.head.appendChild(style)



























// Booking Calendar Popup JS
document.addEventListener("DOMContentLoaded", () => {
  // Create Calendar Button Event
  const calendarBtn = document.querySelector(".btn.btn-secondary"); // your Calendar View button
  calendarBtn.addEventListener("click", () => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "calendarOverlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.6)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "9999";
    
    // Create popup container
    const popup = document.createElement("div");
    popup.id = "calendarPopup";
    popup.style.width = "90%";
    popup.style.maxWidth = "800px";
    popup.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    popup.style.borderRadius = "12px";
    popup.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)";
    popup.style.padding = "20px";
    popup.style.color = "#fff";
    popup.style.display = "flex";
    popup.style.flexDirection = "column";
    popup.style.gap = "15px";
    popup.style.animation = "popupFade 0.4s ease-out";

    // Create header
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";

    const title = document.createElement("h2");
    title.textContent = "Bookings Calendar";
    title.style.margin = "0";
    title.style.fontSize = "1.6rem";
    title.style.fontWeight = "600";
    title.style.color = "#fff";

    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.background = "transparent";
    closeBtn.style.border = "none";
    closeBtn.style.fontSize = "2rem";
    closeBtn.style.color = "#fff";
    closeBtn.style.cursor = "pointer";

    closeBtn.addEventListener("click", () => {
      overlay.remove();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);
    popup.appendChild(header);

    // Add calendar container
    const calendarContainer = document.createElement("div");
    calendarContainer.style.background = "#40ea08ff";
    calendarContainer.style.color = "#000";
    calendarContainer.style.borderRadius = "8px";
    calendarContainer.style.padding = "15px";
    calendarContainer.style.height = "400px";
    calendarContainer.style.overflowY = "auto";
    calendarContainer.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";




        // Create date picker inside the calendar container
    const dateLabel = document.createElement("label");
    dateLabel.textContent = "Select Date: ";
    dateLabel.style.display = "block";
    dateLabel.style.marginBottom = "10px";
    calendarContainer.appendChild(dateLabel);

    const dateInput = document.createElement("input");
    dateInput.type = "date";
    dateInput.style.padding = "5px";
    dateInput.style.borderRadius = "5px";
    dateInput.style.border = "1px solid #ccc";
    dateLabel.appendChild(dateInput);

    // Sample bookings (dummy data)
    const bookings = [
      { vehicle: "Car A", date: "2025-12-01", time: "09:00-11:00", bookedBy: "User1", status: "Confirmed" },
      { vehicle: "Car B", date: "2025-12-02", time: "12:00-14:00", bookedBy: "User2", status: "Pending" },
      { vehicle: "Car C", date: "2025-12-03", time: "10:00-12:00", bookedBy: "User3", status: "Confirmed" },
      { vehicle: "Car A", date: "2025-12-03", time: "14:00-16:00", bookedBy: "User4", status: "Cancelled" }
    ];

    // Function to render calendar with bookings
    function renderCalendar(selectedDate) {
      const existingContainer = document.getElementById("calendarContainer");
    if (existingContainer) existingContainer.remove();

    // Create calendar container
    const calendarContainer = document.createElement("div");
    calendarContainer.id = "calendarContainer";
    calendarContainer.style.background = "#40ea08ff";
    calendarContainer.style.color = "#000";
    calendarContainer.style.borderRadius = "8px";
    calendarContainer.style.padding = "15px";
    calendarContainer.style.height = "500px";
    calendarContainer.style.overflowY = "auto";
    calendarContainer.style.boxShadow = "0 4px 15px rgba(0,0,0,0.2)";
    document.body.appendChild(calendarContainer);


    }

    // Initial render (all days)
    renderCalendar();

    // Update calendar when date is selected
    dateInput.addEventListener("change", () => renderCalendar(dateInput.value));












    
    // Example colorful content (replace with real calendar later)
    for(let i = 1; i <= 31; i++){
        const dayBox = document.createElement("div");
        //dayBox.textContent = `December ${i} - Example Booking`;
        dayBox.style.padding = "8px";
        dayBox.style.marginBottom = "5px";
        dayBox.style.borderRadius = "5px";
        dayBox.style.background = i % 3 === 0 ? "#feca57" : i % 3 === 1 ? "#48dbfb" : "#1dd1a1";
        dayBox.style.color = "#fff";
        dayBox.style.fontWeight = "500";


        
        let timeHTML = `<strong>December ${i}</strong><br>`;

      // Loop for hourly slots from 08:00 to 18:00
      for (let h = 8; h < 18; h++) {
          const startHour = h.toString().padStart(2, "0") + ":00";
          const endHour = (h + 1).toString().padStart(2, "0") + ":00";

          timeHTML += `
              Vehicle: Car A<br>
              Time: ${startHour} - ${endHour}<br>
              Booked By: User1<br>
              Status: Confirmed<br>
              <hr style="border:0.5px solid #fff; margin:2px 0;">
          `;
      }

      dayBox.innerHTML = timeHTML;



        calendarContainer.appendChild(dayBox);
    }

    popup.appendChild(calendarContainer);
    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Animate popup fade
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes popupFade {
        0% { transform: scale(0.7); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Close popup when clicking outside
    overlay.addEventListener("click", (e) => {
      if(e.target === overlay){
        overlay.remove();
      }
    });
  });
});






















// NEW BOOKING POPUP
document.addEventListener("DOMContentLoaded", () => {
  const newBookingBtn = document.querySelector(".btn-primary"); // 'New Booking' button

  newBookingBtn.addEventListener("click", () => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.5)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "1000";

    // Create popup container
    const popup = document.createElement("div");
    popup.style.background = "#fff";
    popup.style.padding = "20px";
    popup.style.borderRadius = "8px";
    popup.style.width = "400px";
    popup.style.maxHeight = "80%";
    popup.style.overflowY = "auto";
    popup.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)";
    popup.style.animation = "popupFade 0.3s ease";

    // Popup header
    const header = document.createElement("h2");
    header.textContent = "New Booking";
    header.style.marginBottom = "15px";
    popup.appendChild(header);

    // Form fields
    const formFields = [
      { label: "Customer Name", type: "text", id: "customerName" },
      { label: "Customer Contact", type: "text", id: "customerContact" },
      { label: "Customer Email", type: "email", id: "customerEmail" },
      { label: "Vehicle", type: "text", id: "vehicle" },
      { label: "Driver", type: "text", id: "driver" },
      { label: "Trip Date", type: "date", id: "tripDate" },
      { label: "Start Time", type: "time", id: "startTime" },
      { label: "End Time", type: "time", id: "endTime" },
      { label: "Status", type: "select", id: "status", options: ["Confirmed", "Pending", "Cancelled"] }
    ];

    formFields.forEach(field => {
      const fieldWrapper = document.createElement("div");
      fieldWrapper.style.marginBottom = "10px";

      const label = document.createElement("label");
      label.textContent = field.label;
      label.style.display = "block";
      label.style.marginBottom = "5px";

      let input;
      if (field.type === "select") {
        input = document.createElement("select");
        field.options.forEach(opt => {
          const option = document.createElement("option");
          option.value = opt.toLowerCase();
          option.textContent = opt;
          input.appendChild(option);
        });
      } else {
        input = document.createElement("input");
        input.type = field.type;
      }

      input.id = field.id;
      input.style.width = "100%";
      input.style.padding = "6px 8px";
      input.style.border = "1px solid #ccc";
      input.style.borderRadius = "4px";

      fieldWrapper.appendChild(label);
      fieldWrapper.appendChild(input);
      popup.appendChild(fieldWrapper);
    });

    // Buttons
    const btnWrapper = document.createElement("div");
    btnWrapper.style.display = "flex";
    btnWrapper.style.justifyContent = "flex-end";
    btnWrapper.style.marginTop = "15px";
    btnWrapper.style.gap = "10px";

    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";
    saveBtn.className = "btn btn-primary";
    saveBtn.style.cursor = "pointer";

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Cancel";
    cancelBtn.className = "btn btn-secondary";
    cancelBtn.style.cursor = "pointer";

    btnWrapper.appendChild(cancelBtn);
    btnWrapper.appendChild(saveBtn);
    popup.appendChild(btnWrapper);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Animate popup
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes popupFade {
        0% { transform: scale(0.7); opacity: 0; }
        100% { transform: scale(1); opacity: 1; }
      }
    `;
    document.head.appendChild(style);

    // Close popup
    cancelBtn.addEventListener("click", () => overlay.remove());
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Save booking (dummy alert)
    saveBtn.addEventListener("click", () => {
      const bookingData = {};
      formFields.forEach(f => {
        bookingData[f.id] = document.getElementById(f.id).value;
      });
      console.log("New Booking:", bookingData);
      alert("Booking saved! Check console for data.");
      overlay.remove();
    });
  });
});

































document.addEventListener("DOMContentLoaded", () => {
  const editButtons = document.querySelectorAll(".booking-card .editBookingBtn"); // all edit buttons

  editButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const bookingCard = btn.closest(".booking-card"); // get the card
      if (!bookingCard) return;

      // Extract existing booking data
      const bookingData = {
        customerName: bookingCard.querySelector(".customer-name").textContent,
        customerContact: bookingCard.querySelector(".customer-contact").textContent.replace(/[^+\d]/g, ""),
        customerEmail: bookingCard.querySelector(".customer-email").textContent,
        vehicle: bookingCard.querySelector(".vehicle-name").textContent,
        driver: bookingCard.querySelector(".driver-name").textContent.replace("Driver: ", ""),
        tripDate: bookingCard.querySelector(".trip-date").textContent.split(" - ")[0], // start date
        startTime: bookingCard.querySelector(".trip-time").textContent.split(" - ")[0],
        endTime: bookingCard.querySelector(".trip-time").textContent.split(" - ")[1],
        status: bookingCard.dataset.status
      };

      // Create overlay
      const overlay = document.createElement("div");
      overlay.style.cssText = `
        position: fixed; top:0; left:0; width:100%; height:100%;
        background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000;
      `;

      // Create popup container
      const popup = document.createElement("div");
      popup.style.cssText = `
        background:#fff; padding:20px; border-radius:8px;
        width:400px; max-height:80%; overflow-y:auto; box-shadow:0 4px 20px rgba(0,0,0,0.3);
      `;

      const header = document.createElement("h2");
      header.textContent = "Edit Booking";
      header.style.marginBottom = "15px";
      popup.appendChild(header);

      // Form fields
      const formFields = [
        
        { label: "Vehicle", type: "text", id: "vehicle" },
        { label: "Driver", type: "text", id: "driver" },
        { label: "Trip Date", type: "date", id: "tripDate" },
        { label: "Start Time", type: "time", id: "startTime" },
        { label: "End Time", type: "time", id: "endTime" },
        { label: "Status", type: "select", id: "status", options: ["active","Picked up", "On going","completed","cancelled"] }
      ];

      formFields.forEach(f => {
        const wrapper = document.createElement("div");
        wrapper.style.marginBottom = "10px";

        const label = document.createElement("label");
        label.textContent = f.label;
        label.style.display = "block";
        label.style.marginBottom = "5px";

        let input;
        if (f.type === "select") {
          input = document.createElement("select");
          f.options.forEach(opt => {
            const option = document.createElement("option");
            option.value = opt;
            option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1);
            input.appendChild(option);
          });
        } else {
          input = document.createElement("input");
          input.type = f.type;
        }

        input.id = f.id;
        input.style.cssText = "width:100%; padding:6px 8px; border:1px solid #ccc; border-radius:4px;";
        input.value = bookingData[f.id] || "";
        wrapper.appendChild(label);
        wrapper.appendChild(input);
        popup.appendChild(wrapper);
      });

      // Buttons
      const btnWrapper = document.createElement("div");
      btnWrapper.style.cssText = "display:flex; justify-content:flex-end; margin-top:15px; gap:10px;";

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.className = "btn btn-primary";
      saveBtn.style.cursor = "pointer";

      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.className = "btn btn-secondary";
      cancelBtn.style.cursor = "pointer";

      btnWrapper.appendChild(cancelBtn);
      btnWrapper.appendChild(saveBtn);
      popup.appendChild(btnWrapper);
      overlay.appendChild(popup);
      document.body.appendChild(overlay);

      // Close popup
      cancelBtn.addEventListener("click", () => overlay.remove());
      overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });

      // Save edited booking (dummy)
      saveBtn.addEventListener("click", () => {
        const updatedData = {};
        formFields.forEach(f => {
          updatedData[f.id] = document.getElementById(f.id).value;
        });
        console.log("Updated Booking:", updatedData);
        alert("Booking updated! Check console for data.");
        overlay.remove();
      });
    });
  });
});






















