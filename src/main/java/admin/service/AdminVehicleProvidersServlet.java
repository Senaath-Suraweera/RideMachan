package admin.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import common.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.util.*;

@WebServlet("/api/admin/vehicle-providers/*")
public class AdminVehicleProvidersServlet extends HttpServlet {

    private final Gson gson = new Gson();

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    private JsonObject readJson(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = req.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        String raw = sb.toString().trim();
        if (raw.isEmpty()) return new JsonObject();
        return JsonParser.parseString(raw).getAsJsonObject();
    }

    private void sendJson(HttpServletResponse resp, int status, Object obj) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        try (PrintWriter out = resp.getWriter()) {
            out.print(gson.toJson(obj));
            out.flush();
        }
    }

    private Map<String, Object> error(String msg) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("ok", false);
        m.put("error", msg);
        return m;
    }

    private Integer tryParseInt(String s) {
        try { return s == null ? null : Integer.parseInt(s); }
        catch (Exception e) { return null; }
    }

    private String trimToNull(String s) {
        if (s == null) return null;
        s = s.trim();
        return s.isEmpty() ? null : s;
    }

    private Integer getIntOrNull(JsonObject body, String key) {
        try {
            return body.has(key) && !body.get(key).isJsonNull() ? body.get(key).getAsInt() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private Double getDoubleOrNull(JsonObject body, String key) {
        try {
            return body.has(key) && !body.get(key).isJsonNull() ? body.get(key).getAsDouble() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String getStringOrNull(JsonObject body, String key) {
        try {
            return body.has(key) && !body.get(key).isJsonNull() ? trimToNull(body.get(key).getAsString()) : null;
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String path = req.getPathInfo();
        String[] parts = (path == null ? "" : path).split("/");

        try (Connection con = DBConnection.getConnection()) {

            if (path == null || "/".equals(path) || parts.length <= 1 || parts[1].isEmpty()) {
                String q = req.getParameter("q");
                String status = req.getParameter("status");
                String city = req.getParameter("city");

                StringBuilder sql = new StringBuilder(
                        "SELECT providerid, username, email, firstname, lastname, phonenumber, city, " +
                                "COALESCE(status,'pending') AS status, created_at " +
                                "FROM VehicleProvider WHERE 1=1 "
                );

                List<Object> params = new ArrayList<>();

                if (q != null && !q.trim().isEmpty()) {
                    sql.append("AND (LOWER(firstname) LIKE ? OR LOWER(lastname) LIKE ? OR LOWER(email) LIKE ? OR LOWER(username) LIKE ? OR phonenumber LIKE ?) ");
                    String like = "%" + q.trim().toLowerCase() + "%";
                    params.add(like);
                    params.add(like);
                    params.add(like);
                    params.add(like);
                    params.add("%" + q.trim() + "%");
                }

                if (status != null && !status.trim().isEmpty()) {
                    sql.append("AND COALESCE(status,'pending') = ? ");
                    params.add(status.trim());
                }

                if (city != null && !city.trim().isEmpty()) {
                    sql.append("AND city = ? ");
                    params.add(city.trim());
                }

                sql.append("ORDER BY providerid DESC");

                try (PreparedStatement ps = con.prepareStatement(sql.toString())) {
                    for (int i = 0; i < params.size(); i++) {
                        ps.setObject(i + 1, params.get(i));
                    }

                    try (ResultSet rs = ps.executeQuery()) {
                        List<Map<String, Object>> out = new ArrayList<>();

                        while (rs.next()) {
                            Map<String, Object> p = new LinkedHashMap<>();
                            String fn = rs.getString("firstname");
                            String ln = rs.getString("lastname");

                            p.put("id", rs.getInt("providerid"));
                            p.put("name", ((fn == null ? "" : fn) + " " + (ln == null ? "" : ln)).trim());
                            p.put("email", rs.getString("email"));
                            p.put("phone", rs.getString("phonenumber"));
                            p.put("location", rs.getString("city"));
                            p.put("status", rs.getString("status"));

                            Timestamp created = rs.getTimestamp("created_at");
                            p.put("joinDate", created == null ? null : created.toLocalDateTime().toLocalDate().toString());

                            out.add(p);
                        }

                        sendJson(resp, 200, Map.of("ok", true, "data", out));
                        return;
                    }
                }
            }

            if (parts.length >= 3 && !parts[1].isEmpty() && "vehicles".equals(parts[2])) {
                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) {
                    sendJson(resp, 400, error("Invalid provider id"));
                    return;
                }

                sendJson(resp, 200, vehiclesByProvider(con, providerId));
                return;
            }

            if (parts.length >= 2 && !parts[1].isEmpty()) {
                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) {
                    sendJson(resp, 400, error("Invalid provider id"));
                    return;
                }

                Map<String, Object> provider = getProvider(con, providerId);
                if (provider == null) {
                    sendJson(resp, 404, error("Provider not found"));
                    return;
                }

                sendJson(resp, 200, Map.of("ok", true, "data", provider));
                return;
            }

            sendJson(resp, 404, error("Not found"));
        } catch (SQLException e) {
            sendJson(resp, 500, error(e.getMessage()));
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String path = req.getPathInfo();
        String[] parts = (path == null ? "" : path).split("/");

        try (Connection con = DBConnection.getConnection()) {

            if (parts.length >= 3 && !parts[1].isEmpty() && "vehicles".equals(parts[2])) {
                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) {
                    sendJson(resp, 400, error("Invalid provider id"));
                    return;
                }

                if (isProviderSuspended(con, providerId)) {
                    sendJson(resp, 403, error("Provider is suspended. Cannot add vehicles."));
                    return;
                }

                JsonObject body = readJson(req);

                String make = getStringOrNull(body, "make");
                String model = getStringOrNull(body, "model");
                String regNo = getStringOrNull(body, "regNo");
                Integer manufactureYear = getIntOrNull(body, "manufactureYear");
                String color = getStringOrNull(body, "color");
                Integer seats = getIntOrNull(body, "seats");
                Integer engineCapacity = getIntOrNull(body, "engineCapacity");
                String engineNumber = getStringOrNull(body, "engineNumber");
                String chasisNumber = getStringOrNull(body, "chasisNumber");
                String milage = getStringOrNull(body, "milage");
                Double pricePerDay = getDoubleOrNull(body, "pricePerDay");
                String location = getStringOrNull(body, "location");
                String fuelType = getStringOrNull(body, "fuelType");
                String transmission = getStringOrNull(body, "transmission");
                String availabilityStatus = getStringOrNull(body, "availabilityStatus");
                Integer companyId = getIntOrNull(body, "companyId");
                String description = getStringOrNull(body, "description");

                if (make == null || model == null || regNo == null || seats == null || pricePerDay == null) {
                    sendJson(resp, 400, error("Required: make, model, regNo, seats, pricePerDay"));
                    return;
                }

                String sql =
                        "INSERT INTO Vehicle (" +
                                "vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color, numberofpassengers, " +
                                "enginecapacity, enginenumber, chasisnumber, registrationdocumentation, vehicleimages, description, milage, " +
                                "company_id, provider_id, price_per_day, location, features, manufacture_year, transmission, fuel_type, availability_status" +
                                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                try (PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1, make);
                    ps.setString(2, model);
                    ps.setString(3, regNo);
                    ps.setInt(4, 0);
                    ps.setString(5, color != null ? color : "N/A");
                    ps.setInt(6, seats);
                    ps.setInt(7, engineCapacity != null ? engineCapacity : 0);
                    ps.setString(8, engineNumber != null ? engineNumber : "N/A");
                    ps.setString(9, chasisNumber != null ? chasisNumber : "N/A");
                    ps.setBytes(10, new byte[0]);
                    ps.setBytes(11, new byte[0]);
                    ps.setString(12, description);
                    ps.setString(13, milage);

                    if (companyId == null) ps.setNull(14, Types.INTEGER); else ps.setInt(14, companyId);
                    ps.setInt(15, providerId);
                    ps.setDouble(16, pricePerDay);
                    ps.setString(17, location);
                    ps.setNull(18, Types.VARCHAR);
                    if (manufactureYear == null) ps.setNull(19, Types.INTEGER); else ps.setInt(19, manufactureYear);
                    ps.setString(20, transmission);
                    ps.setString(21, fuelType);
                    ps.setString(22, availabilityStatus != null ? availabilityStatus : "available");

                    int n = ps.executeUpdate();
                    if (n == 0) {
                        sendJson(resp, 500, error("Insert failed"));
                        return;
                    }

                    int newId;
                    try (ResultSet keys = ps.getGeneratedKeys()) {
                        if (!keys.next()) {
                            sendJson(resp, 500, error("No generated id"));
                            return;
                        }
                        newId = keys.getInt(1);
                    }

                    sendJson(resp, 201, Map.of("ok", true, "vehicleId", newId));
                    return;
                }
            }

            sendJson(resp, 404, error("Not found"));
        } catch (SQLException e) {
            sendJson(resp, 500, error(e.getMessage()));
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String path = req.getPathInfo();
        String[] parts = (path == null ? "" : path).split("/");

        try (Connection con = DBConnection.getConnection()) {

            if (parts.length >= 3 && !parts[1].isEmpty() &&
                    ("ban".equals(parts[2]) || "unban".equals(parts[2]))) {

                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) {
                    sendJson(resp, 400, error("Invalid provider id"));
                    return;
                }

                String newStatus = "ban".equals(parts[2]) ? "suspended" : "active";

                try (PreparedStatement ps =
                             con.prepareStatement("UPDATE VehicleProvider SET status = ? WHERE providerid = ?")) {
                    ps.setString(1, newStatus);
                    ps.setInt(2, providerId);

                    int updated = ps.executeUpdate();
                    if (updated == 0) {
                        sendJson(resp, 404, error("Provider not found"));
                        return;
                    }

                    sendJson(resp, 200, Map.of("ok", true, "providerId", providerId, "status", newStatus));
                    return;
                }
            }

            if (parts.length >= 2 && !parts[1].isEmpty() && (parts.length == 2 || parts[2].isEmpty())) {
                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) {
                    sendJson(resp, 400, error("Invalid provider id"));
                    return;
                }

                JsonObject body = readJson(req);

                String firstname = getStringOrNull(body, "firstname");
                String lastname = getStringOrNull(body, "lastname");
                String email = getStringOrNull(body, "email");
                String phone = getStringOrNull(body, "phone");
                String housenumber = getStringOrNull(body, "housenumber");
                String street = getStringOrNull(body, "street");
                String city = getStringOrNull(body, "city");
                String zipcode = getStringOrNull(body, "zipcode");
                Integer companyId = getIntOrNull(body, "companyId");
                String status = getStringOrNull(body, "status");

                String sql =
                        "UPDATE VehicleProvider SET " +
                                "firstname = COALESCE(?, firstname), " +
                                "lastname = COALESCE(?, lastname), " +
                                "email = COALESCE(?, email), " +
                                "phonenumber = COALESCE(?, phonenumber), " +
                                "housenumber = COALESCE(?, housenumber), " +
                                "street = COALESCE(?, street), " +
                                "city = COALESCE(?, city), " +
                                "zipcode = COALESCE(?, zipcode), " +
                                "company_id = ?, " +
                                "status = COALESCE(?, status) " +
                                "WHERE providerid = ?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    if (firstname == null) ps.setNull(1, Types.VARCHAR); else ps.setString(1, firstname);
                    if (lastname == null) ps.setNull(2, Types.VARCHAR); else ps.setString(2, lastname);
                    if (email == null) ps.setNull(3, Types.VARCHAR); else ps.setString(3, email);
                    if (phone == null) ps.setNull(4, Types.VARCHAR); else ps.setString(4, phone);
                    if (housenumber == null) ps.setNull(5, Types.VARCHAR); else ps.setString(5, housenumber);
                    if (street == null) ps.setNull(6, Types.VARCHAR); else ps.setString(6, street);
                    if (city == null) ps.setNull(7, Types.VARCHAR); else ps.setString(7, city);
                    if (zipcode == null) ps.setNull(8, Types.VARCHAR); else ps.setString(8, zipcode);
                    if (companyId == null) ps.setNull(9, Types.INTEGER); else ps.setInt(9, companyId);
                    if (status == null) ps.setNull(10, Types.VARCHAR); else ps.setString(10, status);
                    ps.setInt(11, providerId);

                    int updated = ps.executeUpdate();
                    if (updated == 0) {
                        sendJson(resp, 404, error("Provider not found"));
                        return;
                    }

                    sendJson(resp, 200, Map.of("ok", true));
                    return;
                }
            }

            if (parts.length >= 4 && !parts[1].isEmpty() && "vehicles".equals(parts[2]) && !parts[3].isEmpty()) {
                Integer providerId = tryParseInt(parts[1]);
                Integer vehicleId = tryParseInt(parts[3]);

                if (providerId == null || vehicleId == null) {
                    sendJson(resp, 400, error("Invalid ids"));
                    return;
                }

                if (isProviderSuspended(con, providerId)) {
                    sendJson(resp, 403, error("Provider is suspended. Vehicle changes are not allowed."));
                    return;
                }

                JsonObject body = readJson(req);

                String make = getStringOrNull(body, "make");
                String model = getStringOrNull(body, "model");
                String regNo = getStringOrNull(body, "regNo");
                Integer manufactureYear = getIntOrNull(body, "manufactureYear");
                String color = getStringOrNull(body, "color");
                Integer seats = getIntOrNull(body, "seats");
                Integer engineCapacity = getIntOrNull(body, "engineCapacity");
                String engineNumber = getStringOrNull(body, "engineNumber");
                String chasisNumber = getStringOrNull(body, "chasisNumber");
                String milage = getStringOrNull(body, "milage");
                Double pricePerDay = getDoubleOrNull(body, "pricePerDay");
                String location = getStringOrNull(body, "location");
                String fuelType = getStringOrNull(body, "fuelType");
                String transmission = getStringOrNull(body, "transmission");
                String availabilityStatus = getStringOrNull(body, "availabilityStatus");
                Integer companyId = getIntOrNull(body, "companyId");
                String description = getStringOrNull(body, "description");

                String sql =
                        "UPDATE Vehicle SET " +
                                "vehiclebrand = COALESCE(?, vehiclebrand), " +
                                "vehiclemodel = COALESCE(?, vehiclemodel), " +
                                "numberplatenumber = COALESCE(?, numberplatenumber), " +
                                "manufacture_year = COALESCE(?, manufacture_year), " +
                                "color = COALESCE(?, color), " +
                                "numberofpassengers = COALESCE(?, numberofpassengers), " +
                                "enginecapacity = COALESCE(?, enginecapacity), " +
                                "enginenumber = COALESCE(?, enginenumber), " +
                                "chasisnumber = COALESCE(?, chasisnumber), " +
                                "milage = COALESCE(?, milage), " +
                                "price_per_day = COALESCE(?, price_per_day), " +
                                "location = COALESCE(?, location), " +
                                "fuel_type = COALESCE(?, fuel_type), " +
                                "transmission = COALESCE(?, transmission), " +
                                "availability_status = COALESCE(?, availability_status), " +
                                "company_id = ?, " +
                                "description = COALESCE(?, description) " +
                                "WHERE vehicleid = ? AND provider_id = ?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    if (make == null) ps.setNull(1, Types.VARCHAR); else ps.setString(1, make);
                    if (model == null) ps.setNull(2, Types.VARCHAR); else ps.setString(2, model);
                    if (regNo == null) ps.setNull(3, Types.VARCHAR); else ps.setString(3, regNo);
                    if (manufactureYear == null) ps.setNull(4, Types.INTEGER); else ps.setInt(4, manufactureYear);
                    if (color == null) ps.setNull(5, Types.VARCHAR); else ps.setString(5, color);
                    if (seats == null) ps.setNull(6, Types.INTEGER); else ps.setInt(6, seats);
                    if (engineCapacity == null) ps.setNull(7, Types.INTEGER); else ps.setInt(7, engineCapacity);
                    if (engineNumber == null) ps.setNull(8, Types.VARCHAR); else ps.setString(8, engineNumber);
                    if (chasisNumber == null) ps.setNull(9, Types.VARCHAR); else ps.setString(9, chasisNumber);
                    if (milage == null) ps.setNull(10, Types.VARCHAR); else ps.setString(10, milage);
                    if (pricePerDay == null) ps.setNull(11, Types.DECIMAL); else ps.setDouble(11, pricePerDay);
                    if (location == null) ps.setNull(12, Types.VARCHAR); else ps.setString(12, location);
                    if (fuelType == null) ps.setNull(13, Types.VARCHAR); else ps.setString(13, fuelType);
                    if (transmission == null) ps.setNull(14, Types.VARCHAR); else ps.setString(14, transmission);
                    if (availabilityStatus == null) ps.setNull(15, Types.VARCHAR); else ps.setString(15, availabilityStatus);
                    if (companyId == null) ps.setNull(16, Types.INTEGER); else ps.setInt(16, companyId);
                    if (description == null) ps.setNull(17, Types.VARCHAR); else ps.setString(17, description);
                    ps.setInt(18, vehicleId);
                    ps.setInt(19, providerId);

                    int updated = ps.executeUpdate();
                    if (updated == 0) {
                        sendJson(resp, 404, error("Vehicle not found for provider"));
                        return;
                    }

                    sendJson(resp, 200, Map.of("ok", true));
                    return;
                }
            }

            sendJson(resp, 404, error("Not found"));
        } catch (SQLException e) {
            sendJson(resp, 500, error(e.getMessage()));
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String path = req.getPathInfo();
        String[] parts = (path == null ? "" : path).split("/");

        try (Connection con = DBConnection.getConnection()) {
            if (parts.length >= 4 && !parts[1].isEmpty() && "vehicles".equals(parts[2]) && !parts[3].isEmpty()) {
                Integer providerId = tryParseInt(parts[1]);
                Integer vehicleId = tryParseInt(parts[3]);

                if (providerId == null || vehicleId == null) {
                    sendJson(resp, 400, error("Invalid ids"));
                    return;
                }

                if (isProviderSuspended(con, providerId)) {
                    sendJson(resp, 403, error("Provider is suspended. Cannot delete vehicles."));
                    return;
                }

                try (PreparedStatement ps = con.prepareStatement(
                        "DELETE FROM Vehicle WHERE vehicleid = ? AND provider_id = ?")) {
                    ps.setInt(1, vehicleId);
                    ps.setInt(2, providerId);

                    int deleted = ps.executeUpdate();
                    if (deleted == 0) {
                        sendJson(resp, 404, error("Vehicle not found for provider"));
                        return;
                    }

                    sendJson(resp, 200, Map.of("ok", true));
                    return;
                }
            }

            sendJson(resp, 404, error("Not found"));
        } catch (SQLException e) {
            sendJson(resp, 500, error(e.getMessage()));
        }
    }

    private Map<String, Object> getProvider(Connection con, int providerId) throws SQLException {
        String sql =
                "SELECT providerid, username, email, firstname, lastname, phonenumber, housenumber, street, city, zipcode, company_id, " +
                        "COALESCE(status,'pending') AS status, created_at " +
                        "FROM VehicleProvider WHERE providerid = ?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                Map<String, Object> p = new LinkedHashMap<>();
                p.put("id", rs.getInt("providerid"));
                p.put("username", rs.getString("username"));
                p.put("firstname", rs.getString("firstname"));
                p.put("lastname", rs.getString("lastname"));
                p.put("email", rs.getString("email"));
                p.put("phone", rs.getString("phonenumber"));
                p.put("housenumber", rs.getString("housenumber"));
                p.put("street", rs.getString("street"));
                p.put("city", rs.getString("city"));
                p.put("zipcode", rs.getString("zipcode"));
                p.put("companyId", rs.getObject("company_id"));
                p.put("status", rs.getString("status"));

                Timestamp created = rs.getTimestamp("created_at");
                p.put("joinDate", created == null ? null : created.toLocalDateTime().toLocalDate().toString());

                return p;
            }
        }
    }

    private boolean isProviderSuspended(Connection con, int providerId) throws SQLException {
        try (PreparedStatement ps = con.prepareStatement(
                "SELECT COALESCE(status,'pending') AS status FROM VehicleProvider WHERE providerid = ?")) {
            ps.setInt(1, providerId);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return false;
                return "suspended".equalsIgnoreCase(rs.getString("status"));
            }
        }
    }

    private Map<String, Object> vehiclesByProvider(Connection con, int providerId) throws SQLException {
        String sql =
                "SELECT v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.manufacture_year, v.color, " +
                        "v.numberofpassengers, v.enginecapacity, v.enginenumber, v.chasisnumber, v.milage, v.price_per_day, " +
                        "v.location, v.fuel_type, v.transmission, v.availability_status, v.company_id, v.description, " +
                        "rc.companyname AS rental_company_name " +
                        "FROM Vehicle v " +
                        "LEFT JOIN RentalCompany rc ON rc.companyid = v.company_id " +
                        "WHERE v.provider_id = ? " +
                        "ORDER BY v.vehicleid DESC";

        List<Map<String, Object>> list = new ArrayList<>();

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> v = new LinkedHashMap<>();
                    v.put("id", rs.getInt("vehicleid"));
                    v.put("make", rs.getString("vehiclebrand"));
                    v.put("model", rs.getString("vehiclemodel"));
                    v.put("regNo", rs.getString("numberplatenumber"));
                    v.put("manufactureYear", rs.getObject("manufacture_year"));
                    v.put("color", rs.getString("color"));
                    v.put("seats", rs.getObject("numberofpassengers"));
                    v.put("engineCapacity", rs.getObject("enginecapacity"));
                    v.put("engineNumber", rs.getString("enginenumber"));
                    v.put("chasisNumber", rs.getString("chasisnumber"));
                    v.put("milage", rs.getString("milage"));
                    v.put("pricePerDay", rs.getObject("price_per_day"));
                    v.put("location", rs.getString("location"));
                    v.put("fuelType", rs.getString("fuel_type"));
                    v.put("transmission", rs.getString("transmission"));
                    v.put("availabilityStatus", rs.getString("availability_status"));
                    v.put("companyId", rs.getObject("company_id"));
                    v.put("description", rs.getString("description"));
                    v.put("rentalCompany", rs.getString("rental_company_name") == null ? "Not assigned" : rs.getString("rental_company_name"));
                    list.add(v);
                }
            }
        }

        return Map.of("ok", true, "data", list);
    }
}