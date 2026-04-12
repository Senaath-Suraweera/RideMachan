package rentalcompany.drivers.controller;

import common.util.DBConnection;
import common.util.PasswordServices;
import rentalcompany.drivers.model.Driver;
import rentalcompany.management.model.RentalCompanyBookings;
import rentalcompany.drivers.model.Issue;

import java.sql.*;
import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

public class DriverDAO {

    public static boolean insertDriver(Driver driver) {
        String sql = "INSERT INTO Driver (username, firstname, lastname, email, mobilenumber, description, " +
                "hashedpassword, salt, nicnumber, nic, driverslicense, company_id, Area, licenseexpirydate, licensenumber) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            String salt = PasswordServices.generateSalt();
            String hashedPassword = PasswordServices.hashPassword(driver.getPassword(), salt);

            ps.setString(1, driver.getUsername());
            ps.setString(2, driver.getFirstName());
            ps.setString(3, driver.getLastName());
            ps.setString(4, driver.getEmail());
            ps.setString(5, driver.getMobileNumber());
            ps.setString(6, driver.getDescription());
            ps.setString(7, hashedPassword);
            ps.setString(8, salt);
            ps.setString(9, driver.getNicNumber());
            ps.setBytes(10, driver.getNicPdf());
            ps.setBytes(11, driver.getDriversLicence());
            ps.setInt(12, driver.getCompanyId());
            ps.setString(13, driver.getArea());

            if(driver.getLicenceExpiration() != null){
                ps.setDate(14, new java.sql.Date(driver.getLicenceExpiration().getTime()));
            } else {
                ps.setDate(14, null);
            }

            ps.setString(15, driver.getDriverLicenceNumber());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }



    public static List<Driver> loadAllDriversByCompanyId(int companyId) {

        List<Driver> drivers = new ArrayList<>();
        String sql = "SELECT \n" +
                "    driver.driverid, \n" +
                "    driver.firstname, \n" +
                "    driver.lastname, \n" +
                "    driver.status, \n" +
                "    driver.Area, \n" +
                "    driver.licensenumber, \n" +
                "    driver.mobilenumber, \n" +
                "    driver.licenseexpirydate, \n" +
                "    ROUND(AVG(ratings.rating_value)) AS rating_value \n" +
                "FROM driver \n" +
                "LEFT JOIN ratings \n" +
                "    ON driver.driverid = ratings.actor_id \n" +
                "    AND ratings.actor_type = 'DRIVER' \n" +
                "WHERE driver.company_id = ? \n" +
                "GROUP BY " +
                "driver.driverid, " +
                "driver.firstname, " +
                "driver.lastname, " +
                "driver.status, " +
                "driver.Area, " +
                "driver.licensenumber, " +
                "driver.mobilenumber, " +
                "driver.licenseexpirydate";


        try(Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);

            ResultSet rs = ps.executeQuery();

            while(rs.next()) {

                Driver driver = new Driver(

                        rs.getInt("driverid"),
                        rs.getString("firstname"),
                        rs.getString("lastname"),
                        rs.getString("status"),
                        rs.getInt("rating_value"),
                        rs.getString("Area"),
                        rs.getString("licensenumber"),
                        rs.getString("mobilenumber"),
                        rs.getDate("licenseexpirydate")

                );

                List<RentalCompanyBookings> activeBookings = getActiveBookingsByDriverId(driver.getDriverId());
                driver.setBookings(activeBookings);

                drivers.add(driver);

            }

        }catch(Exception e) {
            e.printStackTrace();
        }

        return drivers;
    }

    public static Driver loginDriver(String email, String password) {

        String sql = "SELECT * FROM Driver WHERE email = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                String storedHash = rs.getString("hashedpassword");
                String storedSalt = rs.getString("salt");

                // ===== DEBUGGING OUTPUT =====
                System.out.println("Input Password: " + password);
                System.out.println("Stored Salt: " + storedSalt);
                System.out.println("Stored Hash: " + storedHash);

                // Compute hash from input password + stored salt
                String hashedInput = PasswordServices.hashPassword(password, storedSalt);
                System.out.println("Hashed Input: " + hashedInput);

                if (PasswordServices.verifyPassword(password, storedSalt, storedHash)) {
                    System.out.println("hello");
                    Driver d = new Driver(rs.getString("username"), null);
                    d.setDriverId(rs.getInt("driverid"));
                    d.setFirstName(rs.getString("firstname"));
                    d.setLastName(rs.getString("lastname"));
                    d.setEmail(rs.getString("email"));
                    d.setMobileNumber(rs.getString("mobilenumber"));
                    d.setDescription(rs.getString("description"));
                    d.setCompanyId(rs.getInt("company_id"));
                    return d;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;

    }

    public static int getActiveDriversCount(int companyId) {

        int count = 0;
        String sql = "SELECT COUNT(*) FROM driver WHERE company_id = ? AND status = 'Available'";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {  // Only one row for COUNT(*)
                count = rs.getInt(1); // get the actual count
            }

        }catch(Exception e) {
            e.printStackTrace();
        }

        return count;
    }

    public static List<RentalCompanyBookings> getActiveBookingsByDriverId(int driverId) {

        List<RentalCompanyBookings> bookings = new ArrayList<>();
        String sql = "SELECT * FROM companybookings WHERE driverid=? AND status='active'";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                RentalCompanyBookings booking = new RentalCompanyBookings();
                booking.setBookingId(rs.getInt("booking_id"));
                booking.setRideId(rs.getString("ride_id"));
                booking.setCustomerName(rs.getString("customer_name"));
                booking.setVehicleModel(rs.getString("vehicle_model"));
                booking.setTripStartDate(rs.getDate("trip_start_date"));
                booking.setTripEndDate(rs.getDate("trip_end_date"));

                // Correct column names
                booking.setStartTimeStr(rs.getString("start_time"));
                booking.setEndTimeStr(rs.getString("end_time"));

                booking.setPickupLocation(rs.getString("pickup_location"));
                booking.setDropLocation(rs.getString("drop_location"));
                booking.setStatus(rs.getString("status"));

                bookings.add(booking);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return bookings;
    }






















    //pevindi's part



    // Get complete driver profile with company details
    public static Driver getDriverProfile(int driverId) {

        String sql = "SELECT d.*, c.companyname as company_name " +
                     "FROM driver d " +
                     "LEFT JOIN rentalcompany c ON d.company_id = c.companyid " +
                     "WHERE d.driverid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {

                Driver driver = new Driver();
                driver.setDriverId(rs.getInt("driverid"));
                driver.setUsername(rs.getString("username"));
                driver.setFirstName(rs.getString("firstname"));
                driver.setLastName(rs.getString("lastname"));
                driver.setEmail(rs.getString("email"));
                driver.setMobileNumber(rs.getString("mobilenumber"));
                driver.setDescription(rs.getString("description"));
                driver.setNicNumber(rs.getString("nicnumber"));
                driver.setCompanyId(rs.getInt("company_id"));


                driver.setHomeAddress(getStringOrNull(rs, "homeaddress"));
                driver.setDriverLicenceNumber(getStringOrNull(rs, "licensenumber"));
                driver.setArea(getStringOrNull(rs, "assignedarea"));
                driver.setShiftTime(getStringOrNull(rs, "shifttime"));
                driver.setReportingManager(getStringOrNull(rs, "reportingmanager"));
                driver.setProfilePicture(getStringOrNull(rs, "profilepicture"));
                driver.setStatus(getStringOrNull(rs, "availability"));

                // Date field
                try {
                    driver.setJoinedDate(rs.getDate("joineddate"));
                } catch (SQLException e) {
                    // Column doesn't exist or is null
                }

                // Company name from join
                driver.setCompanyName(rs.getString("company_name"));

                return driver;

            }

        } catch (Exception e) {

            e.printStackTrace();

        }

        return null;

    }


    // Helper method to safely get string values
    private static String getStringOrNull(ResultSet rs, String columnName) {

        try {
            return rs.getString(columnName);
        } catch (SQLException e) {
            return null;
        }

    }

    // Update driver profile with all editable fields
    public static boolean updateDriverProfile(Driver driver) {

        if (driver.getFirstName() == null &&
                driver.getLastName() == null &&
                driver.getEmail() == null &&
                driver.getMobileNumber() == null &&
                driver.getHomeAddress() == null &&
                driver.getDriverLicenceNumber() == null &&
                driver.getNicNumber() == null &&
                driver.getDescription() == null &&
                driver.getProfilePicture() == null) {

            return false;
        }


        StringBuilder sql = new StringBuilder("UPDATE Driver SET ");
        boolean first = true;

        if (driver.getFirstName() != null) {
            sql.append("firstname=?");
            first = false;
        }
        if (driver.getLastName() != null) {
            if (!first) sql.append(", ");
            sql.append("lastname=?");
            first = false;
        }
        if (driver.getEmail() != null) {
            if (!first) sql.append(", ");
            sql.append("email=?");
            first = false;
        }
        if (driver.getMobileNumber() != null) {
            if (!first) sql.append(", ");
            sql.append("mobilenumber=?");
            first = false;
        }
        if (driver.getHomeAddress() != null) {
            if (!first) sql.append(", ");
            sql.append("homeaddress=?");
            first = false;
        }
        if (driver.getDriverLicenceNumber() != null) {
            if (!first) sql.append(", ");
            sql.append("licensenumber=?");
            first = false;
        }
        if (driver.getNicNumber() != null) {
            if (!first) sql.append(", ");
            sql.append("nicnumber=?");
            first = false;
        }
        if (driver.getDescription() != null) {
            if (!first) sql.append(", ");
            sql.append("description=?");
            first = false;
        }
        if (driver.getProfilePicture() != null) {
            if (!first) sql.append(", ");
            sql.append("profilepicture=?");
            first = false;
        }

        sql.append(" WHERE driverid=?");

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql.toString())) {

            int paramIndex = 1;

            if (driver.getFirstName() != null) {
                ps.setString(paramIndex++, driver.getFirstName());
            }
            if (driver.getLastName() != null) {
                ps.setString(paramIndex++, driver.getLastName());
            }
            if (driver.getEmail() != null) {
                ps.setString(paramIndex++, driver.getEmail());
            }
            if (driver.getMobileNumber() != null) {
                ps.setString(paramIndex++, driver.getMobileNumber());
            }
            if (driver.getHomeAddress() != null) {
                ps.setString(paramIndex++, driver.getHomeAddress());
            }
            if (driver.getDriverLicenceNumber() != null) {
                ps.setString(paramIndex++, driver.getDriverLicenceNumber());
            }
            if (driver.getNicNumber() != null) {
                ps.setString(paramIndex++, driver.getNicNumber());
            }
            if (driver.getDescription() != null) {
                ps.setString(paramIndex++, driver.getDescription());
            }
            if (driver.getProfilePicture() != null) {
                ps.setString(paramIndex++, driver.getProfilePicture());
            }

            ps.setInt(paramIndex, driver.getDriverId());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    // ==========================================
    // Dashboard Statistics Methods
    // ==========================================

    // Get monthly income for driver
    public static double getMonthlyIncome(int driverId) {

        String sql = "SELECT COALESCE(SUM(total_amount), 0) as monthly_income " +
                "FROM companybookings WHERE driverid = ? AND " +
                "MONTH(booked_Date) = MONTH(CURRENT_DATE) AND " +
                "YEAR(booked_Date) = YEAR(CURRENT_DATE) AND " +
                "status = 'completed'";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getDouble("monthly_income");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0.0;

    }

    // Get weekly bookings count
    public static int getWeeklyBookings(int driverId) {

        String sql = "SELECT COUNT(*) as weekly_bookings " +
                "FROM companybookings WHERE driverid = ? AND " +
                "WEEK(booked_Date) = WEEK(CURRENT_DATE) AND " +
                "YEAR(booked_Date) = YEAR(CURRENT_DATE)";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt("weekly_bookings");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;

    }

    // Get daily driving hours
    public static double getDailyHours(int driverId) {

        String sql = "SELECT COALESCE(SUM(TIMESTAMPDIFF(HOUR, start_time, end_time)), 0) as daily_hours " +
                "FROM companybookings WHERE driverid = ? AND " +
                "DATE(booked_Date) = CURRENT_DATE AND " +
                "status IN ('completed', 'ongoing')";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getDouble("daily_hours");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0.0;

    }

    // Get booking summary (completed, pending, cancelled, total)
    public static Map<String, Integer> getBookingSummary(int driverId) {

        String sql = "SELECT " +
                "SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed, " +
                "SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending, " +
                "SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled, " +
                "COUNT(*) as total " +
                "FROM companybookings WHERE driverid = ? AND " +
                "MONTH(booked_Date) = MONTH(CURRENT_DATE) AND " +
                "YEAR(booked_Date) = YEAR(CURRENT_DATE)";

        Map<String, Integer> summary = new HashMap<>();

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                summary.put("completed", rs.getInt("completed"));
                summary.put("pending", rs.getInt("pending"));
                summary.put("cancelled", rs.getInt("cancelled"));
                summary.put("total", rs.getInt("total"));
            } else {
                summary.put("completed", 0);
                summary.put("pending", 0);
                summary.put("cancelled", 0);
                summary.put("total", 0);
            }

        } catch (Exception e) {
            e.printStackTrace();
            summary.put("completed", 0);
            summary.put("pending", 0);
            summary.put("cancelled", 0);
            summary.put("total", 0);
        }

        return summary;

    }

    // Get monthly income chart data (last 7 months)
    public static int[] getMonthlyIncomeChart(int driverId) {

        String sql = "SELECT MONTH(booked_Date) as month, " +
                "COALESCE(SUM(total_amount), 0) as income " +
                "FROM companybookings WHERE driverid = ? AND " +
                "booked_Date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 MONTH) AND " +
                "status = 'completed' " +
                "GROUP BY MONTH(booked_Date) ORDER BY month";

        int[] data = new int[7];

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            int index = 0;
            while (rs.next() && index < 7) {
                data[index++] = rs.getInt("income");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return data;

    }

    // Get weekly bookings chart data (last 7 days)
    public static int[] getWeeklyBookingsChart(int driverId) {

        String sql = "SELECT DATE(booked_Date) as date, COUNT(*) as bookings " +
                "FROM companybookings WHERE driverid = ? AND " +
                "booked_Date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY) " +
                "GROUP BY DATE(booked_Date) ORDER BY date";

        int[] data = new int[7];

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            int index = 0;
            while (rs.next() && index < 7) {
                data[index++] = rs.getInt("bookings");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return data;

    }

    // Get daily hours chart data (last 7 days)
    public static int[] getDailyHoursChart(int driverId) {

        String sql = "SELECT DATE(booked_Date) as date, " +
                "COALESCE(SUM(TIMESTAMPDIFF(HOUR, start_time, end_time)), 0) as hours " +
                "FROM companybookings WHERE driverid = ? AND " +
                "booked_Date >= DATE_SUB(CURRENT_DATE, INTERVAL 7 DAY) AND " +
                "status IN ('completed', 'ongoing') " +
                "GROUP BY DATE(booked_Date) ORDER BY date";

        int[] data = new int[7];

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            int index = 0;
            while (rs.next() && index < 7) {
                data[index++] = rs.getInt("hours");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return data;

    }

    // Get notification count for driver
    public static int getNotificationCount(int driverId) {

        String sql = "SELECT COUNT(*) as count FROM Notification " +
                "WHERE driver_id = ? AND is_read = 0";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt("count");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;

    }

    // Get message count for driver
    public static int getMessageCount(int driverId) {

        String sql = "SELECT COUNT(*) as count FROM Message " +
                "WHERE receiver_id = ? AND receiver_type = 'driver' AND is_read = 0";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt("count");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;

    }

    // ==========================================
    // Calendar View Methods
    // ==========================================

    public static Driver getDriverById(int driverId) {

        String sql = "SELECT d.*, c.companyname as company_name " +
                "FROM Driver d " +
                "LEFT JOIN RentalCompany c ON d.company_id = c.companyid " +
                "WHERE d.driverid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                Driver driver = new Driver();

                // Basic fields
                driver.setDriverId(rs.getInt("driverid"));
                driver.setUsername(rs.getString("username"));
                driver.setFirstName(rs.getString("firstname"));
                driver.setLastName(rs.getString("lastname"));
                driver.setEmail(rs.getString("email"));
                driver.setMobileNumber(rs.getString("mobilenumber"));
                driver.setDescription(rs.getString("description"));
                driver.setNicNumber(rs.getString("nicnumber"));
                driver.setCompanyId(rs.getInt("company_id"));

                // Company name from join
                driver.setCompanyName(rs.getString("company_name"));

                // Optional fields - safely retrieve
                driver.setDriverLicenceNumber(getStringOrNull(rs, "licensenumber"));
                driver.setHomeAddress(getStringOrNull(rs, "homeaddress"));
                driver.setArea(getStringOrNull(rs, "Area"));
                driver.setShiftTime(getStringOrNull(rs, "shifttime"));
                driver.setReportingManager(getStringOrNull(rs, "reportingmanager"));
                driver.setProfilePicture(getStringOrNull(rs, "profilepicture"));
                driver.setStatus(getStringOrNull(rs, "status"));

                // Date field
                try {
                    driver.setJoinedDate(rs.getDate("joineddate"));
                } catch (SQLException e) {
                    // Column doesn't exist or is null
                    driver.setJoinedDate(null);
                }

                return driver;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;

    }


    public static boolean updateDriverAvailability(int driverId, String availability) {

        // First check if availability column exists
        String checkColumnSql = "SHOW COLUMNS FROM Driver LIKE 'status'";
        String updateSql = "UPDATE Driver SET status = ? WHERE driverid = ?";

        try (Connection con = DBConnection.getConnection()) {

            // Check if column exists
            try (PreparedStatement checkPs = con.prepareStatement(checkColumnSql);
                 ResultSet rs = checkPs.executeQuery()) {

                if (!rs.next()) {
                    // Column doesn't exist, create it
                    try (Statement stmt = con.createStatement()) {
                        stmt.executeUpdate("ALTER TABLE Driver ADD COLUMN status VARCHAR(20) DEFAULT 'available'");
                        System.out.println("Availability column created successfully");
                    }

                }

            }

            // Now update the availability
            try (PreparedStatement ps = con.prepareStatement(updateSql)) {
                ps.setString(1, availability);
                ps.setInt(2, driverId);
                return ps.executeUpdate() > 0;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;

    }

    // ==========================================
    // Booking Management Methods (INTEGRATED)
    // ==========================================

    public static List<RentalCompanyBookings> getOngoingBookings(int driverId) {

        List<RentalCompanyBookings> bookings = new ArrayList<>();

        try (Connection con = DBConnection.getConnection()) {

            // =========================
            // STEP 1: FETCH ACTIVE BOOKINGS
            // =========================
            String sql1 =
                    "SELECT * FROM companybookings " +
                            "WHERE driverid = ? AND status = 'active'";

            PreparedStatement ps1 = con.prepareStatement(sql1);
            ps1.setInt(1, driverId);

            ResultSet rs = ps1.executeQuery();

            while (rs.next()) {

                RentalCompanyBookings booking = new RentalCompanyBookings();

                int bookingId = rs.getInt("booking_id");

                booking.setBookingId(bookingId);
                booking.setRideId(rs.getString("ride_id"));
                booking.setDriverId(rs.getInt("driverid"));

                booking.setCustomerName(rs.getString("customer_name"));
                booking.setCustomerPhoneNumber(rs.getString("customer_phone"));
                booking.setCustomerEmail(rs.getString("customer_email"));

                booking.setPickupLocation(rs.getString("pickup_location"));
                booking.setDropLocation(rs.getString("drop_location"));

                booking.setTripStartDate(rs.getDate("trip_start_date"));
                booking.setStartTimeStr(rs.getTime("start_time").toString());

                booking.setEstimatedDuration(rs.getInt("estimated_duration"));
                booking.setDistance(rs.getDouble("distance"));
                booking.setTotalAmount(rs.getDouble("total_amount"));

                // IMPORTANT: always send frontend status as upcoming
                booking.setStatus("upcoming");

                booking.setVehicleModel(rs.getString("vehicle_model"));
                booking.setNumberPlate(rs.getString("vehicle_plate"));

                booking.setSpecialInstructions(rs.getString("special_instructions"));
                booking.setCreatedAt(rs.getTimestamp("created_at"));

                bookings.add(booking);

                // =========================
                // STEP 2: INSERT INTO STATUS TABLE
                // =========================
                String sql2 =
                        "INSERT INTO driver_booking_status (booking_id, driverid, status) " +
                                "VALUES (?, ?, 'upcoming')";

                PreparedStatement ps2 = con.prepareStatement(sql2);
                ps2.setInt(1, bookingId);
                ps2.setInt(2, driverId);

                int rows = ps2.executeUpdate();

                System.out.println("Inserted rows: " + rows + " for bookingId: " + bookingId);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return bookings;
    }

    public static RentalCompanyBookings getBookingByRideId(String rideId) {

        String sql = "SELECT * FROM companybookings WHERE ride_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, rideId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                RentalCompanyBookings booking = new RentalCompanyBookings();
                booking.setBookingId(rs.getInt("booking_id"));
                booking.setRideId(rs.getString("ride_id"));
                booking.setDriverId(rs.getInt("driverid"));
                booking.setCustomerName(rs.getString("customer_name"));
                booking.setCustomerPhoneNumber(rs.getString("customer_phone"));
                booking.setCustomerEmail(rs.getString("customer_email"));
                booking.setPickupLocation(rs.getString("pickup_location"));
                booking.setDropLocation(rs.getString("drop_location"));
                booking.setBookedDate(rs.getDate("booked_Date"));
                booking.setBookingTime(rs.getTime("start_time"));
                booking.setEstimatedDuration(rs.getInt("estimated_duration"));
                booking.setDistance(rs.getDouble("distance"));
                booking.setTotalAmount(rs.getDouble("total_amount"));
                booking.setStatus(rs.getString("status"));
                booking.setVehicleModel(rs.getString("vehicle_model"));
                booking.setNumberPlate(rs.getString("vehicle_plate"));
                booking.setSpecialInstructions(rs.getString("special_instructions"));
                booking.setCreatedAt(rs.getTimestamp("created_at"));

                return booking;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;

    }


    public static boolean updateBookingStatus(String rideId, String newStatus, int driverId) {

        String sql = "UPDATE companybookings SET status = ? WHERE ride_id = ? AND driverid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, newStatus);
            ps.setString(2, rideId);
            ps.setInt(3, driverId);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;

    }


    public static boolean createBooking(RentalCompanyBookings booking) {

        String sql = "INSERT INTO companybookings (ride_id, driverid, customer_name, customer_phone, " +
                "customer_email, pickup_location, drop_location, booked_Date, start_time, " +
                "estimated_duration, distance, total_amount, status, vehicle_model, vehicle_plate, " +
                "special_instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, booking.getRideId());
            ps.setInt(2, booking.getDriverId());
            ps.setString(3, booking.getCustomerName());
            ps.setString(4, booking.getCustomerPhoneNumber());
            ps.setString(5, booking.getCustomerEmail());
            ps.setString(6, booking.getPickupLocation());
            ps.setString(7, booking.getDropLocation());

            java.sql.Date sqlBookedDate = null;

            if (booking.getBookedDate() != null) {
                sqlBookedDate = new java.sql.Date(booking.getBookedDate().getTime());
            }

            ps.setDate(8, sqlBookedDate);
            ps.setTime(9, booking.getBookingTime());
            ps.setInt(10, booking.getEstimatedDuration());
            ps.setDouble(11, booking.getDistance());
            ps.setDouble(12, booking.getTotalAmount());
            ps.setString(13, booking.getStatus());
            ps.setString(14, booking.getVehicleModel());
            ps.setString(15, booking.getNumberPlate());
            ps.setString(16, booking.getSpecialInstructions());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;

    }


    public static boolean deleteBooking(String rideId, int driverId) {

        String sql = "DELETE FROM companybookings WHERE ride_id = ? AND driverid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, rideId);
            ps.setInt(2, driverId);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;

    }


    public static int getOngoingBookingsCount(int driverId) {

        String sql = "SELECT COUNT(*) as count FROM companybookings WHERE driverid = ? " +
                "AND status IN ('upcoming', 'in-progress')";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt("count");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return 0;

    }
        // ==========================================
        // Issue Reporting Methods
        // ==========================================


    public static int createIssue(Issue issue) {

        String sql = "INSERT INTO Issue (driver_id, category, location, description, " +
                "booking_id, plate_number, photo_path, is_driveable, status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, issue.getDriverId());
            ps.setString(2, issue.getCategory());
            ps.setString(3, issue.getLocation());
            ps.setString(4, issue.getDescription());
            ps.setString(5, issue.getBookingId());
            ps.setString(6, issue.getPlateNumber());
            ps.setString(7, issue.getPhotoPath());

            if (issue.getIsDriveable() != null) {
                ps.setBoolean(8, issue.getIsDriveable());
            } else {
                ps.setNull(8, Types.BOOLEAN);
            }

            ps.setString(9, issue.getStatus() != null ? issue.getStatus() : "pending");

            if (ps.executeUpdate() > 0) {
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) {
                        return keys.getInt(1);
                    }
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return -1;

    }



    public static List<Issue> getIssuesByDriverId(int driverId) {

        String sql = "SELECT * FROM Issue WHERE driver_id = ? ORDER BY created_at DESC";
        List<Issue> issues = new ArrayList<>();

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                Issue issue = new Issue();
                issue.setIssueId(rs.getInt("issue_id"));
                issue.setDriverId(rs.getInt("driver_id"));
                issue.setCategory(rs.getString("category"));
                issue.setLocation(rs.getString("location"));
                issue.setDescription(rs.getString("description"));
                issue.setBookingId(rs.getString("booking_id"));
                issue.setPlateNumber(rs.getString("plate_number"));
                issue.setPhotoPath(rs.getString("photo_path"));

                Boolean driveable = rs.getBoolean("is_driveable");
                if (!rs.wasNull()) issue.setIsDriveable(driveable);

                issue.setStatus(rs.getString("status"));
                issue.setCreatedAt(rs.getTimestamp("created_at"));
                issue.setUpdatedAt(rs.getTimestamp("updated_at"));

                issues.add(issue);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return issues;

    }


    public static Issue getIssueById(int issueId, int driverId) {

        String sql = "SELECT * FROM Issue WHERE issue_id = ? AND driver_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, issueId);
            ps.setInt(2, driverId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                Issue issue = new Issue();
                issue.setIssueId(rs.getInt("issue_id"));
                issue.setDriverId(rs.getInt("driver_id"));
                issue.setCategory(rs.getString("category"));
                issue.setLocation(rs.getString("location"));
                issue.setDescription(rs.getString("description"));
                issue.setBookingId(rs.getString("booking_id"));
                issue.setPlateNumber(rs.getString("plate_number"));
                issue.setPhotoPath(rs.getString("photo_path"));

                Boolean driveable = rs.getBoolean("is_driveable");
                if (!rs.wasNull()) issue.setIsDriveable(driveable);

                issue.setStatus(rs.getString("status"));
                issue.setCreatedAt(rs.getTimestamp("created_at"));
                issue.setUpdatedAt(rs.getTimestamp("updated_at"));

                return issue;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;

    }

    /**
     * Update issue status
     */
    public static boolean updateIssueStatus(int issueId, int driverId, String status) {
        String sql = "UPDATE Issue SET status = ? WHERE issue_id = ? AND driver_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, status);
            ps.setInt(2, issueId);
            ps.setInt(3, driverId);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }


    public static boolean deleteIssue(int issueId, int driverId) {

        String sql = "DELETE FROM Issue WHERE issue_id = ? AND driver_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, issueId);
            ps.setInt(2, driverId);
            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;

    }


    public static Map<String, Integer> getIssueCountByStatus(int driverId) {

        String sql = "SELECT status, COUNT(*) count FROM Issue WHERE driver_id = ? GROUP BY status";
        Map<String, Integer> counts = new HashMap<>();
        counts.put("pending", 0);
        counts.put("resolved", 0);
        counts.put("in-progress", 0);

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                counts.put(rs.getString("status"), rs.getInt("count"));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return counts;

    }


    // =====================================
    // Past Bookings Methods
    // =====================================

    public static List<RentalCompanyBookings> getPastBookings(int driverId, String dateRange, String status, String searchQuery) {

        StringBuilder sql = new StringBuilder();
        sql.append("SELECT * FROM companybookings WHERE driverid = ? ");
        sql.append("AND status IN ('completed', 'cancelled') ");

        if (dateRange != null && !dateRange.equals("all")) {
            switch (dateRange) {
                case "today":
                    sql.append("AND DATE(booked_Date) = CURDATE() ");
                    break;
                case "week":
                    sql.append("AND booked_Date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ");
                    break;
                case "month":
                    sql.append("AND booked_Date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH) ");
                    break;
                case "year":
                    sql.append("AND booked_Date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR) ");
                    break;
            }
        }

        if (status != null && !status.equals("all")) {
            sql.append("AND status = ? ");
        }

        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            sql.append("AND (customer_name LIKE ? OR ride_id LIKE ?) ");
        }

        sql.append("ORDER BY booked_Date DESC, start_time DESC");

        List<RentalCompanyBookings> bookings = new ArrayList<>();

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql.toString())) {

            int index = 1;
            ps.setInt(index++, driverId);

            if (status != null && !status.equals("all")) {
                ps.setString(index++, status);
            }

            if (searchQuery != null && !searchQuery.trim().isEmpty()) {
                String pattern = "%" + searchQuery + "%";
                ps.setString(index++, pattern);
                ps.setString(index++, pattern);
            }

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                RentalCompanyBookings booking = new RentalCompanyBookings();
                booking.setBookingId(rs.getInt("booking_id"));
                booking.setRideId(rs.getString("ride_id"));
                booking.setDriverId(rs.getInt("driverid"));

                booking.setCustomerName(rs.getString("customer_name"));
                booking.setCustomerPhoneNumber(rs.getString("customer_phone"));
                booking.setCustomerEmail(rs.getString("customer_email"));

                booking.setPickupLocation(rs.getString("pickup_location"));
                booking.setDropLocation(rs.getString("drop_location"));

                booking.setBookedDate(rs.getDate("booked_Date"));
                booking.setBookingTime(rs.getTime("start_time"));

                booking.setEstimatedDuration(rs.getInt("estimated_duration"));
                booking.setDistance(rs.getDouble("distance"));
                booking.setTotalAmount(rs.getDouble("total_amount"));
                booking.setStatus(rs.getString("status"));

                booking.setVehicleModel(rs.getString("vehicle_model"));
                booking.setNumberPlate(rs.getString("vehicle_plate"));
                booking.setSpecialInstructions(rs.getString("special_instructions"));

                try {
                    booking.setCreatedAt(rs.getTimestamp("created_at"));
                } catch (SQLException ignored) {}

                bookings.add(booking);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return bookings;
    }


    /**
     * Get past bookings statistics
     */
    public static Map<String, Integer> getPastBookingsStats(int driverId) {

        String sql = "SELECT " +
                "SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed, " +
                "SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled, " +
                "COALESCE(SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END), 0) as revenue, " +
                "0 as avgRating " +
                "FROM companybookings WHERE driverid = ? " +
                "AND status IN ('completed', 'cancelled')";

        Map<String, Integer> stats = new HashMap<>();
        stats.put("completed", 0);
        stats.put("cancelled", 0);
        stats.put("revenue", 0);
        stats.put("avgRating", 0);

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                stats.put("completed", rs.getInt("completed"));
                stats.put("cancelled", rs.getInt("cancelled"));
                stats.put("revenue", rs.getInt("revenue"));
                stats.put("avgRating", rs.getInt("avgRating"));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return stats;
    }



}