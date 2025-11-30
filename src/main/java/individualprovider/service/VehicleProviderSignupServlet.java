package individualprovider.service;

import individualprovider.controller.VehicleProviderDAO;
import individualprovider.model.VehicleProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet("/provider/signup")
@MultipartConfig
public class VehicleProviderSignupServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            String username = request.getParameter("username");
            String email = request.getParameter("email");
            String password = request.getParameter("password");
            int companyId = Integer.parseInt(request.getParameter("companyid"));
            String firstName = request.getParameter("firstname");
            String lastName = request.getParameter("lastname");
            String phoneNumber = request.getParameter("phonenumber");
            String houseNumber = request.getParameter("housenumber");
            String street = request.getParameter("street");
            String city = request.getParameter("city");
            String zipcode = request.getParameter("zipcode");

            VehicleProvider provider = new VehicleProvider(username, email, password, companyId,
                    firstName, lastName, phoneNumber, houseNumber, street, city, zipcode);

            boolean success = VehicleProviderDAO.insertProvider(provider);

            if (success) {
                response.getWriter().write("{\"status\":\"success\",\"message\":\"Provider registered successfully\"}");
            } else {
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Provider registration failed\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}