package customer.service;

import common.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;

/**
 * Cancels a booking for the logged-in customer by updating the status
 * to 'cancelled' in companybookings. Only the owner of the booking can
 * cancel it.
 *
 * Expects: POST /customer/cancel-booking
 * Body (JSON or form): rideId=RID00001
 */
@WebServlet("/customer/cancel-booking")
public class CustomerCancelBookingServlet extends HttpServlet {

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
            // very small JSON extraction to avoid adding a dependency here
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

        // ---- Update: cancel only if owned by this customer and not already completed/cancelled ----
        String sql = "UPDATE companybookings SET status = 'cancelled' " +
                "WHERE ride_id = ? AND customerid = ? " +
                "AND (status IS NULL OR status NOT IN ('cancelled','completed'))";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, rideId);
            ps.setInt(2, customerId);

            int rows = ps.executeUpdate();
            if (rows > 0) {
                out.write("{\"success\":true,\"message\":\"Booking cancelled\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.write("{\"success\":false,\"message\":\"Booking not found or already cancelled\"}");
            }
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"success\":false,\"message\":\"Server error\"}");
        }
    }
}