package admin.service;

import common.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;

@WebServlet("/api/admin/drivers/*")
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
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = req.getPathInfo(); // null, "/", "/{id}"

        /* ================= LIST ================= */
        if (path == null || "/".equals(path)) {

            String name = safe(req.getParameter("name"));
            String license = safe(req.getParameter("license"));
            double minRating = parseDouble(req.getParameter("minRating"), 0);
            String sort = "descending".equalsIgnoreCase(req.getParameter("sort")) ? "DESC" : "ASC";

            // Query WITHOUT Bookings table - uses Driver table's totalrides and totalkm fields
            String sql =
                    "SELECT " +
                            "d.driverid, d.firstname, d.lastname, d.email, d.mobilenumber, d.description, d.nicnumber, " +
                            "COALESCE(d.Area, d.assignedarea, '') AS location, " +
                            "COALESCE(d.joineddate, CURDATE()) AS joineddate, " +
                            "COALESCE(d.licensenumber, '') AS licensenumber, " +
                            "COALESCE(d.status,'') AS status, " +
                            "rc.companyname, " +
                            "COALESCE(AVG(r.rating_value),0) AS rating, " +
                            "COUNT(r.rating_id) AS reviews, " +
                            "COALESCE(d.totalrides, 0) AS totalRides, " +
                            "COALESCE(d.totalkm, 0) AS totalKm " +
                            "FROM Driver d " +
                            "JOIN RentalCompany rc ON rc.companyid=d.company_id " +
                            "LEFT JOIN ratings r ON r.actor_type='DRIVER' AND r.actor_id=d.driverid " +
                            "WHERE LOWER(CONCAT(d.firstname,' ',d.lastname)) LIKE ? " +
                            "AND (LOWER(COALESCE(d.licensenumber,'')) LIKE ? OR LOWER(d.nicnumber) LIKE ?) " +
                            "AND COALESCE(d.banned,0)=0 " +
                            "GROUP BY d.driverid, d.firstname, d.lastname, d.email, d.mobilenumber, " +
                            "d.description, d.nicnumber, d.Area, d.assignedarea, d.joineddate, " +
                            "d.licensenumber, d.status, rc.companyname, d.totalrides, d.totalkm " +
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

                    json.append("{")
                            .append("\"id\":").append(rs.getInt("driverid")).append(",")
                            .append("\"name\":\"").append(esc(rs.getString("firstname") + " " + rs.getString("lastname"))).append("\",")
                            .append("\"company\":\"").append(esc(rs.getString("companyname"))).append("\",")
                            .append("\"licenseNumber\":\"").append(esc(rs.getString("licensenumber"))).append("\",")
                            .append("\"nicNumber\":\"").append(esc(rs.getString("nicnumber"))).append("\",")
                            .append("\"email\":\"").append(esc(rs.getString("email"))).append("\",")
                            .append("\"phone\":\"").append(esc(rs.getString("mobilenumber"))).append("\",")
                            .append("\"location\":\"").append(esc(rs.getString("location"))).append("\",")
                            .append("\"appliedDate\":\"").append(rs.getDate("joineddate")).append("\",")
                            .append("\"status\":\"").append(esc(rs.getString("status"))).append("\",")
                            .append("\"totalRides\":").append(rs.getInt("totalRides")).append(",")
                            .append("\"totalKm\":").append((long) rs.getDouble("totalKm")).append(",")
                            .append("\"rating\":").append(round(rs.getDouble("rating"))).append(",")
                            .append("\"reviews\":").append(rs.getInt("reviews")).append(",")
                            .append("\"description\":\"").append(esc(rs.getString("description"))).append("\"")
                            .append("}");
                }

                json.append("]}");

                // Write the response BEFORE closing resources
                out = resp.getWriter();
                out.print(json.toString());
                out.flush(); // Important: flush the output

            } catch (Exception e) {
                resp.setStatus(500);
                if (out == null) {
                    out = resp.getWriter();
                }
                out.print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
                e.printStackTrace(); // Log the error
            } finally {
                // Close resources in reverse order
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
            PrintWriter out = resp.getWriter();
            out.print("{\"success\":false,\"message\":\"Invalid driver id\"}");
            return;
        }

        String sql =
                "SELECT d.*, rc.companyname, " +
                        "COALESCE(d.Area, d.assignedarea, '') AS location, " +
                        "COALESCE(d.joineddate, CURDATE()) AS joineddate, " +
                        "COALESCE(d.licensenumber, '') AS licensenumber, " +
                        "COALESCE(AVG(r.rating_value),0) AS rating, " +
                        "COUNT(r.rating_id) AS reviews, " +
                        "COALESCE(d.totalrides, 0) AS totalRides, " +
                        "COALESCE(d.totalkm, 0) AS totalKm " +
                        "FROM Driver d " +
                        "JOIN RentalCompany rc ON rc.companyid=d.company_id " +
                        "LEFT JOIN ratings r ON r.actor_type='DRIVER' AND r.actor_id=d.driverid " +
                        "WHERE d.driverid=? " +
                        "GROUP BY d.driverid, d.username, d.firstname, d.lastname, d.email, " +
                        "d.mobilenumber, d.description, d.hashedpassword, d.salt, d.nicnumber, " +
                        "d.nic, d.driverslicence, d.company_id, d.status, d.Area, " +
                        "d.licenceexpirydate, d.homeaddress, d.licensenumber, d.assignedarea, " +
                        "d.shifttime, d.reportingmanager, d.joineddate, d.profilepicture, " +
                        "d.availability, d.age, d.experience_years, d.totalrides, d.totalkm, " +
                        "d.ontimepercentage, d.licensecategories, d.active, d.banned, rc.companyname";

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

            json.append("{\"success\":true,\"driver\":{")
                    .append("\"id\":").append(rs.getInt("driverid")).append(",")
                    .append("\"name\":\"").append(esc(rs.getString("firstname") + " " + rs.getString("lastname"))).append("\",")
                    .append("\"company\":\"").append(esc(rs.getString("companyname"))).append("\",")
                    .append("\"rating\":").append(round(rs.getDouble("rating"))).append(",")
                    .append("\"reviews\":").append(rs.getInt("reviews")).append(",")
                    .append("\"email\":\"").append(esc(rs.getString("email"))).append("\",")
                    .append("\"phone\":\"").append(esc(rs.getString("mobilenumber"))).append("\",")
                    .append("\"age\":").append(rs.getInt("age")).append(",")
                    .append("\"experience\":").append(rs.getInt("experience_years")).append(",")
                    .append("\"location\":\"").append(esc(rs.getString("location"))).append("\",")
                    .append("\"appliedDate\":\"").append(rs.getDate("joineddate")).append("\",")
                    .append("\"licenseNumber\":\"").append(esc(rs.getString("licensenumber"))).append("\",")
                    .append("\"nicNumber\":\"").append(esc(rs.getString("nicnumber"))).append("\",")
                    .append("\"description\":\"").append(esc(rs.getString("description"))).append("\",")
                    .append("\"totalRides\":").append(rs.getInt("totalRides")).append(",")
                    .append("\"totalKm\":").append((long) rs.getDouble("totalKm")).append(",")
                    .append("\"status\":\"").append(esc(rs.getString("status"))).append("\",")
                    .append("\"active\":").append(rs.getBoolean("active")).append(",")
                    .append("\"banned\":").append(rs.getBoolean("banned"))
                    .append("}}");

            out = resp.getWriter();
            out.print(json.toString());
            out.flush();

        } catch (Exception e) {
            resp.setStatus(500);
            if (out == null) {
                try {
                    out = resp.getWriter();
                } catch (IOException ignored) {}
            }
            if (out != null) {
                out.print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            }
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

        String body = readBody(req);

        // Extract all fields from JSON
        String name = get(body, "name");
        String phone = get(body, "phone");
        String email = get(body, "email");
        String location = get(body, "location");
        String status = get(body, "status");
        String description = get(body, "description");
        String nicNumber = get(body, "nicNumber");
        String licenseNumber = get(body, "licenseNumber");
        String licenseExpiry = get(body, "licenseExpiry");
        String appliedDate = get(body, "appliedDate");

        // Parse numeric fields
        int age = parseInt(get(body, "age"), 0);
        int experience = parseInt(get(body, "experience"), 0);

        // Split name into first and last
        String first = name.contains(" ") ? name.split(" ", 2)[0] : name;
        String last  = name.contains(" ") ? name.split(" ", 2)[1] : "";

        String sql =
                "UPDATE Driver SET " +
                        "firstname=?, lastname=?, mobilenumber=?, email=?, Area=?, status=?, " +
                        "description=?, nicnumber=?, licensenumber=?, licenceexpirydate=?, " +
                        "joineddate=?, age=?, experience_years=? " +
                        "WHERE driverid=?";

        Connection con = null;
        PreparedStatement ps = null;

        try {
            con = DBConnection.getConnection();
            ps = con.prepareStatement(sql);

            ps.setString(1, first);
            ps.setString(2, last);
            ps.setString(3, phone);
            ps.setString(4, email);
            ps.setString(5, location);
            ps.setString(6, status);
            ps.setString(7, description);
            ps.setString(8, nicNumber);
            ps.setString(9, licenseNumber);

            // Handle date fields - convert to SQL Date or set NULL
            if (licenseExpiry != null && !licenseExpiry.trim().isEmpty()) {
                try {
                    ps.setDate(10, Date.valueOf(licenseExpiry));
                } catch (Exception e) {
                    ps.setNull(10, Types.DATE);
                }
            } else {
                ps.setNull(10, Types.DATE);
            }

            if (appliedDate != null && !appliedDate.trim().isEmpty()) {
                try {
                    ps.setDate(11, Date.valueOf(appliedDate));
                } catch (Exception e) {
                    ps.setNull(11, Types.DATE);
                }
            } else {
                ps.setNull(11, Types.DATE);
            }

            ps.setInt(12, age);
            ps.setInt(13, experience);
            ps.setInt(14, id);

            int rowsUpdated = ps.executeUpdate();

            if (rowsUpdated > 0) {
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

    /* ======================= POST (BAN / UNBAN) ======================= */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String pathInfo = req.getPathInfo(); // expected: "/{id}/ban" OR "/{id}/unban"
        if (pathInfo == null || pathInfo.trim().isEmpty()) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid request path\"}");
            return;
        }

        String[] parts = pathInfo.split("/");
        // ["", "{id}", "ban"]  -> length 3
        if (parts.length < 3) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid request path\"}");
            return;
        }

        int id;
        try {
            id = Integer.parseInt(parts[1]);
        } catch (Exception ex) {
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

            resp.getWriter().print(
                    "{\"success\":true,\"message\":\"" + (ban ? "Driver banned" : "Driver unbanned") + "\"}"
            );
        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        } finally {
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (con != null) try { con.close(); } catch (SQLException ignored) {}
        }
    }

    /* ======================= HELPERS ======================= */

    private static void addCors(HttpServletResponse r) {
        r.setHeader("Access-Control-Allow-Origin", "*");
        r.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
        r.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    private static String esc(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }

    private static double parseDouble(String v, double d) {
        try { return Double.parseDouble(v); } catch (Exception e) { return d; }
    }

    private static int parseInt(String v, int d) {
        try { return Integer.parseInt(v); } catch (Exception e) { return d; }
    }

    private static double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static Integer parseId(String p) {
        try {
            if (p == null) return null;
            return Integer.parseInt(p.replace("/", ""));
        } catch (Exception e) {
            return null;
        }
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