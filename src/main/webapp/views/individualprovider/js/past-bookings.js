// Complete Ongoing Bookings JavaScript with Order Details Navigation
document.addEventListener("DOMContentLoaded", function () {
  initializeFilters();
  initializeBookingCards();
  initializeDateInputs();
  initializeSort();
  addViewDetailsButtons();
  enhanceBookingCardInteractions();
  restoreNavigationState();
});

// Initialize filter functionality
function initializeFilters() {
  const vehicleTypeFilter = document.getElementById("vehicleTypeFilter");
  const locationFilter = document.getElementById("locationFilter");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  const checkboxes = document.querySelectorAll(
    '.filter-options input[type="checkbox"]'
  );

  // Add event listeners for real-time filtering
  vehicleTypeFilter.addEventListener("change", applyFilters);
  locationFilter.addEventListener("input", applyFilters);
  fromDate.addEventListener("change", applyFilters);
  toDate.addEventListener("change", applyFilters);

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", applyFilters);
  });
}

// Initialize booking card interactions with navigation
function initializeBookingCards() {
  const bookingCards = document.querySelectorAll(".booking-card");

  bookingCards.forEach((card) => {
    // Add click handler for card - navigate to order details
    card.addEventListener("click", function (e) {
      // Don't navigate if clicking on buttons or action areas
      if (
        e.target.closest("button") ||
        e.target.closest(".booking-actions") ||
        e.target.closest(".view-details-btn")
      ) {
        return;
      }

      const bookingId = extractBookingId(card);
      navigateToOrderDetails(bookingId);
    });

    // Add hover effect
    card.addEventListener("mouseenter", function () {
      this.style.cursor = "pointer";
      this.style.transform = "translateY(-2px)";
      this.style.boxShadow = "0 4px 16px rgba(0, 0, 0, 0.15)";
      this.style.transition = "all 0.2s ease";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0)";
      this.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.1)";
    });
  });
}

// Initialize date inputs
function initializeDateInputs() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("fromDate").value = today;

  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  document.getElementById("toDate").value = nextWeek
    .toISOString()
    .split("T")[0];
}

// Initialize sort functionality
function initializeSort() {
  const sortSelect = document.getElementById("sortSelect");
  sortSelect.addEventListener("change", applySorting);
}

// Apply filters function
function applyFilters() {
  const vehicleType = document.getElementById("vehicleTypeFilter").value;
  const location = document
    .getElementById("locationFilter")
    .value.toLowerCase();
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;

  const withDriver = document.getElementById("withDriver").checked;
  const accepted = document.getElementById("accepted").checked;
  const pickedUp = document.getElementById("pickedUp").checked;
  const paid = document.getElementById("paid").checked;

  const bookingCards = document.querySelectorAll(".booking-card");

  bookingCards.forEach((card) => {
    let shouldShow = true;

    // Vehicle type filter
    if (vehicleType !== "Select type") {
      const vehicleText = card
        .querySelector(".vehicle-details span")
        .textContent.toLowerCase();
      if (!vehicleText.includes(vehicleType.toLowerCase())) {
        shouldShow = false;
      }
    }

    // Location filter
    if (location) {
      const cardLocation = card
        .querySelector(".location-info span")
        .textContent.toLowerCase();
      if (!cardLocation.includes(location)) {
        shouldShow = false;
      }
    }

    // Status filters
    const cardStatus = card.dataset.status;
    const statusIndicators = card.querySelectorAll(".status-dot");

    if (
      accepted &&
      !Array.from(statusIndicators).some((dot) =>
        dot.textContent.includes("Accepted")
      )
    ) {
      shouldShow = false;
    }

    if (
      paid &&
      cardStatus !== "paid" &&
      !Array.from(statusIndicators).some((dot) =>
        dot.textContent.includes("Paid")
      )
    ) {
      shouldShow = false;
    }

    if (
      pickedUp &&
      !Array.from(statusIndicators).some((dot) =>
        dot.textContent.includes("Pick-up")
      )
    ) {
      shouldShow = false;
    }

    if (withDriver) {
      const driverInfo = card.querySelector(".driver-info");
      if (!driverInfo) {
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
  const bookingsContainer = document.querySelector(".bookings-container");
  const bookingCards = Array.from(
    bookingsContainer.querySelectorAll(".booking-card")
  );

  bookingCards.sort((a, b) => {
    switch (sortValue) {
      case "📈 Ascending":
        return a
          .querySelector(".booking-id h3")
          .textContent.localeCompare(
            b.querySelector(".booking-id h3").textContent
          );
      case "📊 Descending":
        return b
          .querySelector(".booking-id h3")
          .textContent.localeCompare(
            a.querySelector(".booking-id h3").textContent
          );
      case "📅 Date (Newest)":
        // In a real app, you'd sort by actual booking dates
        return b
          .querySelector(".booking-id h3")
          .textContent.localeCompare(
            a.querySelector(".booking-id h3").textContent
          );
      case "📅 Date (Oldest)":
        return a
          .querySelector(".booking-id h3")
          .textContent.localeCompare(
            b.querySelector(".booking-id h3").textContent
          );
      case "💰 Price (High to Low)":
        // Would need price data in the cards for real sorting
        return Math.random() - 0.5; // Random for demo
      case "💰 Price (Low to High)":
        return Math.random() - 0.5; // Random for demo
      default:
        return 0;
    }
  });

  // Re-append sorted cards
  bookingCards.forEach((card) => bookingsContainer.appendChild(card));
}

// Extract booking ID from card
function extractBookingId(card) {
  const bookingIdElement = card.querySelector(".booking-id h3");
  if (bookingIdElement) {
    // Extract ID from "Booking ID: BK001" format
    const fullText = bookingIdElement.textContent;
    const match = fullText.match(/Booking ID:\s*(.+)/);
    return match ? match[1].trim() : "BK001";
  }
  return "BK001"; // Default fallback
}

// Navigate to order details page
function navigateToOrderDetails(bookingId) {
  // Add loading state
  showLoadingState();

  // Store current page state
  sessionStorage.setItem("previousPage", "ongoing-bookings");
  sessionStorage.setItem("scrollPosition", window.scrollY);

  // Navigate to order details with booking ID
  setTimeout(() => {
    window.location.href = `../html/order-details.html?id=${bookingId}`;
  }, 300);
}

// Show loading state when navigating
function showLoadingState() {
  const loadingOverlay = document.createElement("div");
  loadingOverlay.id = "navigationLoading";
  loadingOverlay.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(255, 255, 255, 0.9);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
        ">
            <div style="
                width: 40px;
                height: 40px;
                border: 3px solid #e8eaed;
                border-top: 3px solid #1abc9c;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            "></div>
            <div style="
                font-size: 14px;
                color: #5f6368;
                font-weight: 500;
            ">Loading order details...</div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;

  document.body.appendChild(loadingOverlay);
}

// Add "View Details" buttons to existing booking cards
function addViewDetailsButtons() {
  const bookingCards = document.querySelectorAll(".booking-card");

  bookingCards.forEach((card) => {
    const actionsArea = card.querySelector(".booking-actions");
    if (actionsArea && !actionsArea.querySelector(".view-details-btn")) {
      const viewDetailsBtn = document.createElement("button");
      viewDetailsBtn.className = "btn btn-sm btn-primary view-details-btn";
      viewDetailsBtn.innerHTML = "View Details";
      viewDetailsBtn.style.marginLeft = "8px";
      viewDetailsBtn.onclick = function (e) {
        e.stopPropagation();
        const bookingId = extractBookingId(card);
        navigateToOrderDetails(bookingId);
      };

      actionsArea.appendChild(viewDetailsBtn);
    }
  });
}

// Enhanced booking card interactions with better visual feedback
function enhanceBookingCardInteractions() {
  const style = document.createElement("style");
  style.textContent = `
        .booking-card {
            position: relative;
            overflow: hidden;
        }
        
        .booking-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                90deg,
                transparent,
                rgba(26, 188, 156, 0.1),
                transparent
            );
            transition: left 0.6s;
        }
        
        .booking-card:hover::before {
            left: 100%;
        }
        
        .booking-card:active {
            transform: translateY(1px);
        }
        
        .view-details-btn {
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease;
        }
        
        .booking-card:hover .view-details-btn {
            opacity: 1;
            transform: translateY(0);
        }
    `;

  document.head.appendChild(style);
}

// Restore navigation state when returning from order details
function restoreNavigationState() {
  const previousPage = sessionStorage.getItem("previousPage");
  const scrollPosition = sessionStorage.getItem("scrollPosition");

  if (previousPage === "ongoing-bookings" && scrollPosition) {
    setTimeout(() => {
      window.scrollTo(0, parseInt(scrollPosition));
    }, 100);
    sessionStorage.removeItem("previousPage");
    sessionStorage.removeItem("scrollPosition");
  }
}

// Toggle filters visibility
function toggleFilters() {
  const filterOptions = document.querySelector(".filter-options");
  const button = event.target;

  if (filterOptions.style.display === "none") {
    filterOptions.style.display = "flex";
    button.textContent = "⚙️ Hide filters";
  } else {
    filterOptions.style.display = "none";
    button.textContent = "⚙️ Show filters";
  }
}

// Update results count
function updateResultsCount() {
  const visibleCards = document.querySelectorAll(
    '.booking-card:not([style*="display: none"])'
  ).length;
  const totalCards = document.querySelectorAll(".booking-card").length;

  console.log(`Showing ${visibleCards} of ${totalCards} bookings`);
}

// Open booking details modal (enhanced with navigation option)
function openBookingDetails(bookingId, cardElement) {
  const modal = document.getElementById("bookingDetailsModal");
  const modalContent = document.getElementById("bookingModalContent");

  // Extract data from the card
  const customerName = cardElement.querySelector(".customer-name").textContent;
  const vehicleDetails = cardElement.querySelector(
    ".vehicle-details span"
  ).textContent;
  const rentalCompany = cardElement.querySelector(
    ".rental-company span"
  ).textContent;
  const location = cardElement.querySelector(".location-info span").textContent;
  const duration =
    cardElement.querySelector(".duration-info span")?.textContent || "N/A";
  const status = cardElement.querySelector(".booking-status").textContent;
  const statusIndicators = Array.from(
    cardElement.querySelectorAll(".status-dot")
  ).map((dot) => dot.textContent);

  // Create modal content with enhanced details and navigation option
  modalContent.innerHTML = `
        <div class="booking-details">
            <div class="detail-section">
                <h3>${bookingId}</h3>
                <p><strong>Customer:</strong> ${customerName}</p>
                <p><strong>Status:</strong> <span class="status-badge status-${status
                  .toLowerCase()
                  .replace(" ", "-")}">${status}</span></p>
                <div style="margin-top: 16px;">
                    <button class="btn btn-primary" onclick="navigateToOrderDetails('${bookingId.replace(
                      "Booking ID: ",
                      ""
                    )}')">
                        📋 View Full Order Details
                    </button>
                </div>
            </div>
            
            <div class="detail-grid">
                <div class="detail-item">
                    <strong>Vehicle:</strong>
                    <span>${vehicleDetails}</span>
                </div>
                <div class="detail-item">
                    <strong>Rental Company:</strong>
                    <span>${rentalCompany}</span>
                </div>
                <div class="detail-item">
                    <strong>Location:</strong>
                    <span>${location}</span>
                </div>
                <div class="detail-item">
                    <strong>Duration:</strong>
                    <span>${duration}</span>
                </div>
            </div>
            
            <div class="status-timeline">
                <h4>Booking Progress</h4>
                <div class="timeline">
                    ${statusIndicators
                      .map(
                        (indicator) => `
                        <div class="timeline-item ${
                          indicator.includes("●") ? "completed" : ""
                        }">
                            ${indicator}
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
            
            <div class="quick-actions" style="margin-top: 20px; display: flex; gap: 12px; flex-wrap: wrap;">
                <button class="btn btn-secondary btn-sm" onclick="contactCustomer()">
                    📞 Contact Customer
                </button>
                <button class="btn btn-secondary btn-sm" onclick="updateBookingStatus()">
                    📝 Update Status
                </button>
            </div>
        </div>
        
        <style>
            .booking-details {
                font-family: inherit;
            }
            
            .detail-section {
                margin-bottom: 24px;
                padding-bottom: 16px;
                border-bottom: 1px solid #e8eaed;
            }
            
            .detail-section h3 {
                color: #202124;
                margin-bottom: 12px;
            }
            
            .detail-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
                margin-bottom: 24px;
            }
            
            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            
            .detail-item strong {
                color: #5f6368;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .detail-item span {
                color: #202124;
                font-weight: 500;
            }
            
            .status-timeline {
                margin-bottom: 24px;
            }
            
            .status-timeline h4 {
                color: #202124;
                margin-bottom: 12px;
            }
            
            .timeline {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            
            .timeline-item {
                padding: 8px 12px;
                border-radius: 6px;
                background: #f8f9fa;
                font-size: 14px;
            }
            
            .timeline-item.completed {
                background: #e8f5e8;
                color: #2e7d32;
            }
            
            @media (max-width: 768px) {
                .detail-grid {
                    grid-template-columns: 1fr;
                }
                
                .quick-actions {
                    flex-direction: column;
                }
            }
        </style>
    `;

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

// Close booking details modal
function closeBookingModal() {
  const modal = document.getElementById("bookingDetailsModal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

// Update booking status
function updateBookingStatus() {
  // In a real app, this would update the booking status on the server
  alert("Booking status updated successfully!");
  closeBookingModal();
}

// Contact customer
function contactCustomer() {
  alert("Calling customer...");
}

// Load more bookings
function loadMoreBookings() {
  const button = event.target;
  button.textContent = "Loading...";
  button.disabled = true;

  // Simulate loading more bookings
  setTimeout(() => {
    button.textContent = "Load More Bookings";
    button.disabled = false;
    alert("No more bookings to load");
  }, 2000);
}

// Search functionality (triggered by search button)
function performSearch() {
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

// Close modal when clicking outside
document.addEventListener("click", function (e) {
  const modal = document.getElementById("bookingDetailsModal");
  if (e.target === modal) {
    closeBookingModal();
  }
});

// Close modal with escape key
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape") {
    closeBookingModal();
  }
});

// Real-time status updates simulation
function simulateRealTimeUpdates() {
  setInterval(() => {
    const bookingCards = document.querySelectorAll(".booking-card");

    // Randomly update a booking status (for demo purposes)
    if (Math.random() > 0.95) {
      // 5% chance every interval
      const randomCard =
        bookingCards[Math.floor(Math.random() * bookingCards.length)];
      const statusElement = randomCard.querySelector(".booking-status");

      // Example status progression
      if (statusElement.textContent === "Accepted") {
        statusElement.textContent = "In Progress";
        statusElement.className = "booking-status in-progress";
        randomCard.dataset.status = "in-progress";

        // Add pickup status indicator
        const statusIndicators = randomCard.querySelector(".status-indicators");
        const pickupStatus = document.createElement("span");
        pickupStatus.className = "status-dot pickup";
        pickupStatus.textContent = "● Pick-up";
        statusIndicators.appendChild(pickupStatus);

        // Flash animation
        randomCard.style.borderLeft = "4px solid #1abc9c";
        setTimeout(() => {
          randomCard.style.borderLeft = "";
        }, 2000);
      }
    }
  }, 5000); // Check every 5 seconds
}

// Initialize real-time updates
setTimeout(simulateRealTimeUpdates, 10000); // Start after 10 seconds

// Export functions for global access
window.applyFilters = applyFilters;
window.toggleFilters = toggleFilters;
window.loadMoreBookings = loadMoreBookings;
window.closeBookingModal = closeBookingModal;
window.updateBookingStatus = updateBookingStatus;
window.contactCustomer = contactCustomer;
window.navigateToOrderDetails = navigateToOrderDetails;
window.extractBookingId = extractBookingId;
