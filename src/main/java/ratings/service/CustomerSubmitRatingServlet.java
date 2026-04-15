package ratings.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import ratings.controller.RatingDAO;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;

/**
 * POST /customer/rating/submit
 *
 * Expected JSON body:
 * {
 *   "rideId":        "RIDE-xxx",
 *   "vehicleId":     12,
 *   "driverId":      5,        // 0 or absent for self-drive
 *   "companyId":     3,
 *   "driverRating":  4,        // 1-5, ignored for self-drive
 *   "vehicleRating": 5,        // 1-5
 *   "review":        "Great experience!"  // optional
 * }
 */
@WebServlet("/customer/rating/submit")
public class CustomerSubmitRatingServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        // ── 1. Auth check ──
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("customerId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\"success\":false,\"message\":\"Please login to submit a rating\"}");
            return;
        }

        int customerId = (int) session.getAttribute("customerId");

        // ── 2. Parse request body ──
        try {
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = req.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
            }

            JsonObject json = JsonParser.parseString(sb.toString()).getAsJsonObject();

            String rideId       = json.has("rideId")       ? json.get("rideId").getAsString()    : null;
            int vehicleId       = json.has("vehicleId")    ? json.get("vehicleId").getAsInt()     : 0;
            int driverId        = json.has("driverId")     ? json.get("driverId").getAsInt()      : 0;
            int companyId       = json.has("companyId")    ? json.get("companyId").getAsInt()     : 0;
            int driverRating    = json.has("driverRating") ? json.get("driverRating").getAsInt()  : 0;
            int vehicleRating   = json.has("vehicleRating")? json.get("vehicleRating").getAsInt() : 0;
            String review       = json.has("review")       ? json.get("review").getAsString()     : null;

            // ── 3. Validate ──
            if (vehicleId == 0 || companyId == 0) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write("{\"success\":false,\"message\":\"Missing vehicle or company information\"}");
                return;
            }

            if (vehicleRating < 1 || vehicleRating > 5) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write("{\"success\":false,\"message\":\"Vehicle rating must be between 1 and 5\"}");
                return;
            }

            if (driverId > 0 && (driverRating < 1 || driverRating > 5)) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write("{\"success\":false,\"message\":\"Driver rating must be between 1 and 5\"}");
                return;
            }

            // ── 4. Check for duplicate rating ──
            RatingDAO dao = new RatingDAO();
            if (dao.hasCustomerRatedVehicle(customerId, vehicleId)) {
                out.write("{\"success\":false,\"message\":\"You have already rated this booking\"}");
                return;
            }

            // ── 5. Save ratings ──
            boolean saved = dao.submitBookingRatings(
                    customerId, companyId,
                    driverId, vehicleId,
                    driverRating, vehicleRating,
                    review
            );

            if (saved) {
                out.write("{\"success\":true,\"message\":\"Rating submitted successfully\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.write("{\"success\":false,\"message\":\"Failed to save rating\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"success\":false,\"message\":\"An error occurred while processing your rating\"}");
        }
    }
}