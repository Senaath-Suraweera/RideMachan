package admin.service;

import admin.controller.AdminController;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet("/admin/check-email")
public class CheckEmailServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        request.setCharacterEncoding("UTF-8");

        String email = null;
        String ct = request.getContentType();

        if (ct != null && ct.toLowerCase().startsWith("application/json")) {
            try (var reader = request.getReader()) {
                JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
                email = json.has("email") ? json.get("email").getAsString().trim() : null;
            }
        } else {
            email = request.getParameter("email");
        }

        if (email == null || email.isEmpty()) {
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Email is required\"}");
            return;
        }

        boolean exists = AdminController.emailExists(email);

        JsonObject result = new JsonObject();
        result.addProperty("status", "success");
        result.addProperty("exists", exists);

        response.getWriter().write(result.toString());
    }
}