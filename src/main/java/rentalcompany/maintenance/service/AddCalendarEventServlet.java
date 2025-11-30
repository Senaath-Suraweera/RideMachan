package rentalcompany.maintenance.service;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.maintenance.controller.CalendarEventDAO;
import rentalcompany.maintenance.model.CalendarEvent;
import common.util.DBConnection;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Connection;

/**
 * AddCalendarEventServlet
 * Handles creation of new calendar events with all required fields
 */
@WebServlet("/maintenance/addEvent")
public class AddCalendarEventServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "POST");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");

        try (Connection con = DBConnection.getConnection()) {
            CalendarEventDAO dao = new CalendarEventDAO(con);
            CalendarEvent event = new CalendarEvent();

            // Check if request is JSON or form-encoded
            String contentType = req.getContentType();

            if (contentType != null && contentType.contains("application/json")) {
                // Handle JSON request body
                BufferedReader reader = req.getReader();
                StringBuilder sb = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    sb.append(line);
                }

                Gson gson = new Gson();
                JsonObject jsonObject = gson.fromJson(sb.toString(), JsonObject.class);

                // Set all fields from JSON
                event.setVehicleId(jsonObject.get("vehicle_id").getAsInt());
                event.setServiceType(jsonObject.get("service_type").getAsString());
                event.setStatus(jsonObject.has("status") ?
                        jsonObject.get("status").getAsString() : "scheduled");
                event.setDescription(jsonObject.get("description").getAsString());
                event.setMaintenanceId(jsonObject.get("maintenance_id").getAsInt());
                event.setScheduledDate(jsonObject.get("scheduled_date").getAsString());
                event.setScheduledTime(jsonObject.get("scheduled_time").getAsString());
                event.setServiceBay(jsonObject.get("service_bay").getAsString());
                event.setEstimatedDuration(jsonObject.get("estimated_duration").getAsString());
                event.setAssignedTechnician(jsonObject.get("assigned_technician").getAsString());

            } else {
                // Handle form-encoded request
                event.setVehicleId(Integer.parseInt(req.getParameter("vehicle_id")));
                event.setServiceType(req.getParameter("service_type"));
                event.setStatus(req.getParameter("status") != null ?
                        req.getParameter("status") : "scheduled");
                event.setDescription(req.getParameter("description"));
                event.setMaintenanceId(Integer.parseInt(req.getParameter("maintenance_id")));
                event.setScheduledDate(req.getParameter("scheduled_date"));
                event.setScheduledTime(req.getParameter("scheduled_time"));
                event.setServiceBay(req.getParameter("service_bay"));
                event.setEstimatedDuration(req.getParameter("estimated_duration"));
                event.setAssignedTechnician(req.getParameter("assigned_technician"));
            }

            // Validate required fields
            if (event.getVehicleId() == 0 || event.getServiceType() == null ||
                    event.getScheduledDate() == null || event.getScheduledTime() == null ||
                    event.getServiceBay() == null || event.getEstimatedDuration() == null ||
                    event.getAssignedTechnician() == null) {

                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Missing required fields\"}");
                return;
            }

            boolean success = dao.addEvent(event);

            if (success) {
                resp.getWriter().write("{\"status\":\"success\",\"message\":\"Event created successfully\"}");
            } else {
                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Failed to create event\"}");
            }

        } catch (NumberFormatException e) {
            e.printStackTrace();
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid number format: " + e.getMessage() + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setStatus(HttpServletResponse.SC_OK);
    }
}