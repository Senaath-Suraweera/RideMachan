// My Vehicles JavaScript
document.addEventListener("DOMContentLoaded", function () {
  initializeFilters();
  initializeSearch();
  initializeSort();
  initializeVehicleCards();
});

// Initialize filter functionality
function initializeFilters() {
  const vehicleTypeFilter = document.getElementById("vehicleTypeFilter");
  const locationFilter = document.getElementById("locationFilter");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  const statusRadios = document.querySelectorAll('input[name="vehicleStatus"]');

  // Add event listeners for filters
  vehicleTypeFilter.addEventListener("change", applyFilters);
  locationFilter.addEventListener("change", applyFilters);
  fromDate.addEventListener("change", applyFilters);
  toDate.addEventListener("change", applyFilters);

  statusRadios.forEach((radio) => {
    radio.addEventListener("change", applyFilters);
  });
}

// Initialize search functionality
function initializeSearch() {
  const searchInput = document.getElementById("searchInput");
  let searchTimeout;

  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      applyFilters();
    }, 300);
  });
}

// Initialize sort functionality
function initializeSort() {
  const sortSelect = document.getElementById("sortSelect");
  sortSelect.addEventListener("change", applySorting);
}

// Initialize vehicle card interactions
function initializeVehicleCards() {
  const vehicleCards = document.querySelectorAll(".vehicle-card");

  vehicleCards.forEach((card) => {
    card.addEventListener("click", function () {
      // Navigate to vehicle details (could be implemented)
      console.log(
        "Navigate to vehicle details for:",
        card.querySelector(".vehicle-name").textContent
      );
    });
  });
}

// Apply all filters
function applyFilters() {
  const vehicleTypeFilter = document.getElementById("vehicleTypeFilter").value;
  const locationFilter = document.getElementById("locationFilter").value;
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  const selectedStatus = document.querySelector(
    'input[name="vehicleStatus"]:checked'
  ).value;

  const vehicleCards = document.querySelectorAll(".vehicle-card");

  vehicleCards.forEach((card) => {
    let shouldShow = true;

    // Vehicle type filter
    if (vehicleTypeFilter !== "All Types") {
      const cardType = card.dataset.type;
      const vehicleCategory = card
        .querySelector(".vehicle-category")
        .textContent.toLowerCase();

      if (
        vehicleTypeFilter === "Sedan" &&
        !vehicleCategory.includes("city car")
      )
        shouldShow = false;
      if (vehicleTypeFilter === "SUV" && !vehicleCategory.includes("suv"))
        shouldShow = false;
      if (
        vehicleTypeFilter === "Hatchback" &&
        !vehicleCategory.includes("hatchback")
      )
        shouldShow = false;
      if (vehicleTypeFilter === "Budget Cars" && cardType !== "budget")
        shouldShow = false;
      if (vehicleTypeFilter === "Luxury Rides" && cardType !== "luxury")
        shouldShow = false;
      if (vehicleTypeFilter === "Eco Rentals" && cardType !== "eco")
        shouldShow = false;
    }

    // Location filter
    if (locationFilter !== "All Locations") {
      const cardLocation = card.dataset.location;
      if (cardLocation !== locationFilter.toLowerCase()) shouldShow = false;
    }

    // Search filter
    if (searchTerm) {
      const vehicleName = card
        .querySelector(".vehicle-name")
        .textContent.toLowerCase();
      const vehicleCategory = card
        .querySelector(".vehicle-category")
        .textContent.toLowerCase();
      const vehicleLocation = card
        .querySelector(".vehicle-location")
        .textContent.toLowerCase();

      if (
        !vehicleName.includes(searchTerm) &&
        !vehicleCategory.includes(searchTerm) &&
        !vehicleLocation.includes(searchTerm)
      ) {
        shouldShow = false;
      }
    }

    // Status filter
    const vehicleStatus = card
      .querySelector(".vehicle-status")
      .textContent.toLowerCase();
    if (selectedStatus === "registered" && vehicleStatus === "booked")
      shouldShow = false;
    if (selectedStatus === "booked" && vehicleStatus === "available")
      shouldShow = false;

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
  const vehiclesGrid = document.getElementById("vehiclesGrid");
  const vehicleCards = Array.from(
    (vehicleCards = vehiclesGrid.querySelectorAll(".vehicle-card"))
  );

  vehicleCards.sort((a, b) => {
    switch (sortValue) {
      case "Name (A-Z)":
        return a
          .querySelector(".vehicle-name")
          .textContent.localeCompare(
            b.querySelector(".vehicle-name").textContent
          );
      case "Name (Z-A)":
        return b
          .querySelector(".vehicle-name")
          .textContent.localeCompare(
            a.querySelector(".vehicle-name").textContent
          );
      case "Price (Low to High)":
        const priceA = parseInt(
          a.querySelector(".vehicle-price").textContent.replace(/[^\d]/g, "")
        );
        const priceB = parseInt(
          b.querySelector(".vehicle-price").textContent.replace(/[^\d]/g, "")
        );
        return priceA - priceB;
      case "Price (High to Low)":
        const priceA2 = parseInt(
          a.querySelector(".vehicle-price").textContent.replace(/[^\d]/g, "")
        );
        const priceB2 = parseInt(
          b.querySelector(".vehicle-price").textContent.replace(/[^\d]/g, "")
        );
        return priceB2 - priceA2;
      case "Rating (High to Low)":
        const ratingA = a.querySelectorAll(".star:not(.empty)").length;
        const ratingB = b.querySelectorAll(".star:not(.empty)").length;
        return ratingB - ratingA;
      default:
        return 0;
    }
  });

  // Re-append sorted cards
  vehicleCards.forEach((card) => vehiclesGrid.appendChild(card));
}

// Update results count
function updateResultsCount() {
  const visibleCards = document.querySelectorAll(
    '.vehicle-card:not([style*="display: none"])'
  ).length;
  const totalCards = document.querySelectorAll(".vehicle-card").length;

  // You could add a results counter here if needed
  console.log(`Showing ${visibleCards} of ${totalCards} vehicles`);
}

// Modal functions
function openAddVehicleModal() {
  const modal = document.getElementById("addVehicleModal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeAddVehicleModal() {
  const modal = document.getElementById("addVehicleModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";

  // Reset form
  document.getElementById("addVehicleForm").reset();
}

// Handle form submission
document
  .getElementById("addVehicleForm")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    // Get form data
    const formData = new FormData(this);
    const vehicleData = Object.fromEntries(formData);

    // Get selected features
    const features = [];
    this.querySelectorAll('input[type="checkbox"]:checked').forEach(
      (checkbox) => {
        features.push(checkbox.parentElement.textContent.trim());
      }
    );
    vehicleData.features = features;

    // Simulate vehicle registration
    console.log("Registering vehicle:", vehicleData);

    // Show success message
    alert("Vehicle registered successfully!");

    // Close modal
    closeAddVehicleModal();

    // In a real app, you would refresh the vehicles list here
    // refreshVehiclesList();
  });

// Load more vehicles function
function loadMoreVehicles() {
  const button = event.target;
  button.textContent = "Loading...";
  button.disabled = true;

  // Simulate loading more vehicles
  setTimeout(() => {
    // In a real app, you would fetch more vehicles from the server
    // and append them to the grid

    button.textContent = "Load More Vehicles";
    button.disabled = false;

    // For demo purposes, just show a message
    alert("No more vehicles to load");
  }, 2000);
}

// Close modal when clicking outside
document.addEventListener("click", function (e) {
  const modal = document.getElementById("addVehicleModal");
  if (e.target === modal) {
    closeAddVehicleModal();
  }
});

// Close modal with escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeAddVehicleModal();
  }
});

// Initialize date inputs with current date
document.addEventListener("DOMContentLoaded", function () {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("fromDate").value = today;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  document.getElementById("toDate").value = tomorrow
    .toISOString()
    .split("T")[0];
});
