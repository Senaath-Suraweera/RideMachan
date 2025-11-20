package rentalcompany.management.model;

public class RentalCompany {
    private int companyId;
    private String companyName;
    private String email;
    private String phone;
    private String registrationNumber;
    private String taxId;
    private String street;
    private String city;
    private String certificatePath;
    private String taxDocumentPath;
    private String hashedPassword;
    private String salt;

    public RentalCompany() {}

    // Constructor for initialization
    public RentalCompany(String companyName, String email, String phone, String registrationNumber, String taxId,
                         String street, String city, String certificatePath, String taxDocumentPath,
                         String hashedPassword, String salt) {
        this.companyName = companyName;
        this.email = email;
        this.phone = phone;
        this.registrationNumber = registrationNumber;
        this.taxId = taxId;
        this.street = street;
        this.city = city;
        this.certificatePath = certificatePath;
        this.taxDocumentPath = taxDocumentPath;
        this.hashedPassword = hashedPassword;
        this.salt = salt;
    }

    // Getters & Setters
    public int getCompanyId() { return companyId; }
    public void setCompanyId(int companyId) { this.companyId = companyId; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }

    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getCertificatePath() { return certificatePath; }
    public void setCertificatePath(String certificatePath) { this.certificatePath = certificatePath; }

    public String getTaxDocumentPath() { return taxDocumentPath; }
    public void setTaxDocumentPath(String taxDocumentPath) { this.taxDocumentPath = taxDocumentPath; }

    public String getHashedPassword() { return hashedPassword; }
    public void setHashedPassword(String hashedPassword) { this.hashedPassword = hashedPassword; }

    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }
}
