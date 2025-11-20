package vehicle.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import vehicle.dao.VehicleDAO;
import vehicle.model.Vehicle;

import java.io.IOException;
import java.io.InputStream;

@WebServlet("/vehicle/add")
@MultipartConfig(maxFileSize = 16177215) // 16MB
public class AddVehicleServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        request.setCharacterEncoding("UTF-8");

        try {
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

            Part docPart = request.getPart("registrationdocumentation");
            Part imagePart = request.getPart("vehicleimages");

            InputStream docStream = docPart != null ? docPart.getInputStream() : null;
            InputStream imgStream = imagePart != null ? imagePart.getInputStream() : null;

            String companyIdStr = request.getParameter("company_id");
            String providerIdStr = request.getParameter("provider_id");

            Integer companyId = (companyIdStr != null && !companyIdStr.isEmpty())
                    ? Integer.parseInt(companyIdStr)
                    : null;

            Integer providerId = (providerIdStr != null && !providerIdStr.isEmpty())
                    ? Integer.parseInt(providerIdStr)
                    : null;

            Vehicle v = new Vehicle(brand, model, numberPlate, tareWeight, color, passengers, engineCapacity,
                    engineNumber, chasisNumber, docStream, imgStream, description, milage, companyId, providerId);

            boolean success = VehicleDAO.addVehicle(v);

            response.getWriter().write("{\"status\":\"" + (success ? "success" : "error") + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}
