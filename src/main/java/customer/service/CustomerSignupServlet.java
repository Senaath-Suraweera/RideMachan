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


    // in this it was set to save the licence image as the passport image i changed it to have different images to be sent from the front end need to change the front end payload
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


        String nicNumber = "";
        String driversLicenseNumber = "";
        byte[] nicImage = new byte[0];
        byte[] dlImage = new byte[0];

        String passportNumber = "";
        String internationalDriversLicenseNumber = "";
        byte[] licenceImage = new byte[0];
        byte[] passportImage = new byte[0];


//        Customer customer = new Customer();
//        customer.setUsername(username);
//        customer.setFirstname(firstname);
//        customer.setLastname(lastname);
//        customer.setEmail(email);
//        customer.setMobileNumber(mobile);
//        customer.setCustomerType(customerType);
//        customer.setStreet(street);
//        customer.setCity(city);
//        customer.setZipCode(zipCode);
//        customer.setCountry(country);

        // --- Handle LOCAL or FOREIGN specific fields ---
        if ("LOCAL".equalsIgnoreCase(customerType)) {

            nicNumber = req.getParameter("nicNumber");
            driversLicenseNumber = req.getParameter("driversLicenseNumber");

//            customer.setNicNumber(req.getParameter("nicNumber"));
//            customer.setDriversLicenseNumber(req.getParameter("driversLicenseNumber"));

            Part nicImagePart = req.getPart("nicImage");
            nicImage = nicImagePart.getInputStream().readAllBytes();

//            if (nicImagePart != null && nicImagePart.getSize() > 0) {
//                try (InputStream in = nicImagePart.getInputStream()) {
//                    customer.setNicImage(in.readAllBytes());
//                }
//            }

            Part dlImagePart = req.getPart("driversLicenseImage");
            dlImage = dlImagePart.getInputStream().readAllBytes();

//            if (dlImagePart != null && dlImagePart.getSize() > 0) {
//                try (InputStream in = dlImagePart.getInputStream()) {
//                    customer.setDriversLicenseImage(in.readAllBytes());
//                }
//            }

        } else if ("FOREIGN".equalsIgnoreCase(customerType)) {

            passportNumber = req.getParameter("passportNumber");
            internationalDriversLicenseNumber = req.getParameter("internationalDriversLicenseNumber");


            Part licenceImagePart = req.getPart("driversLicenseImage");
            licenceImage = licenceImagePart.getInputStream().readAllBytes();

            Part passportImagePart = req.getPart("passportImage");
            passportImage = passportImagePart.getInputStream().readAllBytes();

//            customer.setPassportNumber(req.getParameter("passportNumber"));
//            customer.setInternationalDriversLicenseNumber(
//                    req.getParameter("internationalDriversLicenseNumber"));
//
//            // you said both licence images remain the same for foreigners
//            Part licenceImagePart = req.getPart("driversLicenseImage");
//            if (licenceImagePart != null && licenceImagePart.getSize() > 0) {
//                try (InputStream in = licenceImagePart.getInputStream()) {
//                    byte[] imageBytes = in.readAllBytes();
//                    customer.setNicImage(imageBytes);
//                    customer.setDriversLicenseImage(imageBytes);
//                }
//            }
        }

        HttpSession session = req.getSession();

        try {
            session.setAttribute("username", username);
            session.setAttribute("firstname", firstname);
            session.setAttribute("lastname", lastname);
            session.setAttribute("email", email);
            session.setAttribute("mobileNumber", mobile);
            session.setAttribute("password", password);
            session.setAttribute("customerType", customerType);
            session.setAttribute("street", street);
            session.setAttribute("city", city);
            session.setAttribute("zipCode", zipCode);
            session.setAttribute("country", country);
            session.setAttribute("role", "customer");

            if (customerType.equalsIgnoreCase("LOCAL")) {
                session.setAttribute("nicNumber", nicNumber);
                session.setAttribute("driversLicenseNumber", driversLicenseNumber);
                session.setAttribute("nicImage", nicImage);
                session.setAttribute("dlImage", dlImage);
            } else if (customerType.equalsIgnoreCase("FOREIGN")) {
                session.setAttribute("passportNumber", passportNumber);
                session.setAttribute("internationalDriversLicenseNumber", internationalDriversLicenseNumber);
                session.setAttribute("dlImage", licenceImage);
                session.setAttribute("nicImage", passportImage);
            }

            resp.setContentType("application/json");
            resp.getWriter().write("{\"status\":\"success\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setContentType("application/json");
            resp.getWriter().write("{\"status\":\"error\"}");
        }


//        try (Connection conn = DBConnection.getConnection()) {
//            PasswordServices passwordService = new PasswordServices();
//            CustomerController controller = new CustomerController(conn, passwordService);
//
//            int customerId = controller.signup(customer, password);
//
//            if (customerId > 0) {
//                HttpSession session = req.getSession();
//                session.setAttribute("role", "customer");
//                session.setAttribute("email", email);
//                session.setAttribute("username", username);
//                session.setAttribute("customerId", customerId);
//                session.setAttribute("verified", false);
//
//                resp.sendRedirect(req.getContextPath() + "/views/landing/otp.html");
//            } else {
//                resp.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Signup failed");
//            }} catch (SQLException e) {
//            throw new ServletException("Database error during signup", e);
//    }



    }


}
