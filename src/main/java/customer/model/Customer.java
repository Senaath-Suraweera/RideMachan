package customer.model;

import java.io.Serializable;

public class Customer implements Serializable {
    private static final long serialVersionUID = 1L;

    private int customerId;
    private String username;
    private String firstname;
    private String lastname;
    private String email;
    private String mobileNumber;
    private String hashedPassword;
    private String salt;


    private String customerType; // LOCAL or FOREIGN

    // Common address fields
    private String street;
    private String city;
    private String zipCode;
    private String country;

    // Local customer fields
    private String nicNumber;
    private byte[] nicImage;
    private String driversLicenseNumber;
    private byte[] driversLicenseImage;

    // Foreign customer fields
    private String passportNumber;
    private String internationalDriversLicenseNumber;

    private boolean verified;
    private boolean active;

    // ===== Constructors =====
    public Customer() {}

    public Customer(int customerId, String username, String firstname, String lastname, String email,
                    String mobileNumber, String hashedPassword, String salt, String customerType,
                    String street, String city, String zipCode, String country,
                    String nicNumber, byte[] nicImage,
                    String driversLicenseNumber, byte[] driversLicenseImage,
                    String passportNumber, String internationalDriversLicenseNumber, boolean verified) {

        this.customerId = customerId;
        this.username = username;
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.mobileNumber = mobileNumber;
        this.hashedPassword = hashedPassword;
        this.salt = salt;
        this.customerType = customerType;
        this.street = street;
        this.city = city;
        this.zipCode = zipCode;
        this.country = country;
        this.nicNumber = nicNumber;
        this.nicImage = nicImage;
        this.driversLicenseNumber = driversLicenseNumber;
        this.driversLicenseImage = driversLicenseImage;
        this.passportNumber = passportNumber;
        this.internationalDriversLicenseNumber = internationalDriversLicenseNumber;
        this.verified = verified;
    }

    // ===== Getters and Setters =====
    public int getCustomerId() { return customerId; }
    public void setCustomerId(int customerId) { this.customerId = customerId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFirstname() { return firstname; }
    public void setFirstname(String firstname) { this.firstname = firstname; }

    public String getLastname() { return lastname; }
    public void setLastname(String lastname) { this.lastname = lastname; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getMobileNumber() { return mobileNumber; }
    public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; }

    public String getHashedPassword() { return hashedPassword; }
    public void setHashedPassword(String hashedPassword) { this.hashedPassword = hashedPassword; }

    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }

    public String getCustomerType() { return customerType; }
    public void setCustomerType(String customerType) { this.customerType = customerType; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getZipCode() { return zipCode; }
    public void setZipCode(String zipCode) { this.zipCode = zipCode; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getNicNumber() { return nicNumber; }
    public void setNicNumber(String nicNumber) { this.nicNumber = nicNumber; }

    public byte[] getNicImage() { return nicImage; }
    public void setNicImage(byte[] nicImage) { this.nicImage = nicImage; }

    public String getDriversLicenseNumber() { return driversLicenseNumber; }
    public void setDriversLicenseNumber(String driversLicenseNumber) { this.driversLicenseNumber = driversLicenseNumber; }

    public byte[] getDriversLicenseImage() { return driversLicenseImage; }
    public void setDriversLicenseImage(byte[] driversLicenseImage) { this.driversLicenseImage = driversLicenseImage; }

    public String getPassportNumber() { return passportNumber; }
    public void setPassportNumber(String passportNumber) { this.passportNumber = passportNumber; }

    public String getInternationalDriversLicenseNumber() { return internationalDriversLicenseNumber; }
    public void setInternationalDriversLicenseNumber(String internationalDriversLicenseNumber) {
        this.internationalDriversLicenseNumber = internationalDriversLicenseNumber;
    }

    public boolean isVerified() {
        return verified;
    }

    public void setVerified(boolean verified) {
        this.verified = verified;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    // ===== Utility Methods =====
    @Override
    public String toString() {
        return "Customer{" +
                "customerId=" + customerId +
                ", username='" + username + '\'' +
                ", firstname='" + firstname + '\'' +
                ", lastname='" + lastname + '\'' +
                ", email='" + email + '\'' +
                ", mobileNumber='" + mobileNumber + '\'' +
                ", customerType='" + customerType + '\'' +
                ", street='" + street + '\'' +
                ", city='" + city + '\'' +
                ", zipCode='" + zipCode + '\'' +
                ", country='" + country + '\'' +
                ", nicNumber='" + nicNumber + '\'' +
                ", driversLicenseNumber='" + driversLicenseNumber + '\'' +
                ", passportNumber='" + passportNumber + '\'' +
                ", internationalDriversLicenseNumber='" + internationalDriversLicenseNumber + '\'' +
                ", nicImage=" + (nicImage != null ? nicImage.length + " bytes" : "null") +
                ", driversLicenseImage=" + (driversLicenseImage != null ? driversLicenseImage.length + " bytes" : "null") +
                '}';
    }
}