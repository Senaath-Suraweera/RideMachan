package customer.controller;

import common.util.DBConnection;
import customer.model.CustomerDriverProfile;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Customer-side DAO for reading driver profile information.
 * Does NOT modify the canonical DriverDAO — this is a read-only,
 * customer-safe view of a driver (no password / NIC / licence blobs).
 *
 * The rentalcompany table is assumed to have a `city` column. If the column
 * name differs, adjust the SELECT in getDriverProfileById().
 */
public class CustomerDriverDAO {

    /**
     * Returns a CustomerDriverProfile for the given driverId, joined with
     * the rental company info, or null if not found / inactive / banned.
     */
    public static CustomerDriverProfile getDriverProfileById(int driverId) {

        String sql = "SELECT d.driverid, d.firstname, d.lastname, d.email, d.mobilenumber, " +
                "       d.description, d.Area, d.experience_years, d.totalrides, " +
                "       d.company_id, d.active, d.banned, d.profilepicture, " +
                "       rc.companyname, rc.city AS company_city " +
                "FROM driver d " +
                "LEFT JOIN rentalcompany rc ON d.company_id = rc.companyid " +
                "WHERE d.driverid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    CustomerDriverProfile p = new CustomerDriverProfile();
                    p.setDriverId(rs.getInt("driverid"));
                    p.setFirstName(rs.getString("firstname"));
                    p.setLastName(rs.getString("lastname"));
                    p.setEmail(rs.getString("email"));
                    p.setMobileNumber(rs.getString("mobilenumber"));
                    p.setDescription(rs.getString("description"));
                    p.setArea(rs.getString("Area"));

                    int exp = rs.getInt("experience_years");
                    p.setExperienceYears(rs.wasNull() ? null : exp);

                    p.setTotalRides(rs.getInt("totalrides"));
                    p.setCompanyId(rs.getInt("company_id"));
                    p.setActive(rs.getBoolean("active"));
                    p.setBanned(rs.getBoolean("banned"));
                    p.setProfilePicture(rs.getString("profilepicture"));

                    p.setCompanyName(rs.getString("companyname"));
                    p.setCompanyCity(rs.getString("company_city"));

                    return p;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }
}