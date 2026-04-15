package customer.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import customer.controller.CustomerDriverDAO;
import customer.model.CustomerDriverProfile;
import ratings.controller.RatingDAO;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;

/**
 * GET /customer/driver/profile?driverId=5
 *
 * Returns:
 * {
 *   "success": true,
 *   "driver": {
 *     "id": 5, "firstName": "...", "lastName": "...", "fullName": "...",
 *     "initial": "LP", "email": "...", "mobileNumber": "...",
 *     "description": "...", "area": "...", "location": "...",
 *     "experienceYears": 8, "totalRides": 250,
 *     "companyId": 3, "companyName": "...", "companyCity": "...",
 *     "verified": true,
 *     "averageRating": 4.7, "totalReviews": 152
 *   }
 * }
 */
@WebServlet("/customer/driver/profile")
public class CustomerDriverProfileServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        // ── 1. Auth check ──
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("customerId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{\"success\":false,\"message\":\"Please login to view driver profile\"}");
            return;
        }

        // ── 2. Parse driverId ──
        String driverIdStr = req.getParameter("driverId");
        if (driverIdStr == null || driverIdStr.trim().isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"success\":false,\"message\":\"driverId is required\"}");
            return;
        }

        int driverId;
        try {
            driverId = Integer.parseInt(driverIdStr.trim());
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"success\":false,\"message\":\"Invalid driverId\"}");
            return;
        }

        // ── 3. Load driver ──
        try {
            CustomerDriverProfile driver = CustomerDriverDAO.getDriverProfileById(driverId);
            if (driver == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.write("{\"success\":false,\"message\":\"Driver not found\"}");
                return;
            }

            // ── 4. Pull aggregated rating info ──
            RatingDAO ratingDAO = new RatingDAO();
            double avg = ratingDAO.getAverageRating("DRIVER", driverId);
            int total  = ratingDAO.getTotalReviews("DRIVER", driverId);

            driver.setAverageRating(avg);
            driver.setTotalReviews(total);

            // ── 5. Build response (use a JsonObject so we can shape field names) ──
            String first = nullSafe(driver.getFirstName());
            String last  = nullSafe(driver.getLastName());
            String full  = (first + " " + last).trim();
            String initial = (first.isEmpty() ? "?" : String.valueOf(first.charAt(0)).toUpperCase())
                    + (last.isEmpty() ? "" : String.valueOf(last.charAt(0)).toUpperCase());

            String location = (driver.getArea() != null && !driver.getArea().trim().isEmpty())
                    ? driver.getArea()
                    : (driver.getCompanyCity() != null ? driver.getCompanyCity() : "");

            boolean verified = driver.isActive() && !driver.isBanned();

            JsonObject d = new JsonObject();
            d.addProperty("id", driver.getDriverId());
            d.addProperty("firstName", first);
            d.addProperty("lastName", last);
            d.addProperty("fullName", full);
            d.addProperty("initial", initial);
            d.addProperty("email", nullSafe(driver.getEmail()));
            d.addProperty("mobileNumber", nullSafe(driver.getMobileNumber()));
            d.addProperty("description", nullSafe(driver.getDescription()));
            d.addProperty("area", nullSafe(driver.getArea()));
            d.addProperty("location", location);
            if (driver.getExperienceYears() != null) {
                d.addProperty("experienceYears", driver.getExperienceYears());
            } else {
                d.add("experienceYears", null);
            }
            d.addProperty("totalRides", driver.getTotalRides());
            d.addProperty("companyId", driver.getCompanyId());
            d.addProperty("companyName", nullSafe(driver.getCompanyName()));
            d.addProperty("companyCity", nullSafe(driver.getCompanyCity()));
            d.addProperty("verified", verified);
            d.addProperty("profilePicture", driver.getProfilePicture()); // null if not uploaded
            d.addProperty("averageRating", avg);
            d.addProperty("totalReviews", total);

            JsonObject root = new JsonObject();
            root.addProperty("success", true);
            root.add("driver", d);
            out.write(root.toString());

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"success\":false,\"message\":\"An error occurred while loading driver profile\"}");
        }
    }

    private static String nullSafe(String s) {
        return s == null ? "" : s;
    }
}