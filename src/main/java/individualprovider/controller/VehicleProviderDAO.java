package individualprovider.controller;

import common.util.DBConnection;
import common.util.PasswordServices;
import individualprovider.model.VehicleProvider;

import java.sql.*;

public class VehicleProviderDAO {

    public static boolean insertProvider(VehicleProvider provider) {
        String sql = "INSERT INTO VehicleProvider (username, email, hashedpassword, salt, company_id, " +
                "firstname, lastname, phonenumber, housenumber, street, city, zipcode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            String salt = PasswordServices.generateSalt();
            String hashedPassword = PasswordServices.hashPassword(provider.getPassword(), salt);

            ps.setString(1, provider.getUsername());
            ps.setString(2, provider.getEmail());
            ps.setString(3, hashedPassword);
            ps.setString(4, salt);
            ps.setInt(5, provider.getCompanyId());
            ps.setString(6, provider.getFirstName());
            ps.setString(7, provider.getLastName());
            ps.setString(8, provider.getPhoneNumber());
            ps.setString(9, provider.getHouseNumber());
            ps.setString(10, provider.getStreet());
            ps.setString(11, provider.getCity());
            ps.setString(12, provider.getZipcode());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public static VehicleProvider loginProvider(String email, String password) {
        String sql = "SELECT * FROM VehicleProvider WHERE email = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                String storedHash = rs.getString("hashedpassword");
                String storedSalt = rs.getString("salt");

                if (PasswordServices.verifyPassword(password, storedSalt, storedHash)) {
                    VehicleProvider provider = new VehicleProvider(rs.getString("username"), null);
                    provider.setProviderId(rs.getInt("providerid"));
                    provider.setEmail(rs.getString("email"));
                    provider.setCompanyId(rs.getInt("company_id"));
                    provider.setFirstName(rs.getString("firstname"));
                    provider.setLastName(rs.getString("lastname"));
                    provider.setPhoneNumber(rs.getString("phonenumber"));
                    provider.setHouseNumber(rs.getString("housenumber"));
                    provider.setStreet(rs.getString("street"));
                    provider.setCity(rs.getString("city"));
                    provider.setZipcode(rs.getString("zipcode"));
                    return provider;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}
