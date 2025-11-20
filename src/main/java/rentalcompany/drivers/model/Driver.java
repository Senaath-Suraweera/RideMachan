package rentalcompany.drivers.model;

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
}
