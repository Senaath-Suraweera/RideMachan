package rentalcompany.maintenance.model;

/**
 * CalendarEvent Model
 * Updated to match the new database schema with additional fields
 */
public class CalendarEvent {
    private int eventId;
    private int vehicleId;
    private String vehicleNumberPlate;  // From Vehicle table
    private String vehicleModel;        // From Vehicle table (brand + model)
    private String serviceType;
    private String status;
    private String description;
    private int maintenanceId;
    private String scheduledDate;
    private String scheduledTime;
    private String serviceBay;
    private String estimatedDuration;
    private String assignedTechnician;
    private String createdAt;
    private String updatedAt;

    // Default constructor
    public CalendarEvent() {}

    // Constructor for database retrieval (with vehicle details)
    public CalendarEvent(int eventId, int vehicleId, String vehicleNumberPlate, String vehicleModel,
                         String serviceType, String status, String description, int maintenanceId,
                         String scheduledDate, String scheduledTime, String serviceBay,
                         String estimatedDuration, String assignedTechnician) {
        this.eventId = eventId;
        this.vehicleId = vehicleId;
        this.vehicleNumberPlate = vehicleNumberPlate;
        this.vehicleModel = vehicleModel;
        this.serviceType = serviceType;
        this.status = status;
        this.description = description;
        this.maintenanceId = maintenanceId;
        this.scheduledDate = scheduledDate;
        this.scheduledTime = scheduledTime;
        this.serviceBay = serviceBay;
        this.estimatedDuration = estimatedDuration;
        this.assignedTechnician = assignedTechnician;
    }

    // Constructor for basic event (without vehicle details)
    public CalendarEvent(int eventId, int vehicleId, String serviceType, String status,
                         String description, int maintenanceId, String scheduledDate,
                         String scheduledTime, String serviceBay, String estimatedDuration,
                         String assignedTechnician) {
        this.eventId = eventId;
        this.vehicleId = vehicleId;
        this.serviceType = serviceType;
        this.status = status;
        this.description = description;
        this.maintenanceId = maintenanceId;
        this.scheduledDate = scheduledDate;
        this.scheduledTime = scheduledTime;
        this.serviceBay = serviceBay;
        this.estimatedDuration = estimatedDuration;
        this.assignedTechnician = assignedTechnician;
    }

    // Getters and Setters
    public int getEventId() {
        return eventId;
    }

    public void setEventId(int eventId) {
        this.eventId = eventId;
    }

    public int getVehicleId() {
        return vehicleId;
    }

    public void setVehicleId(int vehicleId) {
        this.vehicleId = vehicleId;
    }

    public String getVehicleNumberPlate() {
        return vehicleNumberPlate;
    }

    public void setVehicleNumberPlate(String vehicleNumberPlate) {
        this.vehicleNumberPlate = vehicleNumberPlate;
    }

    public String getVehicleModel() {
        return vehicleModel;
    }

    public void setVehicleModel(String vehicleModel) {
        this.vehicleModel = vehicleModel;
    }

    public String getServiceType() {
        return serviceType;
    }

    public void setServiceType(String serviceType) {
        this.serviceType = serviceType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getMaintenanceId() {
        return maintenanceId;
    }

    public void setMaintenanceId(int maintenanceId) {
        this.maintenanceId = maintenanceId;
    }

    public String getScheduledDate() {
        return scheduledDate;
    }

    public void setScheduledDate(String scheduledDate) {
        this.scheduledDate = scheduledDate;
    }

    public String getScheduledTime() {
        return scheduledTime;
    }

    public void setScheduledTime(String scheduledTime) {
        this.scheduledTime = scheduledTime;
    }

    public String getServiceBay() {
        return serviceBay;
    }

    public void setServiceBay(String serviceBay) {
        this.serviceBay = serviceBay;
    }

    public String getEstimatedDuration() {
        return estimatedDuration;
    }

    public void setEstimatedDuration(String estimatedDuration) {
        this.estimatedDuration = estimatedDuration;
    }

    public String getAssignedTechnician() {
        return assignedTechnician;
    }

    public void setAssignedTechnician(String assignedTechnician) {
        this.assignedTechnician = assignedTechnician;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    @Override
    public String toString() {
        return "CalendarEvent{" +
                "eventId=" + eventId +
                ", vehicleId=" + vehicleId +
                ", vehicleNumberPlate='" + vehicleNumberPlate + '\'' +
                ", vehicleModel='" + vehicleModel + '\'' +
                ", serviceType='" + serviceType + '\'' +
                ", status='" + status + '\'' +
                ", scheduledDate='" + scheduledDate + '\'' +
                ", scheduledTime='" + scheduledTime + '\'' +
                ", serviceBay='" + serviceBay + '\'' +
                ", estimatedDuration='" + estimatedDuration + '\'' +
                ", assignedTechnician='" + assignedTechnician + '\'' +
                '}';
    }
}