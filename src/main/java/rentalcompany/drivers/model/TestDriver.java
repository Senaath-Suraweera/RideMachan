package rentalcompany.drivers.model;

public class TestDriver {
    private int driverId;
    private String username;
    private String email;

    public TestDriver(String username, String email) {
        this.username = username;
        this.email = email;
    }

    public int getDriverId() { return driverId; }
    public void setDriverId(int driverId) { this.driverId = driverId; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

}
