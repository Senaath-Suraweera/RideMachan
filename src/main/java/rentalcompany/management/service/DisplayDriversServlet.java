package rentalcompany.management.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.drivers.model.Driver;
import rentalcompany.drivers.controller.DriverDAO;
import com.google.gson.Gson;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;


@WebServlet("/displaydrivers")
public class DisplayDriversServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {


        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("companyId") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "companylogin.html?redirect=" + requestedPage);
                return;
            }

            int companyId = (int) session.getAttribute("companyId");

            List<Driver> drivers = DriverDAO.loadAllDriversByCompanyId(companyId);

            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");


            String json = new Gson().toJson(drivers);


            resp.getWriter().write(json);

        }catch(Exception e) {
            e.printStackTrace();
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }

    }
}
