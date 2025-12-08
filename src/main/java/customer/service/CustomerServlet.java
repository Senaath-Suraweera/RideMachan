package customer.service;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

import common.util.DBConnection;
import common.util.PasswordServices;
import customer.controller.CustomerController;
import customer.model.Customer;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;

@WebServlet("/customer/profile")
@MultipartConfig(maxFileSize = 5 * 1024 * 1024)
public class CustomerServlet extends HttpServlet {

    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");

        String idParam = req.getParameter("id");
        if (idParam == null || idParam.isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Missing 'id' parameter\"}");
            return;
        }

        try (Connection conn = DBConnection.getConnection()) {
            int id = Integer.parseInt(idParam);
            PasswordServices ps = new PasswordServices();
            CustomerController controller = new CustomerController(conn, ps);

            Customer customer = controller.getCustomerById(id);

            if (customer == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"error\":\"Customer not found\"}");
            } else {
                String jsonResponse = gson.toJson(customer);
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write(jsonResponse);
            }

        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error\"}");
        }
    }

    // ========== POST: Update Profile ==========
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        req.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json;charset=UTF-8");

        try (Connection conn = DBConnection.getConnection()) {
            PasswordServices ps = new PasswordServices();
            CustomerController controller = new CustomerController(conn, ps);

            int id = Integer.parseInt(req.getParameter("customerId"));
            Customer customer = controller.getCustomerById(id);
            if (customer == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"error\":\"Customer not found\"}");
                return;
            }

            // --- Update editable fields ---
            customer.setFirstname(req.getParameter("firstname"));
            customer.setLastname(req.getParameter("lastname"));
            customer.setMobileNumber(req.getParameter("mobileNumber"));
            customer.setStreet(req.getParameter("street"));
            customer.setCity(req.getParameter("city"));
            customer.setZipCode(req.getParameter("zipCode"));
            customer.setCountry(req.getParameter("country"));

            // Optional uploads (if user re-uploads images)
            Part nicImagePart = req.getPart("nicImage");
            if (nicImagePart != null && nicImagePart.getSize() > 0) {
                try (InputStream in = nicImagePart.getInputStream()) {
                    customer.setNicImage(in.readAllBytes());
                }
            }

            Part dlImagePart = req.getPart("driversLicenseImage");
            if (dlImagePart != null && dlImagePart.getSize() > 0) {
                try (InputStream in = dlImagePart.getInputStream()) {
                    customer.setDriversLicenseImage(in.readAllBytes());
                }
            }

            boolean updated = controller.updateCustomer(customer);

            if (updated) {
                resp.setStatus(HttpServletResponse.SC_OK);
                resp.getWriter().write("{\"message\":\"Profile updated successfully\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                resp.getWriter().write("{\"error\":\"Failed to update profile\"}");
            }

        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error\"}");
        } catch (Exception e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"Invalid input\"}");
        }
    }
}
