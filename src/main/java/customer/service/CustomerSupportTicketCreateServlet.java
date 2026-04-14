package customer.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import customer.controller.CustomerSupportTicketController;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

@WebServlet("/customer/support-ticket/create")
public class CustomerSupportTicketCreateServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        try {
            // 1. Session check
            HttpSession session = req.getSession(false);
            if (session == null || session.getAttribute("customerId") == null) {
                resp.setStatus(401);
                out.write("{\"success\":false,\"message\":\"Please login to submit a ticket\"}");
                return;
            }

            int customerId = (int) session.getAttribute("customerId");

            // 2. Parse JSON body
            BufferedReader reader = req.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);

            JsonObject body = JsonParser.parseString(sb.toString()).getAsJsonObject();

            String subject     = body.has("subject")     ? body.get("subject").getAsString().trim()     : "";
            String description = body.has("description") ? body.get("description").getAsString().trim() : "";
            String priority    = body.has("priority")    ? body.get("priority").getAsString().trim()    : "Low";

            // 3. Validate
            if (subject.isEmpty() || description.isEmpty()) {
                resp.setStatus(400);
                out.write("{\"success\":false,\"message\":\"Subject and description are required\"}");
                return;
            }
            if (subject.length() > 255) subject = subject.substring(0, 255);

            // 4. Insert
            int ticketId = CustomerSupportTicketController.createTicket(
                    customerId, subject, description, priority
            );

            if (ticketId > 0) {
                JsonObject result = new JsonObject();
                result.addProperty("success", true);
                result.addProperty("ticketId", ticketId);
                result.addProperty("message", "Ticket submitted successfully");
                out.write(result.toString());
            } else {
                resp.setStatus(500);
                out.write("{\"success\":false,\"message\":\"Failed to create ticket. Please try again.\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            out.write("{\"success\":false,\"message\":\"Server error: " + e.getMessage() + "\"}");
        } finally {
            out.flush();
            out.close();
        }
    }
}