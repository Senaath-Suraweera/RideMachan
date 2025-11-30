package rentalcompany.drivers.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import rentalcompany.drivers.model.Driver;
import rentalcompany.drivers.dao.DriverDAO;


import java.io.*;

@WebServlet("/driver/signup")
@MultipartConfig(maxFileSize = 16177215)
public class DriverSignupServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            String username = request.getParameter("username");
            String firstName = request.getParameter("firstname");
            String lastName = request.getParameter("lastname");
            String email = request.getParameter("email");
            String mobileNumber = request.getParameter("mobilenumber");
            String description = request.getParameter("description");
            String password = request.getParameter("password");
            String nicNumber = request.getParameter("nicnumber");
            String companyIdStr = request.getParameter("companyid");

            if (companyIdStr == null || companyIdStr.isEmpty()) {
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Missing company ID\"}");
                return;
            }
            int companyId = Integer.parseInt(companyIdStr);

            Part nicPart = request.getPart("nic");
            Part licencePart = request.getPart("driverslicence");

            byte[] nicBytes = nicPart != null ? nicPart.getInputStream().readAllBytes() : null;
            byte[] licenceBytes = licencePart != null ? licencePart.getInputStream().readAllBytes() : null;

            Driver driver = new Driver(
                    username, firstName, lastName, email, mobileNumber,
                    description, password, nicNumber, nicBytes, licenceBytes, companyId
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