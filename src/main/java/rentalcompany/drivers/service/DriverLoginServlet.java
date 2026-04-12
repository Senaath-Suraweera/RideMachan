package rentalcompany.drivers.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import rentalcompany.drivers.controller.DriverDAO;
import rentalcompany.drivers.model.Driver;

import java.io.BufferedReader;
import java.io.IOException;

@WebServlet("/driver/login")
public class DriverLoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // ✅ Read raw JSON from request
            BufferedReader reader = request.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);

            JsonObject json = JsonParser.parseString(sb.toString()).getAsJsonObject();
            String email = json.get("email").getAsString();
            String password = json.get("password").getAsString();

            if (email == null || password == null) {
                System.out.println("hi");
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Missing credentials\"}");
                return;
            }

            Driver driver = DriverDAO.loginDriver(email, password);

            if (driver != null) {
                HttpSession session = request.getSession();
                session.setAttribute("driverId", driver.getDriverId());
                session.setAttribute("actorType", "DRIVER");
                session.setAttribute("driver", driver);
                System.out.println("Logged in as Driver with Id: " + session.getAttribute("driverId"));
                response.getWriter().write("{\"status\":\"success\",\"message\":\"Login successful\"}");
            } else {
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid username or password\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}