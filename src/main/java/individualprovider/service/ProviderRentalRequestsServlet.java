package individualprovider.service;

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
import java.sql.*;
import java.util.*;

@WebServlet("/api/provider/rental-requests/*")
public class ProviderRentalRequestsServlet extends HttpServlet {

    private final Gson gson = new Gson();

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
        resp.setHeader("Access-Control-Allow-Credentials", "true");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    private Integer getProviderIdFromSession(HttpServletRequest req) {
        try {
            Object actorType = req.getSession(false) != null ? req.getSession(false).getAttribute("actorType") : null;
            Object actorId   = req.getSession(false) != null ? req.getSession(false).getAttribute("actorId")   : null;
            if (actorType != null && "PROVIDER".equalsIgnoreCase(String.valueOf(actorType)) && actorId != null) {
                return Integer.parseInt(String.valueOf(actorId));
            }
        } catch (Exception ignored) {}
        return null;
    }

    private JsonObject readJson(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = req.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        return JsonParser.parseString(sb.toString()).getAsJsonObject();
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        s = s.trim();
        return s.isEmpty() ? null : s;
    }

    private static Integer parseIntOrNull(String s) {
        try {
            s = trimToNull(s);
            if (s == null) return null;
            return Integer.parseInt(s);
        } catch (Exception e) {
            return null;
        }
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }

    private Set<String> getColumns(Connection con, String table) throws SQLException {
        Set<String> normalized = new HashSet<>();
        DatabaseMetaData md = con.getMetaData();
        try (ResultSet rs = md.getColumns(con.getCatalog(), null, table, null)) {
            while (rs.next()) normalized.add(rs.getString("COLUMN_NAME").toLowerCase());
        }
        return normalized;
    }

    /** Returns true if the table exists in the current schema */
    private boolean tableExists(Connection con, String table) {
        try (ResultSet rs = con.getMetaData().getTables(con.getCatalog(), null, table, null)) {
            return rs.next();
        } catch (SQLException e) {
            return false;
        }
    }

    private String getProviderProfile(Connection con, int providerId) throws SQLException {
        String[] tables = {"VehicleProvider", "VehicleProviders", "vehicleprovider", "vehicleproviders", "Vehicle_Provider"};

        String foundTable = null;
        for (String t : tables) {
            try (PreparedStatement ps = con.prepareStatement("SELECT 1 FROM " + t + " LIMIT 1")) {
                ps.executeQuery();
                foundTable = t;
                break;
            } catch (SQLException ignored) {}
        }

        if (foundTable == null) return "{\"provider\":{}}";

        Set<String> cols = getColumns(con, foundTable);

        String idCol        = cols.contains("providerid")    ? "providerid"    : (cols.contains("provider_id") ? "provider_id" : "providerid");
        String usernameCol  = cols.contains("username")      ? "username"      : null;
        String firstNameCol = cols.contains("firstname")     ? "firstname"     : (cols.contains("first_name")  ? "first_name"  : null);
        String lastNameCol  = cols.contains("lastname")      ? "lastname"      : (cols.contains("last_name")   ? "last_name"   : null);
        String emailCol     = cols.contains("email")         ? "email"         : null;
        String phoneCol     = cols.contains("phonenumber")   ? "phonenumber"   : (cols.contains("mobile") ? "mobile" : (cols.contains("mobilenumber") ? "mobilenumber" : null));

        List<String> select = new ArrayList<>();
        select.add(idCol + " AS provider_id");
        if (usernameCol  != null) select.add(usernameCol);
        if (firstNameCol != null) select.add(firstNameCol + " AS firstname");
        if (lastNameCol  != null) select.add(lastNameCol  + " AS lastname");
        if (emailCol     != null) select.add(emailCol);
        if (phoneCol     != null) select.add(phoneCol + " AS phone");

        String sql = "SELECT " + String.join(", ", select) + " FROM " + foundTable + " WHERE " + idCol + " = ? LIMIT 1";

        JsonObject out = new JsonObject();
        JsonObject p   = new JsonObject();

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    p.addProperty("providerId", rs.getInt("provider_id"));
                    p.addProperty("username",   safeGet(rs, "username"));
                    p.addProperty("firstname",  safeGet(rs, "firstname"));
                    p.addProperty("lastname",   safeGet(rs, "lastname"));
                    p.addProperty("email",      safeGet(rs, "email"));
                    p.addProperty("phone",      safeGet(rs, "phone"));

                    String fullName = (safeGet(rs, "firstname") == null ? "" : safeGet(rs, "firstname")) +
                            (safeGet(rs, "lastname")  == null ? "" : (" " + safeGet(rs, "lastname")));
                    p.addProperty("fullName", fullName.trim());
                }
            }
        }

        out.add("provider", p);
        return gson.toJson(out);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = req.getPathInfo();
        if (path == null) path = "/";

        Integer providerId = getProviderIdFromSession(req);
        if (providerId == null) {
            resp.setStatus(401);
            resp.getWriter().write("{\"error\":\"Not logged in as PROVIDER\"}");
            return;
        }

        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(500);
                resp.getWriter().write("{\"error\":\"DB connection failed\"}");
                return;
            }

            if ("/companies".equalsIgnoreCase(path)) {
                resp.getWriter().write(listCompanies(con));
                return;
            }

            if (path.startsWith("/companies/")) {
                String companyIdStr = path.substring("/companies/".length());
                Integer companyId = parseIntOrNull(companyIdStr);
                if (companyId == null) {
                    resp.setStatus(400);
                    resp.getWriter().write("{\"error\":\"Invalid company ID\"}");
                    return;
                }
                resp.getWriter().write(getCompanyDetails(con, companyId));
                return;
            }

            if ("/eligible-vehicles".equalsIgnoreCase(path)) {
                resp.getWriter().write(listEligibleVehicles(con, providerId));
                return;
            }

            if ("/mine".equalsIgnoreCase(path)) {
                resp.getWriter().write(listMyRequests(con, providerId));
                return;
            }

            if ("/profile".equalsIgnoreCase(path)) {
                resp.getWriter().write(getProviderProfile(con, providerId));
                return;
            }

            resp.setStatus(404);
            resp.getWriter().write("{\"error\":\"Not found\"}");

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"SQL Error: " + escapeJson(e.getMessage()) + "\"}");
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // LIST COMPANIES — fetches real driver count, vehicle count, and avg rating
    // ─────────────────────────────────────────────────────────────────────────
    private String listCompanies(Connection con) throws SQLException {
        Set<String> cols = getColumns(con, "RentalCompany");
        boolean hasRatings = tableExists(con, "ratings");

        String idCol = cols.contains("companyid") ? "companyid" : (cols.contains("company_id") ? "company_id" : "companyid");

        // Build the SELECT list for RentalCompany columns
        List<String> rcSelect = new ArrayList<>();
        rcSelect.add("rc." + idCol + " AS companyid");

        if (cols.contains("companyname"))          rcSelect.add("rc.companyname");
        else if (cols.contains("name"))            rcSelect.add("rc.name AS companyname");

        // Use city as location since there's no standalone location column in your schema
        if (cols.contains("location"))             rcSelect.add("rc.location");
        else if (cols.contains("city"))            rcSelect.add("rc.city AS location");

        if (cols.contains("description"))          rcSelect.add("rc.description");

        if (cols.contains("businesslicensenumber"))          rcSelect.add("rc.businesslicensenumber");
        else if (cols.contains("business_license_number"))   rcSelect.add("rc.business_license_number AS businesslicensenumber");

        // Real counts via subqueries (always safe — tables exist in your schema)
        rcSelect.add("(SELECT COUNT(*) FROM Driver d WHERE d.company_id = rc." + idCol + ") AS driver_count");
        rcSelect.add("(SELECT COUNT(*) FROM Vehicle v WHERE v.company_id = rc." + idCol + ") AS vehicle_count");

        // Real average rating — only if ratings table exists and has a companyid column
        if (hasRatings) {
            Set<String> ratingCols = getColumns(con, "ratings");
            if (ratingCols.contains("companyid") && ratingCols.contains("rating_value")) {
                rcSelect.add(
                        "(SELECT ROUND(AVG(r.rating_value),1) FROM ratings r WHERE r.companyid = rc." + idCol + ") AS avg_rating"
                );
                rcSelect.add(
                        "(SELECT COUNT(*) FROM ratings r WHERE r.companyid = rc." + idCol + ") AS review_count"
                );
            } else {
                rcSelect.add("NULL AS avg_rating");
                rcSelect.add("0 AS review_count");
            }
        } else {
            rcSelect.add("NULL AS avg_rating");
            rcSelect.add("0 AS review_count");
        }

        StringBuilder sql = new StringBuilder("SELECT " + String.join(", ", rcSelect) + " FROM RentalCompany rc");
        if (cols.contains("status")) {
            sql.append(" WHERE rc.status IN ('active','approved','Active','Approved')");
        }
        sql.append(" ORDER BY rc.").append(idCol).append(" DESC");

        List<Map<String, Object>> rows = new ArrayList<>();
        try (PreparedStatement ps = con.prepareStatement(sql.toString());
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("companyid",            rs.getInt("companyid"));
                m.put("companyname",          safeGet(rs, "companyname"));
                m.put("location",             safeGet(rs, "location"));
                m.put("description",          safeGet(rs, "description"));
                m.put("businesslicensenumber",safeGet(rs, "businesslicensenumber"));

                // Real values from DB
                m.put("drivers",  rs.getInt("driver_count"));
                m.put("vehicles", rs.getInt("vehicle_count"));

                // Rating: use real avg if available, otherwise null (frontend shows "No ratings yet")
                double avg = rs.getDouble("avg_rating");
                m.put("rating",  rs.wasNull() ? null : avg);
                m.put("reviews", rs.getInt("review_count"));

                rows.add(m);
            }
        }

        JsonObject out = new JsonObject();
        out.addProperty("count", rows.size());
        out.add("companies", gson.toJsonTree(rows));
        return gson.toJson(out);
    }

    private String safeGet(ResultSet rs, String col) {
        try { return rs.getString(col); } catch (Exception e) { return null; }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET COMPANY DETAILS — also uses real counts and ratings
    // ─────────────────────────────────────────────────────────────────────────
    private String getCompanyDetails(Connection con, int companyId) throws SQLException {
        Set<String> cols       = getColumns(con, "RentalCompany");
        boolean     hasRatings = tableExists(con, "ratings");

        String idCol = cols.contains("companyid") ? "companyid" : (cols.contains("company_id") ? "company_id" : "companyid");

        List<String> select = new ArrayList<>();
        select.add(idCol + " AS companyid");

        if (cols.contains("companyname"))          select.add("companyname");
        else if (cols.contains("name"))            select.add("name AS companyname");

        if (cols.contains("companyemail"))         select.add("companyemail");
        if (cols.contains("phone"))                select.add("phone");
        if (cols.contains("registrationnumber"))   select.add("registrationnumber");
        if (cols.contains("taxid"))                select.add("taxid");
        if (cols.contains("street"))               select.add("street");
        if (cols.contains("city"))                 select.add("city");
        if (cols.contains("description"))          select.add("description");
        if (cols.contains("terms"))                select.add("terms");
        if (cols.contains("certificatepath"))      select.add("certificatepath");
        if (cols.contains("taxdocumentpath"))      select.add("taxdocumentpath");

        if (cols.contains("businesslicensenumber"))        select.add("businesslicensenumber");
        else if (cols.contains("business_license_number")) select.add("business_license_number AS businesslicensenumber");

        String sql = "SELECT " + String.join(", ", select) + " FROM RentalCompany WHERE " + idCol + " = ? LIMIT 1";

        Map<String, Object> company = new LinkedHashMap<>();
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    company.put("companyid",             rs.getInt("companyid"));
                    company.put("companyname",           safeGet(rs, "companyname"));
                    company.put("companyemail",          safeGet(rs, "companyemail"));
                    company.put("phone",                 safeGet(rs, "phone"));
                    company.put("registrationnumber",    safeGet(rs, "registrationnumber"));
                    company.put("taxid",                 safeGet(rs, "taxid"));
                    company.put("street",                safeGet(rs, "street"));
                    company.put("city",                  safeGet(rs, "city"));
                    company.put("description",           safeGet(rs, "description"));
                    company.put("terms",                 safeGet(rs, "terms"));
                    company.put("certificatepath",       safeGet(rs, "certificatepath"));
                    company.put("taxdocumentpath",       safeGet(rs, "taxdocumentpath"));
                    company.put("businesslicensenumber", safeGet(rs, "businesslicensenumber"));

                    // Real driver count
                    try (PreparedStatement ps2 = con.prepareStatement("SELECT COUNT(*) FROM Driver WHERE company_id = ?")) {
                        ps2.setInt(1, companyId);
                        try (ResultSet rs2 = ps2.executeQuery()) {
                            company.put("drivers", rs2.next() ? rs2.getInt(1) : 0);
                        }
                    }

                    // Real vehicle count
                    try (PreparedStatement ps2 = con.prepareStatement("SELECT COUNT(*) FROM Vehicle WHERE company_id = ?")) {
                        ps2.setInt(1, companyId);
                        try (ResultSet rs2 = ps2.executeQuery()) {
                            company.put("vehicles", rs2.next() ? rs2.getInt(1) : 0);
                        }
                    }

                    // Real rating and review count
                    if (hasRatings) {
                        Set<String> ratingCols = getColumns(con, "ratings");
                        if (ratingCols.contains("companyid") && ratingCols.contains("rating_value")) {
                            String rSql = "SELECT ROUND(AVG(rating_value),1) AS avg_r, COUNT(*) AS cnt FROM ratings WHERE companyid = ?";
                            try (PreparedStatement ps2 = con.prepareStatement(rSql)) {
                                ps2.setInt(1, companyId);
                                try (ResultSet rs2 = ps2.executeQuery()) {
                                    if (rs2.next()) {
                                        double avg = rs2.getDouble("avg_r");
                                        company.put("rating",  rs2.wasNull() ? null : avg);
                                        company.put("reviews", rs2.getInt("cnt"));
                                    }
                                }
                            }
                        } else {
                            company.put("rating",  null);
                            company.put("reviews", 0);
                        }
                    } else {
                        company.put("rating",  null);
                        company.put("reviews", 0);
                    }

                } else {
                    JsonObject error = new JsonObject();
                    error.addProperty("error", "Company not found");
                    return gson.toJson(error);
                }
            }
        }

        JsonObject out = new JsonObject();
        out.add("company", gson.toJsonTree(company));
        return gson.toJson(out);
    }

    private String listEligibleVehicles(Connection con, int providerId) throws SQLException {
        String sql =
                "SELECT v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.location, v.price_per_day " +
                        "FROM Vehicle v " +
                        "WHERE v.provider_id = ? AND (v.company_id IS NULL OR v.company_id = 0) " +
                        "AND v.vehicleid NOT IN ( " +
                        "  SELECT pr.vehicle_id FROM ProviderRentalRequests pr " +
                        "  WHERE pr.provider_id = ? AND pr.status = 'pending' " +
                        ") " +
                        "ORDER BY v.vehicleid DESC";

        List<Map<String, Object>> vehicles = new ArrayList<>();
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);
            ps.setInt(2, providerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> v = new LinkedHashMap<>();
                    v.put("vehicleid",         rs.getInt("vehicleid"));
                    v.put("vehiclebrand",       rs.getString("vehiclebrand"));
                    v.put("vehiclemodel",       rs.getString("vehiclemodel"));
                    v.put("numberplatenumber",  rs.getString("numberplatenumber"));
                    v.put("location",           rs.getString("location"));
                    v.put("price_per_day",      rs.getBigDecimal("price_per_day"));
                    vehicles.add(v);
                }
            }
        }

        JsonObject out = new JsonObject();
        out.addProperty("count", vehicles.size());
        out.add("vehicles", gson.toJsonTree(vehicles));
        return gson.toJson(out);
    }

    private String listMyRequests(Connection con, int providerId) throws SQLException {
        Set<String> cols = getColumns(con, "RentalCompany");

        String companyIdCol   = cols.contains("companyid")   ? "companyid"   : (cols.contains("company_id") ? "company_id" : "companyid");
        String companyNameCol = cols.contains("companyname") ? "companyname" : (cols.contains("name") ? "name" : null);
        String streetCol      = cols.contains("street")      ? "street"      : null;
        String cityCol        = cols.contains("city")        ? "city"        : null;

        List<String> select = new ArrayList<>();
        select.add("pr.request_id");
        select.add("pr.company_id");
        select.add("pr.vehicle_id");
        select.add("pr.status");
        select.add("pr.message");
        select.add("pr.requested_at");
        select.add("pr.responded_at");

        if (companyNameCol != null) select.add("rc." + companyNameCol + " AS companyname");
        if (streetCol      != null) select.add("rc." + streetCol      + " AS street");
        if (cityCol        != null) select.add("rc." + cityCol        + " AS city");

        String sql =
                "SELECT " + String.join(", ", select) + " " +
                        "FROM ProviderRentalRequests pr " +
                        "LEFT JOIN RentalCompany rc ON rc." + companyIdCol + " = pr.company_id " +
                        "WHERE pr.provider_id = ? " +
                        "ORDER BY pr.request_id DESC";

        List<Map<String, Object>> rows = new ArrayList<>();
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("request_id",   rs.getInt("request_id"));
                    m.put("company_id",   rs.getInt("company_id"));
                    m.put("vehicle_id",   rs.getInt("vehicle_id"));
                    m.put("status",       rs.getString("status"));
                    m.put("message",      rs.getString("message"));
                    m.put("requested_at", rs.getString("requested_at"));
                    m.put("responded_at", rs.getString("responded_at"));
                    m.put("companyname",  safeGet(rs, "companyname"));
                    m.put("location",     buildLocation(safeGet(rs, "street"), safeGet(rs, "city")));
                    rows.add(m);
                }
            }
        }

        JsonObject out = new JsonObject();
        out.addProperty("count", rows.size());
        out.add("requests", gson.toJsonTree(rows));
        return gson.toJson(out);
    }

    private String buildLocation(String street, String city) {
        street = trimToNull(street);
        city   = trimToNull(city);
        if (street == null && city == null) return null;
        if (street == null) return city;
        if (city   == null) return street;
        return street + ", " + city;
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer providerId = getProviderIdFromSession(req);
        if (providerId == null) {
            resp.setStatus(401);
            resp.getWriter().write("{\"error\":\"Not logged in as PROVIDER\"}");
            return;
        }

        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(500);
                resp.getWriter().write("{\"error\":\"DB connection failed\"}");
                return;
            }

            JsonObject body = readJson(req);

            Integer companyId = body.has("company_id") ? body.get("company_id").getAsInt() : null;
            Integer vehicleId = body.has("vehicle_id") ? body.get("vehicle_id").getAsInt() : null;
            String  message   = body.has("message")    ? trimToNull(body.get("message").getAsString()) : null;

            if (companyId == null || vehicleId == null) {
                resp.setStatus(400);
                resp.getWriter().write("{\"error\":\"company_id and vehicle_id are required\"}");
                return;
            }

            // Ensure vehicle belongs to provider and is not yet assigned
            String checkVehicle =
                    "SELECT vehicleid FROM Vehicle WHERE vehicleid=? AND provider_id=? AND (company_id IS NULL OR company_id=0)";
            try (PreparedStatement ps = con.prepareStatement(checkVehicle)) {
                ps.setInt(1, vehicleId);
                ps.setInt(2, providerId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        resp.setStatus(400);
                        resp.getWriter().write("{\"error\":\"Vehicle not eligible (not yours or already assigned)\"}");
                        return;
                    }
                }
            }

            // Prevent duplicate pending request for same vehicle
            String dup =
                    "SELECT request_id FROM ProviderRentalRequests " +
                            "WHERE provider_id=? AND vehicle_id=? AND status='pending' LIMIT 1";
            try (PreparedStatement ps = con.prepareStatement(dup)) {
                ps.setInt(1, providerId);
                ps.setInt(2, vehicleId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        resp.setStatus(409);
                        resp.getWriter().write("{\"error\":\"A pending request already exists for this vehicle\"}");
                        return;
                    }
                }
            }

            String insert =
                    "INSERT INTO ProviderRentalRequests (provider_id, vehicle_id, company_id, status, message) " +
                            "VALUES (?,?,?,?,?)";
            int newId;
            try (PreparedStatement ps = con.prepareStatement(insert, Statement.RETURN_GENERATED_KEYS)) {
                ps.setInt(1, providerId);
                ps.setInt(2, vehicleId);
                ps.setInt(3, companyId);
                ps.setString(4, "pending");
                ps.setString(5, message);
                ps.executeUpdate();
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    keys.next();
                    newId = keys.getInt(1);
                }
            }

            resp.getWriter().write("{\"status\":\"success\",\"request_id\":" + newId + "}");

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"SQL Error: " + escapeJson(e.getMessage()) + "\"}");
        }
    }
}