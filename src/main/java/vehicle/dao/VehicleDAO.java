package vehicle.dao;

import common.util.DBConnection;
import vehicle.model.Vehicle;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class VehicleDAO {

    public static boolean addVehicle(Vehicle v) {
        String sql = "INSERT INTO Vehicle (vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color, " +
                "numberofpassengers, enginecapacity, enginenumber, chasisnumber, registrationdocumentation, " +
                "vehicleimages, description, milage, company_id, provider_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";
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
                Vehicle v = new Vehicle();
                v.setVehicleId(rs.getInt("vehicleid"));
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
                v.setCompanyId(rs.getInt("company_id"));
                v.setProviderId(rs.getInt("provider_id"));
                list.add(v);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public static boolean updateVehicle(Vehicle v) {
        String sql = "UPDATE Vehicle SET vehiclebrand=?, vehiclemodel=?, numberplatenumber=?, tareweight=?, color=?, " +
                "numberofpassengers=?, enginecapacity=?, enginenumber=?, chasisnumber=?, description=?, milage=? WHERE vehicleid=?";
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
            ps.setString(10, v.getDescription());
            ps.setString(11, v.getMilage());
            ps.setInt(12, v.getVehicleId());

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
                Vehicle v = new Vehicle();
                v.setVehicleId(rs.getInt("vehicleid"));
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
                v.setCompanyId(rs.getInt("company_id"));
                v.setProviderId(rs.getInt("provider_id"));
                list.add(v);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }
}