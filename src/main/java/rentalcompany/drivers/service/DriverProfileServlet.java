package rentalcompany.drivers.service;

import com.google.gson.Gson;
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

@WebServlet("/driver/profile")
public class DriverProfileServlet extends HttpServlet {

    private final Gson gson = new Gson();

    // Load the profile data and return as JSON
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        // Check if user is logged in
        if (session == null || session.getAttribute("driver") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("status", "error");
            errorResponse.addProperty("message", "Not authenticated");
            response.getWriter().write(gson.toJson(errorResponse));
            return;
        }

        try {
            Driver sessionDriver = (Driver) session.getAttribute("driver");
            int driverId = sessionDriver.getDriverId();

            // Fetch complete profile from database
            Driver fullProfile = DriverDAO.getDriverProfile(driverId);

            if (fullProfile != null) {
                // Update session with complete profile data
                session.setAttribute("driver", fullProfile);

                // Return profile as JSON
                response.setStatus(HttpServletResponse.SC_OK);
                response.getWriter().write(gson.toJson(fullProfile));
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                JsonObject errorResponse = new JsonObject();
                errorResponse.addProperty("status", "error");
                errorResponse.addProperty("message", "Profile not found");
                response.getWriter().write(gson.toJson(errorResponse));
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("status", "error");
            errorResponse.addProperty("message", "Server error: " + e.getMessage());
            response.getWriter().write(gson.toJson(errorResponse));
        }
    }

    // Handle profile update
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        // Check authentication
        if (session == null || session.getAttribute("driver") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("status", "error");
            errorResponse.addProperty("message", "Not authenticated");
            response.getWriter().write(gson.toJson(errorResponse));
            return;
        }

        try {
            // Read JSON from request
            BufferedReader reader = request.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }

            JsonObject json = JsonParser.parseString(sb.toString()).getAsJsonObject();

            // Get current driver from session
            Driver currentDriver = (Driver) session.getAttribute("driver");
            int driverId = currentDriver.getDriverId();

            // Create updated driver object
            Driver updatedDriver = new Driver();
            updatedDriver.setDriverId(driverId);

            // Extract fields from JSON (only editable fields)
            if (json.has("firstname")) {
                updatedDriver.setFirstName(json.get("firstname").getAsString().trim());
            }
            if (json.has("lastname")) {
                updatedDriver.setLastName(json.get("lastname").getAsString().trim());
            }
            if (json.has("email")) {
                updatedDriver.setEmail(json.get("email").getAsString().trim());
            }
            if (json.has("mobilenumber")) {
                updatedDriver.setMobileNumber(json.get("mobilenumber").getAsString().trim());
            }
            if (json.has("homeaddress")) {
                updatedDriver.setHomeAddress(json.get("homeaddress").getAsString().trim());
            }
            if (json.has("licensenumber")) {
                updatedDriver.setDriverLicenceNumber(json.get("licensenumber").getAsString().trim());
            }
            if (json.has("nicnumber")) {
                updatedDriver.setNicNumber(json.get("nicnumber").getAsString().trim());
            }
            if (json.has("profilepicture")) {
                updatedDriver.setProfilePicture(json.get("profilepicture").getAsString());
            }

            // Validate required fields
            if (updatedDriver.getFirstName() == null || updatedDriver.getFirstName().isEmpty()) {
                JsonObject errorResponse = new JsonObject();
                errorResponse.addProperty("status", "error");
                errorResponse.addProperty("message", "First name is required");
                response.getWriter().write(gson.toJson(errorResponse));
                return;
            }
            if (updatedDriver.getLastName() == null || updatedDriver.getLastName().isEmpty()) {
                JsonObject errorResponse = new JsonObject();
                errorResponse.addProperty("status", "error");
                errorResponse.addProperty("message", "Last name is required");
                response.getWriter().write(gson.toJson(errorResponse));
                return;
            }
            if (updatedDriver.getEmail() == null || updatedDriver.getEmail().isEmpty()) {
                JsonObject errorResponse = new JsonObject();
                errorResponse.addProperty("status", "error");
                errorResponse.addProperty("message", "Email is required");
                response.getWriter().write(gson.toJson(errorResponse));
                return;
            }
            if (updatedDriver.getNicNumber() == null || updatedDriver.getNicNumber().isEmpty()) {
                JsonObject errorResponse = new JsonObject();
                errorResponse.addProperty("status", "error");
                errorResponse.addProperty("message", "NIC Number is required");
                response.getWriter().write(gson.toJson(errorResponse));
                return;
            }

            // Email validation
            if (!isValidEmail(updatedDriver.getEmail())) {
                JsonObject errorResponse = new JsonObject();
                errorResponse.addProperty("status", "error");
                errorResponse.addProperty("message", "Invalid email format");
                response.getWriter().write(gson.toJson(errorResponse));
                return;
            }

            // Update database
            boolean success = DriverDAO.updateDriverProfile(updatedDriver);

            if (success) {
                // Refresh session with updated data
                Driver refreshedDriver = DriverDAO.getDriverProfile(driverId);
                session.setAttribute("driver", refreshedDriver);

                JsonObject successResponse = new JsonObject();
                successResponse.addProperty("status", "success");
                successResponse.addProperty("message", "Profile updated successfully");
                response.getWriter().write(gson.toJson(successResponse));
            } else {
                JsonObject errorResponse = new JsonObject();
                errorResponse.addProperty("status", "error");
                errorResponse.addProperty("message", "Failed to update profile");
                response.getWriter().write(gson.toJson(errorResponse));
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("status", "error");
            errorResponse.addProperty("message", "Server error: " + e.getMessage());
            response.getWriter().write(gson.toJson(errorResponse));
        }
    }

    // Email validation helper method
    private boolean isValidEmail(String email) {
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        return email.matches(emailRegex);
    }
}