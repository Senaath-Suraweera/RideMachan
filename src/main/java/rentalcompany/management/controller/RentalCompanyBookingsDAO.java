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

    public static List<RentalCompanyBookings> loadBookingsByCompanyId(int companyId) {

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
                "LEFT JOIN driver ON companybookings.driverid = driver.driverid\n" +
                "WHERE companybookings.companyid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);

            ResultSet rs = ps.executeQuery();

            while(rs.next()) {

                RentalCompanyBookings booking = new RentalCompanyBookings();


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

                booking.setPickupLocation(rs.getString("pickup_location"));
                booking.setDropLocation(rs.getString("drop_location"));



                AllBookings.add(booking); //pushing every booking into AllBookings List
            }


        } catch (Exception e) {
            e.printStackTrace();
        }

        return AllBookings;
    }

    public static List<RentalCompanyBookings> loadRecentBookingsByCompanyId(int companyId) {

        List<RentalCompanyBookings> RecentBookings = new ArrayList<>();
        String sql = "SELECT \n" +
                "    companybookings.trip_start_date,\n" +
                "    companybookings.trip_end_date,\n" +
                "    companybookings.status,\n" +
                "    companybookings.total_amount,\n" +
                "    customer.firstname AS customerFirstName,\n" +
                "    customer.lastname AS customerLastName,\n" +
                "    vehicle.vehiclebrand,\n" +
                "    vehicle.vehiclemodel,\n" +
                "    vehicle.numberplatenumber\n" +
                "FROM companybookings\n" +
                "LEFT JOIN customer ON companybookings.customerid = customer.customerid\n" +
                "LEFT JOIN vehicle ON companybookings.vehicleid = vehicle.vehicleid\n" +
                "LEFT JOIN driver ON companybookings.driverid = driver.driverid\n" +
                "WHERE companybookings.companyid = ?\n" +
                "ORDER BY companybookings.booked_date DESC\n" +
                "LIMIT 3";

        try(Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);

            ResultSet rs = ps.executeQuery();

            while(rs.next()) {

                RentalCompanyBookings booking = new RentalCompanyBookings();

                booking.setCompanyId(companyId);
                booking.setTripStartDate(rs.getDate("trip_start_date"));
                booking.setTripEndDate(rs.getDate("trip_end_date"));
                booking.setStatus(rs.getString("status"));
                booking.setTotalAmount(rs.getDouble("total_amount"));

                String firstName = rs.getString("customerFirstName");
                String lastName = rs.getString("customerLastName");
                booking.setCustomerName(firstName + " " + lastName);

                booking.setVehicleBrand(rs.getString("vehiclebrand"));
                booking.setVehicleModel(rs.getString("vehiclemodel"));
                booking.setNumberPlate(rs.getString("numberplatenumber"));

                RecentBookings.add(booking);

            }

        }catch (Exception e) {
            e.printStackTrace();
        }

        return RecentBookings;
    }

    public static int getActiveBookingsCount(int companyId) {

        int activeDriverCount = 0;

        String sql = "SELECT COUNT(*) FROM companybookings WHERE companyid = ? AND status = 'Active';";

        try(Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);

            ResultSet rs = ps.executeQuery();

            if(rs.next()) {
                activeDriverCount = rs.getInt(1);
            }

        }catch(Exception e) {
            e.printStackTrace();
        }


        return activeDriverCount;

    }
}