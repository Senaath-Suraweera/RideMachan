package rentalcompany.management.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;

import rentalcompany.management.controller.RentalCompanyDAO;
import rentalcompany.management.model.RentalCompany;


@WebServlet("/loadcompanyprofile")
public class LoadCompanyProfileServlet extends HttpServlet{

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {


        try {

            HttpSession session = req.getSession(false);

            if (session == null || session.getAttribute("companyId") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "/companylogin.html?redirect=" + requestedPage);
                return;
            }

            int companyId = (int) session.getAttribute("companyId");

            RentalCompany company = RentalCompanyDAO.getCompanyById(companyId);

            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");

            Gson gson = new Gson();
            String json = gson.toJson(company);

            resp.getWriter().write(json);

        } catch (Exception e) {

            e.printStackTrace();
            resp.getWriter().write("{\"error\":\"" + e.getMessage() + "\"}");

        }

    }
}
