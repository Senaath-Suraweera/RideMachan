package rentalcompany.drivers.service;

import rentalcompany.drivers.controller.DriverDAO;
import rentalcompany.drivers.model.Booking;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

@WebServlet("/driver/pastbookings")
public class DriverPastBookingsServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("driverId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"error\":\"Not authenticated\"}");
            return;
        }

        int driverId = (Integer) session.getAttribute("driverId");

        String dateRange = request.getParameter("dateRange");
        String status = request.getParameter("status");
        String searchQuery = request.getParameter("search");

        try {
            List<Booking> bookings =
                    DriverDAO.getPastBookings(driverId, dateRange, status, searchQuery);

            Map<String, Integer> stats =
                    DriverDAO.getPastBookingsStats(driverId);

            StringBuilder json = new StringBuilder();
            json.append("{");
            json.append("\"success\":true,");

            json.append("\"stats\":{");
            json.append("\"totalCompleted\":").append(stats.getOrDefault("completed", 0)).append(",");
            json.append("\"totalCancelled\":").append(stats.getOrDefault("cancelled", 0)).append(",");
            json.append("\"totalRevenue\":").append(stats.getOrDefault("revenue", 0)).append(",");
            json.append("\"avgRating\":").append(stats.getOrDefault("avgRating", 0));
            json.append("},");

            json.append("\"bookings\":[");

            for (int i = 0; i < bookings.size(); i++) {
                Booking b = bookings.get(i);

                json.append("{");
                json.append("\"bookingId\":").append(b.getBookingId()).append(",");
                json.append("\"rideId\":\"").append(escapeJson(b.getRideId())).append("\",");
                json.append("\"customerName\":\"").append(escapeJson(b.getCustomerName())).append("\",");
                json.append("\"customerPhone\":\"").append(escapeJson(b.getCustomerPhone())).append("\",");
                json.append("\"customerEmail\":\"").append(escapeJson(b.getCustomerEmail())).append("\",");

                json.append("\"bookingDate\":\"").append(b.getBookingDate()).append("\",");
                json.append("\"startTime\":\"").append(b.getFormattedTime()).append("\",");

                json.append("\"pickupLocation\":\"").append(escapeJson(b.getPickupLocation())).append("\",");
                json.append("\"dropoffLocation\":\"").append(escapeJson(b.getDropoffLocation())).append("\",");

                json.append("\"status\":\"").append(escapeJson(b.getStatus())).append("\",");
                json.append("\"totalAmount\":").append(b.getTotalAmount()).append(",");
                json.append("\"distance\":").append(b.getDistance()).append(",");
                json.append("\"estimatedDuration\":").append(b.getEstimatedDuration()).append(",");
                json.append("\"vehicleModel\":\"").append(escapeJson(b.getVehicleModel())).append("\",");
                json.append("\"vehiclePlate\":\"").append(escapeJson(b.getVehiclePlate())).append("\",");

                String instructions =
                        b.getSpecialInstructions() != null ? b.getSpecialInstructions() : "";

                json.append("\"specialInstructions\":\"")
                        .append(escapeJson(instructions)).append("\"");

                json.append("}");

                if (i < bookings.size() - 1) {
                    json.append(",");
                }
            }

            json.append("]");
            json.append("}");

            out.print(json.toString());

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"Failed to fetch bookings\",\"message\":\""
                    + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private String escapeJson(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
