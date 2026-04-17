package rentalcompany.maintenance.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import jakarta.servlet.http.HttpSession;

import common.util.DBConnection;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

/**
 * Pulls the most recently COMPLETED calendar events for the logged in
 * maintenance staff member and returns them as JSON for the dashboard
 * "Recent Maintenance" panel.
 *
 * Source table: CalendarEvents (filtered by status = 'completed')
 */
@WebServlet("/display/recent/maintenance")
public class DisplayRecentMaintenanceServlet extends HttpServlet {

    private static final int RECENT_LIMIT = 5;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("staff_id") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\"error\":\"not logged in\"}");
            return;
        }

        int staffId = (int) session.getAttribute("staff_id");

        // Join CalendarEvents -> Vehicle so we can display the number plate
        String sql =
                "SELECT ce.eventid, " +
                        "       ce.service_type, " +
                        "       ce.description, " +
                        "       ce.status, " +
                        "       ce.scheduled_date, " +
                        "       v.numberplatenumber, " +
                        "       v.vehiclebrand, " +
                        "       v.vehiclemodel " +
                        "  FROM CalendarEvents ce " +
                        "  LEFT JOIN Vehicle v ON v.vehicleid = ce.vehicle_id " +
                        " WHERE ce.maintenance_id = ? " +
                        "   AND ce.status = 'completed' " +
                        "   AND ce.scheduled_date < CURDATE() " +
                        " ORDER BY ce.scheduled_date DESC, ce.eventid DESC " +
                        " LIMIT ?";

        StringBuilder json = new StringBuilder("[");

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            ps.setInt(2, RECENT_LIMIT);

            try (ResultSet rs = ps.executeQuery()) {
                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    first = false;

                    String serviceType = safe(rs.getString("service_type"));
                    String description = safe(rs.getString("description"));
                    String status      = safe(rs.getString("status"));
                    String plate       = safe(rs.getString("numberplatenumber"));
                    String brand       = safe(rs.getString("vehiclebrand"));
                    String model       = safe(rs.getString("vehiclemodel"));

                    // updated_at best approximates when it was flipped to completed.
                    String completedDate = rs.getString("scheduled_date");
                    if (completedDate == null) completedDate = "";

                    String vehicleLabel = plate.isEmpty()
                            ? (brand + " " + model).trim()
                            : plate;

                    String title = serviceType
                            + (vehicleLabel.isEmpty() ? "" : " - Vehicle " + vehicleLabel);

                    // The frontend styles the dot via: activity-icon.success / warning / info
                    // Completed rows always render with the 'success' dot.
                    String uiStatus = "success";

                    json.append("{")
                            .append("\"status\":\"").append(escape(uiStatus)).append("\",")
                            .append("\"title\":\"").append(escape(title)).append("\",")
                            .append("\"description\":\"").append(escape(description)).append("\",")
                            .append("\"completedDate\":\"").append(escape(completedDate)).append("\",")
                            .append("\"rawStatus\":\"").append(escape(status)).append("\"")
                            .append("}");
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"error\":\"" + escape(e.getMessage()) + "\"}");
            return;
        }

        json.append("]");
        out.write(json.toString());
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    private static String escape(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", " ")
                .replace("\r", " ")
                .replace("\t", " ");
    }
}