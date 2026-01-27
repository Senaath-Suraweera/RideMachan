package admin.service;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import admin.controller.ReportController;

import java.io.IOException;

@WebServlet("/report/image/get")
public class ReportImageGetServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        try {
            int imageId = Integer.parseInt(req.getParameter("imageId"));
            byte[] bytes = ReportController.getImage(imageId);

            if (bytes == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return;
            }

            resp.setContentType("image/jpeg"); // change later if you store filetype
            resp.getOutputStream().write(bytes);

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
