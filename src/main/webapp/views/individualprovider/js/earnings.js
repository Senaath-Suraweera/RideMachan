// Earnings JavaScript
document.addEventListener("DOMContentLoaded", function () {
  initializeEarningsChart();
  initializeVehicleSort();
  initializeChartControls();
  animateStats();
});

// Initialize Earnings Chart
function initializeEarningsChart() {
  const canvas = document.getElementById("earningsChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Sample data for the chart
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const earningsData = [
    15000, 18000, 16000, 19000, 17000, 21000, 20000, 18000, 22000, 19000, 24000,
    26000,
  ];

  drawEarningsChart(ctx, canvas, months, earningsData);
}

function drawEarningsChart(ctx, canvas, months, data) {
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  const padding = 80;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Find min and max values
  const maxValue = Math.max(...data);
  const minValue = Math.min(...data);
  const valueRange = maxValue - minValue;

  // Draw grid lines and labels
  ctx.strokeStyle = "#e8eaed";
  ctx.lineWidth = 1;
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
  ctx.fillStyle = "#5f6368";

  // Y-axis labels and grid
  for (let i = 0; i <= 6; i++) {
    const y = padding + (chartHeight / 6) * i;
    const value = maxValue - (valueRange / 6) * i;

    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();

    ctx.fillText(`Rs ${(value / 1000).toFixed(0)}k`, 10, y + 4);
  }

  // X-axis labels
  for (let i = 0; i < months.length; i++) {
    const x = padding + (chartWidth / (months.length - 1)) * i;
    ctx.fillText(months[i], x - 15, height - 30);
  }

  // Draw the area chart
  ctx.fillStyle = "rgba(26, 188, 156, 0.1)";
  ctx.strokeStyle = "#1abc9c";
  ctx.lineWidth = 3;

  // Create gradient
  const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
  gradient.addColorStop(0, "rgba(26, 188, 156, 0.3)");
  gradient.addColorStop(1, "rgba(26, 188, 156, 0.05)");
  ctx.fillStyle = gradient;

  ctx.beginPath();

  // Start from bottom left
  ctx.moveTo(padding, height - padding);

  // Draw the line and fill area
  for (let i = 0; i < data.length; i++) {
    const x = padding + (chartWidth / (data.length - 1)) * i;
    const y =
      padding + chartHeight - ((data[i] - minValue) / valueRange) * chartHeight;

    if (i === 0) {
      ctx.lineTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  // Close the area
  ctx.lineTo(width - padding, height - padding);
  ctx.closePath();
  ctx.fill();

  // Draw the line
  ctx.strokeStyle = "#1abc9c";
  ctx.lineWidth = 3;
  ctx.beginPath();

  for (let i = 0; i < data.length; i++) {
    const x = padding + (chartWidth / (data.length - 1)) * i;
    const y =
      padding + chartHeight - ((data[i] - minValue) / valueRange) * chartHeight;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    // Draw data points
    ctx.fillStyle = "#1abc9c";
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    ctx.fill();

    // Draw hover effect (simplified)
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.stroke();

  // Add chart title
  ctx.fillStyle = "#202124";
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
  ctx.textAlign = "center";
  ctx.fillText("Monthly Earnings Trend", width / 2, 30);
  ctx.textAlign = "left";
}

// Initialize Vehicle Sort
function initializeVehicleSort() {
  const sortSelect = document.getElementById("vehicleSortSelect");
  sortSelect.addEventListener("change", sortVehicleEarnings);
}

// Initialize Chart Controls
function initializeChartControls() {
  const chartPeriod = document.getElementById("chartPeriod");
  chartPeriod.addEventListener("change", updateChartPeriod);
}

// Sort Vehicle Earnings
function sortVehicleEarnings() {
  const sortValue = document.getElementById("vehicleSortSelect").value;
  const container = document.querySelector(".vehicle-earnings-list");
  const items = Array.from(container.querySelectorAll(".vehicle-earning-item"));

  items.sort((a, b) => {
    switch (sortValue) {
      case "Earnings (High to Low)":
        const earningsA = parseInt(
          a.querySelector(".earnings-amount").textContent.replace(/[^\d]/g, "")
        );
        const earningsB = parseInt(
          b.querySelector(".earnings-amount").textContent.replace(/[^\d]/g, "")
        );
        return earningsB - earningsA;
      case "Earnings (Low to High)":
        const earningsA2 = parseInt(
          a.querySelector(".earnings-amount").textContent.replace(/[^\d]/g, "")
        );
        const earningsB2 = parseInt(
          b.querySelector(".earnings-amount").textContent.replace(/[^\d]/g, "")
        );
        return earningsA2 - earningsB2;
      case "Name (A-Z)":
        return a
          .querySelector(".vehicle-name")
          .textContent.localeCompare(
            b.querySelector(".vehicle-name").textContent
          );
      case "Bookings (Most to Least)":
        // This would require booking count data in the elements
        return Math.random() - 0.5; // Random for demo
      default:
        return 0;
    }
  });

  // Update rankings and re-append sorted items
  items.forEach((item, index) => {
    item.querySelector(".ranking").textContent = `#${index + 1}`;
    container.appendChild(item);
  });
}

// Update Chart Period
function updateChartPeriod() {
  const period = document.getElementById("chartPeriod").value;

  // In a real app, you would fetch new data based on the period
  // For demo, we'll just update the chart with different data
  let newData, newLabels;

  switch (period) {
    case "Last 6 months":
      newLabels = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      newData = [18000, 22000, 19000, 24000, 26000, 28000];
      break;
    case "Last 3 months":
      newLabels = ["Oct", "Nov", "Dec"];
      newData = [24000, 26000, 28000];
      break;
    case "This year":
      newLabels = ["Q1", "Q2", "Q3", "Q4"];
      newData = [49000, 58000, 63000, 72000];
      break;
    default:
      newLabels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      newData = [
        15000, 18000, 16000, 19000, 17000, 21000, 20000, 18000, 22000, 19000,
        24000, 26000,
      ];
  }

  const canvas = document.getElementById("earningsChart");
  const ctx = canvas.getContext("2d");
  drawEarningsChart(ctx, canvas, newLabels, newData);
}

// Animate Stats on Load
function animateStats() {
  const statValues = document.querySelectorAll(".stat-value");

  statValues.forEach((stat, index) => {
    const finalValue = stat.textContent;
    const numericValue = parseFloat(finalValue.replace(/[^\d.]/g, ""));
    stat.textContent = "0";

    setTimeout(() => {
      animateValue(stat, 0, numericValue, 1500, finalValue);
    }, index * 300);
  });
}

function animateValue(element, start, end, duration, finalText) {
  const range = end - start;
  const startTime = Date.now();

  function updateValue() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const current = start + range * easeOutCubic(progress);

    if (finalText.includes("Rs")) {
      element.textContent = `Rs ${Math.floor(current).toLocaleString()}`;
    } else {
      element.textContent = Math.floor(current).toString();
    }

    if (progress < 1) {
      requestAnimationFrame(updateValue);
    } else {
      element.textContent = finalText;
    }
  }

  updateValue();
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

// Real-time earnings updates simulation
function simulateEarningsUpdates() {
  setInterval(() => {
    // Randomly update vehicle earnings (for demo)
    if (Math.random() > 0.9) {
      // 10% chance
      const earningItems = document.querySelectorAll(".vehicle-earning-item");
      const randomItem =
        earningItems[Math.floor(Math.random() * earningItems.length)];
      const earningsElement = randomItem.querySelector(".earnings-amount");
      const currentAmount = parseInt(
        earningsElement.textContent.replace(/[^\d]/g, "")
      );
      const change = Math.floor(Math.random() * 1000) + 100; // Random increase
      const newAmount = currentAmount + change;

      earningsElement.innerHTML = `Rs ${newAmount.toLocaleString()} <span class="trend up">↗</span>`;

      // Flash animation
      randomItem.style.background = "#e8f5e8";
      setTimeout(() => {
        randomItem.style.background = "#f8f9fa";
      }, 1000);
    }
  }, 10000); // Check every 10 seconds
}

// Initialize real-time updates
setTimeout(simulateEarningsUpdates, 5000);

// Export booking details view (could be used for navigation)
function viewBookingDetails(bookingId) {
  // In a real app, this would navigate to a detailed view
  console.log(`Viewing details for booking: ${bookingId}`);
  // window.location.href = `booking-details.html?id=${bookingId}`;
}

// Add click handlers for booking items
document.querySelectorAll(".booking-item").forEach((item) => {
  item.addEventListener("click", function () {
    const bookingId =
      this.querySelector(".booking-id").textContent.split(": ")[1];
    viewBookingDetails(bookingId);
  });

  // Add hover effect
  item.style.cursor = "pointer";
  item.addEventListener("mouseenter", function () {
    this.style.transform = "translateY(-2px)";
    this.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.1)";
    this.style.transition = "all 0.2s ease";
  });

  item.addEventListener("mouseleave", function () {
    this.style.transform = "translateY(0)";
    this.style.boxShadow = "none";
  });
});

// Responsive chart redraw
window.addEventListener("resize", function () {
  setTimeout(() => {
    initializeEarningsChart();
  }, 300);
});
