package customer.service;

import common.util.DBConnection;
import common.util.PasswordServices;
import customer.controller.CustomerController;
import customer.controller.CustomerDAO;
import customer.model.Customer;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.sql.Connection;
import java.sql.SQLException;

@WebServlet("/customer/save")
public class CustomerSaveToDBServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        System.out.println("CustomerSaveToDBServlet");

        HttpSession session = request.getSession();

        // Check if verified (cast to Boolean to avoid NPE, matching admin flow)
        Boolean verified = (Boolean) session.getAttribute("verified");

        if (verified == null || !verified) {
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Email not verified\"}");
            System.out.println("Email not verified");
            return;
        }

        // Build Customer object from session attributes
        Customer customer = new Customer();
        customer.setUsername(session.getAttribute("username").toString());
        customer.setFirstname(session.getAttribute("firstname").toString());
        customer.setLastname(session.getAttribute("lastname").toString());
        customer.setEmail(session.getAttribute("email").toString());
        customer.setMobileNumber(session.getAttribute("mobileNumber").toString());
        customer.setCustomerType(session.getAttribute("customerType").toString());
        customer.setStreet(session.getAttribute("street").toString());
        customer.setCity(session.getAttribute("city").toString());
        customer.setZipCode(session.getAttribute("zipCode").toString());
        customer.setCountry(session.getAttribute("country").toString());

        String customerType = customer.getCustomerType();

        if ("LOCAL".equalsIgnoreCase(customerType)) {
            customer.setNicNumber(session.getAttribute("nicNumber").toString());
            customer.setDriversLicenseNumber(session.getAttribute("driversLicenseNumber").toString());
            customer.setNicImage((byte[]) session.getAttribute("nicImage"));
            customer.setDriversLicenseImage((byte[]) session.getAttribute("dlImage"));

        } else if ("FOREIGN".equalsIgnoreCase(customerType)) {
            customer.setPassportNumber(session.getAttribute("passportNumber").toString());
            customer.setInternationalDriversLicenseNumber(
                    session.getAttribute("internationalDriversLicenseNumber").toString());
            customer.setNicImage((byte[]) session.getAttribute("nicImage"));
            customer.setDriversLicenseImage((byte[]) session.getAttribute("dlImage"));
        }

        try (Connection conn = DBConnection.getConnection()) {
            PasswordServices passwordService = new PasswordServices();
            CustomerController controller = new CustomerController(conn, passwordService);

            int customerId = controller.signup(customer, session.getAttribute("password").toString());

            if (customerId > 0) {
                // Set verified in database
                CustomerDAO.setVerified(session.getAttribute("email").toString());

                // Clear sensitive data from session
                session.removeAttribute("password");

                response.setContentType("application/json");
                String redirectUrl = request.getContextPath() + "/views/customer/pages/home.html";
                response.getWriter().write("{\"status\":\"success\",\"redirectUrl\":\"" + redirectUrl + "\"}");

                System.out.printf("Customer data inserted successfully.\n\tEmail: %s\n\tUsername: %s\n",
                        customer.getEmail(), customer.getUsername());
            } else {
                response.setContentType("application/json");
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Failed to insert data\"}");
                System.out.println("Customer data insertion failed.");
            }
        } catch (SQLException e) {
            e.printStackTrace();
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Database error during signup\"}");
        }
    }
}