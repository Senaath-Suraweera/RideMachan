package rentalcompany.maintenance.model;

public class MaintenanceStaff {
    private int staffId;
    private String username;
    private String firstname;
    private String lastname;
    private String email;
    private String hashedPassword;
    private String salt;
    private String contactNumber;
    private int companyId;
    private String specialization;
    int completedJobs;
    String status;
    private String[] assignedVehicles;
    private float yearsOfExperience;

    //constructor for getmaintenancestaff
    public MaintenanceStaff() {}

    //constructor for adding maintenancestaff
    public MaintenanceStaff(String username, String firstname, String lastname,
                            String email, String hashedPassword, String salt,
                            String contactNumber, int companyId, String specialization, float yearsOfExperience) {

        this.username = username;
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.hashedPassword = hashedPassword;
        this.salt = salt;
        this.contactNumber = contactNumber;
        this.companyId = companyId;
        this.specialization = specialization;
        this.yearsOfExperience = yearsOfExperience;

    }


    // Getters & Setters
    public int getStaffId() { return staffId; }
    public void setStaffId(int staffId) { this.staffId = staffId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getFirstname() { return firstname; }
    public void setFirstname(String firstname) { this.firstname = firstname; }

    public String getLastname() { return lastname; }
    public void setLastname(String lastname) { this.lastname = lastname; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getHashedPassword() { return hashedPassword; }
    public void setHashedPassword(String hashedPassword) { this.hashedPassword = hashedPassword; }

    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public int getCompanyId() { return companyId; }
    public void setCompanyId(int companyId) { this.companyId = companyId; }

    public String getSpecialization() { return specialization; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }

    public int getCompletedJobs() { return completedJobs; }
    public void setCompletedJobs(int completedJobs) { this.completedJobs = completedJobs; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String[] getAssignedVehicles() { return assignedVehicles; }
    public void setAssignedVehicles(String[] assignedVehicles) { this.assignedVehicles = assignedVehicles; }

    public float getYearsOfExperience() { return yearsOfExperience; }
    public void setYearsOfExperience(float yearsOfExperience) { this.yearsOfExperience = yearsOfExperience; }
}
