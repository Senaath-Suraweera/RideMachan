package individualprovider.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigDecimal;
import java.sql.*;
import java.util.*;

@WebServlet("/api/vehicles/*")
@MultipartConfig
public class VehicleServlet extends HttpServlet {

    private final Gson gson = new Gson();

    // -------------------- CORS --------------------
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

    // -------------------- ROUTING --------------------
    // Paths:
    // GET    /api/vehicles                      -> list (filters via query params)
    // GET    /api/vehicles/{id}                 -> get by id
    // GET    /api/vehicles/{id}/image           -> image blob
    // GET    /api/vehicles/{id}/doc             -> registration doc blob
    // POST   /api/vehicles                      -> create (multipart/form-data)
    // POST   /api/vehicles/{id}                 -> update (multipart/form-data)  (for easy Postman + browser forms)
    // PUT    /api/vehicles/{id}                 -> update (multipart/form-data)  (optional)
    // DELETE /api/vehicles/{id}                 -> delete
    // POST   /api/vehicles/{id}/status          -> update only availability_status (x-www-form-urlencoded or multipart)

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = normalize(req.getPathInfo()); // "" or "/123" or "/123/image"
        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(500);
                resp.getWriter().write("{\"error\":\"DB connection failed\"}");
                return;
            }

            if (path.isEmpty()) {
                resp.getWriter().write(listVehicles(con, req));
                return;
            }

            if ("/me".equalsIgnoreCase(path)) {
                JsonObject me = getCurrentProviderFromSession(req);
                if (me == null) {
                    resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    resp.getWriter().write("{\"error\":\"Unauthorized\"}");
                    return;
                }
                resp.getWriter().write(gson.toJson(me));
                return;
            }


            String[] parts = path.substring(1).split("/");
            int id = parseInt(parts[0], -1);
            if (id <= 0) {
                resp.setStatus(400);
                resp.getWriter().write("{\"error\":\"Invalid vehicle id\"}");
                return;
            }

            if (parts.length == 1) {
                resp.getWriter().write(getVehicle(con, id));
                return;
            }

            if ("image".equalsIgnoreCase(parts[1])) {
                streamBlob(con, id, "vehicleimages", "image/jpeg", resp);
                return;
            }

            if ("doc".equalsIgnoreCase(parts[1])) {
                streamBlob(con, id, "registrationdocumentation", "application/pdf", resp);
                return;
            }

            resp.setStatus(404);
            resp.getWriter().write("{\"error\":\"Unknown endpoint\"}");

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"SQL Error: " + escapeJson(e.getMessage()) + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        req.setCharacterEncoding("UTF-8");

        String path = normalize(req.getPathInfo()); // "" or "/123" or "/123/status"

        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(500);
                resp.getWriter().write("{\"error\":\"DB connection failed\"}");
                return;
            }

            if (path.isEmpty()) {
                // create
                resp.getWriter().write(createVehicle(con, req, resp));
                return;
            }

            String[] parts = path.substring(1).split("/");
            int id = parseInt(parts[0], -1);
            if (id <= 0) {
                resp.setStatus(400);
                resp.getWriter().write("{\"error\":\"Invalid vehicle id\"}");
                return;
            }

            if (parts.length == 2 && "status".equalsIgnoreCase(parts[1])) {
                resp.getWriter().write(updateStatusOnly(con, req, id));
                return;
            }

            // update (POST /api/vehicles/{id})
            resp.getWriter().write(updateVehicle(con, req, id));

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"SQL Error: " + escapeJson(e.getMessage()) + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        // Optional support for PUT update (some setups struggle with multipart PUT; POST /{id} is the safe one)
        doPost(req, resp);
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = normalize(req.getPathInfo()); // "/123"
        String[] parts = path.isEmpty() ? new String[0] : path.substring(1).split("/");
        int id = (parts.length >= 1) ? parseInt(parts[0], -1) : -1;

        if (id <= 0) {
            resp.setStatus(400);
            resp.getWriter().write("{\"error\":\"Invalid vehicle id\"}");
            return;
        }

        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(500);
                resp.getWriter().write("{\"error\":\"DB connection failed\"}");
                return;
            }
            boolean ok = deleteVehicle(con, id);
            resp.getWriter().write("{\"status\":\"" + (ok ? "success" : "error") + "\"}");
        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"SQL Error: " + escapeJson(e.getMessage()) + "\"}");
        }
    }

    // -------------------- LIST --------------------
    private String listVehicles(Connection con, HttpServletRequest req) throws SQLException {
        Integer companyId = parseNullableInt(req.getParameter("company_id"));
        Integer providerId = parseNullableInt(req.getParameter("provider_id"));

        String q = trimToNull(req.getParameter("q")); // search by brand/model/plate
        String availability = trimToNull(req.getParameter("availability_status"));
        String vehicleType = trimToNull(req.getParameter("vehicle_type"));
        String fuelType = trimToNull(req.getParameter("fuel_type"));
        String location = trimToNull(req.getParameter("location"));

        int limit = clamp(parseInt(req.getParameter("limit"), 50), 1, 200);
        int offset = Math.max(0, parseInt(req.getParameter("offset"), 0));

        StringBuilder sql = new StringBuilder(
                "SELECT vehicleid, vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color, numberofpassengers, " +
                        "enginecapacity, enginenumber, chasisnumber, description, milage, company_id, provider_id, price_per_day, " +
                        "location, features, vehicle_type, fuel_type, availability_status, manufacture_year, transmission, created_at, updated_at " +
                        "FROM Vehicle WHERE 1=1 "
        );

        List<Object> params = new ArrayList<>();

        if (companyId != null) { sql.append(" AND company_id = ? "); params.add(companyId); }
        if (providerId != null) { sql.append(" AND provider_id = ? "); params.add(providerId); }

        if (availability != null) { sql.append(" AND availability_status = ? "); params.add(availability); }
        if (vehicleType != null) { sql.append(" AND vehicle_type = ? "); params.add(vehicleType); }
        if (fuelType != null) { sql.append(" AND fuel_type = ? "); params.add(fuelType); }
        if (location != null) { sql.append(" AND location LIKE ? "); params.add("%" + location + "%"); }

        if (q != null) {
            sql.append(" AND (vehiclebrand LIKE ? OR vehiclemodel LIKE ? OR numberplatenumber LIKE ?) ");
            params.add("%" + q + "%");
            params.add("%" + q + "%");
            params.add("%" + q + "%");
        }

        sql.append(" ORDER BY vehicleid DESC LIMIT ? OFFSET ? ");
        params.add(limit);
        params.add(offset);

        List<Map<String, Object>> rows = new ArrayList<>();
        try (PreparedStatement ps = con.prepareStatement(sql.toString())) {
            bindParams(ps, params);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    rows.add(vehicleRow(rs));
                }
            }
        }

        JsonObject obj = new JsonObject();
        obj.addProperty("count", rows.size());
        obj.add("vehicles", gson.toJsonTree(rows));
        return gson.toJson(obj);
    }

    // -------------------- GET BY ID --------------------
    private String getVehicle(Connection con, int id) throws SQLException {
        String sql =
                "SELECT vehicleid, vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color, numberofpassengers, " +
                        "enginecapacity, enginenumber, chasisnumber, description, milage, company_id, provider_id, price_per_day, " +
                        "location, features, vehicle_type, fuel_type, availability_status, manufacture_year, transmission, created_at, updated_at " +
                        "FROM Vehicle WHERE vehicleid = ?";

        Map<String, Object> row = null;
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) row = vehicleRow(rs);
            }
        }

        if (row == null) return "{\"error\":\"Vehicle not found\"}";
        return gson.toJson(row);
    }

    // -------------------- CREATE --------------------
    private String createVehicle(Connection con, HttpServletRequest req, HttpServletResponse resp) throws Exception {

        // Required in your schema: registrationdocumentation (NOT NULL), vehicleimages (NOT NULL), price_per_day (NOT NULL)
        Part docPart = safePart(req, "registrationdocumentation");
        Part imgPart = safePart(req, "vehicleimages");

        if (docPart == null || docPart.getSize() <= 0) {
            resp.setStatus(400);
            return "{\"error\":\"registrationdocumentation is required\"}";
        }
        if (imgPart == null || imgPart.getSize() <= 0) {
            resp.setStatus(400);
            return "{\"error\":\"vehicleimages is required\"}";
        }

        BigDecimal pricePerDay = parseBigDecimal(req.getParameter("price_per_day"));
        if (pricePerDay == null) {
            resp.setStatus(400);
            return "{\"error\":\"price_per_day is required\"}";
        }

        String sql =
                "INSERT INTO Vehicle (" +
                        "vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color, numberofpassengers, " +
                        "enginecapacity, enginenumber, chasisnumber, registrationdocumentation, vehicleimages, description, milage, " +
                        "company_id, provider_id, price_per_day, location, features, vehicle_type, fuel_type, availability_status, " +
                        "manufacture_year, transmission" +
                        ") VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

        try (PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, req.getParameter("vehiclebrand"));
            ps.setString(2, req.getParameter("vehiclemodel"));
            ps.setString(3, req.getParameter("numberplatenumber"));
            ps.setInt(4, parseInt(req.getParameter("tareweight"), 0));
            ps.setString(5, req.getParameter("color"));
            ps.setInt(6, parseInt(req.getParameter("numberofpassengers"), 0));
            ps.setInt(7, parseInt(req.getParameter("enginecapacity"), 0));
            ps.setString(8, req.getParameter("enginenumber"));
            ps.setString(9, req.getParameter("chasisnumber"));

            ps.setBytes(10, readAllBytes(docPart));
            ps.setBytes(11, readAllBytes(imgPart));


            ps.setString(12, req.getParameter("description"));
            ps.setString(13, req.getParameter("milage"));

            setNullableInt(ps, 14, parseNullableInt(req.getParameter("company_id")));
            setNullableInt(ps, 15, parseNullableInt(req.getParameter("provider_id")));

            ps.setBigDecimal(16, pricePerDay);

            ps.setString(17, req.getParameter("location"));
            ps.setString(18, req.getParameter("features"));
            ps.setString(19, req.getParameter("vehicle_type"));
            ps.setString(20, req.getParameter("fuel_type"));

            // default is "available" in DB; allow override
            String availability = trimToNull(req.getParameter("availability_status"));
            ps.setString(21, availability != null ? availability : "available");

            setNullableInt(ps, 22, parseNullableInt(req.getParameter("manufacture_year")));
            ps.setString(23, req.getParameter("transmission"));

            int affected = ps.executeUpdate();
            if (affected <= 0) return "{\"status\":\"error\"}";

            int newId = 0;
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) newId = keys.getInt(1);
            }
            return "{\"status\":\"success\",\"vehicleid\":" + newId + "}";
        }
    }

    // -------------------- UPDATE --------------------
    // Keeps blob fields if you don't upload new ones.
    private String updateVehicle(Connection con, HttpServletRequest req, int id) throws Exception {

        // Check exists + get existing blobs
        String checkSql = "SELECT registrationdocumentation, vehicleimages FROM Vehicle WHERE vehicleid = ?";
        Blob existingDoc;
        Blob existingImg;

        try (PreparedStatement ps = con.prepareStatement(checkSql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return "{\"error\":\"Vehicle not found\"}";
                existingDoc = rs.getBlob("registrationdocumentation");
                existingImg = rs.getBlob("vehicleimages");
            }
        }

        Part docPart = safePart(req, "registrationdocumentation");
        Part imgPart = safePart(req, "vehicleimages");

        BigDecimal pricePerDay = parseBigDecimal(req.getParameter("price_per_day"));
        // price_per_day is NOT NULL. If not sent, keep current.
        if (pricePerDay == null) {
            pricePerDay = getCurrentPrice(con, id);
        }

        String sql =
                "UPDATE Vehicle SET " +
                        "vehiclebrand=?, vehiclemodel=?, numberplatenumber=?, tareweight=?, color=?, numberofpassengers=?, " +
                        "enginecapacity=?, enginenumber=?, chasisnumber=?, description=?, milage=?, " +
                        "company_id=?, provider_id=?, price_per_day=?, location=?, features=?, vehicle_type=?, fuel_type=?, " +
                        "availability_status=?, manufacture_year=?, transmission=?, " +
                        "registrationdocumentation=?, vehicleimages=? " +
                        "WHERE vehicleid=?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, req.getParameter("vehiclebrand"));
            ps.setString(2, req.getParameter("vehiclemodel"));
            ps.setString(3, req.getParameter("numberplatenumber"));
            ps.setInt(4, parseInt(req.getParameter("tareweight"), 0));
            ps.setString(5, req.getParameter("color"));
            ps.setInt(6, parseInt(req.getParameter("numberofpassengers"), 0));
            ps.setInt(7, parseInt(req.getParameter("enginecapacity"), 0));
            ps.setString(8, req.getParameter("enginenumber"));
            ps.setString(9, req.getParameter("chasisnumber"));

            ps.setString(10, req.getParameter("description"));
            ps.setString(11, req.getParameter("milage"));

            setNullableInt(ps, 12, parseNullableInt(req.getParameter("company_id")));
            setNullableInt(ps, 13, parseNullableInt(req.getParameter("provider_id")));

            ps.setBigDecimal(14, pricePerDay);

            ps.setString(15, req.getParameter("location"));
            ps.setString(16, req.getParameter("features"));
            ps.setString(17, req.getParameter("vehicle_type"));
            ps.setString(18, req.getParameter("fuel_type"));

            String availability = trimToNull(req.getParameter("availability_status"));
            ps.setString(19, availability != null ? availability : "available");

            setNullableInt(ps, 20, parseNullableInt(req.getParameter("manufacture_year")));
            ps.setString(21, req.getParameter("transmission"));

            // registrationdocumentation (NOT NULL) -> keep old if not provided
            if (docPart != null && docPart.getSize() > 0) {
                ps.setBytes(22, readAllBytes(docPart));
            } else {
                ps.setBytes(22, blobToBytes(existingDoc));
            }

            // vehicleimages (NOT NULL) -> keep old if not provided
            if (imgPart != null && imgPart.getSize() > 0) {
                ps.setBytes(23, readAllBytes(imgPart));
            } else {
                ps.setBytes(23, blobToBytes(existingImg));
            }


            ps.setInt(24, id);

            boolean ok = ps.executeUpdate() > 0;
            return "{\"status\":\"" + (ok ? "success" : "error") + "\"}";
        }
    }

    private BigDecimal getCurrentPrice(Connection con, int id) throws SQLException {
        try (PreparedStatement ps = con.prepareStatement("SELECT price_per_day FROM Vehicle WHERE vehicleid=?")) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getBigDecimal("price_per_day");
            }
        }
        return new BigDecimal("0.00");
    }

    // -------------------- STATUS ONLY --------------------
    private String updateStatusOnly(Connection con, HttpServletRequest req, int id) throws SQLException {
        String status = trimToNull(req.getParameter("availability_status"));
        if (status == null) return "{\"error\":\"availability_status is required\"}";

        try (PreparedStatement ps = con.prepareStatement(
                "UPDATE Vehicle SET availability_status=? WHERE vehicleid=?")) {
            ps.setString(1, status);
            ps.setInt(2, id);
            boolean ok = ps.executeUpdate() > 0;
            return "{\"status\":\"" + (ok ? "success" : "error") + "\"}";
        }
    }

    // -------------------- DELETE --------------------
    private boolean deleteVehicle(Connection con, int id) throws SQLException {
        try (PreparedStatement ps = con.prepareStatement("DELETE FROM Vehicle WHERE vehicleid=?")) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    // -------------------- STREAM BLOB --------------------
    private void streamBlob(Connection con, int vehicleId, String column, String contentType, HttpServletResponse resp)
            throws SQLException, IOException {

        String sql = "SELECT " + column + " FROM Vehicle WHERE vehicleid = ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, vehicleId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    resp.sendError(HttpServletResponse.SC_NOT_FOUND, "Vehicle not found");
                    return;
                }
                Blob b = rs.getBlob(column);
                if (b == null) {
                    resp.sendError(HttpServletResponse.SC_NOT_FOUND, "Blob not found");
                    return;
                }

                resp.setContentType(contentType);
                resp.setContentLengthLong(b.length());
                try (InputStream in = b.getBinaryStream();
                     OutputStream out = resp.getOutputStream()) {
                    byte[] buf = new byte[8192];
                    int r;
                    while ((r = in.read(buf)) != -1) out.write(buf, 0, r);
                }
            }
        }
    }

    // -------------------- UTIL --------------------
    private static String normalize(String pathInfo) {
        if (pathInfo == null) return "";
        String p = pathInfo.trim();
        if (p.equals("/")) return "";
        return p;
    }

    private JsonObject getCurrentProviderFromSession(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return null;

        Object actor = session.getAttribute("actorType");
        Object providerId = session.getAttribute("providerId");
        Object actorId = session.getAttribute("actorId");

        if (actor == null) return null;
        if (!"PROVIDER".equalsIgnoreCase(actor.toString())) return null;

        // providerId is what you set in login servlet
        Object pid = (providerId != null) ? providerId : actorId;
        if (pid == null) return null;

        JsonObject me = new JsonObject();
        me.addProperty("actorType", "PROVIDER");
        me.addProperty("providerId", Integer.parseInt(pid.toString()));

        // If you stored provider object in session, we can send more (optional)
        Object providerObj = session.getAttribute("provider");
        if (providerObj != null) {
            // avoid heavy serialization; just indicate present
            me.addProperty("hasProviderObject", true);
        } else {
            me.addProperty("hasProviderObject", false);
        }
        return me;
    }


    private static int parseInt(String s, int def) {
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }

    private static Integer parseNullableInt(String s) {
        if (s == null) return null;
        String t = s.trim();
        if (t.isEmpty()) return null;
        try { return Integer.parseInt(t); } catch (Exception e) { return null; }
    }

    private static int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }

    private static String trimToNull(String s) {
        if (s == null) return null;
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private static BigDecimal parseBigDecimal(String s) {
        try {
            if (s == null || s.trim().isEmpty()) return null;
            return new BigDecimal(s.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private static void setNullableInt(PreparedStatement ps, int idx, Integer val) throws SQLException {
        if (val == null) ps.setNull(idx, Types.INTEGER);
        else ps.setInt(idx, val);
    }

    private static Part safePart(HttpServletRequest req, String name) {
        try { return req.getPart(name); } catch (Exception e) { return null; }
    }

    private static void bindParams(PreparedStatement ps, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            Object v = params.get(i);
            int idx = i + 1;
            if (v == null) ps.setNull(idx, Types.VARCHAR);
            else if (v instanceof Integer) ps.setInt(idx, (Integer) v);
            else if (v instanceof BigDecimal) ps.setBigDecimal(idx, (BigDecimal) v);
            else ps.setString(idx, v.toString());
        }
    }

    private static Map<String, Object> vehicleRow(ResultSet rs) throws SQLException {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("vehicleid", rs.getInt("vehicleid"));
        m.put("vehiclebrand", rs.getString("vehiclebrand"));
        m.put("vehiclemodel", rs.getString("vehiclemodel"));
        m.put("numberplatenumber", rs.getString("numberplatenumber"));
        m.put("tareweight", rs.getInt("tareweight"));
        m.put("color", rs.getString("color"));
        m.put("numberofpassengers", rs.getInt("numberofpassengers"));
        m.put("enginecapacity", rs.getInt("enginecapacity"));
        m.put("enginenumber", rs.getString("enginenumber"));
        m.put("chasisnumber", rs.getString("chasisnumber"));
        m.put("description", rs.getString("description"));
        m.put("milage", rs.getString("milage"));
        m.put("company_id", rs.getObject("company_id"));
        m.put("provider_id", rs.getObject("provider_id"));
        m.put("price_per_day", rs.getBigDecimal("price_per_day"));
        m.put("location", rs.getString("location"));
        m.put("features", rs.getString("features"));
        m.put("vehicle_type", rs.getString("vehicle_type"));
        m.put("fuel_type", rs.getString("fuel_type"));
        m.put("availability_status", rs.getString("availability_status"));
        m.put("manufacture_year", rs.getObject("manufacture_year"));
        m.put("transmission", rs.getString("transmission"));
        m.put("created_at", String.valueOf(rs.getTimestamp("created_at")));
        m.put("updated_at", String.valueOf(rs.getTimestamp("updated_at")));
        return m;
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
    }

    private static byte[] readAllBytes(Part part) throws IOException {
        try (InputStream in = part.getInputStream()) {
            return in.readAllBytes();
        }
    }

    private static byte[] blobToBytes(Blob b) throws SQLException {
        if (b == null) return null;
        long len = b.length();
        if (len <= 0) return null;
        if (len > Integer.MAX_VALUE) throw new SQLException("Blob too large to load into memory");
        return b.getBytes(1, (int) len);
    }

}
