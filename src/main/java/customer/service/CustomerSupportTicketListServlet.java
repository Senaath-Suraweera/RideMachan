package customer.service;

import admin.model.SupportTicket;
import admin.controller.SupportTicketController;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import customer.controller.CustomerSupportTicketController;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

@WebServlet("/customer/support-ticket/my-tickets")
public class CustomerSupportTicketListServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        try {
            HttpSession session = req.getSession(false);
            if (session == null || session.getAttribute("customerId") == null) {
                resp.setStatus(401);
                out.write("{\"success\":false,\"message\":\"Not logged in\"}");
                return;
            }

            int customerId = (int) session.getAttribute("customerId");

            List<SupportTicket> tickets = CustomerSupportTicketController.getMyTickets(customerId);

            JsonArray arr = new JsonArray();
            for (SupportTicket t : tickets) {
                JsonObject o = new JsonObject();
                o.addProperty("ticketId",    t.getTicketId());
                o.addProperty("displayId",   String.format("TKT-%d-%03d",
                        java.time.Year.now().getValue(), t.getTicketId()));
                o.addProperty("subject",     t.getSubject());
                o.addProperty("description", t.getDescription());
                o.addProperty("status",      t.getStatus());   // pending / ongoing / resolved / closed
                o.addProperty("priority",    t.getPriority()); // low / medium / high / urgent
                o.addProperty("createdAt",   t.getCreatedAt());
                o.addProperty("updatedAt",   t.getUpdatedAt());

                // Attach image ids so frontend can render thumbnails
                JsonArray imgs = new JsonArray();
                for (Integer id : SupportTicketController.listImageIds(t.getTicketId())) {
                    imgs.add(id);
                }
                o.add("imageIds", imgs);

                arr.add(o);
            }

            JsonObject result = new JsonObject();
            result.addProperty("success", true);
            result.add("tickets", arr);
            out.write(result.toString());

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