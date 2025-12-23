package rentalcompany.management.controller;

import common.util.DBConnection;
import rentalcompany.management.model.RentalCompanyBookings;

import java.sql.*;


public class RentalCompanyBookingsDAO {

    public static RentalCompanyBookings DisplayBookingAccordingTOId(int bookingId){
        String sql = "SELECT * FROM companybookings WHERE booking_id=?";

        try(Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(sql)){

            ps.setInt(1,bookingId);

            ResultSet rs = ps.executeQuery();

            if(rs.next()){
                RentalCompanyBookings booking = new RentalCompanyBookings();
                booking.setBookingId(rs.getInt("booking_id"));
                booking.setStatus(rs.getString("status"));
                booking.setTotalAmount(rs.getDouble("total_amount"));

                return booking;
            } else {
                return null;
            }

        } catch (Exception e){
            e.printStackTrace();
            return null;
        }
    }
}
