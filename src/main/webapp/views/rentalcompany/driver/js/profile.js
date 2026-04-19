// ============================================
// PROFILE.JS - Driver Profile Management
// ============================================

// Global variables
let isEditMode = false;
let originalData = {};
let profilePictureBase64 = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Toggle sidebar for mobile
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

// Show/hide loading indicator
function showLoading(show) {
  const loadingDiv = document.getElementById("loadingIndicator");
  const profileHeader = document.getElementById("profileHeader");
  const personalInfo = document.getElementById("personalInfo");
  const companyInfo = document.getElementById("companyInfo");

  if (loadingDiv) {
    loadingDiv.style.display = show ? "block" : "none";
  }
  if (profileHeader) {
    profileHeader.style.display = show ? "none" : "block";
  }
  if (personalInfo) {
    personalInfo.style.display = show ? "none" : "block";
  }
  if (companyInfo) {
    companyInfo.style.display = show ? "none" : "block";
  }
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById("errorMessage");
  const errorText = document.getElementById("errorText");

  if (errorDiv && errorText) {
    errorText.textContent = message;
    errorDiv.style.display = "block";

    // Hide after 5 seconds
    setTimeout(() => {
      errorDiv.style.display = "none";
    }, 5000);
  } else {
    alert("Error: " + message);
  }
}

// Show success message
function showSuccess(message) {
  const successDiv = document.getElementById("successMessage");
  const successText = document.getElementById("successText");

  if (successDiv && successText) {
    successText.textContent = message;
    successDiv.style.display = "block";

    // Hide after 5 seconds
    setTimeout(() => {
      successDiv.style.display = "none";
    }, 5000);
  } else {
    alert("Success: " + message);
  }
}

// Calculate years of experience from join date
function calculateExperience(joinedDate) {
  if (!joinedDate) return "N/A";

  const joined = new Date(joinedDate);
  const now = new Date();
  const years = now.getFullYear() - joined.getFullYear();
  const months = now.getMonth() - joined.getMonth();

  const adjustedYears =
    months < 0 || (months === 0 && now.getDate() < joined.getDate())
      ? years - 1
      : years;

  if (adjustedYears === 0) {
    const totalMonths = months < 0 ? 12 + months : months;
    return `${totalMonths} month${totalMonths !== 1 ? "s" : ""} Experience`;
  }

  return `${adjustedYears} year${adjustedYears !== 1 ? "s" : ""} Experience`;
}

// Format date as DD-MM-YYYY
function formatDate(dateString) {
  if (!dateString) return "-";

  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}

// Get first letter for avatar
function getInitial(name) {
  if (!name) return "?";
  return name.charAt(0).toUpperCase();
}

// Safely set element text content
function setTextContent(elementId, value, defaultValue = "-") {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = value || defaultValue;
  }
}

// Safely set input value
function setInputValue(elementId, value, defaultValue = "") {
  const element = document.getElementById(elementId);
  if (element) {
    element.value = value || defaultValue;
  }
}

// Update profile picture display
function updateProfilePicture(base64Image) {
  const profileImage = document.getElementById("profileImage");
  const profileAvatar = document.getElementById("profileAvatar");
  const headerInitial = document.getElementById("headerInitial");

  if (base64Image) {
    // Show image
    if (profileImage) {
      profileImage.src = base64Image;
      profileImage.style.display = "block";
    }
    if (profileAvatar) {
      profileAvatar.style.display = "none";
    }

    // Update header with image
    if (headerInitial) {
      headerInitial.style.backgroundImage = `url(${base64Image})`;
      headerInitial.style.backgroundSize = "cover";
      headerInitial.style.backgroundPosition = "center";
      headerInitial.textContent = "";
    }
  } else {
    // Show initials
    if (profileImage) {
      profileImage.style.display = "none";
    }
    if (profileAvatar) {
      profileAvatar.style.display = "flex";
    }
  }
}

// Trigger file upload dialog
function triggerFileUpload() {
  document.getElementById("profilePictureInput").click();
}

// Handle profile picture change
function handleProfilePictureChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith("image/")) {
    showError("Please select a valid image file");
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showError("Image size should be less than 5MB");
    return;
  }

  // Read file and convert to base64
  const reader = new FileReader();
  reader.onload = function (e) {
    profilePictureBase64 = e.target.result;
    updateProfilePicture(profilePictureBase64);
    showSuccess(
      'Profile picture updated. Click "Save Profile" to apply changes.',
    );
  };
  reader.onerror = function () {
    showError("Failed to read image file");
  };
  reader.readAsDataURL(file);
}

// ============================================
// BACKEND COMMUNICATION
// ============================================

// Load driver profile data from backend
async function loadDriverProfile() {
  showLoading(true);

  try {
    const response = await fetch("/driver/profile", {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert("Session expired. Please login again.");
        window.location.href = "/views/landing/driverlogin.html";
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);

    if (data.status === "error") {
      throw new Error(data.message);
    }

    populateProfile(data);
    showLoading(false);
  } catch (error) {
    console.error("Error loading profile:", error);
    showError("Failed to load profile: " + error.message);
    showLoading(false);
  }
}

// Populate profile with driver data
function populateProfile(driver) {
  originalData = { ...driver };

  console.log("Populating profile with data:", driver);

  // ===== HEADER SECTION =====
  const fullName = (driver.firstName || "") + " " + (driver.lastName || "");
  setTextContent("headerName", driver.firstName, "Driver");

  const headerInitial = document.getElementById("headerInitial");
  if (headerInitial) {
    headerInitial.textContent = getInitial(driver.firstName);
  }

  // ===== PROFILE HEADER SECTION =====
  setTextContent("profileAvatar", getInitial(driver.firstName), "?");
  setTextContent(
    "profileFullName",
    fullName.trim() || "Driver Name",
    "Driver Name",
  );

  // Update profile picture if available
  if (driver.profilePicture) {
    updateProfilePicture(driver.profilePicture);
    profilePictureBase64 = driver.profilePicture;
  }

  // ===== PERSONAL INFORMATION =====
  setInputValue("firstname", driver.firstName);
  setInputValue("lastname", driver.lastName);
  setInputValue("email", driver.email);
  setInputValue("mobilenumber", driver.mobileNumber);
  setInputValue("homeaddress", driver.homeAddress);
  setInputValue("licensenumber", driver.licenseNumber);
  setInputValue("driverid", driver.driverId);
  setInputValue("nicnumber", driver.nicNumber);

  // ===== COMPANY INFORMATION (READ-ONLY) =====
  setTextContent("companyName", driver.companyName, "N/A");
  setTextContent("joinedDate", formatDate(driver.joinedDate), "-");
  setTextContent("experience", calculateExperience(driver.joinedDate), "N/A");
  setTextContent("assignedArea", driver.assignedArea, "Not Assigned");
  setTextContent("shiftTime", driver.shiftTime, "Not Set");
  setTextContent("reportingManager", driver.reportingManager, "Not Assigned");
}

// ============================================
// EDIT MODE FUNCTIONALITY
// ============================================

// Toggle edit mode
function toggleEditMode(event) {
  if (event) {
    event.preventDefault();
  }

  // Get editable fields (exclude driverid and nicnumber as they're readonly)
  const editableFields = [
    "firstname",
    "lastname",
    "email",
    "mobilenumber",
    "homeaddress",
    "licensenumber",
  ];
  const editButton = document.getElementById("edit-button-text");
  const editIcon = document.getElementById("editIcon");
  const editAvatarBtn = document.getElementById("editAvatarBtn");

  if (!editButton) {
    console.error("Edit button not found");
    return;
  }

  isEditMode = !isEditMode;

  if (isEditMode) {
    // ===== ENABLE EDIT MODE =====
    editableFields.forEach((fieldId) => {
      const input = document.getElementById(fieldId);
      if (input) {
        input.removeAttribute("readonly");
        input.classList.add("editable");
        input.style.backgroundColor = "#ffffff";
        input.style.cursor = "text";
      }
    });

    // Show avatar edit button
    if (editAvatarBtn) {
      editAvatarBtn.style.display = "flex";
    }

    // Update button appearance
    editButton.textContent = "Save Profile";
    if (editIcon) {
      editIcon.className = "fas fa-save info-icon";
    }
  } else {
    // ===== SAVE MODE =====
    saveProfile(editableFields, editButton, editIcon, editAvatarBtn);
  }
}

// Save profile changes
async function saveProfile(
  editableFields,
  editButton,
  editIcon,
  editAvatarBtn,
) {
  // Collect updated data
  const updatedData = {
    firstname: (document.getElementById("firstname")?.value || "").trim(),
    lastname: (document.getElementById("lastname")?.value || "").trim(),
    email: (document.getElementById("email")?.value || "").trim(),
    mobilenumber: (document.getElementById("mobilenumber")?.value || "").trim(),
    homeaddress: (document.getElementById("homeaddress")?.value || "").trim(),
    licensenumber: (
      document.getElementById("licensenumber")?.value || ""
    ).trim(),
    nicnumber: (document.getElementById("nicnumber")?.value || "").trim(),
  };

  // Add profile picture if changed
  if (
    profilePictureBase64 &&
    profilePictureBase64 !== originalData.profilePicture
  ) {
    updatedData.profilepicture = profilePictureBase64;
  }

  // ===== VALIDATION =====
  if (!updatedData.firstname || !updatedData.lastname || !updatedData.email) {
    showError("First name, last name, and email are required");
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(updatedData.email)) {
    showError("Please enter a valid email address");
    return;
  }

  // Show loading state
  const originalButtonText = editButton.textContent;
  editButton.textContent = "Saving...";
  editButton.style.cursor = "wait";

  try {
    // ===== SEND UPDATE REQUEST =====
    const response = await fetch("/driver/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updatedData),
    });

    const result = await response.json();

    if (result.status === "success") {
      // ===== SUCCESS =====

      // Update original data
      originalData = { ...originalData, ...updatedData };

      // Disable editing mode
      editableFields.forEach((fieldId) => {
        const input = document.getElementById(fieldId);
        if (input) {
          input.setAttribute("readonly", "readonly");
          input.classList.remove("editable");
          input.style.backgroundColor = "#f8f9fa";
          input.style.cursor = "default";
        }
      });

      // Hide avatar edit button
      if (editAvatarBtn) {
        editAvatarBtn.style.display = "none";
      }

      // Reset button appearance
      editButton.textContent = "Edit Profile";
      editButton.style.cursor = "pointer";

      if (editIcon) {
        editIcon.className = "fas fa-edit info-icon";
      }

      // Update header with new name
      setTextContent("headerName", updatedData.firstname);
      setTextContent(
        "profileFullName",
        updatedData.firstname + " " + updatedData.lastname,
      );

      // Update initials if no profile picture
      if (!profilePictureBase64) {
        setTextContent("headerInitial", getInitial(updatedData.firstname));
        setTextContent("profileAvatar", getInitial(updatedData.firstname));
      }

      showSuccess(result.message || "Profile updated successfully!");
    } else {
      // ===== ERROR FROM SERVER =====
      showError(result.message || "Failed to update profile");
      editButton.textContent = originalButtonText;
      editButton.style.cursor = "pointer";
    }
  } catch (error) {
    // ===== NETWORK OR OTHER ERROR =====
    console.error("Error saving profile:", error);
    showError(
      "Failed to save profile. Please check your connection and try again.",
    );
    editButton.textContent = originalButtonText;
    editButton.style.cursor = "pointer";
  }
}

// ============================================
// LOGOUT FUNCTIONALITY
// ============================================

// Handle logout
async function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    try {
      const response = await fetch("driverlogout", {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      });

      if (response.ok) {
        window.location.href = "http://localhost:8080/views/landing/index.html";
      } else {
        showError("Logout failed. Please try again.");
      }
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, redirect to login
      window.location.href = "http://localhost:8080/views/landing/index.html";
    }
  }
}

// ============================================
// PAGE INITIALIZATION
// ============================================

// Initialize page when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  console.log("Profile page loaded - initializing...");

  // Load profile data
  loadDriverProfile();

  // Attach logout handler to logout button
  const logoutButton = document.querySelector(".logout");
  if (logoutButton) {
    logoutButton.addEventListener("click", handleLogout);
  }

  // Attach profile picture change handler
  const profilePictureInput = document.getElementById("profilePictureInput");
  if (profilePictureInput) {
    profilePictureInput.addEventListener("change", handleProfilePictureChange);
  }

  console.log("Profile page initialization complete");
});

// ============================================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// ============================================
window.toggleSidebar = toggleSidebar;
window.toggleEditMode = toggleEditMode;
window.handleLogout = handleLogout;
window.triggerFileUpload = triggerFileUpload;
