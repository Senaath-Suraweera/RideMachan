package rentalcompany.management.controller;


import common.util.DBConnection;
import rentalcompany.management.model.RentalCompany;
import rentalcompany.management.model.RentalCompanyBookings;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import java.sql.*;

public class RentalCompanyBookingsDAO {

    public static List<RentalCompanyBookings> loadAllBookings() {

        List<RentalCompanyBookings> AllBookings = new ArrayList<>();
        String sql = "SELECT \n" +
                "    companybookings.*, \n" +
                "    customer.username AS customerName, \n" +
                "    customer.mobilenumber, \n" +
                "    customer.email, \n" +
                "    vehicle.vehiclebrand, \n" +
                "    vehicle.vehiclemodel, \n" +
                "    vehicle.numberplatenumber, \n" +
                "    driver.username AS driverName\n" +
                "FROM companybookings\n" +
                "LEFT JOIN customer ON companybookings.customerid = customer.customerid\n" +
                "LEFT JOIN vehicle ON companybookings.vehicleid = vehicle.vehicleid\n" +
                "LEFT JOIN driver ON companybookings.driverid = driver.driverid;\n";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ResultSet rs = ps.executeQuery();

            while(rs.next()) {

                RentalCompanyBookings booking = new RentalCompanyBookings();


                String pickupLocation = rs.getString("pickup_location");
                String dropLocation = rs.getString("drop_location");


                booking.setBookingId(rs.getInt("booking_id"));
                booking.setCompanyId(rs.getInt("companyid"));
                booking.setStatus(rs.getString("status"));
                booking.setTotalAmount(rs.getDouble("total_amount"));
                booking.setPaymentStatus(rs.getString("payment_status"));

                booking.setCustomerId(rs.getInt("customerid"));
                booking.setCustomerName(rs.getString("customerName"));
                booking.setCustomerPhoneNumber(rs.getString("mobilenumber"));
                booking.setCustomerEmail(rs.getString("email"));

                booking.setVehicleId(rs.getInt("vehicleid"));
                booking.setVehicleBrand(rs.getString("vehiclebrand"));
                booking.setVehicleModel(rs.getString("vehiclemodel"));
                booking.setNumberPlate(rs.getString("numberplatenumber"));

                booking.setDriverId(rs.getInt("driverid"));
                booking.setDriverName(rs.getString("driverName"));

                booking.setBookedDate(rs.getDate("booked_Date"));
                booking.setTripStartDate(rs.getDate("trip_start_date"));
                booking.setTripEndDate(rs.getDate("trip_end_date"));

                Time startTime = rs.getTime("start_time");
                Time endTime = rs.getTime("end_time");

                booking.setStartTimeStr(startTime != null ? startTime.toString() : null);
                booking.setEndTimeStr(endTime != null ? endTime.toString() : null);

                booking.setPickupLocation(pickupLocation);
                booking.setDropLocation(dropLocation);



                AllBookings.add(booking); //pushing every booking into AllBookings List
            }


        } catch (Exception e) {
            e.printStackTrace();
        }

        return AllBookings;
    }
}