package admin.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import admin.controller.ReportController;

import java.io.IOException;

@WebServlet("/report/update")
public class ReportUpdateServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            String body = req.getReader().lines().reduce("", (a, b) -> a + b);
            JsonObject json = JsonParser.parseString(body).getAsJsonObject();

            int reportId = json.get("reportId").getAsInt();
            String status = json.get("status").getAsString();     // Pending/Reviewed/Resolved/Closed
            String priority = json.get("priority").getAsString(); // Low/Medium/High/Urgent

            boolean ok = ReportController.updateReport(reportId, status, priority);

            JsonObject out = new JsonObject();
            out.addProperty("status", ok ? "success" : "fail");
            out.addProperty("message", ok ? "Report updated" : "Update failed");
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
