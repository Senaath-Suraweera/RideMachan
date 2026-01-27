package admin.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import admin.controller.SupportTicketController;

import java.io.IOException;

@WebServlet("/support/ticket/image/delete")
public class SupportTicketImageDeleteServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        try {
            String body = req.getReader().lines().reduce("", (acc, line) -> acc + line);
            JsonObject json = JsonParser.parseString(body).getAsJsonObject();

            int imageId = json.get("imageId").getAsInt();

            boolean deleted = SupportTicketController.deleteImage(imageId);

            JsonObject res = new JsonObject();
            if (deleted) {
                res.addProperty("status", "success");
            } else {
                res.addProperty("status", "fail");
                res.addProperty("message", "No image found with ID " + imageId);
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
