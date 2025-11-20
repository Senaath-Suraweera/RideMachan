// Load HTML components (navbar and header)
document.addEventListener('DOMContentLoaded', function() {
  loadComponent('sidebar', '../components/navbar.html');
  loadComponent('header', '../components/header.html');
});

// Function to load component
function loadComponent(elementId, filePath) {
  fetch(filePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text();
    })
    .then(data => {
      const element = document.getElementById(elementId);
      if (element) {
        element.innerHTML = data;
        
        // If sidebar is loaded, setup mobile toggle
        if (elementId === 'sidebar') {
          setupSidebarToggle();
        }
      }
    })
    .catch(error => {
      console.error('Error loading component:', error);
    });
}

// Setup sidebar toggle for mobile
function setupSidebarToggle() {
  // Create mobile menu button if it doesn't exist
  const header = document.getElementById('header');
  if (header && !document.querySelector('.mobile-menu-toggle')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.style.cssText = `
      display: none;
      background: transparent;
      border: none;
      font-size: 24px;
      color: var(--primary);
      cursor: pointer;
      padding: 8px;
      margin-right: 15px;
    `;
    
    // Show on mobile
    if (window.innerWidth <= 992) {
      toggleBtn.style.display = 'block';
    }
    
    toggleBtn.addEventListener('click', function() {
      const sidebar = document.getElementById('sidebar');
      if (sidebar) {
        sidebar.classList.toggle('active');
      }
    });
    
    // Insert at the beginning of header
    const headerContent = header.querySelector('.header-left') || header;
    headerContent.insertBefore(toggleBtn, headerContent.firstChild);
  }
  
  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', function(event) {
    if (window.innerWidth <= 992) {
      const sidebar = document.getElementById('sidebar');
      const toggleBtn = document.querySelector('.mobile-menu-toggle');
      
      if (sidebar && 
          sidebar.classList.contains('active') && 
          !sidebar.contains(event.target) && 
          !toggleBtn.contains(event.target)) {
        sidebar.classList.remove('active');
      }
    }
  });
  
  // Handle window resize
  window.addEventListener('resize', function() {
    const toggleBtn = document.querySelector('.mobile-menu-toggle');
    if (toggleBtn) {
      if (window.innerWidth <= 992) {
        toggleBtn.style.display = 'block';
      } else {
        toggleBtn.style.display = 'none';
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
          sidebar.classList.remove('active');
        }
      }
    }
  });
}