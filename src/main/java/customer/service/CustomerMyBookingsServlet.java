package customer.service;

import com.google.gson.Gson;
import customer.controller.CustomerMyBookingsDAO;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

/**
 * Returns the logged-in customer's bookings (active / upcoming / past) as JSON.
 * Consumed by /views/customer/js/bookings.js on the My Bookings page.
 */
@WebServlet("/customer/my-bookings")
public class CustomerMyBookingsServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        // ---- 1. Auth check ----
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("customerId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\"success\":false,\"message\":\"Please login to view your bookings\"}");
            return;
        }

        int customerId = (int) session.getAttribute("customerId");

        // ---- 2. Fetch ----
        try {
            CustomerMyBookingsDAO dao = new CustomerMyBookingsDAO();
            List<Map<String, Object>> bookings = dao.getBookingsByCustomerId(customerId);

            // Wrap in an envelope so the frontend can detect success/error uniformly
            out.write("{\"success\":true,\"bookings\":" + gson.toJson(bookings) + "}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"success\":false,\"message\":\"Failed to load bookings\"}");
        }
    }
}