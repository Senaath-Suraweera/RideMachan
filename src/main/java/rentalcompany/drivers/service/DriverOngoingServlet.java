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

@WebServlet("/ongoing")
public class DriverOngoingServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();

        String value = "not null";
        HttpSession session = request.getSession();
        if (session == null || session.getAttribute("driverId") == null) {
            if(session == null) {
                value = "null";
            }
            System.out.println("session is "+ value + "\tDriver Id: " + session.getAttribute("driverId"));
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"success\":false,\"message\":\"Not authenticated\"}");
            return;
        }

        int driverId = (Integer) session.getAttribute("driverId");

        try {
            List<Booking> bookings = DriverDAO.getOngoingBookings(driverId);

            StringBuilder json = new StringBuilder();
            json.append("{\"success\":true,\"bookings\":[");

            for (int i = 0; i < bookings.size(); i++) {
                Booking b = bookings.get(i);

                json.append("{")
                        .append("\"rideId\":\"").append(escape(b.getRideId())).append("\",")
                        .append("\"customerName\":\"").append(escape(b.getCustomerName())).append("\",")
                        .append("\"pickupLocation\":\"").append(escape(b.getPickupLocation())).append("\",")
                        .append("\"dropoffLocation\":\"").append(escape(b.getDropoffLocation())).append("\",")
                        .append("\"bookingDate\":\"").append(b.getBookingDate()).append("\",")
                        .append("\"bookingTime\":\"").append(b.getBookingTime()).append("\",")
                        .append("\"status\":\"").append(escape(b.getStatus())).append("\",")

                        // add these (real values if you have them; otherwise defaults)
                        .append("\"totalAmount\":").append(b.getTotalAmount()).append(",")
                        .append("\"estimatedDuration\":").append(b.getEstimatedDuration()).append(",")
                        .append("\"distance\":").append(b.getDistance()).append(",")
                        .append("\"vehicleModel\":\"").append(escape(b.getVehicleModel())).append("\",")
                        .append("\"vehiclePlate\":\"").append(escape(b.getVehiclePlate())).append("\"")
                        .append("}");

                if (i < bookings.size() - 1) {
                    json.append(",");
                }
            }

            json.append("]}");
            out.print(json.toString());

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\":false,\"message\":\"Server error\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("driverId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"success\":false,\"message\":\"Not authenticated\"}");
            return;
        }

        int driverId = (Integer) session.getAttribute("driverId");
        String rideId = request.getParameter("rideId");
        String status = request.getParameter("status");

        if (rideId == null || status == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"success\":false,\"message\":\"Missing parameters\"}");
            return;
        }

        try {
            boolean updated = DriverDAO.updateBookingStatus(rideId, status, driverId);

            if (updated) {
                out.print("{\"success\":true,\"message\":\"Status updated\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\":false,\"message\":\"Update failed\"}");
            }

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\":false,\"message\":\"Server error\"}");
        }
    }

    private String escape(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
