package rentalcompany.management.controller;

import common.util.DBConnection;
import common.util.PasswordServices;


import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

public class CompanyController {
    private static Connection con = null;
    private static Statement stmt = null;
    private static ResultSet rs = null;

    public static boolean insertData(String companyname, String companyemail, String password) {

        boolean isSuccess = false;
        try{
            con = DBConnection.getConnection();
            stmt = con.createStatement();

            System.out.println("companyname: " + companyname);
            System.out.println("companyemail: " + companyemail);
            System.out.println("password: " + password);

            String salt = PasswordServices.generateSalt();
            String hashedPassword = PasswordServices.hashPassword(password, salt);

            String sql = "INSERT INTO RentalCompany (companyname, companyemail, hashedpassword, salt) VALUES (?, ? , ? , ?)";
            try (PreparedStatement pstmt = con.prepareStatement(sql)) {
                pstmt.setString(1, companyname);
                pstmt.setString(2, companyemail);
                pstmt.setString(3, hashedPassword);
                pstmt.setString(4, salt);
                int rows = pstmt.executeUpdate();
                if (rows > 0) {
                    System.out.println("Data inserted into RentalCompany successfully");
                    isSuccess = true;
                }
            }

        } catch (Exception e) {
            System.out.println("Data insertion into RentalCompany failed");
            e.printStackTrace();
        }
        return isSuccess;
    }

}
