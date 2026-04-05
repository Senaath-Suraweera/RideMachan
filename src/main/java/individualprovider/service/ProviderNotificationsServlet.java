package individualprovider.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.util.DBConnection;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.sql.*;

@WebServlet("/api/provider/notifications")
public class ProviderNotificationsServlet extends HttpServlet {

    private final Gson gson = new Gson();

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    private Integer getInt(HttpServletRequest req, String key) {
        String v = req.getParameter(key);
        if (v == null || v.trim().isEmpty()) return null;
        try { return Integer.parseInt(v.trim()); } catch (Exception e) { return null; }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer providerId = getInt(req, "providerId");
        Integer limit = getInt(req, "limit");
        if (limit == null || limit <= 0 || limit > 50) limit = 10;

        if (providerId == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"providerId is required\"}");
            return;
        }

        // Notifications derived from companybookings for provider-owned vehicles
        String sql =
                "SELECT cb.booking_id, cb.status, cb.payment_status, cb.booked_Date, cb.trip_start_date, cb.trip_end_date, " +
                        "cb.pickup_location, cb.drop_location, cb.total_amount, " +
                        "v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, " +
                        "c.firstname AS customer_firstname, c.lastname AS customer_lastname " +
                        "FROM companybookings cb " +
                        "JOIN Vehicle v ON cb.vehicleid = v.vehicleid " +
                        "JOIN Customer c ON cb.customerid = c.customerid " +
                        "WHERE v.provider_id = ? " +
                        "ORDER BY cb.booking_id DESC " +
                        "LIMIT ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, providerId);
            ps.setInt(2, limit);

            JsonArray items = new JsonArray();

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    JsonObject n = new JsonObject();

                    int bookingId = rs.getInt("booking_id");
                    String status = rs.getString("status");
                    String payment = rs.getString("payment_status");

                    String vehicleName =
                            (rs.getString("vehiclebrand") == null ? "" : rs.getString("vehiclebrand")) + " " +
                                    (rs.getString("vehiclemodel") == null ? "" : rs.getString("vehiclemodel"));

                    String plate = rs.getString("numberplatenumber");
                    String customer =
                            (rs.getString("customer_firstname") == null ? "" : rs.getString("customer_firstname")) + " " +
                                    (rs.getString("customer_lastname") == null ? "" : rs.getString("customer_lastname"));

                    BigDecimal total = rs.getBigDecimal("total_amount");

                    n.addProperty("id", "BK-" + bookingId);
                    n.addProperty("bookingId", bookingId);
                    n.addProperty("title", "Booking Update");
                    n.addProperty("message",
                            "Booking #" + bookingId + " • " + vehicleName.trim() +
                                    (plate != null ? (" (" + plate + ")") : "") +
                                    " • Customer: " + customer.trim() +
                                    " • Status: " + (status == null ? "N/A" : status) +
                                    " • Payment: " + (payment == null ? "N/A" : payment)
                    );
                    n.addProperty("status", status);
                    n.addProperty("paymentStatus", payment);
                    n.addProperty("vehicle", vehicleName.trim());
                    n.addProperty("plate", plate);
                    n.addProperty("customer", customer.trim());
                    n.addProperty("amount", total == null ? 0 : total.doubleValue());

                    Date booked = rs.getDate("booked_Date");
                    n.addProperty("date", booked == null ? null : booked.toString());

                    items.add(n);
                }
            }

            JsonObject out = new JsonObject();
            out.add("items", items);
            out.addProperty("count", items.size());

            resp.getWriter().write(gson.toJson(out));

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Server error\"}");
        }
    }
}
