package admin.model;

public class Admin {
    private int adminId;
    private String username;
    private String email;
    private String hashedPassword;
    private String salt;
    private String phoneNumber;

    public Admin() {
    }

    public Admin(int adminId, String username, String email, String hashedPassword, String salt, String phoneNumber) {
        this.adminId = adminId;
        this.username = username;
        this.email = email;
        this.hashedPassword = hashedPassword;
        this.salt = salt;
        this.phoneNumber = phoneNumber;
    }


    // Getters and Setters


    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public int getAdminId() { return adminId; }
    public void setAdminId(int adminId) { this.adminId = adminId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getHashedPassword() { return hashedPassword; }
    public void setHashedPassword(String hashedPassword) { this.hashedPassword = hashedPassword; }

    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }
}
