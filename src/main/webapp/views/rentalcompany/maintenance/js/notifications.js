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
