package rentalcompany.drivers.service;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import rentalcompany.drivers.controller.DriverDAO;
import rentalcompany.drivers.model.Driver;
import rentalcompany.drivers.model.Booking;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@WebServlet("/drivercalview")
public class DriverCalViewServlet extends HttpServlet {

    private Gson gson;

    @Override
    public void init() throws ServletException {
        gson = new GsonBuilder()
                .setDateFormat("yyyy-MM-dd")
                .create();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        Map<String, Object> jsonResponse = new HashMap<>();

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("driver") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            jsonResponse.put("success", false);
            jsonResponse.put("message", "Please login first");
            out.print(gson.toJson(jsonResponse));
            out.flush();
            return;
        }

        try {
            Driver sessionDriver = (Driver) session.getAttribute("driver");
            int driverId = sessionDriver.getDriverId();

            // Get driver information
            Driver driver = DriverDAO.getDriverById(driverId);

            // Get today's bookings for calendar view
            List<Booking> todayBookings = DriverDAO.getOngoingBookings(driverId);

            if (driver != null) {
                // Create clean driver data map
                Map<String, Object> driverData = new HashMap<>();
                driverData.put("driverId", driver.getDriverId());
                driverData.put("username", driver.getUsername());
                driverData.put("firstName", driver.getFirstName());
                driverData.put("lastName", driver.getLastName());
                driverData.put("fullName", driver.getFullName());
                driverData.put("email", driver.getEmail());
                driverData.put("mobileNumber", driver.getMobileNumber());
                driverData.put("description", driver.getDescription());
                driverData.put("nicNumber", driver.getNicNumber());
                driverData.put("companyId", driver.getCompanyId());
                driverData.put("companyName", driver.getCompanyName());
                driverData.put("homeAddress", driver.getHomeAddress());
                driverData.put("licenseNumber", driver.getLicenseNumber());
                driverData.put("assignedArea", driver.getAssignedArea());
                driverData.put("shiftTime", driver.getShiftTime());
                driverData.put("reportingManager", driver.getReportingManager());
                driverData.put("joinedDate", driver.getJoinedDate());
                driverData.put("profilePicture", driver.getProfilePicture());

                jsonResponse.put("success", true);
                jsonResponse.put("driver", driverData);
                jsonResponse.put("bookings", todayBookings);
                jsonResponse.put("message", "Data loaded successfully");
            } else {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                jsonResponse.put("success", false);
                jsonResponse.put("message", "Driver not found");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            jsonResponse.put("success", false);
            jsonResponse.put("message", "Server error: " + e.getMessage());
        }

        out.print(gson.toJson(jsonResponse));
        out.flush();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        Map<String, Object> jsonResponse = new HashMap<>();

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("driver") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            jsonResponse.put("success", false);
            jsonResponse.put("message", "Please login first");
            out.print(gson.toJson(jsonResponse));
            out.flush();
            return;
        }

        try {
            Driver sessionDriver = (Driver) session.getAttribute("driver");
            int driverId = sessionDriver.getDriverId();

            String action = request.getParameter("action");

            if ("updateAvailability".equals(action)) {
                String availability = request.getParameter("availability");

                boolean updated = DriverDAO.updateDriverAvailability(driverId, availability);

                jsonResponse.put("success", updated);
                jsonResponse.put("message",
                        updated ? "Availability updated successfully" : "Update failed");

            } else {
                jsonResponse.put("success", false);
                jsonResponse.put("message", "Invalid action");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            jsonResponse.put("success", false);
            jsonResponse.put("message", "Server error: " + e.getMessage());
        }

        out.print(gson.toJson(jsonResponse));
        out.flush();
    }
}