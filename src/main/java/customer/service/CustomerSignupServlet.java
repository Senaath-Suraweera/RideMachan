package customer.service;

import common.util.DBConnection;
import common.util.PasswordServices;
import customer.controller.CustomerController;
import customer.model.Customer;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.SQLException;

@WebServlet("/customer/signup")
@MultipartConfig(maxFileSize = 5 * 1024 * 1024) // 5MB limit for licence images
public class CustomerSignupServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        req.setCharacterEncoding("UTF-8");
        resp.setContentType("text/html;charset=UTF-8");

        String username = req.getParameter("username");
        String firstname = req.getParameter("firstname");
        String lastname = req.getParameter("lastname");
        String email = req.getParameter("email");
        String mobile = req.getParameter("mobileNumber");
        String password = req.getParameter("password");
        String customerType = req.getParameter("customerType");
        String street = req.getParameter("street");
        String city = req.getParameter("city");
        String zipCode = req.getParameter("zipCode");
        String country = req.getParameter("country");

        Customer customer = new Customer();
        customer.setUsername(username);
        customer.setFirstname(firstname);
        customer.setLastname(lastname);
        customer.setEmail(email);
        customer.setMobileNumber(mobile);
        customer.setCustomerType(customerType);
        customer.setStreet(street);
        customer.setCity(city);
        customer.setZipCode(zipCode);
        customer.setCountry(country);

        // --- Handle LOCAL or FOREIGN specific fields ---
        if ("LOCAL".equalsIgnoreCase(customerType)) {
            customer.setNicNumber(req.getParameter("nicNumber"));
            customer.setDriversLicenseNumber(req.getParameter("driversLicenseNumber"));

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

        } else if ("FOREIGN".equalsIgnoreCase(customerType)) {
            customer.setPassportNumber(req.getParameter("passportNumber"));
            customer.setInternationalDriversLicenseNumber(
                    req.getParameter("internationalDriversLicenseNumber"));

            // you said both licence images remain the same for foreigners
            Part licenceImagePart = req.getPart("driversLicenseImage");
            if (licenceImagePart != null && licenceImagePart.getSize() > 0) {
                try (InputStream in = licenceImagePart.getInputStream()) {
                    byte[] imageBytes = in.readAllBytes();
                    customer.setNicImage(imageBytes);
                    customer.setDriversLicenseImage(imageBytes);
                }
            }
        }

        // --- Save in DB ---
        try (Connection conn = DBConnection.getConnection()) {
            PasswordServices passwordService = new PasswordServices();
            CustomerController controller = new CustomerController(conn, passwordService);

            int customerId = controller.signup(customer, password);

            if (customerId > 0) {
                HttpSession session = req.getSession();
                session.setAttribute("role", "customer");
                session.setAttribute("email", email);
                session.setAttribute("username", username);
                session.setAttribute("customerId", customerId);
                session.setAttribute("verified", false);

                resp.sendRedirect(req.getContextPath() + "/views/landing/otp.html");
            } else {
                resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Signup failed");
            }

        } catch (SQLException e) {
            throw new ServletException("Database error during signup", e);
        }
    }
}
