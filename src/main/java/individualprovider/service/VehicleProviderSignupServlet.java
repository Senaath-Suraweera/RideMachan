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

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        addCors(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            String username = request.getParameter("username");
            String email = request.getParameter("email");
            String password = request.getParameter("password");

            // accept BOTH names: companyid (old) and company_id (from your HTML)
            String companyStr = request.getParameter("companyid");
            if (companyStr == null || companyStr.trim().isEmpty()) {
                companyStr = request.getParameter("company_id");
            }
            int companyId = 0;
            if (companyStr != null && !companyStr.trim().isEmpty()) {
                companyId = Integer.parseInt(companyStr.trim());
            }

            String firstName = request.getParameter("firstname");
            String lastName = request.getParameter("lastname");
            String phoneNumber = request.getParameter("phonenumber");
            String houseNumber = request.getParameter("housenumber");
            String street = request.getParameter("street");
            String city = request.getParameter("city");
            String zipcode = request.getParameter("zipcode");

            if (username == null || username.trim().isEmpty()
                    || email == null || email.trim().isEmpty()
                    || password == null || password.trim().isEmpty()) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"username, email, password are required\"}");
                return;
            }

            VehicleProvider provider = new VehicleProvider(
                    username.trim(), email.trim(), password, companyId,
                    firstName, lastName, phoneNumber, houseNumber, street, city, zipcode
            );

            boolean success = VehicleProviderDAO.insertProvider(provider);

            if (success) {
                response.setStatus(HttpServletResponse.SC_CREATED);
                response.getWriter().write("{\"status\":\"success\",\"message\":\"Provider registered successfully\"}");
            } else {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Provider registration failed\"}");
            }

        } catch (NumberFormatException nfe) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid company id\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }
}
