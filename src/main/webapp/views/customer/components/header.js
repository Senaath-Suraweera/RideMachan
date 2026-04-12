// ================= COMPONENT LOADER =================
// Load HTML components (navbar and header)
document.addEventListener('DOMContentLoaded', function () {
  loadComponent('sidebar', '../components/navbar.html');
  loadComponent('header', '../components/header.html');
});

/**
 * Fetch an HTML component, inject it, execute any <script> tags inside it,
 * then run component-specific initialisation.
 */
function loadComponent(elementId, filePath) {
  fetch(filePath)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.text();
      })
      .then(data => {
        const container = document.getElementById(elementId);
        if (!container) return;

        // 1) Inject the HTML
        container.innerHTML = data;

        // 2) Execute <script> tags that were injected (innerHTML does NOT run them)
        executeInjectedScripts(container);

        // 3) Component-specific setup
        if (elementId === 'sidebar') {
          setupSidebarToggle();
        }

        if (elementId === 'header') {
          // Wait a tick so header.js (loaded above) registers its globals
          waitForGlobal('initializeHeader', function () {
            initializeHeader();          // <-- populates user name, counts, etc.
            setDynamicPageTitle();        // <-- sets title based on current page
          });
        }
      })
      .catch(error => {
        console.error('Error loading component:', error);
      });
}

// ================= SCRIPT EXECUTOR =================
/**
 * After innerHTML injection, <script> tags are inert.
 * This function re-creates each one so the browser runs it.
 */
function executeInjectedScripts(container) {
  const scripts = container.querySelectorAll('script');

  scripts.forEach(oldScript => {
    const newScript = document.createElement('script');

    // Copy attributes (src, type, etc.)
    [...oldScript.attributes].forEach(attr =>
        newScript.setAttribute(attr.name, attr.value)
    );

    // Copy inline code
    if (!oldScript.src) {
      newScript.textContent = oldScript.textContent;
    }

    // Replace old (inert) tag with executable one
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });
}

// ================= WAIT FOR GLOBAL =================
/**
 * External scripts (header.js) load asynchronously.
 * Poll until the function is on `window`, then call the callback.
 */
function waitForGlobal(fnName, callback, maxWait) {
  maxWait = maxWait || 3000;
  var start = Date.now();

  (function poll() {
    if (typeof window[fnName] === 'function') {
      callback();
    } else if (Date.now() - start < maxWait) {
      setTimeout(poll, 50);
    } else {
      console.warn(fnName + ' not available after ' + maxWait + 'ms');
    }
  })();
}

// ================= DYNAMIC PAGE TITLE =================
/**
 * Automatically sets the header <h1> based on the current page filename.
 * Each page gets its correct title without hard-coding inside header.html.
 *
 * NOTE: The /customer/profile/info endpoint in header.js already overrides
 * this with "Welcome back <Name>" for the dashboard. For all other pages
 * this function provides the correct heading.
 */
function setDynamicPageTitle() {
  // Map filenames → display titles
  var pageTitles = {
    'dashboard.html':     'Dashboard',
    'bookings.html':      'My Bookings',
    'vehicles.html':      'Available Vehicles',
    'search.html':        'Search Vehicles',
    'settings.html':      'Settings',
    'profile.html':       'My Profile',
    'notifications.html': 'Notifications',
    'payments.html':      'Payments',
    'drivers.html':       'Drivers',
    'reports.html':       'Reports',
    'users.html':         'Manage Users',
    'wallet.html':        'Wallet',
    'support.html':       'Help & Support',
    'index.html':         'Dashboard'
  };

  // Extract filename from URL path
  var path     = window.location.pathname;
  var filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';

  var title = pageTitles[filename];

  // Only override if we have a mapping AND we're NOT on the dashboard
  // (dashboard title is set by loadUserData → "Welcome back <Name>")
  if (title && filename !== 'dashboard.html' && filename !== 'index.html') {
    if (typeof setPageTitle === 'function') {
      setPageTitle(title);
    }
  }
}

// ================= SIDEBAR TOGGLE (MOBILE) =================
function setupSidebarToggle() {
  var header = document.getElementById('header');
  if (header && !document.querySelector('.mobile-menu-toggle')) {
    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-menu-toggle';
    toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
    toggleBtn.style.cssText =
        'display:none;background:transparent;border:none;font-size:24px;' +
        'color:var(--primary);cursor:pointer;padding:8px;margin-right:15px;';

    if (window.innerWidth <= 992) toggleBtn.style.display = 'block';

    toggleBtn.addEventListener('click', function () {
      var sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.classList.toggle('active');
    });

    var target = header.querySelector('.header-left') || header;
    target.insertBefore(toggleBtn, target.firstChild);
  }

  // Close sidebar on outside click (mobile)
  document.addEventListener('click', function (event) {
    if (window.innerWidth <= 992) {
      var sidebar   = document.getElementById('sidebar');
      var toggleBtn = document.querySelector('.mobile-menu-toggle');
      if (
          sidebar &&
          sidebar.classList.contains('active') &&
          !sidebar.contains(event.target) &&
          toggleBtn && !toggleBtn.contains(event.target)
      ) {
        sidebar.classList.remove('active');
      }
    }
  });

  // Show / hide toggle on resize
  window.addEventListener('resize', function () {
    var toggleBtn = document.querySelector('.mobile-menu-toggle');
    if (toggleBtn) {
      toggleBtn.style.display = window.innerWidth <= 992 ? 'block' : 'none';
      if (window.innerWidth > 992) {
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('active');
      }
    }
  });
}