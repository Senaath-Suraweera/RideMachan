package admin.service;

import common.util.DBConnection;
import common.util.GmailSender;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.*;

@WebServlet("/api/admin/rental-company-requests/approve")
public class AdminApproveRentalCompanyRequestServlet extends HttpServlet {

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

        Connection con = null;

        String requestEmail = null;
        String requestCompanyName = null;

        try {
            con = DBConnection.getConnection();
            con.setAutoCommit(false);

            String select = "SELECT * FROM RentalCompanyRegistrationRequest WHERE request_id=? AND status='PENDING' FOR UPDATE";

            String insertCompany = "INSERT INTO RentalCompany " +
                    "(companyname, companyemail, phone, registrationnumber, taxid, street, city, certificatepath, taxdocumentpath, description, terms, hashedpassword, salt) " +
                    "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)";

            String updateReq = "UPDATE RentalCompanyRegistrationRequest " +
                    "SET status='APPROVED', reviewed_at=NOW(), reviewed_by_adminid=?, approved_companyid=? " +
                    "WHERE request_id=?";

            int companyId;

            try (PreparedStatement psSel = con.prepareStatement(select)) {
                psSel.setInt(1, requestId);

                try (ResultSet rs = psSel.executeQuery()) {
                    if (!rs.next()) {
                        con.rollback();
                        json(resp, 404, "{\"ok\":false,\"message\":\"Request not found or not pending\"}");
                        return;
                    }

                    // capture for email
                    requestEmail = rs.getString("companyemail");
                    requestCompanyName = rs.getString("companyname");

                    try (PreparedStatement psIns = con.prepareStatement(insertCompany, Statement.RETURN_GENERATED_KEYS)) {
                        psIns.setString(1, rs.getString("companyname"));
                        psIns.setString(2, rs.getString("companyemail"));
                        psIns.setString(3, rs.getString("phone"));
                        psIns.setString(4, rs.getString("registrationnumber"));
                        psIns.setString(5, rs.getString("taxid"));
                        psIns.setString(6, rs.getString("street"));
                        psIns.setString(7, rs.getString("city"));
                        psIns.setString(8, rs.getString("certificatepath"));
                        psIns.setString(9, rs.getString("taxdocumentpath"));
                        psIns.setString(10, rs.getString("description"));
                        psIns.setString(11, rs.getString("terms"));
                        psIns.setString(12, rs.getString("hashedpassword"));
                        psIns.setString(13, rs.getString("salt"));

                        psIns.executeUpdate();

                        try (ResultSet keys = psIns.getGeneratedKeys()) {
                            if (!keys.next()) {
                                con.rollback();
                                json(resp, 500, "{\"ok\":false,\"message\":\"Failed to create company\"}");
                                return;
                            }
                            companyId = keys.getInt(1);
                        }
                    }

                    try (PreparedStatement psUp = con.prepareStatement(updateReq)) {
                        if (adminId == null) psUp.setNull(1, Types.INTEGER);
                        else psUp.setInt(1, adminId);

                        psUp.setInt(2, companyId);
                        psUp.setInt(3, requestId);
                        psUp.executeUpdate();
                    }
                }
            }

            con.commit();

            // Send email AFTER commit (so approval is final even if email fails)
            try {
                if (requestEmail != null && !requestEmail.trim().isEmpty()) {
                    GmailSender.sendRentalCompanyRequestStatusEmail(
                            requestEmail.trim(),
                            requestCompanyName,
                            true,
                            null
                    );
                }
            } catch (Exception mailEx) {
                mailEx.printStackTrace();
            }

            json(resp, 200, "{\"ok\":true,\"message\":\"Approved\",\"companyid\":" + companyId + "}");

        } catch (SQLIntegrityConstraintViolationException dup) {
            try { if (con != null) con.rollback(); } catch (Exception ignore) {}
            json(resp, 409, "{\"ok\":false,\"message\":\"Company email already exists\"}");
        } catch (Exception e) {
            e.printStackTrace();
            try { if (con != null) con.rollback(); } catch (Exception ignore) {}
            json(resp, 500, "{\"ok\":false,\"message\":\"Server error\"}");
        } finally {
            try { if (con != null) con.setAutoCommit(true); } catch (Exception ignore) {}
        }
    }
}
