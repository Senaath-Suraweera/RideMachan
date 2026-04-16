// ── Global state ─────────────────────────────────────────────────────────
let AllEvents = [];
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-indexed
let sessionStaffId = null; // set from session after login check
let sessionStaffName = ""; // full name of logged-in staff
let assignedVehicles = []; // vehicles assigned to this staff member

async function checkLogin() {
  try {
    const response = await fetch("/check/login/maintenance");
    const data = await response.json();

    if (!data.loggedIn) {
      const modal = document.getElementById("loginModal");
      modal.style.display = "flex";
      document.getElementById("loginOkBtn").onclick = () => {
        window.location.href = "/views/landing/maintenancelogin.html";
      };
      return false;
    }

    // Accept either actorId or staffId
    const resolvedStaffId = data.actorId || data.staffId || null;
    if (resolvedStaffId) {
      sessionStaffId = resolvedStaffId;
    }

    // Build staff name directly from login-check response
    if (data.firstname || data.lastname) {
      sessionStaffName =
        `${data.firstname || ""} ${data.lastname || ""}`.trim();
    }

    // Fallback: fetch profile only if name still missing
    if (!sessionStaffName && resolvedStaffId) {
      try {
        const profileResp = await fetch(
          "/maintenance/profile?staffId=" + resolvedStaffId,
        );

        if (profileResp.ok) {
          const profile = await profileResp.json();
          if (profile.firstname || profile.lastname) {
            sessionStaffName =
              `${profile.firstname || ""} ${profile.lastname || ""}`.trim();
          }
        }
      } catch (err) {
        console.warn("Profile fallback failed:", err);
      }
    }

    console.log(
      "Logged in — staffId:",
      sessionStaffId,
      "name:",
      sessionStaffName,
    );
    return true;
  } catch (err) {
    console.error("Error checking login:", err);
    return false;
  }
}

/**
 * Fetch vehicles assigned to the logged-in staff from the backend.
 * The servlet reads actorId straight from the HTTP session.
 */
async function loadAssignedVehicles() {
  try {
    const response = await fetch("/maintenance/assignedVehicles");
    if (!response.ok) throw new Error("HTTP " + response.status);
    assignedVehicles = await response.json();
  } catch (err) {
    console.error("Could not load assigned vehicles:", err);
    assignedVehicles = [];
  }
  populateVehicleDropdown(assignedVehicles);
}

function populateVehicleDropdown(vehicles) {
  const select = document.getElementById("vehicleSelect");
  select.innerHTML = '<option value="">— Select a vehicle —</option>';
  if (!vehicles || vehicles.length === 0) {
    const opt = document.createElement("option");
    opt.disabled = true;
    opt.textContent = "No vehicles assigned to you";
    select.appendChild(opt);
    return;
  }
  vehicles.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.numberPlate; // sent to AddCalenderEvents as vehicle_id (number plate)
    opt.dataset.model = v.brand + " " + v.model;
    opt.textContent = v.displayLabel;
    select.appendChild(opt);
  });
}

async function LoadCalenderEvents() {
  try {
    const response = await fetch("/maintenance/listEvents");
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    // Backend returns an array of events; guard against error objects
    const events = Array.isArray(data) ? data : [];
    console.log("Events loaded:", events.length);
    return events;
  } catch (err) {
    console.error("LoadCalenderEvents error:", err);
    return [];
  }
}

async function AddCalenderEvents() {
  try {
    const data = {
      vehicle_id: document.getElementById("vehiclenumberplate").value.trim(),
      service_type: document.getElementById("serviceType").value.trim(),
      status: "scheduled",
      description: document.getElementById("description").value.trim(),
      maintenance_id: sessionStaffId || 1,
      scheduled_date: document.getElementById("eventDate").value,
      scheduled_time: document.getElementById("eventTime").value,
      service_bay: document.getElementById("serviceBay").value,
      estimated_duration: document
        .getElementById("estimatedDuration")
        .value.trim(),
      assigned_technician:
        sessionStaffName || document.getElementById("technician").value,
    };

    const response = await fetch("/maintenance/addEvent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.status === "success") {
      showNotification("Event added successfully!", "success");
      closeAddAppointementModel();
      AllEvents = await LoadCalenderEvents();
      renderTodayTasks(AllEvents);
      renderCalender();
      renderEventsList(AllEvents);
    } else {
      showNotification("Error: " + result.message, "error");
    }
  } catch (err) {
    console.log(err);
    showNotification("Failed to add event", "error");
  }
}

async function UpdateCalenderEvents(event, newStatus) {
  try {
    const response = await fetch(
      "/maintenance/updateEvent?updateType=status&eventid=" +
        event.id +
        "&status=" +
        newStatus,
      { method: "POST" },
    );
    const result = await response.json();

    if (result.status === "success") {
      showNotification(
        `Event updated to "${newStatus.toUpperCase()}"`,
        "success",
      );
      AllEvents = await LoadCalenderEvents();
      renderTodayTasks(AllEvents);
      renderCalender();
      renderEventsList(AllEvents);

      // Refresh the side panel with updated event data
      const updated = AllEvents.find((e) => e.id === event.id);
      if (updated) showVehicleDetails(updated);
      else
        document.getElementById("vehicleDetailsPanel").classList.remove("open");
    } else {
      showNotification(`Error: ${result.message}`, "error");
    }
  } catch (err) {
    console.error("Error updating event:", err);
    showNotification("Error updating event", "error");
  }
}

async function DeleteCalenderEvents(event) {
  if (!event || !event.id) {
    showNotification("Event data is missing", "error");
    return;
  }

  const confirmDelete = confirm(
    `Are you sure you want to delete the event for vehicle ${event.vehicleId}?`,
  );
  if (!confirmDelete) return;

  try {
    const response = await fetch("/maintenance/deleteEvent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventid: event.id }),
    });

    const result = await response.json();

    if (result.status === "success") {
      showNotification(
        `Event for ${event.vehicleId} deleted successfully!`,
        "success",
      );
      document.getElementById("vehicleDetailsPanel").classList.remove("open");
      AllEvents = await LoadCalenderEvents();
      renderTodayTasks(AllEvents);
      renderCalender();
      renderEventsList(AllEvents);
    } else {
      showNotification("Error: " + result.message, "error");
    }
  } catch (err) {
    console.error("Error deleting event:", err);
    showNotification("Error deleting event", "error");
  }
}

async function editAppointment(eventId) {
  const event = AllEvents.find((e) => e.id === eventId);
  if (!event) {
    showNotification("Event not found", "error");
    return;
  }

  // Open modal and wait for vehicles to finish loading before pre-selecting.
  await openAddAppointementModel();

  const vehicleSelect = document.getElementById("vehicleSelect");
  // event.vehicleId holds the number plate string returned by the backend
  const plateToSelect = event.vehicleId || "";
  let matched = false;
  for (let i = 0; i < vehicleSelect.options.length; i++) {
    if (vehicleSelect.options[i].value === plateToSelect) {
      vehicleSelect.selectedIndex = i;
      matched = true;
      break;
    }
  }
  // Sync hidden field and read-only model display
  document.getElementById("vehiclenumberplate").value = plateToSelect;
  document.getElementById("vehicleModel").value = matched
    ? vehicleSelect.options[vehicleSelect.selectedIndex].dataset.model
    : event.model || "";

  // Fill remaining fields
  document.getElementById("serviceType").value = event.service || "";
  document.getElementById("eventDate").value = (event.scheduled_date || "")
    .split("T")[0]
    .split(" ")[0];
  document.getElementById("eventTime").value = event.scheduled_time || "";
  document.getElementById("serviceBay").value = event.bay || "";
  document.getElementById("estimatedDuration").value =
    event.estimatedDuration || "";
  document.getElementById("description").value = event.description || "";

  // Technician is always the logged-in staff member (read-only field)
  // It is already set by openAddAppointementModel(); nothing to override here.

  // Change modal title to indicate editing
  document.querySelector(".modal-header h2").innerHTML =
    `<i class="fas fa-calendar-edit"></i> Edit Appointment`;

  // Store the editing event id so submit knows to update instead of add
  document.getElementById("addEventForm").dataset.editId = eventId;
}

function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
        <i class="fas fa-${type === "success" ? "check-circle" : "exclamation-circle"}"></i>
        <span>${message}</span>
    `;
  document.body.appendChild(notification);
  setTimeout(() => notification.classList.add("show"), 10);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

async function openAddAppointementModel() {
  document.getElementById("addEventModal").classList.add("active");

  // Load assigned vehicles and wait until dropdown is populated
  await loadAssignedVehicles();

  // Always set technician field
  const techField = document.getElementById("technician");
  if (techField) {
    techField.value = sessionStaffName || `Staff ID: ${sessionStaffId || ""}`;
  }
}

function closeAddAppointementModel() {
  document.getElementById("addEventModal").classList.remove("active");
  const form = document.getElementById("addEventForm");
  form.reset();
  delete form.dataset.editId;
  // Reset vehicle selection state
  document.getElementById("vehicleSelect").value = "";
  document.getElementById("vehiclenumberplate").value = "";
  document.getElementById("vehicleModel").value = "";
  document.querySelector(".modal-header h2").innerHTML =
    `<i class="fas fa-calendar-plus"></i> Add New Appointment`;
}

// ── Today's tasks section ──────────────────────────────────────────────────

function getTodayString() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function renderTodayTasks(events) {
  const todayStr = getTodayString();

  // Update today's date label
  const dateLabel = document.getElementById("todayDate");
  if (dateLabel) {
    const opts = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    dateLabel.textContent = new Date().toLocaleDateString(undefined, opts);
  }

  const todayEvents = (events || []).filter(
    (e) => (e.scheduled_date || "").split("T")[0].split(" ")[0] === todayStr,
  );

  const scheduled = todayEvents.filter((e) => e.status === "scheduled").length;
  const inProgress = todayEvents.filter(
    (e) => e.status === "in-progress",
  ).length;
  const completed = todayEvents.filter((e) => e.status === "completed").length;

  document.getElementById("scheduledCount").textContent = scheduled;
  document.getElementById("progressCount").textContent = inProgress;
  document.getElementById("completedCount").textContent = completed;

  const list = document.getElementById("todayTasksList");
  if (!list) return;
  list.innerHTML = "";

  if (todayEvents.length === 0) {
    list.innerHTML = `<p style="color:var(--color-text-secondary); font-size:14px;">No tasks scheduled for today.</p>`;
    return;
  }

  todayEvents.forEach((event) => {
    const card = document.createElement("div");
    card.className = `task-card ${event.status}`;
    card.innerHTML = `
            <div class="task-card-header">
                <div class="task-time"><i class="fas fa-clock"></i>${event.time || ""}</div>
                <span class="task-status ${event.status}">${event.status.replace("-", " ")}</span>
            </div>
            <div class="task-vehicle">${event.vehicleId || "—"}</div>
            <div class="task-service">${event.service || "—"}</div>
            <div class="task-bay"><i class="fas fa-warehouse"></i>${event.bay || "—"}</div>
        `;
    card.addEventListener("click", () => showVehicleDetails(event));
    list.appendChild(card);
  });
}

// ── Events list (below today's section) ───────────────────────────────────

function renderEventsList(events) {
  const container = document.getElementById("eventsContainer");
  if (!container) return;
  container.innerHTML = "";
}

// ── Calendar ──────────────────────────────────────────────────────────────

function renderCalender() {
  const calenderDates = document.getElementById("calendarDates");
  calenderDates.innerHTML = "";

  const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const todayStr = getTodayString();

  // Empty cells before the 1st
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("div");
    blank.classList.add("date-cell", "prev-month");
    calenderDates.appendChild(blank);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.classList.add("date-cell");

    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (dateString === todayStr) cell.classList.add("current-day");

    const numSpan = document.createElement("span");
    numSpan.classList.add("date-number");
    numSpan.textContent = day;
    cell.appendChild(numSpan);

    displayScheduleVehiclesNumberPlates(cell, dateString);
    calenderDates.appendChild(cell);
  }

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
  document.getElementById("currentMonth").textContent =
    `${monthNames[currentMonth]} ${currentYear}`;
}

function displayScheduleVehiclesNumberPlates(cell, dateString) {
  if (!AllEvents || AllEvents.length === 0) return;

  const eventsContainer = document.createElement("div");
  eventsContainer.classList.add("date-events");

  AllEvents.forEach((event) => {
    // Normalise: take only the YYYY-MM-DD part in case the DB returned a timestamp
    const evtDate = (event.scheduled_date || "").split("T")[0].split(" ")[0];
    if (evtDate === dateString) {
      const indicator = document.createElement("div");
      indicator.classList.add("event-indicator", event.status || "scheduled");
      indicator.textContent = event.vehicleId || "—";
      indicator.title = `${event.service} — ${event.time}`;
      indicator.addEventListener("click", (e) => {
        e.stopPropagation();
        showVehicleDetails(event);
      });
      eventsContainer.appendChild(indicator);
    }
  });

  if (eventsContainer.children.length > 0) cell.appendChild(eventsContainer);
}

// ── Vehicle details panel ─────────────────────────────────────────────────

function showVehicleDetails(event) {
  const panel = document.getElementById("vehicleDetailsPanel");
  const content = document.getElementById("panelContent");

  content.innerHTML = `
        <div class="vehicle-info-content">
            <div class="status-large ${event.status}">
                ${event.status.replace("-", " ")}
            </div>

            <div class="vehicle-header">
                <div class="vehicle-icon-large"><i class="fas fa-car"></i></div>
                <div>
                    <div class="vehicle-id-large">${event.vehicleId || "—"}</div>
                    <div class="vehicle-model">${event.model || "—"}</div>
                </div>
            </div>

            <div class="appointment-details-section">
                <div class="section-title"><i class="fas fa-info-circle"></i> Appointment Details</div>
                <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${event.scheduled_date || "—"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time</span>
                    <span class="detail-value">${event.time || "—"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Bay</span>
                    <span class="detail-value">${event.bay || "—"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Duration</span>
                    <span class="detail-value">${event.estimatedDuration || "—"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Technician</span>
                    <span class="detail-value">${event.assignedTechnician || "—"}</span>
                </div>
            </div>

            <div class="appointment-details-section">
                <div class="section-title"><i class="fas fa-wrench"></i> Service Type</div>
                <div class="description-box"><strong>${event.service || "—"}</strong></div>
            </div>

            <div class="appointment-details-section">
                <div class="section-title"><i class="fas fa-clipboard"></i> Description</div>
                <div class="description-box">${event.description || "No description provided."}</div>
            </div>

            <div class="action-buttons" id="actionButtonsContainer"></div>
        </div>
    `;

  const actionsContainer = document.getElementById("actionButtonsContainer");

  if (event.status === "scheduled") {
    const startBtn = document.createElement("button");
    startBtn.classList.add("btn", "btn-success");
    startBtn.innerHTML = `<i class="fas fa-play"></i> Start Service`;
    startBtn.addEventListener("click", () =>
      UpdateCalenderEvents(event, "in-progress"),
    );
    actionsContainer.appendChild(startBtn);
  }

  if (event.status === "in-progress") {
    const completeBtn = document.createElement("button");
    completeBtn.classList.add("btn", "btn-success");
    completeBtn.innerHTML = `<i class="fas fa-check"></i> Mark Complete`;
    completeBtn.addEventListener("click", () =>
      UpdateCalenderEvents(event, "completed"),
    );
    actionsContainer.appendChild(completeBtn);
  }

  if (event.status !== "completed") {
    const editBtn = document.createElement("button");
    editBtn.classList.add("btn", "btn-secondary");
    editBtn.innerHTML = `<i class="fas fa-edit"></i> Edit`;
    editBtn.addEventListener("click", () => editAppointment(event.id));
    actionsContainer.appendChild(editBtn);
  }

  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("btn", "btn-danger");
  deleteBtn.innerHTML = `<i class="fas fa-trash"></i> Delete`;
  deleteBtn.addEventListener("click", () => DeleteCalenderEvents(event));
  actionsContainer.appendChild(deleteBtn);

  panel.classList.add("open");
  if (window.innerWidth <= 1200) panel.scrollIntoView({ behavior: "smooth" });
}

// ── Initialisation ────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const loggedIn = await checkLogin();
    if (!loggedIn) return;

    AllEvents = await LoadCalenderEvents();
    renderTodayTasks(AllEvents);
    renderEventsList(AllEvents);
    renderCalender();

    // Pre-fill the technician field with the logged-in staff member's name
    const techField = document.getElementById("technician");
    if (techField) {
      techField.value = sessionStaffName || `Staff ID: ${sessionStaffId || ""}`;
    }
  } catch (err) {
    console.error("Error during initialization:", err);
  }

  // ── Vehicle dropdown change handler ──────────────────────────────────────
  // When the user selects a vehicle from the dropdown:
  //   • write the number plate into the hidden #vehiclenumberplate field
  //     (AddCalenderEvents reads that field to send to the backend)
  //   • auto-fill the read-only #vehicleModel field
  document
    .getElementById("vehicleSelect")
    .addEventListener("change", function () {
      const selected = this.options[this.selectedIndex];
      document.getElementById("vehiclenumberplate").value = selected.value;
      document.getElementById("vehicleModel").value = selected.value
        ? selected.dataset.model || ""
        : "";
    });
});

// ── Button listeners ──────────────────────────────────────────────────────

document
  .getElementById("addEventBtn")
  .addEventListener("click", openAddAppointementModel);

document
  .getElementById("addEventForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const editId = this.dataset.editId;

    if (editId) {
      // Full event update — use the CURRENT hidden field value so that
      // vehicle changes made in the dropdown during edit are respected.
      // Backend (UpdateCalendarEventServlet) now resolves the number plate
      // to an internal vehicle id, mirroring the add-event flow.
      const originalEvent = AllEvents.find((ev) => ev.id === parseInt(editId));

      const data = {
        eventid: parseInt(editId),
        vehicle_id: document.getElementById("vehiclenumberplate").value.trim(),
        service_type: document.getElementById("serviceType").value.trim(),
        status: originalEvent?.status || "scheduled",
        description: document.getElementById("description").value.trim(),
        maintenance_id: originalEvent?.maintenance_id || sessionStaffId || 1,
        scheduled_date: document.getElementById("eventDate").value,
        scheduled_time: document.getElementById("eventTime").value,
        service_bay: document.getElementById("serviceBay").value,
        estimated_duration: document
          .getElementById("estimatedDuration")
          .value.trim(),
        assigned_technician:
          sessionStaffName || document.getElementById("technician").value,
      };

      try {
        const response = await fetch("/maintenance/updateEvent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        if (result.status === "success") {
          showNotification("Event updated successfully!", "success");
          closeAddAppointementModel();
          AllEvents = await LoadCalenderEvents();
          renderTodayTasks(AllEvents);
          renderCalender();
          renderEventsList(AllEvents);
          document
            .getElementById("vehicleDetailsPanel")
            .classList.remove("open");
        } else {
          showNotification("Error: " + result.message, "error");
        }
      } catch (err) {
        console.error("Update event error:", err);
        showNotification("Failed to update event", "error");
      }
    } else {
      await AddCalenderEvents();
    }
  });

document
  .getElementById("closeModal")
  .addEventListener("click", closeAddAppointementModel);
document
  .getElementById("cancelBtn")
  .addEventListener("click", closeAddAppointementModel);

document.getElementById("prevMonth").addEventListener("click", () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  renderCalender();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  renderCalender();
});

document.getElementById("closePanel").addEventListener("click", () => {
  document.getElementById("vehicleDetailsPanel").classList.remove("open");
});
