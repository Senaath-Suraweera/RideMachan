package customer.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import common.util.DBConnection;
import common.util.PasswordServices;
import common.util.Util;
import customer.controller.CustomerDAO;
import customer.model.Customer;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;

@WebServlet("/customer/changePassword")
public class CustomerChangePasswordServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        req.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("email") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\"status\":\"error\",\"message\":\"Not logged in\"}");
            return;
        }

        String email = (String) session.getAttribute("email");

        // Parse JSON body
        String action, currentPassword, newPassword, code;
        try {
            JsonObject json = JsonParser.parseReader(req.getReader()).getAsJsonObject();
            action          = json.has("action")          ? json.get("action").getAsString()          : "";
            currentPassword = json.has("currentPassword") ? json.get("currentPassword").getAsString() : "";
            newPassword     = json.has("newPassword")     ? json.get("newPassword").getAsString()     : "";
            code            = json.has("code")            ? json.get("code").getAsString()            : "";
        } catch (Exception e) {
            out.write("{\"status\":\"error\",\"message\":\"Invalid request\"}");
            return;
        }

        try (Connection conn = DBConnection.getConnection()) {
            CustomerDAO dao = new CustomerDAO(conn);
            Customer customer = dao.getCustomerByEmail(email);

            if (customer == null) {
                out.write("{\"status\":\"error\",\"message\":\"User not found\"}");
                return;
            }

            // ---------- STEP 1: verify current password ----------
            if ("verifyCurrent".equals(action)) {
                if (currentPassword == null || currentPassword.isEmpty()) {
                    out.write("{\"status\":\"error\",\"message\":\"Enter current password\"}");
                    return;
                }
                boolean ok = PasswordServices.verifyPassword(
                        currentPassword, customer.getSalt(), customer.getHashedPassword());
                if (!ok) {
                    out.write("{\"status\":\"error\",\"message\":\"Current password is incorrect\"}");
                    return;
                }
                out.write("{\"status\":\"success\",\"message\":\"Current password verified\"}");
                return;
            }

            // ---------- STEP 2: update with OTP ----------
            if ("updatePassword".equals(action)) {
                // Re-verify current password (defense in depth)
                if (!PasswordServices.verifyPassword(
                        currentPassword, customer.getSalt(), customer.getHashedPassword())) {
                    out.write("{\"status\":\"error\",\"message\":\"Current password is incorrect\"}");
                    return;
                }

                // Verify OTP
                String expected = Util.getCode(email);
                if (expected == null) {
                    out.write("{\"status\":\"error\",\"message\":\"OTP expired. Please request a new one.\"}");
                    return;
                }
                if (!expected.equals(code)) {
                    out.write("{\"status\":\"error\",\"message\":\"Incorrect OTP\"}");
                    return;
                }

                // Validate new password
                if (newPassword == null || newPassword.length() < 8) {
                    out.write("{\"status\":\"error\",\"message\":\"New password must be at least 8 characters\"}");
                    return;
                }
                if (newPassword.equals(currentPassword)) {
                    out.write("{\"status\":\"error\",\"message\":\"New password must differ from current\"}");
                    return;
                }

                // Hash + update
                String newSalt = PasswordServices.generateSalt();
                String newHash = PasswordServices.hashPassword(newPassword, newSalt);

                String sql = "UPDATE Customer SET hashedpassword=?, salt=? WHERE email=?";
                try (PreparedStatement ps = conn.prepareStatement(sql)) {
                    ps.setString(1, newHash);
                    ps.setString(2, newSalt);
                    ps.setString(3, email);
                    int rows = ps.executeUpdate();
                    if (rows > 0) {
                        Util.clearCode(email);
                        out.write("{\"status\":\"success\",\"message\":\"Password updated successfully\"}");
                    } else {
                        out.write("{\"status\":\"error\",\"message\":\"Update failed\"}");
                    }
                }
                return;
            }

            out.write("{\"status\":\"error\",\"message\":\"Unknown action\"}");

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"status\":\"error\",\"message\":\"Server error\"}");
        }
    }
}