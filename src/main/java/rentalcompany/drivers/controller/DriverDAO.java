package rentalcompany.drivers.controller;

import common.util.DBConnection;
import common.util.PasswordServices;
import rentalcompany.drivers.model.Driver;

import java.sql.*;
import java.util.List;
import java.util.ArrayList;

public class DriverDAO {

    public static boolean insertDriver(Driver driver) {
        String sql = "INSERT INTO Driver (username, firstname, lastname, email, mobilenumber, description, " +
                "hashedpassword, salt, nicnumber, nic, driverslicence, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            String salt = PasswordServices.generateSalt();
            String hashedPassword = PasswordServices.hashPassword(driver.getPassword(), salt);

            ps.setString(1, driver.getUsername());
            ps.setString(2, driver.getFirstName());
            ps.setString(3, driver.getLastName());
            ps.setString(4, driver.getEmail());
            ps.setString(5, driver.getMobileNumber());
            ps.setString(6, driver.getDescription());
            ps.setString(7, hashedPassword);
            ps.setString(8, salt);
            ps.setString(9, driver.getNicNumber());
            ps.setBytes(10, driver.getNicPdf());
            ps.setBytes(11, driver.getDriversLicence());
            ps.setInt(12, driver.getCompanyId());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public static List<Driver> loadAllDrivers() {

        List<Driver> drivers = new ArrayList<>();
        String sql = "SELECT * FROM Driver";


        try(Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(sql)) {

            ResultSet rs = ps.executeQuery();

            while(rs.next()) {


                Driver driver = new Driver(

                        rs.getInt("driverid"),
                        rs.getString("firstname"),
                        rs.getString("lastname"),
                        rs.getString("email"),
                        rs.getString("mobilenumber")

                );


                drivers.add(driver);

            }

        }catch(Exception e) {
            e.printStackTrace();
        }

        return drivers;
    }

    public static Driver loginDriver(String email, String password) {
        String sql = "SELECT * FROM Driver WHERE email = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                String storedHash = rs.getString("hashedpassword");
                String storedSalt = rs.getString("salt");

                if (PasswordServices.verifyPassword(password, storedSalt, storedHash)) {
                    Driver d = new Driver(rs.getString("username"), null);
                    d.setDriverId(rs.getInt("driverid"));
                    d.setFirstName(rs.getString("firstname"));
                    d.setLastName(rs.getString("lastname"));
                    d.setEmail(rs.getString("email"));
                    d.setMobileNumber(rs.getString("mobilenumber"));
                    d.setDescription(rs.getString("description"));
                    d.setCompanyId(rs.getInt("company_id"));
                    return d;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}