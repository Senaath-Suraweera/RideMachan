package rentalcompany.management.controller;

import common.util.DBConnection;
import rentalcompany.management.model.RentalCompanyBookings;

import java.sql.*;

public class RentalCompanyBookingsDAO {

    public static RentalCompanyBookings DisplayBookingAccordingTOId(int bookingId){
        System.out.println("=== DisplayBookingAccordingTOId called with ID: " + bookingId + " ===");

        String sql = "SELECT * FROM companybookings WHERE booking_id=?";
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            System.out.println("Step 1: Getting database connection...");
            con = DBConnection.getConnection();

            if (con == null) {
                System.err.println("ERROR: Connection is NULL!");
                return null;
            }
            System.out.println("Step 2: Connection successful!");

            System.out.println("Step 3: Preparing statement...");
            ps = con.prepareStatement(sql);
            ps.setInt(1, bookingId);
            System.out.println("Step 4: Executing query: " + sql);

            rs = ps.executeQuery();
            System.out.println("Step 5: Query executed!");

            if (rs.next()) {
                System.out.println("Step 6: Record found!");
                RentalCompanyBookings booking = new RentalCompanyBookings();

                booking.setBookingId(rs.getInt("booking_id"));
                System.out.println("  - booking_id: " + booking.getBookingId());

                booking.setStatus(rs.getString("status"));
                System.out.println("  - status: " + booking.getStatus());

                booking.setTotalAmount(rs.getDouble("total_amount"));
                System.out.println("  - total_amount: " + booking.getTotalAmount());

                booking.setPaymentStatus(rs.getString("payment_status"));
                System.out.println("  - payment_status: " + booking.getPaymentStatus());

                System.out.println("Step 7: Returning booking object");
                return booking;
            } else {
                System.out.println("Step 6: No record found with booking_id = " + bookingId);
                return null;
            }

        } catch (NullPointerException e) {
            System.err.println("ERROR: NullPointerException occurred!");
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            return null;

        } catch (SQLException e) {
            System.err.println("ERROR: SQLException occurred!");
            System.err.println("SQL State: " + e.getSQLState());
            System.err.println("Error Code: " + e.getErrorCode());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            return null;

        } catch (Exception e) {
            System.err.println("ERROR: Unexpected exception occurred!");
            System.err.println("Exception type: " + e.getClass().getName());
            System.err.println("Message: " + e.getMessage());
            e.printStackTrace();
            return null;

        } finally {
            // Close resources
            try {
                if (rs != null) {
                    rs.close();
                    System.out.println("ResultSet closed");
                }
                if (ps != null) {
                    ps.close();
                    System.out.println("PreparedStatement closed");
                }
                if (con != null) {
                    con.close();
                    System.out.println("Connection closed");
                }
            } catch (SQLException e) {
                System.err.println("ERROR closing resources: " + e.getMessage());
            }
        }
    }
}