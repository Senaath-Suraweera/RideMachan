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

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {

        HttpSession session = request.getSession();

        if (session.getAttribute("verified").equals(true))
        {



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


            if ("LOCAL".equalsIgnoreCase(customer.getCustomerType())) {

                customer.setNicNumber(session.getAttribute("nicNumber").toString());
                customer.setDriversLicenseNumber(session.getAttribute("driversLicenseNumber").toString());

                byte[] nicImage = (byte[]) session.getAttribute("nicImage");

                customer.setNicImage(nicImage);

               byte[] driversLicenseImage = (byte[]) session.getAttribute("dlImage");

               customer.setDriversLicenseImage(driversLicenseImage);

            } else if ("FOREIGN".equalsIgnoreCase(customer.getCustomerType())) {

                customer.setPassportNumber(session.getAttribute("passportNumber").toString());
                customer.setInternationalDriversLicenseNumber(
                       session.getAttribute("internationalDriversLicenseNumber").toString());


                customer.setNicImage((byte[]) session.getAttribute("nicImage"));
                customer.setDriversLicenseImage((byte[]) session.getAttribute("dlImage"));
            }

            CustomerDAO.setVerified(session.getAttribute("email").toString());
            try (Connection conn = DBConnection.getConnection()) {
                PasswordServices passwordService = new PasswordServices();
                CustomerController controller = new CustomerController(conn, passwordService);

                int customerId = controller.signup(customer, session.getAttribute("password").toString());

                if (customerId > 0) {
                    CustomerDAO.setVerified(session.getAttribute("email").toString());
                    response.setContentType("application/json");
                    response.getWriter().write("{\"status\":\"success\"}");
                } else {
                    response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Signup failed");
                }
            } catch (SQLException e) {
                throw new ServletException("Database error during signup", e);
            }

        }else {
            System.out.println("email %s not verified");
            response.getWriter().write("{\"status\":\"error\"}");
        }
    }

}
