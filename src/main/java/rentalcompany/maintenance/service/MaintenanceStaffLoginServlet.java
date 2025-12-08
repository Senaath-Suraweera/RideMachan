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

@WebServlet(name = "MaintenanceStaffLoginServlet", urlPatterns = {"/maintenance/login"})
public class MaintenanceStaffLoginServlet extends HttpServlet {

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

            JsonObject json = JsonParser.parseString(sb.toString()).getAsJsonObject();
            String email = json.get("email").getAsString();
            String password = json.get("password").getAsString();

            MaintenanceStaffDAO dao = new MaintenanceStaffDAO();
            MaintenanceStaff staff = dao.getStaffByEmail(email);

            if (staff != null && PasswordServices.verifyPassword(password, staff.getSalt(), staff.getHashedPassword())) {
                HttpSession session = request.getSession();
                session.setAttribute("staff", staff);
                response.getWriter().write("{\"status\":\"success\",\"message\":\"Login successful\"}");
            } else {
                response.setStatus(401);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid email or password\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}
