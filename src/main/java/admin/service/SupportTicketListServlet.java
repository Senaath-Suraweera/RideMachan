package admin.service;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import admin.controller.SupportTicketController;
import admin.model.SupportTicket;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet(name = "SupportTicketList", urlPatterns = "/support/tickets/list")
public class SupportTicketListServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String status = request.getParameter("status");   // pending/ongoing/resolved
        String role = request.getParameter("role");       // customer/driver/company
        String priority = request.getParameter("priority"); // low/medium/high

        List<SupportTicket> tickets = SupportTicketController.getAllTickets(status, role, priority);

        Gson gson = new Gson();
        String json = gson.toJson(Map.of("status", "success", "tickets", tickets));
        response.getWriter().write(json);
    }
}
