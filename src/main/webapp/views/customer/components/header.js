// ================= HEADER COMPONENT LOGIC =================
// Exposes: initializeHeader, setPageTitle, showNotifications,
//          showMessages, handleLogout (all on window)

(function () {

  // ---- CONFIG: adjust to match your backend ----
  var PROFILE_ENDPOINT = '/customer/profile/info';
  var LOGOUT_ENDPOINT  = '/customer/logout';
  var LOGIN_PAGE       = '../pages/login.html';
  // ----------------------------------------------

  /**
   * Main entry point — called by content-all.js after header.html is injected.
   */
  function initializeHeader() {
    wireDropdown();
    loadUserData();
  }

  /**
   * Wire the profile dropdown toggle + outside-click close.
   */
  function wireDropdown() {
    var profile  = document.getElementById('userProfile');
    var dropdown = document.getElementById('profileDropdown');
    if (!profile || !dropdown) return;

    // Avoid double-binding if header is reloaded
    if (profile.dataset.dropdownWired === 'true') return;
    profile.dataset.dropdownWired = 'true';

    profile.addEventListener('click', function (e) {
      // Don't toggle when clicking links inside the dropdown
      if (e.target.closest('.profile-dropdown a')) return;
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    document.addEventListener('click', function (e) {
      if (!profile.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') dropdown.classList.remove('show');
    });
  }

  /**
   * Fetch the logged-in customer's profile and populate the header.
   */
  function loadUserData() {
    fetch(PROFILE_ENDPOINT, {
      method: 'GET',
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          // Try common field name variations — adjust if your backend differs
          var firstName =
              data.firstname ||
              data.firstName ||
              data.first_name ||
              data.fname ||
              (data.name     ? String(data.name).trim().split(/\s+/)[0]     : null) ||
              (data.fullName ? String(data.fullName).trim().split(/\s+/)[0] : null) ||
              'Customer';

          var nameEl = document.getElementById('userName');
          var initEl = document.getElementById('profileInitial');
          if (nameEl) nameEl.textContent = firstName;
          if (initEl) initEl.textContent = firstName.charAt(0).toUpperCase();

          // On the dashboard, show "Welcome back <Name>"
          var path     = window.location.pathname;
          var filename = path.substring(path.lastIndexOf('/') + 1) || 'index.html';
          if (filename === 'dashboard.html' || filename === 'index.html' || filename === 'home.html') {
            setPageTitle('Welcome back, ' + firstName);
          }

          // Optional: notification / message counts if backend returns them
          if (typeof data.notificationCount === 'number') {
            var nc = document.getElementById('notificationCount');
            if (nc) nc.textContent = data.notificationCount;
          }
          if (typeof data.messageCount === 'number') {
            var mc = document.getElementById('messageCount');
            if (mc) mc.textContent = data.messageCount;
          }
        })
        .catch(function (err) {
          console.error('Profile fetch failed:', err);
          var nameEl = document.getElementById('userName');
          var initEl = document.getElementById('profileInitial');
          if (nameEl) nameEl.textContent = 'Guest';
          if (initEl) initEl.textContent = 'G';
        });
  }

  /**
   * Update the header <h1> title.
   */
  function setPageTitle(title) {
    var el = document.getElementById('pageTitle');
    if (el) el.textContent = title;
    document.title = title + ' | RideMachan';
  }

  // ---------- Action handlers ----------

  function showNotifications() {
    window.location.href = '../pages/notifications.html';
  }

  function showMessages() {
    window.location.href = '../pages/messages.html';
  }

  function handleLogout() {
    if (!confirm('Are you sure you want to log out?')) return;

    fetch(LOGOUT_ENDPOINT, {
      method: 'POST',
      credentials: 'include'
    })
        .then(function () {
          window.location.href = LOGIN_PAGE;
        })
        .catch(function (err) {
          console.error('Logout failed:', err);
          // Redirect anyway so the user isn't stuck
          window.location.href = LOGIN_PAGE;
        });
  }

  // ---- Expose globals (the loader and inline onclick handlers need these) ----
  window.initializeHeader  = initializeHeader;
  window.setPageTitle      = setPageTitle;
  window.showNotifications = showNotifications;
  window.showMessages      = showMessages;
  window.handleLogout      = handleLogout;
})();