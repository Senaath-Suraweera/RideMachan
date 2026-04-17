package rentalcompany.maintenance.service;

import common.util.DBConnection;
import common.util.PasswordServices;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@WebServlet("/change/maintenance/password")
public class MaintenanceChangePasswordServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("staff_id") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{ \"success\": false, \"message\": \"Not logged in\" }");
            return;
        }

        int staffId = (int) session.getAttribute("staff_id");

        String currentPassword = request.getParameter("currentPassword");
        String newPassword = request.getParameter("newPassword");

        // ---- Validation ----
        if (currentPassword == null || currentPassword.trim().isEmpty()) {
            out.write("{ \"success\": false, \"message\": \"Current password is required\" }");
            return;
        }

        if (newPassword == null || newPassword.length() < 6) {
            out.write("{ \"success\": false, \"message\": \"New password must be at least 6 characters\" }");
            return;
        }

        if (currentPassword.equals(newPassword)) {
            out.write("{ \"success\": false, \"message\": \"New password must be different from current password\" }");
            return;
        }

        // ---- Fetch current hash/salt ----
        String selectSql = "SELECT hashedpassword, salt FROM maintenancestaff WHERE maintenanceid = ?";
        String updateSql = "UPDATE maintenancestaff SET hashedpassword = ?, salt = ? WHERE maintenanceid = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement psSelect = conn.prepareStatement(selectSql)) {

            psSelect.setInt(1, staffId);

            String existingHash;
            String existingSalt;

            try (ResultSet rs = psSelect.executeQuery()) {
                if (!rs.next()) {
                    out.write("{ \"success\": false, \"message\": \"Staff account not found\" }");
                    return;
                }
                existingHash = rs.getString("hashedpassword");
                existingSalt = rs.getString("salt");
            }

            // ---- Verify current password ----
            if (!PasswordServices.verifyPassword(currentPassword, existingSalt, existingHash)) {
                out.write("{ \"success\": false, \"message\": \"Current password is incorrect\" }");
                return;
            }

            // ---- Hash new password with a brand new salt ----
            String newSalt = PasswordServices.generateSalt();
            String newHash = PasswordServices.hashPassword(newPassword, newSalt);

            try (PreparedStatement psUpdate = conn.prepareStatement(updateSql)) {
                psUpdate.setString(1, newHash);
                psUpdate.setString(2, newSalt);
                psUpdate.setInt(3, staffId);

                int rows = psUpdate.executeUpdate();

                if (rows > 0) {
                    out.write("{ \"success\": true, \"message\": \"Password updated successfully\" }");
                } else {
                    out.write("{ \"success\": false, \"message\": \"Failed to update password\" }");
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{ \"success\": false, \"message\": \"Server error\" }");
        }
    }
}