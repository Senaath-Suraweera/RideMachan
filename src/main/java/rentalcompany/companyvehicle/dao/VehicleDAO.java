package rentalcompany.companyvehicle.dao;

import common.util.DBConnection;
import rentalcompany.companyvehicle.model.*;


import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class VehicleDAO {

    public static boolean addVehicle(Vehicle v) {
        String sql = "INSERT INTO Vehicle (vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color, " +
                "numberofpassengers, enginecapacity, enginenumber, chasisnumber, registrationdocumentation, " +
                "vehicleimages, description, milage, company_id, provider_id,price_per_day,location,features, " +
                "vehicle_type, fuel_type, availability_status, manufacture_year, transmission, created_at, updated_at)" +
                " VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, v.getVehicleBrand());
            ps.setString(2, v.getVehicleModel());
            ps.setString(3, v.getNumberPlateNumber());
            ps.setInt(4, v.getTareWeight());
            ps.setString(5, v.getColor());
            ps.setInt(6, v.getNumberOfPassengers());
            ps.setInt(7, v.getEngineCapacity());
            ps.setString(8, v.getEngineNumber());
            ps.setString(9, v.getChasisNumber());
            ps.setBlob(10, v.getRegistrationDocumentation());
            ps.setBlob(11, v.getVehicleImages());
            ps.setString(12, v.getDescription());
            ps.setString(13, v.getMilage());
            if (v.getCompanyId() != null)
                ps.setInt(14, v.getCompanyId());
            else
                ps.setNull(14, Types.INTEGER);
            if (v.getProviderId() != null)
                ps.setInt(15, v.getProviderId());
            else
                ps.setNull(15, Types.INTEGER);


            ps.setInt(16, v.getPricePerDay());
            ps.setString(17, v.getLocation());

            ps.setString(18, v.getFeatures());
            ps.setString(19, v.getVehicleType());
            ps.setString(20, v.getFuelType());
            ps.setString(21, v.getAvailabilityStatus());
            ps.setInt(22, v.getManufactureYear());
            ps.setString(23, v.getTransmission());
            ps.setTimestamp(24, v.getCreatedAt());
            ps.setTimestamp(25, v.getUpdatedAt());



            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static List<Vehicle> listVehiclesByCompany(int companyId) {
        return listVehicles("company_id", companyId);
    }

    public static List<Vehicle> listVehiclesByProvider(int providerId) {
        return listVehicles("provider_id", providerId);
    }

    private static List<Vehicle> listVehicles(String column, int id) {
        List<Vehicle> list = new ArrayList<>();
        String sql = "SELECT * FROM Vehicle WHERE " + column + " = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Dynamic UPDATE:
     *  - updates the core fields always
     *  - file columns only rewritten when new files are provided (so edits that skip
     *    re-upload don't wipe existing BLOBs)
     *  - manufacture_year only updated when supplied (keeps backward compatibility)
     */
    public static boolean updateVehicle(Vehicle v) {
        StringBuilder sql = new StringBuilder(
                "UPDATE Vehicle SET vehiclebrand=?, vehiclemodel=?, numberplatenumber=?, tareweight=?, color=?, " +
                        "numberofpassengers=?, enginecapacity=?, enginenumber=?, chasisnumber=?, description=?, milage=?, " +
                        "price_per_day=?, location=?, features=?, vehicle_type=?, fuel_type=?, transmission=?"
        );

        boolean hasYear = v.getManufactureYear() > 0;
        boolean hasDoc  = v.getRegistrationDocumentation() != null;
        boolean hasImg  = v.getVehicleImages() != null;

        if (hasYear) sql.append(", manufacture_year=?");
        if (hasDoc)  sql.append(", registrationdocumentation=?");
        if (hasImg)  sql.append(", vehicleimages=?");

        sql.append(" WHERE vehicleid=?");

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql.toString())) {

            int i = 1;
            ps.setString(i++, v.getVehicleBrand());
            ps.setString(i++, v.getVehicleModel());
            ps.setString(i++, v.getNumberPlateNumber());
            ps.setInt(i++, v.getTareWeight());
            ps.setString(i++, v.getColor());
            ps.setInt(i++, v.getNumberOfPassengers());
            ps.setInt(i++, v.getEngineCapacity());
            ps.setString(i++, v.getEngineNumber());
            ps.setString(i++, v.getChasisNumber());
            ps.setString(i++, v.getDescription());
            ps.setString(i++, v.getMilage());
            ps.setInt(i++, v.getPricePerDay());
            ps.setString(i++, v.getLocation());
            ps.setString(i++, v.getFeatures());
            ps.setString(i++, v.getVehicleType());
            ps.setString(i++, v.getFuelType());
            ps.setString(i++, v.getTransmission());

            if (hasYear) ps.setInt(i++, v.getManufactureYear());
            if (hasDoc)  ps.setBlob(i++, v.getRegistrationDocumentation());
            if (hasImg)  ps.setBlob(i++, v.getVehicleImages());

            ps.setInt(i, v.getVehicleId());

            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean deleteVehicle(int vehicleId) {
        String sql = "DELETE FROM Vehicle WHERE vehicleid=?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, vehicleId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static List<Vehicle> getVehicleById(int vehicleId) {
        List<Vehicle> list = new ArrayList<>();
        String sql = "SELECT * FROM Vehicle WHERE vehicleid = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, vehicleId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                list.add(mapRow(rs));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    /**
     * Single mapping helper so list + single-fetch stay in sync
     * and ALL relevant columns are populated on the Vehicle bean.
     */
    private static Vehicle mapRow(ResultSet rs) throws SQLException {
        Vehicle v = new Vehicle();
        v.setVehicleId(rs.getInt("vehicleid"));
        v.setStatus(rs.getString("availability_status"));
        v.setVehicleBrand(rs.getString("vehiclebrand"));
        v.setVehicleModel(rs.getString("vehiclemodel"));
        v.setNumberPlateNumber(rs.getString("numberplatenumber"));
        v.setTareWeight(rs.getInt("tareweight"));
        v.setColor(rs.getString("color"));
        v.setNumberOfPassengers(rs.getInt("numberofpassengers"));
        v.setEngineCapacity(rs.getInt("enginecapacity"));
        v.setEngineNumber(rs.getString("enginenumber"));
        v.setChasisNumber(rs.getString("chasisnumber"));
        v.setDescription(rs.getString("description"));
        v.setMilage(rs.getString("milage"));

        int companyId = rs.getInt("company_id");
        v.setCompanyId(rs.wasNull() ? null : companyId);

        int providerId = rs.getInt("provider_id");
        v.setProviderId(rs.wasNull() ? null : providerId);

        safeSetInt(rs, "price_per_day", v::setPricePerDay);
        v.setLocation(getStringOrNull(rs, "location"));
        v.setFeatures(getStringOrNull(rs, "features"));
        v.setVehicleType(getStringOrNull(rs, "vehicle_type"));
        v.setFuelType(getStringOrNull(rs, "fuel_type"));
        v.setAvailabilityStatus(getStringOrNull(rs, "availability_status"));
        v.setTransmission(getStringOrNull(rs, "transmission"));

        safeSetInt(rs, "manufacture_year", v::setManufactureYear);

        try { v.setCreatedAt(rs.getTimestamp("created_at")); } catch (SQLException ignore) {}
        try { v.setUpdatedAt(rs.getTimestamp("updated_at")); } catch (SQLException ignore) {}

        return v;
    }

    private static String getStringOrNull(ResultSet rs, String col) {
        try { return rs.getString(col); } catch (SQLException e) { return null; }
    }

    private static void safeSetInt(ResultSet rs, String col, java.util.function.IntConsumer setter) {
        try {
            int val = rs.getInt(col);
            if (!rs.wasNull()) setter.accept(val);
        } catch (SQLException ignore) {}
    }

    public static int getTotalVehiclesCount(int companyId) {

        int totalVehiclesCount = 0;

        String sql = "SELECT COUNT(*) FROM vehicle WHERE company_id = ?";

        try(Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);

            ResultSet rs = ps.executeQuery();

            if(rs.next()) {
                totalVehiclesCount = rs.getInt(1);
            }

        }catch(Exception e) {
            e.printStackTrace();
        }


        return totalVehiclesCount;

    }

    public static int getAvailableVehiclesCount(int companyId) {

        int availableVehiclesCount = 0;

        String sql = "SELECT COUNT(*) FROM vehicle WHERE company_id = ? AND availability_status = 'available'";

        try(Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);

            ResultSet rs = ps.executeQuery();

            if(rs.next()) {
                availableVehiclesCount = rs.getInt(1);
            }

        }catch(Exception e) {
            e.printStackTrace();
        }


        return availableVehiclesCount;

    }

    public static int getOnTripVehiclesCount(int companyId) {

        int onTripVehiclesCount = 0;

        String sql = "SELECT COUNT(*) FROM vehicle WHERE company_id = ? AND availability_status = 'ontrip'";

        try(Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);

            ResultSet rs = ps.executeQuery();

            if(rs.next()) {
                onTripVehiclesCount = rs.getInt(1);
            }

        }catch(Exception e) {
            e.printStackTrace();
        }


        return onTripVehiclesCount;

    }

    public static int getIdOfVehicle(String numberplatenumber) {

        int vehicleId = -1;
        String sql = "SELECT vehicleid FROM vehicle WHERE numberplatenumber = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, numberplatenumber);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                vehicleId = rs.getInt("vehicleid");
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return vehicleId;
    }

    public static List<MaintenanceRecord> getMaintenanceRecordsByVehicleId(int vehicleId) {

        List<MaintenanceRecord> records = new ArrayList<>();

        String sql1 = "SELECT jobId, vehicleId, assignedStaffId, companyId, status, scheduledDate, completedDate, type, description, mileage " +
                "FROM maintenancejobs WHERE vehicleId = ? ORDER BY scheduledDate DESC";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql1)) {

            ps.setInt(1, vehicleId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {

                MaintenanceRecord record = new MaintenanceRecord();

                record.setRecordId(rs.getInt("jobId"));
                record.setVehicleId(rs.getInt("vehicleId"));
                record.setCompanyId(rs.getInt("companyId"));
                record.setStatus(rs.getString("status"));
                record.setScheduledDate(rs.getString("scheduledDate"));
                record.setCompletedDate(rs.getString("completedDate"));
                record.setServiceType(rs.getString("type"));
                record.setDescription(rs.getString("description"));
                record.setMileage(rs.getInt("mileage"));

                records.add(record);

            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return records;

    }

}