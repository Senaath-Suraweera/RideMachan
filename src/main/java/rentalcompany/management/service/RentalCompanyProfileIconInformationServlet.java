package rentalcompany.management.service;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.management.model.RentalCompany;
import com.google.gson.Gson;

import java.io.IOException;

@WebServlet(name = "RentalCompanyProfileServlet", urlPatterns = {"/rentalcompanies/profile"})
public class RentalCompanyProfileIconInformationServlet extends HttpServlet{

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);

        if (session != null) {

            RentalCompany company = (RentalCompany) session.getAttribute("rentalcompany");

            if (company != null) {

                Gson gson = new Gson();
                response.getWriter().write(gson.toJson(company));
                return;

            }

        }


        response.setStatus(401);
        response.getWriter().write("{\"status\":\"error\",\"message\":\"Not logged in\"}");

    }

}
