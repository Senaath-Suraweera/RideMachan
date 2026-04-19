package individualprovider.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.util.*;

// not used because compatibility

/***
 * switch this to make this work and it will brake the admin sided reports
 * ALTER TABLE Report
 * MODIFY COLUMN reported_role ENUM('CUSTOMER','DRIVER','COMPANY','PROVIDER') NOT NULL;
 *
 * ALTER TABLE Report
 * MODIFY COLUMN reporter_role ENUM('CUSTOMER','DRIVER','COMPANY','ADMIN','PROVIDER') NOT NULL;
 */


@WebServlet(urlPatterns = {"/api/provider/reports", "/api/provider/reports/*"})
@MultipartConfig(maxFileSize = 10 * 1024 * 1024, maxRequestSize = 30 * 1024 * 1024)
public class ProviderReportsServlet extends HttpServlet {

    private static final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer providerId = getProviderId(req);
        if (providerId == null) {
            writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Provider not authenticated");
            return;
        }

        String pathInfo = req.getPathInfo();

        try {
            if (pathInfo == null || pathInfo.equals("/") || pathInfo.isBlank()) {
                listProviderReports(req, resp, providerId);
                return;
            }

            String[] parts = pathInfo.split("/");
            if (parts.length >= 2 && isInteger(parts[1])) {
                int reportId = Integer.parseInt(parts[1]);
                getProviderReport(resp, providerId, reportId);
                return;
            }

            writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
        } catch (Exception e) {
            e.printStackTrace();
            writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to load provider reports: " + e.getMessage());
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer providerId = getProviderId(req);
        if (providerId == null) {
            writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Provider not authenticated");
            return;
        }

        String pathInfo = req.getPathInfo();

        try {
            if (pathInfo == null || pathInfo.equals("/") || pathInfo.isBlank()) {
                createProviderReport(req, resp, providerId);
                return;
            }

            String[] parts = pathInfo.split("/");
            if (parts.length >= 3 && isInteger(parts[1]) && "images".equalsIgnoreCase(parts[2])) {
                int reportId = Integer.parseInt(parts[1]);
                uploadReportImages(req, resp, providerId, reportId);
                return;
            }

            writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Endpoint not found");
        } catch (Exception e) {
            e.printStackTrace();
            writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to process provider report request: " + e.getMessage());
        }
    }

    private void createProviderReport(HttpServletRequest req, HttpServletResponse resp, int providerId) throws Exception {
        JsonObject body = readJsonBody(req);

        String category = getJsonString(body, "category");
        String subject = getJsonString(body, "subject");
        String description = getJsonString(body, "description");
        String priority = getJsonString(body, "priority");
        String reportedRole = getJsonString(body, "reportedRole");
        Integer reportedId = getJsonInt(body, "reportedId");

        if (isBlank(category) || isBlank(subject) || isBlank(description) || isBlank(priority) || isBlank(reportedRole) || reportedId == null) {
            writeError(resp, HttpServletResponse.SC_BAD_REQUEST, "Missing required fields");
            return;
        }

        ProviderSnapshot provider = getProviderSnapshot(providerId);
        if (provider == null) {
            writeError(resp, HttpServletResponse.SC_UNAUTHORIZED, "Provider details not found");
            return;
        }

        String sql = """
            INSERT INTO Report (
                category,
                status,
                priority,
                subject,
                description,
                reported_role,
                reported_id,
                reporter_role,
                reporter_id,
                reporter_name,
                reporter_email,
                reporter_phone
            ) VALUES (?, 'Pending', ?, ?, ?, ?, ?, 'PROVIDER', ?, ?, ?, ?)
        """;

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, category);
            ps.setString(2, priority);
            ps.setString(3, subject);
            ps.setString(4, description);
            ps.setString(5, reportedRole);
            ps.setInt(6, reportedId);
            ps.setInt(7, providerId);
            ps.setString(8, provider.name);
            ps.setString(9, provider.email);
            ps.setString(10, provider.phone);

            int affected = ps.executeUpdate();
            if (affected == 0) {
                writeError(resp, HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to create report");
                return;
            }

            int reportId = 0;
            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) {
                    reportId = rs.getInt(1);
                }
            }

            Map<String, Object> out = new LinkedHashMap<>();
            out.put("status", "success");
            out.put("message", "Report submitted successfully");
            out.put("reportId", reportId);
            out.put("displayCode", buildDisplayCode(reportId));

            resp.getWriter().write(gson.toJson(out));
        }
    }

    private void listProviderReports(HttpServletRequest req, HttpServletResponse resp, int providerId) throws Exception {
        String status = trimToNull(req.getParameter("status"));
        String category = trimToNull(req.getParameter("category"));
        String search = trimToNull(req.getParameter("search"));

        StringBuilder sql = new StringBuilder("""
            SELECT
                report_id,
                category,
                status,
                priority,
                subject,
                description,
                reported_role,
                reported_id,
                reporter_role,
                reporter_id,
                reporter_name,
                reporter_email,
                reporter_phone,
                created_at,
                updated_at
            FROM Report
            WHERE reporter_role = 'PROVIDER'
              AND reporter_id = ?
        """);

        List<Object> params = new ArrayList<>();
        params.add(providerId);

        if (status != null) {
            sql.append(" AND status = ?");
            params.add(status);
        }
        if (category != null) {
            sql.append(" AND category = ?");
            params.add(category);
        }
        if (search != null) {
            sql.append(" AND (subject LIKE ? OR description LIKE ?)");
            params.add("%" + search + "%");
            params.add("%" + search + "%");
        }

        sql.append(" ORDER BY created_at DESC");

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql.toString())) {

            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }

            List<Map<String, Object>> reports = new ArrayList<>();

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> row = new LinkedHashMap<>();
                    int reportId = rs.getInt("report_id");

                    row.put("reportId", reportId);
                    row.put("displayCode", buildDisplayCode(reportId));
                    row.put("category", rs.getString("category"));
                    row.put("status", rs.getString("status"));
                    row.put("priority", rs.getString("priority"));
                    row.put("subject", rs.getString("subject"));
                    row.put("description", rs.getString("description"));
                    row.put("reportedRole", rs.getString("reported_role"));
                    row.put("reportedId", rs.getInt("reported_id"));
                    row.put("reporterRole", rs.getString("reporter_role"));
                    row.put("reporterId", rs.getInt("reporter_id"));
                    row.put("reporterName", rs.getString("reporter_name"));
                    row.put("reporterEmail", rs.getString("reporter_email"));
                    row.put("reporterPhone", rs.getString("reporter_phone"));
                    row.put("createdAt", rs.getTimestamp("created_at"));
                    row.put("updatedAt", rs.getTimestamp("updated_at"));
                    row.put("imageIds", getImageIds(con, reportId));

                    reports.add(row);
                }
            }

            Map<String, Object> out = new LinkedHashMap<>();
            out.put("status", "success");
            out.put("reports", reports);

            resp.getWriter().write(gson.toJson(out));
        }
    }

    private void getProviderReport(HttpServletResponse resp, int providerId, int reportId) throws Exception {
        String sql = """
            SELECT
                report_id,
                category,
                status,
                priority,
                subject,
                description,
                reported_role,
                reported_id,
                reporter_role,
                reporter_id,
                reporter_name,
                reporter_email,
                reporter_phone,
                created_at,
                updated_at
            FROM Report
            WHERE report_id = ?
              AND reporter_role = 'PROVIDER'
              AND reporter_id = ?
        """;

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, reportId);
            ps.setInt(2, providerId);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    writeError(resp, HttpServletResponse.SC_NOT_FOUND, "Report not found");
                    return;
                }

                Map<String, Object> report = new LinkedHashMap<>();
                report.put("reportId", rs.getInt("report_id"));
                report.put("displayCode", buildDisplayCode(rs.getInt("report_id")));
                report.put("category", rs.getString("category"));
                report.put("status", rs.getString("status"));
                report.put("priority", rs.getString("priority"));
                report.put("subject", rs.getString("subject"));
                report.put("description", rs.getString("description"));
                report.put("reportedRole", rs.getString("reported_role"));
                report.put("reportedId", rs.getInt("reported_id"));
                report.put("reporterRole", rs.getString("reporter_role"));
                report.put("reporterId", rs.getInt("reporter_id"));
                report.put("reporterName", rs.getString("reporter_name"));
                report.put("reporterEmail", rs.getString("reporter_email"));
                report.put("reporterPhone", rs.getString("reporter_phone"));
                report.put("createdAt", rs.getTimestamp("created_at"));
                report.put("updatedAt", rs.getTimestamp("updated_at"));

                Map<String, Object> out = new LinkedHashMap<>();
                out.put("status", "success");
                out.put("report", report);
                out.put("imageIds", getImageIds(con, reportId));

                resp.getWriter().write(gson.toJson(out));
            }
        }
    }

    private void uploadReportImages(HttpServletRequest req, HttpServletResponse resp, int providerId, int reportId) throws Exception {
        if (!ownsReport(providerId, reportId)) {
            writeError(resp, HttpServletResponse.SC_FORBIDDEN, "You do not have access to this report");
            return;
        }

        List<Integer> imageIds = new ArrayList<>();

        try (Connection con = DBConnection.getConnection()) {
            String insertSql = "INSERT INTO ReportImage (report_id, image_data) VALUES (?, ?)";

            for (Part part : req.getParts()) {
                if (!"images".equals(part.getName())) continue;
                if (part.getSize() <= 0) continue;

                try (InputStream in = part.getInputStream();
                     PreparedStatement ps = con.prepareStatement(insertSql, Statement.RETURN_GENERATED_KEYS)) {

                    ps.setInt(1, reportId);
                    ps.setBytes(2, in.readAllBytes());
                    ps.executeUpdate();

                    try (ResultSet rs = ps.getGeneratedKeys()) {
                        if (rs.next()) {
                            imageIds.add(rs.getInt(1));
                        }
                    }
                }
            }
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", "success");
        out.put("reportId", reportId);
        out.put("imageIds", imageIds);

        resp.getWriter().write(gson.toJson(out));
    }

    private boolean ownsReport(int providerId, int reportId) throws Exception {
        String sql = """
            SELECT 1
            FROM Report
            WHERE report_id = ?
              AND reporter_role = 'PROVIDER'
              AND reporter_id = ?
        """;

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, reportId);
            ps.setInt(2, providerId);

            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private List<Integer> getImageIds(Connection con, int reportId) throws Exception {
        String sql = "SELECT image_id FROM ReportImage WHERE report_id = ? ORDER BY created_at DESC";
        List<Integer> ids = new ArrayList<>();

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, reportId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    ids.add(rs.getInt("image_id"));
                }
            }
        }

        return ids;
    }

    private ProviderSnapshot getProviderSnapshot(int providerId) throws Exception {
        String sql = """
            SELECT
                providerid,
                TRIM(CONCAT(COALESCE(firstname, ''), ' ', COALESCE(lastname, ''))) AS full_name,
                email,
                phonenumber
            FROM VehicleProvider
            WHERE providerid = ?
        """;

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, providerId);

            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                ProviderSnapshot p = new ProviderSnapshot();
                p.id = rs.getInt("providerid");

                String fullName = rs.getString("full_name");
                if (fullName == null || fullName.trim().isEmpty()) {
                    fullName = "Provider #" + providerId;
                }

                p.name = fullName.trim();
                p.email = rs.getString("email");
                p.phone = rs.getString("phonenumber");
                return p;
            }
        }
    }

    private Integer getProviderId(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return null;

        String[] possibleKeys = {
                "providerId",
                "providerid",
                "actorId",
                "userId",
                "id"
        };

        for (String key : possibleKeys) {
            Object value = session.getAttribute(key);
            if (value == null) continue;

            try {
                return Integer.parseInt(String.valueOf(value));
            } catch (Exception ignored) {
            }
        }

        return null;
    }

    private JsonObject readJsonBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();

        try (BufferedReader reader = req.getReader()) {
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }
        }

        if (sb.isEmpty()) return new JsonObject();
        return gson.fromJson(sb.toString(), JsonObject.class);
    }

    private String getJsonString(JsonObject obj, String key) {
        if (obj == null || !obj.has(key) || obj.get(key).isJsonNull()) return null;
        return obj.get(key).getAsString();
    }

    private Integer getJsonInt(JsonObject obj, String key) {
        if (obj == null || !obj.has(key) || obj.get(key).isJsonNull()) return null;
        try {
            return obj.get(key).getAsInt();
        } catch (Exception e) {
            return null;
        }
    }

    private String buildDisplayCode(int reportId) {
        Calendar cal = Calendar.getInstance();
        return "RPT-" + cal.get(Calendar.YEAR) + "-" + String.format("%03d", reportId);
    }

    private void writeError(HttpServletResponse resp, int statusCode, String message) throws IOException {
        resp.setStatus(statusCode);
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("status", "fail");
        out.put("message", message);
        resp.getWriter().write(gson.toJson(out));
    }

    private boolean isInteger(String value) {
        try {
            Integer.parseInt(value);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String v = value.trim();
        return v.isEmpty() ? null : v;
    }

    private static class ProviderSnapshot {
        int id;
        String name;
        String email;
        String phone;
    }
}