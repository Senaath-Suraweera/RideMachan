package rentalcompany.maintenance.service;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.maintenance.controller.CalendarEventDAO;
import rentalcompany.maintenance.model.CalendarEvent;
import common.util.DBConnection;
import com.google.gson.Gson;

import java.io.IOException;
import java.sql.Connection;
import java.util.*;

@WebServlet("/maintenance/listEvents")
public class ListCalendarEventServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");

        try (Connection con = DBConnection.getConnection()) {
            CalendarEventDAO dao = new CalendarEventDAO(con);
            Gson gson = new Gson();

            String date = req.getParameter("date");
            String startDate = req.getParameter("startDate");
            String endDate = req.getParameter("endDate");
            String status = req.getParameter("status");
            String eventIdParam = req.getParameter("eventId");

            // Handle specific event request
            if (eventIdParam != null) {
                int eventId = Integer.parseInt(eventIdParam);
                CalendarEvent event = dao.getEventById(eventId);
                if (event != null) {
                    resp.getWriter().write(gson.toJson(convertToFrontendFormat(event)));
                } else {
                    resp.getWriter().write("{\"status\":\"error\",\"message\":\"Event not found\"}");
                }
                return;
            }

            // Handle single date (today’s tasks)
            if (date != null) {
                List<CalendarEvent> events = dao.getEventsByDate(date);
                List<Map<String, Object>> formatted = convertListToFrontendFormat(events);
                resp.getWriter().write(gson.toJson(formatted));
                return;
            }

            // Handle date range (monthly calendar)
            if (startDate != null && endDate != null) {
                List<CalendarEvent> events = dao.getEventsByDateRange(startDate, endDate);

                // ✅ FIX: group strictly by date part only (YYYY-MM-DD)
                Map<String, List<Map<String, Object>>> grouped = new LinkedHashMap<>();
                for (CalendarEvent e : events) {
                    String dateKey = e.getScheduledDate().split(" ")[0]; // Drop time
                    grouped.computeIfAbsent(dateKey, k -> new ArrayList<>())
                            .add(convertToFrontendFormat(e));
                }

                resp.getWriter().write(gson.toJson(grouped));
                return;
            }

            // Handle status filter
            if (status != null) {
                List<CalendarEvent> events = dao.getEventsByStatus(status);
                resp.getWriter().write(gson.toJson(convertListToFrontendFormat(events)));
                return;
            }

            // Default: return all events
            List<CalendarEvent> all = dao.listEvents();
            resp.getWriter().write(gson.toJson(convertListToFrontendFormat(all)));

        } catch (NumberFormatException e) {
            e.printStackTrace();
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid parameter format: " + e.getMessage() + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    private Map<String, Object> convertToFrontendFormat(CalendarEvent event) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", event.getEventId());
        map.put("vehicleId", event.getVehicleNumberPlate());
        map.put("model", event.getVehicleModel());
        map.put("time", event.getScheduledTime());
        map.put("bay", event.getServiceBay());
        map.put("service", event.getServiceType());
        map.put("status", event.getStatus());
        map.put("description", event.getDescription());
        map.put("estimatedDuration", event.getEstimatedDuration());
        map.put("assignedTechnician", event.getAssignedTechnician());

        // Include backend fields for editing/updating
        map.put("vehicle_id", event.getVehicleId());
        map.put("maintenance_id", event.getMaintenanceId());
        map.put("scheduled_date", event.getScheduledDate());
        map.put("scheduled_time", event.getScheduledTime());
        return map;
    }

    private List<Map<String, Object>> convertListToFrontendFormat(List<CalendarEvent> events) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (CalendarEvent e : events) {
            result.add(convertToFrontendFormat(e));
        }
        return result;
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setStatus(HttpServletResponse.SC_OK);
    }
}
