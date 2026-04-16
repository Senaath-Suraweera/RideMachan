package rentalcompany.maintenance.service;


import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.companyvehicle.model.MaintenanceRecord;
import rentalcompany.maintenance.controller.MaintenanceStaffDAO;
import rentalcompany.companyvehicle.model.Vehicle;

import java.io.IOException;
import java.util.List;

@WebServlet("/assignedvehicles")
public class LoadAssignedVehicleswServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("staff_id") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "/maintenance.html?redirect=" + requestedPage);
                return;
            }

            int staffId = (int) session.getAttribute("staff_id");


            List<Vehicle> vehicles = MaintenanceStaffDAO.getAssignedVehicles(staffId);
            List<MaintenanceRecord> logs = MaintenanceStaffDAO.getMaintenanceLogsByStaffId(staffId);

            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");

            String json = "{";
            json += "\"assignedvehicles\":[";

            for (int i = 0; i < vehicles.size(); i++) {

                Vehicle v = vehicles.get(i);

                String numberplate = v.getNumberPlateNumber();
                String type = v.getType();
                String brand = v.getVehicleBrand();
                String model = v.getVehicleModel();
                int year = v.getYear();
                String status = v.getStatus();
                String lastServiceDate = v.getLastServiceDate();
                String nextServiceDate = v.getNextServiceDate();

                if (type == null) type = "";
                if (lastServiceDate == null) lastServiceDate = "";
                if (nextServiceDate == null) nextServiceDate = "";

                json += "{";
                json += "\"vehicleId\":" + v.getVehicleId() + ",";
                json += "\"numberplate\":\"" + v.getNumberPlateNumber() + "\",";
                json += "\"type\":\"" + v.getType() + "\",";
                json += "\"brand\":\"" + v.getVehicleBrand() + "\",";
                json += "\"model\":\"" + v.getVehicleModel() + "\",";
                json += "\"year\":" + v.getYear() + ",";
                json += "\"status\":\"" + v.getStatus() + "\"";

                json += ",\"maintenanceLogs\":[";

                boolean firstLog = true;

                for (MaintenanceRecord r : logs) {

                    if (r.getVehicleId() == v.getVehicleId()) {

                        if (!firstLog) json += ",";

                        json += "{";
                        json += "\"jobId\":" + r.getRecordId() + ",";
                        json += "\"type\":\"" + r.getServiceType() + "\",";
                        json += "\"status\":\"" + r.getStatus() + "\",";
                        json += "\"completedDate\":\"" + r.getCompletedDate() + "\"";
                        json += "}";

                        firstLog = false;
                    }
                }

                json += "]";

                json += "}";

                if (i < vehicles.size() - 1) {
                    json += ",";
                }
            }

            json += "]";
            json += "}";

            resp.getWriter().write(json);

        }catch(Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }

    }

}
