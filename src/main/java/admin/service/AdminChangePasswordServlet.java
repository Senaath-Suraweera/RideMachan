package admin.service;

import admin.controller.AdminController;
import admin.model.Admin;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet("/admin/change-password")
public class AdminChangePasswordServlet extends HttpServlet {

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        addCors(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            String email, currentPassword, newPassword;

            String ct = request.getContentType();
            if (ct != null && ct.toLowerCase().startsWith("application/json")) {
                try (var reader = request.getReader()) {
                    JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
                    email           = json.has("email")           ? json.get("email").getAsString()           : null;
                    currentPassword = json.has("currentPassword") ? json.get("currentPassword").getAsString() : null;
                    newPassword     = json.has("newPassword")     ? json.get("newPassword").getAsString()     : null;
                }
            } else {
                email           = request.getParameter("email");
                currentPassword = request.getParameter("currentPassword");
                newPassword     = request.getParameter("newPassword");
            }

            // ── Validation ──────────────────────────────────────────
            if (isBlank(email) || isBlank(currentPassword) || isBlank(newPassword)) {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "email, currentPassword, and newPassword are required");
                return;
            }

            if (newPassword.trim().length() < 8) {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "New password must be at least 8 characters");
                return;
            }

            if (currentPassword.equals(newPassword)) {
                sendError(response, HttpServletResponse.SC_BAD_REQUEST,
                        "New password must be different from current password");
                return;
            }

            // ── Fetch admin & verify current password ───────────────
            AdminController controller = new AdminController();
            Admin admin = controller.getAdminByEmail(email.trim());

            if (admin == null) {
                sendError(response, HttpServletResponse.SC_NOT_FOUND, "Admin not found");
                return;
            }

            if (!controller.verifyPassword(currentPassword, admin.getHashedPassword(), admin.getSalt())) {
                sendError(response, HttpServletResponse.SC_UNAUTHORIZED, "Current password is incorrect");
                return;
            }

            // ── Update password ─────────────────────────────────────
            boolean updated = AdminController.updatePassword(admin.getAdminId(), newPassword.trim());

            if (updated) {
                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().write("{\"status\":\"success\",\"message\":\"Password changed successfully\"}");
            } else {
                sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR,
                        "Failed to update password");
            }

        } catch (Exception e) {
            e.printStackTrace();
            sendError(response, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, e.getMessage());
        }
    }

    private boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }

    private void sendError(HttpServletResponse resp, int status, String message) throws IOException {
        resp.setStatus(status);
        resp.getWriter().write("{\"status\":\"error\",\"message\":\"" + message.replace("\"", "'") + "\"}");
    }
}