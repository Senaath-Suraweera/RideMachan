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

    private Integer getDriverIdFromSession(HttpSession session) {
        if (session == null) return null;

        Object driverObj = session.getAttribute("driver");
        if (driverObj instanceof Driver) {
            return ((Driver) driverObj).getDriverId();
        }

        Object driverIdObj = session.getAttribute("driverId");
        if (driverIdObj instanceof Integer) return (Integer) driverIdObj;

        if (driverIdObj instanceof String) {
            try { return Integer.parseInt((String) driverIdObj); }
            catch (NumberFormatException ignored) {}
        }

        return null;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        Integer driverId = getDriverIdFromSession(session);

        if (driverId == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("status", "error");
            errorResponse.addProperty("message", "Not authenticated");
            response.getWriter().write(gson.toJson(errorResponse));
            return;
        }

        try {
            Driver fullProfile = DriverDAO.getDriverProfile(driverId);

            if (fullProfile != null) {
                // IMPORTANT: set both for compatibility with other servlets
                session.setAttribute("driver", fullProfile);
                session.setAttribute("driverId", fullProfile.getDriverId());

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

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        Integer driverId = getDriverIdFromSession(session);

        if (driverId == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            JsonObject errorResponse = new JsonObject();
            errorResponse.addProperty("status", "error");
            errorResponse.addProperty("message", "Not authenticated");
            response.getWriter().write(gson.toJson(errorResponse));
            return;
        }

        try {
            // Always load existing profile (needed for NIC + safe update)
            Driver existing = DriverDAO.getDriverProfile(driverId);
            if (existing == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                JsonObject errorResponse = new JsonObject();
                errorResponse.addProperty("status", "error");
                errorResponse.addProperty("message", "Profile not found");
                response.getWriter().write(gson.toJson(errorResponse));
                return;
            }

            // Read JSON body
            BufferedReader reader = request.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);

            if (sb.toString().trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                JsonObject errorResponse = new JsonObject();
                errorResponse.addProperty("status", "error");
                errorResponse.addProperty("message", "Empty request body");
                response.getWriter().write(gson.toJson(errorResponse));
                return;
            }

            JsonObject json = JsonParser.parseString(sb.toString()).getAsJsonObject();

            // Create updated driver object
            Driver updatedDriver = new Driver();
            updatedDriver.setDriverId(driverId);

            // Editable fields only
            if (json.has("firstname")) updatedDriver.setFirstName(json.get("firstname").getAsString().trim());
            if (json.has("lastname")) updatedDriver.setLastName(json.get("lastname").getAsString().trim());
            if (json.has("email")) updatedDriver.setEmail(json.get("email").getAsString().trim());
            if (json.has("mobilenumber")) updatedDriver.setMobileNumber(json.get("mobilenumber").getAsString().trim());
            if (json.has("homeaddress")) updatedDriver.setHomeAddress(json.get("homeaddress").getAsString().trim());
            if (json.has("licensenumber")) updatedDriver.setLicenseNumber(json.get("licensenumber").getAsString().trim());
            if (json.has("profilepicture")) updatedDriver.setProfilePicture(json.get("profilepicture").getAsString());

            // SECURITY: do NOT allow NIC update from client
            updatedDriver.setNicNumber(existing.getNicNumber());

            // Validate required fields
            if (updatedDriver.getFirstName() == null || updatedDriver.getFirstName().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                writeError(response, "First name is required");
                return;
            }
            if (updatedDriver.getLastName() == null || updatedDriver.getLastName().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                writeError(response, "Last name is required");
                return;
            }
            if (updatedDriver.getEmail() == null || updatedDriver.getEmail().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                writeError(response, "Email is required");
                return;
            }
            if (!isValidEmail(updatedDriver.getEmail())) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                writeError(response, "Invalid email format");
                return;
            }

            boolean success = DriverDAO.updateDriverProfile(updatedDriver);

            if (success) {
                Driver refreshedDriver = DriverDAO.getDriverProfile(driverId);
                session.setAttribute("driver", refreshedDriver);
                session.setAttribute("driverId", refreshedDriver.getDriverId());

                JsonObject successResponse = new JsonObject();
                successResponse.addProperty("status", "success");
                successResponse.addProperty("message", "Profile updated successfully");
                response.getWriter().write(gson.toJson(successResponse));
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                writeError(response, "Failed to update profile");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            writeError(response, "Server error: " + e.getMessage());
        }
    }

    private void writeError(HttpServletResponse response, String msg) throws IOException {
        JsonObject errorResponse = new JsonObject();
        errorResponse.addProperty("status", "error");
        errorResponse.addProperty("message", msg);
        response.getWriter().write(gson.toJson(errorResponse));
    }

    private boolean isValidEmail(String email) {
        String emailRegex = "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$";
        return email != null && email.matches(emailRegex);
    }
}