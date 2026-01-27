package admin.service;

import common.util.DBConnection;
import common.util.PasswordServices;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.*;
import java.sql.*;
import java.util.*;

@WebServlet("/api/rental-company-requests")
public class RentalCompanyRequestCreateServlet extends HttpServlet {

    private Map<String, String> parseJsonFlat(String body) {
        Map<String, String> map = new HashMap<>();
        body = body.trim();
        if (body.startsWith("{")) body = body.substring(1);
        if (body.endsWith("}")) body = body.substring(0, body.length() - 1);

        List<String> parts = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < body.length(); i++) {
            char ch = body.charAt(i);
            if (ch == '"' && (i == 0 || body.charAt(i - 1) != '\\')) inQuotes = !inQuotes;
            if (ch == ',' && !inQuotes) {
                parts.add(cur.toString());
                cur.setLength(0);
            } else cur.append(ch);
        }
        if (cur.length() > 0) parts.add(cur.toString());

        for (String p : parts) {
            String[] kv = p.split(":", 2);
            if (kv.length != 2) continue;
            String k = kv[0].trim().replaceAll("^\"|\"$", "");
            String v = kv[1].trim();
            v = v.replaceAll("^\"|\"$", "");
            map.put(k, v);
        }
        return map;
    }

    private String readBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = req.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        return sb.toString();
    }

    private void json(HttpServletResponse resp, int status, String payload) throws IOException {
        resp.setStatus(status);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.getWriter().write(payload);
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        json(resp, 200, "{\"ok\":true}");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String body = readBody(req);
        Map<String, String> data = parseJsonFlat(body);

        String companyName = data.getOrDefault("companyname", "").trim();
        String companyEmail = data.getOrDefault("companyemail", "").trim();
        String phone = data.getOrDefault("phone", "").trim();
        String registrationNumber = data.getOrDefault("registrationnumber", "").trim();
        String taxId = data.getOrDefault("taxid", "").trim();
        String street = data.getOrDefault("street", "").trim();
        String city = data.getOrDefault("city", "").trim();
        String certificatePath = data.getOrDefault("certificatepath", "").trim();
        String taxDocPath = data.getOrDefault("taxdocumentpath", "").trim();

        // NEW
        String description = data.getOrDefault("description", "").trim();
        String terms = data.getOrDefault("terms", "").trim();

        String password = data.getOrDefault("password", "").trim();

        if (companyName.isEmpty() || companyEmail.isEmpty() || password.isEmpty()) {
            json(resp, 400, "{\"ok\":false,\"message\":\"companyname, companyemail, password are required\"}");
            return;
        }

        String salt = PasswordServices.generateSalt();
        String hashed = PasswordServices.hashPassword(password, salt);

        String sql = "INSERT INTO RentalCompanyRegistrationRequest " +
                "(companyname, companyemail, phone, registrationnumber, taxid, street, city, certificatepath, taxdocumentpath, description, terms, hashedpassword, salt, status) " +
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'PENDING')";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, companyName);
            ps.setString(2, companyEmail);
            ps.setString(3, phone.isEmpty() ? null : phone);
            ps.setString(4, registrationNumber.isEmpty() ? null : registrationNumber);
            ps.setString(5, taxId.isEmpty() ? null : taxId);
            ps.setString(6, street.isEmpty() ? null : street);
            ps.setString(7, city.isEmpty() ? null : city);
            ps.setString(8, certificatePath.isEmpty() ? null : certificatePath);
            ps.setString(9, taxDocPath.isEmpty() ? null : taxDocPath);

            // NEW
            ps.setString(10, description.isEmpty() ? null : description);
            ps.setString(11, terms.isEmpty() ? null : terms);

            ps.setString(12, hashed);
            ps.setString(13, salt);

            ps.executeUpdate();

            int requestId = -1;
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) requestId = rs.getInt(1);
            }

            json(resp, 201, "{\"ok\":true,\"message\":\"Request submitted\",\"request_id\":" + requestId + "}");
        } catch (SQLIntegrityConstraintViolationException dup) {
            json(resp, 409, "{\"ok\":false,\"message\":\"Duplicate email or constraint violation\"}");
        } catch (Exception e) {
            e.printStackTrace();
            json(resp, 500, "{\"ok\":false,\"message\":\"Server error\"}");
        }
    }
}
