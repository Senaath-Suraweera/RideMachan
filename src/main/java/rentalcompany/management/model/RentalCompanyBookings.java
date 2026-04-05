package rentalcompany.management.model;

import java.sql.Time;
import java.time.LocalTime;
import java.util.Date;
import java.sql.Timestamp;

public class RentalCompanyBookings {
    private int bookingId;
    private int companyId;
    private String rideId;
    private String status;
    private double totalAmount;
    private String paymentStatus;

    private int customerId;
    private String customerName;
    private String customerPhoneNumber;
    private String customerEmail;

    private int vehicleId;
    private String vehicleBrand;
    private String vehicleModel;
    private String numberPlate;

    private int driverId;
    private String driverName;

    private Date bookedDate;
    private Time bookingTime;
    private int estimatedDuration;
    private double distance;
    private Date tripStartDate;
    private Date tripEndDate;
    private String startTimeStr;
    private String endTimeStr;
    private String pickupLocation;
    private String dropLocation;

    private String specialInstructions;
    private Timestamp createdAt;


    public RentalCompanyBookings() {

    }

    public RentalCompanyBookings(int bookingId, String rideId, int driverId, String customerName,
                   String customerPhoneNumber, String customerEmail, String pickupLocation,
                   String dropLocation, Date bookedDate, Time bookingTime,
                   int estimatedDuration, double distance, double totalAmount,
                   String status, String vehicleModel, String numberPlate,
                   String specialInstructions) {

        this.bookingId = bookingId;
        this.rideId = rideId;
        this.driverId = driverId;
        this.customerName = customerName;
        this.customerPhoneNumber = customerPhoneNumber;
        this.customerEmail = customerEmail;
        this.pickupLocation = pickupLocation;
        this.dropLocation = dropLocation;
        this.bookedDate = bookedDate;
        this.bookingTime = bookingTime;
        this.estimatedDuration = estimatedDuration;
        this.distance = distance;
        this.totalAmount = totalAmount;
        this.status = status;
        this.vehicleModel = vehicleModel;
        this.numberPlate = numberPlate;
        this.specialInstructions = specialInstructions;

    }

    public int getBookingId() { return bookingId; }
    public void setBookingId(int bookingId) { this.bookingId = bookingId; }

    public int getCompanyId() { return companyId; }
    public void setCompanyId(int companyId) { this.companyId = companyId; }

    public String getRideId() { return rideId; }
    public void setRideId(String rideId) { this.rideId = rideId; }

    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public int getCustomerId() { return customerId; }
    public void setCustomerId(int customerId) { this.customerId = customerId; }

    public int getVehicleId() { return vehicleId; }
    public void setVehicleId(int vehicleId) { this.vehicleId = vehicleId; }

    public int getDriverId() { return driverId; }
    public void setDriverId(int driverId) { this.driverId = driverId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(double totalAmount) { this.totalAmount = totalAmount; }

    public Date getBookedDate() { return bookedDate; }
    public void setBookedDate(Date bookedDate) {  this.bookedDate = bookedDate; }

    public Time getBookingTime() { return bookingTime ;}
    public void setBookingTime(Time bookingTime) { this.bookingTime = bookingTime; }

    public int getEstimatedDuration() { return estimatedDuration; }
    public void setEstimatedDuration(int estimatedDuration) { this.estimatedDuration = estimatedDuration; }

    public double getDistance() { return distance; }
    public void setDistance(double distance) { this.distance = distance; }

    public Date getTripStartDate() { return tripStartDate;}
    public void setTripStartDate(Date tripStartDate) {  this.tripStartDate = tripStartDate; }

    public Date getTripEndDate() { return tripEndDate; }
    public void setTripEndDate(Date tripEndDate) {  this.tripEndDate = tripEndDate; }

    public String getStartTimeStr() { return startTimeStr; }
    public void setStartTimeStr(String startTimeStr) { this.startTimeStr = startTimeStr; }

    public String getEndTimeStr() { return endTimeStr; }
    public void setEndTimeStr(String endTimeStr) { this.endTimeStr = endTimeStr; }

    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }

    public String getCustomerPhoneNumber() { return customerPhoneNumber; }
    public void setCustomerPhoneNumber(String customerPhoneNumber) { this.customerPhoneNumber = customerPhoneNumber; }

    public String getCustomerEmail() { return customerEmail; }
    public void setCustomerEmail(String customerEmail) { this.customerEmail = customerEmail; }

    public String getVehicleBrand() { return vehicleBrand; }
    public void setVehicleBrand(String vehicleBrand) { this.vehicleBrand = vehicleBrand; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public String getNumberPlate() { return numberPlate; }
    public void setNumberPlate(String numberPlate) { this.numberPlate = numberPlate; }

    public String getDriverName() { return driverName; }
    public void setDriverName(String driverName) { this.driverName = driverName; }

    public String getPickupLocation() { return pickupLocation; }
    public void setPickupLocation(String pickupLocation) { this.pickupLocation = pickupLocation; }

    public String getDropLocation() { return dropLocation; }
    public void setDropLocation(String dropLocation) { this.dropLocation = dropLocation; }

    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public String getFormattedDateTime() {

        if (bookedDate != null && bookingTime != null) {
            return bookedDate.toString() + " - " + bookingTime.toString();
        }

        return "N/A";

    }

    public String getFormattedTime() {

        if (bookingTime != null) {
            return bookingTime.toString().substring(0, 5); // HH:MM format
        }

        return "N/A";

    }

}
