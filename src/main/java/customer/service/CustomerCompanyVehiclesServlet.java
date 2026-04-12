package customer.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@WebServlet("/customer/company-vehicles")
public class CustomerCompanyVehiclesServlet extends HttpServlet {
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        String companyIdStr = req.getParameter("companyId");
        System.out.println("🔍 Vehicles request for company: " + companyIdStr);

        if (companyIdStr == null || companyIdStr.trim().isEmpty()) {
            System.out.println("⚠️ No company ID, returning empty array");
            resp.getWriter().print("[]");
            resp.getWriter().flush();
            return;
        }

        try {
            int companyId = Integer.parseInt(companyIdStr.trim());
            JsonArray vehicles = getCompanyVehicles(companyId);
            String jsonResponse = gson.toJson(vehicles);

            System.out.println("📤 Returning " + vehicles.size() + " vehicles");
            resp.getWriter().print(jsonResponse);
            resp.getWriter().flush();

        } catch (NumberFormatException e) {
            System.out.println("❌ Invalid number format");
            resp.getWriter().print("[]");
            resp.getWriter().flush();

        } catch (Exception e) {
            System.out.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
            resp.getWriter().print("[]");
            resp.getWriter().flush();
        }
    }

    private JsonArray getCompanyVehicles(int companyId) {
        JsonArray vehicles = new JsonArray();
        String sql = "SELECT vehicleid, vehiclebrand, vehiclemodel, numberofpassengers, " +
                "price_per_day, vehicle_type FROM Vehicle WHERE company_id = ? " +
                "ORDER BY vehicleid DESC LIMIT 8";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);
            ResultSet rs = ps.executeQuery();

            int count = 0;
            while (rs.next()) {
                JsonObject vehicle = new JsonObject();
                vehicle.addProperty("vehicleid", rs.getInt("vehicleid"));
                vehicle.addProperty("vehicleId", rs.getInt("vehicleid"));
                vehicle.addProperty("id", rs.getInt("vehicleid"));
                vehicle.addProperty("name", rs.getString("vehiclebrand") + " " +
                        rs.getString("vehiclemodel"));
                vehicle.addProperty("seats", rs.getInt("numberofpassengers"));
                vehicle.addProperty("capacity", rs.getInt("numberofpassengers"));
                vehicle.addProperty("price", rs.getDouble("price_per_day"));
                vehicle.addProperty("rent", rs.getDouble("price_per_day"));
                vehicle.addProperty("type", rs.getString("vehicle_type"));
                vehicles.add(vehicle);
                count++;
            }

            System.out.println("✅ Found " + count + " vehicles for company " + companyId);

        } catch (Exception e) {
            System.out.println("❌ Database error: " + e.getMessage());
            e.printStackTrace();
        }

        return vehicles;
    }
}
