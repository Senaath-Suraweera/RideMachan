document.addEventListener("DOMContentLoaded", () => {

    // Event delegation for all edit buttons
    document.body.addEventListener("click", (e) => {
        if (e.target.closest(".edit-btn")) {
            const editBtn = e.target.closest(".edit-btn");
            const appointmentItem = editBtn.closest(".appointment-item");
            openEditModal(appointmentItem);
        }
    });

    function openEditModal(appointmentItem) {
        const vehicleId = appointmentItem.querySelector(".vehicle-id").textContent;
        const serviceType = appointmentItem.querySelector(".service-type").textContent;
        const time = appointmentItem.querySelector(".appointment-time .time").textContent;
        const bay = appointmentItem.querySelector(".appointment-time .bay").textContent;

        // Overlay
        const overlay = document.createElement("div");
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background-color: rgba(0,0,0,0.5); display: flex;
            justify-content: center; align-items: center; z-index: 1000;
        `;

        // Modal
        const modal = document.createElement("div");
        modal.style.cssText = `
            background-color: #fff; padding: 20px; border-radius: 10px;
            width: 400px; box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;

        // Header
        const header = document.createElement("div");
        header.style.display = "flex";
        header.style.justifyContent = "space-between";
        header.style.alignItems = "center";

        const title = document.createElement("h2");
        title.textContent = "Edit Appointment";

        const closeBtn = document.createElement("span");
        closeBtn.innerHTML = "&times;";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontSize = "24px";
        closeBtn.onclick = () => document.body.removeChild(overlay);

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Form
        const form = document.createElement("form");
        form.style.marginTop = "20px";

        const fields = [
            { label: "Vehicle ID", type: "text", name: "vehicleId", value: vehicleId },
            { label: "Service Type", type: "text", name: "serviceType", value: serviceType },
            { label: "Time", type: "time", name: "time", value: convertTo24Hour(time) },
            { label: "Bay", type: "text", name: "bay", value: bay }
        ];

        fields.forEach(f => {
            const wrapper = document.createElement("div");
            wrapper.style.marginBottom = "10px";

            const lbl = document.createElement("label");
            lbl.textContent = f.label;
            lbl.style.display = "block";
            lbl.style.marginBottom = "5px";

            const input = document.createElement("input");
            input.type = f.type;
            input.name = f.name;
            input.value = f.value || "";
            input.required = true;
            input.style.width = "100%";
            input.style.padding = "8px";
            input.style.borderRadius = "5px";
            input.style.border = "1px solid #ccc";

            wrapper.appendChild(lbl);
            wrapper.appendChild(input);
            form.appendChild(wrapper);
        });

        const submitBtn = document.createElement("button");
        submitBtn.type = "submit";
        submitBtn.textContent = "Save Changes";
        submitBtn.style.cssText = `
            padding: 10px 35px; border: none; border-radius: 5px;
            background-color: #4CAF50; color: #fff; cursor: pointer;
        `;
        form.appendChild(submitBtn);

        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const updatedData = Object.fromEntries(formData.entries());

            appointmentItem.querySelector(".vehicle-id").textContent = updatedData.vehicleId;
            appointmentItem.querySelector(".service-type").textContent = updatedData.serviceType;
            appointmentItem.querySelector(".appointment-time .time").textContent = formatTime(updatedData.time);
            appointmentItem.querySelector(".appointment-time .bay").textContent = updatedData.bay;

            document.body.removeChild(overlay);
        };

        modal.appendChild(header);
        modal.appendChild(form);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    // Convert 12h to 24h
    function convertTo24Hour(timeStr) {
        if (!timeStr.includes("AM") && !timeStr.includes("PM")) return timeStr;
        const [time, modifier] = timeStr.split(" ");
        let [hours, minutes] = time.split(":").map(Number);
        if (modifier === "PM" && hours !== 12) hours += 12;
        if (modifier === "AM" && hours === 12) hours = 0;
        return `${hours.toString().padStart(2,"0")}:${minutes.toString().padStart(2,"0")}`;
    }

    // Convert 24h to 12h
    function formatTime(time24) {
        const [hours, minutes] = time24.split(":").map(Number);
        const modifier = hours >= 12 ? "PM" : "AM";
        const h = hours % 12 || 12;
        return `${h.toString().padStart(2,"0")}:${minutes.toString().padStart(2,"0")} ${modifier}`;
    }

});












// Function to open Schedule Maintenance Modal
function openScheduleMaintenanceModal(vehicleId = "") {
    // Overlay
    const overlay = document.createElement("div");
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background-color: rgba(0,0,0,0.5); display: flex;
        justify-content: center; align-items: center; z-index: 1000;
    `;

    // Modal
    const modal = document.createElement("div");
    modal.style.cssText = `
        background-color: #fff; padding: 25px 30px; border-radius: 12px;
        width: 400px; box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        font-family: 'Inter', sans-serif;
    `;

    // Header
    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";

    const title = document.createElement("h2");
    title.textContent = "Schedule Maintenance";

    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "24px";
    closeBtn.style.color = "#555";
    closeBtn.onclick = () => document.body.removeChild(overlay);

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Form
    const form = document.createElement("form");
    form.style.marginTop = "20px";

    const fields = [
        //{ label: "Vehicle ID", type: "text", name: "vehicleId", placeholder: "", readonly: true, value: vehicleId },
        { label: "Maintenance Type", type: "text", name: "maintenanceType", placeholder: "e.g., Oil Change, Brake Inspection" },
        { label: "Date & Time", type: "datetime-local", name: "dateTime" },
        { label: "Bay / Location", type: "text", name: "bayLocation", placeholder: "e.g., Bay 1, Workshop A" }
    ];

    fields.forEach(f => {
        const wrapper = document.createElement("div");
        wrapper.style.marginBottom = "15px";

        const lbl = document.createElement("label");
        lbl.textContent = f.label;
        lbl.style.display = "block";
        lbl.style.marginBottom = "5px";
        lbl.style.fontWeight = "600";

        const input = document.createElement("input");
        input.type = f.type;
        input.name = f.name;
        input.placeholder = f.placeholder || "";
        input.required = true;
        if (f.readonly) input.readOnly = true;
        if (f.value) input.value = f.value;

        input.style.width = "100%";
        input.style.padding = "8px";
        input.style.borderRadius = "6px";
        input.style.border = "1px solid #ccc";
        input.style.fontSize = "14px";

        wrapper.appendChild(lbl);
        wrapper.appendChild(input);
        form.appendChild(wrapper);
    });

    const submitBtn = document.createElement("button");
    submitBtn.type = "submit";
    submitBtn.textContent = "Save Schedule";
    submitBtn.style.cssText = `
        padding: 10px 25px; background-color: #007BFF; color: #fff;
        border: none; border-radius: 6px; cursor: pointer; font-weight: 600;
    `;
    form.appendChild(submitBtn);

    // Handle Form Submission
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(form).entries());
        console.log("Scheduled Maintenance:", data);
        alert(`✅ Maintenance Scheduled!\n\nVehicle: ${data.vehicleId}\nType: ${data.maintenanceType}\nDate: ${data.dateTime}\nBay: ${data.bayLocation}`);
        document.body.removeChild(overlay);
    });

    modal.appendChild(header);
    modal.appendChild(form);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

// Bind Schedule Maintenance button
document.getElementById("openScheduleBtn")?.addEventListener("click", () => {
    openScheduleMaintenanceModal();
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
