package rentalcompany.drivers.model;

import java.sql.Date;

public class Driver {
    private int driverId;
    private String username;
    private String firstName;
    private String lastName;
    private String email;
    private String mobileNumber;
    private String description;
    private String password; // temporary plain text for signup only
    private String hashedPassword;
    private String salt;
    private String nicNumber;
    private byte[] nicPdf;
    private byte[] driversLicence;
    private int companyId;
    private String homeAddress;
    private String licenseNumber;
    private String companyName;
    private Date joinedDate;
    private String assignedArea;
    private String shiftTime;
    private String reportingManager;
    private String profilePicture; // Base64 encoded image or URL
    private String availability; // NEW: For calendar availability status

    // Constructor for registration
    public Driver(String username, String firstName, String lastName, String email,
                  String mobileNumber, String description, String password,
                  String nicNumber, byte[] nicPdf, byte[] driversLicence, int companyId) {
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.email = email;
        this.mobileNumber = mobileNumber;
        this.description = description;
        this.password = password;
        this.nicNumber = nicNumber;
        this.nicPdf = nicPdf;
        this.driversLicence = driversLicence;
        this.companyId = companyId;
    }

    // Constructor for login
    public Driver(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // Default constructor
    public Driver() {

    }

    // Getters & Setters
    public int getDriverId() { return driverId; }
    public void setDriverId(int driverId) { this.driverId = driverId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getHashedPassword() { return hashedPassword; }
    public void setHashedPassword(String hashedPassword) { this.hashedPassword = hashedPassword; }

    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }

    public String getNicNumber() { return nicNumber; }
    public void setNicNumber(String nicNumber) { this.nicNumber = nicNumber; }

    public byte[] getNicPdf() { return nicPdf; }
    public void setNicPdf(byte[] nicPdf) { this.nicPdf = nicPdf; }

    public byte[] getDriversLicence() { return driversLicence; }
    public void setDriversLicence(byte[] driversLicence) { this.driversLicence = driversLicence; }

    public int getCompanyId() { return companyId; }
    public void setCompanyId(int companyId) { this.companyId = companyId; }

    public String getHomeAddress() { return homeAddress; }
    public void setHomeAddress(String homeAddress) { this.homeAddress = homeAddress; }

    public String getLicenseNumber() { return licenseNumber; }
    public void setLicenseNumber(String licenseNumber) { this.licenseNumber = licenseNumber; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public Date getJoinedDate() { return joinedDate; }
    public void setJoinedDate(Date joinedDate) { this.joinedDate = joinedDate; }

    public String getAssignedArea() { return assignedArea; }
    public void setAssignedArea(String assignedArea) { this.assignedArea = assignedArea; }

    public String getShiftTime() { return shiftTime; }
    public void setShiftTime(String shiftTime) { this.shiftTime = shiftTime; }

    public String getReportingManager() { return reportingManager; }
    public void setReportingManager(String reportingManager) { this.reportingManager = reportingManager; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public String getAvailability() { return availability; }
    public void setAvailability(String availability) { this.availability = availability; }

    // Get full name
    public String getFullName() {
        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        } else {
            return username;
        }
    }
}