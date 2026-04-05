package rentalcompany.management.service; // your package name

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.management.model.RentalCompanyBookings;
import rentalcompany.management.controller.RentalCompanyBookingsDAO;
import com.google.gson.Gson;
import java.io.IOException;
import java.util.List;


@WebServlet("/displaybookings")
public class DisplayBookingsServlet extends HttpServlet {

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

            List<RentalCompanyBookings> Bookings = RentalCompanyBookingsDAO.loadBookingsByCompanyId(companyId);

            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");


            if (Bookings == null || Bookings.isEmpty()) {
                resp.getWriter().write("[]"); // return empty object
                return;
            }

            String json = new Gson().toJson(Bookings);


            resp.getWriter().write(json);

        }catch(Exception e) {

            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");

        }

    }


}
