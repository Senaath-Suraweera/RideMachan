package rentalcompany.drivers.service;

import common.util.PasswordServices;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.drivers.model.Driver;
import rentalcompany.drivers.controller.DriverDAO;


import java.io.*;
import java.sql.*;

@WebServlet("/driver/signup")
@MultipartConfig(maxFileSize = 16177215)
public class DriverSignupServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            HttpSession session = request.getSession(false);

            if(session == null || session.getAttribute("companyId") == null) {
                String requestedPage = request.getRequestURI();
                response.sendRedirect(request.getContextPath() + "companylogin.html?redirect=" + requestedPage);
                return;
            }


            int companyId = (int) session.getAttribute("companyId");

            String username = request.getParameter("username");
            String firstName = request.getParameter("firstname");
            String lastName = request.getParameter("lastname");
            String Area = request.getParameter("area");
            String email = request.getParameter("email");
            String mobileNumber = request.getParameter("mobilenumber");
            String description = request.getParameter("description");
            String password = request.getParameter("password");
            String nicNumber = request.getParameter("nicnumber");
            String licenceNumber = request.getParameter("licencenumber");
            String licenceDateStr = request.getParameter("licenceExpiration");

            Date licenceDate = null;
            if (licenceDateStr != null && !licenceDateStr.isEmpty()) {
                licenceDate = java.sql.Date.valueOf(licenceDateStr);
            }

            Part nicPart = request.getPart("nic");
            Part licencePart = request.getPart("driverlicence");

            byte[] nicBytes = nicPart != null ? nicPart.getInputStream().readAllBytes() : null;
            byte[] licenceBytes = licencePart != null ? licencePart.getInputStream().readAllBytes() : null;



            /*if (companyId == null) {
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Missing company ID\"}");
                return;
            }*/


            System.out.println("=== Driver Signup ==="); System.out.println("Username: " + username); System.out.println("First Name: " + firstName); System.out.println("Last Name: " + lastName); System.out.println("Area: " + Area); System.out.println("Email: " + email); System.out.println("Mobile: " + mobileNumber); System.out.println("Password: " + password); System.out.println("NIC Number: " + nicNumber); System.out.println("Licence Number: " + licenceNumber); System.out.println("Licence Expiration: " + licenceDateStr); System.out.println("Company ID: " + companyId);

            Driver driver = new Driver(
                    username, firstName, lastName, Area, email, mobileNumber,
                    description, password, nicNumber, nicBytes, licenceBytes, companyId, licenceNumber, licenceDate
            );

            boolean success = DriverDAO.insertDriver(driver);

            if (success) {
                response.getWriter().write("{\"status\":\"success\",\"message\":\"Driver registered successfully\"}");
            } else {
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Driver registration failed\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}