package rentalcompany.maintenance.controller;

import common.util.DBConnection;
import rentalcompany.maintenance.model.MaintenanceStaff;

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

        String sql = "SELECT COUNT(*) FROM maintenanceJobs WHERE assignedStaffId = ? AND status = 'overdue'";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt(1); // Get the count from the query
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;

    }


    public static int getTodayCompletedJobsCount(int staffId) {

        String sql = "SELECT COUNT(*) FROM maintenanceJobs WHERE assignedStaffId = ? AND status = 'overdue'";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt(1); // Get the count from the query
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;

    }


    public static int getLinkedCount(int staffId) {

        String sql = "SELECT COUNT(*) FROM maintenanceJobs " +
                     "WHERE assignedStaffId = ? AND status = 'completed' AND completedDate = CURDATE()";


        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt(1);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;

    }


    public static int getPendingMaintenanceJobsCount(int staffId) {

        String sql = "SELECT COUNT(*) FROM maintenanceJobs " +
                "WHERE assignedStaffId = ? AND status = 'pending'";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                return rs.getInt(1);
            }

        } catch (SQLException e) {
            e.printStackTrace();
        }
        return 0;

    }

    public static float calculateMaintenanceStaffPercentage(int staffId,String maintenanceType) {

        String sql1 = "SELECT COUNT(*) FROM maintenanceJobs WHERE assignedStaffId = ?";
        String sql2 = "SELECT COUNT(*) FROM maintenanceJobs WHERE assignedStaffId = ? AND type = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement psTotal = con.prepareStatement(sql1);
             PreparedStatement psType = con.prepareStatement(sql2)) {


            psTotal.setInt(1, staffId);
            ResultSet rsTotal = psTotal.executeQuery();
            int totalJobs = 0;
            if (rsTotal.next()) {
                totalJobs = rsTotal.getInt(1);
            }

            if (totalJobs == 0) {
                return 0;
            }


            psType.setInt(1, staffId);
            psType.setString(2, maintenanceType);
            ResultSet rsType = psType.executeQuery();

            int typeJobs = 0;

            if (rsType.next()) {

                typeJobs = rsType.getInt(1);

            }

            // Calculate percentage as float
            return (typeJobs * 100.0f) / totalJobs;

        } catch (SQLException e) {
            e.printStackTrace();
        }

        return 0;

    }
















}
