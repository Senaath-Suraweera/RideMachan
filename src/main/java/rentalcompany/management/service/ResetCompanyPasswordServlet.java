package rentalcompany.management.service;

import common.util.DBConnection;
import common.util.PasswordServices;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;

@WebServlet("/admin/reset-company-password")
public class ResetCompanyPasswordServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);

        String companyIdParam = request.getParameter("companyid");
        String newPassword = request.getParameter("newPassword");

        if (companyIdParam == null || newPassword == null || newPassword.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"status\":\"error\",\"message\":\"companyid and newPassword are required\"}");
            return;
        }

        try {
            int companyId = Integer.parseInt(companyIdParam);

            String salt = PasswordServices.generateSalt();
            String hashedPassword = PasswordServices.hashPassword(newPassword, salt);

            String sql = "UPDATE RentalCompany SET hashedpassword = ?, salt = ? WHERE companyid = ?";

            try (Connection conn = DBConnection.getConnection();
                 PreparedStatement stmt = conn.prepareStatement(sql)) {

                stmt.setString(1, hashedPassword);
                stmt.setString(2, salt);
                stmt.setInt(3, companyId);

                int rowsUpdated = stmt.executeUpdate();

                if (rowsUpdated > 0) {
                    out.write("{\"status\":\"success\",\"message\":\"Password reset successfully\"}");
                } else {
                    response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.write("{\"status\":\"error\",\"message\":\"Company not found\"}");
                }
            }

        } catch (NumberFormatException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"status\":\"error\",\"message\":\"Invalid companyid\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"status\":\"error\",\"message\":\"Server error while resetting password\"}");
        }
    }
}