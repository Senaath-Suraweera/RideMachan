package rentalcompany.drivers.controller;

import common.util.DBConnection;
import common.util.PasswordServices;
import rentalcompany.drivers.model.Driver;
import rentalcompany.drivers.model.Booking;
import rentalcompany.drivers.model.Issue;

import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class DriverDAO {

    // ==========================================
    // Driver Authentication Methods
    // ==========================================

    public static boolean insertDriver(Driver driver) {
        String sql = "INSERT INTO Driver (username, firstname, lastname, email, mobilenumber, description, " +
                "hashedpassword, salt, nicnumber, nic, driverslicence, company_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

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

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
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

                if (PasswordServices.verifyPassword(password, storedSalt, storedHash)) {
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

    // ==========================================
    // Driver Profile Methods
    // ==========================================

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

                // Additional profile fields (if they exist in DB) - safe retrieval
                driver.setHomeAddress(getStringOrNull(rs, "homeaddress"));
                driver.setLicenseNumber(getStringOrNull(rs, "licensenumber"));
                driver.setAssignedArea(getStringOrNull(rs, "assignedarea"));
                driver.setShiftTime(getStringOrNull(rs, "shifttime"));
                driver.setReportingManager(getStringOrNull(rs, "reportingmanager"));
                driver.setProfilePicture(getStringOrNull(rs, "profilepicture"));
                driver.setAvailability(getStringOrNull(rs, "availability"));

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
                driver.getLicenseNumber() == null &&
                driver.getNicNumber() == null &&
                driver.getDescription() == null &&
                driver.getProfilePicture() == null ){

            return false;
        }

        // Build dynamic SQL based on which fields are provided
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
        if (driver.getLicenseNumber() != null) {
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
            if (driver.getLicenseNumber() != null) {
                ps.setString(paramIndex++, driver.getLicenseNumber());
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

    /**
     * Get driver by ID for calendar view
     * FIXED: Properly retrieves all driver fields including firstName, lastName
     */
    public static Driver getDriverById(int driverId) {
        String sql = "SELECT d.*, c.companyname as company_name " +
                "FROM Driver d " +
                "LEFT JOIN rentalCompany c ON d.company_id = c.companyid " +
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
                driver.setLicenseNumber(getStringOrNull(rs, "licensenumber"));
                driver.setHomeAddress(getStringOrNull(rs, "homeaddress"));
                driver.setAssignedArea(getStringOrNull(rs, "assignedarea"));
                driver.setShiftTime(getStringOrNull(rs, "shifttime"));
                driver.setReportingManager(getStringOrNull(rs, "reportingmanager"));
                driver.setProfilePicture(getStringOrNull(rs, "profilepicture"));
                driver.setAvailability(getStringOrNull(rs, "availability"));

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

    /**
     * Update driver availability status
     * Used when driver toggles their availability from the calendar view
     */
    public static boolean updateDriverAvailability(int driverId, String availability) {
        // First check if availability column exists
        String checkColumnSql = "SHOW COLUMNS FROM Driver LIKE 'availability'";
        String updateSql = "UPDATE Driver SET availability = ? WHERE driverid = ?";

        try (Connection con = DBConnection.getConnection()) {

            // Check if column exists
            try (PreparedStatement checkPs = con.prepareStatement(checkColumnSql);
                 ResultSet rs = checkPs.executeQuery()) {

                if (!rs.next()) {
                    // Column doesn't exist, create it
                    try (Statement stmt = con.createStatement()) {
                        stmt.executeUpdate("ALTER TABLE Driver ADD COLUMN availability VARCHAR(20) DEFAULT 'available'");
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

    /**
     * Get all ongoing bookings for a specific driver
     * Returns bookings with status 'upcoming' or 'in-progress'
     */
    public static List<Booking> getOngoingBookings(int driverId) {
        String sql = "SELECT * FROM companybookings WHERE driverid = ? " +
                "AND status IN ('upcoming', 'in-progress') " +
                "ORDER BY booked_Date ASC, start_time ASC";

        List<Booking> bookings = new ArrayList<>();

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, driverId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                Booking booking = new Booking();
                booking.setBookingId(rs.getInt("booking_id"));
                booking.setRideId(rs.getString("ride_id"));
                booking.setDriverId(rs.getInt("driverid"));
                booking.setCustomerName(rs.getString("customer_name"));
                booking.setCustomerPhone(rs.getString("customer_phone"));
                booking.setCustomerEmail(rs.getString("customer_email"));
                booking.setPickupLocation(rs.getString("pickup_location"));
                booking.setDropoffLocation(rs.getString("drop_location"));
                booking.setBookingDate(rs.getDate("booked_Date"));
                booking.setBookingTime(rs.getTime("start_time"));
                booking.setEstimatedDuration(rs.getInt("estimated_duration"));
                booking.setDistance(rs.getDouble("distance"));
                booking.setTotalAmount(rs.getDouble("total_amount"));
                booking.setStatus(rs.getString("status"));
                booking.setVehicleModel(rs.getString("vehicle_model"));
                booking.setVehiclePlate(rs.getString("vehicle_plate"));
                booking.setSpecialInstructions(rs.getString("special_instructions"));
                booking.setCreatedAt(rs.getTimestamp("created_at"));

                bookings.add(booking);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return bookings;
    }

    /**
     * Get a specific booking by ride ID
     */
    public static Booking getBookingByRideId(String rideId) {
        String sql = "SELECT * FROM companybookings WHERE ride_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, rideId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                Booking booking = new Booking();
                booking.setBookingId(rs.getInt("booking_id"));
                booking.setRideId(rs.getString("ride_id"));
                booking.setDriverId(rs.getInt("driverid"));
                booking.setCustomerName(rs.getString("customer_name"));
                booking.setCustomerPhone(rs.getString("customer_phone"));
                booking.setCustomerEmail(rs.getString("customer_email"));
                booking.setPickupLocation(rs.getString("pickup_location"));
                booking.setDropoffLocation(rs.getString("drop_location"));
                booking.setBookingDate(rs.getDate("booked_Date"));
                booking.setBookingTime(rs.getTime("start_time"));
                booking.setEstimatedDuration(rs.getInt("estimated_duration"));
                booking.setDistance(rs.getDouble("distance"));
                booking.setTotalAmount(rs.getDouble("total_amount"));
                booking.setStatus(rs.getString("status"));
                booking.setVehicleModel(rs.getString("vehicle_model"));
                booking.setVehiclePlate(rs.getString("vehicle_plate"));
                booking.setSpecialInstructions(rs.getString("special_instructions"));
                booking.setCreatedAt(rs.getTimestamp("created_at"));

                return booking;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    /**
     * Update booking status (e.g., from 'upcoming' to 'in-progress' or 'completed')
     */
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

    /**
     * Create a new booking (for testing purposes)
     */
    public static boolean createBooking(Booking booking) {
        String sql = "INSERT INTO companybookings (ride_id, driverid, customer_name, customer_phone, " +
                "customer_email, pickup_location, drop_location, booked_Date, start_time, " +
                "estimated_duration, distance, total_amount, status, vehicle_model, vehicle_plate, " +
                "special_instructions) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, booking.getRideId());
            ps.setInt(2, booking.getDriverId());
            ps.setString(3, booking.getCustomerName());
            ps.setString(4, booking.getCustomerPhone());
            ps.setString(5, booking.getCustomerEmail());
            ps.setString(6, booking.getPickupLocation());
            ps.setString(7, booking.getDropoffLocation());
            ps.setDate(8, booking.getBookingDate());
            ps.setTime(9, booking.getBookingTime());
            ps.setInt(10, booking.getEstimatedDuration());
            ps.setDouble(11, booking.getDistance());
            ps.setDouble(12, booking.getTotalAmount());
            ps.setString(13, booking.getStatus());
            ps.setString(14, booking.getVehicleModel());
            ps.setString(15, booking.getVehiclePlate());
            ps.setString(16, booking.getSpecialInstructions());

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }

    /**
     * Delete a booking
     */
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

    /**
     * Get count of ongoing bookings for a driver
     */
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

    /**
     * Create a new issue report
     */
    public static int createIssue(Issue issue) {
        String sql = "INSERT INTO Issue (driver_id, category, location, description, " +
                "booking_id, plate_number, photo_path, is_driveable, status) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

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

    /**
     * Get all issues for a driver
     */
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

    /**
     * Get issue by ID
     */
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

    /**
     * Delete issue
     */
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

    /**
     * Get issue count by status
     */
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
    /**
     * Get past bookings (completed or cancelled)
     */
    public static List<Booking> getPastBookings(int driverId, String dateRange, String status, String searchQuery) {

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
                case "quarter":
                    sql.append("AND booked_Date >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) ");
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

        List<Booking> bookings = new ArrayList<>();

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
                Booking booking = new Booking();
                booking.setBookingId(rs.getInt("booking_id"));
                booking.setRideId(rs.getString("ride_id"));
                booking.setDriverId(rs.getInt("driverid"));

                booking.setCustomerName(rs.getString("customer_name"));
                booking.setCustomerPhone(rs.getString("customer_phone"));
                booking.setCustomerEmail(rs.getString("customer_email"));

                booking.setPickupLocation(rs.getString("pickup_location"));
                booking.setDropoffLocation(rs.getString("drop_location"));

                booking.setBookingDate(rs.getDate("booked_Date"));
                booking.setBookingTime(rs.getTime("start_time"));

                booking.setEstimatedDuration(rs.getInt("estimated_duration"));
                booking.setDistance(rs.getDouble("distance"));
                booking.setTotalAmount(rs.getDouble("total_amount"));
                booking.setStatus(rs.getString("status"));

                booking.setVehicleModel(rs.getString("vehicle_model"));
                booking.setVehiclePlate(rs.getString("vehicle_plate"));
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