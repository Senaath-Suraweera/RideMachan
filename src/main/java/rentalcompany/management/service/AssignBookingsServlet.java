package rentalcompany.management.service;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import rentalcompany.management.controller.RentalCompanyBookingsDAO;
import rentalcompany.management.model.RentalCompanyBookings;

import java.io.BufferedReader;
import java.io.IOException;
import java.util.List;

@WebServlet("/assignbookingdriver")
public class AssignBookingsServlet extends HttpServlet {

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

            int driverId = Integer.parseInt(req.getParameter("driverId"));
            int bookingId = Integer.parseInt(req.getParameter("bookingId"));
            //String pickupLocation = req.getParameter("pickupLocation");
            //String dropoffLocation = req.getParameter("dropoffLocation");

            System.out.println("companyId=" + companyId + ", bookingId=" + bookingId);

            boolean success = RentalCompanyBookingsDAO.assignDriverToBooking(companyId, driverId, bookingId);

            if (success) {
                resp.getWriter().write("{\"status\":\"success\"}");
            } else {
                resp.getWriter().write("{\"status\":\"failed\"}");
            }



        }catch(Exception e) {

            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");

        }

    }

}
