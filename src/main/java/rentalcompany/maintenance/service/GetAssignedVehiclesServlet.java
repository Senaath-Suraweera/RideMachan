package rentalcompany.maintenance.service;

import jakarta.servlet.*;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.maintenance.controller.MaintenanceStaffDAO;
import rentalcompany.companyvehicle.model.Vehicle;
import com.google.gson.Gson;

import java.io.IOException;
import java.util.*;

/**
 * GetAssignedVehiclesServlet
 * Returns the list of vehicles assigned to the currently logged-in maintenance staff.
 * Reads actorId from the HTTP session (set at login as "actorId").
 */
@WebServlet("/maintenance/assignedVehicles")
public class GetAssignedVehiclesServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");

        HttpSession session = req.getSession(false);

        // ── Guard: must be logged in ──────────────────────────────────────
        if (session == null || session.getAttribute("actorId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Not logged in\"}");
            return;
        }

        // ── Read identity from session ────────────────────────────────────
        int staffId;
        try {
            staffId = (int) session.getAttribute("actorId");
        } catch (ClassCastException e) {
            staffId = Integer.parseInt(session.getAttribute("actorId").toString());
        }

        try {
            List<Vehicle> vehicles = MaintenanceStaffDAO.getAssignedVehicles(staffId);

            // Build a lean DTO list for the frontend dropdown
            List<Map<String, Object>> result = new ArrayList<>();
            for (Vehicle v : vehicles) {
                Map<String, Object> dto = new LinkedHashMap<>();
                dto.put("vehicleId",      v.getVehicleId());
                dto.put("numberPlate",    v.getNumberPlateNumber());
                dto.put("brand",          v.getVehicleBrand());
                dto.put("model",          v.getVehicleModel());
                dto.put("displayLabel",   v.getNumberPlateNumber() + " — " + v.getVehicleBrand() + " " + v.getVehicleModel());
                result.add(dto);
            }

            resp.getWriter().write(new Gson().toJson(result));

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type");
        resp.setStatus(HttpServletResponse.SC_OK);
    }
}