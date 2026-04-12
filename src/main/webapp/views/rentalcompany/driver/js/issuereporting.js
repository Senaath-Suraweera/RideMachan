// ==========================================
// Global Variables
// ==========================================
let uploadedFile = null;
let currentIssues = [];

// ==========================================
// Page Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("hi")
    checkAuthentication();
    console.log("hello")
    loadUserProfile();
    loadPastIssues();
    setupEventListeners();
});

// ==========================================
// Authentication Check
// ==========================================
// function checkAuthentication() {
//     fetch('/CheckSessionServlet')
//         .then(response => response.json())
//         .then(data => {
//             if (!data.loggedIn) {
//                 alert('Please login first');
//                 console.log("hi")
//                 window.location.href = '/views/landing/driverlogin.html';
//             }
//         })
//         .catch(error => {
//             console.error('Session check error:', error);
//             console.log("hi")
//             alert('Please login first1');
//             window.location.href = '/views/landing/driverlogin.html';
//         });
// }

// ==========================================
// Load User Profile
// ==========================================
function loadUserProfile() {
    fetch('/DriverProfileServlet?action=getProfile')
        .then(response => response.json())
        .then(data => {
            if (data.success && data.driver) {
                const driver = data.driver;
                const userNameEl = document.getElementById('userName');
                const profileImgEl = document.getElementById('profileImg');

                if (userNameEl) {
                    userNameEl.textContent = driver.firstName || driver.username;
                }

                if (profileImgEl) {
                    const initial = (driver.firstName || driver.username).charAt(0).toUpperCase();
                    profileImgEl.textContent = initial;
                }
            }
        })
        .catch(error => {
            console.error('Error loading profile:', error);
        });
}

// ==========================================
// Load Past Issues
// ==========================================
function loadPastIssues() {
    const loadingEl = document.getElementById('loadingIssues');
    const noIssuesEl = document.getElementById('noIssues');
    const tableEl = document.getElementById('issuesTable');
    const tableBody = document.getElementById('issuesTableBody');

    if (loadingEl) loadingEl.style.display = 'block';
    if (noIssuesEl) noIssuesEl.style.display = 'none';
    if (tableEl) tableEl.style.display = 'none';

    fetch('/IssueServlet?action=getAll')
        .then(response => response.json())
        .then(data => {
            if (loadingEl) loadingEl.style.display = 'none';

            if (data.success && data.issues && data.issues.length > 0) {
                currentIssues = data.issues;
                displayIssues(data.issues);
                if (tableEl) tableEl.style.display = 'table';
            } else {
                if (noIssuesEl) noIssuesEl.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error loading issues:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            showNotification('Failed to load issues', 'error');
        });
}

// ... rest of your code remains unchanged ...

// ==========================================
// Submit Issue
// ==========================================
function handleFormSubmit(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const originalText = submitBtn.innerHTML;

    const category = document.getElementById('category').value;
    const location = document.getElementById('location').value;
    const description = document.getElementById('description').value;

    if (!category || !location || !description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
    submitBtn.disabled = true;

    const formData = new FormData();
    formData.append('action', 'create');
    formData.append('category', category);
    formData.append('location', location);
    formData.append('description', description);
    formData.append('bookingId', document.getElementById('booking-id').value || '');
    formData.append('plateNumber', document.getElementById('plate-number').value || '');

    const driveableYes = document.getElementById('driveable-yes');
    const driveableNo = document.getElementById('driveable-no');
    if (driveableYes && driveableYes.checked) {
        formData.append('driveable', 'yes');
    } else if (driveableNo && driveableNo.checked) {
        formData.append('driveable', 'no');
    }

    if (uploadedFile) {
        formData.append('photo', uploadedFile);
    }

    fetch('/IssueServlet', {
        method: 'POST',
        body: formData
    })
        .then(response => response.json())
        .then(data => {
            // ... your existing code ...
        })
        .catch(error => {
            console.error('Error submitting issue:', error);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            showNotification('Error submitting issue. Please try again.', 'error');
        });
}

// ==========================================
// Cancel Issue
// ==========================================
function cancelIssue(issueId) {
    const formattedId = `#RPT${String(issueId).padStart(3, '0')}`;

    if (confirm(`Are you sure you want to cancel issue ${formattedId}?`)) {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('issueId', issueId);

        fetch('/IssueServlet', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                // ... your existing code ...
            })
            .catch(error => {
                console.error('Error cancelling issue:', error);
                showNotification('Error cancelling issue. Please try again.', 'error');
            });
    }
}

// ==========================================
// Logout Handler
// ==========================================
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        showNotification('Logging out...', 'info');
        setTimeout(() => {
            fetch('/LogoutServlet', { method: 'POST' })
                .then(() => {
                    window.location.href = '/views/landing/driverlogin.html';
                })
                .catch(() => {
                    window.location.href = '/views/landing/driverlogin.html';
                });
        }, 1500);
    }
}
