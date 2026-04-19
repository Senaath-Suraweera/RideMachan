package individualprovider.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import common.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.*;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;

@WebServlet("/api/provider/earnings/*")
public class ProviderEarningsServlet extends HttpServlet {

    private final Gson gson = new Gson();

    // Fees shown in UI (since DB has only total_amount)
    private static final double PLATFORM_FEE_RATE = 0.05; // 5%
    private static final double COMPANY_FEE_RATE  = 0.10; // 10%

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    private Integer getProviderId(HttpServletRequest req) {
        HttpSession session = req.getSession(false);
        if (session == null) return null;

        Object pid = session.getAttribute("providerId");
        if (pid instanceof Integer) return (Integer) pid;

        // fallback pattern used in multi-actor apps
        Object actorType = session.getAttribute("actorType");
        Object actorId = session.getAttribute("actorId");
        if (actorType != null && actorId != null && "PROVIDER".equalsIgnoreCase(actorType.toString())) {
            try { return Integer.parseInt(actorId.toString()); } catch (Exception ignored) {}
        }

        return null;
    }

    private int intParam(HttpServletRequest req, String key, int def) {
        try {
            String v = req.getParameter(key);
            if (v == null) return def;
            return Integer.parseInt(v.trim());
        } catch (Exception e) {
            return def;
        }
    }

    private String path(HttpServletRequest req) {
        String p = req.getPathInfo();
        return (p == null) ? "/" : p;
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer providerId = getProviderId(req);
        if (providerId == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            JsonObject out = new JsonObject();
            out.addProperty("error", "Unauthorized: provider session not found.");
            resp.getWriter().write(gson.toJson(out));
            return;
        }

        String p = path(req);

        try {
            if ("/summary".equalsIgnoreCase(p)) {
                resp.getWriter().write(gson.toJson(getSummary(providerId)));
                return;
            }

            if ("/monthly".equalsIgnoreCase(p)) {
                int months = intParam(req, "months", 12); // 12/6/3 etc
                resp.getWriter().write(gson.toJson(getMonthly(providerId, months)));
                return;
            }

            if ("/vehicles".equalsIgnoreCase(p)) {
                int limit = intParam(req, "limit", 10);
                resp.getWriter().write(gson.toJson(getVehicleEarnings(providerId, limit)));
                return;
            }

            if ("/recent-bookings".equalsIgnoreCase(p)) {
                int limit = intParam(req, "limit", 10);
                resp.getWriter().write(gson.toJson(getRecentBookings(providerId, limit)));
                return;
            }

            // default help
            JsonObject out = new JsonObject();
            out.addProperty("message", "Provider earnings API");
            out.addProperty("routes", "GET /summary, /monthly?months=12, /vehicles?limit=10, /recent-bookings?limit=10");
            resp.getWriter().write(gson.toJson(out));

        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            JsonObject out = new JsonObject();
            out.addProperty("error", "DB error");
            out.addProperty("details", e.getMessage());
            resp.getWriter().write(gson.toJson(out));
        }
    }

    private JsonObject getSummary(int providerId) throws SQLException {
        JsonObject out = new JsonObject();

        try (Connection con = DBConnection.getConnection()) {

            // Total income + total bookings (only bookings tied to provider vehicles)
            String totalsSql =
                    "SELECT " +
                            "  COALESCE(SUM(cb.total_amount),0) AS total_income, " +
                            "  COUNT(cb.booking_id) AS total_bookings " +
                            "FROM companybookings cb " +
                            "JOIN vehicle v ON cb.vehicleid = v.vehicleid " +
                            "WHERE v.provider_id = ?";

            double totalIncome;
            int totalBookings;

            try (PreparedStatement ps = con.prepareStatement(totalsSql)) {
                ps.setInt(1, providerId);
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    totalIncome = rs.getDouble("total_income");
                    totalBookings = rs.getInt("total_bookings");
                }
            }

            // Month-over-month change (for the small green text in cards)
            // Using booked_Date month
            String momSql =
                    "SELECT " +
                            "  SUM(CASE WHEN YEAR(cb.booked_Date)=YEAR(CURDATE()) AND MONTH(cb.booked_Date)=MONTH(CURDATE()) THEN cb.total_amount ELSE 0 END) AS this_month_income, " +
                            "  SUM(CASE WHEN YEAR(cb.booked_Date)=YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND MONTH(cb.booked_Date)=MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN cb.total_amount ELSE 0 END) AS last_month_income, " +
                            "  SUM(CASE WHEN YEAR(cb.booked_Date)=YEAR(CURDATE()) AND MONTH(cb.booked_Date)=MONTH(CURDATE()) THEN 1 ELSE 0 END) AS this_month_bookings, " +
                            "  SUM(CASE WHEN YEAR(cb.booked_Date)=YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) AND MONTH(cb.booked_Date)=MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) AS last_month_bookings " +
                            "FROM companybookings cb " +
                            "JOIN vehicle v ON cb.vehicleid = v.vehicleid " +
                            "WHERE v.provider_id = ?";

            double thisMonthIncome, lastMonthIncome;
            int thisMonthBookings, lastMonthBookings;

            try (PreparedStatement ps = con.prepareStatement(momSql)) {
                ps.setInt(1, providerId);
                try (ResultSet rs = ps.executeQuery()) {
                    rs.next();
                    thisMonthIncome = rs.getDouble("this_month_income");
                    lastMonthIncome = rs.getDouble("last_month_income");
                    thisMonthBookings = rs.getInt("this_month_bookings");
                    lastMonthBookings = rs.getInt("last_month_bookings");
                }
            }

            double incomeChangePct = (lastMonthIncome <= 0) ? (thisMonthIncome > 0 ? 100.0 : 0.0)
                    : ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100.0;

            int bookingChange = thisMonthBookings - lastMonthBookings;

            out.addProperty("totalIncome", round2(totalIncome));
            out.addProperty("totalBookings", totalBookings);
            out.addProperty("incomeChangePct", round1(incomeChangePct));
            out.addProperty("bookingChange", bookingChange);
        }

        return out;
    }

    private JsonObject getMonthly(int providerId, int monthsBack) throws SQLException {
        JsonObject out = new JsonObject();

        YearMonth current = YearMonth.now();
        List<YearMonth> months = new ArrayList<>();
        for (int i = monthsBack - 1; i >= 0; i--) {
            months.add(current.minusMonths(i));
        }

        Map<String, Double> totalsByYm = new HashMap<>();

        try (Connection con = DBConnection.getConnection()) {
            String sql =
                    "SELECT DATE_FORMAT(cb.booked_Date, '%Y-%m') AS ym, COALESCE(SUM(cb.total_amount),0) AS total " +
                            "FROM companybookings cb " +
                            "JOIN vehicle v ON cb.vehicleid = v.vehicleid " +
                            "WHERE v.provider_id = ? " +
                            "  AND cb.booked_Date >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) " +
                            "GROUP BY ym " +
                            "ORDER BY ym ASC";

            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setInt(1, providerId);
                ps.setInt(2, monthsBack);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        totalsByYm.put(rs.getString("ym"), rs.getDouble("total"));
                    }
                }
            }
        }

        JsonArray labels = new JsonArray();
        JsonArray data = new JsonArray();

        for (YearMonth ym : months) {
            String key = ym.toString(); // yyyy-MM
            labels.add(ym.getMonth().toString().substring(0, 1) + ym.getMonth().toString().substring(1, 3).toLowerCase()); // Jan-ish
            data.add(round2(totalsByYm.getOrDefault(key, 0.0)));
        }

        out.add("labels", labels);
        out.add("data", data);
        return out;
    }

    private JsonObject getVehicleEarnings(int providerId, int limit) throws SQLException {
        JsonObject out = new JsonObject();
        JsonArray items = new JsonArray();

        try (Connection con = DBConnection.getConnection()) {
            String sql =
                    "SELECT v.vehicleid, v.vehiclebrand, v.vehiclemodel, " +
                            "       COUNT(cb.booking_id) AS booking_count, " +
                            "       COALESCE(SUM(cb.total_amount),0) AS earnings " +
                            "FROM vehicle v " +
                            "LEFT JOIN companybookings cb ON cb.vehicleid = v.vehicleid " +
                            "WHERE v.provider_id = ? " +
                            "GROUP BY v.vehicleid, v.vehiclebrand, v.vehiclemodel " +
                            "ORDER BY earnings DESC " +
                            "LIMIT ?";

            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setInt(1, providerId);
                ps.setInt(2, limit);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        JsonObject v = new JsonObject();
                        v.addProperty("vehicleId", rs.getInt("vehicleid"));
                        v.addProperty("vehicleName", rs.getString("vehiclebrand") + " " + rs.getString("vehiclemodel"));
                        v.addProperty("bookingCount", rs.getInt("booking_count"));
                        v.addProperty("earnings", round2(rs.getDouble("earnings")));
                        items.add(v);
                    }
                }
            }
        }

        out.add("vehicles", items);
        return out;
    }

    private JsonObject getRecentBookings(int providerId, int limit) throws SQLException {
        JsonObject out = new JsonObject();
        JsonArray items = new JsonArray();

        try (Connection con = DBConnection.getConnection()) {
            String sql =
                    "SELECT cb.booking_id, cb.vehicleid, v.vehiclebrand, v.vehiclemodel, " +
                            "       cb.companyid, rc.companyname, " +
                            "       cb.customerid, c.firstname, c.lastname, " +
                            "       cb.trip_start_date, cb.trip_end_date, cb.status, cb.total_amount, cb.payment_status " +
                            "FROM companybookings cb " +
                            "JOIN vehicle v ON cb.vehicleid = v.vehicleid " +
                            "JOIN rentalcompany rc ON cb.companyid = rc.companyid " +
                            "JOIN customer c ON cb.customerid = c.customerid " +
                            "WHERE v.provider_id = ? " +
                            "ORDER BY cb.booked_Date DESC, cb.booking_id DESC " +
                            "LIMIT ?";

            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setInt(1, providerId);
                ps.setInt(2, limit);
                try (ResultSet rs = ps.executeQuery()) {
                    while (rs.next()) {
                        int bookingId = rs.getInt("booking_id");
                        int vehicleId = rs.getInt("vehicleid");
                        String vehicleName = rs.getString("vehiclebrand") + " " + rs.getString("vehiclemodel");
                        String companyName = rs.getString("companyname");
                        String customerName = rs.getString("firstname") + " " + rs.getString("lastname");

                        java.sql.Date startD = rs.getDate("trip_start_date");
                        java.sql.Date endD = rs.getDate("trip_end_date");


                        String status = rs.getString("status");
                        double total = rs.getDouble("total_amount");

                        double platformFee = total * PLATFORM_FEE_RATE;
                        double companyFee = total * COMPANY_FEE_RATE;
                        double net = total - platformFee - companyFee;

                        long durationDays = 0;
                        if (startD != null && endD != null) {
                            LocalDate s = startD.toLocalDate();
                            LocalDate e = endD.toLocalDate();
                            durationDays = ChronoUnit.DAYS.between(s, e) + 1;
                        }

                        JsonObject b = new JsonObject();
                        b.addProperty("bookingId", bookingId);
                        b.addProperty("vehicleId", vehicleId);
                        b.addProperty("vehicleName", vehicleName);
                        b.addProperty("companyName", companyName);
                        b.addProperty("customerName", customerName);
                        b.addProperty("status", status == null ? "" : status.toLowerCase());
                        b.addProperty("durationDays", durationDays);

                        b.addProperty("totalAmount", round2(total));
                        b.addProperty("platformFee", round2(platformFee));
                        b.addProperty("companyFee", round2(companyFee));
                        b.addProperty("netEarnings", round2(net));

                        items.add(b);
                    }
                }
            }
        }

        out.add("bookings", items);
        return out;
    }

    private static double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private static double round1(double v) { return Math.round(v * 10.0) / 10.0; }
}
