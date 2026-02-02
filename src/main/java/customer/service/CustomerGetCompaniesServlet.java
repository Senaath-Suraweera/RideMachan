package customer.service;

import common.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;

@WebServlet("/customer/getCompanies")
public class CustomerGetCompaniesServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String query = """
            SELECT companyid, companyname
            FROM RentalCompany
            ORDER BY companyname
        """;

        try (Connection conn = DBConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(query);
             ResultSet rs = stmt.executeQuery()) {

            JsonArray companies = new JsonArray();

            while (rs.next()) {
                JsonObject company = new JsonObject();
                company.addProperty("id", rs.getInt("companyid"));
                company.addProperty("name", rs.getString("companyname"));
                companies.add(company);
            }

            response.getWriter().write(companies.toString());

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            e.printStackTrace();
        }
    }
}
