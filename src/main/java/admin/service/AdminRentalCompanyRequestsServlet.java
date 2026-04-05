package admin.service;

import common.util.DBConnection;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.*;

@WebServlet("/api/admin/rental-company-requests")
public class AdminRentalCompanyRequestsServlet extends HttpServlet {

    private void writeJson(HttpServletResponse resp, int status, String payload) throws IOException {
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
        writeJson(resp, 200, "{\"ok\":true}");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String status = req.getParameter("status");
        if (status == null || status.trim().isEmpty()) status = "PENDING";

        // UPDATED: includes description, terms
        String sql = "SELECT request_id, companyname, companyemail, phone, city, registrationnumber, " +
                "       description, terms, status, submitted_at " +
                "FROM RentalCompanyRegistrationRequest " +
                "WHERE status = ? ORDER BY submitted_at DESC";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setString(1, status);

            StringBuilder sb = new StringBuilder();
            sb.append("{\"ok\":true,\"status\":\"").append(escape(status)).append("\",\"data\":[");

            try (ResultSet rs = ps.executeQuery()) {
                boolean first = true;
                while (rs.next()) {
                    if (!first) sb.append(",");
                    first = false;

                    sb.append("{")
                            .append("\"id\":").append(rs.getInt("request_id")).append(",")
                            .append("\"name\":\"").append(escape(rs.getString("companyname"))).append("\",")
                            .append("\"email\":\"").append(escape(rs.getString("companyemail"))).append("\",")
                            .append("\"phone\":\"").append(escape(rs.getString("phone"))).append("\",")
                            .append("\"city\":\"").append(escape(rs.getString("city"))).append("\",")
                            .append("\"registrationnumber\":\"").append(escape(rs.getString("registrationnumber"))).append("\",")

                            // NEW
                            .append("\"description\":\"").append(escape(rs.getString("description"))).append("\",")
                            .append("\"terms\":\"").append(escape(rs.getString("terms"))).append("\",")

                            .append("\"status\":\"").append(escape(rs.getString("status"))).append("\",")
                            .append("\"submitted\":\"").append(escape(String.valueOf(rs.getTimestamp("submitted_at")))).append("\"")
                            .append("}");
                }
            }

            sb.append("]}");
            writeJson(resp, 200, sb.toString());
        } catch (Exception e) {
            e.printStackTrace();
            writeJson(resp, 500, "{\"ok\":false,\"message\":\"Server error\"}");
        }
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}
