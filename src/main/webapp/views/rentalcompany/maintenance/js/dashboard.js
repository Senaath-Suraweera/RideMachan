
document.addEventListener("DOMContentLoaded", function () {
  // Find the Documentation button (third .action-btn)
  const docBtn = document.querySelectorAll('.action-btn')[2];
  const docPopup = document.getElementById('docPopup');
  const docPopupContent = document.getElementById('docPopupContent');
  const closeDocBtn = document.getElementById('closeDocBtn');

  // Style popup overlay
  docPopup.style.position = "fixed";
  docPopup.style.top = "0";
  docPopup.style.left = "0";
  docPopup.style.width = "100vw";
  docPopup.style.height = "100vh";
  docPopup.style.background = "rgba(30,41,59,0.45)";
  docPopup.style.zIndex = "9999";
  docPopup.style.display = "none";
  docPopup.style.alignItems = "center";
  docPopup.style.justifyContent = "center";
  docPopup.style.flexDirection = "column";
  docPopup.style.transition = "all 0.2s";
  docPopup.style.display = "flex";

  // Style popup box
  docPopupContent.style.background = "#fff";
  docPopupContent.style.padding = "38px 32px";
  docPopupContent.style.borderRadius = "20px";
  docPopupContent.style.minWidth = "340px";
  docPopupContent.style.maxWidth = "90vw";
  docPopupContent.style.boxShadow = "0 8px 32px #6366f199, 0 2px 12px #0002";
  docPopupContent.style.fontFamily = "'Poppins', Arial, sans-serif";
  docPopupContent.style.textAlign = "center";
  docPopupContent.style.border = "3px solid #fff";
  docPopupContent.style.color = "#fff";
  docPopupContent.style.position = "relative";

  // Title
  const h2 = docPopupContent.querySelector('h2');
  h2.style.color = "#fff";
  h2.style.marginBottom = "18px";
  h2.style.fontWeight = "800";
  h2.style.letterSpacing = "2px";
  h2.style.fontSize = "2em";
  h2.style.textShadow = "0 2px 8px #6366f1cc";

  // Paragraph
  const p = docPopupContent.querySelector('p');
  p.style.fontSize = "1.08em";
  p.style.marginBottom = "18px";
  p.style.fontWeight = "500";
  p.style.letterSpacing = "0.5px";



// List
const ul = docPopupContent.querySelector('ul');
ul.style.listStyle = "none";
ul.style.padding = "0";
ul.style.margin = "0 0 18px 0";

// Style list items
ul.querySelectorAll('li').forEach(function(li, index) {
    li.style.margin = "12px 0";
    // Alternate alignment for smart layout
    if(index % 3 === 0) li.style.textAlign = "left";
    else if(index % 3 === 1) li.style.textAlign = "center";
    else li.style.textAlign = "right";
});

// Style links as modern buttons
ul.querySelectorAll('a').forEach(function(a) {
    a.style.display = "inline-block";
    a.style.padding = "12px 26px";
    a.style.top = "12px";
    a.style.background = "linear-gradient(135deg, #ffb347, #ffcc33)";
    a.style.color = "#1b1b1b";
    a.style.fontWeight = "700";
    a.style.fontSize = "1.12em";
    a.style.borderRadius = "14px";
    a.style.textDecoration = "none";
    a.style.boxShadow = "0 6px 15px rgba(0,0,0,0.2)";
    a.style.transition = "all 0.4s cubic-bezier(.25,.8,.25,1)";
    a.style.textAlign = "center";
    a.style.minWidth = "200px";
    a.style.cursor = "pointer";

    // Hover effect - smart animation
    a.onmouseover = function() {
        a.style.background = "linear-gradient(135deg, #36d1dc, #5b86e5)";
        a.style.color = "#fff";
        a.style.transform = "translateY(-5px) scale(1.05)";
        a.style.boxShadow = "0 10px 20px rgba(0,0,0,0.3)";
    };
    a.onmouseout = function() {
        a.style.background = "linear-gradient(135deg, #ffb347, #ffcc33)";
        a.style.color = "#1b1b1b";
        a.style.transform = "translateY(0) scale(1)";
        a.style.boxShadow = "0 6px 15px rgba(0,0,0,0.2)";
    };
});

  // Button
  closeDocBtn.style.marginTop = "10px";
  closeDocBtn.style.padding = "10px 28px";
  closeDocBtn.style.borderRadius = "8px";
  closeDocBtn.style.border = "none";
  closeDocBtn.style.background = "linear-gradient(90deg, #6366f1 0%, #007bff 100%)";
  closeDocBtn.style.color = "#fff";
  closeDocBtn.style.cursor = "pointer";
  closeDocBtn.style.fontSize = "1em";
  closeDocBtn.style.fontWeight = "700";
  closeDocBtn.style.boxShadow = "0 2px 8px #6366f133";
  closeDocBtn.style.transition = "background 0.2s, transform 0.2s";
  closeDocBtn.onmouseover = function() {
    closeDocBtn.style.background = "linear-gradient(90deg, #007bff 0%, #6366f1 100%)";
    closeDocBtn.style.transform = "scale(1.07)";
  };
  closeDocBtn.onmouseout = function() {
    closeDocBtn.style.background = "linear-gradient(90deg, #6366f1 0%, #007bff 100%)";
    closeDocBtn.style.transform = "scale(1)";
  };

  // Show/hide popup
  if (docBtn && docPopup && closeDocBtn) {
    docBtn.addEventListener('click', function (e) {
      e.preventDefault();
      docPopup.style.display = 'flex';
    });
    closeDocBtn.addEventListener('click', function () {
      docPopup.style.display = 'none';
    });
    docPopup.addEventListener('click', function (e) {
      if (e.target === docPopup) docPopup.style.display = 'none';
    });
  }
});










// Get the search input from header
const searchInput = document.getElementById('searchInput');

if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const regNumber = searchInput.value.trim();
            if (regNumber) {
                // Redirect to vehiclerecords.html with query parameter
                window.location.href = `vehiclerecords.html?reg=${encodeURIComponent(regNumber)}`;
            }
        }
    });
} 















                     // Select the user-profile div
            const userProfile = document.querySelector('.user-profile');

            // Create the dropdown menu dynamically
            const dropdownMenu = document.createElement('div');
            dropdownMenu.style.position = 'absolute';
            dropdownMenu.style.top = '60px'; // adjust based on your header height
            dropdownMenu.style.right = '0';
            dropdownMenu.style.backgroundColor = '#fff';
            dropdownMenu.style.border = '1px solid #ccc';
            dropdownMenu.style.borderRadius = '5px';
            dropdownMenu.style.width = '150px';
            dropdownMenu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
            dropdownMenu.style.display = 'none';
            dropdownMenu.style.zIndex = '1000';
            dropdownMenu.style.fontFamily = 'sans-serif';

            // Create "Profile" item
            const profileItem = document.createElement('div');
            profileItem.textContent = 'Profile';
            profileItem.style.padding = '10px';            
            profileItem.style.cursor = 'pointer';
            profileItem.addEventListener('click', () => {
                window.location.href = 'staffprofile.html';
            });
            dropdownMenu.appendChild(profileItem);

            // Create "Logout" item
            const logoutItem = document.createElement('div');
            logoutItem.textContent = 'Logout';
            logoutItem.style.padding = '10px';            
            logoutItem.style.cursor = 'pointer';
            logoutItem.addEventListener('click', () => {
                alert('Logging out...');
                window.location.href = 'login.html'; // replace with your logout page
            });
            dropdownMenu.appendChild(logoutItem);

            // Append dropdown to userProfile and set relative position
            userProfile.style.position = 'relative';
            userProfile.appendChild(dropdownMenu);

            // Toggle dropdown visibility when clicking the user profile
            userProfile.addEventListener('click', (e) => {
                e.stopPropagation(); // prevent closing immediately
                dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
            });

            // Close dropdown if clicking outside
            document.addEventListener('click', () => {
                dropdownMenu.style.display = 'none';
            });






   













// ========================
// Schedule Maintenance Popup - FULL CONTROL
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

        vehicleInput = createInput("Vehicle ID", "text", "vehicleId", "Enter vehicle ID");
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
                `✅ Maintenance scheduled!\n\nVehicle: ${vehicleInput.input.value}\nDate: ${dateInput.input.value}\nNotes: ${notesInput.input.value}`
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

    // ======= IMPORTANT: find the correct button =======
    // Your HTML shows the button id is "openScheduleBtn".
    const scheduleBtn =
        document.getElementById("openScheduleBtn") || // matches your HTML
        document.getElementById("scheduleBtn") ||     // fallback if you rename later
        document.querySelector('button[id^="open"]') || // fallback example
        document.querySelector(".btn.btn-primary");    // last-resort fallback

    if (!scheduleBtn) {
        console.warn("Schedule button not found. Make sure the button has id='openScheduleBtn' or id='scheduleBtn'.");
        return;
    }

    scheduleBtn.addEventListener("click", openPopup);
});





 


















document.addEventListener("DOMContentLoaded", function () {
    // Only create once
    let overlay, modal, form, vehicleInput, dateInput, notesInput;

    function createPopup() {
        overlay = document.createElement("div");
        overlay.id = "scheduleOverlay";
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(0,0,0,0.6); display: none;
            align-items: center; justify-content: center; z-index: 2000;
        `;

        modal = document.createElement("div");
        modal.id = "scheduleModal";
        modal.style.cssText = `
            background: #fff; padding: 24px 28px; border-radius: 12px;
            width: 370px; max-width: 95vw; box-shadow: 0 8px 32px #0002;
            font-family: 'Poppins', sans-serif; position: relative;
        `;

        // Header
        const header = document.createElement("div");
        header.style.cssText = "display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;";
        const title = document.createElement("h2");
        title.textContent = "Schedule Maintenance";
        title.style.fontSize = "1.2em";
        title.style.margin = 0;
        const closeBtn = document.createElement("span");
        closeBtn.innerHTML = "&times;";
        closeBtn.style.cssText = "font-size:24px;cursor:pointer;color:#444;";
        closeBtn.onclick = closePopup;
        header.appendChild(title);
        header.appendChild(closeBtn);

        // Form
        form = document.createElement("form");
        form.id = "scheduleForm";

        vehicleInput = createInput("Vehicle ID", "text", "vehicleId", "Enter vehicle ID");
        form.appendChild(vehicleInput.wrapper);

        dateInput = createInput("Maintenance Date", "date", "date");
        form.appendChild(dateInput.wrapper);

        notesInput = createTextarea("Notes", "notes", "Enter details...");
        form.appendChild(notesInput.wrapper);

        // Buttons
        const btnGroup = document.createElement("div");
        btnGroup.style.marginTop = "15px";
        btnGroup.style.textAlign = "right";

        const saveBtn = document.createElement("button");
        saveBtn.type = "submit";
        saveBtn.textContent = "Save";
        saveBtn.style.cssText = "background:#4CAF50;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;";

        const cancelBtn = document.createElement("button");
        cancelBtn.type = "button";
        cancelBtn.textContent = "Cancel";
        cancelBtn.style.cssText = "background:#f44336;color:#fff;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;margin-left:10px;";
        cancelBtn.onclick = closePopup;

        btnGroup.appendChild(saveBtn);
        btnGroup.appendChild(cancelBtn);
        form.appendChild(btnGroup);

        // Error message
        const errorDiv = document.createElement("div");
        errorDiv.id = "scheduleError";
        errorDiv.style.cssText = "color:#e74c3c;min-height:20px;margin-top:10px;font-size:0.98rem;";
        form.appendChild(errorDiv);

        modal.appendChild(header);
        modal.appendChild(form);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Form submit
        form.addEventListener("submit", function (e) {
            e.preventDefault();
            if (!vehicleInput.input.value.trim() || !dateInput.input.value || !notesInput.input.value.trim()) {
                errorDiv.textContent = "Please fill all fields";
                return;
            }
            alert(
                `✅ Maintenance scheduled!\n\nVehicle: ${vehicleInput.input.value}\nDate: ${dateInput.input.value}\nNotes: ${notesInput.input.value}`
            );
            closePopup();
        });

        // Close on overlay click
        overlay.addEventListener("click", function (e) {
            if (e.target === overlay) closePopup();
        });

        // Close on ESC
        document.addEventListener("keydown", function (e) {
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
        input.style.cssText = "width:100%;padding:8px;margin-top:6px;border:1px solid #ccc;border-radius:5px;";
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
        textarea.style.cssText = "width:100%;padding:8px;margin-top:6px;border:1px solid #ccc;border-radius:5px;resize:none;";
        wrapper.appendChild(label);
        wrapper.appendChild(textarea);
        return { wrapper, input: textarea };
    }

    function openPopup() {
        if (!overlay) createPopup();
        overlay.style.display = "flex";
        form.reset();
        form.querySelector("#scheduleError").textContent = "";
    }

    function closePopup() {
        if (overlay) overlay.style.display = "none";
    }

    // Find the correct button
    const scheduleBtn =
        document.getElementById("openScheduleBtn") ||
        document.getElementById("scheduleBtn") ||
        document.querySelector('button[id^="open"]') ||
        document.querySelector(".btn.btn-primary");

    if (scheduleBtn) {
        scheduleBtn.addEventListener("click", openPopup);
    }
});







// Maintenance Distribution Animation + Type Colors
document.addEventListener("DOMContentLoaded", () => {
    const distributionFills = document.querySelectorAll(".distribution-fill");

    // Animate bars from 0% → target width
    setTimeout(() => {
        distributionFills.forEach((fill, index) => {
            const width = fill.getAttribute("data-width") || fill.style.width;
            fill.style.width = "0%";
            fill.style.transition = "width 1s ease";
            setTimeout(() => {
                fill.style.width = width;
            }, index * 150);
        });
    }, 500);

    // Assign colors based on maintenance type
    distributionFills.forEach((fill) => {
        const type = fill.getAttribute("data-type");

        switch (type) {
            case "oil":
                fill.style.backgroundColor = "#4CAF50"; // Green for Oil Changes
                break;
            case "brake":
                fill.style.backgroundColor = "#F44336"; // Red for Brake Services
                break;
            case "tire":
                fill.style.backgroundColor = "#2196F3"; // Blue for Tire Services
                break;
            case "engine":
                fill.style.backgroundColor = "#FF9800"; // Orange for Engine Services
                break;
            default:
                fill.style.backgroundColor = "#9E9E9E"; // Gray fallback
        }
    });

    // Optional: click pulse effect
    distributionFills.forEach((fill) => {
        const item = fill.closest(".distribution-item");
        item.addEventListener("click", () => {
            fill.style.animation = "pulse 0.6s ease";
            setTimeout(() => {
                fill.style.animation = "";
            }, 600);
        });
    });
});


     