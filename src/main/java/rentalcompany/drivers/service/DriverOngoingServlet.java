package rentalcompany.drivers.service;

import rentalcompany.drivers.controller.DriverDAO;
import rentalcompany.management.model.RentalCompanyBookings;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet("/driver/ongoing")
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
            List<RentalCompanyBookings> bookings = DriverDAO.getOngoingBookings(driverId);

            StringBuilder json = new StringBuilder();
            json.append("{\"success\":true,\"bookings\":[");

            for (int i = 0; i < bookings.size(); i++) {
                RentalCompanyBookings b = bookings.get(i);

                json.append("{")
                        .append("\"rideId\":\"").append(escape(b.getRideId())).append("\",")

                        .append("\"customerName\":\"").append(escape(b.getCustomerName())).append("\",")
                        .append("\"customerPhone\":\"").append(escape(b.getCustomerPhoneNumber())).append("\",")
                        .append("\"customerEmail\":\"").append(escape(b.getCustomerEmail())).append("\",")

                        // FRONTEND EXPECTED NAMES
                        .append("\"pickup\":\"").append(escape(b.getPickupLocation())).append("\",")
                        .append("\"dropOff\":\"").append(escape(b.getDropLocation())).append("\",")

                        .append("\"startdate\":\"").append(b.getTripStartDate().toString()).append("\",")
                        .append("\"time\":\"").append(b.getStartTimeStr()).append("\",")

                        // VEHICLE INFO
                        .append("\"vehicleModel\":\"").append(escape(b.getVehicleModel())).append("\",")
                        .append("\"vehiclePlate\":\"").append(escape(b.getNumberPlate())).append("\",")

                        // TRIP INFO
                        .append("\"estimatedDuration\":").append(b.getEstimatedDuration()).append(",")
                        .append("\"distance\":").append(b.getDistance()).append(",")
                        .append("\"totalAmount\":").append(b.getTotalAmount()).append(",")

                        // STATUS
                        .append("\"status\":\"").append(escape(b.getStatus())).append("\"")

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
