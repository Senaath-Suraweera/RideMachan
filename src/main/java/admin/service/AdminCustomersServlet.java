package admin.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import common.util.PasswordServices;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.BufferedReader;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.PrintWriter;
import java.security.SecureRandom;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/api/admin/customers/*")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024,
        maxFileSize = 5 * 1024 * 1024,
        maxRequestSize = 15 * 1024 * 1024
)
public class AdminCustomersServlet extends HttpServlet {

    private final Gson gson = new Gson();
    private final SecureRandom random = new SecureRandom();

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    private boolean isAdmin(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return false;
        Object actorType = session.getAttribute("actorType");
        return actorType != null && "ADMIN".equalsIgnoreCase(String.valueOf(actorType));
    }

    private String readBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = req.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        return sb.toString().trim();
    }

    private int parseIntOr(String v, int def) {
        try {
            return Integer.parseInt(v);
        } catch (Exception e) {
            return def;
        }
    }

    private String trimOrEmpty(String s) {
        return s == null ? "" : s.trim();
    }

    private String safeLike(String s) {
        return "%" + trimOrEmpty(s) + "%";
    }

    private String computeDocNumber(ResultSet rs) throws SQLException {
        String nic = rs.getString("nic_number");
        if (nic != null && !nic.trim().isEmpty()) return nic;
        return rs.getString("passport_number");
    }

    private String computeLicenseNumber(ResultSet rs) throws SQLException {
        String dl = rs.getString("drivers_license_number");
        if (dl != null && !dl.trim().isEmpty()) return dl;
        return rs.getString("international_drivers_license_number");
    }

    private String computeStatus(boolean active) {
        return active ? "active" : "inactive";
    }

    private String randomSuffix(int len) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

    private String genUsernameFromEmail(String email) {
        String e = trimOrEmpty(email).toLowerCase();
        String base = e.contains("@") ? e.substring(0, e.indexOf("@")) : "user";
        base = base.replaceAll("[^a-z0-9._-]", "");
        if (base.length() < 3) base = "user";
        return base + "_" + randomSuffix(4);
    }

    private String genTempPassword() {
        return "RM@" + randomSuffix(8);
    }

    private void bind(PreparedStatement ps, List<Object> params) throws SQLException {
        for (int i = 0; i < params.size(); i++) {
            Object val = params.get(i);
            if (val instanceof java.sql.Date) {
                ps.setDate(i + 1, (java.sql.Date) val);
            } else if (val instanceof Integer) {
                ps.setInt(i + 1, (Integer) val);
            } else if (val instanceof Long) {
                ps.setLong(i + 1, (Long) val);
            } else if (val instanceof Boolean) {
                ps.setBoolean(i + 1, (Boolean) val);
            } else {
                ps.setString(i + 1, val == null ? null : String.valueOf(val));
            }
        }
    }

    private String guessMimeType(byte[] data) {
        if (data == null || data.length < 4) return "application/octet-stream";

        if ((data[0] & 0xFF) == 0xFF && (data[1] & 0xFF) == 0xD8) {
            return "image/jpeg";
        }

        if ((data[0] & 0xFF) == 0x89 &&
                data[1] == 0x50 &&
                data[2] == 0x4E &&
                data[3] == 0x47) {
            return "image/png";
        }

        if (data.length >= 6) {
            String header = new String(data, 0, 6);
            if ("GIF87a".equals(header) || "GIF89a".equals(header)) {
                return "image/gif";
            }
        }

        if (data.length >= 12) {
            String riff = new String(data, 0, 4);
            String webp = new String(data, 8, 4);
            if ("RIFF".equals(riff) && "WEBP".equals(webp)) {
                return "image/webp";
            }
        }

        return "application/octet-stream";
    }

    private byte[] readPartBytes(Part part) throws IOException {
        if (part == null || part.getSize() <= 0) return null;

        try (InputStream in = part.getInputStream();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
            return out.toByteArray();
        }
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);
        resp.setCharacterEncoding("UTF-8");

        if (!isAdmin(req)) {
            resp.setContentType("application/json");
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"Unauthorized\"}");
            return;
        }

        String path = req.getPathInfo();

        try (Connection con = DBConnection.getConnection()) {

            if (path == null || "/".equals(path)) {
                String name = req.getParameter("name");
                String nicOrPassport = req.getParameter("nic");
                String location = req.getParameter("location");
                String status = req.getParameter("status");
                String customerType = req.getParameter("customerType");
                String joinFrom = req.getParameter("joinFrom");
                String joinTo = req.getParameter("joinTo");

                int minBookings = parseIntOr(req.getParameter("minBookings"), -1);
                int maxBookings = parseIntOr(req.getParameter("maxBookings"), -1);

                int page = parseIntOr(req.getParameter("page"), 1);
                int pageSize = parseIntOr(req.getParameter("pageSize"), 10);
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;
                int offset = (page - 1) * pageSize;

                StringBuilder where = new StringBuilder(" WHERE 1=1 ");
                List<Object> params = new ArrayList<>();

                if (name != null && !trimOrEmpty(name).isEmpty()) {
                    where.append(" AND CONCAT(COALESCE(c.firstname,''),' ',COALESCE(c.lastname,'')) LIKE ? ");
                    params.add(safeLike(name));
                }

                if (nicOrPassport != null && !trimOrEmpty(nicOrPassport).isEmpty()) {
                    where.append(" AND (c.nic_number LIKE ? OR c.passport_number LIKE ?) ");
                    params.add(safeLike(nicOrPassport));
                    params.add(safeLike(nicOrPassport));
                }

                if (location != null && !trimOrEmpty(location).isEmpty()) {
                    where.append(" AND (c.city LIKE ? OR c.street LIKE ? OR c.country LIKE ?) ");
                    params.add(safeLike(location));
                    params.add(safeLike(location));
                    params.add(safeLike(location));
                }

                if (customerType != null && !trimOrEmpty(customerType).isEmpty()) {
                    where.append(" AND c.customer_type = ? ");
                    params.add(trimOrEmpty(customerType).toUpperCase());
                }

                if (status != null && !trimOrEmpty(status).isEmpty()) {
                    String st = trimOrEmpty(status).toLowerCase();
                    if ("active".equals(st)) {
                        where.append(" AND c.active = TRUE ");
                    } else if ("inactive".equals(st)) {
                        where.append(" AND c.active = FALSE ");
                    }
                }

                if (joinFrom != null && !trimOrEmpty(joinFrom).isEmpty()) {
                    where.append(" AND DATE(c.created_at) >= ? ");
                    params.add(Date.valueOf(trimOrEmpty(joinFrom)));
                }

                if (joinTo != null && !trimOrEmpty(joinTo).isEmpty()) {
                    where.append(" AND DATE(c.created_at) <= ? ");
                    params.add(Date.valueOf(trimOrEmpty(joinTo)));
                }

                String countSql = "SELECT COUNT(*) FROM customer c " + where;
                long total = 0;
                try (PreparedStatement ps = con.prepareStatement(countSql)) {
                    bind(ps, params);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) total = rs.getLong(1);
                    }
                }

                String dataSql =
                        "SELECT " +
                                " c.customerid, c.firstname, c.lastname, c.email, c.mobilenumber, c.customer_type, " +
                                " c.street, c.city, c.zip_code, c.country, " +
                                " c.nic_number, c.passport_number, c.drivers_license_number, c.international_drivers_license_number, " +
                                " c.verified, c.active, c.created_at, " +
                                " (SELECT COUNT(*) FROM companybookings cb WHERE cb.customerid = c.customerid) AS bookings " +
                                "FROM customer c " +
                                where +
                                " HAVING (? < 0 OR bookings >= ?) AND (? < 0 OR bookings <= ?) " +
                                " ORDER BY c.customerid DESC " +
                                " LIMIT ? OFFSET ?";

                List<Object> dataParams = new ArrayList<>(params);
                dataParams.add(minBookings);
                dataParams.add(minBookings);
                dataParams.add(maxBookings);
                dataParams.add(maxBookings);
                dataParams.add(pageSize);
                dataParams.add(offset);

                JsonArray arr = new JsonArray();

                try (PreparedStatement ps = con.prepareStatement(dataSql)) {
                    bind(ps, dataParams);
                    try (ResultSet rs = ps.executeQuery()) {
                        while (rs.next()) {
                            JsonObject c = new JsonObject();
                            c.addProperty("id", rs.getInt("customerid"));
                            c.addProperty("name", (rs.getString("firstname") + " " + rs.getString("lastname")).trim());
                            c.addProperty("email", rs.getString("email"));
                            c.addProperty("phone", rs.getString("mobilenumber"));
                            c.addProperty("joinDate", rs.getTimestamp("created_at") == null ? null :
                                    rs.getTimestamp("created_at").toLocalDateTime().toLocalDate().toString());
                            c.addProperty("bookings", rs.getInt("bookings"));
                            c.addProperty("location", rs.getString("city"));

                            c.addProperty("nic", computeDocNumber(rs));
                            c.addProperty("license", computeLicenseNumber(rs));

                            boolean active = rs.getBoolean("active");
                            c.addProperty("status", computeStatus(active));
                            c.addProperty("rating", 0.0);
                            c.addProperty("reviews", 0);

                            String type = rs.getString("customer_type");
                            c.addProperty("customerType", type);
                            c.addProperty("description", type == null ? "Customer" : type + " Customer");

                            arr.add(c);
                        }
                    }
                }

                resp.setContentType("application/json");
                JsonObject res = new JsonObject();
                res.addProperty("page", page);
                res.addProperty("pageSize", pageSize);
                res.addProperty("total", total);
                res.add("customers", arr);
                resp.getWriter().write(gson.toJson(res));
                return;
            }

            String[] parts = path.split("/");

            if (parts.length >= 4 && "document".equalsIgnoreCase(parts[2])) {
                int id = parseIntOr(parts[1], -1);
                String docType = trimOrEmpty(parts[3]).toLowerCase();

                if (id <= 0) {
                    resp.setContentType("application/json");
                    resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                    resp.getWriter().write("{\"error\":\"Invalid customer id\"}");
                    return;
                }

                String column;
                switch (docType) {
                    case "nic":
                    case "passport":
                        column = "nic_image";
                        break;
                    case "license":
                    case "intl-license":
                    case "international-license":
                        column = "drivers_license_image";
                        break;
                    default:
                        resp.setContentType("application/json");
                        resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                        resp.getWriter().write("{\"error\":\"Invalid document type\"}");
                        return;
                }

                String sqlDoc = "SELECT " + column + " FROM customer WHERE customerid=?";
                try (PreparedStatement ps = con.prepareStatement(sqlDoc)) {
                    ps.setInt(1, id);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (!rs.next()) {
                            resp.setContentType("application/json");
                            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                            resp.getWriter().write("{\"error\":\"Customer not found\"}");
                            return;
                        }

                        byte[] data = rs.getBytes(1);
                        if (data == null || data.length == 0) {
                            resp.setContentType("application/json");
                            resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                            resp.getWriter().write("{\"error\":\"Document not found\"}");
                            return;
                        }

                        resp.reset();
                        addCors(resp);
                        resp.setCharacterEncoding("UTF-8");
                        resp.setStatus(HttpServletResponse.SC_OK);
                        resp.setContentType(guessMimeType(data));
                        resp.setContentLength(data.length);
                        resp.setHeader("Content-Disposition", "inline; filename=\"" + docType + "\"");
                        resp.getOutputStream().write(data);
                        resp.getOutputStream().flush();
                        return;
                    }
                }
            }

            String idStr = path.startsWith("/") ? path.substring(1) : path;
            int id = parseIntOr(idStr, -1);

            if (id <= 0) {
                resp.setContentType("application/json");
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"Invalid id\"}");
                return;
            }

            String sql =
                    "SELECT " +
                            " c.customerid, c.username, c.firstname, c.lastname, c.email, c.mobilenumber, c.customer_type, " +
                            " c.street, c.city, c.zip_code, c.country, " +
                            " c.nic_number, c.passport_number, c.drivers_license_number, c.international_drivers_license_number, " +
                            " c.nic_image, c.drivers_license_image, " +
                            " c.verified, c.active, c.created_at, " +
                            " (SELECT COUNT(*) FROM companybookings cb WHERE cb.customerid = c.customerid) AS bookings " +
                            "FROM customer c WHERE c.customerid=?";

            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setInt(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        resp.setContentType("application/json");
                        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        resp.getWriter().write("{\"error\":\"Customer not found\"}");
                        return;
                    }

                    JsonObject c = new JsonObject();
                    c.addProperty("id", rs.getInt("customerid"));
                    c.addProperty("username", rs.getString("username"));
                    c.addProperty("firstname", rs.getString("firstname"));
                    c.addProperty("lastname", rs.getString("lastname"));
                    c.addProperty("name", (rs.getString("firstname") + " " + rs.getString("lastname")).trim());
                    c.addProperty("email", rs.getString("email"));
                    c.addProperty("phone", rs.getString("mobilenumber"));
                    c.addProperty("customerType", rs.getString("customer_type"));

                    c.addProperty("street", rs.getString("street"));
                    c.addProperty("city", rs.getString("city"));
                    c.addProperty("zipCode", rs.getString("zip_code"));
                    c.addProperty("country", rs.getString("country"));

                    c.addProperty("nic", computeDocNumber(rs));
                    c.addProperty("license", computeLicenseNumber(rs));

                    c.addProperty("nicNumber", rs.getString("nic_number"));
                    c.addProperty("passportNumber", rs.getString("passport_number"));
                    c.addProperty("driversLicenseNumber", rs.getString("drivers_license_number"));
                    c.addProperty("internationalDriversLicenseNumber", rs.getString("international_drivers_license_number"));

                    c.addProperty("joinDate", rs.getTimestamp("created_at") == null ? null :
                            rs.getTimestamp("created_at").toLocalDateTime().toLocalDate().toString());
                    c.addProperty("bookings", rs.getInt("bookings"));

                    boolean active = rs.getBoolean("active");
                    c.addProperty("status", computeStatus(active));
                    c.addProperty("verified", rs.getBoolean("verified"));

                    boolean hasNicImage = rs.getBlob("nic_image") != null;
                    boolean hasLicenseImage = rs.getBlob("drivers_license_image") != null;

                    c.addProperty("hasNicImage", hasNicImage);
                    c.addProperty("hasLicenseImage", hasLicenseImage);
                    c.addProperty("hasPassportImage", hasNicImage);
                    c.addProperty("hasIntlLicenseImage", hasLicenseImage);

                    c.addProperty("rating", 0.0);
                    c.addProperty("reviews", 0);

                    String type = rs.getString("customer_type");
                    c.addProperty("description", type == null ? "Customer" : type + " Customer");

                    resp.setContentType("application/json");
                    resp.getWriter().write(gson.toJson(c));
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setContentType("application/json");
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        if (!isAdmin(req)) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"Unauthorized\"}");
            return;
        }

        String path = req.getPathInfo();
        if (path != null && path.matches("^/\\d+/documents/?$")) {
            handleDocumentUpload(req, resp, path);
            return;
        }

        String body = readBody(req);
        JsonObject json = body.isEmpty() ? new JsonObject() : gson.fromJson(body, JsonObject.class);

        String customerType = json.has("customerType") ? trimOrEmpty(json.get("customerType").getAsString()).toUpperCase() : "";
        String first = json.has("firstName") ? trimOrEmpty(json.get("firstName").getAsString()) : "";
        String last = json.has("lastName") ? trimOrEmpty(json.get("lastName").getAsString()) : "";
        String email = json.has("email") ? trimOrEmpty(json.get("email").getAsString()) : "";
        String phone = json.has("phone") ? trimOrEmpty(json.get("phone").getAsString()) : "";

        String street = json.has("street") ? trimOrEmpty(json.get("street").getAsString()) : "";
        String city = json.has("city") ? trimOrEmpty(json.get("city").getAsString()) : "";
        String zip = json.has("zipCode") ? trimOrEmpty(json.get("zipCode").getAsString()) : "";
        String country = json.has("country") ? trimOrEmpty(json.get("country").getAsString()) : "";

        String nicNumber = json.has("nicNumber") ? trimOrEmpty(json.get("nicNumber").getAsString()) : "";
        String passportNumber = json.has("passportNumber") ? trimOrEmpty(json.get("passportNumber").getAsString()) : "";

        String licenseNumber = "";
        if (json.has("licenseNumber")) {
            licenseNumber = trimOrEmpty(json.get("licenseNumber").getAsString());
        } else if (json.has("driversLicenseNumber")) {
            licenseNumber = trimOrEmpty(json.get("driversLicenseNumber").getAsString());
        } else if (json.has("internationalDriversLicenseNumber")) {
            licenseNumber = trimOrEmpty(json.get("internationalDriversLicenseNumber").getAsString());
        }

        String username = json.has("username") ? trimOrEmpty(json.get("username").getAsString()) : "";
        String password = json.has("password") ? trimOrEmpty(json.get("password").getAsString()) : "";

        if (first.isEmpty() || last.isEmpty() || email.isEmpty() || phone.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"firstName,lastName,email,phone are required\"}");
            return;
        }

        if (!customerType.equals("LOCAL") && !customerType.equals("FOREIGN")) {
            if (!nicNumber.isEmpty()) customerType = "LOCAL";
            else if (!passportNumber.isEmpty()) customerType = "FOREIGN";
        }

        if (!customerType.equals("LOCAL") && !customerType.equals("FOREIGN")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"customerType must be LOCAL or FOREIGN\"}");
            return;
        }

        String nicToSave = null;
        String passportToSave = null;
        String dlToSave = null;
        String idlToSave = null;

        if (customerType.equals("LOCAL")) {
            if (nicNumber.isEmpty() || licenseNumber.isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"LOCAL requires nicNumber and driversLicenseNumber\"}");
                return;
            }
            nicToSave = nicNumber;
            dlToSave = licenseNumber;
        } else {
            if (passportNumber.isEmpty() || licenseNumber.isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"FOREIGN requires passportNumber and internationalDriversLicenseNumber\"}");
                return;
            }
            passportToSave = passportNumber;
            idlToSave = licenseNumber;
        }

        if (username.isEmpty()) username = genUsernameFromEmail(email);

        boolean generatedPassword = false;
        if (password.isEmpty()) {
            password = genTempPassword();
            generatedPassword = true;
        }

        String salt = PasswordServices.generateSalt();
        String hash = PasswordServices.hashPassword(password, salt);

        String sql =
                "INSERT INTO customer " +
                        "(username, firstname, lastname, email, mobilenumber, hashedpassword, salt, customer_type, " +
                        " street, city, zip_code, country, " +
                        " nic_number, drivers_license_number, passport_number, international_drivers_license_number, " +
                        " verified, active) " +
                        "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, FALSE, TRUE)";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            int i = 1;
            ps.setString(i++, username);
            ps.setString(i++, first);
            ps.setString(i++, last);
            ps.setString(i++, email);
            ps.setString(i++, phone);
            ps.setString(i++, hash);
            ps.setString(i++, salt);
            ps.setString(i++, customerType);

            ps.setString(i++, street.isEmpty() ? null : street);
            ps.setString(i++, city.isEmpty() ? null : city);
            ps.setString(i++, zip.isEmpty() ? null : zip);
            ps.setString(i++, country.isEmpty() ? null : country);

            ps.setString(i++, nicToSave);
            ps.setString(i++, dlToSave);
            ps.setString(i++, passportToSave);
            ps.setString(i++, idlToSave);

            ps.executeUpdate();

            int newId = 0;
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) newId = rs.getInt(1);
            }

            JsonObject res = new JsonObject();
            res.addProperty("success", true);
            res.addProperty("customerId", newId);
            res.addProperty("username", username);

            if (generatedPassword) {
                res.addProperty("tempPassword", password);
            }

            resp.getWriter().write(gson.toJson(res));

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error\"}");
        }
    }

    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        if (!isAdmin(req)) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"Unauthorized\"}");
            return;
        }

        String path = req.getPathInfo();
        if (path == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Use /{id} or /{id}/status\"}");
            return;
        }

        if (path.toLowerCase().endsWith("/status")) {
            handleStatusUpdate(req, resp, path);
            return;
        }

        int id = parseIntOr(path.replace("/", ""), -1);
        if (id <= 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid customer id\"}");
            return;
        }

        String body = readBody(req);
        JsonObject json = body.isEmpty() ? new JsonObject() : gson.fromJson(body, JsonObject.class);

        String username = json.has("username") ? trimOrEmpty(json.get("username").getAsString()) : "";
        String email = json.has("email") ? trimOrEmpty(json.get("email").getAsString()) : "";
        String phone = json.has("phone") ? trimOrEmpty(json.get("phone").getAsString()) : "";
        String customerType = json.has("customerType") ? trimOrEmpty(json.get("customerType").getAsString()).toUpperCase() : "";
        String first = json.has("firstName") ? trimOrEmpty(json.get("firstName").getAsString()) : "";
        String last = json.has("lastName") ? trimOrEmpty(json.get("lastName").getAsString()) : "";
        String street = json.has("street") ? trimOrEmpty(json.get("street").getAsString()) : "";
        String city = json.has("city") ? trimOrEmpty(json.get("city").getAsString()) : "";
        String zip = json.has("zipCode") ? trimOrEmpty(json.get("zipCode").getAsString()) : "";
        String country = json.has("country") ? trimOrEmpty(json.get("country").getAsString()) : "";
        boolean verified = json.has("verified") && json.get("verified").getAsBoolean();

        String status = json.has("status") ? trimOrEmpty(json.get("status").getAsString()).toLowerCase() : "active";
        boolean active = !"inactive".equals(status);

        if (username.isEmpty() || email.isEmpty() || phone.isEmpty() ||
                customerType.isEmpty() || first.isEmpty() || last.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Missing required fields\"}");
            return;
        }

        if (!"LOCAL".equals(customerType) && !"FOREIGN".equals(customerType)) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"customerType must be LOCAL or FOREIGN\"}");
            return;
        }

        String nicNumber = json.has("nicNumber") ? trimOrEmpty(json.get("nicNumber").getAsString()) : "";
        String passportNumber = json.has("passportNumber") ? trimOrEmpty(json.get("passportNumber").getAsString()) : "";
        String driversLicenseNumber = json.has("driversLicenseNumber")
                ? trimOrEmpty(json.get("driversLicenseNumber").getAsString()) : "";
        String internationalDriversLicenseNumber = json.has("internationalDriversLicenseNumber")
                ? trimOrEmpty(json.get("internationalDriversLicenseNumber").getAsString()) : "";

        if ("LOCAL".equals(customerType)) {
            if (nicNumber.isEmpty() || driversLicenseNumber.isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"LOCAL requires nicNumber and driversLicenseNumber\"}");
                return;
            }
        } else {
            if (passportNumber.isEmpty() || internationalDriversLicenseNumber.isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"FOREIGN requires passportNumber and internationalDriversLicenseNumber\"}");
                return;
            }
        }

        String sql =
                "UPDATE customer SET " +
                        " username=?, firstname=?, lastname=?, email=?, mobilenumber=?, customer_type=?, " +
                        " street=?, city=?, zip_code=?, country=?, " +
                        " nic_number=?, drivers_license_number=?, passport_number=?, international_drivers_license_number=?, " +
                        " verified=?, active=? " +
                        "WHERE customerid=?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            int i = 1;
            ps.setString(i++, username);
            ps.setString(i++, first);
            ps.setString(i++, last);
            ps.setString(i++, email);
            ps.setString(i++, phone);
            ps.setString(i++, customerType);

            ps.setString(i++, street.isEmpty() ? null : street);
            ps.setString(i++, city.isEmpty() ? null : city);
            ps.setString(i++, zip.isEmpty() ? null : zip);
            ps.setString(i++, country.isEmpty() ? null : country);

            if ("LOCAL".equals(customerType)) {
                ps.setString(i++, nicNumber);
                ps.setString(i++, driversLicenseNumber);
                ps.setNull(i++, Types.VARCHAR);
                ps.setNull(i++, Types.VARCHAR);
            } else {
                ps.setNull(i++, Types.VARCHAR);
                ps.setNull(i++, Types.VARCHAR);
                ps.setString(i++, passportNumber);
                ps.setString(i++, internationalDriversLicenseNumber);
            }

            ps.setBoolean(i++, verified);
            ps.setBoolean(i++, active);
            ps.setInt(i++, id);

            int rows = ps.executeUpdate();
            if (rows == 0) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"error\":\"Customer not found\"}");
                return;
            }

            resp.getWriter().write("{\"success\":true,\"message\":\"Customer updated successfully\"}");

        } catch (SQLIntegrityConstraintViolationException e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_CONFLICT);
            resp.getWriter().write("{\"error\":\"Username or email already exists\"}");
        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error\"}");
        }
    }

    private void handleStatusUpdate(HttpServletRequest req, HttpServletResponse resp, String path) throws IOException {
        String[] parts = path.split("/");
        if (parts.length < 3) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid status update path\"}");
            return;
        }

        int id = parseIntOr(parts[1], -1);
        if (id <= 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid customer id\"}");
            return;
        }

        String body = readBody(req);
        JsonObject json = body.isEmpty() ? new JsonObject() : gson.fromJson(body, JsonObject.class);

        String status = json.has("status") ? trimOrEmpty(json.get("status").getAsString()).toLowerCase() : "";
        if (!"active".equals(status) && !"inactive".equals(status)) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"status must be active or inactive\"}");
            return;
        }

        boolean active = "active".equals(status);

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement("UPDATE customer SET active=? WHERE customerid=?")) {

            ps.setBoolean(1, active);
            ps.setInt(2, id);

            int rows = ps.executeUpdate();
            if (rows == 0) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"error\":\"Customer not found\"}");
                return;
            }

            resp.getWriter().write("{\"success\":true,\"status\":\"" + status + "\"}");

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error\"}");
        }
    }

    private void handleDocumentUpload(HttpServletRequest req, HttpServletResponse resp, String path)
            throws IOException, ServletException {

        String[] parts = path.split("/");
        if (parts.length < 3) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid document upload path\"}");
            return;
        }

        int customerId = parseIntOr(parts[1], -1);
        if (customerId <= 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid customer id\"}");
            return;
        }

        byte[] nicImage = null;
        byte[] driversLicenseImage = null;

        Part nicPart = req.getPart("nicImage");
        Part dlPart = req.getPart("driversLicenseImage");
        Part passportPart = req.getPart("passportImage");
        Part intlLicensePart = req.getPart("internationalLicenseImage");

        if (passportPart != null && passportPart.getSize() > 0) {
            nicImage = readPartBytes(passportPart);
        } else if (nicPart != null && nicPart.getSize() > 0) {
            nicImage = readPartBytes(nicPart);
        }

        if (intlLicensePart != null && intlLicensePart.getSize() > 0) {
            driversLicenseImage = readPartBytes(intlLicensePart);
        } else if (dlPart != null && dlPart.getSize() > 0) {
            driversLicenseImage = readPartBytes(dlPart);
        }

        if (nicImage == null && driversLicenseImage == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"No document images were uploaded\"}");
            return;
        }

        try (Connection con = DBConnection.getConnection()) {
            String customerType = null;
            try (PreparedStatement checkPs = con.prepareStatement(
                    "SELECT customer_type FROM customer WHERE customerid=?")) {
                checkPs.setInt(1, customerId);
                try (ResultSet rs = checkPs.executeQuery()) {
                    if (!rs.next()) {
                        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        resp.getWriter().write("{\"error\":\"Customer not found\"}");
                        return;
                    }
                    customerType = rs.getString("customer_type");
                }
            }

            StringBuilder sql = new StringBuilder("UPDATE customer SET ");
            List<Object> params = new ArrayList<>();

            if (nicImage != null) {
                sql.append("nic_image=?");
                params.add(nicImage);
            }

            if (driversLicenseImage != null) {
                if (!params.isEmpty()) sql.append(", ");
                sql.append("drivers_license_image=?");
                params.add(driversLicenseImage);
            }

            sql.append(" WHERE customerid=?");
            params.add(customerId);

            try (PreparedStatement ps = con.prepareStatement(sql.toString())) {
                int i = 1;
                for (Object p : params) {
                    if (p instanceof byte[]) {
                        ps.setBytes(i++, (byte[]) p);
                    } else {
                        ps.setInt(i++, (Integer) p);
                    }
                }

                int rows = ps.executeUpdate();
                if (rows == 0) {
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    resp.getWriter().write("{\"error\":\"Customer not found\"}");
                    return;
                }
            }

            JsonObject out = new JsonObject();
            out.addProperty("success", true);
            out.addProperty("customerId", customerId);
            out.addProperty("customerType", customerType);
            out.addProperty("updatedNicImage", nicImage != null);
            out.addProperty("updatedDriversLicenseImage", driversLicenseImage != null);
            out.addProperty("message", "Documents updated successfully");

            resp.getWriter().write(gson.toJson(out));

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error\"}");
        }
    }
}