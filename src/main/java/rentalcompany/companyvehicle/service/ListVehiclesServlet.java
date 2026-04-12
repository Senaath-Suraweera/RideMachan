package rentalcompany.companyvehicle.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.companyvehicle.dao.VehicleDAO;
import rentalcompany.companyvehicle.model.Vehicle;
import com.google.gson.Gson;
import java.io.IOException;
import java.util.List;

@WebServlet("/company/vehicle/list")
@MultipartConfig
public class ListVehiclesServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        String companyIdStr = request.getParameter("company_id");
        String providerIdStr = request.getParameter("provider_id");
        String vehicleIdStr = request.getParameter("vehicleid");

        Integer companyId = (companyIdStr != null && !companyIdStr.isEmpty())
                ? Integer.parseInt(companyIdStr)
                : null;
        Integer providerId = (providerIdStr != null && !providerIdStr.isEmpty())
                ? Integer.parseInt(providerIdStr)
                : null;
        Integer vehicleId = (vehicleIdStr != null && !vehicleIdStr.isEmpty())
                ? Integer.parseInt(vehicleIdStr)
                : null;


        List<Vehicle> vehicles = null;
        if (vehicleId != null) vehicles = VehicleDAO.getVehicleById(vehicleId);
        else if (companyId != null) vehicles = VehicleDAO.listVehiclesByCompany(companyId);
        else if (providerId != null) vehicles = VehicleDAO.listVehiclesByProvider(providerId);

        String json = new Gson().toJson(vehicles);
        response.getWriter().write(json);
    }
}
