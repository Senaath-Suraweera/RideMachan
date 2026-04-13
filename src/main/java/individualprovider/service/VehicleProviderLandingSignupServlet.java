package individualprovider.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/provider/landing/signup")
@MultipartConfig
public class VehicleProviderLandingSignupServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        request.setCharacterEncoding("UTF-8");
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            String username = trim(request.getParameter("username"));
            String email = trim(request.getParameter("email"));
            String password = request.getParameter("password");

            String firstName = trim(request.getParameter("firstname"));
            String lastName = trim(request.getParameter("lastname"));
            String phoneNumber = trim(request.getParameter("phonenumber"));
            String houseNumber = trim(request.getParameter("housenumber"));
            String street = trim(request.getParameter("street"));
            String city = trim(request.getParameter("city"));
            String zipcode = trim(request.getParameter("zipcode"));

            if (isBlank(username) || isBlank(email) || isBlank(password)) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Username, email, and password are required\"}");
                return;
            }

            HttpSession session = request.getSession();
            session.setAttribute("role", "provider");
            session.setAttribute("verified", false);

            session.setAttribute("username", username);
            session.setAttribute("email", email);
            session.setAttribute("password", password);

            session.setAttribute("firstname", firstName);
            session.setAttribute("lastname", lastName);
            session.setAttribute("phonenumber", phoneNumber);
            session.setAttribute("housenumber", houseNumber);
            session.setAttribute("street", street);
            session.setAttribute("city", city);
            session.setAttribute("zipcode", zipcode);

            response.getWriter().write("{\"status\":\"success\",\"message\":\"Provider data saved to session\"}");

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Server error during provider signup\"}");
        }
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}