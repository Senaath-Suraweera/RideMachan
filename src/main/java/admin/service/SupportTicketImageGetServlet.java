package admin.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import admin.controller.SupportTicketController;

import java.io.IOException;

@WebServlet("/support/ticket/image/get")
public class SupportTicketImageGetServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        try {
            int imageId = Integer.parseInt(request.getParameter("imageId"));
            byte[] img = SupportTicketController.getImage(imageId);

            if (img == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return;
            }

            // If you later store file type, change this.
            response.setContentType("image/jpeg");
            response.getOutputStream().write(img);

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
        }
    }
}
