package rentalcompany.management.service; // your package name


import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;


import rentalcompany.management.model.RentalCompanyBookings;

import java.io.IOException;


@WebServlet("/displaybookings")
public class DisplayBookings extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        /*RentalCompanyBookings b1 = new RentalCompanyBookings();

        b1.setBookingId(101);
        b1.setStatus("Active");
        b1.setTotalAmount(20000);
        b1.setPaymentStatus("Paid");
        b1.setCustomerName("Ruwan");*/

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String json = """
            [
                {
                    "bookingId": 101,
                    "status": "Active",
                    "totalAmount": 20000,
                    "paymentStatus": "Paid",
                    "customerName": "Ruwan"
                },
                {
                    "bookingId": 102,
                    "status": "Pending",
                    "totalAmount": 15000,
                    "paymentStatus": "Unpaid",
                    "customerName": "Kasun"
                }
            ]
        """;

        resp.getWriter().write(json);

    }


}
