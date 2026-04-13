package admin.service;

import common.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintWriter;
import java.sql.*;

@WebServlet("/api/admin/drivers/*")
@MultipartConfig(maxFileSize = 5 * 1024 * 1024) // 5MB max
public class AdminDriversServlet extends HttpServlet {

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    /* ======================= GET ======================= */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        addCors(resp);

        String path = req.getPathInfo();

        // ================= SERVE PROFILE IMAGE =================
        if (path != null && path.endsWith("/profile-image")) {
            serveProfileImage(path, resp);
            return;
        }

        // ================= SERVE NIC IMAGE =================
        if (path != null && path.endsWith("/nic-image")) {
            serveDriverDocument(path, "nic", resp);
            return;
        }

        // ================= SERVE LICENSE IMAGE =================
        if (path != null && path.endsWith("/license-image")) {
            serveDriverDocument(path, "driverslicence", resp);
            return;
        }

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        /* ================= LIST ================= */
        if (path == null || "/".equals(path)) {

            String name = safe(req.getParameter("name"));
            String license = safe(req.getParameter("license"));
            double minRating = parseDouble(req.getParameter("minRating"), 0);
            String sort = "descending".equalsIgnoreCase(req.getParameter("sort")) ? "DESC" : "ASC";

            String sql =
                    "SELECT " +
                            "d.driverid, d.username, d.firstname, d.lastname, d.email, d.mobilenumber, d.description, d.nicnumber, " +
                            "COALESCE(d.Area, d.assignedarea, '') AS location, " +
                            "COALESCE(d.joineddate, CURDATE()) AS joineddate, " +
                            "COALESCE(d.licensenumber, '') AS licensenumber, " +
                            "COALESCE(d.status,'') AS status, " +
                            "COALESCE(d.availability,'') AS availability, " +
                            "rc.companyname, " +
                            "COALESCE(AVG(r.rating_value),0) AS rating, " +
                            "COUNT(r.rating_id) AS reviews, " +
                            "COALESCE(d.totalrides, 0) AS totalRides, " +
                            "COALESCE(d.totalkm, 0) AS totalKm, " +
                            "(SELECT COUNT(*) FROM DriverProfileImage pi WHERE pi.driver_id = d.driverid) AS hasProfileImage " +
                            "FROM Driver d " +
                            "JOIN RentalCompany rc ON rc.companyid=d.company_id " +
                            "LEFT JOIN ratings r ON r.actor_type='DRIVER' AND r.actor_id=d.driverid " +
                            "WHERE LOWER(CONCAT(d.firstname,' ',d.lastname)) LIKE ? " +
                            "AND (LOWER(COALESCE(d.licensenumber,'')) LIKE ? OR LOWER(d.nicnumber) LIKE ?) " +
                            "AND COALESCE(d.banned,0)=0 " +
                            "GROUP BY d.driverid, d.username, d.firstname, d.lastname, d.email, d.mobilenumber, " +
                            "d.description, d.nicnumber, d.Area, d.assignedarea, d.joineddate, " +
                            "d.licensenumber, d.status, d.availability, rc.companyname, d.totalrides, d.totalkm " +
                            "HAVING rating >= ? " +
                            "ORDER BY d.firstname " + sort;

            StringBuilder json = new StringBuilder();
            Connection con = null;
            PreparedStatement ps = null;
            ResultSet rs = null;
            PrintWriter out = null;

            try {
                con = DBConnection.getConnection();
                ps = con.prepareStatement(sql);
                ps.setString(1, "%" + name.toLowerCase() + "%");
                ps.setString(2, "%" + license.toLowerCase() + "%");
                ps.setString(3, "%" + license.toLowerCase() + "%");
                ps.setDouble(4, minRating);

                rs = ps.executeQuery();

                json.append("{\"success\":true,\"drivers\":[");

                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    first = false;

                    int driverId = rs.getInt("driverid");
                    boolean hasImage = rs.getInt("hasProfileImage") > 0;

                    json.append("{")
                            .append("\"id\":").append(driverId).append(",")
                            .append("\"name\":\"").append(esc(rs.getString("firstname") + " " + rs.getString("lastname"))).append("\",")
                            .append("\"company\":\"").append(esc(rs.getString("companyname"))).append("\",")
                            .append("\"licenseNumber\":\"").append(esc(rs.getString("licensenumber"))).append("\",")
                            .append("\"nicNumber\":\"").append(esc(rs.getString("nicnumber"))).append("\",")
                            .append("\"email\":\"").append(esc(rs.getString("email"))).append("\",")
                            .append("\"phone\":\"").append(esc(rs.getString("mobilenumber"))).append("\",")
                            .append("\"location\":\"").append(esc(rs.getString("location"))).append("\",")
                            .append("\"appliedDate\":\"").append(rs.getDate("joineddate")).append("\",")
                            .append("\"status\":\"").append(esc(rs.getString("status"))).append("\",")
                            .append("\"availability\":\"").append(esc(rs.getString("availability"))).append("\",")
                            .append("\"totalRides\":").append(rs.getInt("totalRides")).append(",")
                            .append("\"totalKm\":").append((long) rs.getDouble("totalKm")).append(",")
                            .append("\"rating\":").append(round(rs.getDouble("rating"))).append(",")
                            .append("\"reviews\":").append(rs.getInt("reviews")).append(",")
                            .append("\"hasProfileImage\":").append(hasImage).append(",")
                            .append("\"description\":\"").append(esc(rs.getString("description"))).append("\"")
                            .append("}");
                }

                json.append("]}");

                out = resp.getWriter();
                out.print(json.toString());
                out.flush();

            } catch (Exception e) {
                resp.setStatus(500);
                if (out == null) out = resp.getWriter();
                out.print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
                e.printStackTrace();
            } finally {
                if (rs != null) try { rs.close(); } catch (SQLException ignored) {}
                if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
                if (con != null) try { con.close(); } catch (SQLException ignored) {}
            }
            return;
        }

        /* ================= DETAIL ================= */
        Integer id = parseId(path);
        if (id == null) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid driver id\"}");
            return;
        }

        String sql =
                "SELECT d.driverid, d.username, d.firstname, d.lastname, d.email, d.mobilenumber, " +
                        "d.description, d.nicnumber, d.company_id, " +
                        "COALESCE(d.status,'') AS status, " +
                        "COALESCE(d.Area,'') AS area, " +
                        "d.licenceexpirydate, " +
                        "COALESCE(d.homeaddress,'') AS homeaddress, " +
                        "COALESCE(d.licensenumber,'') AS licensenumber, " +
                        "COALESCE(d.assignedarea,'') AS assignedarea, " +
                        "COALESCE(d.shifttime,'') AS shifttime, " +
                        "COALESCE(d.reportingmanager,'') AS reportingmanager, " +
                        "COALESCE(d.joineddate, CURDATE()) AS joineddate, " +
                        "COALESCE(d.availability,'') AS availability, " +
                        "COALESCE(d.age,0) AS age, " +
                        "COALESCE(d.experience_years,0) AS experience_years, " +
                        "COALESCE(d.totalrides,0) AS totalrides, " +
                        "COALESCE(d.totalkm,0) AS totalkm, " +
                        "COALESCE(d.ontimepercentage,0) AS ontimepercentage, " +
                        "COALESCE(d.licensecategories,'') AS licensecategories, " +
                        "COALESCE(d.active,1) AS active, " +
                        "COALESCE(d.banned,0) AS banned, " +
                        "rc.companyname, " +
                        "COALESCE(AVG(r.rating_value),0) AS rating, " +
                        "COUNT(r.rating_id) AS reviews, " +
                        "(SELECT COUNT(*) FROM DriverProfileImage pi WHERE pi.driver_id = d.driverid) AS hasProfileImage, " +
                        "(CASE WHEN d.nic IS NOT NULL AND LENGTH(d.nic) > 1 THEN 1 ELSE 0 END) AS hasNicImage, " +
                        "(CASE WHEN d.driverslicence IS NOT NULL AND LENGTH(d.driverslicence) > 1 THEN 1 ELSE 0 END) AS hasLicenseImage " +
                        "FROM Driver d " +
                        "JOIN RentalCompany rc ON rc.companyid=d.company_id " +
                        "LEFT JOIN ratings r ON r.actor_type='DRIVER' AND r.actor_id=d.driverid " +
                        "WHERE d.driverid=? " +
                        "GROUP BY d.driverid";

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        PrintWriter out = null;
        StringBuilder json = new StringBuilder();

        try {
            con = DBConnection.getConnection();
            ps = con.prepareStatement(sql);
            ps.setInt(1, id);
            rs = ps.executeQuery();

            if (!rs.next()) {
                resp.setStatus(404);
                out = resp.getWriter();
                out.print("{\"success\":false,\"message\":\"Driver not found\"}");
                return;
            }

            String licenseExpiry = "";
            try {
                Date expDate = rs.getDate("licenceexpirydate");
                if (expDate != null) licenseExpiry = expDate.toString();
            } catch (Exception ignored) {}

            json.append("{\"success\":true,\"driver\":{")
                    .append("\"id\":").append(rs.getInt("driverid")).append(",")
                    .append("\"username\":\"").append(esc(rs.getString("username"))).append("\",")
                    .append("\"firstName\":\"").append(esc(rs.getString("firstname"))).append("\",")
                    .append("\"lastName\":\"").append(esc(rs.getString("lastname"))).append("\",")
                    .append("\"name\":\"").append(esc(rs.getString("firstname") + " " + rs.getString("lastname"))).append("\",")
                    .append("\"company\":\"").append(esc(rs.getString("companyname"))).append("\",")
                    .append("\"companyId\":").append(rs.getInt("company_id")).append(",")
                    .append("\"rating\":").append(round(rs.getDouble("rating"))).append(",")
                    .append("\"reviews\":").append(rs.getInt("reviews")).append(",")
                    .append("\"email\":\"").append(esc(rs.getString("email"))).append("\",")
                    .append("\"phone\":\"").append(esc(rs.getString("mobilenumber"))).append("\",")
                    .append("\"age\":").append(rs.getInt("age")).append(",")
                    .append("\"experience\":").append(rs.getInt("experience_years")).append(",")
                    .append("\"area\":\"").append(esc(rs.getString("area"))).append("\",")
                    .append("\"assignedArea\":\"").append(esc(rs.getString("assignedarea"))).append("\",")
                    .append("\"homeAddress\":\"").append(esc(rs.getString("homeaddress"))).append("\",")
                    .append("\"shiftTime\":\"").append(esc(rs.getString("shifttime"))).append("\",")
                    .append("\"reportingManager\":\"").append(esc(rs.getString("reportingmanager"))).append("\",")
                    .append("\"appliedDate\":\"").append(rs.getDate("joineddate")).append("\",")
                    .append("\"licenseNumber\":\"").append(esc(rs.getString("licensenumber"))).append("\",")
                    .append("\"licenseExpiry\":\"").append(esc(licenseExpiry)).append("\",")
                    .append("\"licenseCategories\":\"").append(esc(rs.getString("licensecategories"))).append("\",")
                    .append("\"nicNumber\":\"").append(esc(rs.getString("nicnumber"))).append("\",")
                    .append("\"description\":\"").append(esc(rs.getString("description"))).append("\",")
                    .append("\"totalRides\":").append(rs.getInt("totalrides")).append(",")
                    .append("\"totalKm\":").append((long) rs.getDouble("totalkm")).append(",")
                    .append("\"onTimePercentage\":").append(rs.getInt("ontimepercentage")).append(",")
                    .append("\"status\":\"").append(esc(rs.getString("status"))).append("\",")
                    .append("\"availability\":\"").append(esc(rs.getString("availability"))).append("\",")
                    .append("\"active\":").append(rs.getBoolean("active")).append(",")
                    .append("\"banned\":").append(rs.getBoolean("banned")).append(",")
                    .append("\"hasProfileImage\":").append(rs.getInt("hasProfileImage") > 0).append(",")
                    .append("\"hasNicImage\":").append(rs.getInt("hasNicImage") > 0).append(",")
                    .append("\"hasLicenseImage\":").append(rs.getInt("hasLicenseImage") > 0)
                    .append("}}");

            out = resp.getWriter();
            out.print(json.toString());
            out.flush();

        } catch (Exception e) {
            resp.setStatus(500);
            if (out == null) { try { out = resp.getWriter(); } catch (IOException ignored) {} }
            if (out != null) out.print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        } finally {
            if (rs != null) try { rs.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (con != null) try { con.close(); } catch (SQLException ignored) {}
        }
    }

    /* ======================= PUT ======================= */
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer id = parseId(req.getPathInfo());
        if (id == null) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid driver id\"}");
            return;
        }

        String contentType = req.getContentType();

        if (contentType != null && contentType.startsWith("multipart/form-data")) {
            handleMultipartUpdate(req, resp, id);
            return;
        }

        // JSON body (no images)
        String body = readBody(req);

        String name = get(body, "name");
        String phone = get(body, "phone");
        String area = get(body, "area");
        String assignedArea = get(body, "assignedArea");
        String homeAddress = get(body, "homeAddress");
        String status = get(body, "status");
        String availability = get(body, "availability");
        String description = get(body, "description");
        String shiftTime = get(body, "shiftTime");
        String reportingManager = get(body, "reportingManager");
        String licenseExpiry = get(body, "licenseExpiry");
        String licenseCategories = get(body, "licenseCategories");
        int age = parseInt(get(body, "age"), 0);
        int experience = parseInt(get(body, "experience"), 0);

        String first = name.contains(" ") ? name.split(" ", 2)[0] : name;
        String last  = name.contains(" ") ? name.split(" ", 2)[1] : "";

        String sql =
                "UPDATE Driver SET " +
                        "firstname=?, lastname=?, mobilenumber=?, Area=?, assignedarea=?, " +
                        "homeaddress=?, status=?, availability=?, description=?, " +
                        "shifttime=?, reportingmanager=?, licenceexpirydate=?, " +
                        "licensecategories=?, age=?, experience_years=? " +
                        "WHERE driverid=?";

        Connection con = null;
        PreparedStatement ps = null;

        try {
            con = DBConnection.getConnection();
            ps = con.prepareStatement(sql);
            ps.setString(1, first);
            ps.setString(2, last);
            ps.setString(3, phone);
            ps.setString(4, area);
            ps.setString(5, assignedArea);
            ps.setString(6, homeAddress);
            ps.setString(7, status);
            ps.setString(8, availability);
            ps.setString(9, description);
            ps.setString(10, shiftTime);
            ps.setString(11, reportingManager);
            setDateOrNull(ps, 12, licenseExpiry);
            ps.setString(13, licenseCategories);
            ps.setInt(14, age);
            ps.setInt(15, experience);
            ps.setInt(16, id);

            int rows = ps.executeUpdate();
            if (rows > 0) {
                resp.getWriter().print("{\"success\":true,\"message\":\"Driver updated successfully\"}");
            } else {
                resp.setStatus(404);
                resp.getWriter().print("{\"success\":false,\"message\":\"Driver not found\"}");
            }

        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        } finally {
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (con != null) try { con.close(); } catch (SQLException ignored) {}
        }
    }

    /* ======================= Multipart Update (with images) ======================= */
    private void handleMultipartUpdate(HttpServletRequest req, HttpServletResponse resp, int id) throws IOException {
        Connection con = null;
        PreparedStatement ps = null;

        try {
            String name = safe(req.getParameter("name"));
            String phone = safe(req.getParameter("phone"));
            String area = safe(req.getParameter("area"));
            String assignedArea = safe(req.getParameter("assignedArea"));
            String homeAddress = safe(req.getParameter("homeAddress"));
            String status = safe(req.getParameter("status"));
            String availability = safe(req.getParameter("availability"));
            String description = safe(req.getParameter("description"));
            String shiftTime = safe(req.getParameter("shiftTime"));
            String reportingManager = safe(req.getParameter("reportingManager"));
            String licenseExpiry = safe(req.getParameter("licenseExpiry"));
            String licenseCategories = safe(req.getParameter("licenseCategories"));
            int age = parseInt(req.getParameter("age"), 0);
            int experience = parseInt(req.getParameter("experience"), 0);

            String first = name.contains(" ") ? name.split(" ", 2)[0] : name;
            String last  = name.contains(" ") ? name.split(" ", 2)[1] : "";

            con = DBConnection.getConnection();
            con.setAutoCommit(false);

            // Update driver text fields
            String updateSql =
                    "UPDATE Driver SET " +
                            "firstname=?, lastname=?, mobilenumber=?, Area=?, assignedarea=?, " +
                            "homeaddress=?, status=?, availability=?, description=?, " +
                            "shifttime=?, reportingmanager=?, licenceexpirydate=?, " +
                            "licensecategories=?, age=?, experience_years=? " +
                            "WHERE driverid=?";

            ps = con.prepareStatement(updateSql);
            ps.setString(1, first);
            ps.setString(2, last);
            ps.setString(3, phone);
            ps.setString(4, area);
            ps.setString(5, assignedArea);
            ps.setString(6, homeAddress);
            ps.setString(7, status);
            ps.setString(8, availability);
            ps.setString(9, description);
            ps.setString(10, shiftTime);
            ps.setString(11, reportingManager);
            setDateOrNull(ps, 12, licenseExpiry);
            ps.setString(13, licenseCategories);
            ps.setInt(14, age);
            ps.setInt(15, experience);
            ps.setInt(16, id);
            ps.executeUpdate();
            ps.close();

            // Handle profile image upload
            Part profilePart = getPartSafe(req, "profileImage");
            if (profilePart != null && profilePart.getSize() > 0) {
                String mimeType = safe(profilePart.getContentType());
                if (mimeType.isEmpty()) mimeType = "image/jpeg";
                byte[] imageBytes = profilePart.getInputStream().readAllBytes();

                String upsertSql =
                        "INSERT INTO DriverProfileImage (driver_id, image_data, mime_type) " +
                                "VALUES (?, ?, ?) " +
                                "ON DUPLICATE KEY UPDATE image_data=VALUES(image_data), mime_type=VALUES(mime_type), updated_at=CURRENT_TIMESTAMP";
                ps = con.prepareStatement(upsertSql);
                ps.setInt(1, id);
                ps.setBytes(2, imageBytes);
                ps.setString(3, mimeType);
                ps.executeUpdate();
                ps.close();
            }

            // Handle NIC image upload
            Part nicPart = getPartSafe(req, "nicImage");
            if (nicPart != null && nicPart.getSize() > 0) {
                byte[] nicBytes = nicPart.getInputStream().readAllBytes();
                ps = con.prepareStatement("UPDATE Driver SET nic=? WHERE driverid=?");
                ps.setBytes(1, nicBytes);
                ps.setInt(2, id);
                ps.executeUpdate();
                ps.close();
            }

            // Handle License image upload
            Part licensePart = getPartSafe(req, "licenseImage");
            if (licensePart != null && licensePart.getSize() > 0) {
                byte[] licenseBytes = licensePart.getInputStream().readAllBytes();
                ps = con.prepareStatement("UPDATE Driver SET driverslicence=? WHERE driverid=?");
                ps.setBytes(1, licenseBytes);
                ps.setInt(2, id);
                ps.executeUpdate();
                ps.close();
            }

            con.commit();
            resp.getWriter().print("{\"success\":true,\"message\":\"Driver updated successfully\"}");

        } catch (Exception e) {
            if (con != null) try { con.rollback(); } catch (SQLException ignored) {}
            resp.setStatus(500);
            resp.getWriter().print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        } finally {
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (con != null) {
                try { con.setAutoCommit(true); } catch (SQLException ignored) {}
                try { con.close(); } catch (SQLException ignored) {}
            }
        }
    }

    /* ======================= POST (BAN / UNBAN) ======================= */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String pathInfo = req.getPathInfo();
        if (pathInfo == null || pathInfo.trim().isEmpty()) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid request path\"}");
            return;
        }

        String[] parts = pathInfo.split("/");
        if (parts.length < 3) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid request path\"}");
            return;
        }

        int id;
        try { id = Integer.parseInt(parts[1]); }
        catch (Exception ex) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid driver id\"}");
            return;
        }

        boolean ban = "ban".equalsIgnoreCase(parts[2]);
        String sql = "UPDATE Driver SET banned=?, active=? WHERE driverid=?";

        Connection con = null;
        PreparedStatement ps = null;

        try {
            con = DBConnection.getConnection();
            ps = con.prepareStatement(sql);
            ps.setBoolean(1, ban);
            ps.setBoolean(2, !ban);
            ps.setInt(3, id);
            ps.executeUpdate();
            resp.getWriter().print("{\"success\":true,\"message\":\"" + (ban ? "Driver banned" : "Driver unbanned") + "\"}");
        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        } finally {
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (con != null) try { con.close(); } catch (SQLException ignored) {}
        }
    }

    /* ======================= SERVE PROFILE IMAGE ======================= */
    private void serveProfileImage(String path, HttpServletResponse resp) throws IOException {
        int driverId = extractIdFromPath(path);
        if (driverId < 0) { resp.setStatus(400); return; }

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            con = DBConnection.getConnection();
            ps = con.prepareStatement("SELECT image_data, mime_type FROM DriverProfileImage WHERE driver_id=?");
            ps.setInt(1, driverId);
            rs = ps.executeQuery();
            if (!rs.next()) { resp.setStatus(404); return; }

            byte[] imageData = rs.getBytes("image_data");
            resp.setContentType(rs.getString("mime_type"));
            resp.setContentLength(imageData.length);
            resp.setHeader("Cache-Control", "max-age=300");
            OutputStream out = resp.getOutputStream();
            out.write(imageData);
            out.flush();
        } catch (Exception e) { resp.setStatus(500); e.printStackTrace();
        } finally {
            if (rs != null) try { rs.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (con != null) try { con.close(); } catch (SQLException ignored) {}
        }
    }

    /* ======================= SERVE DRIVER DOCUMENTS (NIC / LICENSE) ======================= */
    private void serveDriverDocument(String path, String column, HttpServletResponse resp) throws IOException {
        int driverId = extractIdFromPath(path);
        if (driverId < 0) { resp.setStatus(400); return; }

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            con = DBConnection.getConnection();
            ps = con.prepareStatement("SELECT `" + column + "` FROM Driver WHERE driverid=?");
            ps.setInt(1, driverId);
            rs = ps.executeQuery();
            if (!rs.next()) { resp.setStatus(404); return; }

            byte[] imageData = rs.getBytes(column);
            if (imageData == null || imageData.length <= 1) { resp.setStatus(404); return; }

            String mimeType = detectMimeType(imageData);
            resp.setContentType(mimeType);
            resp.setContentLength(imageData.length);
            resp.setHeader("Cache-Control", "max-age=300");
            OutputStream out = resp.getOutputStream();
            out.write(imageData);
            out.flush();
        } catch (Exception e) { resp.setStatus(500); e.printStackTrace();
        } finally {
            if (rs != null) try { rs.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (con != null) try { con.close(); } catch (SQLException ignored) {}
        }
    }

    /* ======================= HELPERS ======================= */

    private static int extractIdFromPath(String path) {
        try { return Integer.parseInt(path.split("/")[1]); }
        catch (Exception e) { return -1; }
    }

    private static Part getPartSafe(HttpServletRequest req, String name) {
        try { return req.getPart(name); } catch (Exception e) { return null; }
    }

    private static void setDateOrNull(PreparedStatement ps, int idx, String val) throws SQLException {
        if (val != null && !val.trim().isEmpty() && !"—".equals(val.trim())) {
            try { ps.setDate(idx, Date.valueOf(val.trim())); }
            catch (Exception e) { ps.setNull(idx, Types.DATE); }
        } else {
            ps.setNull(idx, Types.DATE);
        }
    }

    private static String detectMimeType(byte[] data) {
        if (data.length >= 4) {
            if (data[0] == (byte) 0x89 && data[1] == (byte) 0x50) return "image/png";
            if (data[0] == (byte) 0xFF && data[1] == (byte) 0xD8) return "image/jpeg";
            if (data[0] == (byte) 0x47 && data[1] == (byte) 0x49) return "image/gif";
            if (data[0] == (byte) 0x25 && data[1] == (byte) 0x50) return "application/pdf";
        }
        return "image/jpeg";
    }

    private static void addCors(HttpServletResponse r) {
        r.setHeader("Access-Control-Allow-Origin", "*");
        r.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
        r.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private static String safe(String s) { return s == null ? "" : s; }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t");
    }

    private static double parseDouble(String v, double d) {
        try { return Double.parseDouble(v); } catch (Exception e) { return d; }
    }

    private static int parseInt(String v, int d) {
        try { return Integer.parseInt(v); } catch (Exception e) { return d; }
    }

    private static double round(double v) { return Math.round(v * 10.0) / 10.0; }

    private static Integer parseId(String p) {
        try {
            if (p == null) return null;
            return Integer.parseInt(p.split("/")[1]);
        } catch (Exception e) { return null; }
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
        } catch (Exception e) { return ""; }
    }
}