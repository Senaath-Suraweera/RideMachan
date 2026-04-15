package ratings.controller;

import common.util.DBConnection;
import ratings.model.Rating;

import java.sql.*;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * DAO for the `ratings` table.
 * Inserts driver and vehicle ratings submitted by customers,
 * and reads aggregated rating data for any actor.
 */
public class RatingDAO {

    // ════════════════════════════════════════════════════════════
    //  WRITE METHODS  (existing — unchanged)
    // ════════════════════════════════════════════════════════════

    /**
     * Insert a single rating row.
     * Returns the generated rating_id, or -1 on failure.
     */
    public int insertRating(Rating rating) {
        String sql = "INSERT INTO ratings (actor_type, actor_id, user_id, rating_value, review, companyid) " +
                "VALUES (?, ?, ?, ?, ?, ?)";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, rating.getActorType());
            ps.setInt(2, rating.getActorId());
            ps.setInt(3, rating.getUserId());
            ps.setInt(4, rating.getRatingValue());
            ps.setString(5, rating.getReview());
            ps.setInt(6, rating.getCompanyId());

            int affected = ps.executeUpdate();
            if (affected > 0) {
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) return keys.getInt(1);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return -1;
    }

    /**
     * Submit both driver and vehicle ratings in one go.
     * If the booking is self-drive (driverId is 0 or absent), only the vehicle rating is stored.
     */
    public boolean submitBookingRatings(int customerId, int companyId,
                                        int driverId, int vehicleId,
                                        int driverRatingValue, int vehicleRatingValue,
                                        String review) {

        boolean vehicleSaved;
        boolean driverSaved;

        Rating vehicleRating = new Rating("VEHICLE", vehicleId, customerId, vehicleRatingValue, review, companyId);
        int vId = insertRating(vehicleRating);
        vehicleSaved = (vId > 0);

        if (driverId > 0) {
            Rating driverRating = new Rating("DRIVER", driverId, customerId, driverRatingValue, review, companyId);
            int dId = insertRating(driverRating);
            driverSaved = (dId > 0);
        } else {
            driverSaved = true;
        }

        return vehicleSaved && driverSaved;
    }

    /**
     * Check if a customer has already rated a specific booking's actors.
     */
    public boolean hasCustomerRatedVehicle(int customerId, int vehicleId) {
        String sql = "SELECT COUNT(*) FROM ratings WHERE user_id = ? AND actor_type = 'VEHICLE' AND actor_id = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, customerId);
            ps.setInt(2, vehicleId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1) > 0;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    // ════════════════════════════════════════════════════════════
    //  READ METHODS  (new — used by GetActorRatingsServlet and
    //                 CustomerDriverProfileServlet)
    // ════════════════════════════════════════════════════════════

    /**
     * Average rating value for an actor, rounded to 1 decimal place.
     * Returns 0.0 if no ratings exist.
     */
    public double getAverageRating(String actorType, int actorId) {
        String sql = "SELECT AVG(rating_value) FROM ratings WHERE actor_type = ? AND actor_id = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, actorType);
            ps.setInt(2, actorId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    double avg = rs.getDouble(1);
                    if (rs.wasNull()) return 0.0;
                    return Math.round(avg * 10.0) / 10.0;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0.0;
    }

    /**
     * Total number of reviews for an actor.
     */
    public int getTotalReviews(String actorType, int actorId) {
        String sql = "SELECT COUNT(*) FROM ratings WHERE actor_type = ? AND actor_id = ?";
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, actorType);
            ps.setInt(2, actorId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt(1);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }

    /**
     * Star breakdown: how many 1★, 2★, ... 5★ ratings exist for this actor.
     * Returns a map with keys 1..5; missing buckets default to 0.
     */
    public Map<Integer, Integer> getBreakdown(String actorType, int actorId) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 1; i <= 5; i++) map.put(i, 0);

        String sql = "SELECT rating_value, COUNT(*) AS c FROM ratings " +
                "WHERE actor_type = ? AND actor_id = ? GROUP BY rating_value";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, actorType);
            ps.setInt(2, actorId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int star = rs.getInt("rating_value");
                    int count = rs.getInt("c");
                    if (star >= 1 && star <= 5) map.put(star, count);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return map;
    }

    /**
     * All reviews for an actor, joined with the customer table to get the
     * reviewer's name. Sorted newest-first.
     *
     * Each map contains:
     *   "name"   -> "Firstname Lastname"
     *   "date"   -> "yyyy-MM-dd"
     *   "rating" -> Integer (1-5)
     *   "text"   -> review text (may be empty)
     */
    public List<Map<String, Object>> getReviews(String actorType, int actorId) {
        List<Map<String, Object>> list = new ArrayList<>();

        String sql = "SELECT r.rating_value, r.review, r.created_at, " +
                "       c.firstname, c.lastname " +
                "FROM ratings r " +
                "LEFT JOIN customer c ON r.user_id = c.customerid " +
                "WHERE r.actor_type = ? AND r.actor_id = ? " +
                "ORDER BY r.created_at DESC";

        SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd");

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, actorType);
            ps.setInt(2, actorId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    Map<String, Object> m = new LinkedHashMap<>();

                    String first = rs.getString("firstname");
                    String last  = rs.getString("lastname");
                    String name = ((first == null ? "" : first) + " " +
                            (last  == null ? "" : last)).trim();
                    if (name.isEmpty()) name = "Anonymous";
                    m.put("name", name);

                    Timestamp ts = rs.getTimestamp("created_at");
                    m.put("date", ts == null ? "" : fmt.format(ts));

                    m.put("rating", rs.getInt("rating_value"));

                    String text = rs.getString("review");
                    m.put("text", text == null ? "" : text);

                    list.add(m);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }
}