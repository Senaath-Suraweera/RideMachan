package admin.service;

import com.google.gson.Gson;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import admin.controller.ReportController;

import java.io.IOException;
import java.util.Map;

@WebServlet(name = "ReportStats", urlPatterns = "/reports/stats")
public class ReportStatsServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            Map<String, Integer> stats = ReportController.getReportStats();

            Gson gson = new Gson();
            resp.getWriter().write(gson.toJson(Map.of(
                    "status", "success",
                    "stats", stats
            )));

        } catch (Exception e) {
            e.printStackTrace();

            Gson gson = new Gson();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write(gson.toJson(Map.of(
                    "status", "error",
                    "message", "Failed to load report stats"
            )));
        }
    }
}