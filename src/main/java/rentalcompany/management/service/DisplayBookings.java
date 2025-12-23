package rentalcompany.management.service; // your package name


import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;


import rentalcompany.management.model.RentalCompanyBookings;
import rentalcompany.management.controller.RentalCompanyBookingsDAO;

import java.io.IOException;
import com.google.gson.Gson;


@WebServlet("/displaybookings")
public class DisplayBookings extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        String bookingIdParam = req.getParameter("bookingId");

        if (bookingIdParam == null) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"error\":\"bookingId is required\"}");
            return;
        }


        int bookingId = Integer.parseInt(bookingIdParam);



        RentalCompanyBookings matchedbooking = RentalCompanyBookingsDAO.DisplayBookingAccordingTOId(bookingId);




        if (matchedbooking == null) {
            resp.getWriter().write("{}"); // return empty object
            return;
        }


        Gson gson = new Gson();
        String json = gson.toJson(matchedbooking);


        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");



        resp.getWriter().write(json);

    }


}
