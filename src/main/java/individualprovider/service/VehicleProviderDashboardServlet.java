package individualprovider.service;

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
import java.time.LocalDateTime;
import java.util.Locale;

@WebServlet("/api/provider/dashboard/*")
public class VehicleProviderDashboardServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        addCors(resp);

        String path = req.getPathInfo();
        PrintWriter out = resp.getWriter();

        Integer providerId = resolveProviderId(req);
        if (providerId == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"error\":\"Unauthorized (provider session missing) or providerId not provided\"}");
            return;
        }

        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.print("{\"error\":\"DB connection failed\"}");
                return;
            }

            if (path == null || "/".equals(path) || "/summary".equalsIgnoreCase(path)) {
                out.print(getSummary(con, providerId));
                return;
            }

            switch (path.toLowerCase(Locale.ROOT)) {

                case "/monthly-income":
                    out.print(getMonthlyIncome(con, providerId, parseIntOrDefault(req.getParameter("months"), 12)));
                    break;

                case "/sessions":
                    out.print(getSessionsByLocation(con, providerId, parseIntOrDefault(req.getParameter("limit"), 8)));
                    break;

                case "/vehicles/maintenance":
                    out.print(getVehiclesUnderMaintenance(con, providerId, parseIntOrDefault(req.getParameter("limit"), 6)));
                    break;

                case "/vehicles/available":
                    out.print(getAvailableVehicles(con, providerId, parseIntOrDefault(req.getParameter("limit"), 6)));
                    break;

                default:
                    resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                    out.print("{\"error\":\"Unknown endpoint\"}");
            }

        } catch (SQLException e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"SQL Error: " + escapeJson(e.getMessage()) + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"error\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }

    // =========================
    // AUTH / PROVIDER ID RESOLVE (UNCHANGED)
    // =========================
    private Integer resolveProviderId(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session != null) {
            Object actorType = session.getAttribute("actorType");
            Object actorId = session.getAttribute("actorId");

            if (actorId != null && actorType != null && "PROVIDER".equalsIgnoreCase(actorType.toString())) {
                try {
                    return Integer.parseInt(actorId.toString());
                } catch (NumberFormatException ignored) {}
            }
        }

        String pid = req.getParameter("providerId");
        if (pid != null && !pid.trim().isEmpty()) {
            try { return Integer.parseInt(pid.trim()); } catch (NumberFormatException ignored) {}
        }
        return null;
    }

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    // =========================
    // 1) SUMMARY
    // FIX: Vehicle table name -> Vehicle (capital V)
    // =========================
    private String getSummary(Connection con, int providerId) throws SQLException {

        String totalsSql =
                "SELECT " +
                        "  COUNT(cb.booking_id) AS totalBookings, " +
                        "  COALESCE(SUM(CASE WHEN cb.payment_status='PAID' OR LOWER(cb.status)='completed' THEN cb.total_amount ELSE 0 END),0) AS totalIncome, " +
                        "  COALESCE(SUM(CASE WHEN cb.payment_status IN ('PENDING','UNPAID') THEN cb.total_amount ELSE 0 END),0) AS pendingPayout " +
                        "FROM companybookings cb " +
                        "JOIN Vehicle v ON v.vehicleid = cb.vehicleid " +
                        "WHERE v.provider_id = ?";

        int totalBookings = 0;
        double totalIncome = 0;
        double pendingPayout = 0;

        try (PreparedStatement ps = con.prepareStatement(totalsSql)) {
            ps.setInt(1, providerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    totalBookings = rs.getInt("totalBookings");
                    totalIncome = rs.getDouble("totalIncome");
                    pendingPayout = rs.getDouble("pendingPayout");
                }
            }
        }

        String acceptanceSql =
                "SELECT " +
                        "  SUM(CASE WHEN LOWER(cb.status) IN ('accepted','confirmed','ongoing','completed') THEN 1 ELSE 0 END) AS acceptedCount, " +
                        "  COUNT(*) AS totalCount " +
                        "FROM companybookings cb " +
                        "JOIN Vehicle v ON v.vehicleid = cb.vehicleid " +
                        "WHERE v.provider_id = ?";

        int acceptedCount = 0;
        int totalCount = 0;

        try (PreparedStatement ps = con.prepareStatement(acceptanceSql)) {
            ps.setInt(1, providerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    acceptedCount = rs.getInt("acceptedCount");
                    totalCount = rs.getInt("totalCount");
                }
            }
        }

        double acceptanceRate = (totalCount <= 0) ? 0.0 : ((acceptedCount * 100.0) / totalCount);

        LocalDate now = LocalDate.now();
        LocalDate startThisMonth = now.withDayOfMonth(1);
        LocalDate startNextMonth = startThisMonth.plusMonths(1);
        LocalDate startPrevMonth = startThisMonth.minusMonths(1);

        double thisMonth = sumIncomeBetween(con, providerId, startThisMonth, startNextMonth);
        double prevMonth = sumIncomeBetween(con, providerId, startPrevMonth, startThisMonth);

        double incomeChangePct = (prevMonth <= 0.0001)
                ? (thisMonth > 0 ? 100.0 : 0.0)
                : ((thisMonth - prevMonth) / prevMonth) * 100.0;

        return "{"
                + "\"providerId\":" + providerId + ","
                + "\"totalIncome\":" + round2(totalIncome) + ","
                + "\"acceptanceRate\":" + round1(acceptanceRate) + ","
                + "\"totalBookings\":" + totalBookings + ","
                + "\"pendingPayout\":" + round2(pendingPayout) + ","
                + "\"incomeChangePct\":" + round1(incomeChangePct)
                + "}";
    }

    private double sumIncomeBetween(Connection con, int providerId, LocalDate start, LocalDate end) throws SQLException {
        String sql =
                "SELECT COALESCE(SUM(CASE WHEN cb.payment_status='PAID' OR LOWER(cb.status)='completed' THEN cb.total_amount ELSE 0 END),0) AS income " +
                        "FROM companybookings cb " +
                        "JOIN Vehicle v ON v.vehicleid = cb.vehicleid " +
                        "WHERE v.provider_id = ? " +
                        "AND COALESCE(cb.booked_Date, cb.trip_start_date) >= ? " +
                        "AND COALESCE(cb.booked_Date, cb.trip_start_date) < ?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);
            ps.setDate(2, Date.valueOf(start));
            ps.setDate(3, Date.valueOf(end));
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getDouble("income");
            }
        }
        return 0.0;
    }

    // =========================
    // 2) MONTHLY INCOME
    // FIX: Vehicle table name -> Vehicle
    // =========================
    private String getMonthlyIncome(Connection con, int providerId, int months) throws SQLException {
        if (months <= 0) months = 12;
        if (months > 24) months = 24;

        String sql =
                "SELECT " +
                        "  YEAR(COALESCE(cb.booked_Date, cb.trip_start_date)) AS yy, " +
                        "  MONTH(COALESCE(cb.booked_Date, cb.trip_start_date)) AS mm, " +
                        "  COALESCE(SUM(CASE WHEN cb.payment_status='PAID' OR LOWER(cb.status)='completed' THEN cb.total_amount ELSE 0 END),0) AS income " +
                        "FROM companybookings cb " +
                        "JOIN Vehicle v ON v.vehicleid = cb.vehicleid " +
                        "WHERE v.provider_id = ? " +
                        "  AND COALESCE(cb.booked_Date, cb.trip_start_date) >= (CURDATE() - INTERVAL ? MONTH) " +
                        "GROUP BY yy, mm " +
                        "ORDER BY yy, mm";

        StringBuilder sb = new StringBuilder();
        sb.append("{\"months\":").append(months).append(",\"points\":[");

        boolean first = true;
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);
            ps.setInt(2, months - 1);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    if (!first) sb.append(",");
                    first = false;

                    int yy = rs.getInt("yy");
                    int mm = rs.getInt("mm");
                    double income = rs.getDouble("income");

                    sb.append("{")
                            .append("\"year\":").append(yy).append(",")
                            .append("\"month\":").append(mm).append(",")
                            .append("\"label\":\"").append(monthShort(mm)).append("\",")
                            .append("\"income\":").append(round2(income))
                            .append("}");
                }
            }
        }

        sb.append("]}");
        return sb.toString();
    }

    // =========================
    // 3) SESSIONS BY LOCATION
    // FIX: Vehicle table name -> Vehicle
    // =========================
    private String getSessionsByLocation(Connection con, int providerId, int limit) throws SQLException {
        if (limit <= 0) limit = 8;

        String sql =
                "SELECT v.location AS location, COUNT(cb.booking_id) AS sessions " +
                        "FROM companybookings cb " +
                        "JOIN Vehicle v ON v.vehicleid = cb.vehicleid " +
                        "WHERE v.provider_id = ? " +
                        "GROUP BY v.location " +
                        "ORDER BY sessions DESC " +
                        "LIMIT ?";

        String totalSql =
                "SELECT COUNT(cb.booking_id) AS totalSessions " +
                        "FROM companybookings cb " +
                        "JOIN Vehicle v ON v.vehicleid = cb.vehicleid " +
                        "WHERE v.provider_id = ?";

        int totalSessions = 0;
        try (PreparedStatement ps = con.prepareStatement(totalSql)) {
            ps.setInt(1, providerId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) totalSessions = rs.getInt("totalSessions");
            }
        }

        StringBuilder sb = new StringBuilder();
        sb.append("{\"totalSessions\":").append(totalSessions).append(",\"locations\":[");

        boolean first = true;
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    if (!first) sb.append(",");
                    first = false;

                    sb.append("{")
                            .append("\"location\":\"").append(escapeJson(nvl(rs.getString("location"), "Unknown"))).append("\",")
                            .append("\"sessions\":").append(rs.getInt("sessions"))
                            .append("}");
                }
            }
        }

        sb.append("]}");
        return sb.toString();
    }

    // =========================
    // 4) VEHICLES UNDER MAINTENANCE
    // Uses Vehicle.availability_status directly — simpler than joining CalendarEvents.
    // Accepts any common spelling: 'maintenance', 'under_maintenance', 'under maintenance'.
    // =========================
    private String getVehiclesUnderMaintenance(Connection con, int providerId, int limit) throws SQLException {
        if (limit <= 0) limit = 6;

        String sql =
                "SELECT vehicleid, vehiclebrand, vehiclemodel, numberplatenumber, availability_status, location " +
                        "FROM Vehicle " +
                        "WHERE provider_id = ? " +
                        "  AND LOWER(REPLACE(REPLACE(availability_status,'_',' '),'-',' ')) " +
                        "      IN ('maintenance','under maintenance','in maintenance','servicing') " +
                        "ORDER BY vehicleid DESC " +
                        "LIMIT ?";

        StringBuilder sb = new StringBuilder();
        sb.append("{\"vehicles\":[");

        boolean first = true;
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    if (!first) sb.append(",");
                    first = false;

                    String name = nvl(rs.getString("vehiclebrand")) + " " + nvl(rs.getString("vehiclemodel"));
                    String status = nvl(rs.getString("availability_status"), "Maintenance");

                    sb.append("{")
                            .append("\"vehicleId\":").append(rs.getInt("vehicleid")).append(",")
                            .append("\"name\":\"").append(escapeJson(name.trim())).append("\",")
                            .append("\"plate\":\"").append(escapeJson(nvl(rs.getString("numberplatenumber")))).append("\",")
                            .append("\"location\":\"").append(escapeJson(nvl(rs.getString("location"), ""))).append("\",")
                            .append("\"serviceType\":\"Maintenance\",")
                            .append("\"status\":\"").append(escapeJson(status)).append("\"")
                            .append("}");
                }
            }
        }

        sb.append("]}");
        return sb.toString();
    }

    // =========================
    // 5) AVAILABLE VEHICLES
    // FIX: Vehicle table name -> Vehicle
    // =========================
    private String getAvailableVehicles(Connection con, int providerId, int limit) throws SQLException {
        if (limit <= 0) limit = 6;

        String sql =
                "SELECT vehicleid, vehiclebrand, vehiclemodel, numberplatenumber, location, price_per_day, availability_status " +
                        "FROM Vehicle " +
                        "WHERE provider_id = ? " +
                        "  AND (availability_status IS NULL OR LOWER(availability_status)='available') " +
                        "ORDER BY vehicleid DESC " +
                        "LIMIT ?";

        StringBuilder sb = new StringBuilder();
        sb.append("{\"vehicles\":[");

        boolean first = true;
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, providerId);
            ps.setInt(2, limit);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    if (!first) sb.append(",");
                    first = false;

                    String name = nvl(rs.getString("vehiclebrand")) + " " + nvl(rs.getString("vehiclemodel"));

                    sb.append("{")
                            .append("\"vehicleId\":").append(rs.getInt("vehicleid")).append(",")
                            .append("\"name\":\"").append(escapeJson(name.trim())).append("\",")
                            .append("\"plate\":\"").append(escapeJson(nvl(rs.getString("numberplatenumber")))).append("\",")
                            .append("\"location\":\"").append(escapeJson(nvl(rs.getString("location"), "Unknown"))).append("\",")
                            .append("\"pricePerDay\":").append(round2(rs.getDouble("price_per_day"))).append(",")
                            .append("\"availabilityStatus\":\"").append(escapeJson(nvl(rs.getString("availability_status"), "available"))).append("\"")
                            .append("}");
                }
            }
        }

        sb.append("]}");
        return sb.toString();
    }

    // =========================
    // helpers
    // =========================
    private static String monthShort(int m) {
        String[] arr = {"Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"};
        if (m < 1 || m > 12) return "NA";
        return arr[m - 1];
    }

    private static int parseIntOrDefault(String s, int def) {
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }

    private static String nvl(String s) { return (s == null) ? "" : s; }
    private static String nvl(String s, String fallback) { return (s == null || s.isEmpty()) ? fallback : s; }

    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}