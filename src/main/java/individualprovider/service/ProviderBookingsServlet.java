package individualprovider.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.math.BigDecimal;
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

        String path = req.getPathInfo();
        if (path == null || "/".equals(path) || path.isBlank()) {
            listBookings(req, resp, providerId);
            return;
        }

        String[] parts = path.split("/");
        if (parts.length >= 2) {
            String idStr = parts[1];
            try {
                int bookingId = Integer.parseInt(idStr);
                getBookingDetails(req, resp, providerId, bookingId);
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

        String path = req.getPathInfo();
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
        String type = nvl(req.getParameter("type"), "ongoing").toLowerCase();
        String vehicleType = trimToNull(req.getParameter("vehicleType"));
        String location = trimToNull(req.getParameter("location"));
        String withDriver = trimToNull(req.getParameter("withDriver"));
        String status = trimToNull(req.getParameter("status"));
        String paymentStatus = trimToNull(req.getParameter("paymentStatus"));
        String fromDate = trimToNull(req.getParameter("fromDate"));
        String toDate = trimToNull(req.getParameter("toDate"));

        Integer page = parseNullableInt(req.getParameter("page"));
        Integer pageSize = parseNullableInt(req.getParameter("pageSize"));
        int safePage = (page == null || page < 1) ? 1 : page;
        int safePageSize = (pageSize == null || pageSize < 1) ? 10 : Math.min(pageSize, 100);
        int offset = (safePage - 1) * safePageSize;

        StringBuilder baseSql = new StringBuilder();
        baseSql.append(
                " FROM companybookings cb " +
                        "JOIN vehicle v ON cb.vehicleid = v.vehicleid " +
                        "JOIN customer c ON cb.customerid = c.customerid " +
                        "LEFT JOIN rentalcompany rc ON cb.companyid = rc.companyid " +
                        "LEFT JOIN driver d ON cb.driverid = d.driverid " +
                        "WHERE v.provider_id = ? "
        );

        List<Object> params = new ArrayList<>();
        params.add(providerId);

        if ("past".equals(type)) {
            baseSql.append(" AND (cb.status = 'completed' OR cb.status = 'cancelled') ");
        } else {
            baseSql.append(" AND (cb.status IS NULL OR (cb.status <> 'completed' AND cb.status <> 'cancelled')) ");
        }

        if (vehicleType != null) {
            baseSql.append(" AND v.vehicle_type = ? ");
            params.add(vehicleType);
        }

        if (location != null) {
            baseSql.append(" AND (cb.pickup_location LIKE ? OR cb.drop_location LIKE ? OR v.location LIKE ?) ");
            String like = "%" + location + "%";
            params.add(like);
            params.add(like);
            params.add(like);
        }

        if ("true".equalsIgnoreCase(withDriver)) {
            baseSql.append(" AND cb.driverid IS NOT NULL ");
        }

        if (status != null) {
            baseSql.append(" AND cb.status = ? ");
            params.add(status);
        }

        if (paymentStatus != null) {
            baseSql.append(" AND cb.payment_status = ? ");
            params.add(paymentStatus);
        }

        if (fromDate != null) {
            baseSql.append(" AND cb.trip_start_date >= ? ");
            params.add(Date.valueOf(LocalDate.parse(fromDate)));
        }

        if (toDate != null) {
            baseSql.append(" AND cb.trip_end_date <= ? ");
            params.add(Date.valueOf(LocalDate.parse(toDate)));
        }

        String countSql = "SELECT COUNT(*) " + baseSql;
        String dataSql =
                "SELECT " +
                        " cb.booking_id, cb.status, cb.payment_status, cb.total_amount, " +
                        " cb.trip_start_date, cb.trip_end_date, cb.pickup_location, cb.drop_location, " +
                        " c.firstname AS c_first, c.lastname AS c_last, " +
                        " v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.vehicle_type, v.location AS v_location, v.price_per_day, " +
                        " rc.companyname AS rc_name, " +
                        " d.firstname AS d_first, d.lastname AS d_last " +
                        baseSql +
                        " ORDER BY cb.booking_id DESC LIMIT ? OFFSET ? ";

        JsonObject out = new JsonObject();
        JsonArray items = new JsonArray();

        try (Connection con = DBConnection.getConnection()) {

            int total = 0;
            try (PreparedStatement cps = con.prepareStatement(countSql)) {
                bindParams(cps, params);
                try (ResultSet crs = cps.executeQuery()) {
                    if (crs.next()) total = crs.getInt(1);
                }
            }

            List<Object> dataParams = new ArrayList<>(params);
            dataParams.add(safePageSize);
            dataParams.add(offset);

            try (PreparedStatement ps = con.prepareStatement(dataSql)) {
                bindParams(ps, dataParams);

                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        int bookingId = rs.getInt("booking_id");
                        int vehicleId = rs.getInt("vehicleid");

                        String cName = safeJoin(rs.getString("c_first"), rs.getString("c_last"));
                        String vehicleName = safeJoin(rs.getString("vehiclebrand"), rs.getString("vehiclemodel"));
                        String driverName = null;
                        String dFirst = rs.getString("d_first");
                        if (dFirst != null) {
                            driverName = safeJoin(dFirst, rs.getString("d_last"));
                        }

                        Date s = rs.getDate("trip_start_date");
                        Date e = rs.getDate("trip_end_date");
                        int durationDays = calculateDurationDays(s, e);

                        JsonObject vehicle = new JsonObject();
                        vehicle.addProperty("vehicleId", vehicleId);
                        vehicle.addProperty("name", vehicleName);
                        vehicle.addProperty("plate", rs.getString("numberplatenumber"));
                        vehicle.addProperty("type", rs.getString("vehicle_type"));
                        vehicle.addProperty("location", rs.getString("v_location"));
                        if (rs.getBigDecimal("price_per_day") != null) {
                            vehicle.addProperty("pricePerDay", rs.getBigDecimal("price_per_day").doubleValue());
                        } else {
                            vehicle.add("pricePerDay", null);
                        }
                        vehicle.addProperty("imageUrl", req.getContextPath() + "/api/vehicles/" + vehicleId + "/image");
                        vehicle.addProperty("registrationDocumentUrl", req.getContextPath() + "/api/vehicles/" + vehicleId + "/doc");

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
                        it.addProperty("tripStartDate", s == null ? null : s.toString());
                        it.addProperty("tripEndDate", e == null ? null : e.toString());
                        it.addProperty("startDate", s == null ? null : s.toString());
                        it.addProperty("endDate", e == null ? null : e.toString());
                        it.addProperty("durationDays", durationDays);
                        it.addProperty("status", rs.getString("status"));
                        it.addProperty("paymentStatus", rs.getString("payment_status"));
                        if (rs.getBigDecimal("total_amount") != null) {
                            it.addProperty("totalAmount", rs.getBigDecimal("total_amount").doubleValue());
                        } else {
                            it.add("totalAmount", null);
                        }
                        it.add("vehicle", vehicle);

                        items.add(it);
                    }
                }
            }

            out.addProperty("page", safePage);
            out.addProperty("pageSize", safePageSize);
            out.addProperty("total", total);
            out.add("items", items);
            resp.getWriter().write(gson.toJson(out));

        } catch (Exception ex) {
            ex.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Server error loading bookings.\"}");
        }
    }

    private void getBookingDetails(HttpServletRequest req, HttpServletResponse resp, int providerId, int bookingId) throws IOException {
        String sql =
                "SELECT " +
                        " cb.booking_id, cb.status, cb.payment_status, cb.total_amount, cb.booked_Date, cb.created_at, " +
                        " cb.trip_start_date, cb.trip_end_date, cb.start_time, cb.end_time, " +
                        " cb.pickup_location, cb.drop_location, " +
                        " c.customerid, c.firstname AS c_first, c.lastname AS c_last, c.email AS c_email, c.mobilenumber AS c_mobile, " +
                        " c.customer_type, c.nic_number, c.passport_number, c.drivers_license_number, c.international_drivers_license_number, " +
                        " v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.color, v.milage, v.vehicle_type, v.location AS v_location, " +
                        " v.price_per_day, v.description AS v_description, v.features AS v_features, v.fuel_type, v.manufacture_year, v.transmission, " +
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

                int vehicleId = rs.getInt("vehicleid");
                Date tripStart = rs.getDate("trip_start_date");
                Date tripEnd = rs.getDate("trip_end_date");
                int durationDays = calculateDurationDays(tripStart, tripEnd);
                BigDecimal dailyRate = rs.getBigDecimal("price_per_day");

                JsonObject out = new JsonObject();
                out.addProperty("bookingId", bookingId);
                out.addProperty("displayId", padBooking(bookingId));
                out.addProperty("status", rs.getString("status"));
                out.addProperty("paymentStatus", rs.getString("payment_status"));
                if (rs.getBigDecimal("total_amount") != null) {
                    out.addProperty("totalAmount", rs.getBigDecimal("total_amount").doubleValue());
                } else {
                    out.add("totalAmount", null);
                }
                out.addProperty("createdAt", toStr(rs.getTimestamp("created_at")));

                JsonObject booking = new JsonObject();
                booking.addProperty("bookedDate", toStr(rs.getDate("booked_Date")));
                booking.addProperty("tripStartDate", toStr(tripStart));
                booking.addProperty("tripEndDate", toStr(tripEnd));
                booking.addProperty("startTime", toStr(rs.getTime("start_time")));
                booking.addProperty("endTime", toStr(rs.getTime("end_time")));
                booking.addProperty("pickupLocation", rs.getString("pickup_location"));
                booking.addProperty("dropLocation", rs.getString("drop_location"));
                booking.addProperty("durationDays", durationDays);
                if (dailyRate != null) {
                    booking.addProperty("dailyRate", dailyRate.doubleValue());
                    booking.addProperty("baseAmount", dailyRate.multiply(BigDecimal.valueOf(durationDays)).doubleValue());
                } else {
                    booking.add("dailyRate", null);
                    booking.add("baseAmount", null);
                }
                out.add("booking", booking);

                JsonObject customer = new JsonObject();
                customer.addProperty("customerId", rs.getInt("customerid"));
                customer.addProperty("name", safeJoin(rs.getString("c_first"), rs.getString("c_last")));
                customer.addProperty("email", rs.getString("c_email"));
                customer.addProperty("phone", rs.getString("c_mobile"));
                customer.addProperty("customerType", rs.getString("customer_type"));
                customer.addProperty("nicNumber", rs.getString("nic_number"));
                customer.addProperty("passportNumber", rs.getString("passport_number"));
                customer.addProperty("driversLicenseNumber", rs.getString("drivers_license_number"));
                customer.addProperty("internationalDriversLicenseNumber", rs.getString("international_drivers_license_number"));
                out.add("customer", customer);

                JsonObject vehicle = new JsonObject();
                vehicle.addProperty("vehicleId", vehicleId);
                vehicle.addProperty("name", safeJoin(rs.getString("vehiclebrand"), rs.getString("vehiclemodel")));
                vehicle.addProperty("brand", rs.getString("vehiclebrand"));
                vehicle.addProperty("model", rs.getString("vehiclemodel"));
                vehicle.addProperty("plate", rs.getString("numberplatenumber"));
                vehicle.addProperty("type", rs.getString("vehicle_type"));
                vehicle.addProperty("color", rs.getString("color"));
                vehicle.addProperty("odometer", rs.getString("milage"));
                vehicle.addProperty("location", rs.getString("v_location"));
                vehicle.addProperty("description", rs.getString("v_description"));
                vehicle.addProperty("features", rs.getString("v_features"));
                vehicle.addProperty("fuelType", rs.getString("fuel_type"));
                if (rs.getObject("manufacture_year") != null) {
                    vehicle.addProperty("manufactureYear", rs.getInt("manufacture_year"));
                } else {
                    vehicle.add("manufactureYear", null);
                }
                vehicle.addProperty("transmission", rs.getString("transmission"));
                if (dailyRate != null) {
                    vehicle.addProperty("pricePerDay", dailyRate.doubleValue());
                } else {
                    vehicle.add("pricePerDay", null);
                }
                vehicle.addProperty("imageUrl", req.getContextPath() + "/api/vehicles/" + vehicleId + "/image");
                vehicle.addProperty("registrationDocumentUrl", req.getContextPath() + "/api/vehicles/" + vehicleId + "/doc");
                out.add("vehicle", vehicle);

                Integer companyId = (Integer) rs.getObject("companyid");
                JsonObject company = new JsonObject();
                if (companyId != null) company.addProperty("companyId", companyId);
                else company.add("companyId", null);
                company.addProperty("companyName", rs.getString("companyname"));
                out.add("company", company);

                Integer driverId = (Integer) rs.getObject("driverid");
                if (driverId != null) {
                    JsonObject driver = new JsonObject();
                    driver.addProperty("driverId", driverId);
                    driver.addProperty("name", safeJoin(rs.getString("d_first"), rs.getString("d_last")));
                    driver.addProperty("email", rs.getString("d_email"));
                    driver.addProperty("phone", rs.getString("d_mobile"));
                    driver.addProperty("licenseNumber", rs.getString("licensenumber"));
                    out.add("driver", driver);
                } else {
                    out.add("driver", null);
                }

                JsonArray documents = new JsonArray();

                JsonObject regDoc = new JsonObject();
                regDoc.addProperty("key", "vehicle-registration");
                regDoc.addProperty("name", "Vehicle Registration Document");
                regDoc.addProperty("type", "document");
                regDoc.addProperty("url", req.getContextPath() + "/api/vehicles/" + vehicleId + "/doc");
                documents.add(regDoc);

                JsonObject imageDoc = new JsonObject();
                imageDoc.addProperty("key", "vehicle-image");
                imageDoc.addProperty("name", "Vehicle Image");
                imageDoc.addProperty("type", "image");
                imageDoc.addProperty("url", req.getContextPath() + "/api/vehicles/" + vehicleId + "/image");
                documents.add(imageDoc);

                out.add("documents", documents);

                resp.getWriter().write(gson.toJson(out));
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Server error loading booking details.\"}");
        }
    }

    private static void bindParams(PreparedStatement ps, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            Object p = params.get(i);
            if (p instanceof Integer) ps.setInt(i + 1, (Integer) p);
            else if (p instanceof Date) ps.setDate(i + 1, (Date) p);
            else ps.setString(i + 1, String.valueOf(p));
        }
    }

    private static int calculateDurationDays(Date s, Date e) {
        if (s == null || e == null) return 0;
        return (int) ((e.getTime() - s.getTime()) / (1000L * 60 * 60 * 24)) + 1;
    }

    private static String safeJoin(String a, String b) {
        String x = a == null ? "" : a.trim();
        String y = b == null ? "" : b.trim();
        return (x + " " + y).trim();
    }

    private static Integer parseNullableInt(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.isEmpty()) return null;
        try { return Integer.parseInt(t); } catch (Exception e) { return null; }
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