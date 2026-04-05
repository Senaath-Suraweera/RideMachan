package admin.model;

public class Report {
    private int reportId;

    private String category; // vehicle/behavior/payment/app/safety
    private String status;   // Pending/Reviewed/Resolved/Closed
    private String priority; // Low/Medium/High/Urgent

    private String subject;
    private String description;

    private String reportedRole; // CUSTOMER/DRIVER/COMPANY
    private int reportedId;

    private String reporterRole; // CUSTOMER/DRIVER/COMPANY/ADMIN
    private int reporterId;

    private String reporterName;
    private String reporterEmail;
    private String reporterPhone;

    private String createdAt;
    private String updatedAt;

    // getters/setters
    public int getReportId() { return reportId; }
    public void setReportId(int reportId) { this.reportId = reportId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getReportedRole() { return reportedRole; }
    public void setReportedRole(String reportedRole) { this.reportedRole = reportedRole; }

    public int getReportedId() { return reportedId; }
    public void setReportedId(int reportedId) { this.reportedId = reportedId; }

    public String getReporterRole() { return reporterRole; }
    public void setReporterRole(String reporterRole) { this.reporterRole = reporterRole; }

    public int getReporterId() { return reporterId; }
    public void setReporterId(int reporterId) { this.reporterId = reporterId; }

    public String getReporterName() { return reporterName; }
    public void setReporterName(String reporterName) { this.reporterName = reporterName; }

    public String getReporterEmail() { return reporterEmail; }
    public void setReporterEmail(String reporterEmail) { this.reporterEmail = reporterEmail; }

    public String getReporterPhone() { return reporterPhone; }
    public void setReporterPhone(String reporterPhone) { this.reporterPhone = reporterPhone; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
