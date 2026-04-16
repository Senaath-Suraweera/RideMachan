package customer.controller;

import java.sql.*;
import java.util.HashMap;
import java.util.Map;

public class CustomerBookingDetailsDAO {

    private final Connection connection;

    public CustomerBookingDetailsDAO(Connection connection) {
        this.connection = connection;
    }

    /**
     * Fetch full booking details for a given ride_id, but ONLY if the booking
     * belongs to the given customer. Returns null if not found / not authorized.
     */
    public Map<String, Object> getBookingDetails(String rideId, int customerId) throws SQLException {

        String sql =
                "SELECT " +
                        "  b.ride_id, b.status, b.pickup_location, b.drop_location, " +
                        "  b.vehicleid, " +    // ← needed for GetVehicleImageServlet
                        "  b.trip_start_date, b.trip_end_date, b.start_time, b.end_time, " +
                        "  b.estimated_duration, b.total_amount, b.payment_status, " +
                        "  b.vehicle_model, b.vehicle_plate, b.driverid, " +
                        "  v.vehiclebrand, v.vehiclemodel, v.vehicle_type, v.features, " +
                        "  v.numberofpassengers, " +
                        "  c.companyid AS company_id, c.companyname, c.phone AS company_phone, " +
                        "  c.companyemail, " +
                        "  d.driverid AS d_id, d.firstname AS d_firstname, d.lastname AS d_lastname, " +
                        "  d.mobilenumber AS d_phone, d.description AS d_description, " +
                        "  d.experience_years, d.totalrides, d.Area AS d_area " +
                        "FROM companybookings b " +
                        "LEFT JOIN vehicle      v ON b.vehicleid = v.vehicleid " +
                        "LEFT JOIN rentalcompany c ON b.companyid = c.companyid " +
                        "LEFT JOIN driver       d ON b.driverid  = d.driverid " +
                        "WHERE b.ride_id = ? AND b.customerid = ?";

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, rideId);
            ps.setInt(2, customerId);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;
                return mapRow(rs);
            }
        }
    }

    private Map<String, Object> mapRow(ResultSet rs) throws SQLException {

        Map<String, Object> out = new HashMap<>();

        // ── Core booking ─────────────────────────────
        out.put("id",     rs.getString("ride_id"));
        out.put("status", capitalize(rs.getString("status")));
        out.put("pickup", rs.getString("pickup_location"));
        out.put("dropoff", rs.getString("drop_location"));

        // ── vehicleId — needed by GetVehicleImageServlet and rebook ──
        int vehicleId = rs.getInt("vehicleid");
        if (!rs.wasNull()) {
            out.put("vehicleId", vehicleId);
        }

        // Dates / times
        Date startDate = rs.getDate("trip_start_date");
        Date endDate   = rs.getDate("trip_end_date");
        Time startTime = rs.getTime("start_time");
        Time endTime   = rs.getTime("end_time");

        out.put("pickupDate",  startDate != null ? formatDate(startDate) : "");
        out.put("dropoffDate", endDate   != null ? formatDate(endDate)   : "");
        out.put("pickupTime",  startTime != null ? formatTime(startTime) : "");
        out.put("dropoffTime", endTime   != null ? formatTime(endTime)   : "");

        out.put("paymentStatus", capitalize(rs.getString("payment_status")));

        // ── Vehicle ─────────────────────────────────
        String brand = rs.getString("vehiclebrand");
        String model = rs.getString("vehiclemodel");
        String vehicleFullName;
        if (brand != null && model != null) {
            vehicleFullName = brand + " " + model;
        } else {
            vehicleFullName = rs.getString("vehicle_model");
        }
        out.put("vehicle",          vehicleFullName);
        out.put("vehicleType",      rs.getString("vehicle_type"));
        out.put("vehiclePlate",     rs.getString("vehicle_plate"));
        out.put("vehicleFeatures",  rs.getString("features"));
        out.put("vehiclePassengers", rs.getObject("numberofpassengers"));

        // ── Rental type ─────────────────────────────
        int driverIdCol = rs.getInt("driverid");
        boolean hasDriver = !rs.wasNull();
        out.put("rentalType", hasDriver ? "with-driver" : "self-drive");

        // ── Company ─────────────────────────────────
        Map<String, Object> company = new HashMap<>();
        company.put("id",    rs.getObject("company_id"));
        company.put("name",  rs.getString("companyname"));
        company.put("phone", rs.getString("company_phone"));
        company.put("email", rs.getString("companyemail"));
        out.put("company", company);

        // ── Driver ──────────────────────────────────
        if (hasDriver) {
            Map<String, Object> driver = new HashMap<>();
            String fn  = rs.getString("d_firstname");
            String ln  = rs.getString("d_lastname");
            String fullName = ((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim();

            driver.put("id",         rs.getInt("d_id"));
            driver.put("name",       fullName);
            driver.put("initial",    initialsOf(fn, ln));
            driver.put("phone",      rs.getString("d_phone"));
            driver.put("bio",        rs.getString("d_description"));
            driver.put("experience", rs.getObject("experience_years"));
            driver.put("trips",      rs.getInt("totalrides"));
            driver.put("area",       rs.getString("d_area"));
            driver.put("rating",     null);
            driver.put("reviews",    null);
            driver.put("languages",  null);
            out.put("driver", driver);
        } else {
            out.put("driver", null);
        }

        // ── Cost breakdown ──────────────────────────
        double total = rs.getBigDecimal("total_amount") != null
                ? rs.getBigDecimal("total_amount").doubleValue() : 0.0;
        double serviceFee    = Math.round(total * 0.07);
        double driverCharges = hasDriver ? Math.round(total * 0.15) : 0.0;
        double baseFare      = total - serviceFee - driverCharges;

        out.put("amount",        total);
        out.put("baseFare",      baseFare);
        out.put("driverCharges", driverCharges);
        out.put("serviceFee",    serviceFee);

        return out;
    }

    // ── helpers ─────────────────────────────────────
    private static String formatDate(Date d) {
        java.util.Calendar cal = java.util.Calendar.getInstance();
        cal.setTime(d);
        return (cal.get(java.util.Calendar.MONTH) + 1) + "/" +
                cal.get(java.util.Calendar.DAY_OF_MONTH) + "/" +
                cal.get(java.util.Calendar.YEAR);
    }

    private static String formatTime(Time t) {
        String s = t.toString();
        return s.length() >= 5 ? s.substring(0, 5) : s;
    }

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return Character.toUpperCase(s.charAt(0)) + s.substring(1).toLowerCase();
    }

    private static String initialsOf(String fn, String ln) {
        StringBuilder sb = new StringBuilder();
        if (fn != null && !fn.isEmpty()) sb.append(Character.toUpperCase(fn.charAt(0)));
        if (ln != null && !ln.isEmpty()) sb.append(Character.toUpperCase(ln.charAt(0)));
        return sb.toString();
    }
}