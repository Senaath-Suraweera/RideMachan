package rentalcompany.management.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import jakarta.servlet.annotation.MultipartConfig;

import java.io.IOException;
import rentalcompany.drivers.model.Driver;
import rentalcompany.drivers.controller.DriverDAO;
import common.util.PasswordServices;


@WebServlet("/driver/add")
@MultipartConfig(maxFileSize = 16177215) // 16MB
public class AddDriverServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        request.setCharacterEncoding("UTF-8");

        try {
            String username = request.getParameter("username");
            String FirstName = request.getParameter("firstname");
            String LastName = request.getParameter("lastname");
            String Email = request.getParameter("email");
            String MobileNumber = request.getParameter("mobilenumber");
            String Description = request.getParameter("description");
            String password = request.getParameter("password");  // get the plain password
            String salt = PasswordServices.generateSalt();       // generate a random salt
            String hashedPassword = PasswordServices.hashPassword(password, salt); // hash the password with salt
            String nicNumber = request.getParameter("nicnumber");
            Part nicPart = request.getPart("nic");
            Part driverPart = request.getPart("driverlicence");
            int companyId = 2;


            byte[] nicBytes = nicPart.getInputStream().readAllBytes();
            byte[] driverBytes = driverPart.getInputStream().readAllBytes();

            Driver driver = new Driver(
                username,
                FirstName,
                LastName,
                Email,
                MobileNumber,
                Description,
                hashedPassword,
                salt,
                nicNumber,
                nicBytes,
                driverBytes,
                companyId
            );

            boolean success = DriverDAO.insertDriver(driver);

            response.getWriter().write("{\"status\":\"" + (success ? "success" : "error") + "\"}");

        }catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }

    }
}
