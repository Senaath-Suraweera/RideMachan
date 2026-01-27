package admin.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import admin.controller.SupportTicketController;
import admin.model.SupportTicket;

import java.io.IOException;
import java.util.List;

@WebServlet(name = "SupportTicketGet", urlPatterns = "/support/ticket/get")
public class SupportTicketGetServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String id = request.getParameter("id"); // numeric OR TKT-2024-001
        SupportTicket ticket = SupportTicketController.getTicket(id);

        JsonObject res = new JsonObject();

        if (ticket == null) {
            res.addProperty("status", "fail");
            res.addProperty("message", "Ticket not found");
            response.getWriter().write(res.toString());
            return;
        }

        // get image ids for the ticket
        List<Integer> imageIds = SupportTicketController.listImageIds(ticket.getTicketId());

        Gson gson = new Gson();
        res.addProperty("status", "success");
        res.add("ticket", gson.toJsonTree(ticket));
        res.add("imageIds", gson.toJsonTree(imageIds));

        response.getWriter().write(res.toString());
    }
}
