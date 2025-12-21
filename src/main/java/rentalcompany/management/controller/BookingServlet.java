package rentalcompany.management.controller; // your package name

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import rentalcompany.management.model.RentalCompanyBookings; // your model
import common.util.DBConnection; // your DB connection class






@WebServlet("/bookings")
public class BookingServlet extends HttpServlet {
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        List<RentalCompanyBookings> bookingsList = new ArrayList<>();

        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT b.booking_id, b.status, b.total_amount, b.payment_status, " +
                         "c.name AS customerName " +
                         "FROM companybookings b " +
                         "LEFT JOIN customer c ON b.customerid = c.customerid";
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                RentalCompanyBookings booking = new RentalCompanyBookings();
                booking.setBookingId(rs.getInt("booking_id"));
                booking.setStatus(rs.getString("status"));
                booking.setTotalAmount(rs.getDouble("total_amount"));
                booking.setPaymentStatus(rs.getString("payment_status"));
                booking.setCustomerName(rs.getString("customerName"));
                bookingsList.add(booking);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        request.setAttribute("bookingsList", bookingsList);
        request.getRequestDispatcher("booking-management.jsp").forward(request, response);
    }
}
