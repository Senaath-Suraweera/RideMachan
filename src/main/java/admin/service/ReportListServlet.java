package admin.service;

import com.google.gson.Gson;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import admin.controller.ReportController;
import admin.model.Report;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet(name = "ReportList", urlPatterns = "/reports/list")
public class ReportListServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String status = req.getParameter("status");     // pending/reviewed/resolved/closed
        String category = req.getParameter("category"); // vehicle/behavior/payment/app/safety
        String role = req.getParameter("role");         // Driver/Customer (reported party)
        String search = req.getParameter("search");     // text

        List<Report> reports = ReportController.listReports(status, category, role, search);

        Gson gson = new Gson();
        resp.getWriter().write(gson.toJson(Map.of("status", "success", "reports", reports)));
    }
}
