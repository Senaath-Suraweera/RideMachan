// Set today's date as default
        document.getElementById('inspectionDate').valueAsDate = new Date();

        // Checklist functionality
        function toggleCheck(item) {
            const checkbox = item.querySelector('.checkbox');
            const isChecked = checkbox.classList.contains('checked');
            
            if (isChecked) {
                checkbox.classList.remove('checked');
                item.classList.remove('checked');
            } else {
                checkbox.classList.add('checked');
                item.classList.add('checked');
            }
            
            updateProgress();
        }

        function updateProgress() {
            const checkboxes = document.querySelectorAll('.checkbox');
            const checkedBoxes = document.querySelectorAll('.checkbox.checked');
            const progress = (checkedBoxes.length / checkboxes.length) * 100;
            
            document.getElementById('progressFill').style.width = progress + '%';
            document.getElementById('progressText').textContent = Math.round(progress) + '%';
        }

        // Status selection
        let selectedStatus = null;

        function selectStatus(button, status) {
            // Remove selected class from all status buttons
            document.querySelectorAll('.status-btn').forEach(btn => {
                btn.classList.remove('selected');
            });
            
            // Add selected class to clicked button
            button.classList.add('selected');
            selectedStatus = status;
        }

        // Form submission
        function submitInspection() {
            const registration = document.querySelector('input[placeholder="Enter registration number"]').value;
            const inspectionType = document.querySelector('select').value;
            const priorityLevel = document.querySelectorAll('select')[1].value;
            const issues = document.querySelector('textarea').value;
            const inspectionDate = document.getElementById('inspectionDate').value;
            
            if (!registration) {
                alert('Please enter vehicle registration number');
                return;
            }
            
            if (!selectedStatus) {
                alert('Please select vehicle status');
                return;
            }
            
            // Simulate form submission
            alert(`Inspection submitted successfully!\n\nVehicle: ${registration}\nType: ${inspectionType}\nStatus: ${selectedStatus}\nDate: ${inspectionDate}`);
        }

        // Quick action functions
        function notifyAdmin() {
            alert('Admin notification sent successfully!');
        }

        function reportHazard() {
            alert('Safety hazard report form opened');
        }

        function emergencyWorkOrder() {
            alert('Emergency work order created');
        }

        function contactSupervisor() {
            alert('Supervisor contacted via internal messaging');
        }

        function viewAllDocuments() {
            alert('Opening compliance documents viewer');
        }

        // File upload handling
        document.getElementById('fileInput').addEventListener('change', function(e) {
            const files = e.target.files;
            if (files.length > 0) {
                const uploadText = document.querySelector('.upload-text');
                uploadText.textContent = `${files.length} file(s) selected`;
            }
        });











        

        function newInspection() {
            document.querySelector('input[placeholder="Enter registration number"]').value = '';
            document.querySelector('select').selectedIndex = 0;
            document.querySelectorAll('select')[1].selectedIndex = 0;
            document.querySelector('textarea').value = '';
            document.querySelectorAll('.checkbox').forEach(box => box.classList.remove('checked'));
            document.querySelectorAll('.checklist-item').forEach(item => item.classList.remove('checked'));
            document.getElementById('progressFill').style.width = '0%';
            document.getElementById('progressText').textContent = '0%';
            document.querySelectorAll('.status-btn').forEach(btn => btn.classList.remove('selected'));
            selectedStatus = null;
            document.querySelector('.upload-text').textContent = 'Upload inspection photos';
            document.getElementById('inspectionDate').valueAsDate = new Date();
            
            alert('New inspection form is ready!');
        }





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