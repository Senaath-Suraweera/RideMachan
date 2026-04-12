package rentalcompany.maintenance.service;


import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
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


            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");


            String json = "[";

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

                json += "{"
                        + "\"numberplate\":\"" + numberplate + "\","
                        + "\"type\":\"" + type + "\","
                        + "\"brand\":\"" + brand + "\","
                        + "\"model\":\"" + model + "\","
                        + "\"year\":" + year + ","
                        + "\"status\":\"" + status + "\","
                        + "\"lastServiceDate\":\"" + lastServiceDate + "\","
                        + "\"nextServiceDate\":\"" + nextServiceDate + "\""
                        + "}";

                if (i < vehicles.size() - 1) {

                    json += ",";

                }

            }


            json += "]";


            resp.getWriter().write(json);

        }catch(Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }

    }

}
