package individualprovider.model;

public class VehicleProvider {
    private int providerId;
    private String username;
    private String email;
    private String password; // plain text for signup only
    private String hashedPassword;
    private String salt;
    private int companyId;

    private String firstName;
    private String lastName;
    private String phoneNumber;
    private String houseNumber;
    private String street;
    private String city;
    private String zipcode;

    // Constructor for registration
    public VehicleProvider(String username, String email, String password, int companyId,
                           String firstName, String lastName, String phoneNumber,
                           String houseNumber, String street, String city, String zipcode) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.companyId = companyId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.houseNumber = houseNumber;
        this.street = street;
        this.city = city;
        this.zipcode = zipcode;
    }

    // Constructor for login
    public VehicleProvider(String username, String password) {
        this.username = username;
        this.password = password;
    }

    // Getters & Setters
    public int getProviderId() { return providerId; }
    public void setProviderId(int providerId) { this.providerId = providerId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getHashedPassword() { return hashedPassword; }
    public void setHashedPassword(String hashedPassword) { this.hashedPassword = hashedPassword; }

    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }

    public int getCompanyId() { return companyId; }
    public void setCompanyId(int companyId) { this.companyId = companyId; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getHouseNumber() { return houseNumber; }
    public void setHouseNumber(String houseNumber) { this.houseNumber = houseNumber; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getZipcode() { return zipcode; }
    public void setZipcode(String zipcode) { this.zipcode = zipcode; }
}