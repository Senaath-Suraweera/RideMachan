package rentalcompany.management.controller;

import common.util.DBConnection;
import rentalcompany.management.model.RentalCompany;

import java.sql.*;

public class RentalCompanyDAO {

    public boolean addCompany(RentalCompany company) {
        String sql = "INSERT INTO rentalcompany (companyname, companyemail, phone, registrationnumber, taxid, " +
                "street, city, certificatepath, taxdocumentpath, hashedpassword, salt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
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
            ps.setString(10, company.getHashedPassword());
            ps.setString(11, company.getSalt());

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
                company.setHashedPassword(rs.getString("hashedpassword"));
                company.setSalt(rs.getString("salt"));
                return company;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }
}