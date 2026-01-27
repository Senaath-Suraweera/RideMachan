package admin.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import admin.controller.ReportController;
import admin.model.Report;

import java.io.IOException;
import java.util.List;

@WebServlet(name = "ReportGet", urlPatterns = "/report/get")
public class ReportGetServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String id = req.getParameter("id"); // numeric or RPT-2026-001

        Report r = ReportController.getReport(id);
        JsonObject out = new JsonObject();

        if (r == null) {
            out.addProperty("status", "fail");
            out.addProperty("message", "Report not found");
            resp.getWriter().write(out.toString());
            return;
        }

        List<Integer> imageIds = ReportController.listImageIds(r.getReportId());

        Gson gson = new Gson();
        out.addProperty("status", "success");
        out.add("report", gson.toJsonTree(r));
        out.add("imageIds", gson.toJsonTree(imageIds));

        resp.getWriter().write(out.toString());
    }
}
