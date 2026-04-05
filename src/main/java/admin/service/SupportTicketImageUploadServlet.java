package admin.service;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import admin.controller.SupportTicketController;

import java.io.IOException;
import java.io.InputStream;

@WebServlet("/support/ticket/image/upload")
@MultipartConfig(maxFileSize = 10 * 1024 * 1024, maxRequestSize = 30 * 1024 * 1024)
public class SupportTicketImageUploadServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        JsonObject res = new JsonObject();

        try {
            int ticketId = Integer.parseInt(request.getParameter("ticketId"));

            JsonArray added = new JsonArray();

            for (Part part : request.getParts()) {
                if (!"images".equals(part.getName())) continue;

                try (InputStream in = part.getInputStream()) {
                    byte[] bytes = in.readAllBytes();
                    int imageId = SupportTicketController.addImage(ticketId, bytes);
                    if (imageId > 0) added.add(imageId);
                }
            }

            res.addProperty("status", "success");
            res.add("imageIds", added);

            response.getWriter().write(res.toString());

        } catch (Exception e) {
            e.printStackTrace();
            res.addProperty("status", "fail");
            res.addProperty("message", "Exception: " + e.getMessage());
            response.getWriter().write(res.toString());
        }
    }
}
