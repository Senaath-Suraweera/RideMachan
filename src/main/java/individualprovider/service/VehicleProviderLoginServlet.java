package individualprovider.service;

import individualprovider.controller.VehicleProviderDAO;
import individualprovider.model.VehicleProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@MultipartConfig
@WebServlet("/provider/login")
public class VehicleProviderLoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            String email = request.getParameter("email");
            String password = request.getParameter("password");

            VehicleProvider provider = VehicleProviderDAO.loginProvider(email, password);

            if (provider != null) {
                HttpSession session = request.getSession();
                session.setAttribute("provider", provider);
                session.setAttribute("providerId", provider.getProviderId());
                session.setAttribute("companyId", provider.getCompanyId());
                response.getWriter().write("{\"status\":\"success\",\"message\":\"Login successful\"}");
            } else {
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid username or password\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}	