
let AllDrivers;

function OpenAddDrivermodel() {
  const AddDriverButton = document.getElementById("Add-Driver-Button");
  const AddDriverModel = document.getElementById("Add-Driver-Modal");

  AddDriverButton.addEventListener("click",function() {
    AddDriverModel.classList.add("active");
  })
}

function CLoseAddDrivermodel() {
  const AddDriverModel = document.getElementById("Add-Driver-Modal");
  const CloseButoon = document.querySelector(".modal-close");
  const SubmitButton = document.getElementById("add-driver-submit-button");

  CloseButoon.addEventListener("click", function() {
    AddDriverModel.classList.remove("active");
  });

  SubmitButton.addEventListener("click", function() {
    AddDriverModel.classList.remove("active");
  });
}

function DisplayWithAddedDriver() {

  const addDriverForm = document.getElementById("addDriverform");

  addDriverForm.addEventListener("submit", async function(e) {
    e.preventDefault();

    const formData = new FormData(addDriverForm);

    const response = await fetch("/driver/add", {
      method:"POST",
      body:formData
    });

    if(response.ok) {
      AllDrivers = await LoadAllDrivers();
      renderAlldrivers(AllDrivers);
    }

  });

}

async function LoadAllDrivers() {

  try {

    let response = await fetch(`/displaydrivers`);

    if(!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }


    let data = await response.json();

    console.log(data);

    return data;

  }catch (err) {

    console.log(err);

  }

}


function renderAlldrivers(drivers) {

  let driversGrid = document.getElementById("driversGrid");
  driversGrid.innerHTML = "";

  if (!Array.isArray(drivers)) {
    console.error("Expected an array from the server", drivers);
  }

  drivers.forEach(driver => {

    const driverCard = document.createElement("div");
    driverCard.className = "driver-card";

    driverCard.innerHTML = `<div class="driver-card">
                                              <div class="driver-status status-${driver.status}">
                                                  ${driver.status}
                                              </div>

                                              <div class="driver-header">
                                                  <div class="driver-avatar">${driver.initials}</div>
                                                  <div class="driver-info">
                                                      <h3>${driver.firstName}</h3>
                                                      <p class="driver-id">Driver ID: ${driver.driverId}</p>
                                                  </div>
                                              </div>

                                              <div class="driver-rating">
                                                  <i class="fas fa-star rating-star"></i>
                                                  <span><strong>${driver.rating}</strong></span>
                                                  <span class="rating-text">(${driver.trips} trips)</span>
                                              </div>

                                              <div class="driver-details">
                                                  <div class="detail-item">
                                                      <i class="fas fa-map-marker-alt detail-icon"></i>
                                                      <span>Area: ${driver.area}</span>
                                                  </div>
                                                  <div class="detail-item">
                                                      <i class="fas fa-phone detail-icon"></i>
                                                      <span>${driver.mobileNumber}</span>
                                                  </div>
                                                  <div class="detail-item">
                                                      <i class="fas fa-id-card detail-icon"></i>
                                                      <span>License: ${driver.license}</span>
                                                  </div>
                                                  <div class="detail-item">
                                                      <i class="fas fa-calendar detail-icon"></i>
                                                      <span>Expires: ${driver.expiry}</span>
                                                  </div>
                                              </div>

                                              ${
        driver.currentBooking
            ? `
                                                  <div class="current-booking">
                                                      <div class="booking-header">
                                                          <span class="booking-title">Current Booking</span>
                                                          <span class="booking-id">${driver.currentBooking.id}</span>
                                                      </div>
                                                      <div class="booking-details">
                                                          <span><i class="fas fa-clock"></i> ${driver.currentBooking.time}</span>
                                                          <span><i class="fas fa-car"></i> ${driver.currentBooking.vehicle}</span>
                                                      </div>
                                                      <div class="booking-details">
                                                          <span><i class="fas fa-user"></i> Customer: ${driver.currentBooking.customer}</span>
                                                      </div>
                                                  </div>
                                              `
            : ""
    }

                                              <div class="driver-actions">
                                                  <button class="action-btn" onclick="window.driverManager.messageDriver('${
        driver.driverId
    }')">
                                                      <i class="fas fa-comment"></i>
                                                      Message
                                                  </button>

                                                  <button class="action-btn primary" data-driver-id="${
        driver.id
    }">
                                                      Assign Booking
                                                  </button>
                                              </div>
                                          </div>`;

    driversGrid.appendChild(driverCard);


  })

}


document.addEventListener("DOMContentLoaded", async function() {
  AllDrivers = await LoadAllDrivers();
  renderAlldrivers(AllDrivers);
});

OpenAddDrivermodel();

CLoseAddDrivermodel();

DisplayWithAddedDriver();
