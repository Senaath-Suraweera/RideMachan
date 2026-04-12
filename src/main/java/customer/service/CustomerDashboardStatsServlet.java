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
        if (session == null || session.getAttribute("customerid") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\": \"Not authenticated\"}");
            return;
        }

        int customerId = (int) session.getAttribute("customerid");

        try (Connection conn = DBConnection.getConnection()) {

            int active = getCount(conn,
                    "SELECT COUNT(*) FROM companybookings WHERE customerid = ? AND status = 'active'",
                    customerId);

            int upcoming = getCount(conn,
                    "SELECT COUNT(*) FROM companybookings WHERE customerid = ? AND status = 'confirmed' AND trip_start_date > CURDATE()",
                    customerId);

            int completed = getCount(conn,
                    "SELECT COUNT(*) FROM companybookings WHERE customerid = ? AND status = 'completed'",
                    customerId);

            double monthlySpend = getSum(conn,
                    "SELECT COALESCE(SUM(total_amount), 0) FROM companybookings WHERE customerid = ? AND status = 'completed' AND MONTH(booked_Date) = MONTH(CURDATE()) AND YEAR(booked_Date) = YEAR(CURDATE())",
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