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
import java.sql.Date;
import java.time.LocalDate;
import java.util.*;

@WebServlet("/api/admin/earnings/*")
public class AdminEarningsServlet extends HttpServlet {

    // Admin/platform fee
    private static final double PLATFORM_FEE_RATE = 0.05;
    // Company fee (kept for breakdown in recent bookings; not needed for admin totals)
    private static final double COMPANY_FEE_RATE  = 0.10;

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

        String path = req.getPathInfo(); // /summary, /monthly, /recent-bookings
        PrintWriter out = resp.getWriter();

        // (Optional) simple admin session check - adjust attribute name if yours differs
        // If you don't want auth here, you can remove this block.
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

            if (path == null || "/summary".equalsIgnoreCase(path)) {
                out.print(getSummary(con));
                return;
            }



            switch (path.toLowerCase()) {
                case "/monthly":
                    out.print(getMonthly(con, req.getParameter("period")));
                    break;

                case "/recent-bookings":
                    out.print(getRecentBookings(con, parseIntOrDefault(req.getParameter("limit"), 10)));
                    break;

                case "/vehicles":
                    out.print(getTopVehicles(con,
                            req.getParameter("sort"),
                            parseIntOrDefault(req.getParameter("limit"), 10)));
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

    // -------------------- SUMMARY (includes current month earnings) --------------------
    private String getSummary(Connection con) throws SQLException {

        double totalPlatformEarnings = sumPlatformAllTime(con);
        int totalBookings = countAllBookings(con);
        int paidBookings  = countPaidBookings(con);

        LocalDate now = LocalDate.now();
        LocalDate startThisMonth = now.withDayOfMonth(1);
        LocalDate startNextMonth = startThisMonth.plusMonths(1);
        LocalDate startPrevMonth = startThisMonth.minusMonths(1);

        double currentMonthEarnings  = sumPlatformBetween(con, startThisMonth, startNextMonth);
        double previousMonthEarnings = sumPlatformBetween(con, startPrevMonth, startThisMonth);

        int currentMonthBookings = countBookingsBetween(con, startThisMonth, startNextMonth);

        double monthChangePct = (previousMonthEarnings <= 0.0001)
                ? (currentMonthEarnings > 0 ? 100.0 : 0.0)
                : ((currentMonthEarnings - previousMonthEarnings) / previousMonthEarnings) * 100.0;

        return "{"
                + "\"totalPlatformEarnings\":" + round2(totalPlatformEarnings) + ","
                + "\"totalBookings\":" + totalBookings + ","
                + "\"paidBookings\":" + paidBookings + ","
                + "\"currentMonthEarnings\":" + round2(currentMonthEarnings) + ","
                + "\"previousMonthEarnings\":" + round2(previousiousSafe(previousMonthEarnings)) + ","
                + "\"monthChangePct\":" + round1(monthChangePct) + ","
                + "\"currentMonthBookings\":" + currentMonthBookings
                + "}";
    }

    private static double previousiousSafe(double v) { return v; } // keeps compile simple

    // -------------------- MONTHLY / QUARTERLY CHART --------------------
    private String getMonthly(Connection con, String period) throws SQLException {
        if (period == null || period.isBlank()) period = "12m";

        LocalDate now = LocalDate.now();

        // quarterly for current year
        if ("year".equalsIgnoreCase(period)) {
            return getQuarterly(con, now.getYear());
        }

        int months;
        LocalDate start;

        switch (period) {
            case "3m":
                months = 3;
                start = now.withDayOfMonth(1).minusMonths(2);
                break;
            case "6m":
                months = 6;
                start = now.withDayOfMonth(1).minusMonths(5);
                break;
            case "12m":
            default:
                months = 12;
                start = now.withDayOfMonth(1).minusMonths(11);
        }

        // month label buckets (Jan/Feb/Mar...)
        Map<String, Double> bucket = new LinkedHashMap<>();
        LocalDate cursor = start;
        for (int i = 0; i < months; i++) {
            String key = cursor.getMonth().name().substring(0, 1)
                    + cursor.getMonth().name().substring(1, 3).toLowerCase();
            bucket.put(key, 0.0);
            cursor = cursor.plusMonths(1);
        }

        String sql =
                "SELECT trip_start_date, total_amount, payment_status, status " +
                        "FROM companybookings " +
                        "WHERE trip_start_date >= ?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setDate(1, Date.valueOf(start));
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                Date d = rs.getDate("trip_start_date");
                if (d == null) continue;

                String paymentStatus = rs.getString("payment_status");
                String status = rs.getString("status");
                boolean paid = "PAID".equalsIgnoreCase(paymentStatus) || "completed".equalsIgnoreCase(status);
                if (!paid) continue;

                LocalDate ld = d.toLocalDate();
                String key = ld.getMonth().name().substring(0, 1)
                        + ld.getMonth().name().substring(1, 3).toLowerCase();

                if (bucket.containsKey(key)) {
                    double platform = rs.getDouble("total_amount") * PLATFORM_FEE_RATE;
                    bucket.put(key, bucket.get(key) + platform);
                }
            }
        }

        List<String> labels = new ArrayList<>(bucket.keySet());
        List<Double> data = new ArrayList<>();
        for (String k : labels) data.add(round2(bucket.get(k)));

        return "{"
                + "\"labels\":" + toJsonArray(labels) + ","
                + "\"data\":" + toJsonArrayNumbers(data)
                + "}";
    }

    private String getQuarterly(Connection con, int year) throws SQLException {
        double[] q = new double[4];

        // MySQL YEAR() used (matches your existing code style)
        String sql =
                "SELECT trip_start_date, total_amount, payment_status, status " +
                        "FROM companybookings " +
                        "WHERE YEAR(trip_start_date)=?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, year);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                Date d = rs.getDate("trip_start_date");
                if (d == null) continue;

                String paymentStatus = rs.getString("payment_status");
                String status = rs.getString("status");
                boolean paid = "PAID".equalsIgnoreCase(paymentStatus) || "completed".equalsIgnoreCase(status);
                if (!paid) continue;

                int month = d.toLocalDate().getMonthValue(); // 1..12
                int idx = (month - 1) / 3; // 0..3

                q[idx] += rs.getDouble("total_amount") * PLATFORM_FEE_RATE;
            }
        }

        List<String> labels = Arrays.asList("Q1", "Q2", "Q3", "Q4");
        List<Double> data = Arrays.asList(round2(q[0]), round2(q[1]), round2(q[2]), round2(q[3]));

        return "{"
                + "\"labels\":" + toJsonArray(labels) + ","
                + "\"data\":" + toJsonArrayNumbers(data)
                + "}";
    }

    // -------------------- RECENT BOOKINGS (admin view) --------------------
    private String getRecentBookings(Connection con, int limit) throws SQLException {
        if (limit <= 0) limit = 10;

        String sql =
                "SELECT cb.booking_id, cb.vehicleid, cb.customerid, cb.companyid, cb.trip_start_date, cb.trip_end_date, " +
                        "       cb.status, cb.total_amount, cb.payment_status, " +
                        "       rc.companyname, " +
                        "       CONCAT(c.firstname,' ',c.lastname) AS customerName, " +
                        "       CONCAT(v.vehiclebrand,' ',v.vehiclemodel) AS vehicleName " +
                        "FROM companybookings cb " +
                        "LEFT JOIN rentalcompany rc ON rc.companyid = cb.companyid " +
                        "LEFT JOIN customer c ON c.customerid = cb.customerid " +
                        "LEFT JOIN vehicle v ON v.vehicleid = cb.vehicleid " +
                        "ORDER BY cb.booking_id DESC " +
                        "LIMIT ?";

        StringBuilder sb = new StringBuilder();
        sb.append("{\"bookings\":[");

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, limit);
            ResultSet rs = ps.executeQuery();

            boolean first = true;
            while (rs.next()) {
                if (!first) sb.append(",");
                first = false;

                int bookingId = rs.getInt("booking_id");
                int vehicleId = rs.getInt("vehicleid");
                int companyId = rs.getInt("companyid");

                String vehicleName = rs.getString("vehicleName");
                String companyName = rs.getString("companyname");
                String customerName = rs.getString("customerName");
                String status = rs.getString("status");
                String paymentStatus = rs.getString("payment_status");

                Date sDate = rs.getDate("trip_start_date");
                Date eDate = rs.getDate("trip_end_date");

                double fare = rs.getDouble("total_amount");

                double platformFee = fare * PLATFORM_FEE_RATE; // admin earnings per booking
                double companyFee  = fare * COMPANY_FEE_RATE;
                double netToCompany = fare - platformFee - companyFee;

                sb.append("{")
                        .append("\"bookingId\":").append(bookingId).append(",")
                        .append("\"companyId\":").append(companyId).append(",")
                        .append("\"vehicleId\":").append(vehicleId).append(",")
                        .append("\"vehicleName\":\"").append(escapeJson(nvl(vehicleName))).append("\",")
                        .append("\"companyName\":\"").append(escapeJson(nvl(companyName))).append("\",")
                        .append("\"customerName\":\"").append(escapeJson(nvl(customerName))).append("\",")
                        .append("\"status\":\"").append(escapeJson(nvl(status))).append("\",")
                        .append("\"paymentStatus\":\"").append(escapeJson(nvl(paymentStatus))).append("\",")
                        .append("\"tripStartDate\":").append(dateOrNull(sDate)).append(",")
                        .append("\"tripEndDate\":").append(dateOrNull(eDate)).append(",")
                        .append("\"fareAmount\":").append(round2(fare)).append(",")
                        .append("\"platformFee\":").append(round2(platformFee)).append(",")
                        .append("\"companyFee\":").append(round2(companyFee)).append(",")
                        .append("\"netToCompany\":").append(round2(netToCompany))
                        .append("}");
            }
        }

        sb.append("]}");
        return sb.toString();
    }

    private String getTopVehicles(Connection con, String sort, int limit) throws SQLException {
        if (sort == null || sort.isBlank()) sort = "earnings_desc";
        if (limit <= 0) limit = 10;

        String orderBy;
        switch (sort) {
            case "earnings_asc":  orderBy = "platformEarnings ASC"; break;
            case "name_asc":      orderBy = "vehicleName ASC"; break;
            case "bookings_desc": orderBy = "bookings DESC"; break;
            case "earnings_desc":
            default:              orderBy = "platformEarnings DESC";
        }

        // Admin view: platform earnings across ALL bookings (paid/completed)
        String sql =
                "SELECT v.vehicleid, CONCAT(v.vehiclebrand,' ',v.vehiclemodel) AS vehicleName, " +
                        "       COUNT(cb.booking_id) AS bookings, " +
                        "       COALESCE(SUM(CASE WHEN (cb.payment_status='PAID' OR cb.status='completed') " +
                        "            THEN cb.total_amount * ? ELSE 0 END),0) AS platformEarnings " +
                        "FROM vehicle v " +
                        "LEFT JOIN companybookings cb ON cb.vehicleid = v.vehicleid " +
                        "GROUP BY v.vehicleid, vehicleName " +
                        "ORDER BY " + orderBy + " " +
                        "LIMIT ?";

        StringBuilder sb = new StringBuilder();
        sb.append("{\"vehicles\":[");

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setDouble(1, PLATFORM_FEE_RATE);
            ps.setInt(2, limit);

            ResultSet rs = ps.executeQuery();
            boolean first = true;
            int rank = 1;

            while (rs.next()) {
                if (!first) sb.append(",");
                first = false;

                sb.append("{")
                        .append("\"rank\":").append(rank++).append(",")
                        .append("\"vehicleId\":").append(rs.getInt("vehicleid")).append(",")
                        .append("\"name\":\"").append(escapeJson(rs.getString("vehicleName"))).append("\",")
                        .append("\"platformEarnings\":").append(round2(rs.getDouble("platformEarnings"))).append(",")
                        .append("\"bookings\":").append(rs.getInt("bookings"))
                        .append("}");
            }
        }

        sb.append("]}");
        return sb.toString();
    }


    // -------------------- DB HELPERS --------------------
    private double sumPlatformAllTime(Connection con) throws SQLException {
        String sql =
                "SELECT COALESCE(SUM(total_amount * ?),0) AS s " +
                        "FROM companybookings " +
                        "WHERE (payment_status='PAID' OR status='completed')";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setDouble(1, PLATFORM_FEE_RATE);
            ResultSet rs = ps.executeQuery();
            rs.next();
            return rs.getDouble("s");
        }
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

    private int countAllBookings(Connection con) throws SQLException {
        String sql = "SELECT COUNT(*) AS c FROM companybookings";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            rs.next();
            return rs.getInt("c");
        }
    }

    private int countPaidBookings(Connection con) throws SQLException {
        String sql =
                "SELECT COUNT(*) AS c FROM companybookings " +
                        "WHERE (payment_status='PAID' OR status='completed')";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ResultSet rs = ps.executeQuery();
            rs.next();
            return rs.getInt("c");
        }
    }

    private int countBookingsBetween(Connection con, LocalDate start, LocalDate end) throws SQLException {
        String sql =
                "SELECT COUNT(*) AS c FROM companybookings " +
                        "WHERE trip_start_date >= ? AND trip_start_date < ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setDate(1, Date.valueOf(start));
            ps.setDate(2, Date.valueOf(end));
            ResultSet rs = ps.executeQuery();
            rs.next();
            return rs.getInt("c");
        }
    }

    // -------------------- UTIL --------------------
    private static void setCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private static int parseIntOrDefault(String s, int def) {
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }

    private static String nvl(String s) { return (s == null) ? "" : s; }

    private static String dateOrNull(Date d) {
        if (d == null) return "null";
        return "\"" + d.toString() + "\"";
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private static String toJsonArray(List<String> items) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(escapeJson(items.get(i))).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }

    private static String toJsonArrayNumbers(List<Double> items) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < items.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append(round2(items.get(i)));
        }
        sb.append("]");
        return sb.toString();
    }

    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
