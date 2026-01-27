//package admin.controller;
//
//import admin.model.DashboardOverviewResponse;
//import admin.model.DashboardOverviewResponse.MonthlyIncomePoint;
//import admin.model.DashboardOverviewResponse.TopItem;
//import admin.model.DashboardOverviewResponse.Stats;
//import common.util.DBConnection;
//
//import java.sql.*;
//import java.util.ArrayList;
//import java.util.List;
//
//public class DashboardController {
//
//    /**
//     * Returns everything the admin dashboard needs in ONE request.
//     * @param monthsBack number of months to include in monthlyIncome (e.g., 6 or 12)
//     */
//    public DashboardOverviewResponse getOverview(int monthsBack) throws SQLException {
//        DashboardOverviewResponse res = new DashboardOverviewResponse();
//        res.stats = getStats();
//        res.monthlyIncome = getMonthlyIncome(monthsBack);
//        res.topCustomers = getTopCustomers(3);
//        res.topRenters = getTopRenters(3);
//        return res;
//    }
//
//    public Stats getStats() throws SQLException {
//        Stats s = new Stats();
//
//        // Total income: sum of paid bookings.
//        // Ensure companybookings.payment_status values include 'Paid' (case-insensitive).
//        String incomeSql =
//                "SELECT COALESCE(SUM(total_amount),0) AS total " +
//                        "FROM companybookings WHERE LOWER(payment_status) = 'paid'";
//
//        // New rental requests: count pending bookings (adjust if your status values differ)
//        String newRentalsSql =
//                "SELECT COUNT(*) AS c FROM companybookings " +
//                        "WHERE LOWER(status) IN ('pending','requested','request')";
//
//        // Support tickets: count open/in-progress
//        String ticketsSql =
//                "SELECT COUNT(*) AS c FROM SupportTicket WHERE status IN ('Open','In Progress')";
//
//        // Reports: total reports
//        String reportsSql =
//                "SELECT COUNT(*) AS c FROM Report";
//
//        try (Connection con = DBConnection.getConnection()) {
//            s.totalIncome = queryDouble(con, incomeSql, "total");
//            s.newRentalRequests = queryInt(con, newRentalsSql, "c");
//            s.supportTickets = queryInt(con, ticketsSql, "c");
//            s.reports = queryInt(con, reportsSql, "c");
//        }
//
//        // Optional change values (you can implement later)
//        s.totalIncomeChangePercent = null;
//        s.newRentalRequestsChange = null;
//        s.supportTicketsChange = null;
//
//        return s;
//    }
//
//    public List<MonthlyIncomePoint> getMonthlyIncome(int monthsBack) throws SQLException {
//        if (monthsBack <= 0) monthsBack = 6;
//
//        String sql =
//                "SELECT DATE_FORMAT(COALESCE(trip_start_date, booked_Date), '%Y-%m') AS ym, " +
//                        "       COALESCE(SUM(CASE WHEN LOWER(payment_status)='paid' THEN total_amount ELSE 0 END),0) AS amount, " +
//                        "       COUNT(*) AS bookings " +
//                        "FROM companybookings " +
//                        "WHERE COALESCE(trip_start_date, booked_Date) >= DATE_SUB(CURDATE(), INTERVAL ? MONTH) " +
//                        "GROUP BY ym " +
//                        "ORDER BY ym";
//
//        List<MonthlyIncomePoint> out = new ArrayList<>();
//        try (Connection con = DBConnection.getConnection();
//             PreparedStatement ps = con.prepareStatement(sql)) {
//
//            ps.setInt(1, monthsBack);
//
//            try (ResultSet rs = ps.executeQuery()) {
//                while (rs.next()) {
//                    MonthlyIncomePoint p = new MonthlyIncomePoint();
//                    p.month = rs.getString("ym");
//                    p.amount = rs.getDouble("amount");
//                    p.bookings = rs.getInt("bookings");
//                    out.add(p);
//                }
//            }
//        }
//        return out;
//    }
//
//    public List<TopItem> getTopCustomers(int limit) throws SQLException {
//        if (limit <= 0) limit = 3;
//
//        // Top customers by bookings
//        String sql =
//                "SELECT CONCAT(c.firstname, ' ', c.lastname) AS name, COUNT(*) AS rides " +
//                        "FROM companybookings b " +
//                        "JOIN Customer c ON c.customerid = b.customerid " +
//                        "GROUP BY b.customerid, name " +
//                        "ORDER BY rides DESC " +
//                        "LIMIT ?";
//
//        List<TopItem> out = new ArrayList<>();
//        try (Connection con = DBConnection.getConnection();
//             PreparedStatement ps = con.prepareStatement(sql)) {
//
//            ps.setInt(1, limit);
//
//            try (ResultSet rs = ps.executeQuery()) {
//                while (rs.next()) {
//                    TopItem t = new TopItem();
//                    t.name = rs.getString("name");
//                    t.rides = rs.getInt("rides");
//                    t.rating = null; // no customer rating table in schema
//                    out.add(t);
//                }
//            }
//        }
//        return out;
//    }
//
//    public List<TopItem> getTopRenters(int limit) throws SQLException {
//        if (limit <= 0) limit = 3;
//
//        // Top rental companies by bookings + avg rating from ratings table (if available)
//        String sql =
//                "SELECT rc.companyname AS name, COUNT(*) AS rides, " +
//                        "       (SELECT AVG(r.rating_value) FROM ratings r WHERE r.companyid = b.companyid) AS rating " +
//                        "FROM companybookings b " +
//                        "JOIN RentalCompany rc ON rc.companyid = b.companyid " +
//                        "GROUP BY b.companyid, name " +
//                        "ORDER BY rides DESC " +
//                        "LIMIT ?";
//
//        List<TopItem> out = new ArrayList<>();
//        try (Connection con = DBConnection.getConnection();
//             PreparedStatement ps = con.prepareStatement(sql)) {
//
//            ps.setInt(1, limit);
//
//            try (ResultSet rs = ps.executeQuery()) {
//                while (rs.next()) {
//                    TopItem t = new TopItem();
//                    t.name = rs.getString("name");
//                    t.rides = rs.getInt("rides");
//                    double r = rs.getDouble("rating");
//                    t.rating = rs.wasNull() ? null : r;
//                    out.add(t);
//                }
//            }
//        }
//        return out;
//    }
//
//    private int queryInt(Connection con, String sql, String col) throws SQLException {
//        try (PreparedStatement ps = con.prepareStatement(sql);
//             ResultSet rs = ps.executeQuery()) {
//            return rs.next() ? rs.getInt(col) : 0;
//        }
//    }
//
//    private double queryDouble(Connection con, String sql, String col) throws SQLException {
//        try (PreparedStatement ps = con.prepareStatement(sql);
//             ResultSet rs = ps.executeQuery()) {
//            return rs.next() ? rs.getDouble(col) : 0.0;
//        }
//    }
//}
