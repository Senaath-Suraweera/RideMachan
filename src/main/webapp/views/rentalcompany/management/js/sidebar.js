// Sidebar component and navigation functionality
class Sidebar {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        this.render();
        this.bindEvents();
        this.setActivePage('home');
    }

    render() {
        const sidebarHTML = `
            <div class="sidebar">
                <div class="logo">
                    <div class="logo-icon">
                        <i class="fas fa-car"></i>
                    </div>
                    <div class="logo-text">
                        <h2>RideMachan</h2>
                  
                    </div>
                </div>
                
                <nav class="nav-menu">
                    <a href="#" class="nav-item" data-page="home">
                        <i class="fas fa-home"></i>
                        Home
                    </a>
                    <a href="#" class="nav-item" data-page="entity-registration">
                        <i class="fas fa-user-plus"></i>
                        Entity Registration
                    </a>
                    <a href="#" class="nav-item" data-page="drivers">
                        <i class="fas fa-users"></i>
                        Drivers
                    </a>
                    <a href="#" class="nav-item" data-page="bookings">
                        <i class="fas fa-bookmark"></i>
                        Bookings
                    </a>
                    <a href="#" class="nav-item" data-page="vehicle-fleet">
                        <i class="fas fa-car-side"></i>
                        Vehicle Fleet
                    </a>
                    <a href="#" class="nav-item" data-page="maintenance-staff">
                        <i class="fas fa-tools"></i>
                        Maintenance Staff
                    </a>
                    <a href="#" class="nav-item" data-page="profile">
                        <i class="fas fa-user"></i>
                        Profile
                    </a>
                </nav>

                <div class="logout-section">
                    <button class="nav-item" id="logout-btn">
                        <i class="fas fa-sign-out-alt"></i>
                        Logout
                    </button>
                </div>
            </div>
        `;

        document.getElementById('sidebar').innerHTML = sidebarHTML;
    }

    bindEvents() {
        // Navigation events
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.getAttribute('data-page');
                this.navigateTo(page);
            });
        });

        // Logout event
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
    }

    navigateTo(page) {
        this.setActivePage(page);
        this.loadPageContent(page);
    }

    setActivePage(page) {
        // Remove active class from all nav items
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        // Add active class to current page
        const currentItem = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (currentItem) {
            currentItem.classList.add('active');
        }

        this.currentPage = page;
    }

    loadPageContent(page) {
        // This method would typically load different page content
        // For now, we'll just log the navigation and could expand this later
        console.log(`Navigating to: ${page}`);
        
        // You can expand this to actually change the main content
        // based on the selected page
        switch(page) {
            case 'home':
                this.showDashboard();
                break;
            case 'entity-registration':
                this.showEntityRegistration();
                break;
            case 'drivers':
                this.showDrivers();
                break;
            case 'bookings':
                this.showBookings();
                break;
            case 'vehicle-fleet':
                this.showVehicleFleet();
                break;
            case 'maintenance-staff':
                this.showMaintenanceStaff();
                break;
            case 'profile':
                this.showProfile();
                break;
            default:
                this.showDashboard();
        }
    }

    showDashboard() {
        // Dashboard is already shown by default
        document.title = 'RideMechan - Dashboard';
    }

    showEntityRegistration() {
        document.title = 'RideMechan - Entity Registration';
        // Here you would load the entity registration content
        console.log('Loading Entity Registration page...');
    }

    showDrivers() {
        document.title = 'RideMechan - Drivers';
        console.log('Loading Drivers page...');
    }

    showBookings() {
        document.title = 'RideMechan - Bookings';
        console.log('Loading Bookings page...');
    }

    showVehicleFleet() {
        document.title = 'RideMechan - Vehicle Fleet';
        console.log('Loading Vehicle Fleet page...');
    }

    showMaintenanceStaff() {
        document.title = 'RideMechan - Maintenance Staff';
        console.log('Loading Maintenance Staff page...');
    }

    showProfile() {
        document.title = 'RideMechan - Profile';
        console.log('Loading Profile page...');
    }

    logout() {
        if (confirm('Are you sure you want to logout?')) {
            console.log('Logging out...');
            // Here you would typically:
            // 1. Clear user session/tokens
            // 2. Redirect to login page
            // 3. Clear local storage if needed
            
            // For demonstration:
            alert('Logout successful! You would be redirected to the login page.');
            // window.location.href = '/login.html';
        }
    }

    // Method to toggle sidebar on mobile
    toggle() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }

    // Method to close sidebar (useful for mobile)
    close() {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
        }
    }
}

// Initialize sidebar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sidebar = new Sidebar();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sidebar;
}

const logoutBtn = document.querySelector('.logout-section');
logoutBtn.addEventListener('click', () => {
  window.location.href = 'login.html';
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
            profileItem.style.color = 'black';
            profileItem.style.cursor = 'pointer';
            profileItem.addEventListener('click', () => {
                window.location.href = 'profile.html';
            });
            dropdownMenu.appendChild(profileItem);

            // Create "Logout" item
            const logoutItem = document.createElement('div');
            logoutItem.textContent = 'Logout';
            logoutItem.style.padding = '10px';
            logoutItem.style.color = 'black';
            logoutItem.style.cursor = 'pointer';
            logoutItem.addEventListener('click', () => {
                
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