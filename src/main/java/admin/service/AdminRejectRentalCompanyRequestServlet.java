package admin.service;

import common.util.DBConnection;
import common.util.GmailSender;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.*;
import java.sql.*;

@WebServlet("/api/admin/rental-company-requests/reject")
public class AdminRejectRentalCompanyRequestServlet extends HttpServlet {

    private String readBody(HttpServletRequest req) throws IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = req.getReader()) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        return sb.toString();
    }


    private String extractReason(String body) {
        if (body == null) return null;
        body = body.trim();
        int idx = body.indexOf("\"reason\"");
        if (idx < 0) return null;
        int colon = body.indexOf(":", idx);
        if (colon < 0) return null;
        String tail = body.substring(colon + 1).trim();
        int q1 = tail.indexOf("\"");
        if (q1 < 0) return null;
        int q2 = tail.indexOf("\"", q1 + 1);
        if (q2 < 0) return null;
        return tail.substring(q1 + 1, q2);
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
        String idStr = req.getParameter("id");
        String adminIdStr = req.getParameter("adminId");
        if (idStr == null) {
            json(resp, 400, "{\"ok\":false,\"message\":\"id is required\"}");
            return;
        }

        int requestId = Integer.parseInt(idStr);
        Integer adminId = null;
        if (adminIdStr != null && !adminIdStr.trim().isEmpty()) adminId = Integer.parseInt(adminIdStr);

        String reason = extractReason(readBody(req));
        if (reason != null && reason.length() > 255) reason = reason.substring(0, 255);

        String selectReq = "SELECT companyemail, companyname FROM RentalCompanyRegistrationRequest WHERE request_id=?";

        String update = "UPDATE RentalCompanyRegistrationRequest " +
                "SET status='REJECTED', reviewed_at=NOW(), reviewed_by_adminid=?, reject_reason=? " +
                "WHERE request_id=? AND status='PENDING'";

        String requestEmail = null;
        String requestCompanyName = null;

        try (Connection con = DBConnection.getConnection()) {

            try (PreparedStatement psSel = con.prepareStatement(selectReq)) {
                psSel.setInt(1, requestId);
                try (ResultSet rs = psSel.executeQuery()) {
                    if (rs.next()) {
                        requestEmail = rs.getString("companyemail");
                        requestCompanyName = rs.getString("companyname");
                    }
                }
            }

            try (PreparedStatement ps = con.prepareStatement(update)) {
                if (adminId == null) ps.setNull(1, Types.INTEGER);
                else ps.setInt(1, adminId);

                if (reason == null || reason.trim().isEmpty()) ps.setNull(2, Types.VARCHAR);
                else ps.setString(2, reason);

                ps.setInt(3, requestId);

                int updated = ps.executeUpdate();
                if (updated == 0) {
                    json(resp, 404, "{\"ok\":false,\"message\":\"Request not found or not pending\"}");
                    return;
                }
            }

            // Send email after DB update
            try {
                if (requestEmail != null && !requestEmail.trim().isEmpty()) {
                    GmailSender.sendRentalCompanyRequestStatusEmail(
                            requestEmail.trim(),
                            requestCompanyName,
                            false,
                            reason
                    );
                }
            } catch (Exception mailEx) {
                mailEx.printStackTrace();
            }

            json(resp, 200, "{\"ok\":true,\"message\":\"Rejected\"}");

        } catch (Exception e) {
            e.printStackTrace();
            json(resp, 500, "{\"ok\":false,\"message\":\"Server error\"}");
        }
    }
}
