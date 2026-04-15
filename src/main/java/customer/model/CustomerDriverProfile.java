package customer.model;

/**
 * Lightweight driver profile DTO used by the customer driver-profile page.
 * Holds only the fields the customer UI needs — does NOT include sensitive
 * fields like password hashes, NIC blob, or licence blob.
 */
public class CustomerDriverProfile {

    private int driverId;
    private String firstName;
    private String lastName;
    private String email;
    private String mobileNumber;
    private String description;
    private String area;
    private Integer experienceYears;
    private int totalRides;
    private int companyId;
    private String companyName;
    private String companyCity;
    private boolean active;
    private boolean banned;
    private String profilePicture;

    // Computed / aggregated fields (filled from ratings table)
    private double averageRating;
    private int totalReviews;

    public CustomerDriverProfile() {}

    // ── Getters & Setters ──
    public int getDriverId() { return driverId; }
    public void setDriverId(int driverId) { this.driverId = driverId; }

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

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public Integer getExperienceYears() { return experienceYears; }
    public void setExperienceYears(Integer experienceYears) { this.experienceYears = experienceYears; }

    public int getTotalRides() { return totalRides; }
    public void setTotalRides(int totalRides) { this.totalRides = totalRides; }

    public int getCompanyId() { return companyId; }
    public void setCompanyId(int companyId) { this.companyId = companyId; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getCompanyCity() { return companyCity; }
    public void setCompanyCity(String companyCity) { this.companyCity = companyCity; }

    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public boolean isBanned() { return banned; }
    public void setBanned(boolean banned) { this.banned = banned; }

    public String getProfilePicture() { return profilePicture; }
    public void setProfilePicture(String profilePicture) { this.profilePicture = profilePicture; }

    public double getAverageRating() { return averageRating; }
    public void setAverageRating(double averageRating) { this.averageRating = averageRating; }

    public int getTotalReviews() { return totalReviews; }
    public void setTotalReviews(int totalReviews) { this.totalReviews = totalReviews; }
}