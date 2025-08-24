// Dashboard JavaScript
document.addEventListener("DOMContentLoaded", function () {
  initializeIncomeChart();
  updateLastModified();
  initializeVehicleStatusUpdates();
});

// Initialize Income Chart
function initializeIncomeChart() {
  const canvas = document.getElementById("incomeChart");
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
  const incomeData = [
    15000, 18000, 16000, 19000, 17000, 21000, 20000, 18000, 22000, 19000, 24000,
    26000,
  ];

  // Simple chart implementation
  drawIncomeChart(ctx, canvas, months, incomeData);
}

function drawIncomeChart(ctx, canvas, months, data) {
  const width = (canvas.width = canvas.offsetWidth);
  const height = (canvas.height = canvas.offsetHeight);

  const padding = 60;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Set styles
  ctx.strokeStyle = "#1abc9c";
  ctx.lineWidth = 3;
  ctx.fillStyle = "#1abc9c";

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
  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight / 5) * i;
    const value = maxValue - (valueRange / 5) * i;

    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();

    ctx.fillText(`Rs ${(value / 1000).toFixed(0)}k`, 10, y + 4);
  }

  // X-axis labels
  for (let i = 0; i < months.length; i++) {
    const x = padding + (chartWidth / (months.length - 1)) * i;
    ctx.fillText(months[i], x - 15, height - 20);
  }

  // Draw the line chart
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
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.stroke();
}

// Update last modified timestamp
function updateLastModified() {
  const timestamp = document.querySelector(".last-updated");
  if (timestamp) {
    const now = new Date();
    const formatted = now.toLocaleDateString("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
    });
    timestamp.textContent = `Last updated: ${formatted}`;
  }
}

// Initialize vehicle status updates
function initializeVehicleStatusUpdates() {
  // Simulate real-time updates for maintenance ETAs
  setInterval(updateMaintenanceETAs, 60000); // Update every minute
}

function updateMaintenanceETAs() {
  const etaElements = document.querySelectorAll(".eta");
  etaElements.forEach((eta) => {
    const currentText = eta.textContent;
    const hours = parseInt(currentText.match(/\d+/));
    if (hours > 0) {
      // Randomly decrease time (simulate progress)
      if (Math.random() > 0.7) {
        const newHours = Math.max(0, hours - 1);
        eta.textContent = `ETA: ${newHours} hour${newHours !== 1 ? "s" : ""}`;

        // If completed, update status
        if (newHours === 0) {
          const statusBadge = eta.parentElement.querySelector(".status-badge");
          statusBadge.textContent = "Completed";
          statusBadge.className = "status-badge status-active";
          eta.textContent = "Ready";
        }
      }
    }
  });
}

// Map view functionality
document.addEventListener("click", function (e) {
  if (e.target.textContent === "Load Map View") {
    e.target.textContent = "Loading...";
    e.target.disabled = true;

    // Simulate loading
    setTimeout(() => {
      e.target.textContent = "Map Loaded";
      e.target.style.backgroundColor = "#2e7d32";
    }, 2000);
  }
});

// Stats animation on page load
function animateStats() {
  const statValues = document.querySelectorAll(".stat-value");

  statValues.forEach((stat, index) => {
    const finalValue = stat.textContent;
    stat.textContent = "0";

    setTimeout(() => {
      animateValue(
        stat,
        0,
        parseFloat(finalValue.replace(/[^\d.]/g, "")),
        1000,
        finalValue
      );
    }, index * 200);
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
    } else if (finalText.includes("%")) {
      element.textContent = `${current.toFixed(1)}%`;
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

// Initialize animations when page loads
setTimeout(animateStats, 500);
