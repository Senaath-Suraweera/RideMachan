package admin.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import admin.controller.ReportController;

import java.io.IOException;

@WebServlet("/report/delete")
public class ReportDeleteServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            String body = req.getReader().lines().reduce("", (a, b) -> a + b);
            JsonObject json = JsonParser.parseString(body).getAsJsonObject();

            int reportId = json.get("reportId").getAsInt();

            boolean ok = ReportController.deleteReport(reportId);

            JsonObject out = new JsonObject();
            out.addProperty("status", ok ? "success" : "fail");
            out.addProperty("message", ok ? "Report deleted" : "Delete failed");
            resp.getWriter().write(out.toString());

        } catch (Exception e) {
            e.printStackTrace();
            JsonObject out = new JsonObject();
            out.addProperty("status", "error");
            out.addProperty("message", "Exception: " + e.getMessage());
            resp.getWriter().write(out.toString());
        }
    }
}
