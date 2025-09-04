package admin.controller;
//
//import common.util.AuthService;
import common.util.DBConnection;
import common.util.PasswordServices;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

public class AdminController {

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

            String sql = "insert into Admin values(0,'"+username+"','"+email+"','"+hashedPassword+"','"+salt+"')";
            int rs = stmt.executeUpdate(sql);
            if (rs > 0) {
                System.out.println("Data inserted successfully");
                isSuccess = true;
            }
        } catch (Exception e) {
            System.out.println("Data insertion failed");
            e.printStackTrace();
        }
        return isSuccess;
    }

}
