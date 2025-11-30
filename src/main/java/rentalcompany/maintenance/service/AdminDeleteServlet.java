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

@WebServlet("/admin/delete")
public class AdminDeleteServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            // Read request body
            String body = req.getReader().lines().reduce("", (acc, line) -> acc + line);
            System.out.println("Delete request body: " + body);

            JsonObject json = JsonParser.parseString(body).getAsJsonObject();
            int adminId = json.get("adminId").getAsInt();

            System.out.println("Deleting admin with ID: " + adminId);

            boolean deleted = AdminController.deleteAdmin(adminId);

            JsonObject res = new JsonObject();
            if (deleted) {
                res.addProperty("status", "success");
            } else {
                res.addProperty("status", "fail");
                res.addProperty("message", "No admin found with ID " + adminId);
            }
            resp.getWriter().write(res.toString());

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);

            JsonObject error = new JsonObject();
            error.addProperty("status", "fail");
            error.addProperty("message", "Exception: " + e.getMessage());
            resp.getWriter().write(error.toString());
        }
    }
}