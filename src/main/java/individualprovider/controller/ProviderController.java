package individualprovider.controller;

import common.util.DBConnection;
import common.util.PasswordServices;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

public class ProviderController {

    private static boolean isSuccess;
    private static Connection con = null;
    private static Statement stmt = null;
    private static ResultSet rs = null;

    public static boolean insertData(String username, String email, String password) {

        boolean isSuccess = false;
        try{
            con = DBConnection.getConnection();
            stmt = con.createStatement();

            System.out.println("username: " + username);
            System.out.println("email: " + email);
            System.out.println("password: " + password);

            String salt = PasswordServices.generateSalt();
            String hashedPassword = PasswordServices.hashPassword(password, salt);

            String sql = "INSERT INTO VehicleProvider (username, email, hashedpassword, salt) VALUES (?, ?, ?, ?)";
            try (PreparedStatement pstmt = con.prepareStatement(sql)) {
                pstmt.setString(1, username);
                pstmt.setString(2, email);
                pstmt.setString(3, hashedPassword);
                pstmt.setString(4, salt);

                int rows = pstmt.executeUpdate();
                if (rows > 0) {
                    System.out.println("Data inserted into VehicleProvider successfully");
                    isSuccess = true;
                }
            }

        } catch (Exception e) {
            System.out.println("Data insertion into VehicleProvider failed");
            e.printStackTrace();
        }
        return isSuccess;
    }

}
