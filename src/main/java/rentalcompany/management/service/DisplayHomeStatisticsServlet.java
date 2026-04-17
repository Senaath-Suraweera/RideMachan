package rentalcompany.management.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.management.controller.RentalCompanyBookingsDAO;
import rentalcompany.drivers.controller.DriverDAO;

import java.io.IOException;


@WebServlet("/displaystatistics")
public class DisplayHomeStatisticsServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {


        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("companyId") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "companylogin.html?redirect=" + requestedPage);
                return;
            }

            int companyId = (int) session.getAttribute("companyId");

            int activeDrivers = DriverDAO.getActiveDriversCount(companyId);
            int confirmedBookingsCount = RentalCompanyBookingsDAO.getConfirmedBookingsCount(companyId);
            int cancelledBookingsCount = RentalCompanyBookingsDAO.getCancelledBookingsCount(companyId);
            int monthlyRevenue = RentalCompanyBookingsDAO.getMonthlyRevenue(companyId);
            int canelledBookingsMonthlyRevenueLost = RentalCompanyBookingsDAO.getMonthlyCancelledRevenueLoss(companyId);

            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");


            String json = "{"
                        + "\"activeDrivers\":" + activeDrivers + ","
                        + "\"ConfirmedBookings\":" + confirmedBookingsCount + ","
                        + "\"CancelledBookings\":" + cancelledBookingsCount + ","
                        + "\"MonthlyRevenue\":" + monthlyRevenue + ","
                        + "\"MonthlyRevenueLostDueToCancelled\":" + canelledBookingsMonthlyRevenueLost
                        + "}";

            resp.getWriter().write(json);



        }catch(Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }

    }

}
