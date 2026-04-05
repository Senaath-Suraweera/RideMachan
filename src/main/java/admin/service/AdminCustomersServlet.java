package admin.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import common.util.PasswordServices;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.security.SecureRandom;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/api/admin/customers/*")
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
        try { return Integer.parseInt(v); } catch (Exception e) { return def; }
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
        String pass = rs.getString("passport_number");
        return pass;
    }

    private String computeLicenseNumber(ResultSet rs) throws SQLException {
        String dl = rs.getString("drivers_license_number");
        if (dl != null && !dl.trim().isEmpty()) return dl;
        String idl = rs.getString("international_drivers_license_number");
        return idl;
    }

    private String computeStatus(boolean active) {
        return active ? "active" : "inactive";
    }

    private String randomSuffix(int len) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < len; i++) sb.append(chars.charAt(random.nextInt(chars.length())));
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

    /* ======================= GET =======================
       GET /api/admin/customers
       GET /api/admin/customers/{id}
     */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        if (!isAdmin(req)) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"Unauthorized\"}");
            return;
        }

        String path = req.getPathInfo(); // null, "/", "/{id}"

        try (Connection con = DBConnection.getConnection();
             PrintWriter out = resp.getWriter()) {

            // ============ LIST ============
            if (path == null || "/".equals(path)) {

                String name = req.getParameter("name");
                String nicOrPassport = req.getParameter("nic"); // UI field name stays "nic"
                String location = req.getParameter("location");
                String status = req.getParameter("status"); // active/inactive/banned
                String customerType = req.getParameter("customerType"); // LOCAL/FOREIGN (optional)
                String joinFrom = req.getParameter("joinFrom"); // yyyy-mm-dd
                String joinTo = req.getParameter("joinTo");     // yyyy-mm-dd

                int minBookings = parseIntOr(req.getParameter("minBookings"), -1);
                int maxBookings = parseIntOr(req.getParameter("maxBookings"), -1);

                // UI might send minRating; DB doesn't have customer ratings -> ignore safely
                // (DON'T parse directly; avoids trim(null) crash)
                String minRatingStr = req.getParameter("minRating"); // ignored

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

                // status -> active boolean
                if (status != null && !trimOrEmpty(status).isEmpty()) {
                    String st = trimOrEmpty(status).toLowerCase();
                    if ("active".equals(st)) {
                        where.append(" AND c.active = TRUE ");
                    } else if ("inactive".equals(st) || "banned".equals(st)) {
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

                // count
                String countSql = "SELECT COUNT(*) FROM customer c " + where;
                long total = 0;
                try (PreparedStatement ps = con.prepareStatement(countSql)) {
                    bind(ps, params);
                    try (ResultSet rs = ps.executeQuery()) {
                        if (rs.next()) total = rs.getLong(1);
                    }
                }

                // data (bookings as computed column)
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
                dataParams.add(minBookings); dataParams.add(minBookings);
                dataParams.add(maxBookings); dataParams.add(maxBookings);
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

                            // Doc + license (mutually exclusive pairs)
                            String doc = computeDocNumber(rs);
                            String lic = computeLicenseNumber(rs);
                            c.addProperty("nic", doc); // keep UI field name "nic"
                            c.addProperty("license", lic);

                            boolean active = rs.getBoolean("active");
                            c.addProperty("status", computeStatus(active));

                            // DB doesn't store customer ratings -> keep 0 for UI compatibility
                            c.addProperty("rating", 0.0);
                            c.addProperty("reviews", 0);

                            String type = rs.getString("customer_type");
                            c.addProperty("customerType", type);

                            // A simple description for cards
                            String desc = (type == null ? "Customer" : type + " Customer");
                            c.addProperty("description", desc);

                            arr.add(c);
                        }
                    }
                }

                JsonObject res = new JsonObject();
                res.addProperty("page", page);
                res.addProperty("pageSize", pageSize);
                res.addProperty("total", total);
                res.add("customers", arr);

                out.write(gson.toJson(res));
                return;
            }

            // ============ GET /{id} ============
            String idStr = path.startsWith("/") ? path.substring(1) : path;
            int id = parseIntOr(idStr, -1);
            if (id <= 0) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write("{\"error\":\"Invalid id\"}");
                return;
            }

            String sql =
                    "SELECT " +
                            " c.customerid, c.username, c.firstname, c.lastname, c.email, c.mobilenumber, c.customer_type, " +
                            " c.street, c.city, c.zip_code, c.country, " +
                            " c.nic_number, c.passport_number, c.drivers_license_number, c.international_drivers_license_number, " +
                            " c.verified, c.active, c.created_at, " +
                            " (SELECT COUNT(*) FROM companybookings cb WHERE cb.customerid = c.customerid) AS bookings " +
                            "FROM customer c WHERE c.customerid=?";

            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setInt(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                        out.write("{\"error\":\"Customer not found\"}");
                        return;
                    }

                    JsonObject c = new JsonObject();
                    c.addProperty("id", rs.getInt("customerid"));
                    c.addProperty("username", rs.getString("username"));
                    c.addProperty("name", (rs.getString("firstname") + " " + rs.getString("lastname")).trim());
                    c.addProperty("email", rs.getString("email"));
                    c.addProperty("phone", rs.getString("mobilenumber"));
                    c.addProperty("customerType", rs.getString("customer_type"));

                    c.addProperty("street", rs.getString("street"));
                    c.addProperty("city", rs.getString("city"));
                    c.addProperty("zipCode", rs.getString("zip_code"));
                    c.addProperty("country", rs.getString("country"));

                    String doc = computeDocNumber(rs);
                    String lic = computeLicenseNumber(rs);
                    c.addProperty("nic", doc);      // UI-friendly
                    c.addProperty("license", lic);  // UI-friendly

                    c.addProperty("joinDate", rs.getTimestamp("created_at") == null ? null :
                            rs.getTimestamp("created_at").toLocalDateTime().toLocalDate().toString());
                    c.addProperty("bookings", rs.getInt("bookings"));

                    boolean active = rs.getBoolean("active");
                    c.addProperty("status", computeStatus(active));

                    c.addProperty("rating", 0.0);
                    c.addProperty("reviews", 0);

                    // Description for the view page
                    String type = rs.getString("customer_type");
                    c.addProperty("description", (type == null ? "Customer" : type + " Customer"));

                    out.write(gson.toJson(c));
                }
            }

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error\"}");
        }
    }

    /* ======================= POST =======================
       POST /api/admin/customers
       Supports BOTH local + foreign (mutually exclusive fields)

       Example LOCAL:
       {
         "customerType":"LOCAL",
         "firstName":"Kamal","lastName":"Perera",
         "email":"k@x.com","phone":"077...",
         "street":"No 1","city":"Colombo","zipCode":"00100","country":"Sri Lanka",
         "nicNumber":"2000...V",
         "licenseNumber":"B1234567",
         "username":"optional",
         "password":"optional"
       }

       Example FOREIGN:
       {
         "customerType":"FOREIGN",
         "firstName":"John","lastName":"Smith",
         "email":"j@x.com","phone":"+1...",
         "passportNumber":"P123456",
         "licenseNumber":"IDL-999",
         "street":"...","city":"Colombo","country":"USA"
       }
     */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        if (!isAdmin(req)) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"Unauthorized\"}");
            return;
        }

        String body = readBody(req);
        JsonObject json = body.isEmpty() ? new JsonObject() : gson.fromJson(body, JsonObject.class);

        String customerType = json.has("customerType") ? trimOrEmpty(json.get("customerType").getAsString()).toUpperCase() : "";
        String first = json.has("firstName") ? trimOrEmpty(json.get("firstName").getAsString()) : "";
        String last  = json.has("lastName")  ? trimOrEmpty(json.get("lastName").getAsString())  : "";
        String email = json.has("email")     ? trimOrEmpty(json.get("email").getAsString())     : "";
        String phone = json.has("phone")     ? trimOrEmpty(json.get("phone").getAsString())     : "";

        String street = json.has("street") ? trimOrEmpty(json.get("street").getAsString()) : "";
        String city   = json.has("city")   ? trimOrEmpty(json.get("city").getAsString())   : "";
        String zip    = json.has("zipCode")? trimOrEmpty(json.get("zipCode").getAsString()): "";
        String country= json.has("country")? trimOrEmpty(json.get("country").getAsString()): "";

        String nicNumber = json.has("nicNumber") ? trimOrEmpty(json.get("nicNumber").getAsString()) : "";
        String passportNumber = json.has("passportNumber") ? trimOrEmpty(json.get("passportNumber").getAsString()) : "";
        String licenseNumber = json.has("licenseNumber") ? trimOrEmpty(json.get("licenseNumber").getAsString()) : "";

        String username = json.has("username") ? trimOrEmpty(json.get("username").getAsString()) : "";
        String password = json.has("password") ? trimOrEmpty(json.get("password").getAsString()) : "";

        if (first.isEmpty() || last.isEmpty() || email.isEmpty() || phone.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"firstName,lastName,email,phone are required\"}");
            return;
        }

        if (!customerType.equals("LOCAL") && !customerType.equals("FOREIGN")) {
            // allow infer from provided doc
            if (!nicNumber.isEmpty()) customerType = "LOCAL";
            else if (!passportNumber.isEmpty()) customerType = "FOREIGN";
        }

        if (!customerType.equals("LOCAL") && !customerType.equals("FOREIGN")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"customerType must be LOCAL or FOREIGN\"}");
            return;
        }

        // Enforce mutually exclusive doc fields
        String nicToSave = null;
        String passportToSave = null;
        String dlToSave = null;
        String idlToSave = null;

        if (customerType.equals("LOCAL")) {
            if (nicNumber.isEmpty() || licenseNumber.isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"LOCAL requires nicNumber and licenseNumber\"}");
                return;
            }
            nicToSave = nicNumber;
            dlToSave = licenseNumber;
            passportToSave = null;
            idlToSave = null;
        } else { // FOREIGN
            if (passportNumber.isEmpty() || licenseNumber.isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"error\":\"FOREIGN requires passportNumber and licenseNumber\"}");
                return;
            }
            passportToSave = passportNumber;
            idlToSave = licenseNumber;
            nicToSave = null;
            dlToSave = null;
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
                // so admin can share it if needed
                res.addProperty("tempPassword", password);
            }

            resp.getWriter().write(gson.toJson(res));

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error\"}");
        }
    }

    /* ======================= PUT =======================
       PUT /api/admin/customers/{id}/status
       JSON: { "status":"active" } or { "status":"inactive" } or { "status":"banned" }
       Stored using: customer.active boolean
     */
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

        String path = req.getPathInfo(); // "/{id}/status"
        if (path == null || !path.toLowerCase().endsWith("/status")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Use /{id}/status\"}");
            return;
        }

        String[] parts = path.split("/");
        if (parts.length < 3) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Use /{id}/status\"}");
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
        if (!status.equals("active") && !status.equals("inactive") && !status.equals("banned")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Status must be active|inactive|banned\"}");
            return;
        }

        boolean active = status.equals("active");

        String sql = "UPDATE customer SET active=? WHERE customerid=?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setBoolean(1, active);
            ps.setInt(2, id);

            int updated = ps.executeUpdate();
            if (updated == 0) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"error\":\"Customer not found\"}");
                return;
            }

            JsonObject res = new JsonObject();
            res.addProperty("success", true);
            res.addProperty("customerId", id);
            res.addProperty("status", computeStatus(active)); // returns active/inactive
            resp.getWriter().write(gson.toJson(res));

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error\"}");
        }
    }

    private void bind(PreparedStatement ps, List<Object> params) throws SQLException {
        int i = 1;
        for (Object p : params) {
            if (p instanceof Integer) ps.setInt(i++, (Integer) p);
            else if (p instanceof Long) ps.setLong(i++, (Long) p);
            else if (p instanceof Double) ps.setDouble(i++, (Double) p);
            else if (p instanceof Date) ps.setDate(i++, (Date) p);
            else ps.setString(i++, String.valueOf(p));
        }
    }
}
