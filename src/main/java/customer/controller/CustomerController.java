package customer.controller;

import common.util.DBConnection;
import common.util.PasswordServices;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

public class CustomerController {

    private static boolean isSuccess;
    private static Connection con = null;
    private static Statement stmt = null;
    private static ResultSet rs = null;

    public static boolean insertData(String username, String email, String password, String mobileNumber) {

        boolean isSuccess = false;
        try{
            con = DBConnection.getConnection();
            stmt = con.createStatement();

            System.out.println("username: " + username);
            System.out.println("email: " + email);
            System.out.println("password: " + password);
            System.out.println("mobileNumber: " + mobileNumber);

            String salt = PasswordServices.generateSalt();
            String hashedPassword = PasswordServices.hashPassword(password, salt);

            String sql = "INSERT INTO Customer (username, email, mobilenumber, hashedpassword, salt) VALUES (?, ?, ?, ?, ?)";
            try (PreparedStatement pstmt = con.prepareStatement(sql)) {
                pstmt.setString(1, username);
                pstmt.setString(2, email);
                pstmt.setString(3, mobileNumber);
                pstmt.setString(4, hashedPassword);
                pstmt.setString(5, salt);

                int rows = pstmt.executeUpdate();
                if (rows > 0) {
                    System.out.println("Data inserted into Customer successfully");
                    isSuccess = true;
                }
            }
        } catch (Exception e) {
            System.out.println("Data insertion into Customer failed");
            e.printStackTrace();
        }
        return isSuccess;
    }

}
