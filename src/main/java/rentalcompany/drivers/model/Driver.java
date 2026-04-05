package rentalcompany.drivers.model;

import java.util.Date;

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
    private String driverLicenceNumber;
    private Date licenceExpiration;
    private byte[] nicPdf;
    private byte[] driversLicence;
    private int companyId;
    private int rating;
    private String status;
    private String area;
    private String homeAddress;
    private String companyName;
    private Date joinedDate;
    private String shiftTime;
    private String reportingManager;
    private String profilePicture;


    // Default constructor
    public Driver() {

    }

    // Constructor for registration
    public Driver(String username, String firstName, String lastName, String area, String email,
                  String mobileNumber, String description, String password, String nicNumber,
                  byte[] nicPdf, byte[] driversLicence, int companyId, String licenceNumber, Date licenceExpiration) {

        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.area = area;
        this.email = email;
        this.mobileNumber = mobileNumber;
        this.description = description;
        this.password = password;
        this.nicNumber = nicNumber;
        this.nicPdf = nicPdf;
        this.driversLicence = driversLicence;
        this.companyId = companyId;
        this.driverLicenceNumber = licenceNumber;
        this.licenceExpiration = licenceExpiration;

    }

    // Constructor for login
    public Driver(String username, String password) {
        this.username = username;
        this.password = password;
    }

    //constructor for Load CompanyDrivers
    public Driver(int driverId, String firstName, String lastName, String status, int rating, String area, String driverLicenceNumber, String mobileNumber, Date licenceExpiration) {
        this.driverId = driverId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.status = status;
        this.rating = rating;
        this.area = area;
        this.driverLicenceNumber = driverLicenceNumber;
        this.mobileNumber = mobileNumber;
        this.licenceExpiration = licenceExpiration;
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

    public String getDriverLicenceNumber() { return driverLicenceNumber; }
    public void setDriverLicenceNumber(String driverLicenceNumber) { this.driverLicenceNumber = driverLicenceNumber; }

    public Date getLicenceExpiration() { return licenceExpiration; }
    public void setLicenceExpiration(Date licenceExpiration) { this.licenceExpiration = licenceExpiration; }

    public byte[] getNicPdf() { return nicPdf; }
    public void setNicPdf(byte[] nicPdf) { this.nicPdf = nicPdf; }

    public byte[] getDriversLicence() { return driversLicence; }
    public void setDriversLicence(byte[] driversLicence) { this.driversLicence = driversLicence; }

    public int getCompanyId() { return companyId; }
    public void setCompanyId(int companyId) { this.companyId = companyId; }

    public int getRating() { return rating; }
    public void setRating(int rating) { this.rating = rating; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getHomeAddress() { return homeAddress; }
    public void setHomeAddress(String homeAddress) { this.homeAddress = homeAddress; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public Date getJoinedDate() { return joinedDate; }
    public void setJoinedDate(Date joinedDate) { this.joinedDate = joinedDate; }

    public String getShiftTime() { return shiftTime; }
    public void setShiftTime(String shiftTime) { this.shiftTime = shiftTime; }

    public String getReportingManager() { return reportingManager; }
    public void setReportingManager(String reportingManager) { this.reportingManager = reportingManager; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

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