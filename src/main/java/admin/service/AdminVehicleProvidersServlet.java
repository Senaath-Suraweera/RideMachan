package admin.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import common.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.sql.*;
import java.util.*;

@WebServlet("/api/admin/vehicle-providers/*")
@MultipartConfig(
        maxFileSize   = 10_485_760,   // 10 MB per file
        maxRequestSize = 52_428_800,  // 50 MB total
        fileSizeThreshold = 1_048_576 // 1 MB before writing to disk
)
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

    // ─── JSON body parsing (for non-multipart requests) ─────
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
        } catch (Exception e) { return null; }
    }

    private Double getDoubleOrNull(JsonObject body, String key) {
        try {
            return body.has(key) && !body.get(key).isJsonNull() ? body.get(key).getAsDouble() : null;
        } catch (Exception e) { return null; }
    }

    private String getStringOrNull(JsonObject body, String key) {
        try {
            return body.has(key) && !body.get(key).isJsonNull() ? trimToNull(body.get(key).getAsString()) : null;
        } catch (Exception e) { return null; }
    }

    // ─── Multipart form helpers ─────────────────────────────
    private String getPartString(HttpServletRequest req, String name) {
        try {
            Part part = req.getPart(name);
            if (part == null || part.getSize() == 0) return null;
            // Only read text parts (no file name)
            try (InputStream is = part.getInputStream()) {
                return new String(is.readAllBytes(), "UTF-8").trim();
            }
        } catch (Exception e) {
            return null;
        }
    }

    private Integer getPartInt(HttpServletRequest req, String name) {
        String val = getPartString(req, name);
        if (val == null || val.isEmpty()) return null;
        try { return Integer.parseInt(val); }
        catch (Exception e) { return null; }
    }

    private Double getPartDouble(HttpServletRequest req, String name) {
        String val = getPartString(req, name);
        if (val == null || val.isEmpty()) return null;
        try { return Double.parseDouble(val); }
        catch (Exception e) { return null; }
    }

    private byte[] getPartBytes(HttpServletRequest req, String name) throws IOException, ServletException {
        Part part = req.getPart(name);
        if (part == null || part.getSize() == 0) return null;
        try (InputStream is = part.getInputStream()) {
            return is.readAllBytes();
        }
    }

    /** Reads ALL parts with the given name (for multiple file uploads) and concatenates or picks first */
    private byte[] getAllPartBytes(HttpServletRequest req, String name) throws IOException, ServletException {
        Collection<Part> parts = req.getParts();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        boolean found = false;
        for (Part part : parts) {
            if (name.equals(part.getName()) && part.getSize() > 0) {
                // For simplicity, store only the first image.
                // To store multiple images you'd need a separate table or a different strategy.
                if (!found) {
                    try (InputStream is = part.getInputStream()) {
                        is.transferTo(baos);
                    }
                    found = true;
                }
            }
        }
        return found ? baos.toByteArray() : null;
    }

    private boolean isMultipart(HttpServletRequest req) {
        String ct = req.getContentType();
        return ct != null && ct.toLowerCase().startsWith("multipart/");
    }

    // ─── GET ────────────────────────────────────────────────
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String path = req.getPathInfo();
        String[] parts = (path == null ? "" : path).split("/");

        try (Connection con = DBConnection.getConnection()) {

            // GET /api/admin/vehicle-providers  (list all)
            if (path == null || "/".equals(path) || parts.length <= 1 || parts[1].isEmpty()) {
                handleListProviders(req, resp, con);
                return;
            }

            // GET /api/admin/vehicle-providers/{id}/vehicles/{vid}/image
            if (parts.length >= 5 && "vehicles".equals(parts[2]) && "image".equals(parts[4])) {
                Integer vehicleId = tryParseInt(parts[3]);
                if (vehicleId == null) { sendJson(resp, 400, error("Invalid vehicle id")); return; }
                serveVehicleBlob(con, resp, vehicleId, "vehicleimages");
                return;
            }

            // GET /api/admin/vehicle-providers/{id}/vehicles/{vid}/regdoc
            if (parts.length >= 5 && "vehicles".equals(parts[2]) && "regdoc".equals(parts[4])) {
                Integer vehicleId = tryParseInt(parts[3]);
                if (vehicleId == null) { sendJson(resp, 400, error("Invalid vehicle id")); return; }
                serveVehicleBlob(con, resp, vehicleId, "registrationdocumentation");
                return;
            }

            // GET /api/admin/vehicle-providers/{id}/vehicles
            if (parts.length >= 3 && !parts[1].isEmpty() && "vehicles".equals(parts[2])) {
                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) { sendJson(resp, 400, error("Invalid provider id")); return; }
                sendJson(resp, 200, vehiclesByProvider(con, providerId));
                return;
            }

            // GET /api/admin/vehicle-providers/{id}
            if (parts.length >= 2 && !parts[1].isEmpty()) {
                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) { sendJson(resp, 400, error("Invalid provider id")); return; }

                Map<String, Object> provider = getProvider(con, providerId);
                if (provider == null) { sendJson(resp, 404, error("Provider not found")); return; }

                sendJson(resp, 200, Map.of("ok", true, "data", provider));
                return;
            }

            sendJson(resp, 404, error("Not found"));
        } catch (SQLException e) {
            sendJson(resp, 500, error(e.getMessage()));
        }
    }

    /** Serve a LONGBLOB column as an image response */
    private void serveVehicleBlob(Connection con, HttpServletResponse resp, int vehicleId, String column)
            throws SQLException, IOException {
        String sql = "SELECT " + column + " FROM Vehicle WHERE vehicleid = ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, vehicleId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    resp.sendError(HttpServletResponse.SC_NOT_FOUND, "Vehicle not found");
                    return;
                }
                byte[] data = rs.getBytes(column);
                if (data == null || data.length == 0) {
                    resp.sendError(HttpServletResponse.SC_NOT_FOUND, "No image data");
                    return;
                }

                // Detect content type from magic bytes
                String contentType = detectImageType(data);
                resp.setContentType(contentType);
                resp.setContentLength(data.length);
                resp.setHeader("Cache-Control", "public, max-age=3600");
                resp.getOutputStream().write(data);
                resp.getOutputStream().flush();
            }
        }
    }

    /** Simple magic-byte detection for common image formats and PDF */
    private String detectImageType(byte[] data) {
        if (data.length >= 4) {
            // PNG
            if (data[0] == (byte) 0x89 && data[1] == (byte) 0x50 &&
                    data[2] == (byte) 0x4E && data[3] == (byte) 0x47) {
                return "image/png";
            }
            // JPEG
            if (data[0] == (byte) 0xFF && data[1] == (byte) 0xD8) {
                return "image/jpeg";
            }
            // GIF
            if (data[0] == (byte) 0x47 && data[1] == (byte) 0x49 && data[2] == (byte) 0x46) {
                return "image/gif";
            }
            // PDF
            if (data[0] == (byte) 0x25 && data[1] == (byte) 0x50 &&
                    data[2] == (byte) 0x44 && data[3] == (byte) 0x46) {
                return "application/pdf";
            }
            // WebP
            if (data.length >= 12 && data[8] == (byte) 0x57 && data[9] == (byte) 0x45 &&
                    data[10] == (byte) 0x42 && data[11] == (byte) 0x50) {
                return "image/webp";
            }
        }
        return "application/octet-stream";
    }

    private void handleListProviders(HttpServletRequest req, HttpServletResponse resp, Connection con)
            throws SQLException, IOException {
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
            params.add(like); params.add(like); params.add(like); params.add(like);
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
            }
        }
    }

    // ─── POST ───────────────────────────────────────────────
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String path = req.getPathInfo();
        String[] parts = (path == null ? "" : path).split("/");

        try (Connection con = DBConnection.getConnection()) {

            // POST /api/admin/vehicle-providers/{id}/vehicles  (add vehicle)
            if (parts.length >= 3 && !parts[1].isEmpty() && "vehicles".equals(parts[2])) {
                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) { sendJson(resp, 400, error("Invalid provider id")); return; }

                if (isProviderSuspended(con, providerId)) {
                    sendJson(resp, 403, error("Provider is suspended. Cannot add vehicles."));
                    return;
                }

                // Handle both multipart and JSON
                String make, model, regNo, color, engineNumber, chasisNumber, milage, location, fuelType,
                        transmission, availabilityStatus, description;
                Integer manufactureYear, seats, engineCapacity, companyId;
                Double pricePerDay;
                byte[] regDocBytes = null;
                byte[] vehicleImgBytes = null;

                if (isMultipart(req)) {
                    make = trimToNull(getPartString(req, "make"));
                    model = trimToNull(getPartString(req, "model"));
                    regNo = trimToNull(getPartString(req, "regNo"));
                    manufactureYear = getPartInt(req, "manufactureYear");
                    color = trimToNull(getPartString(req, "color"));
                    seats = getPartInt(req, "seats");
                    engineCapacity = getPartInt(req, "engineCapacity");
                    engineNumber = trimToNull(getPartString(req, "engineNumber"));
                    chasisNumber = trimToNull(getPartString(req, "chasisNumber"));
                    milage = trimToNull(getPartString(req, "milage"));
                    pricePerDay = getPartDouble(req, "pricePerDay");
                    location = trimToNull(getPartString(req, "location"));
                    fuelType = trimToNull(getPartString(req, "fuelType"));
                    transmission = trimToNull(getPartString(req, "transmission"));
                    availabilityStatus = trimToNull(getPartString(req, "availabilityStatus"));
                    companyId = getPartInt(req, "companyId");
                    description = trimToNull(getPartString(req, "description"));

                    regDocBytes = getPartBytes(req, "registrationDoc");
                    vehicleImgBytes = getAllPartBytes(req, "vehicleImages");
                } else {
                    JsonObject body = readJson(req);
                    make = getStringOrNull(body, "make");
                    model = getStringOrNull(body, "model");
                    regNo = getStringOrNull(body, "regNo");
                    manufactureYear = getIntOrNull(body, "manufactureYear");
                    color = getStringOrNull(body, "color");
                    seats = getIntOrNull(body, "seats");
                    engineCapacity = getIntOrNull(body, "engineCapacity");
                    engineNumber = getStringOrNull(body, "engineNumber");
                    chasisNumber = getStringOrNull(body, "chasisNumber");
                    milage = getStringOrNull(body, "milage");
                    pricePerDay = getDoubleOrNull(body, "pricePerDay");
                    location = getStringOrNull(body, "location");
                    fuelType = getStringOrNull(body, "fuelType");
                    transmission = getStringOrNull(body, "transmission");
                    availabilityStatus = getStringOrNull(body, "availabilityStatus");
                    companyId = getIntOrNull(body, "companyId");
                    description = getStringOrNull(body, "description");
                }

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

                    // Registration documentation
                    if (regDocBytes != null && regDocBytes.length > 0) {
                        ps.setBytes(10, regDocBytes);
                    } else {
                        ps.setBytes(10, new byte[0]);
                    }

                    // Vehicle images
                    if (vehicleImgBytes != null && vehicleImgBytes.length > 0) {
                        ps.setBytes(11, vehicleImgBytes);
                    } else {
                        ps.setBytes(11, new byte[0]);
                    }

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
                    if (n == 0) { sendJson(resp, 500, error("Insert failed")); return; }

                    int newId;
                    try (ResultSet keys = ps.getGeneratedKeys()) {
                        if (!keys.next()) { sendJson(resp, 500, error("No generated id")); return; }
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

    // ─── PUT ────────────────────────────────────────────────
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String path = req.getPathInfo();
        String[] parts = (path == null ? "" : path).split("/");

        try (Connection con = DBConnection.getConnection()) {

            // PUT /api/admin/vehicle-providers/{id}/ban  or  /unban
            if (parts.length >= 3 && !parts[1].isEmpty() &&
                    ("ban".equals(parts[2]) || "unban".equals(parts[2]))) {

                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) { sendJson(resp, 400, error("Invalid provider id")); return; }

                String newStatus = "ban".equals(parts[2]) ? "suspended" : "active";

                try (PreparedStatement ps =
                             con.prepareStatement("UPDATE VehicleProvider SET status = ? WHERE providerid = ?")) {
                    ps.setString(1, newStatus);
                    ps.setInt(2, providerId);
                    int updated = ps.executeUpdate();
                    if (updated == 0) { sendJson(resp, 404, error("Provider not found")); return; }
                    sendJson(resp, 200, Map.of("ok", true, "providerId", providerId, "status", newStatus));
                    return;
                }
            }

            // PUT /api/admin/vehicle-providers/{id}  (update provider profile — always JSON)
            if (parts.length >= 2 && !parts[1].isEmpty() && (parts.length == 2 || parts[2].isEmpty())) {
                Integer providerId = tryParseInt(parts[1]);
                if (providerId == null) { sendJson(resp, 400, error("Invalid provider id")); return; }

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
                    if (updated == 0) { sendJson(resp, 404, error("Provider not found")); return; }
                    sendJson(resp, 200, Map.of("ok", true));
                    return;
                }
            }

            // PUT /api/admin/vehicle-providers/{id}/vehicles/{vid}  (update vehicle)
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

                // Handle both multipart and JSON
                String make, model, regNo, color, engineNumber, chasisNumber, milage, location, fuelType,
                        transmission, availabilityStatus, description;
                Integer manufactureYear, seats, engineCapacity, companyId;
                Double pricePerDay;
                byte[] regDocBytes = null;
                byte[] vehicleImgBytes = null;

                if (isMultipart(req)) {
                    make = trimToNull(getPartString(req, "make"));
                    model = trimToNull(getPartString(req, "model"));
                    regNo = trimToNull(getPartString(req, "regNo"));
                    manufactureYear = getPartInt(req, "manufactureYear");
                    color = trimToNull(getPartString(req, "color"));
                    seats = getPartInt(req, "seats");
                    engineCapacity = getPartInt(req, "engineCapacity");
                    engineNumber = trimToNull(getPartString(req, "engineNumber"));
                    chasisNumber = trimToNull(getPartString(req, "chasisNumber"));
                    milage = trimToNull(getPartString(req, "milage"));
                    pricePerDay = getPartDouble(req, "pricePerDay");
                    location = trimToNull(getPartString(req, "location"));
                    fuelType = trimToNull(getPartString(req, "fuelType"));
                    transmission = trimToNull(getPartString(req, "transmission"));
                    availabilityStatus = trimToNull(getPartString(req, "availabilityStatus"));
                    companyId = getPartInt(req, "companyId");
                    description = trimToNull(getPartString(req, "description"));

                    regDocBytes = getPartBytes(req, "registrationDoc");
                    vehicleImgBytes = getAllPartBytes(req, "vehicleImages");
                } else {
                    JsonObject body = readJson(req);
                    make = getStringOrNull(body, "make");
                    model = getStringOrNull(body, "model");
                    regNo = getStringOrNull(body, "regNo");
                    manufactureYear = getIntOrNull(body, "manufactureYear");
                    color = getStringOrNull(body, "color");
                    seats = getIntOrNull(body, "seats");
                    engineCapacity = getIntOrNull(body, "engineCapacity");
                    engineNumber = getStringOrNull(body, "engineNumber");
                    chasisNumber = getStringOrNull(body, "chasisNumber");
                    milage = getStringOrNull(body, "milage");
                    pricePerDay = getDoubleOrNull(body, "pricePerDay");
                    location = getStringOrNull(body, "location");
                    fuelType = getStringOrNull(body, "fuelType");
                    transmission = getStringOrNull(body, "transmission");
                    availabilityStatus = getStringOrNull(body, "availabilityStatus");
                    companyId = getIntOrNull(body, "companyId");
                    description = getStringOrNull(body, "description");
                }

                // Build dynamic UPDATE (only update blobs if new files were uploaded)
                boolean updateRegDoc = regDocBytes != null && regDocBytes.length > 0;
                boolean updateVehicleImg = vehicleImgBytes != null && vehicleImgBytes.length > 0;

                StringBuilder sql = new StringBuilder("UPDATE Vehicle SET ");
                sql.append("vehiclebrand = COALESCE(?, vehiclebrand), ");
                sql.append("vehiclemodel = COALESCE(?, vehiclemodel), ");
                sql.append("numberplatenumber = COALESCE(?, numberplatenumber), ");
                sql.append("manufacture_year = COALESCE(?, manufacture_year), ");
                sql.append("color = COALESCE(?, color), ");
                sql.append("numberofpassengers = COALESCE(?, numberofpassengers), ");
                sql.append("enginecapacity = COALESCE(?, enginecapacity), ");
                sql.append("enginenumber = COALESCE(?, enginenumber), ");
                sql.append("chasisnumber = COALESCE(?, chasisnumber), ");
                sql.append("milage = COALESCE(?, milage), ");
                sql.append("price_per_day = COALESCE(?, price_per_day), ");
                sql.append("location = COALESCE(?, location), ");
                sql.append("fuel_type = COALESCE(?, fuel_type), ");
                sql.append("transmission = COALESCE(?, transmission), ");
                sql.append("availability_status = COALESCE(?, availability_status), ");
                sql.append("company_id = ?, ");
                sql.append("description = COALESCE(?, description) ");
                if (updateRegDoc) sql.append(", registrationdocumentation = ? ");
                if (updateVehicleImg) sql.append(", vehicleimages = ? ");
                sql.append("WHERE vehicleid = ? AND provider_id = ?");

                try (PreparedStatement ps = con.prepareStatement(sql.toString())) {
                    int idx = 1;
                    if (make == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, make); idx++;
                    if (model == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, model); idx++;
                    if (regNo == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, regNo); idx++;
                    if (manufactureYear == null) ps.setNull(idx, Types.INTEGER); else ps.setInt(idx, manufactureYear); idx++;
                    if (color == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, color); idx++;
                    if (seats == null) ps.setNull(idx, Types.INTEGER); else ps.setInt(idx, seats); idx++;
                    if (engineCapacity == null) ps.setNull(idx, Types.INTEGER); else ps.setInt(idx, engineCapacity); idx++;
                    if (engineNumber == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, engineNumber); idx++;
                    if (chasisNumber == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, chasisNumber); idx++;
                    if (milage == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, milage); idx++;
                    if (pricePerDay == null) ps.setNull(idx, Types.DECIMAL); else ps.setDouble(idx, pricePerDay); idx++;
                    if (location == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, location); idx++;
                    if (fuelType == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, fuelType); idx++;
                    if (transmission == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, transmission); idx++;
                    if (availabilityStatus == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, availabilityStatus); idx++;
                    if (companyId == null) ps.setNull(idx, Types.INTEGER); else ps.setInt(idx, companyId); idx++;
                    if (description == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, description); idx++;

                    if (updateRegDoc) { ps.setBytes(idx, regDocBytes); idx++; }
                    if (updateVehicleImg) { ps.setBytes(idx, vehicleImgBytes); idx++; }

                    ps.setInt(idx, vehicleId); idx++;
                    ps.setInt(idx, providerId);

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

    // ─── DELETE ─────────────────────────────────────────────
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

    // ─── Helper: get single provider ────────────────────────
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

    // ─── Helper: vehicles by provider (with hasRegDoc / hasImages flags) ──
    private Map<String, Object> vehiclesByProvider(Connection con, int providerId) throws SQLException {
        String sql =
                "SELECT v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.manufacture_year, v.color, " +
                        "v.numberofpassengers, v.enginecapacity, v.enginenumber, v.chasisnumber, v.milage, v.price_per_day, " +
                        "v.location, v.fuel_type, v.transmission, v.availability_status, v.company_id, v.description, " +
                        "LENGTH(v.registrationdocumentation) AS regdoc_size, " +
                        "LENGTH(v.vehicleimages) AS images_size, " +
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

                    // Flags for frontend to know whether to show image/doc previews
                    long regDocSize = rs.getLong("regdoc_size");
                    long imagesSize = rs.getLong("images_size");
                    v.put("hasRegDoc", regDocSize > 0);
                    v.put("hasImages", imagesSize > 0);

                    list.add(v);
                }
            }
        }

        return Map.of("ok", true, "data", list);
    }
}