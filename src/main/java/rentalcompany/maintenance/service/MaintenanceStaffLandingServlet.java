package rentalcompany.maintenance.service;

import java.io.IOException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/maintenance")
public class MaintenanceStaffLandingServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        // Redirect to your maintenance login page
        res.sendRedirect(req.getContextPath() + "/views/landing/maintenancelogin.html");
    }
}
