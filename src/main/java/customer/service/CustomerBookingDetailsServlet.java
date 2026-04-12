package customer.service;

import com.google.gson.Gson;
import common.util.DBConnection;
import customer.controller.CustomerBookingDetailsDAO;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.util.Map;

@WebServlet("/customer/booking-details")
public class CustomerBookingDetailsServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        // ── 1. Session / auth check ──────────────────
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("customerId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\"success\":false,\"message\":\"Please login to view booking details\"}");
            return;
        }
        int customerId = (int) session.getAttribute("customerId");

        // ── 2. Read ride_id param ────────────────────
        String rideId = req.getParameter("id");
        if (rideId == null || rideId.trim().isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"success\":false,\"message\":\"Missing booking id\"}");
            return;
        }

        // ── 3. Query DB ──────────────────────────────
        try (Connection conn = DBConnection.getConnection()) {
            CustomerBookingDetailsDAO dao = new CustomerBookingDetailsDAO(conn);
            Map<String, Object> booking = dao.getBookingDetails(rideId.trim(), customerId);

            if (booking == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.write("{\"success\":false,\"message\":\"Booking not found\"}");
                return;
            }

            // Wrap in a success envelope so the JS can check .success easily
            String payload = "{\"success\":true,\"booking\":" + gson.toJson(booking) + "}";
            out.write(payload);

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"success\":false,\"message\":\"Server error: " + e.getMessage() + "\"}");
        }
    }
}