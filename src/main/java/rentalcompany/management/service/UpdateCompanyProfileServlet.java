package rentalcompany.management.service;


import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.management.controller.RentalCompanyDAO;
import rentalcompany.management.model.RentalCompany;

import java.io.IOException;

@WebServlet("/updatecompanyprofile")
public class UpdateCompanyProfileServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        try {

            HttpSession session = req.getSession(false);

            if (session == null || session.getAttribute("companyId") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "/companylogin.html?redirect=" + requestedPage);
                return;
            }

            int companyId = (int) session.getAttribute("companyId");

            String companyName = req.getParameter("companyName");
            String phone = req.getParameter("phone");
            String email = req.getParameter("email");
            String street = req.getParameter("street");
            String city = req.getParameter("city");


            boolean updated = RentalCompanyDAO.updateCompanyProfile(companyId, companyName, phone, email, street, city);

            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");

            resp.getWriter().write("{\"success\":" + updated + "}");

        } catch (Exception e) {

            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");

        }


    }

}
