package rentalcompany.management.controller;

import common.util.DBConnection;
import rentalcompany.management.model.RentalCompany;
import rentalcompany.companyvehicle.model.Vehicle;
import rentalcompany.maintenance.model.MaintenanceStaff;

import java.sql.*;

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

}
