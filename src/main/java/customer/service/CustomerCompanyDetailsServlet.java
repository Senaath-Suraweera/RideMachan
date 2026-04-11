package customer.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@WebServlet("/customer/company-details")
public class CustomerCompanyDetailsServlet extends HttpServlet {
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json; charset=UTF-8");
        resp.setCharacterEncoding("UTF-8");

        String companyIdStr = req.getParameter("companyId");
        System.out.println("🔍 Received companyId: " + companyIdStr);

        if (companyIdStr == null || companyIdStr.trim().isEmpty()) {
            JsonObject error = new JsonObject();
            error.addProperty("success", false);
            error.addProperty("message", "Company ID is required");
            resp.getWriter().print(gson.toJson(error));
            resp.getWriter().flush();
            return;
        }

        try {
            int companyId = Integer.parseInt(companyIdStr.trim());
            System.out.println("✓ Parsed company ID: " + companyId);
            
            JsonObject result = getCompanyDetails(companyId);
            String jsonResponse = gson.toJson(result);
            
            System.out.println("📤 Sending JSON response: " + jsonResponse);
            resp.getWriter().print(jsonResponse);
            resp.getWriter().flush();
            
        } catch (NumberFormatException e) {
            System.out.println("❌ Invalid number format: " + e.getMessage());
            JsonObject error = new JsonObject();
            error.addProperty("success", false);
            error.addProperty("message", "Invalid company ID format");
            resp.getWriter().print(gson.toJson(error));
            resp.getWriter().flush();
            
        } catch (Exception e) {
            System.out.println("❌ Exception: " + e.getMessage());
            e.printStackTrace();
            JsonObject error = new JsonObject();
            error.addProperty("success", false);
            error.addProperty("message", "Database error: " + e.getMessage());
            resp.getWriter().print(gson.toJson(error));
            resp.getWriter().flush();
        }
    }

    private JsonObject getCompanyDetails(int companyId) {
        JsonObject result = new JsonObject();
        String sql = "SELECT companyid, companyname, companyemail, phone, registrationnumber, " +
                "taxid, street, city, description " +
                "FROM RentalCompany WHERE companyid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                result.addProperty("success", true);
                result.addProperty("companyid", rs.getInt("companyid"));
                result.addProperty("companyname", rs.getString("companyname"));
                result.addProperty("companyemail", rs.getString("companyemail"));
                result.addProperty("phone", rs.getString("phone"));
                result.addProperty("registrationnumber", rs.getString("registrationnumber"));
                result.addProperty("taxid", rs.getString("taxid"));
                result.addProperty("street", rs.getString("street"));
                result.addProperty("city", rs.getString("city"));
                result.addProperty("description", rs.getString("description"));
                
                System.out.println("✅ Company found: " + rs.getString("companyname"));
            } else {
                result.addProperty("success", false);
                result.addProperty("message", "Company not found");
                System.out.println("⚠️ Company not found with ID: " + companyId);
            }
        } catch (Exception e) {
            System.out.println("❌ Database error: " + e.getMessage());
            e.printStackTrace();
            result.addProperty("success", false);
            result.addProperty("message", "Database error: " + e.getMessage());
        }

        return result;
    }
}
