package rentalcompany.drivers.model;

import java.sql.Timestamp;

public class Issue {

    private int issueId;
    private int driverId;
    private String category;
    private String location;
    private String description;
    private String bookingId;
    private String plateNumber;
    private String photoPath;
    private Boolean isDriveable;
    private String status;
    private Timestamp createdAt;
    private Timestamp updatedAt;

    public Issue() {}

    // Full constructor
    public Issue(int issueId, int driverId, String category, String location,
                 String description, String bookingId, String plateNumber,
                 String photoPath, Boolean isDriveable, String status,
                 Timestamp createdAt, Timestamp updatedAt) {
        this.issueId = issueId;
        this.driverId = driverId;
        this.category = category;
        this.location = location;
        this.description = description;
        this.bookingId = bookingId;
        this.plateNumber = plateNumber;
        this.photoPath = photoPath;
        this.isDriveable = isDriveable;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

        // ===== Getters & Setters =====

    public int getIssueId() {
        return issueId;
    }

    public void setIssueId(int issueId) {
        this.issueId = issueId;
    }

    public int getDriverId() {
        return driverId;
    }

    public void setDriverId(int driverId) {
        this.driverId = driverId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getBookingId() {
        return bookingId;
    }

    public void setBookingId(String bookingId) {
        this.bookingId = bookingId;
    }

    public String getPlateNumber() {
        return plateNumber;
    }

    public void setPlateNumber(String plateNumber) {
        this.plateNumber = plateNumber;
    }

    public String getPhotoPath() {
        return photoPath;
    }

    public void setPhotoPath(String photoPath) {
        this.photoPath = photoPath;
    }

    public Boolean getIsDriveable() {
        return isDriveable;
    }

    public void setIsDriveable(Boolean isDriveable) {
        this.isDriveable = isDriveable;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Timestamp getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Timestamp createdAt) {
        this.createdAt = createdAt;
    }

    public Timestamp getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Timestamp updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Utility method for formatted issue ID
    public String getFormattedIssueId() {
        return String.format("#RPT%03d", issueId);
    }

    // Utility method for formatted date
    public String getFormattedDate() {
        if (createdAt != null) {
            return createdAt.toString().substring(0, 10);
        }
        return "N/A";
    }
}
