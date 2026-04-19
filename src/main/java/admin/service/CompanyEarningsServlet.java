// company earnings endpoints can be used by shamla

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
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


@WebServlet("/api/company/earnings/*")
public class CompanyEarningsServlet extends HttpServlet {

    // Fee rules (matches your UI example: 5% platform, 10% company)
    private static final double PLATFORM_FEE_RATE = 0.05;
    private static final double COMPANY_FEE_RATE  = 0.10;

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");

        String path = req.getPathInfo(); // /summary, /monthly, /vehicles, /recent-bookings
        Integer companyId = getCompanyId(req);

        PrintWriter out = resp.getWriter();

        if (companyId == null || companyId <= 0) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.print("{\"error\":\"companyId is required\"}");
            return;
        }

        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"error\":\"DB connection failed\"}");
                return;
            }

            if (path == null || "/summary".equalsIgnoreCase(path)) {
                out.print(getSummary(con, companyId));
                return;
            }

            switch (path.toLowerCase()) {
                case "/monthly":
                    out.print(getMonthly(con, companyId, req.getParameter("period")));
                    break;
                case "/vehicles":
                    out.print(getVehicleEarnings(con, companyId,
                            req.getParameter("sort"),
                            parseIntOrDefault(req.getParameter("limit"), 10)));
                    break;
                case "/recent-bookings":
                    out.print(getRecentBookings(con, companyId,
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

    private Integer getCompanyId(HttpServletRequest req) {
        // 1) Try session (if you store it when company logs in)
        HttpSession session = req.getSession(false);
        if (session != null) {
            Object v = session.getAttribute("companyid");
            if (v instanceof Integer) return (Integer) v;
            if (v != null) {
                try { return Integer.parseInt(String.valueOf(v)); } catch (Exception ignored) {}
            }
        }
        // 2) Fallback to query param
        String param = req.getParameter("companyId");
        if (param == null) return null;
        try { return Integer.parseInt(param); } catch (Exception e) { return null; }
    }

    private String getSummary(Connection con, int companyId) throws SQLException {
        // Total income from PAID bookings (fallback: if payment_status is null, include completed)
        String sqlIncome = "SELECT COALESCE(SUM(total_amount),0) AS totalIncome " +
                "FROM companybookings " +
                "WHERE companyid=? AND (payment_status='PAID' OR status='completed')";

        String sqlBookings = "SELECT COUNT(*) AS totalBookings FROM companybookings WHERE companyid=?";

        double totalIncome;
        int totalBookings;

        try (PreparedStatement ps = con.prepareStatement(sqlIncome)) {
            ps.setInt(1, companyId);
            ResultSet rs = ps.executeQuery();
            rs.next();
            totalIncome = rs.getDouble("totalIncome");
        }

        try (PreparedStatement ps = con.prepareStatement(sqlBookings)) {
            ps.setInt(1, companyId);
            ResultSet rs = ps.executeQuery();
            rs.next();
            totalBookings = rs.getInt("totalBookings");
        }

        // Month-over-month change (current month vs previous month)
        LocalDate now = LocalDate.now();
        LocalDate startThisMonth = now.withDayOfMonth(1);
        LocalDate startPrevMonth = startThisMonth.minusMonths(1);
        LocalDate startPrevPrev  = startThisMonth.minusMonths(2);

        double incomeThisMonth = sumIncomeBetween(con, companyId, startThisMonth, startThisMonth.plusMonths(1));
        double incomePrevMonth = sumIncomeBetween(con, companyId, startPrevMonth, startThisMonth);

        int bookingsThisMonth = countBookingsBetween(con, companyId, startThisMonth, startThisMonth.plusMonths(1));
        int bookingsPrevMonth = countBookingsBetween(con, companyId, startPrevMonth, startThisMonth);

        double incomeChangePct = (incomePrevMonth <= 0.0001) ? (incomeThisMonth > 0 ? 100.0 : 0.0)
                : ((incomeThisMonth - incomePrevMonth) / incomePrevMonth) * 100.0;

        int bookingsChange = bookingsThisMonth - bookingsPrevMonth;

        return "{"
                + "\"companyId\":" + companyId + ","
                + "\"totalIncome\":" + round2(totalIncome) + ","
                + "\"totalBookings\":" + totalBookings + ","
                + "\"incomeChangePct\":" + round1(incomeChangePct) + ","
                + "\"bookingsChange\":" + bookingsChange
                + "}";
    }

    private double sumIncomeBetween(Connection con, int companyId, LocalDate start, LocalDate end) throws SQLException {
        String sql = "SELECT COALESCE(SUM(total_amount),0) AS s " +
                "FROM companybookings " +
                "WHERE companyid=? " +
                "AND (payment_status='PAID' OR status='completed') " +
                "AND trip_start_date >= ? AND trip_start_date < ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            ps.setDate(2, Date.valueOf(start));
            ps.setDate(3, Date.valueOf(end));
            ResultSet rs = ps.executeQuery();
            rs.next();
            return rs.getDouble("s");
        }
    }

    private int countBookingsBetween(Connection con, int companyId, LocalDate start, LocalDate end) throws SQLException {
        String sql = "SELECT COUNT(*) AS c FROM companybookings WHERE companyid=? AND trip_start_date >= ? AND trip_start_date < ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            ps.setDate(2, Date.valueOf(start));
            ps.setDate(3, Date.valueOf(end));
            ResultSet rs = ps.executeQuery();
            rs.next();
            return rs.getInt("c");
        }
    }

    private String getMonthly(Connection con, int companyId, String period) throws SQLException {
        if (period == null || period.isBlank()) period = "12m";

        List<String> labels = new ArrayList<>();
        List<Double> data = new ArrayList<>();

        LocalDate now = LocalDate.now();
        LocalDate start;
        int months;

        switch (period) {
            case "6m":
                months = 6; start = now.withDayOfMonth(1).minusMonths(5); break;
            case "3m":
                months = 3; start = now.withDayOfMonth(1).minusMonths(2); break;
            case "year":
                // 4 quarters in current year
                return getQuarterly(con, companyId, now.getYear());
            case "12m":
            default:
                months = 12; start = now.withDayOfMonth(1).minusMonths(11);
        }

        // Build month buckets in Java (simple + consistent labels)
        Map<String, Double> bucket = new LinkedHashMap<>();
        LocalDate cursor = start;
        for (int i = 0; i < months; i++) {
            String key = cursor.getMonth().name().substring(0, 1) + cursor.getMonth().name().substring(1,3).toLowerCase(); // Jan/Feb...
            bucket.put(key, 0.0);
            cursor = cursor.plusMonths(1);
        }

        String sql = "SELECT trip_start_date, total_amount, payment_status, status " +
                "FROM companybookings " +
                "WHERE companyid=? AND trip_start_date >= ?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            ps.setDate(2, Date.valueOf(start));
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                Date d = rs.getDate("trip_start_date");
                if (d == null) continue;

                String paymentStatus = rs.getString("payment_status");
                String status = rs.getString("status");
                boolean paid = "PAID".equalsIgnoreCase(paymentStatus) || "completed".equalsIgnoreCase(status);

                if (!paid) continue;

                LocalDate ld = d.toLocalDate();
                String key = ld.getMonth().name().substring(0, 1) + ld.getMonth().name().substring(1,3).toLowerCase();

                if (bucket.containsKey(key)) {
                    bucket.put(key, bucket.get(key) + rs.getDouble("total_amount"));
                }
            }
        }

        for (Map.Entry<String, Double> e : bucket.entrySet()) {
            labels.add(e.getKey());
            data.add(round2(e.getValue()));
        }

        return "{"
                + "\"labels\":" + toJsonArray(labels) + ","
                + "\"data\":" + toJsonArrayNumbers(data)
                + "}";
    }

    private String getQuarterly(Connection con, int companyId, int year) throws SQLException {
        double[] q = new double[4];

        String sql = "SELECT trip_start_date, total_amount, payment_status, status " +
                "FROM companybookings WHERE companyid=? AND YEAR(trip_start_date)=?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            ps.setInt(2, year);
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
                q[idx] += rs.getDouble("total_amount");
            }
        }

        List<String> labels = Arrays.asList("Q1", "Q2", "Q3", "Q4");
        List<Double> data = Arrays.asList(round2(q[0]), round2(q[1]), round2(q[2]), round2(q[3]));

        return "{"
                + "\"labels\":" + toJsonArray(labels) + ","
                + "\"data\":" + toJsonArrayNumbers(data)
                + "}";
    }

    private String getVehicleEarnings(Connection con, int companyId, String sort, int limit) throws SQLException {
        if (sort == null || sort.isBlank()) sort = "earnings_desc";
        if (limit <= 0) limit = 10;

        String orderBy;
        switch (sort) {
            case "earnings_asc": orderBy = "totalEarnings ASC"; break;
            case "name_asc": orderBy = "vehicleName ASC"; break;
            case "bookings_desc": orderBy = "bookings DESC"; break;
            case "earnings_desc":
            default: orderBy = "totalEarnings DESC";
        }

        String sql =
                "SELECT v.vehicleid, CONCAT(v.vehiclebrand,' ',v.vehiclemodel) AS vehicleName, " +
                        "       COUNT(cb.booking_id) AS bookings, " +
                        "       COALESCE(SUM(CASE WHEN (cb.payment_status='PAID' OR cb.status='completed') THEN cb.total_amount ELSE 0 END),0) AS totalEarnings " +
                        "FROM vehicle v " +
                        "LEFT JOIN companybookings cb ON cb.vehicleid = v.vehicleid AND cb.companyid=? " +
                        "WHERE v.company_id=? " +
                        "GROUP BY v.vehicleid, vehicleName " +
                        "ORDER BY " + orderBy + " " +
                        "LIMIT ?";

        StringBuilder sb = new StringBuilder();
        sb.append("{\"vehicles\":[");

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            ps.setInt(2, companyId);
            ps.setInt(3, limit);

            ResultSet rs = ps.executeQuery();
            boolean first = true;
            int rank = 1;

            while (rs.next()) {
                if (!first) sb.append(",");
                first = false;

                int vehicleId = rs.getInt("vehicleid");
                String name = rs.getString("vehicleName");
                int bookings = rs.getInt("bookings");
                double earnings = rs.getDouble("totalEarnings");

                // trend is optional; here we set "up" if this month > last month for that vehicle
                String trend = computeVehicleTrend(con, companyId, vehicleId);

                sb.append("{")
                        .append("\"rank\":").append(rank++).append(",")
                        .append("\"vehicleId\":").append(vehicleId).append(",")
                        .append("\"name\":\"").append(escapeJson(name)).append("\",")
                        .append("\"totalEarnings\":").append(round2(earnings)).append(",")
                        .append("\"bookings\":").append(bookings).append(",")
                        .append("\"trend\":\"").append(trend).append("\"")
                        .append("}");
            }
        }

        sb.append("]}");
        return sb.toString();
    }

    private String computeVehicleTrend(Connection con, int companyId, int vehicleId) throws SQLException {
        LocalDate now = LocalDate.now();
        LocalDate startThisMonth = now.withDayOfMonth(1);
        LocalDate startPrevMonth = startThisMonth.minusMonths(1);

        double thisMonth = sumVehicleIncomeBetween(con, companyId, vehicleId, startThisMonth, startThisMonth.plusMonths(1));
        double prevMonth = sumVehicleIncomeBetween(con, companyId, vehicleId, startPrevMonth, startThisMonth);

        if (thisMonth > prevMonth) return "up";
        if (thisMonth < prevMonth) return "down";
        return "flat";
    }

    private double sumVehicleIncomeBetween(Connection con, int companyId, int vehicleId, LocalDate start, LocalDate end) throws SQLException {
        String sql =
                "SELECT COALESCE(SUM(total_amount),0) AS s " +
                        "FROM companybookings " +
                        "WHERE companyid=? AND vehicleid=? " +
                        "AND (payment_status='PAID' OR status='completed') " +
                        "AND trip_start_date >= ? AND trip_start_date < ?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            ps.setInt(2, vehicleId);
            ps.setDate(3, Date.valueOf(start));
            ps.setDate(4, Date.valueOf(end));
            ResultSet rs = ps.executeQuery();
            rs.next();
            return rs.getDouble("s");
        }
    }

    private String getRecentBookings(Connection con, int companyId, int limit) throws SQLException {
        if (limit <= 0) limit = 10;

        String sql =
                "SELECT cb.booking_id, cb.vehicleid, cb.customerid, cb.trip_start_date, cb.trip_end_date, cb.status, cb.total_amount, cb.payment_status, " +
                        "       rc.companyname, " +
                        "       CONCAT(c.firstname,' ',c.lastname) AS customerName, " +
                        "       CONCAT(v.vehiclebrand,' ',v.vehiclemodel) AS vehicleName " +
                        "FROM companybookings cb " +
                        "JOIN rentalcompany rc ON rc.companyid = cb.companyid " +
                        "LEFT JOIN customer c ON c.customerid = cb.customerid " +
                        "LEFT JOIN vehicle v ON v.vehicleid = cb.vehicleid " +
                        "WHERE cb.companyid=? " +
                        "ORDER BY cb.booking_id DESC " +
                        "LIMIT ?";

        StringBuilder sb = new StringBuilder();
        sb.append("{\"bookings\":[");

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            ps.setInt(2, limit);

            ResultSet rs = ps.executeQuery();
            boolean first = true;

            while (rs.next()) {
                if (!first) sb.append(",");
                first = false;

                int bookingId = rs.getInt("booking_id");
                int vehicleId = rs.getInt("vehicleid");
                String vehicleName = rs.getString("vehicleName");
                String companyName = rs.getString("companyname");
                String customerName = rs.getString("customerName");
                String status = rs.getString("status");
                String paymentStatus = rs.getString("payment_status");

                Date sDate = rs.getDate("trip_start_date");
                Date eDate = rs.getDate("trip_end_date");

                int durationDays = 0;
                if (sDate != null && eDate != null) {
                    durationDays = (int) ChronoUnit.DAYS.between(sDate.toLocalDate(), eDate.toLocalDate());
                    if (durationDays <= 0) durationDays = 1;
                }

                double fare = rs.getDouble("total_amount");
                double platformFee = fare * PLATFORM_FEE_RATE;
                double companyFee = fare * COMPANY_FEE_RATE;
                double net = fare - platformFee - companyFee;


                String vehicleCode = "VH" + String.format("%03d", vehicleId);

                sb.append("{")
                        .append("\"bookingId\":").append(bookingId).append(",")
                        .append("\"vehicleId\":").append(vehicleId).append(",")
                        .append("\"vehicleCode\":\"").append(vehicleCode).append("\",")
                        .append("\"vehicleName\":\"").append(escapeJson(nvl(vehicleName))).append("\",")
                        .append("\"companyName\":\"").append(escapeJson(nvl(companyName))).append("\",")
                        .append("\"customerName\":\"").append(escapeJson(nvl(customerName))).append("\",")
                        .append("\"status\":\"").append(escapeJson(nvl(status))).append("\",")
                        .append("\"tripStartDate\":").append(dateOrNull(sDate)).append(",")
                        .append("\"tripEndDate\":").append(dateOrNull(eDate)).append(",")
                        .append("\"durationDays\":").append(durationDays).append(",")
                        .append("\"fareAmount\":").append(round2(fare)).append(",")
                        .append("\"platformFee\":").append(round2(platformFee)).append(",")
                        .append("\"companyFee\":").append(round2(companyFee)).append(",")
                        .append("\"netEarnings\":").append(round2(net)).append(",")
                        .append("\"paymentStatus\":\"").append(escapeJson(nvl(paymentStatus))).append("\"")
                        .append("}");
            }
        }

        sb.append("]}");
        return sb.toString();
    }

    // Helpers
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
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
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
