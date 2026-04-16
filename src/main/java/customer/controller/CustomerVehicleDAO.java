package customer.controller;

import vehicle.model.Vehicle;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CustomerVehicleDAO {

    private final Connection connection;

    public CustomerVehicleDAO(Connection connection) {
        this.connection = connection;
    }

    public List<Vehicle> getAllVehicles() throws SQLException {

        List<Vehicle> vehicles = new ArrayList<>();
        String sql = "SELECT * FROM vehicle WHERE company_id IS NOT NULL AND availability_status = 'available'";

        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(sql)) {

            while (rs.next()) {
                vehicles.add(extractVehicle(rs));
            }
        }

        return vehicles;
    }

    // =========================
    // ResultSet → Vehicle mapper
    // =========================
    private Vehicle extractVehicle(ResultSet rs) throws SQLException {

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
        v.setCompanyId(rs.getObject("company_id", Integer.class));
        v.setProviderId(rs.getObject("provider_id", Integer.class));

        // New fields for search functionality
        v.setPricePerDay(rs.getDouble("price_per_day"));
        v.setLocation(rs.getString("location"));
        v.setFeatures(rs.getString("features"));
        v.setVehicleType(rs.getString("vehicle_type"));
        v.setFuelType(rs.getString("fuel_type"));
        v.setAvailabilityStatus(rs.getString("availability_status"));

        // BLOB / IMAGE fields (optional for search page)
        // v.setRegistrationDocumentation(rs.getBinaryStream("registrationdocumentation"));
        // v.setVehicleImages(rs.getBinaryStream("vehicleimages"));

        return v;

    }
}
