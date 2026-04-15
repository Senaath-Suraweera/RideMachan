package ratings.service;

import com.google.gson.Gson;
import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import ratings.controller.RatingDAO;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

/**
 * GET /ratings/actor?actorType=DRIVER&actorId=5
 *
 * Generic, reusable across customer / admin / company pages — NOT auth-guarded
 * because rating data is public information.
 *
 * Supported actorType values: "DRIVER", "VEHICLE"
 *
 * Returns:
 * {
 *   "success":  true,
 *   "average":  4.7,
 *   "total":    152,
 *   "breakdown": { "1": 1, "2": 3, "3": 10, "4": 28, "5": 110 },
 *   "reviews":  [
 *     { "name": "Kasun Perera", "date": "2024-02-05", "rating": 5, "text": "..." },
 *     ...
 *   ]
 * }
 */
@WebServlet("/ratings/actor")
public class GetActorRatingsServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        // Allow this endpoint to be consumed by any frontend page
        resp.setHeader("Cache-Control", "no-store");

        PrintWriter out = resp.getWriter();

        // ── 1. Parse params ──
        String actorType = req.getParameter("actorType");
        String actorIdStr = req.getParameter("actorId");

        if (actorType == null || actorType.trim().isEmpty()
                || actorIdStr == null || actorIdStr.trim().isEmpty()) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"success\":false,\"message\":\"actorType and actorId are required\"}");
            return;
        }

        actorType = actorType.trim().toUpperCase();
        if (!actorType.equals("DRIVER") && !actorType.equals("VEHICLE")) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"success\":false,\"message\":\"actorType must be DRIVER or VEHICLE\"}");
            return;
        }

        int actorId;
        try {
            actorId = Integer.parseInt(actorIdStr.trim());
        } catch (NumberFormatException e) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write("{\"success\":false,\"message\":\"Invalid actorId\"}");
            return;
        }

        // ── 2. Fetch from DAO ──
        try {
            RatingDAO dao = new RatingDAO();

            double average = dao.getAverageRating(actorType, actorId);
            int total      = dao.getTotalReviews(actorType, actorId);
            Map<Integer, Integer> breakdown = dao.getBreakdown(actorType, actorId);
            List<Map<String, Object>> reviews = dao.getReviews(actorType, actorId);

            // ── 3. Build response ──
            JsonObject root = new JsonObject();
            root.addProperty("success", true);
            root.addProperty("average", average);
            root.addProperty("total", total);

            JsonObject breakdownJson = new JsonObject();
            for (int i = 1; i <= 5; i++) {
                breakdownJson.addProperty(String.valueOf(i),
                        breakdown.getOrDefault(i, 0));
            }
            root.add("breakdown", breakdownJson);

            JsonArray reviewsJson = new JsonArray();
            for (Map<String, Object> r : reviews) {
                JsonObject rj = new JsonObject();
                rj.addProperty("name",   String.valueOf(r.getOrDefault("name", "Anonymous")));
                rj.addProperty("date",   String.valueOf(r.getOrDefault("date", "")));
                rj.addProperty("rating", ((Number) r.getOrDefault("rating", 0)).intValue());
                rj.addProperty("text",   String.valueOf(r.getOrDefault("text", "")));
                reviewsJson.add(rj);
            }
            root.add("reviews", reviewsJson);

            out.write(root.toString());

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write("{\"success\":false,\"message\":\"Failed to load ratings\"}");
        }
    }
}