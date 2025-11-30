package rentalcompany.drivers.service;

import java.io.IOException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@WebServlet("/driver")
public class DriverLandingServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse res) throws IOException {
        // Redirect directly to your login page
        res.sendRedirect(req.getContextPath() + "/views/landing/driverlogin.html");
    }
}