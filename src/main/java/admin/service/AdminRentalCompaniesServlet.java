package admin.service;

import common.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.*;
import java.nio.file.*;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

@WebServlet("/admin/rentalcompanies/*")
@MultipartConfig(maxFileSize = 10 * 1024 * 1024) // 10MB
public class AdminRentalCompaniesServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        addCors(resp);

        String pathInfo = req.getPathInfo();

        try (Connection con = DBConnection.getConnection()) {

            // VIEW CERTIFICATE: /admin/rentalcompanies/{id}/certificate
            if (pathInfo != null && pathInfo.matches("^/\\d+/certificate$")) {
                int companyId = extractCompanyId(pathInfo);
                serveCompanyDocument(con, companyId, "certificatepath", resp);
                return;
            }

            // VIEW TAX DOCUMENT: /admin/rentalcompanies/{id}/tax-document
            if (pathInfo != null && pathInfo.matches("^/\\d+/tax-document$")) {
                int companyId = extractCompanyId(pathInfo);
                serveCompanyDocument(con, companyId, "taxdocumentpath", resp);
                return;
            }

            resp.setCharacterEncoding("UTF-8");
            resp.setContentType("application/json");

            // LIST
            if (pathInfo == null || "/".equals(pathInfo)) {
                String json = getCompaniesListJson(con);
                resp.getWriter().write(json);
                return;
            }

            // REVIEWS
            if (pathInfo.matches("^/\\d+/reviews$")) {
                int companyId = extractCompanyId(pathInfo);
                String json = getCompanyReviewsJson(con, companyId);
                resp.getWriter().write(json);
                return;
            }

            // STATS
            if (pathInfo.matches("^/\\d+/stats$")) {
                int companyId = extractCompanyId(pathInfo);
                String json = getCompanyStatsJson(con, companyId);
                resp.getWriter().write(json);
                return;
            }

            // DETAIL
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
            resp.setContentType("application/json");
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid company id\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.setContentType("application/json");
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Server error\"}");
        }
    }

    /* ======================= PUT (UPDATE COMPANY) ======================= */
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException, ServletException {
        addCors(resp);
        resp.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json");

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.setStatus(400);
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Company ID is required\"}");
            return;
        }

        try {
            String idStr = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
            int companyId = Integer.parseInt(idStr);

            String contentType = req.getContentType() == null ? "" : req.getContentType();

            String name = "";
            String email = "";
            String phone = "";
            String regNo = "";
            String taxId = "";
            String street = "";
            String city = "";
            String description = "";
            String terms = "";

            boolean isMultipart = contentType.toLowerCase().startsWith("multipart/form-data");

            if (isMultipart) {
                name = safe(req.getParameter("name"));
                email = safe(req.getParameter("email"));
                phone = safe(req.getParameter("phone"));
                regNo = safe(req.getParameter("licenseNumber"));
                taxId = safe(req.getParameter("taxId"));
                street = safe(req.getParameter("address"));
                city = safe(req.getParameter("city"));
                description = safe(req.getParameter("description"));
                terms = safe(req.getParameter("terms"));
            } else {
                String body = readBody(req);
                name = get(body, "name");
                email = get(body, "email");
                phone = get(body, "phone");
                regNo = get(body, "licenseNumber");
                taxId = get(body, "taxId");
                street = get(body, "address");
                city = get(body, "city");
                description = get(body, "description");
                terms = get(body, "terms");
            }

            Connection con = null;
            PreparedStatement ps = null;

            try {
                con = DBConnection.getConnection();
                con.setAutoCommit(false);

                String sql =
                        "UPDATE RentalCompany SET companyname=?, companyemail=?, phone=?, " +
                                "registrationnumber=?, taxid=?, street=?, city=?, description=?, terms=? " +
                                "WHERE companyid=?";

                ps = con.prepareStatement(sql);
                ps.setString(1, name);
                ps.setString(2, email);
                ps.setString(3, phone);
                ps.setString(4, regNo);
                ps.setString(5, taxId);
                ps.setString(6, street);
                ps.setString(7, city);
                ps.setString(8, description);
                ps.setString(9, terms);
                ps.setInt(10, companyId);

                int rows = ps.executeUpdate();
                ps.close();

                if (rows <= 0) {
                    con.rollback();
                    resp.setStatus(404);
                    resp.getWriter().write("{\"status\":\"error\",\"message\":\"Company not found\"}");
                    return;
                }

                if (isMultipart) {
                    Part certificatePart = getPartSafe(req, "certificate");
                    if (certificatePart != null && certificatePart.getSize() > 0) {
                        String savedPath = saveCompanyFile(certificatePart, companyId, "certificate");
                        ps = con.prepareStatement("UPDATE RentalCompany SET certificatepath=? WHERE companyid=?");
                        ps.setString(1, savedPath);
                        ps.setInt(2, companyId);
                        ps.executeUpdate();
                        ps.close();
                    }

                    Part taxDocPart = getPartSafe(req, "taxdocument");
                    if (taxDocPart != null && taxDocPart.getSize() > 0) {
                        String savedPath = saveCompanyFile(taxDocPart, companyId, "taxdocument");
                        ps = con.prepareStatement("UPDATE RentalCompany SET taxdocumentpath=? WHERE companyid=?");
                        ps.setString(1, savedPath);
                        ps.setInt(2, companyId);
                        ps.executeUpdate();
                        ps.close();
                    }
                }

                con.commit();
                resp.getWriter().write("{\"status\":\"success\",\"message\":\"Company updated successfully\"}");

            } catch (Exception e) {
                if (con != null) {
                    try { con.rollback(); } catch (SQLException ignored) {}
                }
                resp.setStatus(500);
                resp.getWriter().write("{\"status\":\"error\",\"message\":\"" + esc(e.getMessage()) + "\"}");
                e.printStackTrace();
            } finally {
                if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
                if (con != null) {
                    try { con.setAutoCommit(true); } catch (SQLException ignored) {}
                    try { con.close(); } catch (SQLException ignored) {}
                }
            }

        } catch (NumberFormatException nfe) {
            resp.setStatus(400);
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid company id\"}");
        }
    }

    /* ======================= DELETE ======================= */
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json");

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.equals("/")) {
            resp.setStatus(400);
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Company ID is required\"}");
            return;
        }

        try {
            String idStr = pathInfo.startsWith("/") ? pathInfo.substring(1) : pathInfo;
            int companyId = Integer.parseInt(idStr);

            try (Connection con = DBConnection.getConnection();
                 PreparedStatement ps = con.prepareStatement("DELETE FROM RentalCompany WHERE companyid=?")) {
                ps.setInt(1, companyId);
                int rows = ps.executeUpdate();

                if (rows > 0) {
                    resp.getWriter().write("{\"status\":\"success\",\"message\":\"Company deleted successfully\"}");
                } else {
                    resp.setStatus(404);
                    resp.getWriter().write("{\"status\":\"error\",\"message\":\"Company not found\"}");
                }
            }
        } catch (NumberFormatException nfe) {
            resp.setStatus(400);
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid company id\"}");
        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        }
    }

    // -------------------------
    // LIST: GET /admin/rentalcompanies
    // -------------------------
    private String getCompaniesListJson(Connection con) throws SQLException {
        String sql =
                "SELECT rc.companyid, rc.companyname, rc.city, rc.companyemail, rc.phone, rc.street, rc.description, " +
                        "       COUNT(DISTINCT v.vehicleid) AS fleets, " +
                        "       COUNT(DISTINCT d.driverid) AS driverCount, " +
                        "       COUNT(DISTINCT ms.maintenanceid) AS maintenanceCount, " +
                        "       CASE WHEN COUNT(DISTINCT d.driverid) > 0 THEN 1 ELSE 0 END AS offersDriver, " +
                        "       IFNULL(AVG(r.rating_value), 0) AS rating, " +
                        "       COUNT(DISTINCT r.rating_id) AS reviews " +
                        "FROM RentalCompany rc " +
                        "LEFT JOIN Vehicle v ON v.company_id = rc.companyid " +
                        "LEFT JOIN Driver d ON d.company_id = rc.companyid " +
                        "LEFT JOIN MaintenanceStaff ms ON ms.company_id = rc.companyid " +
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
                int driverCount = rs.getInt("driverCount");
                int maintenanceCount = rs.getInt("maintenanceCount");
                boolean offersDriver = rs.getInt("offersDriver") == 1;

                String description = rs.getString("description");
                if (description == null || description.trim().isEmpty()) {
                    description = (street == null ? "" : street) + (city == null ? "" : (", " + city));
                }

                out.append("{")
                        .append("\"id\":").append(id).append(",")
                        .append("\"name\":\"").append(esc(name)).append("\",")
                        .append("\"rating\":").append(round1(rating)).append(",")
                        .append("\"reviews\":").append(reviews).append(",")
                        .append("\"location\":\"").append(esc(city)).append("\",")
                        .append("\"offersDriver\":").append(offersDriver).append(",")
                        .append("\"fleets\":").append(fleets).append(",")
                        .append("\"driverCount\":").append(driverCount).append(",")
                        .append("\"maintenanceCount\":").append(maintenanceCount).append(",")
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
    // REVIEWS
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

                    int customerId = rs.getInt("customerid");
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
    // STATS
    // -------------------------
    private String getCompanyStatsJson(Connection con, int companyId) throws SQLException {
        StringBuilder json = new StringBuilder();
        json.append("{\"status\":\"success\",\"stats\":{");

        try (PreparedStatement ps = con.prepareStatement(
                "SELECT COUNT(*) AS totalBookings, COALESCE(SUM(total_amount),0) AS totalRevenue " +
                        "FROM companybookings WHERE companyid = ?")) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    json.append("\"totalBookings\":").append(rs.getInt("totalBookings")).append(",");
                    json.append("\"totalRevenue\":").append(rs.getDouble("totalRevenue")).append(",");
                }
            }
        }

        try (PreparedStatement ps = con.prepareStatement(
                "SELECT COUNT(*) AS activeBookings FROM companybookings WHERE companyid = ? AND status IN ('active','confirmed','ongoing')")) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    json.append("\"activeBookings\":").append(rs.getInt("activeBookings")).append(",");
                }
            }
        }

        try (PreparedStatement ps = con.prepareStatement(
                "SELECT COUNT(*) AS totalVehicles, " +
                        "SUM(CASE WHEN availability_status='available' THEN 1 ELSE 0 END) AS availableVehicles, " +
                        "SUM(CASE WHEN availability_status='rented' THEN 1 ELSE 0 END) AS rentedVehicles, " +
                        "SUM(CASE WHEN availability_status='maintenance' THEN 1 ELSE 0 END) AS maintenanceVehicles " +
                        "FROM Vehicle WHERE company_id = ?")) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    json.append("\"totalVehicles\":").append(rs.getInt("totalVehicles")).append(",");
                    json.append("\"availableVehicles\":").append(rs.getInt("availableVehicles")).append(",");
                    json.append("\"rentedVehicles\":").append(rs.getInt("rentedVehicles")).append(",");
                    json.append("\"maintenanceVehicles\":").append(rs.getInt("maintenanceVehicles")).append(",");
                }
            }
        }

        try (PreparedStatement ps = con.prepareStatement(
                "SELECT COUNT(*) AS totalDrivers, " +
                        "SUM(CASE WHEN availability='available' THEN 1 ELSE 0 END) AS availableDrivers, " +
                        "SUM(CASE WHEN banned=1 THEN 1 ELSE 0 END) AS bannedDrivers " +
                        "FROM Driver WHERE company_id = ?")) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    json.append("\"totalDrivers\":").append(rs.getInt("totalDrivers")).append(",");
                    json.append("\"availableDrivers\":").append(rs.getInt("availableDrivers")).append(",");
                    json.append("\"bannedDrivers\":").append(rs.getInt("bannedDrivers")).append(",");
                }
            }
        }

        try (PreparedStatement ps = con.prepareStatement(
                "SELECT COUNT(*) AS totalMaintenanceStaff FROM MaintenanceStaff WHERE company_id = ?")) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    json.append("\"totalMaintenanceStaff\":").append(rs.getInt("totalMaintenanceStaff"));
                }
            }
        }

        json.append("}}");
        return json.toString();
    }

    // -------------------------
    // DETAILS
    // -------------------------
    private String getCompanyDetailsJson(Connection con, int companyId) throws SQLException {

        String sql =
                "SELECT rc.companyid, rc.companyname, rc.companyemail, rc.phone, rc.registrationnumber, rc.taxid, rc.street, rc.city, " +
                        "       rc.description, rc.terms, rc.certificatepath, rc.taxdocumentpath, " +
                        "       COUNT(DISTINCT v.vehicleid) AS fleetSize, " +
                        "       COUNT(DISTINCT ms.maintenanceid) AS maintenanceStaffCount, " +
                        "       CASE WHEN COUNT(DISTINCT d.driverid) > 0 THEN 1 ELSE 0 END AS withDriver, " +
                        "       IFNULL(AVG(r.rating_value), 0) AS rating, " +
                        "       COUNT(DISTINCT r.rating_id) AS reviews " +
                        "FROM RentalCompany rc " +
                        "LEFT JOIN Vehicle v ON v.company_id = rc.companyid " +
                        "LEFT JOIN Driver d ON d.company_id = rc.companyid " +
                        "LEFT JOIN MaintenanceStaff ms ON ms.company_id = rc.companyid " +
                        "LEFT JOIN ratings r ON r.companyid = rc.companyid " +
                        "WHERE rc.companyid = ? " +
                        "GROUP BY rc.companyid, rc.companyname, rc.companyemail, rc.phone, rc.registrationnumber, rc.taxid, rc.street, rc.city, rc.description, rc.terms, rc.certificatepath, rc.taxdocumentpath";

        String companyName, companyEmail, phone, regNo, taxId, street, city, companyDescription, companyTerms;
        String certificatePath, taxDocumentPath;
        int fleetSize, maintenanceStaffCount, reviews;
        boolean withDriver;
        double rating;

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) return null;

                companyName = rs.getString("companyname");
                companyEmail = rs.getString("companyemail");
                phone = rs.getString("phone");
                regNo = rs.getString("registrationnumber");
                taxId = rs.getString("taxid");
                street = rs.getString("street");
                city = rs.getString("city");
                companyDescription = rs.getString("description");
                companyTerms = rs.getString("terms");
                certificatePath = rs.getString("certificatepath");
                taxDocumentPath = rs.getString("taxdocumentpath");

                fleetSize = rs.getInt("fleetSize");
                maintenanceStaffCount = rs.getInt("maintenanceStaffCount");
                withDriver = rs.getInt("withDriver") == 1;
                rating = rs.getDouble("rating");
                reviews = rs.getInt("reviews");
            }
        }

        if (companyDescription == null || companyDescription.trim().isEmpty()) {
            companyDescription = (street == null ? "" : street) + (city == null ? "" : (", " + city));
        }
        if (companyTerms == null) companyTerms = "";

        List<String> vehiclesJson = new ArrayList<>();
        String vSql =
                "SELECT v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.price_per_day, v.features, " +
                        "       v.numberplatenumber, v.color, v.vehicle_type, v.fuel_type, v.availability_status, " +
                        "       v.numberofpassengers, v.transmission, v.manufacture_year, " +
                        "       IFNULL(AVG(r.rating_value), 0) AS vRating, " +
                        "       (CASE WHEN v.vehicleimages IS NOT NULL AND LENGTH(v.vehicleimages) > 1 THEN 1 ELSE 0 END) AS hasImage " +
                        "FROM Vehicle v " +
                        "LEFT JOIN ratings r ON r.actor_type = 'VEHICLE' AND r.actor_id = v.vehicleid " +
                        "WHERE v.company_id = ? " +
                        "GROUP BY v.vehicleid " +
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
                            + "\"brand\":\"" + esc(brand) + "\","
                            + "\"model\":\"" + esc(model) + "\","
                            + "\"price\":" + price + ","
                            + "\"company\":\"" + esc(companyName) + "\","
                            + "\"rating\":" + round1(vRating) + ","
                            + "\"features\":" + featuresArr + ","
                            + "\"numberPlate\":\"" + esc(rs.getString("numberplatenumber")) + "\","
                            + "\"color\":\"" + esc(rs.getString("color")) + "\","
                            + "\"vehicleType\":\"" + esc(rs.getString("vehicle_type")) + "\","
                            + "\"fuelType\":\"" + esc(rs.getString("fuel_type")) + "\","
                            + "\"availabilityStatus\":\"" + esc(rs.getString("availability_status")) + "\","
                            + "\"passengers\":" + rs.getInt("numberofpassengers") + ","
                            + "\"transmission\":\"" + esc(rs.getString("transmission")) + "\","
                            + "\"manufactureYear\":" + rs.getInt("manufacture_year") + ","
                            + "\"hasImage\":" + (rs.getInt("hasImage") > 0)
                            + "}");
                }
            }
        }

        List<String> driversJson = new ArrayList<>();
        String dSql =
                "SELECT d.driverid, d.firstname, d.lastname, d.status, d.availability, " +
                        "       d.licensenumber, d.mobilenumber, d.email, " +
                        "       COALESCE(d.totalrides,0) AS totalrides, " +
                        "       IFNULL(AVG(r.rating_value), 0) AS dRating, " +
                        "       (SELECT COUNT(*) FROM DriverProfileImage pi WHERE pi.driver_id = d.driverid) AS hasProfileImage " +
                        "FROM Driver d " +
                        "LEFT JOIN ratings r ON r.actor_type = 'DRIVER' AND r.actor_id = d.driverid " +
                        "WHERE d.company_id = ? AND COALESCE(d.banned,0) = 0 " +
                        "GROUP BY d.driverid " +
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
                            + "\"rides\":" + rs.getInt("totalrides") + ","
                            + "\"rating\":" + round1(dRating) + ","
                            + "\"status\":\"" + esc(rs.getString("status")) + "\","
                            + "\"availability\":\"" + esc(rs.getString("availability")) + "\","
                            + "\"license\":\"" + esc(rs.getString("licensenumber")) + "\","
                            + "\"phone\":\"" + esc(rs.getString("mobilenumber")) + "\","
                            + "\"email\":\"" + esc(rs.getString("email")) + "\","
                            + "\"hasProfileImage\":" + (rs.getInt("hasProfileImage") > 0)
                            + "}");
                }
            }
        }

        List<String> maintenanceJson = new ArrayList<>();
        String mSql =
                "SELECT ms.maintenanceid, ms.firstname, ms.lastname, ms.email, ms.mobilenumber, " +
                        "       ms.specialization, ms.status, ms.yearsOfExperience, " +
                        "       (SELECT COUNT(*) FROM maintenanceJobs mj WHERE mj.assignedStaffId = ms.maintenanceid AND mj.status = 'completed') AS completedJobs, " +
                        "       (SELECT COUNT(*) FROM maintenanceJobs mj WHERE mj.assignedStaffId = ms.maintenanceid AND mj.status IN ('pending','on Job')) AS activeJobs " +
                        "FROM MaintenanceStaff ms " +
                        "WHERE ms.company_id = ? " +
                        "ORDER BY ms.maintenanceid ASC";

        try (PreparedStatement ps = con.prepareStatement(mSql)) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    int mid = rs.getInt("maintenanceid");
                    String fn = rs.getString("firstname");
                    String ln = rs.getString("lastname");
                    String fullName = (fn == null ? "" : fn) + " " + (ln == null ? "" : ln);

                    maintenanceJson.add("{"
                            + "\"id\":" + mid + ","
                            + "\"name\":\"" + esc(fullName.trim()) + "\","
                            + "\"email\":\"" + esc(rs.getString("email")) + "\","
                            + "\"phone\":\"" + esc(rs.getString("mobilenumber")) + "\","
                            + "\"specialization\":\"" + esc(rs.getString("specialization")) + "\","
                            + "\"status\":\"" + esc(rs.getString("status")) + "\","
                            + "\"yearsOfExperience\":" + rs.getDouble("yearsOfExperience") + ","
                            + "\"completedJobs\":" + rs.getInt("completedJobs") + ","
                            + "\"activeJobs\":" + rs.getInt("activeJobs")
                            + "}");
                }
            }
        }

        boolean hasCertificate = certificatePath != null && !certificatePath.trim().isEmpty();
        boolean hasTaxDocument = taxDocumentPath != null && !taxDocumentPath.trim().isEmpty();

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
                + "\"taxId\":\"" + esc(taxId) + "\","
                + "\"email\":\"" + esc(companyEmail) + "\","
                + "\"phone\":\"" + esc(phone) + "\","
                + "\"address\":\"" + esc(street) + "\","
                + "\"city\":\"" + esc(city) + "\","
                + "\"fleetSize\":" + fleetSize + ","
                + "\"maintenanceStaffCount\":" + maintenanceStaffCount + ","
                + "\"hasCertificate\":" + hasCertificate + ","
                + "\"hasTaxDocument\":" + hasTaxDocument + ","
                + "\"certificateUrl\":\"/admin/rentalcompanies/" + companyId + "/certificate\","
                + "\"taxDocumentUrl\":\"/admin/rentalcompanies/" + companyId + "/tax-document\","
                + "\"vehicles\":[" + String.join(",", vehiclesJson) + "],"
                + "\"drivers\":[" + String.join(",", driversJson) + "],"
                + "\"maintenanceStaff\":[" + String.join(",", maintenanceJson) + "],"
                + "\"terms\":\"" + esc(companyTerms) + "\","
                + "\"contactNote\":\"\""
                + "}"
                + "}";
    }

    /* ======================= DOCUMENT SERVING ======================= */
    private void serveCompanyDocument(Connection con, int companyId, String columnName, HttpServletResponse resp) throws IOException, SQLException {
        String sql = "SELECT " + columnName + " FROM RentalCompany WHERE companyid=?";
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    resp.setStatus(404);
                    return;
                }

                String path = rs.getString(1);
                if (path == null || path.trim().isEmpty()) {
                    resp.setStatus(404);
                    return;
                }

                File file = new File(path);
                if (!file.exists() || !file.isFile()) {
                    resp.setStatus(404);
                    return;
                }

                String mime = Files.probeContentType(file.toPath());
                if (mime == null) mime = guessMimeFromFileName(file.getName());

                resp.setContentType(mime);
                resp.setContentLengthLong(file.length());
                resp.setHeader("Cache-Control", "max-age=300");
                resp.setHeader("Content-Disposition", "inline; filename=\"" + file.getName().replace("\"", "") + "\"");

                try (InputStream in = new FileInputStream(file);
                     OutputStream out = resp.getOutputStream()) {
                    byte[] buffer = new byte[8192];
                    int len;
                    while ((len = in.read(buffer)) != -1) {
                        out.write(buffer, 0, len);
                    }
                    out.flush();
                }
            }
        }
    }

    private String saveCompanyFile(Part part, int companyId, String prefix) throws IOException {
        String submitted = getSubmittedFileName(part);
        String ext = getExtension(submitted);
        if (ext.isEmpty()) ext = ".bin";

        String relativeFolder = "uploads/company-documents";
        String absoluteFolder = getServletContext().getRealPath("/") + File.separator + relativeFolder;
        File dir = new File(absoluteFolder);
        if (!dir.exists()) dir.mkdirs();

        String fileName = prefix + "_company_" + companyId + "_" + System.currentTimeMillis() + ext;
        File target = new File(dir, fileName);

        try (InputStream in = part.getInputStream()) {
            Files.copy(in, target.toPath(), StandardCopyOption.REPLACE_EXISTING);
        }

        return target.getAbsolutePath();
    }

    private static String getSubmittedFileName(Part part) {
        try {
            String cd = part.getHeader("content-disposition");
            if (cd == null) return "";
            for (String token : cd.split(";")) {
                token = token.trim();
                if (token.startsWith("filename=")) {
                    String name = token.substring("filename=".length()).trim().replace("\"", "");
                    return new File(name).getName();
                }
            }
        } catch (Exception ignored) {}
        return "";
    }

    private static String getExtension(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        return dot >= 0 ? filename.substring(dot) : "";
    }

    private static String guessMimeFromFileName(String fileName) {
        String name = fileName == null ? "" : fileName.toLowerCase();
        if (name.endsWith(".pdf")) return "application/pdf";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".gif")) return "image/gif";
        if (name.endsWith(".webp")) return "image/webp";
        return "application/octet-stream";
    }

    private static Part getPartSafe(HttpServletRequest req, String name) {
        try { return req.getPart(name); } catch (Exception e) { return null; }
    }

    private static int extractCompanyId(String pathInfo) {
        return Integer.parseInt(pathInfo.split("/")[1]);
    }

    /* ======================= HELPERS ======================= */
    private static void addCors(HttpServletResponse r) {
        r.setHeader("Access-Control-Allow-Origin", "*");
        r.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        r.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    private static String safe(String s) {
        return s == null ? "" : s;
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

    private static String readBody(HttpServletRequest r) throws IOException {
        StringBuilder sb = new StringBuilder();
        BufferedReader br = r.getReader();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        return sb.toString();
    }

    private static String get(String json, String key) {
        try {
            int i = json.indexOf("\"" + key + "\"");
            if (i == -1) return "";
            i = json.indexOf(":", i) + 1;
            while (i < json.length() && json.charAt(i) == ' ') i++;
            if (i < json.length() && json.charAt(i) == '"') {
                int e = json.indexOf("\"", i + 1);
                return (e == -1) ? "" : json.substring(i + 1, e);
            }
            int e = json.indexOf(",", i);
            if (e == -1) e = json.indexOf("}", i);
            return (e == -1) ? "" : json.substring(i, e).trim();
        } catch (Exception e) {
            return "";
        }
    }
}