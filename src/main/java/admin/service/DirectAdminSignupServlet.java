package admin.service;

import admin.controller.AdminController;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet("/admin/direct-signup")
public class DirectAdminSignupServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        System.out.println("DirectAdminSignupServlet");

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");

        String ct = request.getContentType();
        String username = null;
        String email = null;
        String password = null;
        String phoneNumber = null;

        try {
            if (ct != null && ct.toLowerCase().startsWith("application/json")) {
                try (var reader = request.getReader()) {
                    JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
                    username = json.has("username") ? json.get("username").getAsString().trim() : null;
                    email = json.has("email") ? json.get("email").getAsString().trim() : null;
                    password = json.has("password") ? json.get("password").getAsString() : null;
                    phoneNumber = json.has("phoneNumber") ? json.get("phoneNumber").getAsString().trim() : null;
                }
            } else {
                username = request.getParameter("username");
                email = request.getParameter("email");
                password = request.getParameter("password");
                phoneNumber = request.getParameter("phoneNumber");

                if (username != null) username = username.trim();
                if (email != null) email = email.trim();
                if (phoneNumber != null) phoneNumber = phoneNumber.trim();
            }

            if (username == null || username.isEmpty() ||
                    email == null || email.isEmpty() ||
                    password == null || password.trim().isEmpty() ||
                    phoneNumber == null || phoneNumber.isEmpty()) {

                response.getWriter().write("""
                    {"status":"error","message":"All fields are required"}
                """);
                return;
            }

            boolean inserted = AdminController.insertData(username, email, password, phoneNumber);

            if (inserted) {
                // Mark as verified immediately since OTP is removed
                AdminController.setVerified(email);

                response.getWriter().write("""
                    {"status":"success","message":"Admin registered successfully"}
                """);

                System.out.printf(
                        "Admin inserted successfully.%n\tEmail: %s%n\tUsername: %s%n\tPhone Number: %s%n",
                        email, username, phoneNumber
                );
            } else {
                response.getWriter().write("""
                    {"status":"error","message":"Failed to insert admin data"}
                """);
                System.out.println("Admin insertion failed.");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("""
                {"status":"error","message":"Server error while registering admin"}
            """);
        }
    }
}