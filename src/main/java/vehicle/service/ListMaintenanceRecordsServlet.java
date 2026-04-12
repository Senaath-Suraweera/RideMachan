package vehicle.service;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import vehicle.dao.VehicleDAO;
import vehicle.model.MaintenanceRecord;
import vehicle.model.Vehicle;

import java.io.IOException;
import java.util.List;

@WebServlet("/maintenancerecords/list")
public class ListMaintenanceRecordsServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");

        String vehicleIdStr = request.getParameter("vehicleId");


        Integer vehicleId = (vehicleIdStr != null && !vehicleIdStr.isEmpty())
                ? Integer.parseInt(vehicleIdStr)
                : null;


        List<MaintenanceRecord> maintenanceRecords = null;

        if (vehicleId != null) {

            maintenanceRecords = VehicleDAO.getMaintenanceRecordsByVehicleId(vehicleId);

        }


        String json = new Gson().toJson(maintenanceRecords);
        response.getWriter().write(json);


    }

}
