package admin.service;

import common.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import java.time.LocalDate;

@WebServlet("/api/admin/dashboard/*")
public class AdminDashboardServlet extends HttpServlet {


    private static final double PLATFORM_FEE_RATE = 0.05;

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        setCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        setCors(resp);

        String path = req.getPathInfo();
        PrintWriter out = resp.getWriter();


        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("actorId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"error\":\"Unauthorized (admin session missing)\"}");
            return;
        }

        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"error\":\"DB connection failed\"}");
                return;
            }

            if (path == null || "/stats".equalsIgnoreCase(path) || "/".equals(path)) {
                out.print(getStats(con));
                return;
            }

            switch (path.toLowerCase()) {

                case "/top-customers":
                    out.print(getTopCustomers(con,
                            parseIntOrDefault(req.getParameter("limit"), 3)));
                    break;

                case "/top-renters":
                    out.print(getTopRenters(con,
                            parseIntOrDefault(req.getParameter("limit"), 3)));
                    break;

                case "/company-locations":
                    out.print(getCompanyLocations(con));
                    break;

                case "/monthly-income":
                    out.print(getMonthlyIncome(con, parseIntOrDefault(req.getParameter("months"), 6)));
                    break;

                default:
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"error\":\"Unknown endpoint\"}");
            }

        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }


    private String getStats(Connection con) throws SQLException {

        LocalDate now = LocalDate.now();
        LocalDate startThisMonth = now.withDayOfMonth(1);
        LocalDate startNextMonth = startThisMonth.plusMonths(1);
        LocalDate startPrevMonth = startThisMonth.minusMonths(1);

        double currentMonthIncome = sumPlatformBetween(con, startThisMonth, startNextMonth);
        double previousMonthIncome = sumPlatformBetween(con, startPrevMonth, startThisMonth);

        double monthChangePct = (previousMonthIncome <= 0.0001)
                ? (currentMonthIncome > 0 ? 100.0 : 0.0)
                : ((currentMonthIncome - previousMonthIncome) / previousMonthIncome) * 100.0;

        int newRentalRequests = countPendingRentalCompanyRequests(con);
        int supportTickets = countSupportTicketsOpenOrInProgress(con);
        int pendingReports = countPendingReports(con);

        return "{"
                + "\"thisMonthIncome\":" + round2(currentMonthIncome) + ","
                + "\"previousMonthIncome\":" + round2(previousMonthIncome) + ","
                + "\"monthChangePct\":" + round1(monthChangePct) + ","
                + "\"newRentalRequests\":" + newRentalRequests + ","
                + "\"supportTickets\":" + supportTickets + ","
                + "\"reports\":" + pendingReports
                + "}";
    }


    private String getTopCustomers(Connection con, int limit) throws SQLException {
        if (limit <= 0) limit = 3;

        String sql =
                "SELECT c.customerid, CONCAT(c.firstname,' ',c.lastname) AS name, " +
                        "       COUNT(cb.booking_id) AS bookings, " +
                        "       COALESCE(SUM(CASE WHEN (cb.payment_status='PAID' OR cb.status='completed') " +
                        "            THEN cb.total_amount ELSE 0 END),0) AS totalSpent " +
                        "FROM customer c " +
                        "LEFT JOIN companybookings cb ON cb.customerid = c.customerid " +
                        "GROUP BY c.customerid, name " +
                        "ORDER BY totalSpent DESC " +
                        "LIMIT ?";

        StringBuilder sb = new StringBuilder();
        sb.append("{\"customers\":[");
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, limit);
            ResultSet rs = ps.executeQuery();
            boolean first = true;
            int rank = 1;

            while (rs.next()) {
                if (!first) sb.append(",");
                first = false;

                sb.append("{")
                        .append("\"rank\":").append(rank++).append(",")
                        .append("\"customerId\":").append(rs.getInt("customerid")).append(",")
                        .append("\"name\":\"").append(escapeJson(nvl(rs.getString("name")))).append("\",")
                        .append("\"bookings\":").append(rs.getInt("bookings")).append(",")
                        .append("\"totalSpent\":").append(round2(rs.getDouble("totalSpent")))
                        .append("}");
            }
        }
        sb.append("]}");
        return sb.toString();
    }


    private String getTopRenters(Connection con, int limit) throws SQLException {
        if (limit <= 0) limit = 3;

        String sql =
                "SELECT rc.companyid, rc.companyname, " +
                        "       COUNT(cb.booking_id) AS bookings, " +
                        "       COALESCE(SUM(CASE WHEN (cb.payment_status='PAID' OR cb.status='completed') " +
                        "            THEN cb.total_amount ELSE 0 END),0) AS totalRevenue " +
                        "FROM rentalcompany rc " +
                        "LEFT JOIN companybookings cb ON cb.companyid = rc.companyid " +
                        "GROUP BY rc.companyid, rc.companyname " +
                        "ORDER BY totalRevenue DESC " +
                        "LIMIT ?";

        StringBuilder sb = new StringBuilder();
        sb.append("{\"renters\":[");
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, limit);
            ResultSet rs = ps.executeQuery();
            boolean first = true;
            int rank = 1;

            while (rs.next()) {
                if (!first) sb.append(",");
                first = false;

                sb.append("{")
                        .append("\"rank\":").append(rank++).append(",")
                        .append("\"companyId\":").append(rs.getInt("companyid")).append(",")
                        .append("\"companyName\":\"").append(escapeJson(nvl(rs.getString("companyname")))).append("\",")
                        .append("\"bookings\":").append(rs.getInt("bookings")).append(",")
                        .append("\"totalRevenue\":").append(round2(rs.getDouble("totalRevenue")))
                        .append("}");
            }
        }
        sb.append("]}");
        return sb.toString();
    }


    private String getCompanyLocations(Connection con) throws SQLException {

        String sqlList =
                "SELECT companyid, companyname, street, city " +
                        "FROM RentalCompany " +
                        "ORDER BY companyname ASC";

        String sqlCityCounts =
                "SELECT city, COUNT(*) AS companyCount " +
                        "FROM RentalCompany " +
                        "GROUP BY city " +
                        "ORDER BY companyCount DESC";

        StringBuilder sb = new StringBuilder();
        sb.append("{");

        // cityCounts
        sb.append("\"cityCounts\":[");
        try (PreparedStatement ps = con.prepareStatement(sqlCityCounts)) {
            ResultSet rs = ps.executeQuery();
            boolean first = true;
            while (rs.next()) {
                if (!first) sb.append(",");
                first = false;

                sb.append("{")
                        .append("\"city\":\"").append(escapeJson(nvl(rs.getString("city")))).append("\",")
                        .append("\"count\":").append(rs.getInt("companyCount"))
                        .append("}");
            }
        }
        sb.append("],");

        // companies
        sb.append("\"companies\":[");
        try (PreparedStatement ps = con.prepareStatement(sqlList)) {
            ResultSet rs = ps.executeQuery();
            boolean first = true;
            while (rs.next()) {
                if (!first) sb.append(",");
                first = false;

                sb.append("{")
                        .append("\"companyId\":").append(rs.getInt("companyid")).append(",")
                        .append("\"companyName\":\"").append(escapeJson(nvl(rs.getString("companyname")))).append("\",")
                        .append("\"street\":\"").append(escapeJson(nvl(rs.getString("street")))).append("\",")
                        .append("\"city\":\"").append(escapeJson(nvl(rs.getString("city")))).append("\"")
                        .append("}");
            }
        }
        sb.append("]");

        sb.append("}");
        return sb.toString();
    }



    private double sumPlatformBetween(Connection con, LocalDate start, LocalDate end) throws SQLException {
        String sql =
                "SELECT COALESCE(SUM(total_amount * ?),0) AS s " +
                        "FROM companybookings " +
                        "WHERE (payment_status='PAID' OR status='completed') " +
                        "AND trip_start_date >= ? AND trip_start_date < ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setDouble(1, PLATFORM_FEE_RATE);
            ps.setDate(2, Date.valueOf(start));
            ps.setDate(3, Date.valueOf(end));
            ResultSet rs = ps.executeQuery();
            rs.next();
            return rs.getDouble("s");
        }
    }

    private int countPendingRentalCompanyRequests(Connection con) throws SQLException {
        String sql = "SELECT COUNT(*) AS c FROM RentalCompanyRegistrationRequest WHERE status='PENDING'";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            rs.next();
            return rs.getInt("c");
        }
    }

    private int countSupportTicketsOpenOrInProgress(Connection con) throws SQLException {
        String sql = "SELECT COUNT(*) AS c FROM SupportTicket WHERE status IN ('Open','In Progress')";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            rs.next();
            return rs.getInt("c");
        }
    }

    private String getMonthlyIncome(Connection con, int months) throws SQLException {
        if (months <= 0) months = 6;
        if (months > 24) months = 24;

        // This returns platform fee totals per month for last N months (including current month)
        String sql =
                "SELECT DATE_FORMAT(trip_start_date, '%Y-%m') AS ym, " +
                        "       COALESCE(SUM(total_amount * ?),0) AS income " +
                        "FROM companybookings " +
                        "WHERE (payment_status='PAID' OR status='completed') " +
                        "  AND trip_start_date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) " +
                        "GROUP BY ym " +
                        "ORDER BY ym ASC";

        // Build a complete list of labels for last N months (fill missing with 0)
        java.time.LocalDate now = java.time.LocalDate.now().withDayOfMonth(1);
        java.util.LinkedHashMap<String, Double> map = new java.util.LinkedHashMap<>();
        for (int i = months - 1; i >= 0; i--) {
            java.time.LocalDate m = now.minusMonths(i);
            String ym = m.getYear() + "-" + String.format("%02d", m.getMonthValue());
            map.put(ym, 0.0);
        }

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setDouble(1, PLATFORM_FEE_RATE);
            ps.setInt(2, months);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                String ym = rs.getString("ym");
                double income = rs.getDouble("income");
                if (map.containsKey(ym)) map.put(ym, round2(income));
            }
        }

        StringBuilder labels = new StringBuilder("[");
        StringBuilder values = new StringBuilder("[");
        boolean first = true;

        for (var e : map.entrySet()) {
            if (!first) { labels.append(","); values.append(","); }
            first = false;
            labels.append("\"").append(escapeJson(e.getKey())).append("\"");
            values.append(e.getValue());
        }
        labels.append("]");
        values.append("]");

        return "{"
                + "\"labels\":" + labels + ","
                + "\"values\":" + values
                + "}";
    }


    private int countPendingReports(Connection con) throws SQLException {
        String sql = "SELECT COUNT(*) AS c FROM Report WHERE status='Pending'";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            rs.next();
            return rs.getInt("c");
        }
    }

    /* ===================== UTIL ===================== */

    private static void setCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private static int parseIntOrDefault(String s, int def) {
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }

    private static String nvl(String s) { return (s == null) ? "" : s; }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
