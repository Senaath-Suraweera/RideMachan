package rentalcompany.maintenance.controller;

import common.util.DBConnection;
import rentalcompany.maintenance.model.MaintenanceStaff;
import rentalcompany.companyvehicle.model.Vehicle;
import rentalcompany.companyvehicle.dao.VehicleDAO;
import rentalcompany.companyvehicle.model.MaintenanceRecord;
import rentalcompany.maintenance.model.CalendarEvent;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class MaintenanceStaffDAO {

    public boolean addStaff(MaintenanceStaff staff) {
        String sql = "INSERT INTO maintenancestaff (username, firstname, lastname, email, hashedpassword, salt, mobilenumber, company_id,specialization,yearsOfExperience) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, staff.getUsername());
            ps.setString(2, staff.getFirstname());
            ps.setString(3, staff.getLastname());
            ps.setString(4, staff.getEmail());
            ps.setString(5, staff.getHashedPassword());
            ps.setString(6, staff.getSalt());
            ps.setString(7, staff.getContactNumber());
            ps.setInt(8, staff.getCompanyId());
            ps.setString(9, staff.getSpecialization());
            ps.setFloat(10, staff.getYearsOfExperience());
            ps.executeUpdate();
            return true;
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return false;
    }

    public static List<MaintenanceStaff> getCompanyStaffsByCompanyId(int companyId) {
        List<MaintenanceStaff> staffs = new ArrayList<>();

        String sql = "SELECT maintenanceid,username,firstname,lastname,mobilenumber,email,specialization,status,yearsOfExperience,company_id FROM maintenanceStaff WHERE company_id = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {

                MaintenanceStaff s = new MaintenanceStaff();
                s.setStaffId(rs.getInt("maintenanceid"));
                s.setUsername(rs.getString("username"));
                s.setFirstname(rs.getString("firstname"));
                s.setLastname(rs.getString("lastname"));
                s.setEmail(rs.getString("email"));
                s.setContactNumber(rs.getString("mobilenumber"));
                s.setCompanyId(rs.getInt("company_id"));


                //new add
                s.setSpecialization(rs.getString("specialization"));
                s.setStatus(rs.getString("status"));
                s.setYearsOfExperience(rs.getFloat("yearsOfExperience"));

                staffs.add(s);

            }

            return staffs;

        } catch (SQLException e) {

            e.printStackTrace();

        }
        return null;
    }


    public MaintenanceStaff getStaffByEmail(String email) {
        String sql = "SELECT * FROM maintenanceStaff WHERE email = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                MaintenanceStaff s = new MaintenanceStaff();
                s.setStaffId(rs.getInt("maintenanceid"));
                s.setUsername(rs.getString("username"));
                s.setFirstname(rs.getString("firstname"));
                s.setLastname(rs.getString("lastname"));
                s.setEmail(rs.getString("email"));
                s.setHashedPassword(rs.getString("hashedpassword"));
                s.setSalt(rs.getString("salt"));
                s.setContactNumber(rs.getString("mobilenumber"));
                s.setCompanyId(rs.getInt("company_id"));
                return s;
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public static MaintenanceStaff getStaffProfile(int staffId) {

        String sql = """
                        SELECT 
                            ms.maintenanceid,
                            ms.username,
                            ms.firstname,
                            ms.lastname,
                            ms.mobilenumber,
                            ms.email,
                            ms.specialization,
                            ms.status,
                            ms.yearsOfExperience,
                
                            rc.companyid,
                            rc.companyname,
                            rc.companyemail,
                            rc.phone,
                            rc.registrationnumber,
                            rc.city
                
                        FROM maintenancestaff ms
                        INNER JOIN rentalcompany rc
                        ON ms.company_id = rc.companyid
                        WHERE ms.maintenanceid = ?
                    """;

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {

                MaintenanceStaff s = new MaintenanceStaff();

                // staff fields
                s.setStaffId(rs.getInt("maintenanceid"));
                s.setUsername(rs.getString("username"));
                s.setFirstname(rs.getString("firstname"));
                s.setLastname(rs.getString("lastname"));
                s.setContactNumber(rs.getString("mobilenumber"));
                s.setEmail(rs.getString("email"));
                s.setSpecialization(rs.getString("specialization"));
                s.setStatus(rs.getString("status"));
                s.setYearsOfExperience(rs.getFloat("yearsOfExperience"));


                s.setCompanyId(rs.getInt("companyid"));
                s.setCompanyName(rs.getString("companyname"));
                s.setCompanyEmail(rs.getString("companyemail"));
                s.setCompanyPhone(rs.getString("phone"));
                s.setCompanyCity(rs.getString("city"));

                return s;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return null;
    }

    public static int getTotalStaffCount(int companyId) {

        String sql = "SELECT COUNT(*) FROM maintenanceStaff WHERE company_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt(1); // Get the count from the query
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;

    }

    public static boolean updateMaintenanceProfile(int staffId,
                                                   String username,
                                                   String firstname,
                                                   String lastname,
                                                   String mobileNumber,
                                                   String email,
                                                   String specialization,
                                                   String status,
                                                   float yearsOfExperience) {

        // Ensure the new username is not already taken by a different staff member.
        if (isUsernameTaken(username, staffId)) {
            return false;
        }

        String sql = "UPDATE maintenancestaff SET " +
                "username = ?, " +
                "firstname = ?, " +
                "lastname = ?, " +
                "mobilenumber = ?, " +
                "email = ?, " +
                "specialization = ?, " +
                "status = ?, " +
                "yearsOfExperience = ? " +
                "WHERE maintenanceid = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, username);
            ps.setString(2, firstname);
            ps.setString(3, lastname);
            ps.setString(4, mobileNumber);
            ps.setString(5, email);
            ps.setString(6, specialization);
            ps.setString(7, status);
            ps.setFloat(8, yearsOfExperience);
            ps.setInt(9, staffId);

            int rows = ps.executeUpdate();
            return rows > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Returns true if another maintenance staff row already uses this username.
     * The excludeStaffId lets the caller skip the current user's own row.
     */
    private static boolean isUsernameTaken(String username, int excludeStaffId) {

        String sql = "SELECT COUNT(*) FROM maintenancestaff WHERE username = ? AND maintenanceid <> ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, username);
            ps.setInt(2, excludeStaffId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getInt(1) > 0;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return false;
    }


    public static int getAvailableStaffCount(int companyId) {

        String sql = "SELECT COUNT(*) FROM maintenanceStaff WHERE company_id = ? AND status = 'available'";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt(1); // Get the count from the query
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;

    }

    public static int getOnJobStaffCount(int companyId) {

        String sql = "SELECT COUNT(*) FROM maintenanceStaff WHERE company_id = ? AND status = 'on Job'";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt(1); // Get the count from the query
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;

    }


    public static int getOverdueMaintenanceCount(int staffId) {

        // Overdue = scheduled in calendarevents but the scheduled_date has already passed
        String sql = "SELECT COUNT(*) FROM calendarevents " +
                "WHERE maintenance_id = ? " +
                "AND status = 'scheduled' " +
                "AND scheduled_date < CURDATE()";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }


    public static int getTodayCompletedJobsCount(int staffId) {

        // Completed today = status completed AND scheduled_date is today
        // (calendarevents has no completedDate column, so we use scheduled_date)
        String sql = "SELECT COUNT(*) FROM calendarevents " +
                "WHERE maintenance_id = ? " +
                "AND status = 'completed' " +
                "AND scheduled_date = CURDATE()";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }


    public static int getLinkedCount(int staffId) {

        // Linked Vehicles = distinct vehicles assigned to this staff member.
        // Uses the maintenance_vehicle_assignment table.
        String sql = "SELECT COUNT(DISTINCT vehicleid) FROM maintenance_vehicle_assignment " +
                "WHERE maintenanceid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }


    public static int getPendingMaintenanceJobsCount(int staffId) {

        // Pending = scheduled events that haven't happened yet (and aren't overdue).
        // If you want ALL non-completed events, drop the date filter.
        String sql = "SELECT COUNT(*) FROM calendarevents " +
                "WHERE maintenance_id = ? " +
                "AND status IN ('scheduled','in-progress') " +
                "AND scheduled_date >= CURDATE()";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;
    }

    public static float calculateMaintenanceStaffPercentage(int staffId, String maintenanceType) {

        // Normalize the incoming keyword: lowercase, strip spaces/dashes/underscores/slashes,
        // and drop a trailing 's' so "Oil Changes" matches "Oil Change".
        String keyword = normalizeServiceKeyword(maintenanceType);

        // Total events for this staff
        String sqlTotal = "SELECT COUNT(*) FROM calendarevents WHERE maintenance_id = ?";

        // Normalized service_type column expression (reused)
        String normalizedCol =
                "LOWER(REPLACE(REPLACE(REPLACE(REPLACE(service_type,' ',''),'-',''),'_',''),'/',''))";

        String sqlType;
        boolean isOther = keyword.equals("otherservice") || keyword.equals("other");

        if (isOther) {
            // "Other" = everything that is NOT oil change / brake service / tire service
            sqlType =
                    "SELECT COUNT(*) FROM calendarevents " +
                            "WHERE maintenance_id = ? " +
                            "AND " + normalizedCol + " NOT LIKE '%oilchange%' " +
                            "AND " + normalizedCol + " NOT LIKE '%brakeservice%' " +
                            "AND " + normalizedCol + " NOT LIKE '%brake%' " +
                            "AND " + normalizedCol + " NOT LIKE '%tireservice%' " +
                            "AND " + normalizedCol + " NOT LIKE '%tire%'";
        } else {
            sqlType =
                    "SELECT COUNT(*) FROM calendarevents " +
                            "WHERE maintenance_id = ? " +
                            "AND " + normalizedCol + " LIKE CONCAT('%', ?, '%')";
        }

        try (Connection con = DBConnection.getConnection();
             PreparedStatement psTotal = con.prepareStatement(sqlTotal);
             PreparedStatement psType  = con.prepareStatement(sqlType)) {

            // total
            psTotal.setInt(1, staffId);
            int totalJobs = 0;
            try (ResultSet rs = psTotal.executeQuery()) {
                if (rs.next()) totalJobs = rs.getInt(1);
            }

            if (totalJobs == 0) return 0;

            // per-type
            psType.setInt(1, staffId);
            if (!isOther) {
                psType.setString(2, keyword);
            }

            int typeJobs = 0;
            try (ResultSet rs = psType.executeQuery()) {
                if (rs.next()) typeJobs = rs.getInt(1);
            }

            return (typeJobs * 100.0f) / totalJobs;

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return 0;
    }

    /**
     * Normalizes a service-type keyword so it can be compared loosely against
     * the free-text service_type column.
     * "Oil Change"      -> "oilchange"
     * "Brake Services"  -> "brakeservice"
     * "Tire Services"   -> "tireservice"
     * "Other Services"  -> "otherservice"
     */
    private static String normalizeServiceKeyword(String raw) {
        if (raw == null) return "";
        String k = raw.toLowerCase()
                .replace(" ", "")
                .replace("-", "")
                .replace("_", "")
                .replace("/", "");
        if (k.endsWith("s") && k.length() > 1) {
            k = k.substring(0, k.length() - 1);
        }
        return k;
    }




















    //inspection after

    public static List<Vehicle> getAssignedVehicles(int staffId) {

        List<Vehicle> vehicles = new ArrayList<>();

        String sql = "SELECT vehicle.vehicleid, vehicle.vehiclebrand, vehicle.vehiclemodel, " +
                     "vehicle.numberplatenumber, vehicle.manufacture_year, vehicle.availability_status, " +
                     "vehicle.vehicle_type, vehicle.milage " +
                     "FROM vehicle " +
                     "INNER JOIN maintenance_vehicle_assignment " +
                     "ON vehicle.vehicleid = maintenance_vehicle_assignment.vehicleid " +
                     "WHERE maintenance_vehicle_assignment.maintenanceid = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, staffId);

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {

                Vehicle v = new Vehicle();

                v.setVehicleId(rs.getInt("vehicleid"));
                v.setVehicleBrand(rs.getString("vehiclebrand"));
                v.setVehicleModel(rs.getString("vehiclemodel"));
                v.setNumberPlateNumber(rs.getString("numberplatenumber"));

                int year = rs.getInt("manufacture_year");

                if (rs.wasNull() || year == 0) {
                    year = 2026;
                }

                v.setYear(year);

                v.setStatus(rs.getString("availability_status"));
                v.setType(rs.getString("vehicle_type"));
                v.setMilage(rs.getString("milage"));
                v.setLastServiceDate(getLastServiceDateVehicle(v.getVehicleId()));
                v.setNextServiceDate(getNextServiceDateVehicle(v.getVehicleId()));

                vehicles.add(v);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return vehicles;
    }

    public static List<MaintenanceRecord> getMaintenanceLogsByStaffId(int staffId) {

        List<MaintenanceRecord> list = new ArrayList<>();

        String sql = "SELECT jobId, vehicleId, type, description, status, completedDate " +
                "FROM maintenancejobs " +
                "WHERE assignedStaffId = ? AND status = 'completed' ";


        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {

                MaintenanceRecord r = new MaintenanceRecord();

                r.setRecordId(rs.getInt("jobId"));
                r.setVehicleId(rs.getInt("vehicleId"));
                r.setServiceType(rs.getString("type"));
                r.setDescription(rs.getString("description"));
                r.setStatus(rs.getString("status"));
                r.setCompletedDate(rs.getString("completedDate"));

                list.add(r);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    public static String getLastServiceDateVehicle(int vehicleId) {

        String sql = "SELECT MAX(completedDate) AS lastDate " +
                     "FROM maintenancejobs " +
                     "WHERE vehicleId = ? AND status = 'completed'";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, vehicleId);

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {

                String date = rs.getString("lastDate");

                if (date == null) {
                    return "";
                }

                return date;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return "";

    }

    public static String getNextServiceDateVehicle(int vehicleId) {

        String sql = "SELECT scheduled_date " +
                     "FROM calendarevents " +
                     "WHERE vehicle_id = ? " +
                     "AND status = 'scheduled' " +
                     "AND scheduled_date >= CURDATE() " +
                     "ORDER BY scheduled_date ASC LIMIT 1";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setInt(1, vehicleId);

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {

                String date = rs.getString("scheduled_date");

                if (date == null) {
                    return "";
                }

                return date;
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return "";
    }

    public static boolean updateVehicleStatus(String numberplate, String status) {

        boolean result = false;

        String sql = "UPDATE vehicle SET availability_status = ? WHERE numberplatenumber = ?";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {

            ps.setString(1, status);
            ps.setString(2, numberplate);

            int rows = ps.executeUpdate();

            result = rows > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }

    public static boolean saveInspection(int maintenanceId,String numberplate,String status,String inspectionType,String priority,String issues,String inspectionDate,String checklist) {

        boolean result = false;


        String sql = "INSERT INTO vehicle_inspection " +
                     "(maintenanceid, vehicleid, inspection_type, priority, issues, status, inspection_date) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?)";

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement ps = conn.prepareStatement(sql)) {


            ps.setInt(1, maintenanceId);


            int vehicleId = VehicleDAO.getIdOfVehicle(numberplate);
            ps.setInt(2, vehicleId);

            ps.setString(3, inspectionType);
            ps.setString(4, priority);
            ps.setString(5, issues);
            ps.setString(6, status);
            ps.setString(7, inspectionDate);

            int rows = ps.executeUpdate();
            result = rows > 0;

        } catch (Exception e) {
            e.printStackTrace();
        }

        return result;
    }


    public static List<MaintenanceRecord> getRecentMaintenanceByStaff(int staffId) {

        List<MaintenanceRecord> list = new ArrayList<>();

        String sql = "SELECT jobId, vehicleId, type, description, status, completedDate " +
                     "FROM maintenancejobs " +
                     "WHERE assignedStaffId = ? AND status = 'completed' " +
                     "ORDER BY completedDate DESC " +
                     "LIMIT 3";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {

                MaintenanceRecord r = new MaintenanceRecord();

                r.setRecordId(rs.getInt("jobId"));
                r.setVehicleId(rs.getInt("vehicleId"));
                r.setServiceType(rs.getString("type"));
                r.setDescription(rs.getString("description"));
                r.setStatus(rs.getString("status"));
                r.setCompletedDate(rs.getString("completedDate"));

                list.add(r);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }


    public static List<CalendarEvent> getUpcomingMaintenanceByStaffId(int staffId) {

        List<CalendarEvent> list = new ArrayList<>();

        String sql =
                "SELECT ce.eventid, ce.vehicle_id, ce.service_type, ce.status, ce.description, " +
                        "ce.maintenance_id, ce.scheduled_date, ce.scheduled_time, ce.service_bay, " +
                        "ce.estimated_duration, " +
                        "v.numberplatenumber, v.vehiclebrand, v.vehiclemodel " +
                        "FROM calendarevents ce " +
                        "JOIN vehicle v ON ce.vehicle_id = v.vehicleid " +
                        "JOIN maintenancestaff ms ON ce.maintenance_id = ms.maintenanceid " +
                        "WHERE ms.maintenanceid = ? " +
                        "AND ce.status IN ('scheduled','in-progress') " +
                        "ORDER BY ce.scheduled_date ASC " +
                        "LIMIT 3";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {

                CalendarEvent e = new CalendarEvent();

                e.setEventId(rs.getInt("eventid"));
                e.setVehicleId(rs.getInt("vehicle_id"));
                e.setServiceType(rs.getString("service_type"));
                e.setStatus(rs.getString("status"));
                e.setDescription(rs.getString("description"));
                e.setMaintenanceId(rs.getInt("maintenance_id"));
                e.setScheduledDate(rs.getString("scheduled_date"));
                e.setScheduledTime(rs.getString("scheduled_time"));
                e.setServiceBay(rs.getString("service_bay"));
                e.setEstimatedDuration(rs.getString("estimated_duration"));

                e.setVehicleNumberPlate(rs.getString("numberplatenumber"));
                e.setVehicleModel(
                        rs.getString("vehiclebrand") + " " + rs.getString("vehiclemodel")
                );

                list.add(e);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }






}
