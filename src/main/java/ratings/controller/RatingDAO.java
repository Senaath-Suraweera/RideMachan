package ratings.controller;

import common.util.DBConnection;
import ratings.model.Rating;

import java.sql.*;

/**
 * DAO for the `ratings` table.
 * Inserts driver and vehicle ratings submitted by customers.
 */
public class RatingDAO {

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
     *
     * @return true if at least the vehicle rating was saved successfully.
     */
    public boolean submitBookingRatings(int customerId, int companyId,
                                        int driverId, int vehicleId,
                                        int driverRatingValue, int vehicleRatingValue,
                                        String review) {

        boolean vehicleSaved = false;
        boolean driverSaved  = false;

        // ── Vehicle rating (always) ──
        Rating vehicleRating = new Rating("VEHICLE", vehicleId, customerId, vehicleRatingValue, review, companyId);
        int vId = insertRating(vehicleRating);
        vehicleSaved = (vId > 0);

        // ── Driver rating (only for with-driver bookings) ──
        if (driverId > 0) {
            Rating driverRating = new Rating("DRIVER", driverId, customerId, driverRatingValue, review, companyId);
            int dId = insertRating(driverRating);
            driverSaved = (dId > 0);
        } else {
            driverSaved = true; // no driver to rate, so consider it a success
        }

        return vehicleSaved && driverSaved;
    }

    /**
     * Check if a customer has already rated a specific booking's actors.
     * Prevents duplicate ratings.
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
}