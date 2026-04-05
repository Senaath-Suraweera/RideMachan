package admin.service;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import admin.controller.ReportController;

import java.io.IOException;
import java.io.InputStream;

@WebServlet("/report/image/upload")
@MultipartConfig(maxFileSize = 10 * 1024 * 1024, maxRequestSize = 30 * 1024 * 1024)
public class ReportImageUploadServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        JsonObject out = new JsonObject();

        try {
            int reportId = Integer.parseInt(req.getParameter("reportId"));
            JsonArray added = new JsonArray();

            for (Part part : req.getParts()) {
                if (!"images".equals(part.getName())) continue;

                try (InputStream in = part.getInputStream()) {
                    byte[] bytes = in.readAllBytes();
                    int imageId = ReportController.addImage(reportId, bytes);
                    if (imageId > 0) added.add(imageId);
                }
            }

            out.addProperty("status", "success");
            out.add("imageIds", added);
            resp.getWriter().write(out.toString());

        } catch (Exception e) {
            e.printStackTrace();
            out.addProperty("status", "fail");
            out.addProperty("message", "Exception: " + e.getMessage());
            resp.getWriter().write(out.toString());
        }
    }
}
