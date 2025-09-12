package admin.service;

import admin.controller.AdminController;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

@WebServlet("/admin/update")
public class AdminUpdateServlet extends HttpServlet {

    private AdminController adminController = new AdminController();

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        PrintWriter out = response.getWriter();

        try {
            StringBuilder sb = new StringBuilder();
            BufferedReader reader = request.getReader();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }

            JsonObject reqJson = JsonParser.parseString(sb.toString()).getAsJsonObject();

            int adminId = reqJson.get("adminId").getAsInt();
            String username = reqJson.get("username").getAsString();
            String email = reqJson.get("email").getAsString();
            String phoneNumber = reqJson.get("phoneNumber").getAsString();

            boolean updated = adminController.updateAdmin(adminId, username, email, phoneNumber);

            JsonObject res = new JsonObject();
            if (updated) {
                res.addProperty("status", "success");
                res.addProperty("message", "Admin updated successfully");
            } else {
                res.addProperty("status", "fail");
                res.addProperty("message", "Update failed");
            }
            out.print(res);

        } catch (Exception e) {
            e.printStackTrace();
            JsonObject res = new JsonObject();
            res.addProperty("status", "error");
            res.addProperty("message", "Exception: " + e.getMessage());
            out.print(res);
        } finally {
            out.flush();
            out.close();
        }
    }
}
