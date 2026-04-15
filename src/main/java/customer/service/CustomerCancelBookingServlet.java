package customer.service;

import common.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Cancels a booking for the logged-in customer by updating the status
 * to 'cancelled' in companybookings.
 *
 * Rules enforced server-side (frontend can be bypassed):
 *   1. Booking must belong to this customer.
 *   2. Booking must not already be cancelled or completed.
 *   3. Pickup must be at least 24 hours away.
 *
 * Expects: POST /customer/cancel-booking
 * Body (JSON or form): rideId=RID00001
 */
@WebServlet("/customer/cancel-booking")
public class CustomerCancelBookingServlet extends HttpServlet {

    private static final long MIN_HOURS_BEFORE_PICKUP = 24L;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        // ---- Auth ----
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("customerId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\"success\":false,\"message\":\"Please login\"}");
            return;
        }
        int customerId = (int) session.getAttribute("customerId");

        // ---- Read rideId (supports form or JSON body) ----
        String rideId = req.getParameter("rideId");
        if (rideId == null || rideId.isEmpty()) {
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = req.getReader().readLine()) != null) sb.append(line);
            String body = sb.toString();
            int idx = body.indexOf("\"rideId\"");
            if (idx != -1) {
                int colon = body.indexOf(':', idx);
                int firstQuote = body.indexOf('"', colon + 1);
                int lastQuote = body.indexOf('"', firstQuote + 1);
                if (firstQuote != -1 && lastQuote != -1) {
                    rideId = body.substring(firstQuote + 1, lastQuote);
                }
            }
        }

        if (rideId == null || rideId.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"success\":false,\"message\":\"Missing rideId\"}");
            return;
        }

        try (Connection con = DBConnection.getConnection()) {

            // ---- 1. Load booking and validate ownership + status + pickup time ----
            // NOTE: adjust column names if your schema differs.
            // We expect pickup_date (DATE) and start_time (TIME) on companybookings.
            String selectSql =
                    "SELECT status, trip_start_date, start_time " +
                            "FROM companybookings " +
                            "WHERE ride_id = ? AND customerid = ?";

            String dbStatus;
            java.sql.Date pickupDate;
            java.sql.Time startTime;

            try (PreparedStatement ps = con.prepareStatement(selectSql)) {
                ps.setString(1, rideId);
                ps.setInt(2, customerId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.write("{\"success\":false,\"message\":\"Booking not found\"}");
                        return;
                    }
                    dbStatus = rs.getString("status");
                    pickupDate = rs.getDate("trip_start_date");
                    startTime = rs.getTime("start_time");
                }
            }

            // ---- 2. Status check ----
            if (dbStatus != null) {
                String s = dbStatus.toLowerCase();
                if (s.equals("cancelled")) {
                    resp.setStatus(HttpServletResponse.SC_CONFLICT);
                    out.write("{\"success\":false,\"message\":\"Booking is already cancelled\"}");
                    return;
                }
                if (s.equals("completed")) {
                    resp.setStatus(HttpServletResponse.SC_CONFLICT);
                    out.write("{\"success\":false,\"message\":\"Completed bookings cannot be cancelled\"}");
                    return;
                }
            }

            // ---- 3. 24-hour rule ----
            if (pickupDate == null) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write("{\"success\":false,\"message\":\"Pickup date unavailable for this booking\"}");
                return;
            }

            LocalDateTime pickupDateTime = pickupDate.toLocalDate()
                    .atTime(startTime != null ? startTime.toLocalTime() : java.time.LocalTime.MIDNIGHT);
            LocalDateTime now = LocalDateTime.now();

            long hoursUntilPickup = ChronoUnit.HOURS.between(now, pickupDateTime);

            if (hoursUntilPickup < MIN_HOURS_BEFORE_PICKUP) {
                resp.setStatus(HttpServletResponse.SC_FORBIDDEN);
                String msg = (hoursUntilPickup < 0)
                        ? "Pickup time has already passed"
                        : "Bookings can only be cancelled at least 24 hours before pickup";
                out.write("{\"success\":false,\"message\":\"" + msg + "\"}");
                return;
            }

            // ---- 4. Perform cancellation ----
            String updateSql = "UPDATE companybookings SET status = 'cancelled' " +
                    "WHERE ride_id = ? AND customerid = ? " +
                    "AND (status IS NULL OR status NOT IN ('cancelled','completed'))";

            try (PreparedStatement ps = con.prepareStatement(updateSql)) {
                ps.setString(1, rideId);
                ps.setInt(2, customerId);
                int rows = ps.executeUpdate();
                if (rows > 0) {
                    out.write("{\"success\":true,\"message\":\"Booking cancelled\"}");
                } else {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.write("{\"success\":false,\"message\":\"Booking not found or already cancelled\"}");
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"success\":false,\"message\":\"Server error\"}");
        }
    }
}