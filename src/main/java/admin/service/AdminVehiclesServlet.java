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
import java.sql.*;

@WebServlet("/api/admin/vehicles/*")
@MultipartConfig(
        maxFileSize = 10 * 1024 * 1024,
        maxRequestSize = 25 * 1024 * 1024,
        fileSizeThreshold = 1024 * 1024
)
public class AdminVehiclesServlet extends HttpServlet {

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

        if (path != null && path.endsWith("/image")) {
            serveVehicleImage(path, resp);
            return;
        }

        if (path != null && path.endsWith("/registration-doc")) {
            serveRegistrationDoc(path, resp);
            return;
        }

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        if (path == null || "/".equals(path)) {

            String companyIdParam = req.getParameter("companyId");
            String brand = safe(req.getParameter("brand"));
            String vehicleType = safe(req.getParameter("vehicleType"));
            String availability = safe(req.getParameter("availability"));
            String sort = "desc".equalsIgnoreCase(req.getParameter("sort")) ? "DESC" : "ASC";

            StringBuilder sql = new StringBuilder();
            sql.append("SELECT v.vehicleid, v.vehiclebrand, v.vehiclemodel, v.numberplatenumber, ")
                    .append("v.color, v.numberofpassengers, v.enginecapacity, v.description, v.milage, ")
                    .append("v.price_per_day, v.location, v.features, v.vehicle_type, v.fuel_type, ")
                    .append("v.availability_status, v.manufacture_year, v.transmission, ")
                    .append("v.tareweight, v.enginenumber, v.chasisnumber, ")
                    .append("v.company_id, v.provider_id, v.created_at, v.updated_at, ")
                    .append("rc.companyname, ")
                    .append("COALESCE(AVG(r.rating_value),0) AS rating, ")
                    .append("COUNT(r.rating_id) AS reviews, ")
                    .append("(CASE WHEN v.vehicleimages IS NOT NULL AND LENGTH(v.vehicleimages) > 1 THEN 1 ELSE 0 END) AS hasImage, ")
                    .append("(CASE WHEN v.registrationdocumentation IS NOT NULL AND LENGTH(v.registrationdocumentation) > 1 THEN 1 ELSE 0 END) AS hasRegDoc ")
                    .append("FROM Vehicle v ")
                    .append("LEFT JOIN RentalCompany rc ON rc.companyid = v.company_id ")
                    .append("LEFT JOIN ratings r ON r.actor_type='VEHICLE' AND r.actor_id = v.vehicleid ")
                    .append("WHERE 1=1 ");

            if (companyIdParam != null && !companyIdParam.isEmpty()) {
                sql.append("AND v.company_id = ? ");
            }
            if (!brand.isEmpty()) {
                sql.append("AND LOWER(CONCAT(v.vehiclebrand,' ',v.vehiclemodel)) LIKE ? ");
            }
            if (!vehicleType.isEmpty()) {
                sql.append("AND LOWER(COALESCE(v.vehicle_type,'')) = ? ");
            }
            if (!availability.isEmpty()) {
                sql.append("AND LOWER(COALESCE(v.availability_status,'')) = ? ");
            }

            sql.append("GROUP BY v.vehicleid ")
                    .append("ORDER BY v.vehiclebrand ").append(sort);

            Connection con = null;
            PreparedStatement ps = null;
            ResultSet rs = null;
            PrintWriter out = null;

            try {
                con = DBConnection.getConnection();
                ps = con.prepareStatement(sql.toString());

                int idx = 1;
                if (companyIdParam != null && !companyIdParam.isEmpty()) {
                    ps.setInt(idx++, Integer.parseInt(companyIdParam));
                }
                if (!brand.isEmpty()) {
                    ps.setString(idx++, "%" + brand.toLowerCase() + "%");
                }
                if (!vehicleType.isEmpty()) {
                    ps.setString(idx++, vehicleType.toLowerCase());
                }
                if (!availability.isEmpty()) {
                    ps.setString(idx++, availability.toLowerCase());
                }

                rs = ps.executeQuery();

                StringBuilder json = new StringBuilder();
                json.append("{\"success\":true,\"vehicles\":[");

                boolean first = true;
                while (rs.next()) {
                    if (!first) json.append(",");
                    first = false;

                    json.append("{")
                            .append("\"id\":").append(rs.getInt("vehicleid")).append(",")
                            .append("\"brand\":\"").append(esc(rs.getString("vehiclebrand"))).append("\",")
                            .append("\"model\":\"").append(esc(rs.getString("vehiclemodel"))).append("\",")
                            .append("\"name\":\"").append(esc(rs.getString("vehiclebrand") + " " + rs.getString("vehiclemodel"))).append("\",")
                            .append("\"numberPlate\":\"").append(esc(rs.getString("numberplatenumber"))).append("\",")
                            .append("\"color\":\"").append(esc(rs.getString("color"))).append("\",")
                            .append("\"passengers\":").append(rs.getInt("numberofpassengers")).append(",")
                            .append("\"engineCapacity\":").append(rs.getInt("enginecapacity")).append(",")
                            .append("\"description\":\"").append(esc(rs.getString("description"))).append("\",")
                            .append("\"mileage\":\"").append(esc(rs.getString("milage"))).append("\",")
                            .append("\"pricePerDay\":").append(rs.getDouble("price_per_day")).append(",")
                            .append("\"location\":\"").append(esc(rs.getString("location"))).append("\",")
                            .append("\"features\":\"").append(esc(rs.getString("features"))).append("\",")
                            .append("\"vehicleType\":\"").append(esc(rs.getString("vehicle_type"))).append("\",")
                            .append("\"fuelType\":\"").append(esc(rs.getString("fuel_type"))).append("\",")
                            .append("\"availabilityStatus\":\"").append(esc(rs.getString("availability_status"))).append("\",")
                            .append("\"manufactureYear\":").append(rs.getObject("manufacture_year") == null ? "null" : rs.getInt("manufacture_year")).append(",")
                            .append("\"transmission\":\"").append(esc(rs.getString("transmission"))).append("\",")
                            .append("\"tareWeight\":").append(rs.getInt("tareweight")).append(",")
                            .append("\"engineNumber\":\"").append(esc(rs.getString("enginenumber"))).append("\",")
                            .append("\"chassisNumber\":\"").append(esc(rs.getString("chasisnumber"))).append("\",")
                            .append("\"companyId\":").append(rs.getObject("company_id") == null ? "null" : rs.getInt("company_id")).append(",")
                            .append("\"companyName\":\"").append(esc(rs.getString("companyname"))).append("\",")
                            .append("\"providerId\":").append(rs.getObject("provider_id") == null ? "null" : rs.getInt("provider_id")).append(",")
                            .append("\"rating\":").append(round(rs.getDouble("rating"))).append(",")
                            .append("\"reviews\":").append(rs.getInt("reviews")).append(",")
                            .append("\"hasImage\":").append(rs.getInt("hasImage") > 0).append(",")
                            .append("\"hasRegDoc\":").append(rs.getInt("hasRegDoc") > 0).append(",")
                            .append("\"imageUrl\":\"/api/admin/vehicles/").append(rs.getInt("vehicleid")).append("/image\",")
                            .append("\"registrationDocUrl\":\"/api/admin/vehicles/").append(rs.getInt("vehicleid")).append("/registration-doc\"")
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
                close(rs, ps, con);
            }
            return;
        }

        Integer id = parseId(path);
        if (id == null) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid vehicle id\"}");
            return;
        }

        String sql =
                "SELECT v.*, rc.companyname, " +
                        "COALESCE(AVG(r.rating_value),0) AS rating, " +
                        "COUNT(r.rating_id) AS reviews, " +
                        "(CASE WHEN v.vehicleimages IS NOT NULL AND LENGTH(v.vehicleimages) > 1 THEN 1 ELSE 0 END) AS hasImage, " +
                        "(CASE WHEN v.registrationdocumentation IS NOT NULL AND LENGTH(v.registrationdocumentation) > 1 THEN 1 ELSE 0 END) AS hasRegDoc " +
                        "FROM Vehicle v " +
                        "LEFT JOIN RentalCompany rc ON rc.companyid = v.company_id " +
                        "LEFT JOIN ratings r ON r.actor_type='VEHICLE' AND r.actor_id = v.vehicleid " +
                        "WHERE v.vehicleid = ? " +
                        "GROUP BY v.vehicleid";

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        PrintWriter out = null;

        try {
            con = DBConnection.getConnection();
            ps = con.prepareStatement(sql);
            ps.setInt(1, id);
            rs = ps.executeQuery();

            if (!rs.next()) {
                resp.setStatus(404);
                resp.getWriter().print("{\"success\":false,\"message\":\"Vehicle not found\"}");
                return;
            }

            StringBuilder json = new StringBuilder();
            json.append("{\"success\":true,\"vehicle\":{")
                    .append("\"id\":").append(rs.getInt("vehicleid")).append(",")
                    .append("\"brand\":\"").append(esc(rs.getString("vehiclebrand"))).append("\",")
                    .append("\"model\":\"").append(esc(rs.getString("vehiclemodel"))).append("\",")
                    .append("\"name\":\"").append(esc(rs.getString("vehiclebrand") + " " + rs.getString("vehiclemodel"))).append("\",")
                    .append("\"numberPlate\":\"").append(esc(rs.getString("numberplatenumber"))).append("\",")
                    .append("\"color\":\"").append(esc(rs.getString("color"))).append("\",")
                    .append("\"passengers\":").append(rs.getInt("numberofpassengers")).append(",")
                    .append("\"engineCapacity\":").append(rs.getInt("enginecapacity")).append(",")
                    .append("\"engineNumber\":\"").append(esc(rs.getString("enginenumber"))).append("\",")
                    .append("\"chassisNumber\":\"").append(esc(rs.getString("chasisnumber"))).append("\",")
                    .append("\"tareWeight\":").append(rs.getInt("tareweight")).append(",")
                    .append("\"description\":\"").append(esc(rs.getString("description"))).append("\",")
                    .append("\"mileage\":\"").append(esc(rs.getString("milage"))).append("\",")
                    .append("\"pricePerDay\":").append(rs.getDouble("price_per_day")).append(",")
                    .append("\"location\":\"").append(esc(rs.getString("location"))).append("\",")
                    .append("\"features\":\"").append(esc(rs.getString("features"))).append("\",")
                    .append("\"vehicleType\":\"").append(esc(rs.getString("vehicle_type"))).append("\",")
                    .append("\"fuelType\":\"").append(esc(rs.getString("fuel_type"))).append("\",")
                    .append("\"availabilityStatus\":\"").append(esc(rs.getString("availability_status"))).append("\",")
                    .append("\"manufactureYear\":").append(rs.getObject("manufacture_year") == null ? "null" : rs.getInt("manufacture_year")).append(",")
                    .append("\"transmission\":\"").append(esc(rs.getString("transmission"))).append("\",")
                    .append("\"companyId\":").append(rs.getObject("company_id") == null ? "null" : rs.getInt("company_id")).append(",")
                    .append("\"companyName\":\"").append(esc(rs.getString("companyname"))).append("\",")
                    .append("\"providerId\":").append(rs.getObject("provider_id") == null ? "null" : rs.getInt("provider_id")).append(",")
                    .append("\"rating\":").append(round(rs.getDouble("rating"))).append(",")
                    .append("\"reviews\":").append(rs.getInt("reviews")).append(",")
                    .append("\"hasImage\":").append(rs.getInt("hasImage") > 0).append(",")
                    .append("\"hasRegDoc\":").append(rs.getInt("hasRegDoc") > 0).append(",")
                    .append("\"imageUrl\":\"/api/admin/vehicles/").append(rs.getInt("vehicleid")).append("/image\",")
                    .append("\"registrationDocUrl\":\"/api/admin/vehicles/").append(rs.getInt("vehicleid")).append("/registration-doc\"")
                    .append("}}");

            out = resp.getWriter();
            out.print(json.toString());
            out.flush();

        } catch (Exception e) {
            resp.setStatus(500);
            if (out == null) out = resp.getWriter();
            out.print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        } finally {
            close(rs, ps, con);
        }
    }

    /* ======================= POST (CREATE) ======================= */
    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String path = req.getPathInfo();

        if (path != null && path.matches("^/\\d+/status$")) {
            handleStatusChange(req, resp, path);
            return;
        }

        String contentType = req.getContentType();

        if (contentType == null || !contentType.toLowerCase().startsWith("multipart/form-data")) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Vehicle creation must use multipart/form-data\"}");
            return;
        }

        Connection con = null;
        PreparedStatement ps = null;

        try {
            String brand = safe(req.getParameter("brand"));
            String model = safe(req.getParameter("model"));
            String numberPlate = safe(req.getParameter("numberPlate"));
            String color = safe(req.getParameter("color"));
            int passengers = parseInt(req.getParameter("passengers"), 0);
            int engineCapacity = parseInt(req.getParameter("engineCapacity"), 0);
            String engineNumber = safe(req.getParameter("engineNumber"));
            String chassisNumber = safe(req.getParameter("chassisNumber"));
            int tareWeight = parseInt(req.getParameter("tareWeight"), 0);
            String description = safe(req.getParameter("description"));
            String mileage = safe(req.getParameter("mileage"));
            double pricePerDay = parseDouble(req.getParameter("pricePerDay"), 0);
            String location = safe(req.getParameter("location"));
            String features = safe(req.getParameter("features"));
            String vehicleType = safe(req.getParameter("vehicleType"));
            String fuelType = safe(req.getParameter("fuelType"));
            String transmission = safe(req.getParameter("transmission"));
            String availStatus = safe(req.getParameter("availabilityStatus"));
            if (availStatus.isEmpty()) availStatus = "available";
            int companyId = parseInt(req.getParameter("companyId"), 0);
            int providerId = parseInt(req.getParameter("providerId"), 0);
            int manufactureYear = parseInt(req.getParameter("manufactureYear"), 0);

            Part imagePart = getPartSafe(req, "vehicleImage");
            Part regPart = getPartSafe(req, "registrationDoc");

            byte[] vehicleImageBytes = readPartBytes(imagePart);
            byte[] regDocBytes = readPartBytes(regPart);

            if (brand.isEmpty() || model.isEmpty() || numberPlate.isEmpty()) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Brand, model, and number plate are required\"}");
                return;
            }

            if (companyId == 0) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Company ID is required\"}");
                return;
            }

            if (vehicleImageBytes == null || vehicleImageBytes.length == 0) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Vehicle image is required when adding a vehicle\"}");
                return;
            }

            if (regDocBytes == null || regDocBytes.length == 0) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Registration document is required when adding a vehicle\"}");
                return;
            }

            String sql =
                    "INSERT INTO Vehicle (vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color, " +
                            "numberofpassengers, enginecapacity, enginenumber, chasisnumber, registrationdocumentation, " +
                            "vehicleimages, description, milage, company_id, provider_id, price_per_day, location, " +
                            "features, vehicle_type, fuel_type, availability_status, manufacture_year, transmission) " +
                            "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

            con = DBConnection.getConnection();
            ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, brand);
            ps.setString(2, model);
            ps.setString(3, numberPlate);
            ps.setInt(4, tareWeight);
            ps.setString(5, color);
            ps.setInt(6, passengers);
            ps.setInt(7, engineCapacity);
            ps.setString(8, engineNumber);
            ps.setString(9, chassisNumber);
            ps.setBytes(10, regDocBytes);
            ps.setBytes(11, vehicleImageBytes);
            ps.setString(12, description);
            ps.setString(13, mileage);
            if (companyId > 0) ps.setInt(14, companyId); else ps.setNull(14, Types.INTEGER);
            if (providerId > 0) ps.setInt(15, providerId); else ps.setNull(15, Types.INTEGER);
            ps.setDouble(16, pricePerDay);
            ps.setString(17, location);
            ps.setString(18, features);
            ps.setString(19, vehicleType);
            ps.setString(20, fuelType);
            ps.setString(21, availStatus);
            if (manufactureYear > 0) ps.setInt(22, manufactureYear); else ps.setNull(22, Types.INTEGER);
            ps.setString(23, transmission);

            ps.executeUpdate();

            ResultSet keys = ps.getGeneratedKeys();
            int newId = 0;
            if (keys.next()) newId = keys.getInt(1);

            resp.setStatus(201);
            resp.getWriter().print("{\"success\":true,\"message\":\"Vehicle created successfully\",\"vehicleId\":" + newId + "}");

        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        } finally {
            close(null, ps, con);
        }
    }

    /* ======================= PUT (UPDATE) ======================= */
    @Override
    protected void doPut(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer id = parseId(req.getPathInfo());
        if (id == null) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid vehicle id\"}");
            return;
        }

        String contentType = req.getContentType();
        if (contentType == null || !contentType.toLowerCase().startsWith("multipart/form-data")) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Vehicle update must use multipart/form-data\"}");
            return;
        }

        Connection con = null;
        PreparedStatement ps = null;

        try {
            String brand = safe(req.getParameter("brand"));
            String model = safe(req.getParameter("model"));
            String numberPlate = safe(req.getParameter("numberPlate"));
            String color = safe(req.getParameter("color"));
            int passengers = parseInt(req.getParameter("passengers"), 0);
            int engineCapacity = parseInt(req.getParameter("engineCapacity"), 0);
            String engineNumber = safe(req.getParameter("engineNumber"));
            String chassisNumber = safe(req.getParameter("chassisNumber"));
            int tareWeight = parseInt(req.getParameter("tareWeight"), 0);
            String description = safe(req.getParameter("description"));
            String mileage = safe(req.getParameter("mileage"));
            double pricePerDay = parseDouble(req.getParameter("pricePerDay"), 0);
            String location = safe(req.getParameter("location"));
            String features = safe(req.getParameter("features"));
            String vehicleType = safe(req.getParameter("vehicleType"));
            String fuelType = safe(req.getParameter("fuelType"));
            String transmission = safe(req.getParameter("transmission"));
            String availStatus = safe(req.getParameter("availabilityStatus"));
            if (availStatus.isEmpty()) availStatus = "available";
            int manufactureYear = parseInt(req.getParameter("manufactureYear"), 0);

            Part imagePart = getPartSafe(req, "vehicleImage");
            Part regPart = getPartSafe(req, "registrationDoc");

            byte[] imageBytes = readPartBytes(imagePart);
            byte[] regBytes = readPartBytes(regPart);

            if (brand.isEmpty() || model.isEmpty() || numberPlate.isEmpty()) {
                resp.setStatus(400);
                resp.getWriter().print("{\"success\":false,\"message\":\"Brand, model, and number plate are required\"}");
                return;
            }

            con = DBConnection.getConnection();
            con.setAutoCommit(false);

            String sql =
                    "UPDATE Vehicle SET vehiclebrand=?, vehiclemodel=?, numberplatenumber=?, " +
                            "tareweight=?, color=?, numberofpassengers=?, enginecapacity=?, enginenumber=?, " +
                            "chasisnumber=?, description=?, milage=?, price_per_day=?, location=?, " +
                            "features=?, vehicle_type=?, fuel_type=?, availability_status=?, " +
                            "manufacture_year=?, transmission=? WHERE vehicleid=?";

            ps = con.prepareStatement(sql);
            ps.setString(1, brand);
            ps.setString(2, model);
            ps.setString(3, numberPlate);
            ps.setInt(4, tareWeight);
            ps.setString(5, color);
            ps.setInt(6, passengers);
            ps.setInt(7, engineCapacity);
            ps.setString(8, engineNumber);
            ps.setString(9, chassisNumber);
            ps.setString(10, description);
            ps.setString(11, mileage);
            ps.setDouble(12, pricePerDay);
            ps.setString(13, location);
            ps.setString(14, features);
            ps.setString(15, vehicleType);
            ps.setString(16, fuelType);
            ps.setString(17, availStatus);
            if (manufactureYear > 0) ps.setInt(18, manufactureYear); else ps.setNull(18, Types.INTEGER);
            ps.setString(19, transmission);
            ps.setInt(20, id);

            int rows = ps.executeUpdate();
            ps.close();

            if (rows == 0) {
                con.rollback();
                resp.setStatus(404);
                resp.getWriter().print("{\"success\":false,\"message\":\"Vehicle not found\"}");
                return;
            }

            if (imageBytes != null && imageBytes.length > 0) {
                ps = con.prepareStatement("UPDATE Vehicle SET vehicleimages=? WHERE vehicleid=?");
                ps.setBytes(1, imageBytes);
                ps.setInt(2, id);
                ps.executeUpdate();
                ps.close();
            }

            if (regBytes != null && regBytes.length > 0) {
                ps = con.prepareStatement("UPDATE Vehicle SET registrationdocumentation=? WHERE vehicleid=?");
                ps.setBytes(1, regBytes);
                ps.setInt(2, id);
                ps.executeUpdate();
                ps.close();
            }

            con.commit();
            resp.getWriter().print("{\"success\":true,\"message\":\"Vehicle updated successfully\"}");

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

    /* ======================= DELETE ======================= */
    @Override
    protected void doDelete(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Integer id = parseId(req.getPathInfo());
        if (id == null) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid vehicle id\"}");
            return;
        }

        Connection con = null;
        PreparedStatement ps = null;

        try {
            con = DBConnection.getConnection();
            ps = con.prepareStatement("DELETE FROM Vehicle WHERE vehicleid=?");
            ps.setInt(1, id);
            int rows = ps.executeUpdate();

            if (rows > 0) {
                resp.getWriter().print("{\"success\":true,\"message\":\"Vehicle deleted successfully\"}");
            } else {
                resp.setStatus(404);
                resp.getWriter().print("{\"success\":false,\"message\":\"Vehicle not found\"}");
            }

        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        } finally {
            close(null, ps, con);
        }
    }

    /* ======================= STATUS CHANGE ======================= */
    private void handleStatusChange(HttpServletRequest req, HttpServletResponse resp, String path) throws IOException {
        int vehicleId = extractIdFromPath(path);
        if (vehicleId < 0) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Invalid vehicle id\"}");
            return;
        }

        String body = readBody(req);
        String status = get(body, "status");
        if (status.isEmpty()) {
            resp.setStatus(400);
            resp.getWriter().print("{\"success\":false,\"message\":\"Status is required\"}");
            return;
        }

        Connection con = null;
        PreparedStatement ps = null;

        try {
            con = DBConnection.getConnection();
            ps = con.prepareStatement("UPDATE Vehicle SET availability_status=? WHERE vehicleid=?");
            ps.setString(1, status);
            ps.setInt(2, vehicleId);
            ps.executeUpdate();
            resp.getWriter().print("{\"success\":true,\"message\":\"Vehicle status updated\"}");
        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().print("{\"success\":false,\"message\":\"" + esc(e.getMessage()) + "\"}");
            e.printStackTrace();
        } finally {
            close(null, ps, con);
        }
    }

    /* ======================= SERVE IMAGE ======================= */
    private void serveVehicleImage(String path, HttpServletResponse resp) throws IOException {
        int vehicleId = extractIdFromPath(path);
        if (vehicleId < 0) {
            resp.setStatus(400);
            return;
        }

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            con = DBConnection.getConnection();
            ps = con.prepareStatement("SELECT vehicleimages FROM Vehicle WHERE vehicleid=?");
            ps.setInt(1, vehicleId);
            rs = ps.executeQuery();

            if (!rs.next()) {
                resp.setStatus(404);
                return;
            }

            byte[] data = rs.getBytes("vehicleimages");
            if (data == null || data.length == 0 || (data.length == 1 && data[0] == 0)) {
                resp.setStatus(404);
                return;
            }

            resp.setContentType(detectMimeType(data));
            resp.setContentLength(data.length);
            resp.setHeader("Cache-Control", "max-age=300");

            OutputStream out = resp.getOutputStream();
            out.write(data);
            out.flush();

        } catch (Exception e) {
            resp.setStatus(500);
            e.printStackTrace();
        } finally {
            close(rs, ps, con);
        }
    }

    /* ======================= SERVE REG DOC ======================= */
    private void serveRegistrationDoc(String path, HttpServletResponse resp) throws IOException {
        int vehicleId = extractIdFromPath(path);
        if (vehicleId < 0) {
            resp.setStatus(400);
            return;
        }

        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;

        try {
            con = DBConnection.getConnection();
            ps = con.prepareStatement("SELECT registrationdocumentation FROM Vehicle WHERE vehicleid=?");
            ps.setInt(1, vehicleId);
            rs = ps.executeQuery();

            if (!rs.next()) {
                resp.setStatus(404);
                return;
            }

            byte[] data = rs.getBytes("registrationdocumentation");
            if (data == null || data.length == 0 || (data.length == 1 && data[0] == 0)) {
                resp.setStatus(404);
                return;
            }

            resp.setContentType(detectMimeType(data));
            resp.setContentLength(data.length);
            resp.setHeader("Cache-Control", "max-age=300");
            resp.setHeader("Content-Disposition", "inline; filename=\"vehicle-registration\"");

            OutputStream out = resp.getOutputStream();
            out.write(data);
            out.flush();

        } catch (Exception e) {
            resp.setStatus(500);
            e.printStackTrace();
        } finally {
            close(rs, ps, con);
        }
    }

    /* ======================= HELPERS ======================= */
    private static int extractIdFromPath(String path) {
        try {
            return Integer.parseInt(path.split("/")[1]);
        } catch (Exception e) {
            return -1;
        }
    }

    private static Part getPartSafe(HttpServletRequest req, String name) {
        try {
            return req.getPart(name);
        } catch (Exception e) {
            return null;
        }
    }

    private static byte[] readPartBytes(Part part) throws IOException {
        if (part == null || part.getSize() <= 0) return null;
        try (InputStream in = part.getInputStream()) {
            return in.readAllBytes();
        }
    }

    private static String detectMimeType(byte[] data) {
        if (data != null && data.length >= 4) {
            if (data[0] == (byte) 0x89 && data[1] == (byte) 0x50) return "image/png";
            if (data[0] == (byte) 0xFF && data[1] == (byte) 0xD8) return "image/jpeg";
            if (data[0] == (byte) 0x47 && data[1] == (byte) 0x49) return "image/gif";
            if (data[0] == (byte) 0x25 && data[1] == (byte) 0x50) return "application/pdf";
        }
        return "application/octet-stream";
    }

    private static void addCors(HttpServletResponse r) {
        r.setHeader("Access-Control-Allow-Origin", "*");
        r.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        r.setHeader("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void close(ResultSet rs, PreparedStatement ps, Connection con) {
        if (rs != null) try { rs.close(); } catch (SQLException ignored) {}
        if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
        if (con != null) try { con.close(); } catch (SQLException ignored) {}
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

    private static double round(double v) {
        return Math.round(v * 10.0) / 10.0;
    }

    private static Integer parseId(String p) {
        try {
            if (p == null) return null;
            return Integer.parseInt(p.split("/")[1]);
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