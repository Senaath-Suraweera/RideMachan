// Add click functionality to buttons
        document.addEventListener('DOMContentLoaded', function() {
            // Upload photo button functionality
            const uploadBtn = document.querySelector('.choose-files-btn');
            const fileInput = document.getElementById('fileInput');
            const profileAvatar = document.querySelector('.profile-avatar');


            uploadBtn.addEventListener('click', function() {
                fileInput.click();
            });

            fileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file && file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        profileAvatar.style.backgroundImage = `url('${event.target.result}')`;
                        profileAvatar.style.backgroundSize = 'cover';
                        profileAvatar.style.backgroundPosition = 'center';
                        profileAvatar.style.borderRadius = '50%';
                        profileAvatar.textContent = '';
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Account Action Buttons
            const actionButtons = document.querySelectorAll('.quick-actions .action-btn');
            

                     // Change Password Modal logic
            const changePasswordBtn = document.querySelector('.quick-actions .action-btn');
            const modal = document.getElementById('changePasswordModal');
            const closeBtn = document.getElementById('closeChangePassword');
            const submitBtn = document.getElementById('submitNewPassword');
            const passwordInput = document.getElementById('newPasswordInput');
            const errorDiv = document.getElementById('passwordError');

            changePasswordBtn.addEventListener('click', function() {
                modal.style.display = 'flex';
                passwordInput.value = '';
                errorDiv.textContent = '';
                // Modal flex centering
                modal.style.alignItems = 'center';
                modal.style.justifyContent = 'center';
            });

            closeBtn.addEventListener('click', function() {
                modal.style.display = 'none';
            });

            submitBtn.addEventListener('click', function() {
                const newPassword = passwordInput.value.trim();
                if (newPassword.length < 6) {
                    errorDiv.textContent = 'Password must be at least 6 characters long';
                } else {
                    errorDiv.textContent = '';
                    modal.style.display = 'none';
                    
                }
            });


            submitBtn.style.backgroundColor = '#28a745';

            // Optional: close modal on outside click
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });


           
            // Update Profile Button (second button)
            

















            

            // Notification Settings Button (third button)
            actionButtons[2].addEventListener('click', function() {
                const settings = {
                    email: confirm('Enable email notifications?'),
                    sms: confirm('Enable SMS notifications?'),
                    push: confirm('Enable push notifications?')
                };
                
                let settingsText = 'Notification Settings:\n';
                settingsText += `Email: ${settings.email ? 'Enabled' : 'Disabled'}\n`;
                settingsText += `SMS: ${settings.sms ? 'Enabled' : 'Disabled'}\n`;
                settingsText += `Push: ${settings.push ? 'Enabled' : 'Disabled'}`;
                
                alert(settingsText + '\n\nSettings would be saved to server');
                // Here you would send the settings to your server
            });

            // Logout Button (fourth button)
            actionButtons[3].addEventListener('click', function() {
                const confirmLogout = confirm('Are you sure you want to logout?\n\nYou will need to login again to access your account.');
                if (confirmLogout) {
                    // Show a brief "logging out" message
                    alert('Logging out...');
                    // Here you would typically:
                    // 1. Clear session/local storage
                    // 2. Redirect to login page
                    // 3. Call logout API
                    setTimeout(() => {
                        alert('Logout functionality would redirect to login page');
                    }, 500);
                }
            });

            // Navigation links functionality
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    if (this.getAttribute('href') === '#') {
                        e.preventDefault();
                        const linkText = this.querySelector('span').textContent;
                        alert(`${linkText} feature will be available soon`);
                    }
                });
            });

            // Search functionality
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.addEventListener('keypress', function(e) {
                    if (e.key === 'Enter') {
                        const searchTerm = this.value.trim();
                        if (searchTerm) {
                            alert(`Search functionality would be implemented here\nSearching for: "${searchTerm}"`);
                        } else {
                            alert('Please enter a search term');
                        }
                    }
                });
            }

            // Notification bell functionality
            const notificationBell = document.querySelector('.notification');
            if (notificationBell) {
                notificationBell.addEventListener('click', function() {
                    alert('Notifications:\n• Vehicle maintenance due tomorrow\n• New message from supervisor\n• Weekly report ready for review');
                });
            }

            // User profile menu functionality
            const userProfile = document.querySelector('.user-profile');
            if (userProfile) {
                userProfile.addEventListener('click', function() {
                    const menuChoice = confirm('User Menu:\n\nClick OK for Profile Settings\nClick Cancel for Quick Actions');
                    if (menuChoice) {
                        
                    } else {
                        
                    }
                });
            }
        });

        // Additional helper functions
        function showNotifications() {
            alert('Notifications Panel:\n\n• Vehicle ABC123 maintenance scheduled for tomorrow\n• Message from John (Supervisor)\n• Weekly maintenance report ready\n\nClick on any notification to view details');
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
           












        
        













        // Create modal dynamically
        const modal = document.createElement('div');
        modal.id = 'profileModal';
        modal.style.display = 'none'; // hidden initially
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';

        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#fff';
        modalContent.style.padding = '20px';
        modalContent.style.borderRadius = '8px';
        modalContent.style.width = '300px';
        modalContent.style.position = 'relative';

        // Close button
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '10px';
        closeBtn.style.right = '15px';
        closeBtn.style.fontSize = '24px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.onclick = () => { modal.style.display = 'none'; };

        // Modal title
        const title = document.createElement('h3');
        title.innerText = 'Update Personal Info';
        title.style.textAlign = 'center';
        title.style.marginBottom = '15px';

        // Form fields
        const form = document.createElement('div');

        const fields = [
            {label: 'Full Name', id: 'fullName', value: 'Mr. Sivajan'},
            {label: 'Email', id: 'email', value: 'sivajan@ridemachan.com'},
            {label: 'Phone no', id: 'phoneNo', value: '0771234567'},
            {label: 'NIC', id: 'nic', value: '123456789V'}
        ];

        fields.forEach(f => {
            const div = document.createElement('div');
            div.style.marginBottom = '10px';
            const lbl = document.createElement('label');
            lbl.innerText = f.label;
            lbl.style.display = 'block';
            lbl.style.marginBottom = '5px';
            const input = document.createElement('input');
            input.type = 'text';
            input.id = f.id;
            input.value = f.value;
            input.style.width = '100%';
            input.style.padding = '8px';
            input.style.boxSizing = 'border-box';
            input.style.border = '1px solid #ccc';
            input.style.borderRadius = '4px';
            div.appendChild(lbl);
            div.appendChild(input);
            form.appendChild(div);
        });

        // Save button
        const saveBtn = document.createElement('button');
        saveBtn.innerText = 'Save Changes';
        saveBtn.style.padding = '10px 15px';
        saveBtn.style.width = '100%';
        saveBtn.style.background = '#28a745';
        saveBtn.style.color = '#fff';
        saveBtn.style.border = 'none';
        saveBtn.style.borderRadius = '5px';
        saveBtn.style.cursor = 'pointer';
        saveBtn.onclick = () => {
            let updatedValues = '';
            fields.forEach(f => {
                updatedValues += `${f.label}: ${document.getElementById(f.id).value}\n`;
            });
            
            modal.style.display = 'none';
        };

        modalContent.appendChild(closeBtn);
        modalContent.appendChild(title);
        modalContent.appendChild(form);
        modalContent.appendChild(saveBtn);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Button to open modal
        Array.from(document.getElementsByClassName('outline')).forEach(button => {
            button.onclick = () => {
                modal.style.display = 'flex'; // only show on click
            };
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