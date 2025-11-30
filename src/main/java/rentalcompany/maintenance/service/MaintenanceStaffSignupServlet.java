package rentalcompany.maintenance.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import common.util.PasswordServices;
import jakarta.servlet.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.maintenance.controller.MaintenanceStaffDAO;
import rentalcompany.maintenance.model.MaintenanceStaff;

import java.io.*;

@WebServlet(name = "MaintenanceStaffSignupServlet", urlPatterns = {"/maintenancestaff/signup"})
public class MaintenanceStaffSignupServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            BufferedReader reader = request.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);

            System.out.println("[DEBUG] Incoming JSON body: " + sb);

            if (sb.length() == 0) {
                response.setStatus(400);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Empty request body\"}");
                return;
            }

            JsonObject json = JsonParser.parseString(sb.toString()).getAsJsonObject();

            String username = json.get("username").getAsString();
            String firstname = json.get("firstname").getAsString();
            String lastname = json.get("lastname").getAsString();
            String email = json.get("email").getAsString();
            String password = json.get("password").getAsString();
            String contactNumber = json.get("contactNumber").getAsString();
            int companyId = json.get("companyId").getAsInt();

            String salt = PasswordServices.generateSalt();
            String hashed = PasswordServices.hashPassword(password, salt);

            MaintenanceStaff staff = new MaintenanceStaff(username, firstname, lastname, email,
                    hashed, salt, contactNumber, companyId);

            MaintenanceStaffDAO dao = new MaintenanceStaffDAO();
            boolean added = dao.addStaff(staff);

            if (added) {
                response.getWriter().write("{\"status\":\"success\",\"message\":\"Staff registered successfully\"}");
            } else {
                response.setStatus(500);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Failed to add staff\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}