package admin.service;


import admin.controller.AdminController;
import admin.controller.SupportTicketController;
import admin.model.SupportTicket;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet("/admin/nic/verify")
public class ValidateAdminNICServlet  extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        response.getWriter().write("""
                    {"status":"success","message":"endpoint works"}
                """);


    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        String nic = null;
        String ct = request.getContentType();

        if (ct != null && ct.toLowerCase().startsWith("application/json")) {
            try (var reader = request.getReader()) {
                JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
                nic = json.has("nic") ? json.get("nic").getAsString().trim() : null;
            }
        } else {
            nic = request.getParameter("nic");
        }

        if (nic == null || nic.isEmpty()) {
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Email is required\"}");
            return;
        }

        boolean exists = AdminController.validateNic(nic);

        JsonObject result = new JsonObject();
        result.addProperty("status", "success");
        result.addProperty("exists", exists);

        response.getWriter().write(result.toString());
    }
}