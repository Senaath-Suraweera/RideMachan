package admin.service;


import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import admin.controller.SupportTicketController;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

@WebServlet("/support/ticket/update")
public class SupportTicketUpdateServlet extends HttpServlet {


    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        try {
            StringBuilder sb = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);

            JsonObject reqJson = JsonParser.parseString(sb.toString()).getAsJsonObject();

            int ticketId = reqJson.get("ticketId").getAsInt();

            String subject = reqJson.has("subject") ? reqJson.get("subject").getAsString() : "";
            String description = reqJson.has("description") ? reqJson.get("description").getAsString() : "";
            String adminNotes = reqJson.has("adminNotes") ? reqJson.get("adminNotes").getAsString() : "";

            // must be DB enum values: Open, In Progress, Resolved, Closed
            String status = reqJson.has("status") ? reqJson.get("status").getAsString() : "Open";
            // must be DB enum values: Low, Medium, High, Urgent
            String priority = reqJson.has("priority") ? reqJson.get("priority").getAsString() : "Low";

            String bookingId = reqJson.has("bookingId") ? reqJson.get("bookingId").getAsString() : null;

            boolean updated = SupportTicketController.updateTicket(
                    ticketId, subject, description, adminNotes, status, priority, bookingId
            );

            JsonObject res = new JsonObject();
            if (updated) {
                res.addProperty("status", "success");
                res.addProperty("message", "Ticket updated successfully");
            } else {
                res.addProperty("status", "fail");
                res.addProperty("message", "Update failed");
            }

            out.print(res);

        } catch (Exception e) {
            e.printStackTrace();
            JsonObject res = new JsonObject();
            res.addProperty("status", "error");
            res.addProperty("message", "Exception: " + e.getMessage());
            out.print(res);
        } finally {
            out.flush();
            out.close();
        }
    }
}
