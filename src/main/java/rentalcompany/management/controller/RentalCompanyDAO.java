package rentalcompany.management.controller;

import common.util.DBConnection;
import rentalcompany.management.model.RentalCompany;
import rentalcompany.companyvehicle.model.Vehicle;
import rentalcompany.maintenance.model.MaintenanceStaff;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class RentalCompanyDAO {

    public boolean addCompany(RentalCompany company) {
        String sql = "INSERT INTO rentalcompany (companyname, companyemail, phone, registrationnumber, taxid, " +
                "street, city, certificatepath, taxdocumentpath, description, terms , hashedpassword, salt) VALUES (?,?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, company.getCompanyName());
            ps.setString(2, company.getEmail());
            ps.setString(3, company.getPhone());
            ps.setString(4, company.getRegistrationNumber());
            ps.setString(5, company.getTaxId());
            ps.setString(6, company.getStreet());
            ps.setString(7, company.getCity());
            ps.setString(8, company.getCertificatePath());
            ps.setString(9, company.getTaxDocumentPath());
            ps.setString(10, company.getDescription());
            ps.setString(11, company.getTerms());
            ps.setString(12, company.getHashedPassword());
            ps.setString(13, company.getSalt());

            ps.executeUpdate();
            return true;

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public RentalCompany getCompanyByEmail(String email) {
        String sql = "SELECT * FROM rentalcompany WHERE companyemail = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                RentalCompany company = new RentalCompany();
                company.setCompanyId(rs.getInt("companyid"));
                company.setCompanyName(rs.getString("companyname"));
                company.setEmail(rs.getString("companyemail"));
                company.setPhone(rs.getString("phone"));
                company.setRegistrationNumber(rs.getString("registrationnumber"));
                company.setTaxId(rs.getString("taxid"));
                company.setStreet(rs.getString("street"));
                company.setCity(rs.getString("city"));
                company.setCertificatePath(rs.getString("certificatepath"));
                company.setTaxDocumentPath(rs.getString("taxdocumentpath"));
                company.setDescription(rs.getString("description"));
                company.setTerms(rs.getString("terms"));
                company.setHashedPassword(rs.getString("hashedpassword"));
                company.setSalt(rs.getString("salt"));
                return company;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static RentalCompany getCompanyById(int companyId) {

        String sql = "SELECT * FROM rentalcompany WHERE companyid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {

                RentalCompany company = new RentalCompany();

                company.setCompanyId(rs.getInt("companyid"));
                company.setCompanyName(rs.getString("companyname"));
                company.setEmail(rs.getString("companyemail"));
                company.setPhone(rs.getString("phone"));
                company.setRegistrationNumber(rs.getString("registrationnumber"));
                company.setTaxId(rs.getString("taxid"));
                company.setStreet(rs.getString("street"));
                company.setCity(rs.getString("city"));
                company.setCertificatePath(rs.getString("certificatepath"));
                company.setTaxDocumentPath(rs.getString("taxdocumentpath"));
                company.setDescription(rs.getString("description"));
                company.setTerms(rs.getString("terms"));

                return company;
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return null;
    }

    public static boolean updateCompanyProfile(int companyId,String companyName,String phone,String email,String street, String city) {

        boolean status = false;

        String sql = "UPDATE rentalcompany SET companyname=?, phone=?, companyemail=?, street=?, city=? WHERE companyid=?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {


            ps.setString(1, companyName);
            ps.setString(2, phone);
            ps.setString(3, email);
            ps.setString(4, street);
            ps.setString(5, city);
            ps.setInt(6, companyId);

            status = ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return status;
    }

    public static Vehicle getVehicleDetails(int companyId, String numberplate, String date) {

        Vehicle vehicle = null;

        String sql = "SELECT * FROM vehicle WHERE company_id=? AND numberplatenumber=?";


        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);
            ps.setString(2, numberplate);

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {

                vehicle = new Vehicle();

                vehicle.setVehicleId(rs.getInt("vehicleid"));
                vehicle.setVehicleBrand(rs.getString("vehiclebrand"));
                vehicle.setVehicleModel(rs.getString("vehiclemodel"));
                vehicle.setNumberPlateNumber(rs.getString("numberplatenumber"));
                vehicle.setYear(rs.getInt("manufacture_year"));
                vehicle.setStatus(rs.getString("availability_status"));

            }


        } catch (Exception e) {
            e.printStackTrace();
        }

        return vehicle;
    }

    public static boolean assignStaffToVehicle(int staffId, int vehicleId, int companyId) {

        boolean status = false;

        String sql = "INSERT INTO maintenance_vehicle_assignment (maintenanceid, vehicleid, assigned_date, status) VALUES (?, ?, NOW(), 'assigned')";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            ps.setInt(2, vehicleId);

            status = ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return status;
    }





    public static boolean checkVehicleAssignment(int vehicleId) {

        String sql = "SELECT 1 " +
                    "FROM maintenance_vehicle_assignment " +
                    "WHERE vehicleid = ? " +
                    "LIMIT 1";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, vehicleId);

            ResultSet rs = ps.executeQuery();

            return rs.next();

        } catch (Exception e) {

            e.printStackTrace();
        }

        return false;
    }

    public static List<Vehicle> getAssignedVehiclesByStaffId(int staffId) {

        List<Vehicle> list = new ArrayList<>();

        String sql = """
                        SELECT v.vehicleid, v.vehiclebrand, v.vehiclemodel,
                               v.price_per_day, v.location, v.fuel_type,
                               v.vehicle_type, v.availability_status
                        FROM maintenance_vehicle_assignment mva
                        JOIN vehicle v ON mva.vehicleid = v.vehicleid
                        WHERE mva.maintenanceid = ?
                    """;

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {

                Vehicle v = new Vehicle();

                v.setVehicleId(rs.getInt("vehicleid"));
                v.setVehicleBrand(rs.getString("vehiclebrand"));
                v.setVehicleModel(rs.getString("vehiclemodel"));
                v.setPricePerDay((int) rs.getDouble("price_per_day"));
                v.setLocation(rs.getString("location"));
                v.setFuelType(rs.getString("fuel_type"));
                v.setVehicleType(rs.getString("vehicle_type"));
                v.setAvailabilityStatus(rs.getString("availability_status"));

                list.add(v);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    public static List<Vehicle> getPendingProviderRequestedVehicles(int companyId) {

        List<Vehicle> list = new ArrayList<>();

        String sql =
                "SELECT v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, " +
                        "v.price_per_day, v.location, v.vehicle_type, v.fuel_type, v.availability_status " +
                        "FROM providerrentalrequests r " +
                        "INNER JOIN vehicle v ON r.vehicle_id = v.vehicleid " +
                        "WHERE r.company_id = ? AND r.status = 'pending'";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {

                Vehicle v = new Vehicle();

                v.setVehicleId(rs.getInt("vehicleid"));
                v.setVehicleBrand(rs.getString("vehiclebrand"));
                v.setVehicleModel(rs.getString("vehiclemodel"));
                v.setNumberPlateNumber(rs.getString("numberplatenumber"));
                v.setPricePerDay((int) rs.getDouble("price_per_day"));
                v.setLocation(rs.getString("location"));
                v.setVehicleType(rs.getString("vehicle_type"));
                v.setFuelType(rs.getString("fuel_type"));
                v.setAvailabilityStatus(rs.getString("availability_status"));

                list.add(v);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    public static boolean acceptProviderRequest(int companyId, int vehicleId) {

        String updateRequestSql =
                "UPDATE providerrentalrequests " +
                        "SET status = 'approved', responded_at = NOW() " +
                        "WHERE vehicle_id = ? AND company_id = ? AND status = 'pending'";

        String updateVehicleSql =
                "UPDATE vehicle SET company_id = ? WHERE vehicleid = ?";

        Connection con = null;

        try {
            con = DBConnection.getConnection();
            con.setAutoCommit(false);

            // 1. Mark the provider request as approved
            try (PreparedStatement ps1 = con.prepareStatement(updateRequestSql)) {
                ps1.setInt(1, vehicleId);
                ps1.setInt(2, companyId);

                int rows = ps1.executeUpdate();

                if (rows == 0) {
                    // no matching pending request -> abort
                    con.rollback();
                    return false;
                }
            }

            // 2. Assign the vehicle to the company
            try (PreparedStatement ps2 = con.prepareStatement(updateVehicleSql)) {
                ps2.setInt(1, companyId);
                ps2.setInt(2, vehicleId);
                ps2.executeUpdate();
            }

            con.commit();
            return true;

        } catch (Exception e) {
            e.printStackTrace();
            try { if (con != null) con.rollback(); } catch (Exception ignore) {}
            return false;

        } finally {
            try { if (con != null) { con.setAutoCommit(true); con.close(); } } catch (Exception ignore) {}
        }
    }

    public static boolean rejectProviderRequest(int companyId, int vehicleId) {

        String sql =
                "UPDATE providerrentalrequests " +
                        "SET status = 'rejected', responded_at = NOW() " +
                        "WHERE vehicle_id = ? AND company_id = ? AND status = 'pending'";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, vehicleId);
            ps.setInt(2, companyId);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }


}
