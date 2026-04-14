package customer.service;

import common.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

import com.google.gson.JsonObject;

@WebServlet("/customer/dashboard-stats")
public class CustomerDashboardStatsServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("customerId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"Not authenticated\"}");
            return;
        }

        int customerId = (int) session.getAttribute("customerId");

        try (Connection conn = DBConnection.getConnection()) {

            // ACTIVE: trip is currently in progress, not cancelled
            int active = getCount(conn,
                    "SELECT COUNT(*) FROM companybookings " +
                            "WHERE customerid = ? " +
                            "AND (status IS NULL OR status NOT IN ('cancelled')) " +
                            "AND TIMESTAMP(trip_start_date, start_time) <= NOW() " +
                            "AND TIMESTAMP(trip_end_date, end_time) >= NOW()",
                    customerId);

            // UPCOMING: trip starts in the future, not cancelled
            int upcoming = getCount(conn,
                    "SELECT COUNT(*) FROM companybookings " +
                            "WHERE customerid = ? " +
                            "AND (status IS NULL OR status NOT IN ('cancelled')) " +
                            "AND TIMESTAMP(trip_start_date, start_time) > NOW()",
                    customerId);

            // COMPLETED: trip has already ended, not cancelled
            int completed = getCount(conn,
                    "SELECT COUNT(*) FROM companybookings " +
                            "WHERE customerid = ? " +
                            "AND (status IS NULL OR status NOT IN ('cancelled')) " +
                            "AND TIMESTAMP(trip_end_date, end_time) < NOW()",
                    customerId);

            // MONTHLY SPEND: total for non-cancelled bookings in the current month
            double monthlySpend = getSum(conn,
                    "SELECT COALESCE(SUM(total_amount), 0) FROM companybookings " +
                            "WHERE customerid = ? " +
                            "AND (status IS NULL OR status NOT IN ('cancelled')) " +
                            "AND MONTH(trip_start_date) = MONTH(CURDATE()) " +
                            "AND YEAR(trip_start_date) = YEAR(CURDATE())",
                    customerId);

            JsonObject json = new JsonObject();
            json.addProperty("active", active);
            json.addProperty("upcoming", upcoming);
            json.addProperty("completed", completed);
            json.addProperty("monthlySpending", monthlySpend);

            response.getWriter().write(json.toString());

        } catch (Exception e) {
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            e.printStackTrace();
        }
    }

    private int getCount(Connection conn, String sql, int customerId) throws Exception {
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getInt(1) : 0;
            }
        }
    }

    private double getSum(Connection conn, String sql, int customerId) throws Exception {
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next() ? rs.getDouble(1) : 0.0;
            }
        }
    }
}