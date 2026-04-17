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
 * Returns all COMPLETED calendar events for a specific vehicle
 * (assigned to the logged in maintenance staff member) as JSON
 * for the Maintenance Logs page table.
 *
 * Source table: CalendarEvents (filtered by status = 'completed'
 * and by the selected vehicle_id)
 */
@WebServlet("/maintenanceLogs")
public class DisplayVehicleMaintenanceLogsServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
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

        // The JS sends vehicleId as the number plate value (from the dropdown),
        // so we resolve the vehicle by its numberplatenumber.
        String vehiclePlate = req.getParameter("vehicleId");

        if (vehiclePlate == null || vehiclePlate.trim().isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"error\":\"vehicleId is required\"}");
            return;
        }

        // Join CalendarEvents -> Vehicle so we can filter by number plate
        // and also pull plate / brand / model for the response.
        String sql =
                "SELECT ce.eventid, " +
                        "       ce.service_type, " +
                        "       ce.description, " +
                        "       ce.status, " +
                        "       ce.scheduled_date, " +
                        "       ce.scheduled_time, " +
                        "       ce.service_bay, " +
                        "       ce.estimated_duration, " +
                        "       ce.assigned_technician, " +
                        "       v.numberplatenumber, " +
                        "       v.vehiclebrand, " +
                        "       v.vehiclemodel " +
                        "  FROM CalendarEvents ce " +
                        "  LEFT JOIN Vehicle v ON v.vehicleid = ce.vehicle_id " +
                        " WHERE ce.maintenance_id = ? " +
                        "   AND v.numberplatenumber = ? " +
                        "   AND ce.status = 'completed' " +
                        " ORDER BY ce.scheduled_date DESC, ce.eventid DESC";

        StringBuilder json = new StringBuilder("[");

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, staffId);
            ps.setString(2, vehiclePlate);

            try (ResultSet rs = ps.executeQuery()) {
                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    first = false;

                    String serviceType        = safe(rs.getString("service_type"));
                    String description        = safe(rs.getString("description"));
                    String status             = safe(rs.getString("status"));
                    String scheduledDate      = safe(rs.getString("scheduled_date"));
                    String scheduledTime      = safe(rs.getString("scheduled_time"));
                    String serviceBay         = safe(rs.getString("service_bay"));
                    String estimatedDuration  = safe(rs.getString("estimated_duration"));
                    String assignedTechnician = safe(rs.getString("assigned_technician"));
                    String plate              = safe(rs.getString("numberplatenumber"));
                    String brand              = safe(rs.getString("vehiclebrand"));
                    String model              = safe(rs.getString("vehiclemodel"));

                    // Completed rows always display as "Completed" in the UI.
                    String uiStatus = "Completed";

                    // No created_at / updated_at columns in the DB, so
                    // we use scheduled_date as the completion reference.
                    String completedDate = scheduledDate;

                    json.append("{")
                            .append("\"eventId\":").append(rs.getInt("eventid")).append(",")
                            .append("\"type\":\"").append(escape(serviceType)).append("\",")
                            .append("\"description\":\"").append(escape(description)).append("\",")
                            .append("\"status\":\"").append(escape(uiStatus)).append("\",")
                            .append("\"rawStatus\":\"").append(escape(status)).append("\",")
                            .append("\"scheduledDate\":\"").append(escape(scheduledDate)).append("\",")
                            .append("\"scheduledTime\":\"").append(escape(scheduledTime)).append("\",")
                            .append("\"completedDate\":\"").append(escape(completedDate)).append("\",")
                            .append("\"serviceBay\":\"").append(escape(serviceBay)).append("\",")
                            .append("\"estimatedDuration\":\"").append(escape(estimatedDuration)).append("\",")
                            .append("\"assignedTechnician\":\"").append(escape(assignedTechnician)).append("\",")
                            .append("\"numberplate\":\"").append(escape(plate)).append("\",")
                            .append("\"vehicleBrand\":\"").append(escape(brand)).append("\",")
                            .append("\"vehicleModel\":\"").append(escape(model)).append("\"")
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