package rentalcompany.management.model;

import java.time.LocalTime;
import java.util.Date;

public class RentalCompanyBookings {
    private int bookingId;
    private int companyId;
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
    private Date tripStartDate;
    private Date tripEndDate;
    private String startTimeStr;
    private String endTimeStr;
    private String pickupLocation;
    private String dropLocation;


    public int getBookingId() { return bookingId; }
    public void setBookingId(int bookingId) { this.bookingId = bookingId; }

    public int getCompanyId() { return companyId; }
    public void setCompanyId(int companyId) { this.companyId = companyId; }

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



}
