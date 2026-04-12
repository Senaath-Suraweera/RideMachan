package customer.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import common.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.SQLException;

/**
 * Handles the final "Pay" click on the payment page.
 * Updates the corresponding company_booking row:
 *   - status          -> 'confirmed'
 *   - payment_status  -> 'paid'
 *
 * Expected JSON body from payment.js:
 * {
 *   "rideId": "RM-000123"   // varchar ride_id, OR a numeric booking_id
 *   "paymentMethod": "credit-debit",
 *   "totalCost": 89600
 * }
 *
 * Matches by ride_id first; if rideId looks numeric and nothing matched,
 * falls back to matching by booking_id.
 */
@WebServlet("/customer/confirm-payment")
public class CustomerConfirmPaymentServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        // Read JSON body
        StringBuilder sb = new StringBuilder();
        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);
        }

        JsonObject body;
        try {
            body = gson.fromJson(sb.toString(), JsonObject.class);
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write(errorJson("Invalid JSON body"));
            return;
        }

        if (body == null || !body.has("rideId") || body.get("rideId").isJsonNull()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write(errorJson("Missing rideId"));
            return;
        }

        // rideId can arrive as number or string; treat as string to match varchar column
        String rideId = body.get("rideId").getAsString();

        String updateByRideId =
                "UPDATE companybookings " +
                        "SET status = 'confirmed', payment_status = 'paid' " +
                        "WHERE ride_id = ?";

        String updateByBookingId =
                "UPDATE companybookings " +
                        "SET status = 'confirmed', payment_status = 'paid' " +
                        "WHERE booking_id = ?";

        try (Connection conn = DBConnection.getConnection()) {

            int rows = 0;

            // 1. Try matching by ride_id (varchar)
            try (PreparedStatement ps = conn.prepareStatement(updateByRideId)) {
                ps.setString(1, rideId);
                rows = ps.executeUpdate();
            }

            // 2. Fallback: if rideId is purely numeric, try booking_id (int PK)
            if (rows == 0 && rideId.matches("\\d+")) {
                try (PreparedStatement ps = conn.prepareStatement(updateByBookingId)) {
                    ps.setInt(1, Integer.parseInt(rideId));
                    rows = ps.executeUpdate();
                }
            }

            if (rows > 0) {
                JsonObject result = new JsonObject();
                result.addProperty("success", true);
                result.addProperty("rideId", rideId);
                result.addProperty("status", "confirmed");
                result.addProperty("paymentStatus", "paid");
                resp.getWriter().write(gson.toJson(result));
            } else {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write(errorJson("Booking not found for rideId " + rideId));
            }

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write(errorJson("Database error: " + e.getMessage()));
        }
    }

    private String errorJson(String message) {
        JsonObject obj = new JsonObject();
        obj.addProperty("success", false);
        obj.addProperty("message", message);
        return gson.toJson(obj);
    }
}