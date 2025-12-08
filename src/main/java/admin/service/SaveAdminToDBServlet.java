package admin.service;

import admin.controller.AdminController;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/admin/save")
public class SaveAdminToDBServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        System.out.println("SaveAdminToDBServlet");

        HttpSession httpSession = request.getSession();

        // Check if verified (it's a Boolean, not String)
        Boolean verified = (Boolean) httpSession.getAttribute("verified");

        if (verified == null || !verified) {
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Email not verified\"}");
            System.out.println("Email not verified");
            return;
        }

        String email = (String) httpSession.getAttribute("email");
        String password = (String) httpSession.getAttribute("password");
        String username = (String) httpSession.getAttribute("username");
        String phoneNumber = (String) httpSession.getAttribute("phoneNumber");

        boolean isTrue = AdminController.insertData(username, email, password, phoneNumber);

        if (isTrue) {
            // Set verified in database
            AdminController.setVerified(email);

            // Clear sensitive data from session
            httpSession.removeAttribute("password");

            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"success\"}");
            System.out.printf("Data inserted successfully.\n\tEmail: %s \n\tUsername: %s\n\tPhone Number: %s\n",
                    email, username, phoneNumber);
        } else {
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Failed to insert data\"}");
            System.out.println("Data insertion failed.");
        }
    }
}