package rentalcompany.companyvehicle.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.companyvehicle.dao.VehicleDAO;
import rentalcompany.companyvehicle.model.Vehicle;

import java.io.IOException;
import java.io.InputStream;

@WebServlet("/company/vehicle/add")
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

            int pricePerDay = Integer.parseInt(request.getParameter("price_per_day"));
            String location = request.getParameter("location");

            String color = request.getParameter("color");
            int passengers = Integer.parseInt(request.getParameter("numberofpassengers"));
            int engineCapacity = Integer.parseInt(request.getParameter("enginecapacity"));
            String engineNumber = request.getParameter("enginenumber");
            String chasisNumber = request.getParameter("chasisnumber");
            String description = request.getParameter("description");
            String milage = calculateMileage(engineCapacity);
            String feature = request.getParameter("feature");

            String vehicleType = calculateVehicleType(passengers);
            String fuelType = calculateFuelType(engineCapacity);
            String transmission = calculateTransmission(engineCapacity);
            String availabilityStatus = calculateAvailability();
            int manufactureYear = calculateManufactureYear();

            java.sql.Timestamp createdAt = getCurrentTimestamp();
            java.sql.Timestamp updatedAt = createdAt;


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
                    engineNumber, chasisNumber, docStream, imgStream, description, milage, companyId, providerId,pricePerDay, location);

            v.setVehicleType(vehicleType);
            v.setFuelType(fuelType);
            v.setTransmission(transmission);
            v.setAvailabilityStatus(availabilityStatus);
            v.setManufactureYear(manufactureYear);
            v.setCreatedAt(createdAt);
            v.setUpdatedAt(updatedAt);
            v.setFeatures(feature);

            boolean success = VehicleDAO.addVehicle(v);

            response.getWriter().write("{\"status\":\"" + (success ? "success" : "error") + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }



    private String calculateVehicleType(int passengers) {
        if (passengers <= 4) return "Car";
        if (passengers <= 7) return "SUV";
        return "Van";
    }
    private String calculateFuelType(int engineCapacity) {
        if (engineCapacity < 1500) return "Petrol";
        return "Diesel";
    }

    private String calculateTransmission(int engineCapacity) {
        if (engineCapacity < 1500) return "Manual";
        return "Automatic";
    }

    private String calculateAvailability() {
        return "available";
    }

    private int calculateManufactureYear() {
        return java.time.Year.now().getValue();
    }

    private java.sql.Timestamp getCurrentTimestamp() {
        return new java.sql.Timestamp(System.currentTimeMillis());
    }
    private String calculateMileage(int engineCapacity) {

        int min, max;

        if (engineCapacity < 1000) {
            min = 18;
            max = 25;
        } else if (engineCapacity < 2000) {
            min = 12;
            max = 18;
        } else {
            min = 8;
            max = 14;
        }

        int value = java.util.concurrent.ThreadLocalRandom
                .current()
                .nextInt(min, max + 1);

        return value + " km/l";
    }
}
