package individualprovider.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;

@WebServlet("/provider")
public class VehicleProviderLandingServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        // Redirect (or forward) to provider login page
        response.sendRedirect(request.getContextPath() + "/views/landing/providerlogin.html");
    }
}
