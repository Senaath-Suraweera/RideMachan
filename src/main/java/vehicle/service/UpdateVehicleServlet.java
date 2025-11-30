package vehicle.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import vehicle.dao.VehicleDAO;
import vehicle.model.Vehicle;

import java.io.IOException;

@WebServlet("/vehicle/update")
@MultipartConfig
public class UpdateVehicleServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        request.setCharacterEncoding("UTF-8");

        try {
            int id = Integer.parseInt(request.getParameter("vehicleid"));
            String brand = request.getParameter("vehiclebrand");
            String model = request.getParameter("vehiclemodel");
            String numberPlate = request.getParameter("numberplatenumber");
            int tareWeight = Integer.parseInt(request.getParameter("tareweight"));
            String color = request.getParameter("color");
            int passengers = Integer.parseInt(request.getParameter("numberofpassengers"));
            int engineCapacity = Integer.parseInt(request.getParameter("enginecapacity"));
            String engineNumber = request.getParameter("enginenumber");
            String chasisNumber = request.getParameter("chasisnumber");
            String description = request.getParameter("description");
            String milage = request.getParameter("milage");

            Vehicle v = new Vehicle();
            v.setVehicleId(id);
            v.setVehicleBrand(brand);
            v.setVehicleModel(model);
            v.setNumberPlateNumber(numberPlate);
            v.setTareWeight(tareWeight);
            v.setColor(color);
            v.setNumberOfPassengers(passengers);
            v.setEngineCapacity(engineCapacity);
            v.setEngineNumber(engineNumber);
            v.setChasisNumber(chasisNumber);
            v.setDescription(description);
            v.setMilage(milage);

            boolean success = VehicleDAO.updateVehicle(v);
            response.getWriter().write("{\"status\":\"" + (success ? "success" : "error") + "\"}");

        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}