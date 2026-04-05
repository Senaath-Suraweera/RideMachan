package individualprovider.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.sql.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/api/provider/bookings/*")
public class ProviderBookingsServlet extends HttpServlet {

    private final Gson gson = new Gson();

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    private Integer getProviderId(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        Integer pid = (session == null) ? null : (Integer) session.getAttribute("providerId");
        if (pid != null) return pid;

        // fallback (optional): allow query param for testing
        String qp = req.getParameter("providerId");
        if (qp != null && !qp.isBlank()) {
            try { return Integer.parseInt(qp.trim()); } catch (Exception ignored) {}
        }
        return null;
    }

    private static String padBooking(int bookingId) {
        return "BK" + String.format("%03d", bookingId);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer providerId = getProviderId(req);
        if (providerId == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"Not logged in as provider (providerId missing).\"}");
            return;
        }

        String path = req.getPathInfo(); // null, "/", "/{id}"
        if (path == null || "/".equals(path) || path.isBlank()) {
            listBookings(req, resp, providerId);
            return;
        }

        // details: "/{id}"
        String[] parts = path.split("/");
        if (parts.length >= 2) {
            String idStr = parts[1];
            try {
                int bookingId = Integer.parseInt(idStr);
                getBookingDetails(resp, providerId, bookingId);
                return;
            } catch (NumberFormatException ignored) {}
        }

        resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
        resp.getWriter().write("{\"error\":\"Invalid booking id.\"}");
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer providerId = getProviderId(req);
        if (providerId == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"Not logged in as provider (providerId missing).\"}");
            return;
        }

        String path = req.getPathInfo(); // "/{id}/status"
        if (path == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Missing path.\"}");
            return;
        }

        String[] parts = path.split("/");
        if (parts.length < 3) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Expected /{bookingId}/status\"}");
            return;
        }

        int bookingId;
        try {
            bookingId = Integer.parseInt(parts[1]);
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid booking id.\"}");
            return;
        }

        if (!"status".equalsIgnoreCase(parts[2])) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Expected /{bookingId}/status\"}");
            return;
        }

        String body = readBody(req);
        JsonObject in = gson.fromJson(body, JsonObject.class);
        if (in == null || !in.has("status")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Body must include {status}.\"}");
            return;
        }

        String newStatus = in.get("status").getAsString();

        // Only allow updating bookings that belong to provider (via vehicle.provider_id)
        String sql =
                "UPDATE companybookings cb " +
                        "JOIN vehicle v ON cb.vehicleid = v.vehicleid " +
                        "SET cb.status = ? " +
                        "WHERE cb.booking_id = ? AND v.provider_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, newStatus);
            ps.setInt(2, bookingId);
            ps.setInt(3, providerId);

            int updated = ps.executeUpdate();
            if (updated == 0) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"error\":\"Booking not found for this provider.\"}");
                return;
            }

            JsonObject out = new JsonObject();
            out.addProperty("ok", true);
            out.addProperty("bookingId", bookingId);
            out.addProperty("displayId", padBooking(bookingId));
            out.addProperty("status", newStatus);
            resp.getWriter().write(gson.toJson(out));

        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Server error updating status.\"}");
        }
    }

    private void listBookings(HttpServletRequest req, HttpServletResponse resp, int providerId) throws IOException {
        String type = nvl(req.getParameter("type"), "ongoing").toLowerCase(); // ongoing|past
        String vehicleType = trimToNull(req.getParameter("vehicleType"));
        String location = trimToNull(req.getParameter("location"));
        String withDriver = trimToNull(req.getParameter("withDriver"));
        String status = trimToNull(req.getParameter("status"));
        String paymentStatus = trimToNull(req.getParameter("paymentStatus"));
        String fromDate = trimToNull(req.getParameter("fromDate"));
        String toDate = trimToNull(req.getParameter("toDate"));

        StringBuilder sql = new StringBuilder();
        sql.append(
                "SELECT " +
                        " cb.booking_id, cb.status, cb.payment_status, cb.total_amount, " +
                        " cb.trip_start_date, cb.trip_end_date, cb.pickup_location, cb.drop_location, " +
                        " c.firstname AS c_first, c.lastname AS c_last, " +
                        " v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.vehicle_type, v.location AS v_location, " +
                        " rc.companyname AS rc_name, " +
                        " d.firstname AS d_first, d.lastname AS d_last " +
                        "FROM companybookings cb " +
                        "JOIN vehicle v ON cb.vehicleid = v.vehicleid " +
                        "JOIN customer c ON cb.customerid = c.customerid " +
                        "LEFT JOIN rentalcompany rc ON cb.companyid = rc.companyid " +
                        "LEFT JOIN driver d ON cb.driverid = d.driverid " +
                        "WHERE v.provider_id = ? "
        );

        List<Object> params = new ArrayList<>();
        params.add(providerId);

        if ("past".equals(type)) {
            sql.append(" AND (cb.status = 'completed' OR cb.status = 'cancelled') ");
        } else {
            // ongoing default
            sql.append(" AND (cb.status IS NULL OR (cb.status <> 'completed' AND cb.status <> 'cancelled')) ");
        }

        if (vehicleType != null) {
            sql.append(" AND v.vehicle_type = ? ");
            params.add(vehicleType);
        }

        if (location != null) {
            sql.append(" AND (cb.pickup_location LIKE ? OR cb.drop_location LIKE ? OR v.location LIKE ?) ");
            String like = "%" + location + "%";
            params.add(like);
            params.add(like);
            params.add(like);
        }

        if ("true".equalsIgnoreCase(withDriver)) {
            sql.append(" AND cb.driverid IS NOT NULL ");
        }

        if (status != null) {
            sql.append(" AND cb.status = ? ");
            params.add(status);
        }

        if (paymentStatus != null) {
            sql.append(" AND cb.payment_status = ? ");
            params.add(paymentStatus);
        }

        if (fromDate != null) {
            sql.append(" AND cb.trip_start_date >= ? ");
            params.add(Date.valueOf(LocalDate.parse(fromDate)));
        }

        if (toDate != null) {
            sql.append(" AND cb.trip_end_date <= ? ");
            params.add(Date.valueOf(LocalDate.parse(toDate)));
        }

        sql.append(" ORDER BY cb.booking_id DESC ");

        JsonObject out = new JsonObject();
        JsonArray items = new JsonArray();

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                Object p = params.get(i);
                if (p instanceof Integer) ps.setInt(i + 1, (Integer) p);
                else if (p instanceof Date) ps.setDate(i + 1, (Date) p);
                else ps.setString(i + 1, String.valueOf(p));
            }

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int bookingId = rs.getInt("booking_id");
                    String cName = rs.getString("c_first") + " " + rs.getString("c_last");
                    String vehicleName = rs.getString("vehiclebrand") + " " + rs.getString("vehiclemodel");
                    String driverName = null;
                    String dFirst = rs.getString("d_first");
                    if (dFirst != null) {
                        driverName = dFirst + " " + rs.getString("d_last");
                    }

                    Date s = rs.getDate("trip_start_date");
                    Date e = rs.getDate("trip_end_date");
                    int durationDays = 0;
                    if (s != null && e != null) {
                        durationDays = (int)((e.getTime() - s.getTime()) / (1000L * 60 * 60 * 24)) + 1;
                    }

                    JsonObject it = new JsonObject();
                    it.addProperty("bookingId", bookingId);
                    it.addProperty("displayId", padBooking(bookingId));
                    it.addProperty("customerName", cName);
                    it.addProperty("vehicleName", vehicleName);
                    it.addProperty("vehicleType", rs.getString("vehicle_type"));
                    it.addProperty("rentalCompany", rs.getString("rc_name"));
                    if (driverName != null) it.addProperty("driverName", driverName);
                    it.addProperty("pickupLocation", rs.getString("pickup_location"));
                    it.addProperty("dropLocation", rs.getString("drop_location"));
                    it.addProperty("startDate", (s == null) ? null : s.toString());
                    it.addProperty("endDate", (e == null) ? null : e.toString());
                    it.addProperty("durationDays", durationDays);
                    it.addProperty("status", rs.getString("status"));
                    it.addProperty("paymentStatus", rs.getString("payment_status"));
                    it.addProperty("totalAmount", rs.getBigDecimal("total_amount") == null ? null : rs.getBigDecimal("total_amount").doubleValue());
                    items.add(it);
                }
            }

            out.add("items", items);
            resp.getWriter().write(gson.toJson(out));

        } catch (Exception ex) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Server error loading bookings.\"}");
        }
    }

    private void getBookingDetails(HttpServletResponse resp, int providerId, int bookingId) throws IOException {
        String sql =
                "SELECT " +
                        " cb.booking_id, cb.status, cb.payment_status, cb.total_amount, cb.booked_Date, " +
                        " cb.trip_start_date, cb.trip_end_date, cb.start_time, cb.end_time, " +
                        " cb.pickup_location, cb.drop_location, " +
                        " c.customerid, c.firstname AS c_first, c.lastname AS c_last, c.email AS c_email, c.mobilenumber AS c_mobile, " +
                        " c.customer_type, c.nic_number, c.passport_number, c.drivers_license_number, c.international_drivers_license_number, " +
                        " v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.color, v.milage, v.vehicle_type, v.location AS v_location, v.price_per_day, " +
                        " rc.companyid, rc.companyname, " +
                        " d.driverid, d.firstname AS d_first, d.lastname AS d_last, d.email AS d_email, d.mobilenumber AS d_mobile, d.licensenumber " +
                        "FROM companybookings cb " +
                        "JOIN vehicle v ON cb.vehicleid = v.vehicleid " +
                        "JOIN customer c ON cb.customerid = c.customerid " +
                        "LEFT JOIN rentalcompany rc ON cb.companyid = rc.companyid " +
                        "LEFT JOIN driver d ON cb.driverid = d.driverid " +
                        "WHERE cb.booking_id = ? AND v.provider_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, bookingId);
            ps.setInt(2, providerId);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    resp.getWriter().write("{\"error\":\"Booking not found for this provider.\"}");
                    return;
                }

                JsonObject out = new JsonObject();
                out.addProperty("bookingId", bookingId);
                out.addProperty("displayId", padBooking(bookingId));
                out.addProperty("status", rs.getString("status"));
                out.addProperty("paymentStatus", rs.getString("payment_status"));
                out.addProperty("totalAmount", rs.getBigDecimal("total_amount") == null ? null : rs.getBigDecimal("total_amount").doubleValue());

                // booking
                JsonObject booking = new JsonObject();
                booking.addProperty("bookedDate", toStr(rs.getDate("booked_Date")));
                booking.addProperty("tripStartDate", toStr(rs.getDate("trip_start_date")));
                booking.addProperty("tripEndDate", toStr(rs.getDate("trip_end_date")));
                booking.addProperty("startTime", toStr(rs.getTime("start_time")));
                booking.addProperty("endTime", toStr(rs.getTime("end_time")));
                booking.addProperty("pickupLocation", rs.getString("pickup_location"));
                booking.addProperty("dropLocation", rs.getString("drop_location"));
                out.add("booking", booking);

                // customer
                JsonObject customer = new JsonObject();
                customer.addProperty("customerId", rs.getInt("customerid"));
                customer.addProperty("name", rs.getString("c_first") + " " + rs.getString("c_last"));
                customer.addProperty("email", rs.getString("c_email"));
                customer.addProperty("phone", rs.getString("c_mobile"));
                customer.addProperty("customerType", rs.getString("customer_type"));
                customer.addProperty("nicNumber", rs.getString("nic_number"));
                customer.addProperty("passportNumber", rs.getString("passport_number"));
                customer.addProperty("driversLicenseNumber", rs.getString("drivers_license_number"));
                customer.addProperty("internationalDriversLicenseNumber", rs.getString("international_drivers_license_number"));
                out.add("customer", customer);

                // vehicle
                JsonObject vehicle = new JsonObject();
                vehicle.addProperty("vehicleId", rs.getInt("vehicleid"));
                vehicle.addProperty("name", rs.getString("vehiclebrand") + " " + rs.getString("vehiclemodel"));
                vehicle.addProperty("plate", rs.getString("numberplatenumber"));
                vehicle.addProperty("type", rs.getString("vehicle_type"));
                vehicle.addProperty("color", rs.getString("color"));
                vehicle.addProperty("odometer", rs.getString("milage"));
                vehicle.addProperty("location", rs.getString("v_location"));
                vehicle.addProperty("pricePerDay", rs.getBigDecimal("price_per_day") == null ? null : rs.getBigDecimal("price_per_day").doubleValue());
                out.add("vehicle", vehicle);

                // company
                JsonObject company = new JsonObject();
                company.addProperty("companyId", rs.getInt("companyid"));
                company.addProperty("companyName", rs.getString("companyname"));
                out.add("company", company);

                // driver (nullable)
                int driverId = rs.getInt("driverid");
                if (!rs.wasNull()) {
                    JsonObject driver = new JsonObject();
                    driver.addProperty("driverId", driverId);
                    driver.addProperty("name", rs.getString("d_first") + " " + rs.getString("d_last"));
                    driver.addProperty("email", rs.getString("d_email"));
                    driver.addProperty("phone", rs.getString("d_mobile"));
                    driver.addProperty("licenseNumber", rs.getString("licensenumber"));
                    out.add("driver", driver);
                } else {
                    out.add("driver", null);
                }

                resp.getWriter().write(gson.toJson(out));
            }

        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Server error loading booking details.\"}");
        }
    }

    private static String readBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = req.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        return sb.toString();
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static String nvl(String s, String def) {
        return (s == null || s.isBlank()) ? def : s;
    }

    private static String toStr(java.util.Date d) {
        return d == null ? null : d.toString();
    }
}
