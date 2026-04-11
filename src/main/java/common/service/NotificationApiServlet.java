package common.service;

import common.util.DBConnection;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;

/**
 * Universal Notification REST API.
 *
 * Mount this servlet at /api/notifications/* in your web.xml or via annotation.
 * Every user type (Customer, Driver, Company, Admin, Maintenance, Provider)
 * hits the SAME endpoint — identity comes from the HTTP session.
 *
 * ───────────────────────────────────────────────────────────────
 *  SESSION CONTRACT
 *  Your login servlets must set these two session attributes:
 *      session.setAttribute("actorType", "CUSTOMER");   // or DRIVER, COMPANY, ADMIN, etc.
 *      session.setAttribute("actorId",   42);            // PK in that user's table
 * ───────────────────────────────────────────────────────────────
 *
 *  GET  /api/notifications                     → list (paginated)
 *  GET  /api/notifications/count               → unread count
 *  POST /api/notifications/read?id=3           → mark one as read
 *  POST /api/notifications/readAll             → mark all as read
 *  POST /api/notifications/send                → (admin only) send a custom notification
 */
@WebServlet("/api/notifications/*")
public class NotificationApiServlet extends HttpServlet {

    // ── JSON escape ──
    private String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    // ── Auth helper ── returns {actorId} and sets _actorType on request
    private int[] auth(HttpServletRequest req, HttpServletResponse resp, PrintWriter out) {
        HttpSession session = req.getSession(false);
        if (session == null) {
            resp.setStatus(401);
            out.print("{\"ok\":false,\"error\":\"Not logged in\"}");
            return null;
        }
        String actorType = (String) session.getAttribute("actorType");
        Integer actorId  = (Integer) session.getAttribute("actorId");
        if (actorType == null || actorId == null) {
            resp.setStatus(401);
            out.print("{\"ok\":false,\"error\":\"Not logged in\"}");
            return null;
        }
        req.setAttribute("_actorType", actorType.toUpperCase());
        return new int[]{ actorId };
    }

    // ────────────────────────── GET ──────────────────────────

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        int[] actor = auth(req, resp, out);
        if (actor == null) return;
        String actorType = (String) req.getAttribute("_actorType");
        int actorId = actor[0];

        String path = req.getPathInfo();
        if (path == null) path = "";

        // ── GET /api/notifications ──
        if (path.isEmpty() || "/".equals(path)) {
            int limit  = intParam(req, "limit", 20);
            int offset = intParam(req, "offset", 0);
            String typeFilter = req.getParameter("type"); // optional: BOOKING, TICKET, etc.

            try (Connection con = DBConnection.getConnection()) {
                String sql;
                if (typeFilter != null && !typeFilter.isEmpty()) {
                    sql = "SELECT * FROM Notification WHERE recipient_type=? AND recipient_id=? AND type=? "
                            + "ORDER BY created_at DESC LIMIT ? OFFSET ?";
                } else {
                    sql = "SELECT * FROM Notification WHERE recipient_type=? AND recipient_id=? "
                            + "ORDER BY created_at DESC LIMIT ? OFFSET ?";
                }

                PreparedStatement ps = con.prepareStatement(sql);
                int idx = 1;
                ps.setString(idx++, actorType);
                ps.setInt(idx++, actorId);
                if (typeFilter != null && !typeFilter.isEmpty()) {
                    ps.setString(idx++, typeFilter.toUpperCase());
                }
                ps.setInt(idx++, limit);
                ps.setInt(idx, offset);

                ResultSet rs = ps.executeQuery();
                StringBuilder sb = new StringBuilder("{\"ok\":true,\"notifications\":[");
                boolean first = true;
                while (rs.next()) {
                    if (!first) sb.append(",");
                    first = false;
                    sb.append("{")
                            .append("\"notificationId\":").append(rs.getInt("notification_id")).append(",")
                            .append("\"type\":\"").append(esc(rs.getString("type"))).append("\",")
                            .append("\"title\":\"").append(esc(rs.getString("title"))).append("\",")
                            .append("\"body\":\"").append(esc(rs.getString("body"))).append("\",")
                            .append("\"referenceType\":\"").append(esc(rs.getString("reference_type"))).append("\",")
                            .append("\"referenceId\":").append(rs.getInt("reference_id")).append(",")
                            .append("\"isRead\":").append(rs.getBoolean("is_read")).append(",")
                            .append("\"createdAt\":\"").append(esc(String.valueOf(rs.getTimestamp("created_at")))).append("\"")
                            .append("}");
                }
                sb.append("]}");
                out.print(sb);
            } catch (Exception e) {
                e.printStackTrace();
                resp.setStatus(500);
                out.print("{\"ok\":false,\"error\":\"Internal error\"}");
            }
            return;
        }

        // ── GET /api/notifications/count ──
        if ("/count".equals(path)) {
            try (Connection con = DBConnection.getConnection();
                 PreparedStatement ps = con.prepareStatement(
                         "SELECT COUNT(*) FROM Notification WHERE recipient_type=? AND recipient_id=? AND is_read=FALSE")) {
                ps.setString(1, actorType);
                ps.setInt(2, actorId);
                ResultSet rs = ps.executeQuery();
                int count = rs.next() ? rs.getInt(1) : 0;
                out.print("{\"ok\":true,\"count\":" + count + "}");
            } catch (Exception e) {
                e.printStackTrace();
                resp.setStatus(500);
                out.print("{\"ok\":false,\"error\":\"Internal error\"}");
            }
            return;
        }

        out.print("{\"ok\":false,\"error\":\"Unknown endpoint\"}");
    }

    // ────────────────────────── POST ─────────────────────────

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        int[] actor = auth(req, resp, out);
        if (actor == null) return;
        String actorType = (String) req.getAttribute("_actorType");
        int actorId = actor[0];

        String path = req.getPathInfo();
        if (path == null) path = "";

        // ── POST /api/notifications/read?id=3 ──
        if ("/read".equals(path)) {
            int notifId = intParam(req, "id", -1);
            if (notifId < 0) {
                resp.setStatus(400);
                out.print("{\"ok\":false,\"error\":\"id required\"}");
                return;
            }
            try (Connection con = DBConnection.getConnection();
                 PreparedStatement ps = con.prepareStatement(
                         "UPDATE Notification SET is_read=TRUE WHERE notification_id=? AND recipient_type=? AND recipient_id=?")) {
                ps.setInt(1, notifId);
                ps.setString(2, actorType);
                ps.setInt(3, actorId);
                out.print("{\"ok\":" + (ps.executeUpdate() > 0) + "}");
            } catch (Exception e) {
                e.printStackTrace();
                resp.setStatus(500);
                out.print("{\"ok\":false,\"error\":\"Internal error\"}");
            }
            return;
        }

        // ── POST /api/notifications/readAll ──
        if ("/readAll".equals(path)) {
            try (Connection con = DBConnection.getConnection();
                 PreparedStatement ps = con.prepareStatement(
                         "UPDATE Notification SET is_read=TRUE WHERE recipient_type=? AND recipient_id=? AND is_read=FALSE")) {
                ps.setString(1, actorType);
                ps.setInt(2, actorId);
                ps.executeUpdate();
                out.print("{\"ok\":true}");
            } catch (Exception e) {
                e.printStackTrace();
                resp.setStatus(500);
                out.print("{\"ok\":false,\"error\":\"Internal error\"}");
            }
            return;
        }

        // ── POST /api/notifications/send  (Admin only – send custom notification) ──
        if ("/send".equals(path)) {
            if (!"ADMIN".equals(actorType)) {
                resp.setStatus(403);
                out.print("{\"ok\":false,\"error\":\"Admin only\"}");
                return;
            }
            String toType = req.getParameter("recipientType");
            int toId      = intParam(req, "recipientId", -1);
            String type   = req.getParameter("type");
            String title  = req.getParameter("title");
            String body   = req.getParameter("body");

            if (toType == null || toId < 0 || title == null) {
                resp.setStatus(400);
                out.print("{\"ok\":false,\"error\":\"recipientType, recipientId, title required\"}");
                return;
            }
            if (type == null || type.isEmpty()) type = "GENERAL";

            NotificationService.notify(toType, toId, type, title,
                    body != null ? body : "", "ADMIN_MESSAGE", actorId);
            out.print("{\"ok\":true}");
            return;
        }

        out.print("{\"ok\":false,\"error\":\"Unknown endpoint\"}");
    }

    // ── Utility ──
    private int intParam(HttpServletRequest req, String name, int def) {
        String v = req.getParameter(name);
        if (v == null || v.isEmpty()) return def;
        try { return Integer.parseInt(v); } catch (NumberFormatException e) { return def; }
    }
}