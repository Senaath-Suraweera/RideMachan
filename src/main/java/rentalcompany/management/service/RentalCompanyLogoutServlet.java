package rentalcompany.management.service;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.*;

@WebServlet(name = "RentalCompanyLogoutServlet", urlPatterns = {"/rentalcompanies/logout"})
public class RentalCompanyLogoutServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        HttpSession session = request.getSession(false);
        if (session != null) session.invalidate();

        // ✅ Redirect to login page after logout
        response.sendRedirect(request.getContextPath() + "/views/landing/companylogin.html");
    }

}
