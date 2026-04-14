package rentalcompany.drivers.model;

import java.sql.Date;
import java.sql.Time;

public class Booking {
    private int bookingId;
    private String rideId;
    private int driverId;
    private String customerName;
    private String customerPhone;
    private String customerEmail;
    private String pickupLocation;
    private String dropoffLocation;
    private Date bookingDate;
    private Time bookingTime;
    private int estimatedDuration; // in minutes
    private double distance; // in km
    private double totalAmount;
    private String status; // upcoming, in-progress, completed, cancelled
    private String vehicleModel;
    private String vehiclePlate;
    private String specialInstructions;
    private java.sql.Timestamp createdAt;

    // Default constructor
    public Booking() {
    }

    // Full constructor
    public Booking(int bookingId, String rideId, int driverId, String customerName,
                   String customerPhone, String customerEmail, String pickupLocation,
                   String dropoffLocation, Date bookingDate, Time bookingTime,
                   int estimatedDuration, double distance, double totalAmount,
                   String status, String vehicleModel, String vehiclePlate,
                   String specialInstructions) {
        this.bookingId = bookingId;
        this.rideId = rideId;
        this.driverId = driverId;
        this.customerName = customerName;
        this.customerPhone = customerPhone;
        this.customerEmail = customerEmail;
        this.pickupLocation = pickupLocation;
        this.dropoffLocation = dropoffLocation;
        this.bookingDate = bookingDate;
        this.bookingTime = bookingTime;
        this.estimatedDuration = estimatedDuration;
        this.distance = distance;
        this.totalAmount = totalAmount;
        this.status = status;
        this.vehicleModel = vehicleModel;
        this.vehiclePlate = vehiclePlate;
        this.specialInstructions = specialInstructions;
    }

    // Getters and Setters
    public int getBookingId() {
        return bookingId;
    }

    public void setBookingId(int bookingId) {
        this.bookingId = bookingId;
    }

    public String getRideId() {
        return rideId;
    }

    public void setRideId(String rideId) {
        this.rideId = rideId;
    }

    public int getDriverId() {
        return driverId;
    }

    public void setDriverId(int driverId) {
        this.driverId = driverId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getCustomerEmail() {
        return customerEmail;
    }

    public void setCustomerEmail(String customerEmail) {
        this.customerEmail = customerEmail;
    }

    public String getPickupLocation() {
        return pickupLocation;
    }

    public void setPickupLocation(String pickupLocation) {
        this.pickupLocation = pickupLocation;
    }

    public String getDropoffLocation() {
        return dropoffLocation;
    }

    public void setDropoffLocation(String dropoffLocation) {
        this.dropoffLocation = dropoffLocation;
    }

    public Date getBookingDate() {
        return bookingDate;
    }

    public void setBookingDate(Date bookingDate) {
        this.bookingDate = bookingDate;
    }

    public Time getBookingTime() {
        return bookingTime;
    }

    public void setBookingTime(Time bookingTime) {
        this.bookingTime = bookingTime;
    }

    public int getEstimatedDuration() {
        return estimatedDuration;
    }

    public void setEstimatedDuration(int estimatedDuration) {
        this.estimatedDuration = estimatedDuration;
    }

    public double getDistance() {
        return distance;
    }

    public void setDistance(double distance) {
        this.distance = distance;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getVehicleModel() {
        return vehicleModel;
    }

    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }

    public String getVehiclePlate() {
        return vehiclePlate;
    }

    public void setVehiclePlate(String vehiclePlate) {
        this.vehiclePlate = vehiclePlate;
    }

    public String getSpecialInstructions() {
        return specialInstructions;
    }

    public void setSpecialInstructions(String specialInstructions) {
        this.specialInstructions = specialInstructions;
    }

    public java.sql.Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.sql.Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    // Utility method to format date and time
    public String getFormattedDateTime() {
        if (bookingDate != null && bookingTime != null) {
            return bookingDate.toString() + " - " + bookingTime.toString();
        }
        return "N/A";
    }

    // Utility method to format time string
    public String getFormattedTime() {
        if (bookingTime != null) {
            return bookingTime.toString().substring(0, 5); // HH:MM format
        }
        return "N/A";
    }
}