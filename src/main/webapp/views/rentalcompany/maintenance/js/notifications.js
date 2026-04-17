// =========================================================
//  notifications.js — Maintenance Staff page helpers
//  Handles: user-profile dropdown, schedule-maintenance popup,
//           and the vehicle condition report popup.
//
//  The notification list/count and "Mark as Read" buttons are
//  handled by the inline <script> in notification.html which
//  talks to /api/notifications/* directly.
// =========================================================

// ========================
//  User profile dropdown
// ========================
(function initUserProfileDropdown() {
  const userProfile = document.querySelector(".user-profile");
  if (!userProfile) return;

  const dropdownMenu = document.createElement("div");
  dropdownMenu.style.cssText = `
        position: absolute; top: 60px; right: 0;
        background-color: #fff; border: 1px solid #ccc;
        border-radius: 5px; width: 150px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        display: none; z-index: 1000; font-family: sans-serif;
    `;

  const profileItem = document.createElement("div");
  profileItem.textContent = "Profile";
  profileItem.style.padding = "10px";
  profileItem.style.cursor = "pointer";
  profileItem.addEventListener("click", () => {
    window.location.href = "staffprofile.html";
  });
  dropdownMenu.appendChild(profileItem);

  const logoutItem = document.createElement("div");
  logoutItem.textContent = "Logout";
  logoutItem.style.padding = "10px";
  logoutItem.style.cursor = "pointer";
  logoutItem.addEventListener("click", () => {
    alert("Logging out...");
    window.location.href = "login.html";
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
})();

// ========================
//  Schedule Maintenance Popup
// ========================
document.addEventListener("DOMContentLoaded", () => {
  let overlay, modal, form, vehicleInput, dateInput, notesInput;

  function createPopup() {
    overlay = document.createElement("div");
    overlay.id = "scheduleOverlay";
    overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.6); display: none;
            align-items: center; justify-content: center; z-index: 2000;
        `;

    modal = document.createElement("div");
    modal.id = "scheduleModal";
    modal.style.cssText = `
            background: #fff; padding: 20px 25px; border-radius: 10px;
            width: 380px; max-height: 80%; overflow-y: auto;
            box-shadow: 0 8px 20px rgba(0,0,0,0.25);
            font-family: 'Poppins', sans-serif; position: relative;
        `;

    const header = document.createElement("div");
    header.style.cssText = `display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;`;
    const title = document.createElement("h2");
    title.textContent = "Schedule Maintenance";
    title.style.fontSize = "1.3em";
    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = "font-size:24px;cursor:pointer;color:#444;";
    closeBtn.onclick = closePopup;
    header.appendChild(title);
    header.appendChild(closeBtn);

    form = document.createElement("form");
    form.id = "scheduleForm";

    vehicleInput = createInput(
      "Vehicle ID",
      "text",
      "vehicleId",
      "Enter vehicle ID",
    );
    form.appendChild(vehicleInput.wrapper);

    dateInput = createInput("Maintenance Date", "date", "date");
    form.appendChild(dateInput.wrapper);

    notesInput = createTextarea("Notes", "notes", "Enter details...");
    form.appendChild(notesInput.wrapper);

    const btnGroup = document.createElement("div");
    btnGroup.style.marginTop = "15px";

    const saveBtn = document.createElement("button");
    saveBtn.type = "submit";
    saveBtn.textContent = "Save";
    saveBtn.style.cssText = `background:#4CAF50;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;`;

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = "Cancel";
    cancelBtn.style.cssText = `background:#f44336;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;margin-left:10px;`;
    cancelBtn.onclick = closePopup;

    btnGroup.appendChild(saveBtn);
    btnGroup.appendChild(cancelBtn);
    form.appendChild(btnGroup);

    modal.appendChild(header);
    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      alert(
        `✅ Maintenance scheduled!\n\nVehicle: ${vehicleInput.input.value}\nDate: ${dateInput.input.value}\nNotes: ${notesInput.input.value}`,
      );
      closePopup();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePopup();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closePopup();
    });
  }

  function createInput(labelText, type, name, placeholder = "") {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "12px";
    const label = document.createElement("label");
    label.textContent = labelText;
    label.style.display = "block";
    const input = document.createElement("input");
    input.type = type;
    input.name = name;
    input.required = true;
    input.placeholder = placeholder;
    input.style.cssText = `width:100%;padding:8px;margin-top:6px;border:1px solid #ccc;border-radius:5px;`;
    wrapper.appendChild(label);
    wrapper.appendChild(input);
    return { wrapper, input };
  }

  function createTextarea(labelText, name, placeholder = "") {
    const wrapper = document.createElement("div");
    wrapper.style.marginBottom = "12px";
    const label = document.createElement("label");
    label.textContent = labelText;
    label.style.display = "block";
    const textarea = document.createElement("textarea");
    textarea.name = name;
    textarea.rows = 3;
    textarea.placeholder = placeholder;
    textarea.required = true;
    textarea.style.cssText = `width:100%;padding:8px;margin-top:6px;border:1px solid #ccc;border-radius:5px;resize:none;`;
    wrapper.appendChild(label);
    wrapper.appendChild(textarea);
    return { wrapper, input: textarea };
  }

  function openPopup() {
    if (!overlay) createPopup();
    overlay.style.display = "flex";
    form.reset();
  }

  function closePopup() {
    if (overlay) overlay.style.display = "none";
  }

  // Only wire up if the Schedule button actually exists on the current page.
  // (Maintenance notification page doesn't have it — dashboard does.)
  const scheduleBtn =
    document.getElementById("openScheduleBtn") ||
    document.getElementById("scheduleBtn");
  if (scheduleBtn) {
    scheduleBtn.addEventListener("click", openPopup);
  }
});

// ========================
//  Vehicle Condition Report Popup
//  Uses event delegation so it works with dynamically-loaded notifications
//  (REPORT type cards get the .vehicle-report CSS class from the renderer).
// ========================
document.addEventListener("DOMContentLoaded", () => {
  const notificationList = document.getElementById("notificationList");
  if (!notificationList) return;

  notificationList.addEventListener("click", (e) => {
    // Ignore clicks on the "Mark as Read" button itself
    if (e.target.closest(".mark-read-btn")) return;

    const card = e.target.closest(".notification-card.vehicle-report");
    if (!card) return;

    // Pull data off the card rendered by notification.html
    const title =
      card.querySelector(".sender-name")?.textContent?.trim() ||
      "Vehicle Report";
    const message =
      card.querySelector(".notification-message")?.textContent?.trim() || "";
    const refType = card.dataset.refType || "";
    const refId = card.dataset.refId || "";

    openVehiclePopup({ title, message, refType, refId });
  });

  function openVehiclePopup({ title, message, refType, refId }) {
    const overlay = document.createElement("div");
    overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex; align-items: center; justify-content: center;
            z-index: 3000;
        `;

    const popup = document.createElement("div");
    popup.style.cssText = `
            background: #fff; padding: 30px;
            border-radius: 12px; width: 450px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            font-family: 'Poppins', sans-serif;
            position: relative;
        `;

    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = `
            position: absolute; top: 12px; right: 18px;
            font-size: 26px; color: #666; cursor: pointer;
        `;
    closeBtn.onmouseover = () => (closeBtn.style.color = "#000");
    closeBtn.onmouseout = () => (closeBtn.style.color = "#666");
    closeBtn.onclick = () => document.body.removeChild(overlay);

    const titleEl = document.createElement("h2");
    titleEl.textContent = title;
    titleEl.style.cssText = `
            margin-bottom: 20px; color: #333;
            font-size: 1.4em; text-align: center;
        `;

    // Build readable fields from what we actually know
    const fields = [
      {
        label: "Report Reference",
        value: refType && refId ? `#${refType}-${refId}` : "N/A",
      },
    ];

    const formContainer = document.createElement("div");
    formContainer.style.cssText = `display: flex; flex-direction: column; gap: 15px; margin-bottom: 20px;`;

    fields.forEach((f) => {
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "display: flex; flex-direction: column;";

      const label = document.createElement("label");
      label.textContent = f.label;
      label.style.cssText =
        "font-weight: 500; color: #444; margin-bottom: 5px;";

      const input = document.createElement("input");
      input.value = f.value;
      input.readOnly = true;
      input.style.cssText = `
                padding: 8px 10px; border: 1px solid #ccc;
                border-radius: 6px; background: #f9f9f9; color: #333;
            `;

      wrapper.appendChild(label);
      wrapper.appendChild(input);
      formContainer.appendChild(wrapper);
    });

    // Description
    const descWrapper = document.createElement("div");
    const descLabel = document.createElement("label");
    descLabel.textContent = "Description";
    descLabel.style.cssText =
      "font-weight: 500; color: #444; margin-bottom: 5px;";
    const descArea = document.createElement("textarea");
    descArea.readOnly = true;
    descArea.value = message;
    descArea.style.cssText = `
            width: 100%; height: 80px; resize: none;
            padding: 8px 10px; border: 1px solid #ccc;
            border-radius: 6px; background: #f9f9f9; color: #333;
        `;
    descWrapper.appendChild(descLabel);
    descWrapper.appendChild(descArea);
    formContainer.appendChild(descWrapper);

    const btnContainer = document.createElement("div");
    btnContainer.style.cssText =
      "display: flex; justify-content: center; gap: 10px;";

    const viewBtn = document.createElement("button");
    viewBtn.textContent = "Go to Maintenance Calendar";
    viewBtn.style.cssText = `
            background: #4CAF50; color: #fff;
            border: none; padding: 10px 20px;
            border-radius: 6px; cursor: pointer; font-size: 0.95em;
        `;
    viewBtn.onclick = () => window.open("maintenance-calender.html", "_blank");

    const cancelBtn = document.createElement("button");
    cancelBtn.textContent = "Close";
    cancelBtn.style.cssText = `
            background: #f44336; color: #fff;
            border: none; padding: 10px 20px;
            border-radius: 6px; cursor: pointer; font-size: 0.95em;
        `;
    cancelBtn.onclick = () => document.body.removeChild(overlay);

    btnContainer.appendChild(viewBtn);
    btnContainer.appendChild(cancelBtn);

    popup.appendChild(closeBtn);
    popup.appendChild(titleEl);
    popup.appendChild(formContainer);
    popup.appendChild(btnContainer);

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) document.body.removeChild(overlay);
    });
  }
});

// NOTE: The old "btn.onclick = alert('All marked as read!')" handler has been
// removed. The real Mark-All-as-Read button is wired up to the API in
// notification.html's inline script via #markAllReadBtn.
