//package individualprovider.service;
//
//import com.google.gson.Gson;
//import common.util.DBConnection;
//
//import jakarta.servlet.ServletException;
//import jakarta.servlet.annotation.WebServlet;
//import jakarta.servlet.http.HttpServlet;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//
//import java.io.IOException;
//import java.sql.*;
//import java.util.*;
//
//@WebServlet("/api/company/provider-vehicle-requests/*")
//public class CompanyProviderVehicleRequestsServlet extends HttpServlet {
//
//    private final Gson gson = new Gson();
//
//    private void addCors(HttpServletResponse resp) {
//        resp.setHeader("Access-Control-Allow-Origin", "*");
//        resp.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
//        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//        resp.setHeader("Access-Control-Allow-Credentials", "true");
//    }
//
//    @Override
//    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
//        addCors(resp);
//        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
//    }
//
//    private Integer getCompanyIdFromSession(HttpServletRequest req) {
//        try {
//            Object actorType = req.getSession(false) != null ? req.getSession(false).getAttribute("actorType") : null;
//            Object actorId = req.getSession(false) != null ? req.getSession(false).getAttribute("actorId") : null;
//            if (actorType != null && "COMPANY".equalsIgnoreCase(String.valueOf(actorType)) && actorId != null) {
//                return Integer.parseInt(String.valueOf(actorId));
//            }
//        } catch (Exception ignored) {}
//        return null;
//    }
//
//    private static String trimToNull(String s) {
//        if (s == null) return null;
//        s = s.trim();
//        return s.isEmpty() ? null : s;
//    }
//
//    private static String escapeJson(String s) {
//        if (s == null) return "";
//        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
//    }
//
//    private static int parseInt(String s, int def) {
//        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
//    }
//
//    @Override
//    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
//        addCors(resp);
//        resp.setContentType("application/json");
//        resp.setCharacterEncoding("UTF-8");
//
//        Integer companyId = getCompanyIdFromSession(req);
//        if (companyId == null) {
//            resp.setStatus(401);
//            resp.getWriter().write("{\"error\":\"Not logged in as COMPANY\"}");
//            return;
//        }
//
//        String status = trimToNull(req.getParameter("status"));
//        if (status == null) status = "pending";
//
//        try (Connection con = DBConnection.getConnection()) {
//            if (con == null) {
//                resp.setStatus(500);
//                resp.getWriter().write("{\"error\":\"DB connection failed\"}");
//                return;
//            }
//
//            String sql =
//                    "SELECT pr.request_id, pr.provider_id, pr.vehicle_id, pr.company_id, pr.status, pr.message, pr.requested_at, " +
//                            "v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.location, v.price_per_day " +
//                            "FROM ProviderRentalRequests pr " +
//                            "LEFT JOIN Vehicle v ON v.vehicleid = pr.vehicle_id " +
//                            "WHERE pr.company_id = ? AND pr.status = ? " +
//                            "ORDER BY pr.request_id DESC";
//
//            List<Map<String, Object>> rows = new ArrayList<>();
//            try (PreparedStatement ps = con.prepareStatement(sql)) {
//                ps.setInt(1, companyId);
//                ps.setString(2, status);
//                try (ResultSet rs = ps.executeQuery()) {
//                    while (rs.next()) {
//                        Map<String, Object> m = new LinkedHashMap<>();
//                        m.put("request_id", rs.getInt("request_id"));
//                        m.put("provider_id", rs.getInt("provider_id"));
//                        m.put("vehicle_id", rs.getInt("vehicle_id"));
//                        m.put("status", rs.getString("status"));
//                        m.put("message", rs.getString("message"));
//                        m.put("requested_at", rs.getString("requested_at"));
//
//                        m.put("vehiclebrand", rs.getString("vehiclebrand"));
//                        m.put("vehiclemodel", rs.getString("vehiclemodel"));
//                        m.put("numberplatenumber", rs.getString("numberplatenumber"));
//                        m.put("location", rs.getString("location"));
//                        m.put("price_per_day", rs.getBigDecimal("price_per_day"));
//                        rows.add(m);
//                    }
//                }
//            }
//
//            Map<String, Object> out = new LinkedHashMap<>();
//            out.put("count", rows.size());
//            out.put("requests", rows);
//            resp.getWriter().write(gson.toJson(out));
//
//        } catch (SQLException e) {
//            e.printStackTrace();
//            resp.setStatus(500);
//            resp.getWriter().write("{\"error\":\"SQL Error: " + escapeJson(e.getMessage()) + "\"}");
//        }
//    }
//
//    @Override
//    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
//        addCors(resp);
//        resp.setContentType("application/json");
//        resp.setCharacterEncoding("UTF-8");
//
//        Integer companyId = getCompanyIdFromSession(req);
//        if (companyId == null) {
//            resp.setStatus(401);
//            resp.getWriter().write("{\"error\":\"Not logged in as COMPANY\"}");
//            return;
//        }
//
//        String path = req.getPathInfo(); // /{id}/approve or /{id}/reject
//        if (path == null || "/".equals(path)) {
//            resp.setStatus(400);
//            resp.getWriter().write("{\"error\":\"Request id required\"}");
//            return;
//        }
//
//        String[] parts = path.substring(1).split("/");
//        int requestId = parseInt(parts[0], -1);
//        String action = parts.length > 1 ? parts[1] : "";
//
//        if (requestId <= 0 || (!"approve".equalsIgnoreCase(action) && !"reject".equalsIgnoreCase(action))) {
//            resp.setStatus(400);
//            resp.getWriter().write("{\"error\":\"Use /{id}/approve or /{id}/reject\"}");
//            return;
//        }
//
//        try (Connection con = DBConnection.getConnection()) {
//            if (con == null) {
//                resp.setStatus(500);
//                resp.getWriter().write("{\"error\":\"DB connection failed\"}");
//                return;
//            }
//
//            con.setAutoCommit(false);
//
//            // Load request and ensure belongs to this company and pending
//            Integer vehicleId = null;
//            Integer providerId = null;
//
//            String getReq =
//                    "SELECT vehicle_id, provider_id FROM ProviderRentalRequests " +
//                            "WHERE request_id=? AND company_id=? AND status='pending' FOR UPDATE";
//            try (PreparedStatement ps = con.prepareStatement(getReq)) {
//                ps.setInt(1, requestId);
//                ps.setInt(2, companyId);
//                try (ResultSet rs = ps.executeQuery()) {
//                    if (!rs.next()) {
//                        con.rollback();
//                        resp.setStatus(404);
//                        resp.getWriter().write("{\"error\":\"Pending request not found\"}");
//                        return;
//                    }
//                    vehicleId = rs.getInt("vehicle_id");
//                    providerId = rs.getInt("provider_id");
//                }
//            }
//
//            if ("reject".equalsIgnoreCase(action)) {
//                String upd =
//                        "UPDATE ProviderRentalRequests SET status='rejected', responded_at=NOW() " +
//                                "WHERE request_id=? AND company_id=? AND status='pending'";
//                try (PreparedStatement ps = con.prepareStatement(upd)) {
//                    ps.setInt(1, requestId);
//                    ps.setInt(2, companyId);
//                    ps.executeUpdate();
//                }
//                con.commit();
//                resp.getWriter().write("{\"status\":\"success\",\"action\":\"rejected\"}");
//                return;
//            }
//
//            // APPROVE:
//            // 1) Assign vehicle to company (only if still unassigned)
//            String assign =
//                    "UPDATE Vehicle SET company_id=? " +
//                            "WHERE vehicleid=? AND provider_id=? AND (company_id IS NULL OR company_id=0)";
//            int assigned;
//            try (PreparedStatement ps = con.prepareStatement(assign)) {
//                ps.setInt(1, companyId);
//                ps.setInt(2, vehicleId);
//                ps.setInt(3, providerId);
//                assigned = ps.executeUpdate();
//            }
//
//            if (assigned == 0) {
//                con.rollback();
//                resp.setStatus(409);
//                resp.getWriter().write("{\"error\":\"Vehicle is no longer eligible (already assigned or not owned by provider)\"}");
//                return;
//            }
//
//            // 2) Mark request approved
//            String upd =
//                    "UPDATE ProviderRentalRequests SET status='approved', responded_at=NOW() " +
//                            "WHERE request_id=? AND company_id=? AND status='pending'";
//            try (PreparedStatement ps = con.prepareStatement(upd)) {
//                ps.setInt(1, requestId);
//                ps.setInt(2, companyId);
//                ps.executeUpdate();
//            }
//
//            con.commit();
//            resp.getWriter().write("{\"status\":\"success\",\"action\":\"approved\",\"vehicle_id\":" + vehicleId + "}");
//
//        } catch (SQLException e) {
//            e.printStackTrace();
//            resp.setStatus(500);
//            resp.getWriter().write("{\"error\":\"SQL Error: " + escapeJson(e.getMessage()) + "\"}");
//        }
//    }
//}
