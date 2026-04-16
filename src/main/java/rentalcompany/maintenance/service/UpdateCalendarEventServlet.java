package rentalcompany.maintenance.service;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.maintenance.controller.CalendarEventDAO;
import rentalcompany.maintenance.model.CalendarEvent;
import rentalcompany.companyvehicle.dao.VehicleDAO;
import common.util.DBConnection;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Connection;

/**
 * UpdateCalendarEventServlet
 * Handles updating existing calendar events and status changes.
 *
 * NOTE: For full-event updates the "vehicle_id" field in the JSON body is
 * expected to be a VEHICLE NUMBER PLATE (string), mirroring the contract
 * used by AddCalendarEventServlet. The servlet resolves it to the internal
 * integer vehicle id via VehicleDAO.getIdOfVehicle().
 */
@WebServlet("/maintenance/updateEvent")
public class UpdateCalendarEventServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "POST, PUT");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");

        try (Connection con = DBConnection.getConnection()) {
            CalendarEventDAO dao = new CalendarEventDAO(con);

            // Check if this is a status-only update
            String updateType = req.getParameter("updateType");

            if ("status".equals(updateType)) {
                // Quick status update
                int eventId = Integer.parseInt(req.getParameter("eventid"));
                String status = req.getParameter("status");

                // Validate status
                if (!isValidStatus(status)) {
                    resp.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid status value\"}");
                    return;
                }

                boolean success = dao.updateEventStatus(eventId, status);
                resp.getWriter().write("{\"status\":\"" + (success ? "success" : "error") + "\"}");

            } else {
                // Full event update
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
                    event.setEventId(jsonObject.get("eventid").getAsInt());

                    // vehicle_id is a NUMBER PLATE string — resolve to internal id
                    String vehicleNumberPlate = jsonObject.get("vehicle_id").getAsString();
                    int vehicleId = VehicleDAO.getIdOfVehicle(vehicleNumberPlate);
                    if (vehicleId == -1) {
                        resp.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid vehicle number plate\"}");
                        return;
                    }
                    event.setVehicleId(vehicleId);

                    event.setServiceType(jsonObject.get("service_type").getAsString());
                    event.setStatus(jsonObject.get("status").getAsString());
                    event.setDescription(jsonObject.get("description").getAsString());
                    event.setMaintenanceId(jsonObject.get("maintenance_id").getAsInt());
                    event.setScheduledDate(jsonObject.get("scheduled_date").getAsString());
                    event.setScheduledTime(jsonObject.get("scheduled_time").getAsString());
                    event.setServiceBay(jsonObject.get("service_bay").getAsString());
                    event.setEstimatedDuration(jsonObject.get("estimated_duration").getAsString());
                    event.setAssignedTechnician(jsonObject.get("assigned_technician").getAsString());

                } else {
                    // Handle form-encoded request
                    event.setEventId(Integer.parseInt(req.getParameter("eventid")));

                    // For form-encoded, support both: numeric id OR number plate.
                    String vehicleParam = req.getParameter("vehicle_id");
                    if (vehicleParam == null || vehicleParam.isEmpty()) {
                        resp.getWriter().write("{\"status\":\"error\",\"message\":\"vehicle_id is required\"}");
                        return;
                    }

                    int vehicleId;
                    try {
                        // If it parses cleanly as an int, treat as internal id
                        vehicleId = Integer.parseInt(vehicleParam);
                    } catch (NumberFormatException nfe) {
                        // Otherwise treat as a number plate and resolve it
                        vehicleId = VehicleDAO.getIdOfVehicle(vehicleParam);
                        if (vehicleId == -1) {
                            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid vehicle number plate\"}");
                            return;
                        }
                    }
                    event.setVehicleId(vehicleId);

                    event.setServiceType(req.getParameter("service_type"));
                    event.setStatus(req.getParameter("status"));
                    event.setDescription(req.getParameter("description"));
                    event.setMaintenanceId(Integer.parseInt(req.getParameter("maintenance_id")));
                    event.setScheduledDate(req.getParameter("scheduled_date"));
                    event.setScheduledTime(req.getParameter("scheduled_time"));
                    event.setServiceBay(req.getParameter("service_bay"));
                    event.setEstimatedDuration(req.getParameter("estimated_duration"));
                    event.setAssignedTechnician(req.getParameter("assigned_technician"));
                }

                // Validate status
                if (!isValidStatus(event.getStatus())) {
                    resp.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid status value\"}");
                    return;
                }

                boolean success = dao.updateEvent(event);

                if (success) {
                    resp.getWriter().write("{\"status\":\"success\",\"message\":\"Event updated successfully\"}");
                } else {
                    resp.getWriter().write("{\"status\":\"error\",\"message\":\"Failed to update event\"}");
                }
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
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        doPost(req, resp);
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "POST, PUT, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setStatus(HttpServletResponse.SC_OK);
    }

    /**
     * Validate status value
     */
    private boolean isValidStatus(String status) {
        return status != null &&
                (status.equals("scheduled") || status.equals("in-progress") || status.equals("completed"));
    }
}