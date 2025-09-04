package rentalcompany.drivers.controller;

import common.util.DBConnection;
import common.util.PasswordServices;

import java.io.InputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

public class DriverController {

    private static boolean isSuccess;
    private static Connection con = null;
    private static Statement stmt = null;
    private static ResultSet rs = null;

    public static boolean insertData(String username, String email, String password , String firstName, String lastName, String nicNumber, InputStream nicPdf, InputStream licencePdf , String companyId) {

        boolean isSuccess = false;
        try{
            con = DBConnection.getConnection();
            stmt = con.createStatement();

            System.out.println("username: " + username);
            System.out.println("email: " + email);
            System.out.println("password: " + password);
            System.out.println("firstName: " + firstName);
            System.out.println("lastName: " + lastName);
            System.out.println("nicNumber: " + nicNumber);
            System.out.println("nicPdf: " + nicPdf);
            System.out.println("licencePdf: " + licencePdf);
            System.out.println("companyId: " + companyId);

            String salt = PasswordServices.generateSalt();
            String hashedPassword = PasswordServices.hashPassword(password, salt);

            String sql = "INSERT INTO Driver (username, email, hashedpassword, salt, firstname, lastname , nicnumber, nic, driverslicence , company_id) VALUES (?, ? , ? , ?, ?, ?, ?, ? , ?, ?)";
            try (PreparedStatement pstmt = con.prepareStatement(sql)) {
                pstmt.setString(1, username);
                pstmt.setString(2, email);
                pstmt.setString(3, hashedPassword);
                pstmt.setString(4, salt);
                pstmt.setString(5, firstName);
                pstmt.setString(6, lastName);
                pstmt.setString(7, nicNumber);
                pstmt.setString(10, companyId);

                if (nicPdf != null) {
                    pstmt.setBlob(8, nicPdf);
                } else {
                    pstmt.setBytes(8, new byte[0]);
                }

                if (licencePdf != null) {
                    pstmt.setBlob(9, licencePdf);
                } else {
                    pstmt.setBytes(9, new byte[0]);
                }



                int rows = pstmt.executeUpdate();
                if (rows > 0) {
                    System.out.println("Data inserted into Driver successfully");
                    isSuccess = true;
                }
            }

        } catch (Exception e) {
            System.out.println("Data insertion into Driver failed");
            e.printStackTrace();
        }
        return isSuccess;
    }

}
