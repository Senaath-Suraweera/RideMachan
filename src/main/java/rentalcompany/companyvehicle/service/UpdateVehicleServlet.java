package rentalcompany.companyvehicle.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.companyvehicle.dao.VehicleDAO;
import rentalcompany.companyvehicle.model.Vehicle;

import java.io.IOException;
import java.io.InputStream;

@WebServlet("/company/vehicle/update")
@MultipartConfig(maxFileSize = 16177215) // 16MB
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

            String location = request.getParameter("location");
            String features = request.getParameter("features");

            String pricePerDayStr = request.getParameter("price_per_day");
            Integer pricePerDay = (pricePerDayStr != null && !pricePerDayStr.trim().isEmpty())
                    ? Integer.parseInt(pricePerDayStr.trim())
                    : null;

            // NEW: user-entered fields
            String vehicleType = request.getParameter("vehicle_type");
            String fuelType = request.getParameter("fuel_type");
            String transmission = request.getParameter("transmission");

            String manufactureYearStr = request.getParameter("manufacture_year");
            Integer manufactureYear = (manufactureYearStr != null && !manufactureYearStr.trim().isEmpty())
                    ? Integer.parseInt(manufactureYearStr.trim())
                    : null;

            if (manufactureYear != null) {
                int currentYear = java.time.Year.now().getValue();
                if (manufactureYear < 1950 || manufactureYear > currentYear) {
                    throw new IllegalArgumentException("Manufacture Year must be between 1950 and " + currentYear);
                }
            }

            // Optional uploaded files
            InputStream docStream = null;
            InputStream imgStream = null;

            try {
                Part docPart = request.getPart("registrationdocumentation");
                if (docPart != null && docPart.getSize() > 0) {
                    docStream = docPart.getInputStream();
                }
            } catch (Exception ignore) { /* part not present */ }

            try {
                Part imagePart = request.getPart("vehicleimages");
                if (imagePart != null && imagePart.getSize() > 0) {
                    imgStream = imagePart.getInputStream();
                }
            } catch (Exception ignore) { /* part not present */ }

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

            if (location != null) v.setLocation(location);
            if (features != null) v.setFeatures(features);
            if (pricePerDay != null) v.setPricePerDay(pricePerDay);

            if (vehicleType != null && !vehicleType.trim().isEmpty()) v.setVehicleType(vehicleType.trim());
            if (fuelType != null && !fuelType.trim().isEmpty()) v.setFuelType(fuelType.trim());
            if (transmission != null && !transmission.trim().isEmpty()) v.setTransmission(transmission.trim());
            if (manufactureYear != null) v.setManufactureYear(manufactureYear);

            v.setRegistrationDocumentation(docStream);
            v.setVehicleImages(imgStream);

            boolean success = VehicleDAO.updateVehicle(v);
            response.getWriter().write("{\"status\":\"" + (success ? "success" : "error") + "\"}");

        } catch (IllegalArgumentException e) {
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}