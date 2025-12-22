package rentalcompany.management.service; // your package name


import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;


import rentalcompany.management.model.RentalCompanyBookings;

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

        RentalCompanyBookings booking1 = new RentalCompanyBookings();
        RentalCompanyBookings booking2 = new RentalCompanyBookings();


        booking1.setBookingId(101);
        booking1.setStatus("Active");
        booking1.setTotalAmount(20000);
        booking1.setPaymentStatus("Paid");
        booking1.setCustomerName("Jack");


        booking2.setBookingId(102);
        booking2.setStatus("Pending");
        booking2.setTotalAmount(15000);
        booking2.setPaymentStatus("Pending");
        booking2.setCustomerName("Kasun");


        RentalCompanyBookings[] bookings = {booking1, booking2};

        RentalCompanyBookings matchedbooking = null;


        for(int i=0; i<bookings.length; i++){
            if(bookings[i].getBookingId() == bookingId){
                matchedbooking = bookings[i];
                break;
            }
        }

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
