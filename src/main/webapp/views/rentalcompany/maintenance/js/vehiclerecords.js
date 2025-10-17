// Vehicle management functions
        function viewVehicle(registration) {
            
            window.location.href = `maintenancelog.html?reg=${encodeURIComponent(registration)}`;
            // Implement view vehicle details functionality
        }

        function editVehicle(registration) {
            window.location.href = `maintenance-calender - ABC-1234.html?vehicle=${encodeURIComponent(registration)}`;
            // Implement edit vehicle functionality
        }

        function scheduleService(registration) {
            alert(`Scheduling service for vehicle: ${registration}`);
            // Implement schedule service functionality
        }

        function addNewVehicle() {
            alert('Opening add new vehicle form...');
            // Implement add new vehicle functionality
        }

        function scheduleInspection() {
            alert('Opening inspection scheduler...');
            // Implement schedule inspection functionality
        }

        function generateReport() {
            alert('Generating fleet report...');
            // Implement report generation functionality
        }

        // Search functionality
        document.getElementById('vehicleSearch')?.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#vehicleTable tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });

        // Filter functionality
        document.getElementById('statusFilter')?.addEventListener('change', function(e) {
            const filterValue = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#vehicleTable tbody tr');
            
            rows.forEach(row => {
                const statusCell = row.querySelector('.status');
                const statusText = statusCell.textContent.toLowerCase();
                
                if (filterValue === '' || statusText.includes(filterValue)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });

        document.getElementById('typeFilter')?.addEventListener('change', function(e) {
            const filterValue = e.target.value.toLowerCase();
            const rows = document.querySelectorAll('#vehicleTable tbody tr');
            
            rows.forEach(row => {
                const typeCell = row.cells[2]; // Type column
                const typeText = typeCell.textContent.toLowerCase();
                
                if (filterValue === '' || typeText.includes(filterValue)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });








                // Function to get URL query parameters
        function getQueryParam(param) {
            const urlParams = new URLSearchParams(window.location.search);
            return urlParams.get(param);
        }

        // Filter table if reg number is passed in URL
        const regToShow = getQueryParam('reg');
        if (regToShow) {
            const rows = document.querySelectorAll('#vehicleTable tbody tr');
            rows.forEach(row => {
                const regCell = row.cells[0].textContent.trim();
                if (regCell.toLowerCase() === regToShow.toLowerCase()) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
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