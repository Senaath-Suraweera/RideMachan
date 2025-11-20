// API Configuration
const API_BASE_URL = "http://localhost:8080/maintenance"; // Adjust this to your backend URL
const MAINTENANCE_STAFF_ID = 3; // Hardcoded session staff ID

// Calendar variables
let currentDate = new Date();
let selectedDate = null;
let maintenanceData = {}; // Will be populated from backend

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  initializeCalendar();
  setupEventListeners();
  setupUserMenu();
  setupSearch();
  setupModal();
});

// Initialize calendar
async function initializeCalendar() {
  await loadMonthEvents();
  await displayTodaysTasks();
  updateCurrentMonthDisplay();
}

// Load events from backend for current month
async function loadMonthEvents() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${lastDay}`;

  try {
    const response = await fetch(
      `${API_BASE_URL}/listEvents?startDate=${startDate}&endDate=${endDate}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch events");
    }

    const data = await response.json();

    // Check if response is an error
    if (data.status === "error") {
      console.error("API Error:", data.message);
      maintenanceData = {};
      return;
    }

    // Store the events data
    maintenanceData = data;

    // Render the calendar with the new data
    renderCalendar();
  } catch (error) {
    console.error("Error loading events:", error);
    maintenanceData = {};
  }
}

// Render calendar dates
function renderCalendar() {
  const calendarDates = document.getElementById("calendarDates");
  calendarDates.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const prevLastDay = new Date(year, month, 0);

  const firstDayIndex = firstDay.getDay();
  const lastDateNum = lastDay.getDate();
  const prevLastDateNum = prevLastDay.getDate();
  const nextDays = 7 - lastDay.getDay() - 1;

  // Previous month days
  for (let i = firstDayIndex; i > 0; i--) {
    const dateCell = createDateCell(
      prevLastDateNum - i + 1,
      year,
      month - 1,
      "prev-month"
    );
    calendarDates.appendChild(dateCell);
  }

  // Current month days
  for (let i = 1; i <= lastDateNum; i++) {
    const dateCell = createDateCell(i, year, month, "current-month");
    calendarDates.appendChild(dateCell);
  }

  // Next month days
  for (let i = 1; i <= nextDays; i++) {
    const dateCell = createDateCell(i, year, month + 1, "next-month");
    calendarDates.appendChild(dateCell);
  }
}

// Create a date cell
function createDateCell(day, year, month, className) {
  const dateCell = document.createElement("div");
  dateCell.classList.add("date-cell", className);

  const dateString = formatDateString(year, month, day);
  const today = formatDateString(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );

  if (dateString === today && className === "current-month") {
    dateCell.classList.add("current-day");
  }

  const dateNumber = document.createElement("div");
  dateNumber.classList.add("date-number");
  dateNumber.textContent = day;
  dateCell.appendChild(dateNumber);

  // Add events for this date
  if (maintenanceData[dateString] && maintenanceData[dateString].length > 0) {
    const eventsContainer = document.createElement("div");
    eventsContainer.classList.add("date-events");

    maintenanceData[dateString].forEach((event) => {
      const eventIndicator = document.createElement("div");
      eventIndicator.classList.add("event-indicator", event.status);
      eventIndicator.textContent = event.vehicleId;
      eventIndicator.addEventListener("click", (e) => {
        e.stopPropagation();
        showVehicleDetails(event);
      });
      eventsContainer.appendChild(eventIndicator);
    });

    dateCell.appendChild(eventsContainer);
  }

  // Click handler for the date
  dateCell.addEventListener("click", () => {
    if (className !== "current-month") {
      // Navigate to that month
      if (className === "prev-month") {
        currentDate.setMonth(currentDate.getMonth() - 1);
      } else {
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      loadMonthEvents();
      updateCurrentMonthDisplay();
    }
    selectDate(dateString);
  });

  return dateCell;
}

// Format date string (YYYY-MM-DD)
function formatDateString(year, month, day) {
  const m = month + 1;
  const d = day;
  return `${year}-${m.toString().padStart(2, "0")}-${d
    .toString()
    .padStart(2, "0")}`;
}

// Update current month display
function updateCurrentMonthDisplay() {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const monthDisplay = document.getElementById("currentMonth");
  monthDisplay.textContent = `${
    monthNames[currentDate.getMonth()]
  } ${currentDate.getFullYear()}`;
}

// Select a date
function selectDate(dateString) {
  selectedDate = dateString;
}

// Display today's tasks
async function displayTodaysTasks() {
  const today = formatDateString(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );

  // Update date display
  const todayDateSpan = document.getElementById("todayDate");
  const dateObj = new Date();
  todayDateSpan.textContent = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  try {
    // Fetch today's events from backend
    const response = await fetch(`${API_BASE_URL}/listEvents?date=${today}`);

    if (!response.ok) {
      throw new Error("Failed to fetch today's tasks");
    }

    const todayTasks = await response.json();

    // Check for API error
    if (todayTasks.status === "error") {
      console.error("API Error:", todayTasks.message);
      displayEmptyTasks();
      return;
    }

    const tasksList = document.getElementById("todayTasksList");

    // Update stats
    const scheduledCount = todayTasks.filter(
      (t) => t.status === "scheduled"
    ).length;
    const progressCount = todayTasks.filter(
      (t) => t.status === "in-progress"
    ).length;
    const completedCount = todayTasks.filter(
      (t) => t.status === "completed"
    ).length;

    document.getElementById("scheduledCount").textContent = scheduledCount;
    document.getElementById("progressCount").textContent = progressCount;
    document.getElementById("completedCount").textContent = completedCount;

    // Display tasks
    tasksList.innerHTML = "";
    if (todayTasks.length === 0) {
      displayEmptyTasks();
    } else {
      todayTasks.forEach((task) => {
        tasksList.appendChild(createTaskCard(task));
      });
    }
  } catch (error) {
    console.error("Error loading today's tasks:", error);
    displayEmptyTasks();
  }
}

// Display empty tasks message
function displayEmptyTasks() {
  const tasksList = document.getElementById("todayTasksList");
  tasksList.innerHTML = `
    <div style="text-align: center; padding: 40px; color: var(--muted-foreground); grid-column: 1 / -1;">
      <i class="fas fa-calendar-check" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
      <p>No appointments scheduled for today</p>
    </div>
  `;

  // Update stats to zero
  document.getElementById("scheduledCount").textContent = 0;
  document.getElementById("progressCount").textContent = 0;
  document.getElementById("completedCount").textContent = 0;
}

// Create task card
function createTaskCard(task) {
  const card = document.createElement("div");
  card.classList.add("task-card", task.status);
  card.addEventListener("click", () => showVehicleDetails(task));

  card.innerHTML = `
    <div class="task-card-header">
      <div class="task-time">
        <i class="fas fa-clock"></i>
        <span>${task.time}</span>
      </div>
      <span class="task-status ${task.status}">
        ${task.status.replace("-", " ")}
      </span>
    </div>
    <div class="task-vehicle">${task.vehicleId}</div>
    <div class="task-service">${task.service}</div>
    <div class="task-bay">
      <i class="fas fa-warehouse"></i>
      ${task.bay}
    </div>
  `;

  return card;
}

// Show vehicle details in panel
function showVehicleDetails(appointment) {
  const panel = document.getElementById("vehicleDetailsPanel");
  const content = document.getElementById("panelContent");

  content.innerHTML = `
    <div class="vehicle-info-content">
      <div class="status-large ${appointment.status}">
        ${appointment.status.replace("-", " ")}
      </div>

      <div class="vehicle-header">
        <div class="vehicle-icon-large">
          <i class="fas fa-car"></i>
        </div>
        <div>
          <div class="vehicle-id-large">${appointment.vehicleId}</div>
          <div class="vehicle-model">${appointment.model}</div>
        </div>
      </div>

      <div class="appointment-details-section">
        <div class="section-title">
          <i class="fas fa-info-circle"></i>
          Appointment Details
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Time</span>
          <span class="detail-value">${appointment.time}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Bay</span>
          <span class="detail-value">${appointment.bay}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Duration</span>
          <span class="detail-value">${appointment.estimatedDuration}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">Technician</span>
          <span class="detail-value">${appointment.assignedTechnician}</span>
        </div>
      </div>

      <div class="appointment-details-section">
        <div class="section-title">
          <i class="fas fa-wrench"></i>
          Service Type
        </div>
        <div class="description-box">
          <strong>${appointment.service}</strong>
        </div>
      </div>

      <div class="appointment-details-section">
        <div class="section-title">
          <i class="fas fa-clipboard"></i>
          Description
        </div>
        <div class="description-box">
          ${appointment.description}
        </div>
      </div>

      <div class="action-buttons">
        ${
          appointment.status === "scheduled"
            ? `<button class="btn btn-success" onclick="updateStatus(${appointment.id}, 'in-progress')">
                <i class="fas fa-play"></i> Start Service
               </button>`
            : ""
        }
        ${
          appointment.status === "in-progress"
            ? `<button class="btn btn-success" onclick="updateStatus(${appointment.id}, 'completed')">
                <i class="fas fa-check"></i> Mark Complete
               </button>`
            : ""
        }
        <button class="btn btn-secondary" onclick="editAppointment(${
          appointment.id
        })">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-danger" onclick="deleteAppointment(${
          appointment.id
        })">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `;

  // Scroll to panel on mobile
  if (window.innerWidth <= 1200) {
    panel.scrollIntoView({ behavior: "smooth" });
  }
}

// Update appointment status
async function updateStatus(appointmentId, newStatus) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/updateEvent?updateType=status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `eventid=${appointmentId}&status=${newStatus}`,
      }
    );

    const result = await response.json();

    if (result.status === "success") {
      // Show success message
      showNotification("Status updated successfully!", "success");

      // Refresh displays
      await loadMonthEvents();
      await displayTodaysTasks();

      // Update the detail panel with new status
      const event = await getEventById(appointmentId);
      if (event) {
        showVehicleDetails(event);
      }
    } else {
      showNotification("Failed to update status: " + result.message, "error");
    }
  } catch (error) {
    console.error("Error updating status:", error);
    showNotification("Error updating status", "error");
  }
}

// Get event by ID
async function getEventById(eventId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/listEvents?eventId=${eventId}`
    );
    const event = await response.json();

    if (event.status === "error") {
      return null;
    }

    return event;
  } catch (error) {
    console.error("Error fetching event:", error);
    return null;
  }
}

// Delete appointment
async function deleteAppointment(appointmentId) {
  if (!confirm("Are you sure you want to delete this appointment?")) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/deleteEvent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `eventid=${appointmentId}`,
    });

    const result = await response.json();

    if (result.status === "success") {
      showNotification("Appointment deleted successfully!", "success");

      // Close the detail panel
      closeDetailPanel();

      // Refresh displays
      await loadMonthEvents();
      await displayTodaysTasks();
    } else {
      showNotification(
        "Failed to delete appointment: " + result.message,
        "error"
      );
    }
  } catch (error) {
    console.error("Error deleting appointment:", error);
    showNotification("Error deleting appointment", "error");
  }
}

// Edit appointment (opens modal with data)
async function editAppointment(appointmentId) {
  try {
    const event = await getEventById(appointmentId);

    if (!event) {
      showNotification("Event not found", "error");
      return;
    }

    // Open modal with event data
    const modal = document.getElementById("addEventModal");
    modal.classList.add("active");

    // Fill form with existing data
    // Extract only YYYY-MM-DD if scheduled_date includes time
    const dateOnly = event.scheduled_date
      ? event.scheduled_date.split(" ")[0]
      : "";
    document.getElementById("eventDate").value = dateOnly;

    // Extract only HH:MM if time contains seconds
    const timeOnly = event.scheduled_time
      ? event.scheduled_time.substring(0, 5)
      : "";
    document.getElementById("eventTime").value = timeOnly;

    document.getElementById("vehicleId").value = event.vehicle_id;
    document.getElementById("vehicleModel").value = event.model;
    document.getElementById("serviceBay").value = event.bay;
    document.getElementById("estimatedDuration").value =
      event.estimatedDuration;
    document.getElementById("serviceType").value = event.service;
    document.getElementById("technician").value = event.assignedTechnician;
    document.getElementById("description").value = event.description;

    // Store event ID for update
    document.getElementById("addEventForm").dataset.editingId = appointmentId;

    // Change modal title
    document.querySelector(".modal-header h2").innerHTML =
      '<i class="fas fa-edit"></i> Edit Appointment';
  } catch (error) {
    console.error("Error loading event for edit:", error);
    showNotification("Error loading event details", "error");
  }
}

// Close detail panel
function closeDetailPanel() {
  const content = document.getElementById("panelContent");
  content.innerHTML = `
    <div class="empty-state">
      <i class="fas fa-car"></i>
      <p>Select an appointment to view vehicle details</p>
    </div>
  `;
}

// Setup event listeners
function setupEventListeners() {
  // Month navigation
  document.getElementById("prevMonth").addEventListener("click", async () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    await loadMonthEvents();
    updateCurrentMonthDisplay();
  });

  document.getElementById("nextMonth").addEventListener("click", async () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    await loadMonthEvents();
    updateCurrentMonthDisplay();
  });

  // Close panel button
  document
    .getElementById("closePanel")
    .addEventListener("click", closeDetailPanel);
}

// Setup modal functionality
function setupModal() {
  const modal = document.getElementById("addEventModal");
  const addEventBtn = document.getElementById("addEventBtn");
  const closeModalBtn = document.getElementById("closeModal");
  const cancelBtn = document.getElementById("cancelBtn");
  const form = document.getElementById("addEventForm");

  // Open modal
  addEventBtn.addEventListener("click", () => {
    modal.classList.add("active");
    form.reset();
    delete form.dataset.editingId;

    // Reset modal title
    document.querySelector(".modal-header h2").innerHTML =
      '<i class="fas fa-calendar-plus"></i> Add New Appointment';

    // Set default date to today or selected date
    const dateInput = document.getElementById("eventDate");
    if (selectedDate) {
      dateInput.value = selectedDate;
    } else {
      const today = new Date().toISOString().split("T")[0];
      dateInput.value = today;
    }
  });

  // Close modal functions
  const closeModal = () => {
    modal.classList.remove("active");
    form.reset();
    delete form.dataset.editingId;

    // Reset modal title
    document.querySelector(".modal-header h2").innerHTML =
      '<i class="fas fa-calendar-plus"></i> Add New Appointment';
  };

  closeModalBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  // Close modal when clicking outside
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Handle form submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get form values
    const formData = new FormData(form);
    const isEditing = form.dataset.editingId;

    const eventData = {
      vehicle_id: 18,
      service_type: formData.get("serviceType"),
      status: "scheduled",
      description: formData.get("description"),
      maintenance_id: MAINTENANCE_STAFF_ID,
      scheduled_date: formData.get("eventDate"),
      scheduled_time: formData.get("eventTime"),
      service_bay: formData.get("serviceBay"),
      estimated_duration: formData.get("estimatedDuration"),
      assigned_technician: formData.get("technician"),
    };

    try {
      let response;

      if (isEditing) {
        // Update existing event
        eventData.eventid = parseInt(isEditing);

        response = await fetch(`${API_BASE_URL}/updateEvent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        });
      } else {
        // Create new event
        response = await fetch(`${API_BASE_URL}/addEvent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(eventData),
        });
      }

      const result = await response.json();

      if (result.status === "success") {
        showNotification(
          isEditing
            ? "Appointment updated successfully!"
            : "Appointment added successfully!",
          "success"
        );

        // Close modal
        closeModal();

        // Refresh displays
        await loadMonthEvents();
        await displayTodaysTasks();
      } else {
        showNotification(
          "Failed to save appointment: " + result.message,
          "error"
        );
      }
    } catch (error) {
      console.error("Error saving appointment:", error);
      showNotification("Error saving appointment", "error");
    }
  });
}

// Show notification
function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <i class="fas fa-${
      type === "success" ? "check-circle" : "exclamation-circle"
    }"></i>
    <span>${message}</span>
  `;

  // Add to body
  document.body.appendChild(notification);

  // Show notification
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

// Setup user menu
function setupUserMenu() {
  const userProfile = document.querySelector(".user-profile");

  if (!userProfile) return;

  const dropdownMenu = document.createElement("div");
  dropdownMenu.style.cssText = `
    position: absolute; top: 60px; right: 0;
    background-color: #fff; border: 1px solid #ccc;
    border-radius: 5px; width: 150px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    display: none; z-index: 1000;
    font-family: sans-serif;
  `;

  const profileItem = document.createElement("div");
  profileItem.textContent = "Profile";
  profileItem.style.cssText = "padding: 10px; cursor: pointer;";
  profileItem.addEventListener("click", () => {
    window.location.href = "staffprofile.html";
  });
  dropdownMenu.appendChild(profileItem);

  const logoutItem = document.createElement("div");
  logoutItem.textContent = "Logout";
  logoutItem.style.cssText = "padding: 10px; cursor: pointer;";
  logoutItem.addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
      window.location.href = "login.html";
    }
  });
  dropdownMenu.appendChild(logoutItem);

  userProfile.style.position = "relative";
  userProfile.appendChild(dropdownMenu);

  userProfile.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdownMenu.style.display =
      dropdownMenu.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", () => {
    dropdownMenu.style.display = "none";
  });
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById("searchInput");

  if (searchInput) {
    searchInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const regNumber = searchInput.value.trim();
        if (regNumber) {
          window.location.href = `vehiclerecords.html?reg=${encodeURIComponent(
            regNumber
          )}`;
        }
      }
    });
  }
}

// Make functions globally accessible
window.updateStatus = updateStatus;
window.editAppointment = editAppointment;
window.deleteAppointment = deleteAppointment;
