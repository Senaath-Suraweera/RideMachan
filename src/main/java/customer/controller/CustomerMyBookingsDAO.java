package customer.controller;

import common.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DAO for fetching a customer's bookings (active / upcoming / past).
 *
 * Category rules (computed in Java for timezone consistency):
 *   upcoming : now  < tripStart
 *   active   : tripStart <= now <= tripEnd
 *   past     : now  > tripEnd
 *
 * Unpaid bookings are ONLY surfaced in "upcoming". Any unpaid booking whose
 * category would be "active" or "past" has missed its payment window and is
 * excluded here — the frontend's auto-cancel call (or a scheduled job) handles
 * the actual DB update; we just don't show them to avoid confusion.
 */
public class CustomerMyBookingsDAO {

    public List<Map<String, Object>> getBookingsByCustomerId(int customerId) {
        List<Map<String, Object>> bookings = new ArrayList<>();

        String sql =
                "SELECT b.booking_id, b.ride_id, b.companyid, b.customerid, " +
                        "       b.vehicleid, b.vehicle_model, b.vehicle_plate, b.driverid, " +
                        "       b.trip_start_date, b.trip_end_date, b.start_time, b.end_time, " +
                        "       b.pickup_location, b.drop_location, b.special_instructions, " +
                        "       b.status, b.total_amount, b.payment_status, b.created_at, " +
                        "       d.firstname        AS driver_firstname, " +
                        "       d.lastname         AS driver_lastname, " +
                        "       d.mobilenumber     AS driver_phone, " +
                        "       d.totalrides       AS driver_totalrides, " +
                        "       d.ontimepercentage AS driver_ontime, " +
                        "       c.companyname      AS company_name, " +
                        "       c.phone            AS company_phone " +
                        "FROM companybookings b " +
                        "LEFT JOIN driver       d ON b.driverid  = d.driverid " +
                        "LEFT JOIN rentalcompany c ON b.companyid = c.companyid " +
                        "WHERE b.customerid = ? " +
                        "ORDER BY b.trip_start_date DESC, b.start_time DESC";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, customerId);

            try (ResultSet rs = ps.executeQuery()) {
                long nowMillis = System.currentTimeMillis();

                while (rs.next()) {
                    Map<String, Object> row = new HashMap<>();

                    row.put("bookingId",   rs.getInt("booking_id"));
                    row.put("rideId",      rs.getString("ride_id"));
                    row.put("companyId",   rs.getInt("companyid"));
                    // vehicleId — used by GetVehicleImageServlet and rebook flow
                    row.put("vehicleId",   rs.getInt("vehicleid"));
                    row.put("vehicleModel", rs.getString("vehicle_model"));
                    row.put("vehiclePlate", rs.getString("vehicle_plate"));

                    Date tripStartDate = rs.getDate("trip_start_date");
                    Date tripEndDate   = rs.getDate("trip_end_date");
                    Time startTime     = rs.getTime("start_time");
                    Time endTime       = rs.getTime("end_time");

                    // YYYY-MM-DD strings — used by front-end parseDateTimeMillis()
                    row.put("tripStartDate", tripStartDate != null ? tripStartDate.toString() : null);
                    row.put("tripEndDate",   tripEndDate   != null ? tripEndDate.toString()   : null);
                    row.put("startTime",     startTime     != null ? startTime.toString()     : null);
                    row.put("endTime",       endTime       != null ? endTime.toString()       : null);

                    row.put("pickupLocation", rs.getString("pickup_location"));
                    row.put("dropLocation",   rs.getString("drop_location"));
                    row.put("specialInstructions", rs.getString("special_instructions"));
                    row.put("status",        rs.getString("status"));
                    row.put("totalAmount",   rs.getDouble("total_amount"));
                    row.put("paymentStatus", rs.getString("payment_status"));

                    // ── Rental type ──────────────────────────────────────────
                    int driverId  = rs.getInt("driverid");
                    boolean hasDriver = !rs.wasNull();
                    row.put("rentalType", hasDriver ? "with-driver" : "self-drive");

                    // ── Driver info ──────────────────────────────────────────
                    if (hasDriver) {
                        String fn  = rs.getString("driver_firstname");
                        String ln  = rs.getString("driver_lastname");
                        String fullName = ((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim();
                        row.put("driverId",    driverId);
                        row.put("driverName",  fullName.isEmpty() ? "Driver" : fullName);
                        row.put("driverPhone", rs.getString("driver_phone"));
                        int onTime = rs.getInt("driver_ontime");
                        double rating = onTime > 0
                                ? Math.round((onTime / 20.0) * 10.0) / 10.0
                                : 4.5;
                        row.put("driverRating", rating);
                    } else {
                        row.put("driverId",    null);
                        row.put("driverName",  null);
                        row.put("driverPhone", null);
                        row.put("driverRating", null);
                    }

                    // ── Company info ─────────────────────────────────────────
                    row.put("companyName",  rs.getString("company_name"));
                    row.put("companyPhone", rs.getString("company_phone"));

                    // ── Category ─────────────────────────────────────────────
                    String category = computeCategory(
                            tripStartDate, startTime, tripEndDate, endTime, nowMillis);

                    // Unpaid bookings that have already become "active" or "past"
                    // should not be shown — they missed the payment window.
                    String paymentStatus = rs.getString("payment_status");
                    boolean isPaid = paymentStatus != null &&
                            paymentStatus.equalsIgnoreCase("paid");

                    if (!isPaid && ("active".equals(category) || "past".equals(category))) {
                        // Skip — will be auto-cancelled by frontend/scheduler
                        continue;
                    }

                    row.put("category", category);
                    bookings.add(row);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return bookings;
    }

    /**
     * upcoming : nowMillis <  startMillis
     * active   : startMillis <= nowMillis <= endMillis
     * past     : nowMillis >  endMillis
     */
    private String computeCategory(Date startDate, Time startTime,
                                   Date endDate,   Time endTime,
                                   long nowMillis) {
        if (startDate == null || endDate == null) return "upcoming";

        long startMillis = combine(startDate, startTime);
        long endMillis   = combine(endDate,   endTime);

        if (nowMillis < startMillis) return "upcoming";
        if (nowMillis > endMillis)   return "past";
        return "active";
    }

    private long combine(Date date, Time time) {
        long base = date.getTime();
        if (time != null) {
            long timePortion = time.getTime() % (24L * 60L * 60L * 1000L);
            if (timePortion < 0) timePortion += 24L * 60L * 60L * 1000L;
            return base + timePortion;
        }
        return base;
    }
}