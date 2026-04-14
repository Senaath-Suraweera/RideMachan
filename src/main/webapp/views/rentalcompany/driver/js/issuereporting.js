// ==========================================
// Global Variables
// ==========================================
let uploadedFile = null;
let currentIssues = [];

// ==========================================
// Page Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log("Issue Reporting Page Loaded");
    loadPastIssues();
    setupEventListeners();
    setupFileUpload();
});

// ==========================================
// Load Past Issues FROM DATABASE
// ==========================================
function loadPastIssues() {
    const loadingEl = document.getElementById('loadingIssues');
    const noIssuesEl = document.getElementById('noIssues');
    const tableEl = document.getElementById('issuesTable');
    const tableBody = document.getElementById('issuesTableBody');

    console.log("Loading past issues...");

    if (loadingEl) loadingEl.style.display = 'block';
    if (noIssuesEl) noIssuesEl.style.display = 'none';
    if (tableEl) tableEl.style.display = 'none';

    fetch('/IssueServlet?action=getAll')
        .then(response => {
            console.log("Response Status:", response.status);
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            console.log("Issues Data:", data);

            if (loadingEl) loadingEl.style.display = 'none';

            if (data.success && data.issues && data.issues.length > 0) {
                currentIssues = data.issues;
                console.log("Found " + data.issues.length + " issues");

                // Clear existing rows
                if (tableBody) {
                    tableBody.innerHTML = '';

                    // Add each issue to table
                    data.issues.forEach((issue) => {
                        const row = document.createElement('tr');

                        // Status color
                        let statusColor = '#ff9800'; // default orange
                        if (issue.status === 'resolved') statusColor = '#4caf50';
                        else if (issue.status === 'pending') statusColor = '#ff9800';
                        else if (issue.status === 'in-progress') statusColor = '#2196f3';

                        // Format date
                        let formattedDate = 'N/A';
                        if (issue.createdAt) {
                            try {
                                formattedDate = new Date(issue.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                });
                            } catch (e) {
                                formattedDate = issue.createdAt;
                            }
                        }

                        row.innerHTML = `
                            <td><strong>#RPT${String(issue.issueId).padStart(3, '0')}</strong></td>
                            <td>${issue.category || 'N/A'}</td>
                            <td>${issue.description ? (issue.description.length > 50 ? issue.description.substring(0, 50) + '...' : issue.description) : 'N/A'}</td>
                            <td>${formattedDate}</td>
                            <td><span style="color:${statusColor}; font-weight:bold; padding:4px 8px; background:${statusColor}20; border-radius:4px;">${issue.status || 'pending'}</span></td>
                            <td>
                                <button onclick="viewIssue(${issue.issueId})" style="padding:5px 10px; background:#007bff; color:white; border:none; border-radius:3px; cursor:pointer; margin-right:5px;">View</button>
                                <button onclick="deleteIssue(${issue.issueId})" style="padding:5px 10px; background:#dc3545; color:white; border:none; border-radius:3px; cursor:pointer;">Delete</button>
                            </td>
                        `;
                        tableBody.appendChild(row);
                    });

                    tableEl.style.display = 'table';
                    noIssuesEl.style.display = 'none';
                }
            } else {
                console.log("No issues found");
                if (noIssuesEl) noIssuesEl.style.display = 'block';
                if (tableEl) tableEl.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error loading issues:', error);
            if (loadingEl) loadingEl.style.display = 'none';
            if (noIssuesEl) noIssuesEl.style.display = 'block';
            if (tableEl) tableEl.style.display = 'none';
            showNotification('Failed to load issues', 'error');
        });
}

// ==========================================
// View Issue Details
// ==========================================
function viewIssue(issueId) {
    console.log("Viewing issue:", issueId);
    fetch('/IssueServlet?action=getById&issueId=' + issueId)
        .then(response => response.json())
        .then(data => {
            console.log("Issue Details:", data);
            if (data.success && data.issue) {
                const i = data.issue;
                let details = '=== ISSUE DETAILS ===\n\n';
                details += 'Issue ID: #RPT' + String(i.issueId).padStart(3, '0') + '\n';
                details += 'Category: ' + (i.category || 'N/A') + '\n';
                details += 'Location: ' + (i.location || 'N/A') + '\n';
                details += 'Status: ' + (i.status || 'pending') + '\n';
                details += 'Description: ' + (i.description || 'N/A') + '\n';
                details += 'Plate Number: ' + (i.plateNumber || 'N/A') + '\n';
                details += 'Booking ID: ' + (i.bookingId || 'N/A') + '\n';
                details += 'Driveable: ' + (i.isDriveable !== null ? (i.isDriveable ? 'Yes' : 'No') : 'N/A') + '\n';
                details += 'Date: ' + (i.createdAt ? new Date(i.createdAt).toLocaleDateString() : 'N/A');
                alert(details);
            } else {
                alert('Issue not found');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Error loading issue details');
        });
}

// ==========================================
// Delete Issue
// ==========================================
function deleteIssue(issueId) {
    if (confirm('Are you sure you want to delete issue #RPT' + String(issueId).padStart(3, '0') + '?')) {
        const formData = new FormData();
        formData.append('action', 'delete');
        formData.append('issueId', issueId);

        fetch('/IssueServlet', {
            method: 'POST',
            body: formData
        })
            .then(response => response.json())
            .then(data => {
                console.log("Delete Response:", data);
                if (data.success) {
                    showNotification('Issue deleted successfully!', 'success');
                    loadPastIssues(); // Reload the list
                } else {
                    showNotification('Failed to delete issue', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showNotification('Error deleting issue', 'error');
            });
    }
}

// ==========================================
// Setup Event Listeners
// ==========================================
function setupEventListeners() {
    // Form submit
    const issueForm = document.getElementById('issueForm');
    if (issueForm) {
        issueForm.addEventListener('submit', handleFormSubmit);
    }

    // Logout
    const logoutBtn = document.querySelector('.logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.getElementById('sidebar');
            if (sidebar) sidebar.classList.toggle('active');
        });
    }
}

// ==========================================
// Setup File Upload
// ==========================================
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const photoInput = document.getElementById('photoInput');

    if (!uploadArea || !photoInput) return;

    // Click to upload
    uploadArea.addEventListener('click', () => photoInput.click());

    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#007bff';
        uploadArea.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = '#fafafa';
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.style.borderColor = '#ddd';
        uploadArea.style.backgroundColor = '#fafafa';
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });

    // File input change
    photoInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

// ==========================================
// Handle File Selection
// ==========================================
function handleFileSelect(file) {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showNotification('Please upload a valid image file', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showNotification('File size must be less than 5MB', 'error');
        return;
    }

    uploadedFile = file;
    const uploadText = document.getElementById('uploadText');
    if (uploadText) {
        uploadText.innerHTML = `<strong>${file.name}</strong><br><small>${(file.size / 1024).toFixed(2)} KB</small>`;
    }

    showNotification('File selected: ' + file.name, 'success');
}

// ==========================================
// Submit Issue Form
// ==========================================
function handleFormSubmit(e) {
    e.preventDefault();

    console.log("=== Form Submit ===");

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
        .then(response => {
            console.log("Submit Response Status:", response.status);
            return response.json();
        })
        .then(data => {
            console.log("Submit Response Data:", data);

            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;

            if (data.success) {
                showNotification('Issue submitted successfully!', 'success');
                document.getElementById('issueForm').reset();
                uploadedFile = null;
                const uploadText = document.getElementById('uploadText');
                if (uploadText) uploadText.innerHTML = '<strong>Choose file</strong> or drag and drop';

                // Reload issues after submission
                setTimeout(() => {
                    loadPastIssues();
                }, 500);
            } else {
                showNotification('Failed to submit issue', 'error');
            }
        })
        .catch(error => {
            console.error('Submit Error:', error);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            showNotification('Error submitting issue', 'error');
        });
}

// ==========================================
// Show Notification
// ==========================================
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = 'position:fixed;top:20px;right:20px;padding:15px 20px;border-radius:5px;color:white;font-weight:bold;z-index:9999;box-shadow:0 2px 10px rgba(0,0,0,0.2);';

    if (type === 'success') notification.style.background = '#28a745';
    else if (type === 'error') notification.style.background = '#dc3545';
    else notification.style.background = '#17a2b8';

    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.3s';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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