package customer.controller;

import common.util.DBConnection;

import java.sql.*;

public class CustomerBookingDAO {

    /**
     * Inserts a new booking into the companybookings table.
     * Returns the generated ride_id on success, or null on failure.
     */
    public String createBooking(int companyId, int customerId, String customerName,
                                String customerPhone, String customerEmail,
                                int vehicleId, String vehicleModel, String vehiclePlate,
                                Integer driverId, String tripStartDate, String tripEndDate,
                                String startTime, String endTime,
                                int estimatedDuration, double distance,
                                String pickupLocation, String dropLocation,
                                String specialInstructions, String status,
                                double totalAmount, String paymentStatus) {

        // Generate unique ride ID: RID + timestamp-based number
        String rideId = "RID" + String.format("%05d", (int) (Math.random() * 99999));

        String sql = "INSERT INTO companybookings ("
                + "ride_id, companyid, customerid, customer_name, customer_phone, customer_email, "
                + "vehicleid, vehicle_model, vehicle_plate, driverid, "
                + "booked_Date, trip_start_date, trip_end_date, start_time, end_time, "
                + "estimated_duration, distance, pickup_location, drop_location, "
                + "special_instructions, status, total_amount, payment_status, created_at"
                + ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            int i = 1;
            ps.setString(i++, rideId);
            ps.setInt(i++, companyId);
            ps.setInt(i++, customerId);
            ps.setString(i++, customerName);
            ps.setString(i++, customerPhone);
            ps.setString(i++, customerEmail);
            ps.setInt(i++, vehicleId);
            ps.setString(i++, vehicleModel);
            ps.setString(i++, vehiclePlate);

            if (driverId != null) {
                ps.setInt(i++, driverId);
            } else {
                ps.setNull(i++, Types.INTEGER);
            }

            ps.setString(i++, tripStartDate);   // yyyy-MM-dd
            ps.setString(i++, tripEndDate);      // yyyy-MM-dd
            ps.setString(i++, startTime);        // HH:mm:ss
            ps.setString(i++, endTime);          // HH:mm:ss
            ps.setInt(i++, estimatedDuration);   // in minutes
            ps.setDouble(i++, distance);
            ps.setString(i++, pickupLocation);
            ps.setString(i++, dropLocation);
            ps.setString(i++, specialInstructions);
            ps.setString(i++, status);
            ps.setDouble(i++, totalAmount);
            ps.setString(i++, paymentStatus);

            ps.executeUpdate();
            return rideId;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    /**
     * Fetches the vehicle plate number from the vehicle table.
     */
    public String getVehiclePlate(int vehicleId) {
        String plate = "N/A";
        String sql = "SELECT numberplatenumber FROM vehicle WHERE vehicleid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, vehicleId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                plate = rs.getString("numberplatenumber");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return plate;
    }
}