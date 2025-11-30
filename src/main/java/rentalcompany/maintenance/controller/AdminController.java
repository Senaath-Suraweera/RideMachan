package admin.controller;

import admin.model.Admin;
import common.util.DBConnection;
import common.util.PasswordServices;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class AdminController {

    private static boolean isSuccess;
    private static Connection con = null;
    private static Statement stmt = null;
    private static ResultSet rs = null;

    public static boolean insertData(String username, String email, String password, String phoneNumber) {

        boolean isSuccess = false;
        try{
            con = DBConnection.getConnection();
            stmt = con.createStatement();

            System.out.println("username: " + username);
            System.out.println("email: " + email);
            System.out.println("password: " + password);
            System.out.println("PhoneNumber: " + phoneNumber);

            String salt = PasswordServices.generateSalt();
            String hashedPassword = PasswordServices.hashPassword(password, salt);

            String sql = "INSERT INTO Admin (username, email, phonenumber, hashedpassword, salt) VALUES (?, ?, ?, ?, ?)";
            try (PreparedStatement pstmt = con.prepareStatement(sql)) {
                pstmt.setString(1, username);
                pstmt.setString(2, email);
                pstmt.setString(3, phoneNumber);
                pstmt.setString(4, hashedPassword);
                pstmt.setString(5, salt);

                int rows = pstmt.executeUpdate();
                if (rows > 0) {
                    System.out.println("Data inserted into Customer successfully");
                    isSuccess = true;
                }
            }
        } catch (Exception e) {
            System.out.println("Data insertion failed");
            e.printStackTrace();
        }
        return isSuccess;
    }

    public Admin getAdminByEmail(String email) {
        String sql = "SELECT * FROM Admin WHERE email = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                Admin admin = new Admin();
                admin.setAdminId(rs.getInt("adminid"));
                admin.setUsername(rs.getString("username"));
                admin.setEmail(rs.getString("email"));
                admin.setHashedPassword(rs.getString("hashedpassword"));
                admin.setPhoneNumber(rs.getString("phonenumber"));
                admin.setSalt(rs.getString("salt"));

                return admin;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static List<Admin> getAllAdmins() {
        List<Admin> admins = new ArrayList<>();
        String sql = "SELECT adminid, username, email, phonenumber FROM Admin";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                Admin admin = new Admin();
                admin.setAdminId(rs.getInt("adminid"));
                admin.setUsername(rs.getString("username"));
                admin.setEmail(rs.getString("email"));
                admin.setPhoneNumber(rs.getString("phonenumber"));
                admins.add(admin);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return admins;
    }


    public static boolean deleteAdmin(int adminId) {
        String sql = "DELETE FROM Admin WHERE adminId = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, adminId);

            System.out.println("Executing SQL: " + ps.toString());

            int rows = ps.executeUpdate();
            System.out.println("Rows deleted: " + rows);
            return rows > 0;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public boolean updateAdmin(int adminId, String username, String email, String phoneNumber) {
        try (Connection conn = DBConnection.getConnection()) {
            String sql = "UPDATE Admin SET username=?, email=?, phoneNumber=? WHERE adminId=?";
            PreparedStatement ps = conn.prepareStatement(sql);
            ps.setString(1, username);
            ps.setString(2, email);
            ps.setString(3, phoneNumber);
            ps.setInt(4, adminId);

            return ps.executeUpdate() > 0;
        } catch (SQLException e) {
            e.printStackTrace();
            return false;
        }
    }


    public boolean verifyPassword(String password, String hashedPassword, String salt) {
        return PasswordServices.verifyPassword(password, salt, hashedPassword);
    }


}