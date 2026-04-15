package ratings.model;

import java.sql.Timestamp;

public class Rating {

    private int ratingId;
    private String actorType;   // "DRIVER" or "VEHICLE"
    private int actorId;
    private int userId;
    private int ratingValue;    // 1–5
    private String review;
    private Timestamp createdAt;
    private int companyId;

    public Rating() {}

    public Rating(String actorType, int actorId, int userId, int ratingValue, String review, int companyId) {
        this.actorType = actorType;
        this.actorId = actorId;
        this.userId = userId;
        this.ratingValue = ratingValue;
        this.review = review;
        this.companyId = companyId;
    }

    // ── Getters & Setters ──

    public int getRatingId() { return ratingId; }
    public void setRatingId(int ratingId) { this.ratingId = ratingId; }

    public String getActorType() { return actorType; }
    public void setActorType(String actorType) { this.actorType = actorType; }

    public int getActorId() { return actorId; }
    public void setActorId(int actorId) { this.actorId = actorId; }

    public int getUserId() { return userId; }
    public void setUserId(int userId) { this.userId = userId; }

    public int getRatingValue() { return ratingValue; }
    public void setRatingValue(int ratingValue) { this.ratingValue = ratingValue; }

    public String getReview() { return review; }
    public void setReview(String review) { this.review = review; }

    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public int getCompanyId() { return companyId; }
    public void setCompanyId(int companyId) { this.companyId = companyId; }
}