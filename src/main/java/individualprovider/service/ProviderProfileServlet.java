package individualprovider.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import common.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.sql.*;

@WebServlet("/api/provider/profile")
public class ProviderProfileServlet extends HttpServlet {

    private final Gson gson = new Gson();

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,PUT,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    private Integer getProviderId(HttpServletRequest req) {
        String pid = req.getParameter("providerId");
        if (pid == null || pid.trim().isEmpty()) return null;
        try { return Integer.parseInt(pid.trim()); } catch (Exception e) { return null; }
    }

    private JsonObject readJson(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = req.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        if (sb.length() == 0) return new JsonObject();
        return JsonParser.parseString(sb.toString()).getAsJsonObject();
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer providerId = getProviderId(req);
        if (providerId == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"providerId is required\"}");
            return;
        }

        String sql = "SELECT providerid, username, email, company_id, firstname, lastname, phonenumber, " +
                "housenumber, street, city, zipcode " +
                "FROM VehicleProvider WHERE providerid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, providerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    resp.getWriter().write("{\"error\":\"Provider not found\"}");
                    return;
                }

                JsonObject out = new JsonObject();
                out.addProperty("providerId", rs.getInt("providerid"));
                out.addProperty("username", rs.getString("username"));
                out.addProperty("email", rs.getString("email"));
                out.addProperty("companyId", rs.getObject("company_id") == null ? null : rs.getInt("company_id"));
                out.addProperty("firstName", rs.getString("firstname"));
                out.addProperty("lastName", rs.getString("lastname"));
                out.addProperty("phoneNumber", rs.getString("phonenumber"));
                out.addProperty("houseNumber", rs.getString("housenumber"));
                out.addProperty("street", rs.getString("street"));
                out.addProperty("city", rs.getString("city"));
                out.addProperty("zipCode", rs.getString("zipcode"));

                resp.getWriter().write(gson.toJson(out));
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Server error\"}");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer providerId = getProviderId(req);
        if (providerId == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"providerId is required\"}");
            return;
        }

        JsonObject body = readJson(req);

        String username = body.has("username") ? body.get("username").getAsString() : null;
        String email = body.has("email") ? body.get("email").getAsString() : null;
        String firstName = body.has("firstName") ? body.get("firstName").getAsString() : null;
        String lastName = body.has("lastName") ? body.get("lastName").getAsString() : null;
        String phoneNumber = body.has("phoneNumber") ? body.get("phoneNumber").getAsString() : null;
        String houseNumber = body.has("houseNumber") ? body.get("houseNumber").getAsString() : null;
        String street = body.has("street") ? body.get("street").getAsString() : null;
        String city = body.has("city") ? body.get("city").getAsString() : null;
        String zipCode = body.has("zipCode") ? body.get("zipCode").getAsString() : null;

        String sql = "UPDATE VehicleProvider SET username=?, email=?, firstname=?, lastname=?, phonenumber=?, " +
                "housenumber=?, street=?, city=?, zipcode=? WHERE providerid=?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, username);
            ps.setString(2, email);
            ps.setString(3, firstName);
            ps.setString(4, lastName);
            ps.setString(5, phoneNumber);
            ps.setString(6, houseNumber);
            ps.setString(7, street);
            ps.setString(8, city);
            ps.setString(9, zipCode);
            ps.setInt(10, providerId);

            int updated = ps.executeUpdate();
            if (updated == 0) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"error\":\"Provider not found\"}");
                return;
            }

            resp.getWriter().write("{\"success\":true}");

        } catch (SQLIntegrityConstraintViolationException dup) {
            resp.setStatus(HttpServletResponse.SC_CONFLICT);
            resp.getWriter().write("{\"error\":\"Username or email already exists\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Server error\"}");
        }
    }
}
