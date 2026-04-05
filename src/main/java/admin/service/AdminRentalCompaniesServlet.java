package admin.service;

import common.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/admin/rentalcompanies/*")
public class AdminRentalCompaniesServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        resp.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json");

        String pathInfo = req.getPathInfo();
        // null, "/", "/1"
        try (Connection con = DBConnection.getConnection()) {
            if (pathInfo == null || "/".equals(pathInfo)) {
                String json = getCompaniesListJson(con);
                resp.getWriter().write(json);
                return;
            }
            if (pathInfo != null && pathInfo.matches("^/\\d+/reviews$")) {
                String[] parts = pathInfo.split("/");
                int companyId = Integer.parseInt(parts[1]);

                String json = getCompanyReviewsJson(con, companyId);
                resp.getWriter().write(json);
                return;
            }

            String idStr = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
            int companyId = Integer.parseInt(idStr);

            String json = getCompanyDetailsJson(con, companyId);
            if (json == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Company not found\"}");
                return;
            }
            resp.getWriter().write(json);

        } catch (NumberFormatException nfe) {
            resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid company id\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Server error\"}");
        }
    }

    // -------------------------
    // LIST: GET /admin/rentalcompanies
    // -------------------------
    private String getCompaniesListJson(Connection con) throws SQLException {
        String sql =
                "SELECT rc.companyid, rc.companyname, rc.city, rc.companyemail, rc.phone, rc.street, rc.description, " +
                        "       COUNT(DISTINCT v.vehicleid) AS fleets, " +
                        "       CASE WHEN COUNT(DISTINCT d.driverid) > 0 THEN 1 ELSE 0 END AS offersDriver, " +
                        "       IFNULL(AVG(r.rating_value), 0) AS rating, " +
                        "       COUNT(r.rating_id) AS reviews " +
                        "FROM RentalCompany rc " +
                        "LEFT JOIN Vehicle v ON v.company_id = rc.companyid " +
                        "LEFT JOIN Driver d ON d.company_id = rc.companyid " +
                        "LEFT JOIN ratings r ON r.companyid = rc.companyid " +
                        "GROUP BY rc.companyid, rc.companyname, rc.city, rc.companyemail, rc.phone, rc.street, rc.description " +
                        "ORDER BY rc.companyname ASC";

        try (PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            StringBuilder out = new StringBuilder();
            out.append("{\"status\":\"success\",\"companies\":[");
            boolean first = true;

            while (rs.next()) {
                if (!first) out.append(",");
                first = false;

                int id = rs.getInt("companyid");
                String name = rs.getString("companyname");
                String city = rs.getString("city");
                String email = rs.getString("companyemail");
                String phone = rs.getString("phone");
                String street = rs.getString("street");

                double rating = rs.getDouble("rating");
                int reviews = rs.getInt("reviews");
                int fleets = rs.getInt("fleets");
                boolean offersDriver = rs.getInt("offersDriver") == 1;

                // Use DB description if available, otherwise fallback to street + city
                String description = rs.getString("description");
                if (description == null || description.trim().isEmpty()) {
                    description = (street == null ? "" : street) + (city == null ? "" : (", " + city));
                }

                out.append("{")
                        .append("\"id\":").append(id).append(",")
                        .append("\"name\":\"").append(esc(name)).append("\",")
                        .append("\"rating\":").append(round1(rating)).append(",")
                        .append("\"reviews\":").append(reviews).append(",")
                        .append("\"location\":\"").append(esc(city)).append("\",") // location = city
                        .append("\"offersDriver\":").append(offersDriver).append(",")
                        .append("\"fleets\":").append(fleets).append(",")
                        .append("\"phone\":\"").append(esc(phone)).append("\",")
                        .append("\"email\":\"").append(esc(email)).append("\",")
                        .append("\"description\":\"").append(esc(description)).append("\"")
                        .append("}");
            }

            out.append("]}");
            return out.toString();
        }
    }

    // -------------------------
// REVIEWS: GET /admin/rentalcompanies/{id}/reviews
// -------------------------
    private String getCompanyReviewsJson(Connection con, int companyId) throws SQLException {

        String sql =
                "SELECT r.rating_id, r.rating_value, r.review, r.created_at, r.actor_type, r.actor_id, " +
                        "       c.customerid, c.firstname, c.lastname, " +
                        "       CASE " +
                        "           WHEN r.actor_type = 'VEHICLE' THEN CONCAT(IFNULL(v.vehiclebrand,''), ' ', IFNULL(v.vehiclemodel,'')) " +
                        "           WHEN r.actor_type = 'DRIVER' THEN CONCAT(IFNULL(d.firstname,''), ' ', IFNULL(d.lastname,'')) " +
                        "           ELSE '' " +
                        "       END AS target_name " +
                        "FROM ratings r " +
                        "LEFT JOIN Customer c ON c.customerid = r.user_id " +
                        "LEFT JOIN Vehicle v ON r.actor_type = 'VEHICLE' AND v.vehicleid = r.actor_id " +
                        "LEFT JOIN Driver d ON r.actor_type = 'DRIVER' AND d.driverid = r.actor_id " +
                        "WHERE r.companyid = ? " +
                        "ORDER BY r.created_at DESC";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);

            try (ResultSet rs = ps.executeQuery()) {
                StringBuilder out = new StringBuilder();
                out.append("{\"status\":\"success\",\"reviews\":[");

                boolean first = true;
                while (rs.next()) {
                    if (!first) out.append(",");
                    first = false;

                    int ratingId = rs.getInt("rating_id");
                    int ratingValue = rs.getInt("rating_value");
                    String review = rs.getString("review");
                    Timestamp createdAt = rs.getTimestamp("created_at");

                    String actorType = rs.getString("actor_type");
                    int actorId = rs.getInt("actor_id");
                    String targetName = rs.getString("target_name");

                    int customerId = rs.getInt("customerid"); // 0 if null
                    String fn = rs.getString("firstname");
                    String ln = rs.getString("lastname");
                    String customerName = ((fn == null ? "" : fn) + " " + (ln == null ? "" : ln)).trim();
                    if (customerName.isEmpty()) customerName = "Anonymous";

                    out.append("{")
                            .append("\"id\":").append(ratingId).append(",")
                            .append("\"rating\":").append(ratingValue).append(",")
                            .append("\"review\":\"").append(esc(review)).append("\",")
                            .append("\"createdAt\":\"").append(createdAt == null ? "" : esc(createdAt.toString())).append("\",")

                            .append("\"customer\":{")
                            .append("\"id\":").append(customerId).append(",")
                            .append("\"name\":\"").append(esc(customerName)).append("\"")
                            .append("},")

                            .append("\"target\":{")
                            .append("\"type\":\"").append(esc(actorType)).append("\",")
                            .append("\"id\":").append(actorId).append(",")
                            .append("\"name\":\"").append(esc(targetName == null ? "" : targetName.trim())).append("\"")
                            .append("}")

                            .append("}");
                }

                out.append("]}");
                return out.toString();
            }
        }
    }


    // -------------------------
    // DETAILS: GET /admin/rentalcompanies/{id}
    // -------------------------
    private String getCompanyDetailsJson(Connection con, int companyId) throws SQLException {

        String sql =
                "SELECT rc.companyid, rc.companyname, rc.companyemail, rc.phone, rc.registrationnumber, rc.street, rc.city, " +
                        "       rc.description, rc.terms, " +
                        "       COUNT(DISTINCT v.vehicleid) AS fleetSize, " +
                        "       CASE WHEN COUNT(DISTINCT d.driverid) > 0 THEN 1 ELSE 0 END AS withDriver, " +
                        "       IFNULL(AVG(r.rating_value), 0) AS rating, " +
                        "       COUNT(r.rating_id) AS reviews " +
                        "FROM RentalCompany rc " +
                        "LEFT JOIN Vehicle v ON v.company_id = rc.companyid " +
                        "LEFT JOIN Driver d ON d.company_id = rc.companyid " +
                        "LEFT JOIN ratings r ON r.companyid = rc.companyid " +
                        "WHERE rc.companyid = ? " +
                        "GROUP BY rc.companyid, rc.companyname, rc.companyemail, rc.phone, rc.registrationnumber, rc.street, rc.city, rc.description, rc.terms";

        String companyName;
        String companyEmail;
        String phone;
        String regNo;
        String street;
        String city;
        String companyDescription;
        String companyTerms;

        int fleetSize;
        boolean withDriver;
        double rating;
        int reviews;

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                companyName = rs.getString("companyname");
                companyEmail = rs.getString("companyemail");
                phone = rs.getString("phone");
                regNo = rs.getString("registrationnumber");
                street = rs.getString("street");
                city = rs.getString("city");
                companyDescription = rs.getString("description");
                companyTerms = rs.getString("terms");

                fleetSize = rs.getInt("fleetSize");
                withDriver = rs.getInt("withDriver") == 1;
                rating = rs.getDouble("rating");
                reviews = rs.getInt("reviews");
            }
        }

        // fallback if description is empty
        if (companyDescription == null || companyDescription.trim().isEmpty()) {
            companyDescription = (street == null ? "" : street) + (city == null ? "" : (", " + city));
        }
        if (companyTerms == null) companyTerms = "";

        // 2) Vehicles list
        List<String> vehiclesJson = new ArrayList<>();
        String vSql =
                "SELECT v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.price_per_day, v.features, " +
                        "       IFNULL(AVG(r.rating_value), 0) AS vRating " +
                        "FROM Vehicle v " +
                        "LEFT JOIN ratings r ON r.actor_type = 'VEHICLE' AND r.actor_id = v.vehicleid " +
                        "WHERE v.company_id = ? " +
                        "GROUP BY v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.price_per_day, v.features " +
                        "ORDER BY v.vehicleid ASC";

        try (PreparedStatement ps = con.prepareStatement(vSql)) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int vid = rs.getInt("vehicleid");
                    String brand = rs.getString("vehiclebrand");
                    String model = rs.getString("vehiclemodel");
                    double price = rs.getDouble("price_per_day");
                    String features = rs.getString("features");
                    double vRating = rs.getDouble("vRating");

                    String vehicleName = (brand == null ? "" : brand) + " " + (model == null ? "" : model);
                    String featuresArr = csvToJsonArray(features);

                    vehiclesJson.add("{"
                            + "\"id\":" + vid + ","
                            + "\"name\":\"" + esc(vehicleName.trim()) + "\","
                            + "\"price\":" + price + ","
                            + "\"company\":\"" + esc(companyName) + "\","
                            + "\"rating\":" + round1(vRating) + ","
                            + "\"features\":" + featuresArr
                            + "}");
                }
            }
        }

        // 3) Drivers list
        List<String> driversJson = new ArrayList<>();
        String dSql =
                "SELECT d.driverid, d.firstname, d.lastname, " +
                        "       IFNULL(AVG(r.rating_value), 0) AS dRating " +
                        "FROM Driver d " +
                        "LEFT JOIN ratings r ON r.actor_type = 'DRIVER' AND r.actor_id = d.driverid " +
                        "WHERE d.company_id = ? " +
                        "GROUP BY d.driverid, d.firstname, d.lastname " +
                        "ORDER BY d.driverid ASC";

        try (PreparedStatement ps = con.prepareStatement(dSql)) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int did = rs.getInt("driverid");
                    String fn = rs.getString("firstname");
                    String ln = rs.getString("lastname");
                    double dRating = rs.getDouble("dRating");

                    String fullName = (fn == null ? "" : fn) + " " + (ln == null ? "" : ln);

                    driversJson.add("{"
                            + "\"id\":" + did + ","
                            + "\"name\":\"" + esc(fullName.trim()) + "\","
                            + "\"rides\":0,"
                            + "\"rating\":" + round1(dRating)
                            + "}");
                }
            }
        }

        // 4) Build final JSON
        return "{"
                + "\"status\":\"success\","
                + "\"company\":{"
                + "\"id\":" + companyId + ","
                + "\"name\":\"" + esc(companyName) + "\","
                + "\"location\":\"" + esc(city) + "\","
                + "\"description\":\"" + esc(companyDescription) + "\","
                + "\"rating\":" + round1(rating) + ","
                + "\"reviews\":" + reviews + ","
                + "\"withDriver\":" + withDriver + ","
                + "\"licenseNumber\":\"" + esc(regNo) + "\","
                + "\"email\":\"" + esc(companyEmail) + "\","
                + "\"phone\":\"" + esc(phone) + "\","
                + "\"address\":\"" + esc(street) + "\","
                + "\"city\":\"" + esc(city) + "\","
                + "\"fleetSize\":" + fleetSize + ","
                + "\"vehicles\":[" + String.join(",", vehiclesJson) + "],"
                + "\"drivers\":[" + String.join(",", driversJson) + "],"
                + "\"terms\":\"" + esc(companyTerms) + "\","
                + "\"contactNote\":\"\""
                + "}"
                + "}";
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private static String csvToJsonArray(String csv) {
        if (csv == null || csv.trim().isEmpty()) return "[]";
        String[] parts = csv.split(",");
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (String p : parts) {
            String t = p.trim();
            if (t.isEmpty()) continue;
            if (!first) sb.append(",");
            first = false;
            sb.append("\"").append(esc(t)).append("\"");
        }
        sb.append("]");
        return sb.toString();
    }

    private static double round1(double x) {
        return Math.round(x * 10.0) / 10.0;
    }
}
