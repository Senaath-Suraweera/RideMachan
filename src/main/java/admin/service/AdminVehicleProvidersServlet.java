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

    // ============================= GET =============================
    // GET  /api/admin/vehicle-providers
    // GET  /api/admin/vehicle-providers/{id}
    // GET  /api/admin/vehicle-providers/{id}/vehicles
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String path = req.getPathInfo(); // null, "/", "/{id}", "/{id}/vehicles"
        String[] parts = (path == null ? "" : path).split("/");

        try (Connection con = DBConnection.getConnection()) {

            // LIST providers
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
                    sql.append(" AND (LOWER(firstname) LIKE ? OR LOWER(lastname) LIKE ? OR LOWER(email) LIKE ? OR LOWER(username) LIKE ? OR phonenumber LIKE ?) ");
                    String like = "%" + q.trim().toLowerCase() + "%";
                    params.add(like); params.add(like); params.add(like); params.add(like);
                    params.add("%" + q.trim() + "%");
                }
                if (status != null && !status.trim().isEmpty()) {
                    sql.append(" AND COALESCE(status,'pending') = ? ");
                    params.add(status.trim());
                }
                if (city != null && !city.trim().isEmpty()) {
                    sql.append(" AND city = ? ");
                    params.add(city.trim());
                }

                sql.append(" ORDER BY providerid DESC");

                try (PreparedStatement ps = con.prepareStatement(sql.toString())) {
                    for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
                    try (ResultSet rs = ps.executeQuery()) {
                        List<Map<String, Object>> out = new ArrayList<>();
                        while (rs.next()) {
                            Map<String, Object> p = new LinkedHashMap<>();
                            int id = rs.getInt("providerid");
                            String fn = rs.getString("firstname");
                            String ln = rs.getString("lastname");

                            p.put("id", id);
                            p.put("name", ((fn == null ? "" : fn) + " " + (ln == null ? "" : ln)).trim());
                            p.put("email", rs.getString("email"));
                            p.put("phone", rs.getString("phonenumber"));
                            p.put("location", rs.getString("city"));
                            p.put("status", rs.getString("status"));

                            Timestamp created = null;
                            try { created = rs.getTimestamp("created_at"); } catch (SQLException ignore) {}
                            p.put("joinDate", created == null ? null : created.toLocalDateTime().toLocalDate().toString());

                            // NO ratings/reviews
                            out.add(p);
                        }
                        Map<String, Object> res = new LinkedHashMap<>();
                        res.put("ok", true);
                        res.put("data", out);
                        sendJson(resp, 200, res);
                        return;
                    }
                }
            }

            // /{id}/vehicles
            if (parts.length >= 3 && !parts[1].isEmpty() && "vehicles".equals(parts[2])) {
                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) { sendJson(resp, 400, error("Invalid provider id")); return; }
                sendJson(resp, 200, vehiclesByProvider(con, providerId));
                return;
            }

            // /{id}
            if (parts.length >= 2 && !parts[1].isEmpty()) {
                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) { sendJson(resp, 400, error("Invalid provider id")); return; }

                Map<String, Object> provider = getProvider(con, providerId);
                if (provider == null) { sendJson(resp, 404, error("Provider not found")); return; }

                provider.put("vehicles", vehiclesByProvider(con, providerId).get("data"));

                Map<String, Object> res = new LinkedHashMap<>();
                res.put("ok", true);
                res.put("data", provider);
                sendJson(resp, 200, res);
                return;
            }

            sendJson(resp, 404, error("Not found"));
        } catch (SQLException e) {
            sendJson(resp, 500, error(e.getMessage()));
        }
    }

    // ============================= POST =============================
    // POST /api/admin/vehicle-providers/{id}/vehicles
    // Uses price_per_day (required) and inserts required NOT NULL columns too.
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String path = req.getPathInfo();
        String[] parts = (path == null ? "" : path).split("/");

        try (Connection con = DBConnection.getConnection()) {

            // POST /{id}/vehicles
            if (parts.length >= 3 && !parts[1].isEmpty() && "vehicles".equals(parts[2])) {
                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) { sendJson(resp, 400, error("Invalid provider id")); return; }

                if (isProviderSuspended(con, providerId)) {
                    sendJson(resp, 403, error("Provider is suspended. Cannot add vehicles."));
                    return;
                }


                JsonObject body = readJson(req);

                String make = body.has("make") ? body.get("make").getAsString() : null;
                String model = body.has("model") ? body.get("model").getAsString() : null;
                String regNo = body.has("regNo") ? body.get("regNo").getAsString() : null;

                Integer seats = body.has("seats") && !body.get("seats").isJsonNull() ? body.get("seats").getAsInt() : null;

                Double pricePerDay = body.has("pricePerDay") && !body.get("pricePerDay").isJsonNull()
                        ? body.get("pricePerDay").getAsDouble()
                        : null;

                Integer companyId = body.has("companyId") && !body.get("companyId").isJsonNull()
                        ? body.get("companyId").getAsInt()
                        : null; // NULL = not assigned

                // You MUST provide required fields
                if (make == null || model == null || regNo == null || seats == null || pricePerDay == null) {
                    sendJson(resp, 400, error("Required: make, model, regNo, seats, pricePerDay"));
                    return;
                }

                // Vehicle table has MANY NOT NULL columns. Provide safe defaults.
                String sql =
                        "INSERT INTO Vehicle (" +
                                "vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color, numberofpassengers, " +
                                "enginecapacity, enginenumber, chasisnumber, registrationdocumentation, vehicleimages, " +
                                "description, milage, company_id, provider_id, price_per_day" +
                                ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                try (PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                    ps.setString(1, make);
                    ps.setString(2, model);
                    ps.setString(3, regNo);

                    // required NOT NULL columns
                    ps.setInt(4, 0);              // tareweight
                    ps.setString(5, "N/A");        // color
                    ps.setInt(6, seats);           // numberofpassengers
                    ps.setInt(7, 0);               // enginecapacity
                    ps.setString(8, "N/A");        // enginenumber
                    ps.setString(9, "N/A");        // chasisnumber

                    // required LONGBLOB NOT NULL
                    ps.setBytes(10, new byte[0]);  // registrationdocumentation
                    ps.setBytes(11, new byte[0]);  // vehicleimages

                    // optional
                    ps.setNull(12, Types.VARCHAR); // description
                    ps.setNull(13, Types.VARCHAR); // milage

                    if (companyId == null) ps.setNull(14, Types.INTEGER); else ps.setInt(14, companyId);
                    ps.setInt(15, providerId);

                    // THE MAIN POINT: use price_per_day
                    ps.setDouble(16, pricePerDay);

                    int n = ps.executeUpdate();
                    if (n == 0) { sendJson(resp, 500, error("Insert failed")); return; }

                    int newId;
                    try (ResultSet keys = ps.getGeneratedKeys()) {
                        if (!keys.next()) { sendJson(resp, 500, error("No generated id")); return; }
                        newId = keys.getInt(1);
                    }

                    Map<String, Object> res = new LinkedHashMap<>();
                    res.put("ok", true);
                    res.put("vehicleId", newId);
                    sendJson(resp, 201, res);
                    return;
                }
            }

            sendJson(resp, 404, error("Not found"));
        } catch (SQLException e) {
            sendJson(resp, 500, error(e.getMessage()));
        }
    }

    // ============================= PUT =============================
    // PUT /api/admin/vehicle-providers/{id} (update provider)
    // PUT /api/admin/vehicle-providers/{id}/vehicles/{vehicleId} (update vehicle fields + pricePerDay)
    // PUT /api/admin/vehicle-providers/{id}/vehicles/{vehicleId}/assign {companyId}
    // PUT /api/admin/vehicle-providers/{id}/vehicles/{vehicleId}/unassign
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String path = req.getPathInfo();
        String[] parts = (path == null ? "" : path).split("/");

        try (Connection con = DBConnection.getConnection()) {

            // ✅ PUT /{id}/ban  and  PUT /{id}/unban
            if (parts.length >= 3 && !parts[1].isEmpty() && !parts[2].isEmpty()
                    && ("ban".equals(parts[2]) || "unban".equals(parts[2]))) {

                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) { sendJson(resp, 400, error("Invalid provider id")); return; }



                String newStatus = "ban".equals(parts[2]) ? "suspended" : "active";

                String sql = "UPDATE VehicleProvider SET status = ? WHERE providerid = ?";
                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setString(1, newStatus);
                    ps.setInt(2, providerId);

                    int updated = ps.executeUpdate();
                    if (updated == 0) { sendJson(resp, 404, error("Provider not found")); return; }

                    Map<String, Object> res = new LinkedHashMap<>();
                    res.put("ok", true);
                    res.put("providerId", providerId);
                    res.put("status", newStatus);
                    sendJson(resp, 200, res);
                    return;
                }
            }


            // PUT /{id}
            if (parts.length >= 2 && !parts[1].isEmpty() && (parts.length == 2 || parts[2].isEmpty())) {
                Integer providerId = tryParseInt(parts[1]);


                if (providerId == null) { sendJson(resp, 400, error("Invalid provider id")); return; }

                if (isProviderSuspended(con, providerId)) {
                    sendJson(resp, 403, error("Provider is suspended. Vehicle changes are not allowed."));
                    return;
                }

                JsonObject body = readJson(req);
                String status = body.has("status") ? body.get("status").getAsString() : null;
                String phone = body.has("phone") ? body.get("phone").getAsString() : null;
                String city = body.has("location") ? body.get("location").getAsString() : null;

                String sql =
                        "UPDATE VehicleProvider SET " +
                                "status = COALESCE(?, status), " +
                                "phonenumber = COALESCE(?, phonenumber), " +
                                "city = COALESCE(?, city) " +
                                "WHERE providerid = ?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    if (status == null || status.trim().isEmpty()) ps.setNull(1, Types.VARCHAR); else ps.setString(1, status);
                    if (phone == null || phone.trim().isEmpty()) ps.setNull(2, Types.VARCHAR); else ps.setString(2, phone);
                    if (city == null || city.trim().isEmpty()) ps.setNull(3, Types.VARCHAR); else ps.setString(3, city);
                    ps.setInt(4, providerId);

                    int updated = ps.executeUpdate();
                    if (updated == 0) { sendJson(resp, 404, error("Provider not found")); return; }

                    sendJson(resp, 200, Map.of("ok", true));
                    return;
                }
            }

            // vehicle routes: /{id}/vehicles/{vehicleId}...
            if (parts.length >= 4 && !parts[1].isEmpty() && "vehicles".equals(parts[2]) && !parts[3].isEmpty()) {
                Integer providerId = tryParseInt(parts[1]);
                Integer vehicleId = tryParseInt(parts[3]);
                if (providerId == null || vehicleId == null) { sendJson(resp, 400, error("Invalid ids")); return; }

                if (isProviderSuspended(con, providerId)) {
                    sendJson(resp, 403, error("Provider is suspended. Vehicle changes are not allowed."));
                    return;
                }

                // /assign
                if (parts.length >= 5 && "assign".equals(parts[4])) {
                    JsonObject body = readJson(req);
                    Integer companyId = body.has("companyId") && !body.get("companyId").isJsonNull()
                            ? body.get("companyId").getAsInt()
                            : null;
                    if (companyId == null) { sendJson(resp, 400, error("companyId is required")); return; }

                    String sql = "UPDATE Vehicle SET company_id = ? WHERE vehicleid = ? AND provider_id = ?";
                    try (PreparedStatement ps = con.prepareStatement(sql)) {
                        ps.setInt(1, companyId);
                        ps.setInt(2, vehicleId);
                        ps.setInt(3, providerId);
                        int updated = ps.executeUpdate();
                        if (updated == 0) { sendJson(resp, 404, error("Vehicle not found for provider")); return; }
                        sendJson(resp, 200, Map.of("ok", true));
                        return;
                    }
                }

                // /unassign
                if (parts.length >= 5 && "unassign".equals(parts[4])) {
                    String sql = "UPDATE Vehicle SET company_id = NULL WHERE vehicleid = ? AND provider_id = ?";
                    try (PreparedStatement ps = con.prepareStatement(sql)) {
                        ps.setInt(1, vehicleId);
                        ps.setInt(2, providerId);
                        int updated = ps.executeUpdate();
                        if (updated == 0) { sendJson(resp, 404, error("Vehicle not found for provider")); return; }
                        sendJson(resp, 200, Map.of("ok", true));
                        return;
                    }
                }

                // PUT /{id}/vehicles/{vehicleId} update basic fields + price_per_day
                JsonObject body = readJson(req);

                String make = body.has("make") ? body.get("make").getAsString() : null;
                String model = body.has("model") ? body.get("model").getAsString() : null;
                String regNo = body.has("regNo") ? body.get("regNo").getAsString() : null;
                Integer seats = body.has("seats") && !body.get("seats").isJsonNull() ? body.get("seats").getAsInt() : null;

                Double pricePerDay = body.has("pricePerDay") && !body.get("pricePerDay").isJsonNull()
                        ? body.get("pricePerDay").getAsDouble()
                        : null;

                String sql =
                        "UPDATE Vehicle SET " +
                                "vehiclebrand = COALESCE(?, vehiclebrand), " +
                                "vehiclemodel = COALESCE(?, vehiclemodel), " +
                                "numberplatenumber = COALESCE(?, numberplatenumber), " +
                                "numberofpassengers = COALESCE(?, numberofpassengers), " +
                                "price_per_day = COALESCE(?, price_per_day) " +
                                "WHERE vehicleid = ? AND provider_id = ?";

                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    if (make == null || make.trim().isEmpty()) ps.setNull(1, Types.VARCHAR); else ps.setString(1, make);
                    if (model == null || model.trim().isEmpty()) ps.setNull(2, Types.VARCHAR); else ps.setString(2, model);
                    if (regNo == null || regNo.trim().isEmpty()) ps.setNull(3, Types.VARCHAR); else ps.setString(3, regNo);
                    if (seats == null) ps.setNull(4, Types.INTEGER); else ps.setInt(4, seats);
                    if (pricePerDay == null) ps.setNull(5, Types.DECIMAL); else ps.setDouble(5, pricePerDay);

                    ps.setInt(6, vehicleId);
                    ps.setInt(7, providerId);

                    int updated = ps.executeUpdate();
                    if (updated == 0) { sendJson(resp, 404, error("Vehicle not found for provider")); return; }
                    sendJson(resp, 200, Map.of("ok", true));
                    return;
                }
            }

            sendJson(resp, 404, error("Not found"));
        } catch (SQLException e) {
            sendJson(resp, 500, error(e.getMessage()));
        }
    }

    // ============================= DELETE =============================
    // DELETE /api/admin/vehicle-providers/{id}/vehicles/{vehicleId}
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String path = req.getPathInfo();
        String[] parts = (path == null ? "" : path).split("/");

        try (Connection con = DBConnection.getConnection()) {

            if (parts.length >= 4 && !parts[1].isEmpty() && "vehicles".equals(parts[2]) && !parts[3].isEmpty()) {
                Integer providerId = tryParseInt(parts[1]);
                Integer vehicleId = tryParseInt(parts[3]);
                if (providerId == null || vehicleId == null) { sendJson(resp, 400, error("Invalid ids")); return; }

                if (isProviderSuspended(con, providerId)) {
                    sendJson(resp, 403, error("Provider is suspended. Cannot delete vehicles."));
                    return;
                }

                String sql = "DELETE FROM Vehicle WHERE vehicleid = ? AND provider_id = ?";
                try (PreparedStatement ps = con.prepareStatement(sql)) {
                    ps.setInt(1, vehicleId);
                    ps.setInt(2, providerId);
                    int deleted = ps.executeUpdate();
                    if (deleted == 0) { sendJson(resp, 404, error("Vehicle not found for provider")); return; }
                    sendJson(resp, 200, Map.of("ok", true));
                    return;
                }
            }

            sendJson(resp, 404, error("Not found"));
        } catch (SQLException e) {
            sendJson(resp, 500, error(e.getMessage()));
        }
    }

    // ============================= helpers =============================
    private Map<String, Object> getProvider(Connection con, int providerId) throws SQLException {
        String sql =
                "SELECT providerid, username, email, firstname, lastname, phonenumber, city, " +
                        "COALESCE(status,'pending') AS status, created_at " +
                        "FROM VehicleProvider WHERE providerid = ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                Map<String, Object> p = new LinkedHashMap<>();
                String fn = rs.getString("firstname");
                String ln = rs.getString("lastname");

                p.put("id", rs.getInt("providerid"));
                p.put("name", ((fn == null ? "" : fn) + " " + (ln == null ? "" : ln)).trim());
                p.put("email", rs.getString("email"));
                p.put("phone", rs.getString("phonenumber"));
                p.put("location", rs.getString("city"));
                p.put("status", rs.getString("status"));

                Timestamp created = null;
                try { created = rs.getTimestamp("created_at"); } catch (SQLException ignore) {}
                p.put("joinDate", created == null ? null : created.toLocalDateTime().toLocalDate().toString());

                return p;
            }
        }
    }

    private boolean isProviderSuspended(Connection con, int providerId) throws SQLException {
        String sql = "SELECT COALESCE(status,'pending') AS status FROM VehicleProvider WHERE providerid = ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return false; // or treat missing as not suspended
                return "suspended".equalsIgnoreCase(rs.getString("status"));
            }
        }
    }


    private Map<String, Object> vehiclesByProvider(Connection con, int providerId) throws SQLException {
        String sql =
                "SELECT v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.numberofpassengers, " +
                        "v.price_per_day, rc.companyname AS rental_company_name " +
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
                    v.put("seats", rs.getInt("numberofpassengers"));

                    // MAIN POINT: price_per_day -> pricePerDay (JSON)
                    v.put("pricePerDay", rs.getObject("price_per_day") == null ? null : rs.getDouble("price_per_day"));

                    String companyName = rs.getString("rental_company_name");
                    v.put("rentalCompany", companyName == null ? "Not assigned" : companyName);
                    list.add(v);
                }
            }
        }

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("ok", true);
        res.put("data", list);
        return res;
    }
}
