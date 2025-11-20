package rentalcompany.maintenance.service;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.maintenance.controller.CalendarEventDAO;
import common.util.DBConnection;
import com.google.gson.Gson;
import com.google.gson.JsonObject;

import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Connection;

/**
 * DeleteCalendarEventServlet
 * Handles deletion of calendar events
 */
@WebServlet("/maintenance/deleteEvent")
public class DeleteCalendarEventServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "POST, DELETE");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");

        try (Connection con = DBConnection.getConnection()) {
            CalendarEventDAO dao = new CalendarEventDAO(con);
            int eventId;

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
                eventId = jsonObject.get("eventid").getAsInt();

            } else {
                // Handle form-encoded or query parameter
                String eventIdParam = req.getParameter("eventid");
                if (eventIdParam == null) {
                    resp.getWriter().write("{\"status\":\"error\",\"message\":\"Event ID is required\"}");
                    return;
                }
                eventId = Integer.parseInt(eventIdParam);
            }

            boolean success = dao.deleteEvent(eventId);

            if (success) {
                resp.getWriter().write("{\"status\":\"success\",\"message\":\"Event deleted successfully\"}");
            } else {
                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Event not found or could not be deleted\"}");
            }

        } catch (NumberFormatException e) {
            e.printStackTrace();
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid event ID format: " + e.getMessage() + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        doPost(req, resp);
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setStatus(HttpServletResponse.SC_OK);
    }
}