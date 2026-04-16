package rentalcompany.management.service;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.drivers.model.Driver;
import rentalcompany.drivers.controller.DriverDAO;

import java.io.IOException;
import java.util.List;


@WebServlet("/display/trip/available/drivers")
public class LoadTripAvailableDriversServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("companyId") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "/companylogin.html?redirect=" + requestedPage);
                return;
            }

            int companyId = (int) session.getAttribute("companyId");


            String bookingIdParam = req.getParameter("bookingId");
            int bookingId = Integer.parseInt(bookingIdParam);


            System.out.println("companyId=" + companyId + ", bookingId=" + bookingId);

            List<Driver> drivers = DriverDAO.loadTripAvailableDrivers(companyId, bookingId);

            Gson json = new Gson();
            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");

            resp.getWriter().write(json.toJson(drivers));



        }catch(Exception e) {

            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");

        }

    }

}
