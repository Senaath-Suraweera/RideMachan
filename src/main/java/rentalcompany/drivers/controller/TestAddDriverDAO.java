package rentalcompany.drivers.controller;

import rentalcompany.drivers.model.TestDriver;
import common.util.DBConnection;
import java.sql.*;

public class TestAddDriverDAO {

    public static boolean insertDriver(TestDriver driver) {

        String sql = "INSERT INTO drivertest (username,email) VALUES (?,?)";

        try(Connection con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, driver.getUsername());
            ps.setString(2, driver.getEmail());

            return ps.executeUpdate() == 1;


        }catch(Exception e) {
            e.printStackTrace();
            return false;
        }


    }

}
