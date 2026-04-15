package admin.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;

@WebServlet("/api/admin/customer-bookings/*")
public class AdminCustomerBookingsServlet extends HttpServlet {

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

    private boolean isAdmin(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return false;
        Object actorType = session.getAttribute("actorType");
        return actorType != null && "ADMIN".equalsIgnoreCase(String.valueOf(actorType));
    }

    private int parseIntOr(String v, int def) {
        try { return Integer.parseInt(v); } catch (Exception e) { return def; }
    }

    private String bookingCode(int bookingId) {
        return "BK" + String.format("%03d", bookingId);
    }

    private Integer parseBookingIdFlexible(String raw) {
        if (raw == null) return null;
        raw = raw.trim();
        if (raw.isEmpty()) return null;
        if (raw.toUpperCase().startsWith("BK")) raw = raw.substring(2);
        try { return Integer.parseInt(raw.replaceAll("[^0-9]", "")); }
        catch (Exception e) { return null; }
    }

    /*
      Endpoints:
      GET /api/admin/customer-bookings/{customerId}/ongoing
      GET /api/admin/customer-bookings/{customerId}/past
      GET /api/admin/customer-bookings/{customerId}/{bookingId}  (bookingId can be 1 or BK001)
     */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        if (!isAdmin(req)) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"Unauthorized\"}");
            return;
        }

        String path = req.getPathInfo();
        if (path == null || "/".equals(path)) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Missing path. Use /{customerId}/ongoing|past|{bookingId}\"}");
            return;
        }

        String[] parts = path.split("/");
        if (parts.length < 3) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid path. Use /{customerId}/ongoing|past|{bookingId}\"}");
            return;
        }

        int customerId = parseIntOr(parts[1], -1);
        if (customerId <= 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid customerId\"}");
            return;
        }

        String action = parts[2];

        try (Connection con = DBConnection.getConnection();
             PrintWriter out = resp.getWriter()) {

            if ("ongoing".equalsIgnoreCase(action) || "past".equalsIgnoreCase(action)) {
                boolean isPast = "past".equalsIgnoreCase(action);
                JsonObject result = listBookings(req, con, customerId, isPast);
                out.write(gson.toJson(result));
                return;
            }

            Integer bookingId = parseBookingIdFlexible(action);
            if (bookingId == null) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write("{\"error\":\"Invalid booking id\"}");
                return;
            }

            JsonObject details = getBookingDetails(con, customerId, bookingId);
            if (details == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.write("{\"error\":\"Booking not found\"}");
                return;
            }

            out.write(gson.toJson(details));

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error\"}");
        }
    }

    private int parseIntOrNullSafe(String v, int def) {
        try { return Integer.parseInt(v); } catch (Exception e) { return def; }
    }

    private JsonObject listBookings(HttpServletRequest req, Connection con, int customerId, boolean isPast) throws SQLException {

        int page = parseIntOrNullSafe(req.getParameter("page"), 1);
        int pageSize = parseIntOrNullSafe(req.getParameter("pageSize"), 10);
        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 10;
        int offset = (page - 1) * pageSize;

        List<Object> params = new ArrayList<>();
        StringBuilder where = new StringBuilder(" WHERE cb.customerid = ? ");
        params.add(customerId);

        where.append(" AND ( ");
        if (isPast) {
            where.append(" (cb.trip_end_date < CURDATE()) OR (LOWER(cb.status) IN ('completed','cancelled')) ");
        } else {
            where.append(" (cb.trip_end_date >= CURDATE()) AND (LOWER(cb.status) NOT IN ('completed','cancelled')) ");
        }
        where.append(" ) ");

        String countSql =
                "SELECT COUNT(*) " +
                        "FROM companybookings cb " +
                        "LEFT JOIN vehicle v ON cb.vehicleid = v.vehicleid " +
                        "LEFT JOIN rentalcompany rc ON cb.companyid = rc.companyid " +
                        where;

        long total = 0;
        try (PreparedStatement ps = con.prepareStatement(countSql)) {
            bindParams(ps, params);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) total = rs.getLong(1);
            }
        }

        String dataSql =
                "SELECT " +
                        " cb.booking_id, cb.status, cb.payment_status, cb.total_amount, " +
                        " cb.trip_start_date, cb.trip_end_date, cb.start_time, cb.end_time, " +
                        " cb.pickup_location, cb.drop_location, cb.booked_date, " +
                        " rc.companyid, rc.companyname, rc.city AS company_city, " +
                        " v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.color, v.vehicle_type, v.location, v.vehicleimages, " +
                        " cb.driverid, d.firstname AS driver_firstname, d.lastname AS driver_lastname " +
                        "FROM companybookings cb " +
                        "LEFT JOIN rentalcompany rc ON cb.companyid = rc.companyid " +
                        "LEFT JOIN vehicle v ON cb.vehicleid = v.vehicleid " +
                        "LEFT JOIN driver d ON cb.driverid = d.driverid " +
                        where +
                        " ORDER BY cb.trip_start_date DESC, cb.booking_id DESC " +
                        " LIMIT ? OFFSET ?";

        List<Object> dataParams = new ArrayList<>(params);
        dataParams.add(pageSize);
        dataParams.add(offset);

        JsonArray bookings = new JsonArray();

        try (PreparedStatement ps = con.prepareStatement(dataSql)) {
            bindParams(ps, dataParams);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    JsonObject b = new JsonObject();

                    int bookingId = rs.getInt("booking_id");
                    b.addProperty("bookingId", bookingCode(bookingId));
                    b.addProperty("bookingIdRaw", bookingId);

                    b.addProperty("status", rs.getString("status"));
                    b.addProperty("paymentStatus", rs.getString("payment_status"));
                    b.addProperty("totalAmount", rs.getBigDecimal("total_amount") == null ? null : rs.getBigDecimal("total_amount").doubleValue());

                    Date booked = rs.getDate("booked_date");
                    b.addProperty("bookedDate", booked == null ? null : booked.toString());

                    Date s = rs.getDate("trip_start_date");
                    Date e = rs.getDate("trip_end_date");
                    b.addProperty("tripStartDate", s == null ? null : s.toString());
                    b.addProperty("tripEndDate", e == null ? null : e.toString());
                    b.addProperty("startTime", rs.getTime("start_time") == null ? null : rs.getTime("start_time").toString());
                    b.addProperty("endTime", rs.getTime("end_time") == null ? null : rs.getTime("end_time").toString());

                    b.addProperty("pickupLocation", rs.getString("pickup_location"));
                    b.addProperty("dropLocation", rs.getString("drop_location"));

                    if (s != null && e != null) {
                        long days = (e.toLocalDate().toEpochDay() - s.toLocalDate().toEpochDay()) + 1;
                        b.addProperty("durationDays", days);
                    }

                    JsonObject company = new JsonObject();
                    company.addProperty("companyId", rs.getInt("companyid"));
                    company.addProperty("companyName", rs.getString("companyname"));
                    company.addProperty("city", rs.getString("company_city"));
                    b.add("company", company);

                    JsonObject vehicle = new JsonObject();
                    int vehicleId = rs.getInt("vehicleid");
                    if (!rs.wasNull()) {
                        vehicle.addProperty("vehicleId", vehicleId);
                        vehicle.addProperty("name", safeJoin(rs.getString("vehiclebrand"), rs.getString("vehiclemodel")));
                        vehicle.addProperty("plate", rs.getString("numberplatenumber"));
                        vehicle.addProperty("type", rs.getString("vehicle_type"));
                        vehicle.addProperty("color", rs.getString("color"));
                        vehicle.addProperty("location", rs.getString("location"));
                        vehicle.addProperty("imageUrl", blobToDataUrl(rs.getBytes("vehicleimages")));
                    }
                    b.add("vehicle", vehicle);

                    int driverId = rs.getInt("driverid");
                    if (!rs.wasNull()) {
                        JsonObject driver = new JsonObject();
                        driver.addProperty("driverId", driverId);
                        String df = rs.getString("driver_firstname");
                        String dl = rs.getString("driver_lastname");
                        driver.addProperty("name", safeJoin(df, dl));
                        b.add("driver", driver);
                    } else {
                        b.add("driver", null);
                    }

                    bookings.add(b);
                }
            }
        }

        JsonObject res = new JsonObject();
        res.addProperty("customerId", customerId);
        res.addProperty("scope", isPast ? "past" : "ongoing");
        res.addProperty("page", page);
        res.addProperty("pageSize", pageSize);
        res.addProperty("total", total);
        res.add("bookings", bookings);

        return res;
    }

    private JsonObject getBookingDetails(Connection con, int customerId, int bookingId) throws SQLException {

        String sql =
                "SELECT " +
                        " cb.booking_id, cb.status, cb.payment_status, cb.total_amount, " +
                        " cb.booked_date, cb.trip_start_date, cb.trip_end_date, cb.start_time, cb.end_time, cb.pickup_location, cb.drop_location, " +
                        " rc.companyid, rc.companyname, rc.companyemail, rc.phone AS company_phone, rc.city AS company_city, " +
                        " c.customerid, c.firstname AS c_first, c.lastname AS c_last, c.email AS c_email, c.mobilenumber AS c_phone, " +
                        " c.nic_number, c.passport_number, c.drivers_license_number, c.international_drivers_license_number, " +
                        " v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.color, v.vehicle_type, v.fuel_type, v.milage, v.numberofpassengers, v.location, v.price_per_day, v.enginecapacity, v.transmission, v.features, v.description, v.vehicleimages, " +
                        " d.driverid, d.firstname AS d_first, d.lastname AS d_last, d.mobilenumber AS d_phone, d.licensenumber " +
                        "FROM companybookings cb " +
                        "JOIN customer c ON cb.customerid = c.customerid " +
                        "LEFT JOIN rentalcompany rc ON cb.companyid = rc.companyid " +
                        "LEFT JOIN vehicle v ON cb.vehicleid = v.vehicleid " +
                        "LEFT JOIN driver d ON cb.driverid = d.driverid " +
                        "WHERE cb.customerid = ? AND cb.booking_id = ?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            ps.setInt(2, bookingId);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                JsonObject root = new JsonObject();

                root.addProperty("bookingId", bookingCode(rs.getInt("booking_id")));
                root.addProperty("bookingIdRaw", rs.getInt("booking_id"));
                root.addProperty("status", rs.getString("status"));
                root.addProperty("paymentStatus", rs.getString("payment_status"));
                root.addProperty("totalAmount", rs.getBigDecimal("total_amount") == null ? null : rs.getBigDecimal("total_amount").doubleValue());

                Date booked = rs.getDate("booked_date");
                root.addProperty("bookedDate", booked == null ? null : booked.toString());

                Date s = rs.getDate("trip_start_date");
                Date e = rs.getDate("trip_end_date");
                root.addProperty("tripStartDate", s == null ? null : s.toString());
                root.addProperty("tripEndDate", e == null ? null : e.toString());
                root.addProperty("startTime", rs.getTime("start_time") == null ? null : rs.getTime("start_time").toString());
                root.addProperty("endTime", rs.getTime("end_time") == null ? null : rs.getTime("end_time").toString());

                root.addProperty("pickupLocation", rs.getString("pickup_location"));
                root.addProperty("dropLocation", rs.getString("drop_location"));

                if (s != null && e != null) {
                    long days = (e.toLocalDate().toEpochDay() - s.toLocalDate().toEpochDay()) + 1;
                    root.addProperty("durationDays", days);
                }

                JsonObject company = new JsonObject();
                company.addProperty("companyId", rs.getInt("companyid"));
                company.addProperty("companyName", rs.getString("companyname"));
                company.addProperty("companyEmail", rs.getString("companyemail"));
                company.addProperty("companyPhone", rs.getString("company_phone"));
                company.addProperty("city", rs.getString("company_city"));
                root.add("company", company);

                JsonObject customer = new JsonObject();
                customer.addProperty("customerId", rs.getInt("customerid"));
                customer.addProperty("name", safeJoin(rs.getString("c_first"), rs.getString("c_last")));
                customer.addProperty("email", rs.getString("c_email"));
                customer.addProperty("phone", rs.getString("c_phone"));

                String lic = rs.getString("drivers_license_number");
                if (lic == null || lic.isEmpty()) lic = rs.getString("international_drivers_license_number");
                customer.addProperty("license", lic);

                String doc = rs.getString("nic_number");
                if (doc == null || doc.isEmpty()) doc = rs.getString("passport_number");
                customer.addProperty("docNumber", doc);

                root.add("customer", customer);

                JsonObject vehicle = new JsonObject();
                int vehicleId = rs.getInt("vehicleid");
                if (!rs.wasNull()) {
                    vehicle.addProperty("vehicleId", vehicleId);
                    vehicle.addProperty("name", safeJoin(rs.getString("vehiclebrand"), rs.getString("vehiclemodel")));
                    vehicle.addProperty("brand", rs.getString("vehiclebrand"));
                    vehicle.addProperty("model", rs.getString("vehiclemodel"));
                    vehicle.addProperty("plate", rs.getString("numberplatenumber"));
                    vehicle.addProperty("type", rs.getString("vehicle_type"));
                    vehicle.addProperty("fuelType", rs.getString("fuel_type"));
                    vehicle.addProperty("color", rs.getString("color"));
                    vehicle.addProperty("odometer", rs.getString("milage"));
                    vehicle.addProperty("passengers", rs.getInt("numberofpassengers"));
                    vehicle.addProperty("location", rs.getString("location"));
                    vehicle.addProperty("pricePerDay", rs.getBigDecimal("price_per_day") == null ? null : rs.getBigDecimal("price_per_day").doubleValue());
                    vehicle.addProperty("engineCapacity", rs.getInt("enginecapacity"));
                    vehicle.addProperty("transmission", rs.getString("transmission"));
                    vehicle.addProperty("features", rs.getString("features"));
                    vehicle.addProperty("description", rs.getString("description"));
                    vehicle.addProperty("imageUrl", blobToDataUrl(rs.getBytes("vehicleimages")));
                }
                root.add("vehicle", vehicle);

                int driverId = rs.getInt("driverid");
                if (!rs.wasNull()) {
                    JsonObject driver = new JsonObject();
                    driver.addProperty("driverId", driverId);
                    driver.addProperty("name", safeJoin(rs.getString("d_first"), rs.getString("d_last")));
                    driver.addProperty("phone", rs.getString("d_phone"));
                    driver.addProperty("license", rs.getString("licensenumber"));
                    root.add("driver", driver);
                } else {
                    root.add("driver", null);
                }

                return root;
            }
        }
    }

    private void bindParams(PreparedStatement ps, List<Object> params) throws SQLException {
        int i = 1;
        for (Object p : params) {
            if (p instanceof Integer) ps.setInt(i++, (Integer) p);
            else if (p instanceof Long) ps.setLong(i++, (Long) p);
            else if (p instanceof Double) ps.setDouble(i++, (Double) p);
            else if (p instanceof Date) ps.setDate(i++, (Date) p);
            else ps.setString(i++, String.valueOf(p));
        }
    }

    private String safeJoin(String a, String b) {
        String left = a == null ? "" : a.trim();
        String right = b == null ? "" : b.trim();
        return (left + " " + right).trim();
    }

    private String blobToDataUrl(byte[] bytes) {
        if (bytes == null || bytes.length == 0) return null;
        String mime = detectMimeType(bytes);
        return "data:" + mime + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    private String detectMimeType(byte[] bytes) {
        if (bytes == null || bytes.length < 4) return "image/jpeg";

        if ((bytes[0] & 0xFF) == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) {
            return "image/png";
        }
        if ((bytes[0] & 0xFF) == 0xFF && (bytes[1] & 0xFF) == 0xD8) {
            return "image/jpeg";
        }
        if (bytes.length >= 6) {
            String header6 = new String(bytes, 0, 6);
            if ("GIF87a".equals(header6) || "GIF89a".equals(header6)) {
                return "image/gif";
            }
        }
        if (bytes.length >= 12) {
            String riff = new String(bytes, 0, 4);
            String webp = new String(bytes, 8, 4);
            if ("RIFF".equals(riff) && "WEBP".equals(webp)) {
                return "image/webp";
            }
        }
        return "image/jpeg";
    }
}