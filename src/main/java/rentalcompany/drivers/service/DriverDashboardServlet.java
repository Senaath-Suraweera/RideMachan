package rentalcompany.drivers.service;

import com.google.gson.Gson;
import rentalcompany.drivers.controller.DriverDAO;
import rentalcompany.drivers.model.Driver;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/driver/dashboard")
public class DriverDashboardServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        PrintWriter out = resp.getWriter();
        Gson gson = new Gson();

        // Check authentication
        HttpSession session = req.getSession();
        if (session == null || session.getAttribute("driver") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print(gson.toJson(Map.of("error", "Not authenticated")));
            return;
        }

        Driver sessionDriver = (Driver) session.getAttribute("driver");
        int driverId = sessionDriver.getDriverId();
        System.out.println("Driver Id: " + driverId);

        try {
            Driver driver = DriverDAO.getDriverProfile(driverId);

            if (driver == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.print(gson.toJson(Map.of("error", "Driver not found")));
                return;
            }

            Map<String, Object> dashboardData = new HashMap<>();

            // Driver Information
            Map<String, String> driverInfo = new HashMap<>();
            driverInfo.put("firstName", driver.getFirstName());
            driverInfo.put("lastName", driver.getLastName());
            driverInfo.put("fullName", driver.getFullName());
            driverInfo.put("email", driver.getEmail());
            driverInfo.put("mobile", driver.getMobileNumber());
            driverInfo.put("companyName", driver.getCompanyName());

            dashboardData.put("driver", driverInfo);

            // Statistics
            Map<String, Object> stats = new HashMap<>();
            stats.put("monthlyIncome", DriverDAO.getMonthlyIncome(driverId));
            stats.put("weeklyBookings", DriverDAO.getWeeklyBookings(driverId));
            stats.put("dailyHours", DriverDAO.getDailyHours(driverId));

            dashboardData.put("stats", stats);

            // Chart Data and Summaries
            dashboardData.put("bookingSummary", DriverDAO.getBookingSummary(driverId));
            dashboardData.put("monthlyIncomeChart", DriverDAO.getMonthlyIncomeChart(driverId));
            dashboardData.put("weeklyBookingsChart", DriverDAO.getWeeklyBookingsChart(driverId));
            dashboardData.put("dailyHoursChart", DriverDAO.getDailyHoursChart(driverId));

            // Notification and Message Counts
            //dashboardData.put("notificationCount", DriverDAO.getNotificationCount(driverId));
            //dashboardData.put("messageCount", DriverDAO.getMessageCount(driverId));

            out.print(gson.toJson(dashboardData));

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print(gson.toJson(Map.of("error", "Server error")));
        }
    }
}