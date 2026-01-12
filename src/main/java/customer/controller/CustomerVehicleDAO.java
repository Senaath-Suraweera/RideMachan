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
        String sql = "SELECT * FROM vehicle";

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

        v.setVehicleId(rs.getInt("vehicle_id"));
        v.setVehicleBrand(rs.getString("vehicle_brand"));
        v.setVehicleModel(rs.getString("vehicle_model"));
        v.setNumberPlateNumber(rs.getString("number_plate_number"));
        v.setTareWeight(rs.getInt("tare_weight"));
        v.setColor(rs.getString("color"));
        v.setNumberOfPassengers(rs.getInt("number_of_passengers"));
        v.setEngineCapacity(rs.getInt("engine_capacity"));
        v.setEngineNumber(rs.getString("engine_number"));
        v.setChasisNumber(rs.getString("chasis_number"));
        v.setDescription(rs.getString("description"));
        v.setMilage(rs.getString("milage"));
        v.setCompanyId(rs.getObject("company_id", Integer.class));
        v.setProviderId(rs.getObject("provider_id", Integer.class));

        // BLOB / IMAGE fields (optional for search page)
        //v.setRegistrationDocumentation(rs.getBinaryStream("registration_documentation"));
        v.setVehicleImages(rs.getBinaryStream("vehicle_images"));

        return v;

    }
}
