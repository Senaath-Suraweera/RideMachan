package customer.service;

import common.util.DBConnection;
import customer.controller.CustomerDAO;
import customer.model.Customer;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.io.OutputStream;
import java.sql.Connection;

@WebServlet("/customer/profile/image")
public class CustomerImageServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("customerId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        int customerId = (int) session.getAttribute("customerId");
        String type = req.getParameter("type"); // "nic" | "license" | "passport"

        if (type == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        try (Connection conn = DBConnection.getConnection()) {
            CustomerDAO dao = new CustomerDAO(conn);
            Customer c = dao.getCustomerById(customerId);

            if (c == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return;
            }

            byte[] imageBytes = null;
            String custType = c.getCustomerType();

            // Whitelist by customer type — Local can't request passport, Foreign can't request NIC
            if ("nic".equalsIgnoreCase(type) && "LOCAL".equalsIgnoreCase(custType)) {
                imageBytes = c.getNicImage();
            } else if ("license".equalsIgnoreCase(type)) {
                imageBytes = c.getDriversLicenseImage();
            } else if ("passport".equalsIgnoreCase(type) && "FOREIGN".equalsIgnoreCase(custType)) {
                // Passport image is stored in nic_image column for foreign customers (per your DAO insert logic)
                imageBytes = c.getNicImage();
            }

            if (imageBytes == null || imageBytes.length == 0) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return;
            }

            resp.setContentType("image/jpeg"); // works for png too in most browsers
            resp.setContentLength(imageBytes.length);
            try (OutputStream os = resp.getOutputStream()) {
                os.write(imageBytes);
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
        }
    }
}