package rentalcompany.maintenance.controller;

import common.util.DBConnection;
import rentalcompany.maintenance.model.MaintenanceStaff;

import java.sql.*;

public class MaintenanceStaffDAO {

    public boolean addStaff(MaintenanceStaff staff) {
        String sql = "INSERT INTO MaintenanceStaff (username, firstname, lastname, email, hashedpassword, salt, mobilenumber, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, staff.getUsername());
            ps.setString(2, staff.getFirstname());
            ps.setString(3, staff.getLastname());
            ps.setString(4, staff.getEmail());
            ps.setString(5, staff.getHashedPassword());
            ps.setString(6, staff.getSalt());
            ps.setString(7, staff.getContactNumber());
            ps.setInt(8, staff.getCompanyId());
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public MaintenanceStaff getStaffByEmail(String email) {
        String sql = "SELECT * FROM MaintenanceStaff WHERE email = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                MaintenanceStaff s = new MaintenanceStaff();
                s.setStaffId(rs.getInt("maintenanceid"));
                s.setUsername(rs.getString("username"));
                s.setFirstname(rs.getString("firstname"));
                s.setLastname(rs.getString("lastname"));
                s.setEmail(rs.getString("email"));
                s.setHashedPassword(rs.getString("hashedpassword"));
                s.setSalt(rs.getString("salt"));
                s.setContactNumber(rs.getString("mobilenumber"));
                s.setCompanyId(rs.getInt("company_id"));
                return s;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
}
