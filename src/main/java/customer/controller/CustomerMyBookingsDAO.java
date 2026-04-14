package customer.controller;

import common.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * DAO for fetching a customer's bookings (active / upcoming / past) for the
 * "My Bookings" page. Joins companybookings with driver and rentalcompany
 * so the frontend gets everything it needs in one call.
 */
public class CustomerMyBookingsDAO {

    /**
     * Returns all bookings for the given customer, newest first.
     * Each map contains flat key/value pairs ready to serialize to JSON.
     *
     * Category is computed in Java (not SQL) so timezone handling is consistent
     * with the app server:
     *   - active   : now is between (trip_start_date + start_time) and (trip_end_date + end_time)
     *   - upcoming : start is in the future
     *   - past     : end is in the past
     */
    public List<Map<String, Object>> getBookingsByCustomerId(int customerId) {
        List<Map<String, Object>> bookings = new ArrayList<>();

        String sql =
                "SELECT b.booking_id, b.ride_id, b.companyid, b.customerid, " +
                        "       b.vehicleid, b.vehicle_model, b.vehicle_plate, b.driverid, " +
                        "       b.trip_start_date, b.trip_end_date, b.start_time, b.end_time, " +
                        "       b.pickup_location, b.drop_location, b.special_instructions, " +
                        "       b.status, b.total_amount, b.payment_status, b.created_at, " +
                        "       d.firstname  AS driver_firstname, " +
                        "       d.lastname   AS driver_lastname, " +
                        "       d.mobilenumber AS driver_phone, " +
                        "       d.totalrides AS driver_totalrides, " +
                        "       d.ontimepercentage AS driver_ontime, " +
                        "       c.companyname AS company_name, " +
                        "       c.phone       AS company_phone " +
                        "FROM companybookings b " +
                        "LEFT JOIN driver d        ON b.driverid  = d.driverid " +
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

                    row.put("bookingId", rs.getInt("booking_id"));
                    row.put("rideId", rs.getString("ride_id"));
                    row.put("companyId", rs.getInt("companyid"));
                    row.put("vehicleId", rs.getInt("vehicleid"));
                    row.put("vehicleModel", rs.getString("vehicle_model"));
                    row.put("vehiclePlate", rs.getString("vehicle_plate"));

                    Date tripStartDate = rs.getDate("trip_start_date");
                    Date tripEndDate   = rs.getDate("trip_end_date");
                    Time startTime     = rs.getTime("start_time");
                    Time endTime       = rs.getTime("end_time");

                    row.put("tripStartDate", tripStartDate != null ? tripStartDate.toString() : null);
                    row.put("tripEndDate",   tripEndDate   != null ? tripEndDate.toString()   : null);
                    row.put("startTime",     startTime     != null ? startTime.toString()     : null);
                    row.put("endTime",       endTime       != null ? endTime.toString()       : null);

                    row.put("pickupLocation", rs.getString("pickup_location"));
                    row.put("dropLocation",   rs.getString("drop_location"));
                    row.put("specialInstructions", rs.getString("special_instructions"));
                    row.put("status",         rs.getString("status"));
                    row.put("totalAmount",    rs.getDouble("total_amount"));
                    row.put("paymentStatus",  rs.getString("payment_status"));

                    // ---- rental type ----
                    int driverId = rs.getInt("driverid");
                    boolean hasDriver = !rs.wasNull();
                    row.put("rentalType", hasDriver ? "with-driver" : "self-drive");

                    // ---- driver info ----
                    if (hasDriver) {
                        String fn = rs.getString("driver_firstname");
                        String ln = rs.getString("driver_lastname");
                        String fullName = ((fn != null ? fn : "") + " " + (ln != null ? ln : "")).trim();
                        row.put("driverId", driverId);
                        row.put("driverName", fullName.isEmpty() ? "Driver" : fullName);
                        row.put("driverPhone", rs.getString("driver_phone"));

                        // Derive a rating from on-time percentage (0-100) -> (0-5)
                        int onTime = rs.getInt("driver_ontime");
                        double rating = onTime > 0 ? Math.round((onTime / 20.0) * 10.0) / 10.0 : 4.5;
                        row.put("driverRating", rating);
                    } else {
                        row.put("driverId", null);
                        row.put("driverName", null);
                        row.put("driverPhone", null);
                        row.put("driverRating", null);
                    }

                    // ---- company info ----
                    row.put("companyName",  rs.getString("company_name"));
                    row.put("companyPhone", rs.getString("company_phone"));

                    // ---- category (active/upcoming/past) ----
                    row.put("category", computeCategory(tripStartDate, startTime, tripEndDate, endTime, nowMillis));

                    bookings.add(row);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return bookings;
    }

    private String computeCategory(Date startDate, Time startTime,
                                   Date endDate, Time endTime, long nowMillis) {
        if (startDate == null || endDate == null) return "upcoming";

        long startMillis = combine(startDate, startTime);
        long endMillis   = combine(endDate, endTime);

        if (nowMillis < startMillis) return "upcoming";
        if (nowMillis > endMillis)   return "past";
        return "active";
    }

    private long combine(Date date, Time time) {
        long base = date.getTime();
        if (time != null) {
            // Time#getTime() is millis since epoch on 1970-01-01 for the time-of-day,
            // so we just add the time-of-day portion (mod a day).
            long timePortion = time.getTime() % (24L * 60L * 60L * 1000L);
            if (timePortion < 0) timePortion += 24L * 60L * 60L * 1000L;
            return base + timePortion;
        }
        return base;
    }
}