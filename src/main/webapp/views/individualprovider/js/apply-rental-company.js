// Apply for Rental Company JavaScript
document.addEventListener("DOMContentLoaded", function () {
  initializeFilters();
  initializeSort();
  initializeCompanyCards();
});

// Initialize filter functionality
function initializeFilters() {
  const companyNameFilter = document.getElementById("companyNameFilter");
  const locationFilter = document.getElementById("locationFilter");
  const ratingFilter = document.getElementById("ratingFilter");
  const withDriverFilter = document.getElementById("withDriverFilter");

  // Add event listeners for real-time filtering
  companyNameFilter.addEventListener("input", applyFilters);
  locationFilter.addEventListener("input", applyFilters);
  ratingFilter.addEventListener("change", applyFilters);
  withDriverFilter.addEventListener("change", applyFilters);
}

// Initialize sort functionality
function initializeSort() {
  const sortSelect = document.getElementById("sortSelect");
  sortSelect.addEventListener("change", applySorting);
}

// Initialize company card interactions
function initializeCompanyCards() {
  const companyCards = document.querySelectorAll(".company-card");

  companyCards.forEach((card) => {
    // Add click handler for card (excluding button clicks)
    card.addEventListener("click", function (e) {
      if (!e.target.closest(".apply-btn")) {
        const companyName = card.querySelector(".company-name").textContent;
        viewCompanyDetails(companyName);
      }
    });

    // Add hover effect
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-4px)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
    });
  });
}

// Apply filters function
function applyFilters() {
  const companyName = document
    .getElementById("companyNameFilter")
    .value.toLowerCase();
  const location = document
    .getElementById("locationFilter")
    .value.toLowerCase();
  const rating = document.getElementById("ratingFilter").value;
  const withDriver = document.getElementById("withDriverFilter").checked;

  const companyCards = document.querySelectorAll(".company-card");

  companyCards.forEach((card) => {
    let shouldShow = true;

    // Company name filter
    if (companyName) {
      const cardCompanyName = card
        .querySelector(".company-name")
        .textContent.toLowerCase();
      if (!cardCompanyName.includes(companyName)) {
        shouldShow = false;
      }
    }

    // Location filter
    if (location) {
      const cardLocation = card
        .querySelector(".company-location")
        .textContent.toLowerCase();
      if (!cardLocation.includes(location)) {
        shouldShow = false;
      }
    }

    // Rating filter
    if (rating !== "All ratings") {
      const cardRating = parseInt(card.dataset.rating);
      switch (rating) {
        case "5 Stars":
          if (cardRating < 5) shouldShow = false;
          break;
        case "4+ Stars":
          if (cardRating < 4) shouldShow = false;
          break;
        case "3+ Stars":
          if (cardRating < 3) shouldShow = false;
          break;
        case "2+ Stars":
          if (cardRating < 2) shouldShow = false;
          break;
      }
    }

    // With driver filter
    if (withDriver) {
      const driverCount = parseInt(
        card.querySelector(".driver-count").textContent
      );
      if (driverCount === 0) {
        shouldShow = false;
      }
    }

    // Apply filter with animation
    if (shouldShow) {
      card.style.display = "block";
      card.classList.remove("filtered-out");
      card.classList.add("filtered-in");
    } else {
      card.classList.remove("filtered-in");
      card.classList.add("filtered-out");
      setTimeout(() => {
        if (card.classList.contains("filtered-out")) {
          card.style.display = "none";
        }
      }, 300);
    }
  });

  updateResultsCount();
}

// Apply sorting
function applySorting() {
  const sortValue = document.getElementById("sortSelect").value;
  const container = document.querySelector(".companies-container");
  const companyCards = Array.from(container.querySelectorAll(".company-card"));

  companyCards.sort((a, b) => {
    switch (sortValue) {
      case "Sort by Name (A-Z)":
        return a
          .querySelector(".company-name")
          .textContent.localeCompare(
            b.querySelector(".company-name").textContent
          );
      case "Sort by Name (Z-A)":
        return b
          .querySelector(".company-name")
          .textContent.localeCompare(
            a.querySelector(".company-name").textContent
          );
      case "Sort by Location":
        return a
          .querySelector(".company-location")
          .textContent.localeCompare(
            b.querySelector(".company-location").textContent
          );
      case "Sort by Reviews":
        const reviewsA = parseInt(
          a.querySelector(".rating-text").textContent.match(/\d+/)[0]
        );
        const reviewsB = parseInt(
          b.querySelector(".rating-text").textContent.match(/\d+/)[0]
        );
        return reviewsB - reviewsA;
      case "Sort by Rating":
      default:
        const ratingA = parseInt(a.dataset.rating);
        const ratingB = parseInt(b.dataset.rating);
        return ratingB - ratingA;
    }
  });

  // Re-append sorted cards
  companyCards.forEach((card) => container.appendChild(card));
}

// Search companies function
function searchCompanies() {
  applyFilters();

  // Add visual feedback
  const searchButton = event.target;
  const originalText = searchButton.textContent;
  searchButton.textContent = "🔄 Searching...";
  searchButton.disabled = true;

  setTimeout(() => {
    searchButton.textContent = originalText;
    searchButton.disabled = false;
  }, 1000);
}

// Update results count
function updateResultsCount() {
  const visibleCards = document.querySelectorAll(
    '.company-card:not([style*="display: none"])'
  ).length;
  const totalCards = document.querySelectorAll(".company-card").length;

  console.log(`Showing ${visibleCards} of ${totalCards} companies`);

  // You could add a results counter to the UI here
}

// View company details
function viewCompanyDetails(companyName) {
  console.log(`Viewing details for: ${companyName}`);
  // In a real app, this could open a detailed company profile modal
  // or navigate to a company details page
}

// Modal functions
function openApplicationModal(companyName) {
  const modal = document.getElementById("applicationModal");
  const modalCompanyName = document.getElementById("modalCompanyName");

  modalCompanyName.textContent = companyName;
  modal.classList.add("active");
  document.body.style.overflow = "hidden";

  // Reset form
  document.getElementById("applicationForm").reset();

  // Add animation
  const modalContent = modal.querySelector(".modal");
  modalContent.style.transform = "scale(0.7)";
  modalContent.style.opacity = "0";

  setTimeout(() => {
    modalContent.style.transform = "scale(1)";
    modalContent.style.opacity = "1";
    modalContent.style.transition = "all 0.3s ease";
  }, 10);
}

function closeApplicationModal() {
  const modal = document.getElementById("applicationModal");
  const modalContent = modal.querySelector(".modal");

  modalContent.style.transform = "scale(0.7)";
  modalContent.style.opacity = "0";

  setTimeout(() => {
    modal.classList.remove("active");
    document.body.style.overflow = "";
    modalContent.style.transform = "";
    modalContent.style.opacity = "";
    modalContent.style.transition = "";
  }, 300);
}

// Handle application form submission
document
  .getElementById("applicationForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(this);
    const applicationData = Object.fromEntries(formData);

    // Get selected vehicles
    const selectedVehicles = [];
    this.querySelectorAll('input[name="vehicles"]:checked').forEach(
      (checkbox) => {
        selectedVehicles.push(checkbox.value);
      }
    );
    applicationData.selectedVehicles = selectedVehicles;

    // Validate form
    if (selectedVehicles.length === 0) {
      alert("Please select at least one vehicle to register.");
      return;
    }

    // Simulate application submission
    console.log("Submitting application:", applicationData);

    // Show loading state
    const submitButton = this.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.textContent = "Submitting...";
    submitButton.disabled = true;

    // Simulate API call
    setTimeout(() => {
      alert(
        "Application submitted successfully! You will receive a confirmation email shortly."
      );
      closeApplicationModal();

      // Reset button
      submitButton.textContent = originalText;
      submitButton.disabled = false;

      // Update UI to show application submitted
      updateCompanyCardStatus(
        document.getElementById("modalCompanyName").textContent
      );
    }, 2000);
  });

// Update company card status after application
function updateCompanyCardStatus(companyName) {
  const companyCards = document.querySelectorAll(".company-card");

  companyCards.forEach((card) => {
    if (card.querySelector(".company-name").textContent === companyName) {
      const applyButton = card.querySelector(".apply-btn");
      applyButton.textContent = "Application Sent";
      applyButton.disabled = true;
      applyButton.classList.remove("btn-primary");
      applyButton.classList.add("btn-secondary");

      // Add status indicator
      const statusBadge = document.createElement("div");
      statusBadge.className = "status-badge status-pending";
      statusBadge.textContent = "Application Pending";
      statusBadge.style.marginTop = "8px";

      const companyActions = card.querySelector(".company-actions");
      companyActions.appendChild(statusBadge);
    }
  });
}

// Load more companies
function loadMoreCompanies() {
  const button = event.target;
  button.textContent = "Loading...";
  button.disabled = true;

  // Simulate loading more companies
  setTimeout(() => {
    // In a real app, you would fetch more companies from the server
    // and append them to the container

    button.textContent = "Load More Companies";
    button.disabled = false;

    // For demo purposes, just show a message
    alert("No more companies available at the moment");
  }, 2000);
}

// Close modal when clicking outside
document.addEventListener("click", function (e) {
  const modal = document.getElementById("applicationModal");
  if (e.target === modal) {
    closeApplicationModal();
  }
});

// Close modal with escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeApplicationModal();
  }
});

// Vehicle selection enhancement
document.addEventListener("change", function (e) {
  if (e.target.name === "vehicles") {
    const vehicleOption = e.target.closest(".vehicle-option");
    if (e.target.checked) {
      vehicleOption.style.background = "rgba(26, 188, 156, 0.1)";
      vehicleOption.style.borderColor = "#1abc9c";
    } else {
      vehicleOption.style.background = "";
      vehicleOption.style.borderColor = "";
    }
  }
});

// Real-time company updates simulation
function simulateCompanyUpdates() {
  setInterval(() => {
    // Randomly update company ratings or review counts
    if (Math.random() > 0.95) {
      // 5% chance
      const companyCards = document.querySelectorAll(".company-card");
      const randomCard =
        companyCards[Math.floor(Math.random() * companyCards.length)];
      const ratingText = randomCard.querySelector(".rating-text");
      const currentReviews = parseInt(ratingText.textContent.match(/\d+/)[0]);
      const newReviews = currentReviews + Math.floor(Math.random() * 3) + 1;

      ratingText.textContent = `No of reviews: ${newReviews}`;

      // Flash animation
      randomCard.style.borderColor = "#1abc9c";
      setTimeout(() => {
        randomCard.style.borderColor = "#e8eaed";
      }, 1000);
    }
  }, 10000); // Check every 10 seconds
}

// Initialize real-time updates
setTimeout(simulateCompanyUpdates, 5000);

// Export functions for global access
window.openApplicationModal = openApplicationModal;
window.closeApplicationModal = closeApplicationModal;
window.searchCompanies = searchCompanies;
window.loadMoreCompanies = loadMoreCompanies;
