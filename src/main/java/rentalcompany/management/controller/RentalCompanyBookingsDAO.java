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

                int bookingId = rs.getInt("booking_id");
                int companyId = rs.getInt("companyid");
                String status = rs.getString("status");
                double totalAmount = rs.getDouble("total_amount");
                String paymentStatus = rs.getString("payment_status");

                int customerId = rs.getInt("customerid");
                String customerName = rs.getString("customerName");
                String customerPhoneNumber = rs.getString("mobilenumber");
                String customerEmail = rs.getString("email");

                int vehicleId = rs.getInt("vehicleid");
                String vehicleBrand = rs.getString("vehiclebrand");
                String vehicleModel = rs.getString("vehiclemodel");
                String numberPlate = rs.getString("numberplatenumber");

                int driverId = rs.getInt("driverid");
                String driverName = rs.getString("driverName");

                // Keep Dates as Date objects
                Date bookedDate = rs.getDate("booked_Date");
                Date tripStartDate = rs.getDate("trip_start_date");
                Date tripEndDate = rs.getDate("trip_end_date");

                Time startTime = rs.getTime("start_time");
                Time endTime = rs.getTime("end_time");


                booking.setStartTimeStr(startTime != null ? startTime.toString() : null);
                booking.setEndTimeStr(endTime != null ? endTime.toString() : null);

                String pickupLocation = rs.getString("pickup_location");
                String dropLocation = rs.getString("drop_location");


                booking.setBookingId(bookingId);
                booking.setCompanyId(companyId);
                booking.setStatus(status);
                booking.setTotalAmount(totalAmount);
                booking.setPaymentStatus(paymentStatus);

                booking.setCustomerId(customerId);
                booking.setCustomerName(customerName);
                booking.setCustomerPhoneNumber(customerPhoneNumber);
                booking.setCustomerEmail(customerEmail);

                booking.setVehicleId(vehicleId);
                booking.setVehicleBrand(vehicleBrand);
                booking.setVehicleModel(vehicleModel);
                booking.setNumberPlate(numberPlate);

                booking.setDriverId(driverId);
                booking.setDriverName(driverName);

                booking.setBookedDate(bookedDate);
                booking.setTripStartDate(tripStartDate);
                booking.setTripEndDate(tripEndDate);

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