package admin.service;

import common.util.DBConnection;
import common.util.PasswordServices;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;
import java.sql.*;

@WebServlet("/api/admin/maintenance-staff/*")
public class AdminMaintenanceStaffServlet extends HttpServlet {

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

        String path = req.getPathInfo();

        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(500);
                resp.getWriter().print("{\"success\":false,\"message\":\"Database connection failed\"}");
                return;
            }

            if (path != null && path.matches("^/\\d+/assignable-vehicles$")) {
                int maintenanceId = extractIdFromPath(path);
                Integer companyId = getStaffCompanyId(con, maintenanceId);
                if (companyId == null) {
                    resp.setStatus(404);
                    resp.getWriter().print("{\"success\":false,\"message\":\"Staff not found\"}");
                    return;
                }

                resp.getWriter().print("{\"success\":true,\"vehicles\":" +
                        getAssignableVehiclesJson(con, maintenanceId, companyId) + "}");
                return;
            }

            if (path != null && path.matches("^/\\d+/job-history$")) {
                int maintenanceId = extractIdFromPath(path);
                Integer companyId = getStaffCompanyId(con, maintenanceId);
                if (companyId == null) {
                    resp.setStatus(404);
                    resp.getWriter().print("{\"success\":false,\"message\":\"Staff not found\"}");
                    return;
                }

                resp.getWriter().print("{\"success\":true,\"history\":" +
                        getJobHistoryJson(con, maintenanceId, companyId) + "}");
                return;
            }

            /* ================= LIST ================= */
            if (path == null || "/".equals(path)) {

                String companyIdParam = safe(req.getParameter("companyId"));
                String name = safe(req.getParameter("name")).trim().toLowerCase();
                String status = safe(req.getParameter("status")).trim();
                String sort = "desc".equalsIgnoreCase(req.getParameter("sort")) ? "DESC" : "ASC";

                StringBuilder sql = new StringBuilder();
                sql.append("SELECT ")
                        .append("ms.maintenanceid, ms.username, ms.firstname, ms.lastname, ms.email, ms.mobilenumber, ")
                        .append("ms.company_id, ms.specialization, ms.status, ms.yearsOfExperience, ")
                        .append("rc.companyname, ")
                        .append("(SELECT COUNT(*) FROM CalendarEvents ce ")
                        .append(" WHERE ce.maintenance_id = ms.maintenanceid AND ce.status = 'completed') AS completedJobs, ")
                        .append("(SELECT COUNT(*) FROM CalendarEvents ce ")
                        .append(" WHERE ce.maintenance_id = ms.maintenanceid AND ce.status IN ('scheduled','in-progress')) AS activeJobs, ")
                        .append("(SELECT COUNT(*) FROM maintenance_vehicle_assignment mva ")
                        .append(" WHERE mva.maintenanceid = ms.maintenanceid AND LOWER(COALESCE(mva.status,'assigned')) = 'assigned') AS assignedVehicleCount ")
                        .append("FROM MaintenanceStaff ms ")
                        .append("JOIN RentalCompany rc ON rc.companyid = ms.company_id ")
                        .append("WHERE 1=1 ");

                if (!companyIdParam.isEmpty()) {
                    sql.append("AND ms.company_id = ? ");
                }
                if (!name.isEmpty()) {
                    sql.append("AND (")
                            .append("LOWER(ms.firstname) LIKE ? ")
                            .append("OR LOWER(ms.lastname) LIKE ? ")
                            .append("OR LOWER(CONCAT(ms.firstname,' ',ms.lastname)) LIKE ? ")
                            .append("OR LOWER(ms.email) LIKE ? ")
                            .append("OR LOWER(ms.username) LIKE ? ")
                            .append(") ");
                }
                if (!status.isEmpty()) {
                    sql.append("AND ms.status = ? ");
                }

                sql.append("ORDER BY ms.firstname ").append(sort).append(", ms.lastname ").append(sort);

                try (PreparedStatement ps = con.prepareStatement(sql.toString())) {
                    int idx = 1;

                    if (!companyIdParam.isEmpty()) {
                        ps.setInt(idx++, Integer.parseInt(companyIdParam));
                    }

                    if (!name.isEmpty()) {
                        String like = "%" + name + "%";
                        ps.setString(idx++, like);
                        ps.setString(idx++, like);
                        ps.setString(idx++, like);
                        ps.setString(idx++, like);
                        ps.setString(idx++, like);
                    }

                    if (!status.isEmpty()) {
                        ps.setString(idx++, status);
                    }

                    try (ResultSet rs = ps.executeQuery()) {
                        StringBuilder json = new StringBuilder();
                        json.append("{\"success\":true,\"staff\":[");

                        boolean first = true;
                        while (rs.next()) {
                            if (!first) json.append(",");
                            first = false;

                            json.append("{")
                                    .append("\"id\":").append(rs.getInt("maintenanceid")).append(",")
                                    .append("\"username\":\"").append(esc(rs.getString("username"))).append("\",")
                                    .append("\"firstName\":\"").append(esc(rs.getString("firstname"))).append("\",")
                                    .append("\"lastName\":\"").append(esc(rs.getString("lastname"))).append("\",")
                                    .append("\"name\":\"").append(esc(
                                            (safe(rs.getString("firstname")) + " " + safe(rs.getString("lastname"))).trim()
                                    )).append("\",")
                                    .append("\"email\":\"").append(esc(rs.getString("email"))).append("\",")
                                    .append("\"phone\":\"").append(esc(rs.getString("mobilenumber"))).append("\",")
                                    .append("\"companyId\":").append(rs.getInt("company_id")).append(",")
                                    .append("\"companyName\":\"").append(esc(rs.getString("companyname"))).append("\",")
                                    .append("\"specialization\":\"").append(esc(rs.getString("specialization"))).append("\",")
                                    .append("\"status\":\"").append(esc(rs.getString("status"))).append("\",")
                                    .append("\"yearsOfExperience\":").append(rs.getDouble("yearsOfExperience")).append(",")
                                    .append("\"completedJobs\":").append(rs.getInt("completedJobs")).append(",")
                                    .append("\"activeJobs\":").append(rs.getInt("activeJobs")).append(",")
                                    .append("\"assignedVehicleCount\":").append(rs.getInt("assignedVehicleCount"))
                                    .append("}");
                        }

                        json.append("]}");
                        resp.getWriter().print(json.toString());
                    }
                }
                return;
            }

            /* ================= DETAIL ================= */
            Integer id = parseId(path);
            if (id == null) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Invalid staff id\"}");
                return;
            }

            String sql =
                    "SELECT " +
                            "ms.maintenanceid, ms.username, ms.firstname, ms.lastname, ms.email, ms.mobilenumber, " +
                            "ms.company_id, ms.specialization, ms.status, ms.yearsOfExperience, " +
                            "rc.companyname, " +
                            "(SELECT COUNT(*) FROM CalendarEvents ce WHERE ce.maintenance_id = ms.maintenanceid AND ce.status = 'completed') AS completedJobs, " +
                            "(SELECT COUNT(*) FROM CalendarEvents ce WHERE ce.maintenance_id = ms.maintenanceid AND ce.status IN ('scheduled','in-progress')) AS activeJobs, " +
                            "(SELECT COUNT(*) FROM CalendarEvents ce WHERE ce.maintenance_id = ms.maintenanceid) AS totalJobs, " +
                            "(SELECT COUNT(*) FROM maintenance_vehicle_assignment mva WHERE mva.maintenanceid = ms.maintenanceid AND LOWER(COALESCE(mva.status,'assigned')) = 'assigned') AS assignedVehicleCount " +
                            "FROM MaintenanceStaff ms " +
                            "JOIN RentalCompany rc ON rc.companyid = ms.company_id " +
                            "WHERE ms.maintenanceid = ?";

            try (PreparedStatement ps = con.prepareStatement(sql)) {
                ps.setInt(1, id);

                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        resp.setStatus(404);
                        resp.getWriter().print("{\"success\":false,\"message\":\"Staff not found\"}");
                        return;
                    }

                    int companyId = rs.getInt("company_id");
                    String assignedVehiclesJson = getAssignedVehiclesJson(con, id, companyId);
                    String jobHistoryJson = getJobHistoryJson(con, id, companyId);

                    StringBuilder json = new StringBuilder();
                    json.append("{\"success\":true,\"staff\":{")
                            .append("\"id\":").append(rs.getInt("maintenanceid")).append(",")
                            .append("\"username\":\"").append(esc(rs.getString("username"))).append("\",")
                            .append("\"firstName\":\"").append(esc(rs.getString("firstname"))).append("\",")
                            .append("\"lastName\":\"").append(esc(rs.getString("lastname"))).append("\",")
                            .append("\"name\":\"").append(esc(
                                    (safe(rs.getString("firstname")) + " " + safe(rs.getString("lastname"))).trim()
                            )).append("\",")
                            .append("\"email\":\"").append(esc(rs.getString("email"))).append("\",")
                            .append("\"phone\":\"").append(esc(rs.getString("mobilenumber"))).append("\",")
                            .append("\"companyId\":").append(companyId).append(",")
                            .append("\"companyName\":\"").append(esc(rs.getString("companyname"))).append("\",")
                            .append("\"specialization\":\"").append(esc(rs.getString("specialization"))).append("\",")
                            .append("\"status\":\"").append(esc(rs.getString("status"))).append("\",")
                            .append("\"yearsOfExperience\":").append(rs.getDouble("yearsOfExperience")).append(",")
                            .append("\"completedJobs\":").append(rs.getInt("completedJobs")).append(",")
                            .append("\"activeJobs\":").append(rs.getInt("activeJobs")).append(",")
                            .append("\"totalJobs\":").append(rs.getInt("totalJobs")).append(",")
                            .append("\"assignedVehicleCount\":").append(rs.getInt("assignedVehicleCount")).append(",")
                            .append("\"assignedVehicles\":").append(assignedVehiclesJson).append(",")
                            .append("\"jobHistory\":").append(jobHistoryJson)
                            .append("}}");

                    resp.getWriter().print(json.toString());
                }
            }

        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        }
    }

    /* ======================= POST ======================= */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = req.getPathInfo();

        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(500);
                resp.getWriter().print("{\"success\":false,\"message\":\"Database connection failed\"}");
                return;
            }

            if (path != null && path.matches("^/\\d+/assign-vehicle$")) {
                handleAssignVehicle(req, resp, con, extractIdFromPath(path));
                return;
            }

            String body = readBody(req);

            String username = normalizeUsername(get(body, "username"));
            String firstName = safe(get(body, "firstName")).trim();
            String lastName = safe(get(body, "lastName")).trim();
            String email = safe(get(body, "email")).trim().toLowerCase();
            String phone = safe(get(body, "phone")).trim();
            String specialization = safe(get(body, "specialization")).trim();
            String status = safe(get(body, "status")).trim();
            double experience = parseDouble(get(body, "yearsOfExperience"), 0);
            int companyId = parseInt(get(body, "companyId"), 0);
            String password = safe(get(body, "password"));

            if (firstName.isEmpty() || lastName.isEmpty() || email.isEmpty() || companyId <= 0 || password.isEmpty()) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"First name, last name, email, password, and company are required\"}");
                return;
            }

            if (password.length() < 6) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Password must be at least 6 characters\"}");
                return;
            }

            if (username.isEmpty()) {
                username = buildUsernameFromEmail(email);
            }

            if (specialization.isEmpty()) specialization = "General";
            if (status.isEmpty()) status = "available";

            try (PreparedStatement ps = con.prepareStatement(
                    "SELECT companyid FROM RentalCompany WHERE companyid=?"
            )) {
                ps.setInt(1, companyId);
                try (ResultSet rs = ps.executeQuery()) {
                    if (!rs.next()) {
                        resp.setStatus(400);
                        resp.getWriter().print("{\"success\":false,\"message\":\"Selected company does not exist\"}");
                        return;
                    }
                }
            }

            if (exists(con, "SELECT 1 FROM MaintenanceStaff WHERE LOWER(username)=LOWER(?)", username)) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Username already exists\"}");
                return;
            }
            if (exists(con, "SELECT 1 FROM MaintenanceStaff WHERE LOWER(email)=LOWER(?)", email)) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Email already exists\"}");
                return;
            }
            if (!phone.isEmpty() && exists(con, "SELECT 1 FROM MaintenanceStaff WHERE mobilenumber=?", phone)) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Phone number already exists\"}");
                return;
            }

            String salt = PasswordServices.generateSalt();
            String hashedPassword = PasswordServices.hashPassword(password, salt);

            String sql =
                    "INSERT INTO MaintenanceStaff " +
                            "(username, firstname, lastname, email, mobilenumber, hashedpassword, salt, company_id, specialization, status, yearsOfExperience) " +
                            "VALUES (?,?,?,?,?,?,?,?,?,?,?)";

            try (PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
                ps.setString(1, username);
                ps.setString(2, firstName);
                ps.setString(3, lastName);
                ps.setString(4, email);
                ps.setString(5, phone.isEmpty() ? null : phone);
                ps.setString(6, hashedPassword);
                ps.setString(7, salt);
                ps.setInt(8, companyId);
                ps.setString(9, specialization);
                ps.setString(10, status);
                ps.setDouble(11, experience);

                ps.executeUpdate();

                int newId = 0;
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) newId = keys.getInt(1);
                }

                resp.setStatus(201);
                resp.getWriter().print(
                        "{\"success\":true,\"message\":\"Maintenance staff created successfully\",\"staffId\":" + newId + "}"
                );
            }

        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        }
    }

    /* ======================= PUT (UPDATE) ======================= */
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer id = parseId(req.getPathInfo());
        if (id == null) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid staff id\"}");
            return;
        }

        String body = readBody(req);

        String username = normalizeUsername(get(body, "username"));
        String firstName = safe(get(body, "firstName")).trim();
        String lastName = safe(get(body, "lastName")).trim();
        String email = safe(get(body, "email")).trim().toLowerCase();
        String phone = safe(get(body, "phone")).trim();
        String specialization = safe(get(body, "specialization")).trim();
        String status = safe(get(body, "status")).trim();
        double experience = parseDouble(get(body, "yearsOfExperience"), 0);

        if (firstName.isEmpty() || lastName.isEmpty() || email.isEmpty()) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"First name, last name, and email are required\"}");
            return;
        }

        if (specialization.isEmpty()) specialization = "General";
        if (status.isEmpty()) status = "available";

        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(500);
                resp.getWriter().print("{\"success\":false,\"message\":\"Database connection failed\"}");
                return;
            }

            if (!username.isEmpty() && exists(con,
                    "SELECT 1 FROM MaintenanceStaff WHERE LOWER(username)=LOWER(?) AND maintenanceid <> ?",
                    username, id)) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Username already exists\"}");
                return;
            }

            if (exists(con,
                    "SELECT 1 FROM MaintenanceStaff WHERE LOWER(email)=LOWER(?) AND maintenanceid <> ?",
                    email, id)) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Email already exists\"}");
                return;
            }

            if (!phone.isEmpty() && exists(con,
                    "SELECT 1 FROM MaintenanceStaff WHERE mobilenumber=? AND maintenanceid <> ?",
                    phone, id)) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Phone number already exists\"}");
                return;
            }

            StringBuilder sql = new StringBuilder();
            sql.append("UPDATE MaintenanceStaff SET ")
                    .append("firstname=?, lastname=?, email=?, mobilenumber=?, specialization=?, status=?, yearsOfExperience=? ");

            boolean updateUsername = !username.isEmpty();
            if (updateUsername) {
                sql.append(", username=? ");
            }

            sql.append("WHERE maintenanceid=?");

            try (PreparedStatement ps = con.prepareStatement(sql.toString())) {
                int idx = 1;
                ps.setString(idx++, firstName);
                ps.setString(idx++, lastName);
                ps.setString(idx++, email);
                ps.setString(idx++, phone.isEmpty() ? null : phone);
                ps.setString(idx++, specialization);
                ps.setString(idx++, status);
                ps.setDouble(idx++, experience);

                if (updateUsername) {
                    ps.setString(idx++, username);
                }

                ps.setInt(idx, id);

                int rows = ps.executeUpdate();
                if (rows > 0) {
                    resp.getWriter().print("{\"success\":true,\"message\":\"Staff updated successfully\"}");
                } else {
                    resp.setStatus(404);
                    resp.getWriter().print("{\"success\":false,\"message\":\"Staff not found\"}");
                }
            }

        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        }
    }

    /* ======================= DELETE ======================= */
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = req.getPathInfo();

        try (Connection con = DBConnection.getConnection()) {
            if (con == null) {
                resp.setStatus(500);
                resp.getWriter().print("{\"success\":false,\"message\":\"Database connection failed\"}");
                return;
            }

            if (path != null && path.matches("^/\\d+/assign-vehicle/\\d+$")) {
                handleUnassignVehicle(resp, con, path);
                return;
            }

            Integer id = parseId(path);
            if (id == null) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Invalid staff id\"}");
                return;
            }

            try (PreparedStatement ps = con.prepareStatement("DELETE FROM MaintenanceStaff WHERE maintenanceid=?")) {
                ps.setInt(1, id);
                int rows = ps.executeUpdate();

                if (rows > 0) {
                    resp.getWriter().print("{\"success\":true,\"message\":\"Staff deleted successfully\"}");
                } else {
                    resp.setStatus(404);
                    resp.getWriter().print("{\"success\":false,\"message\":\"Staff not found\"}");
                }
            }

        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        }
    }

    /* ======================= ASSIGN / UNASSIGN ======================= */

    private void handleAssignVehicle(HttpServletRequest req, HttpServletResponse resp, Connection con, int maintenanceId) throws Exception {
        String body = readBody(req);

        int vehicleId = parseInt(get(body, "vehicleId"), 0);
        String priority = safe(get(body, "priority")).trim();
        String description = safe(get(body, "description")).trim();

        if (vehicleId <= 0) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Vehicle is required\"}");
            return;
        }

        Integer companyId = getStaffCompanyId(con, maintenanceId);
        if (companyId == null) {
            resp.setStatus(404);
            resp.getWriter().print("{\"success\":false,\"message\":\"Staff not found\"}");
            return;
        }

        if (priority.isEmpty()) priority = "medium";

        if (!vehicleBelongsToCompany(con, vehicleId, companyId)) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Vehicle does not belong to this company\"}");
            return;
        }

        if (isVehicleAssignedToStaff(con, maintenanceId, vehicleId)) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"This vehicle is already assigned to this staff member\"}");
            return;
        }

        String sql = "INSERT INTO maintenance_vehicle_assignment " +
                "(maintenanceid, vehicleid, priority, description, status, assigned_date) " +
                "VALUES (?,?,?,?,'assigned',CURRENT_TIMESTAMP)";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, maintenanceId);
            ps.setInt(2, vehicleId);
            ps.setString(3, priority);
            ps.setString(4, description);
            ps.executeUpdate();
        }

        resp.getWriter().print("{\"success\":true,\"message\":\"Vehicle assigned successfully\"}");
    }

    private void handleUnassignVehicle(HttpServletResponse resp, Connection con, String path) throws Exception {
        String[] parts = path.split("/");

        // Expected: /{staffId}/assign-vehicle/{vehicleId}
        // Example split: ["", "8", "assign-vehicle", "111"]
        if (parts.length < 4) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid request path\"}");
            return;
        }

        int maintenanceId = parseInt(parts[1], 0);
        int vehicleId = parseInt(parts[3], 0);

        if (maintenanceId <= 0 || vehicleId <= 0) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid staff or vehicle id\"}");
            return;
        }

        String sql = "UPDATE maintenance_vehicle_assignment " +
                "SET status='released' " +
                "WHERE maintenanceid=? AND vehicleid=? AND LOWER(COALESCE(status,'assigned'))='assigned'";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, maintenanceId);
            ps.setInt(2, vehicleId);
            int rows = ps.executeUpdate();

            if (rows > 0) {
                resp.getWriter().print("{\"success\":true,\"message\":\"Vehicle unassigned successfully\"}");
            } else {
                resp.setStatus(404);
                resp.getWriter().print("{\"success\":false,\"message\":\"Active vehicle assignment not found\"}");
            }
        }
    }

    /* ======================= HELPERS ======================= */

    private String getAssignedVehiclesJson(Connection con, int maintenanceId, int companyId) throws SQLException {
        String sql =
                "SELECT " +
                        "v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.vehicle_type, v.availability_status, " +
                        "mva.status, mva.priority, mva.description, mva.assigned_date " +
                        "FROM maintenance_vehicle_assignment mva " +
                        "JOIN Vehicle v ON v.vehicleid = mva.vehicleid " +
                        "LEFT JOIN VehicleProvider vp ON vp.providerid = v.provider_id " +
                        "WHERE mva.maintenanceid = ? " +
                        "AND LOWER(COALESCE(mva.status,'assigned')) = 'assigned' " +
                        "AND (v.company_id = ? OR vp.company_id = ?) " +
                        "ORDER BY mva.assigned_date DESC";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, maintenanceId);
            ps.setInt(2, companyId);
            ps.setInt(3, companyId);

            try (ResultSet rs = ps.executeQuery()) {
                StringBuilder json = new StringBuilder("[");
                boolean first = true;

                while (rs.next()) {
                    if (!first) json.append(",");
                    first = false;

                    json.append("{")
                            .append("\"vehicleId\":").append(rs.getInt("vehicleid")).append(",")
                            .append("\"name\":\"").append(esc(
                                    (safe(rs.getString("vehiclebrand")) + " " + safe(rs.getString("vehiclemodel"))).trim()
                            )).append("\",")
                            .append("\"numberPlate\":\"").append(esc(rs.getString("numberplatenumber"))).append("\",")
                            .append("\"vehicleType\":\"").append(esc(rs.getString("vehicle_type"))).append("\",")
                            .append("\"availabilityStatus\":\"").append(esc(rs.getString("availability_status"))).append("\",")
                            .append("\"status\":\"").append(esc(rs.getString("status"))).append("\",")
                            .append("\"priority\":\"").append(esc(rs.getString("priority"))).append("\",")
                            .append("\"description\":\"").append(esc(rs.getString("description"))).append("\",")
                            .append("\"assignedDate\":\"").append(esc(String.valueOf(rs.getTimestamp("assigned_date")))).append("\"")
                            .append("}");
                }

                json.append("]");
                return json.toString();
            }
        }
    }

    private String getAssignableVehiclesJson(Connection con, int maintenanceId, int companyId) throws SQLException {
        String sql =
                "SELECT " +
                        "v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, v.vehicle_type, v.availability_status " +
                        "FROM Vehicle v " +
                        "LEFT JOIN VehicleProvider vp ON vp.providerid = v.provider_id " +
                        "WHERE (v.company_id = ? OR vp.company_id = ?) " +
                        "AND NOT EXISTS ( " +
                        "   SELECT 1 FROM maintenance_vehicle_assignment mva " +
                        "   WHERE mva.vehicleid = v.vehicleid " +
                        "   AND LOWER(COALESCE(mva.status,'assigned')) = 'assigned' " +
                        ") " +
                        "ORDER BY v.vehiclebrand ASC, v.vehiclemodel ASC";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, companyId);
            ps.setInt(2, companyId);

            try (ResultSet rs = ps.executeQuery()) {
                StringBuilder json = new StringBuilder("[");
                boolean first = true;

                while (rs.next()) {
                    if (!first) json.append(",");
                    first = false;

                    json.append("{")
                            .append("\"id\":").append(rs.getInt("vehicleid")).append(",")
                            .append("\"vehicleId\":").append(rs.getInt("vehicleid")).append(",")
                            .append("\"name\":\"").append(esc(
                                    (safe(rs.getString("vehiclebrand")) + " " + safe(rs.getString("vehiclemodel"))).trim()
                            )).append("\",")
                            .append("\"numberPlate\":\"").append(esc(rs.getString("numberplatenumber"))).append("\",")
                            .append("\"vehicleType\":\"").append(esc(rs.getString("vehicle_type"))).append("\",")
                            .append("\"availabilityStatus\":\"").append(esc(rs.getString("availability_status"))).append("\"")
                            .append("}");
                }

                json.append("]");
                return json.toString();
            }
        }
    }

    private String getJobHistoryJson(Connection con, int maintenanceId, int companyId) throws SQLException {
        // Pull from CalendarEvents (service schedule) for job history
        String sql =
                "SELECT " +
                        "ce.eventid AS jobId, ce.vehicle_id AS vehicleId, ce.status, " +
                        "ce.service_type AS serviceType, ce.scheduled_date AS scheduledDate, " +
                        "ce.scheduled_time AS scheduledTime, ce.service_bay AS serviceBay, " +
                        "v.vehiclebrand, v.vehiclemodel, v.numberplatenumber " +
                        "FROM CalendarEvents ce " +
                        "JOIN Vehicle v ON v.vehicleid = ce.vehicle_id " +
                        "LEFT JOIN VehicleProvider vp ON vp.providerid = v.provider_id " +
                        "WHERE ce.maintenance_id = ? " +
                        "AND (v.company_id = ? OR vp.company_id = ?) " +
                        "ORDER BY ce.scheduled_date DESC, ce.scheduled_time DESC";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, maintenanceId);
            ps.setInt(2, companyId);
            ps.setInt(3, companyId);

            try (ResultSet rs = ps.executeQuery()) {
                StringBuilder json = new StringBuilder("[");
                boolean first = true;

                while (rs.next()) {
                    if (!first) json.append(",");
                    first = false;

                    json.append("{")
                            .append("\"jobId\":").append(rs.getInt("jobId")).append(",")
                            .append("\"vehicleId\":").append(rs.getInt("vehicleId")).append(",")
                            .append("\"vehicleName\":\"").append(esc(
                                    (safe(rs.getString("vehiclebrand")) + " " + safe(rs.getString("vehiclemodel"))).trim()
                            )).append("\",")
                            .append("\"numberPlate\":\"").append(esc(rs.getString("numberplatenumber"))).append("\",")
                            .append("\"serviceType\":\"").append(esc(rs.getString("serviceType"))).append("\",")
                            .append("\"status\":\"").append(esc(rs.getString("status"))).append("\",")
                            .append("\"scheduledDate\":\"").append(esc(String.valueOf(rs.getDate("scheduledDate")))).append("\",")
                            .append("\"scheduledTime\":\"").append(esc(String.valueOf(rs.getTime("scheduledTime")))).append("\",")
                            .append("\"serviceBay\":\"").append(esc(rs.getString("serviceBay"))).append("\"")
                            .append("}");
                }

                json.append("]");
                return json.toString();
            }
        }
    }

    private Integer getStaffCompanyId(Connection con, int maintenanceId) throws SQLException {
        try (PreparedStatement ps = con.prepareStatement(
                "SELECT company_id FROM MaintenanceStaff WHERE maintenanceid=?"
        )) {
            ps.setInt(1, maintenanceId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) return rs.getInt("company_id");
                return null;
            }
        }
    }

    private boolean vehicleBelongsToCompany(Connection con, int vehicleId, int companyId) throws SQLException {
        String sql =
                "SELECT v.vehicleid " +
                        "FROM Vehicle v " +
                        "LEFT JOIN VehicleProvider vp ON vp.providerid = v.provider_id " +
                        "WHERE v.vehicleid = ? AND (v.company_id = ? OR vp.company_id = ?)";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, vehicleId);
            ps.setInt(2, companyId);
            ps.setInt(3, companyId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private boolean isVehicleAssignedToStaff(Connection con, int maintenanceId, int vehicleId) throws SQLException {
        String sql = "SELECT 1 FROM maintenance_vehicle_assignment " +
                "WHERE maintenanceid=? AND vehicleid=? AND LOWER(COALESCE(status,'assigned'))='assigned'";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, maintenanceId);
            ps.setInt(2, vehicleId);
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private static boolean exists(Connection con, String sql, Object... params) throws SQLException {
        try (PreparedStatement ps = con.prepareStatement(sql)) {
            for (int i = 0; i < params.length; i++) {
                Object p = params[i];
                if (p instanceof Integer) ps.setInt(i + 1, (Integer) p);
                else ps.setString(i + 1, p == null ? null : String.valueOf(p));
            }
            try (ResultSet rs = ps.executeQuery()) {
                return rs.next();
            }
        }
    }

    private static String buildUsernameFromEmail(String email) {
        String base = email == null ? "maint_staff" : email.split("@")[0];
        base = base.replaceAll("[^a-zA-Z0-9._-]", "");
        if (base.isEmpty()) base = "maint_staff";
        return base;
    }

    private static String normalizeUsername(String username) {
        if (username == null) return "";
        return username.trim().replaceAll("\\s+", "");
    }

    private static int extractIdFromPath(String path) {
        try {
            return Integer.parseInt(path.split("/")[1]);
        } catch (Exception e) {
            return -1;
        }
    }

    private static void addCors(HttpServletResponse r) {
        r.setHeader("Access-Control-Allow-Origin", "*");
        r.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
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
        try {
            return Double.parseDouble(v);
        } catch (Exception e) {
            return d;
        }
    }

    private static int parseInt(String v, int d) {
        try {
            return Integer.parseInt(v);
        } catch (Exception e) {
            return d;
        }
    }

    private static Integer parseId(String p) {
        try {
            if (p == null || p.trim().isEmpty() || "/".equals(p)) return null;
            String[] parts = p.split("/");
            if (parts.length < 2 || parts[1].trim().isEmpty()) return null;
            return Integer.parseInt(parts[1]);
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
            while (i < json.length() && Character.isWhitespace(json.charAt(i))) i++;

            if (i < json.length() && json.charAt(i) == '"') {
                i++;
                StringBuilder sb = new StringBuilder();
                boolean escape = false;
                while (i < json.length()) {
                    char c = json.charAt(i++);
                    if (escape) {
                        sb.append(c);
                        escape = false;
                    } else if (c == '\\') {
                        escape = true;
                    } else if (c == '"') {
                        break;
                    } else {
                        sb.append(c);
                    }
                }
                return sb.toString();
            }

            int e = json.indexOf(",", i);
            if (e == -1) e = json.indexOf("}", i);
            return e == -1 ? "" : json.substring(i, e).trim();

        } catch (Exception e) {
            return "";
        }
    }
}