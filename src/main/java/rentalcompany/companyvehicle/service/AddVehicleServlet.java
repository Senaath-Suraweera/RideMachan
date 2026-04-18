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

            int tareWeight = parseIntSafe(request.getParameter("tareweight"), "Tare Weight");
            int pricePerDay = parseIntSafe(request.getParameter("price_per_day"), "Price Per Day");

            String location = request.getParameter("location");
            String color = request.getParameter("color");

            int passengers = parseIntSafe(request.getParameter("numberofpassengers"), "Number of Passengers");
            int engineCapacity = parseIntSafe(request.getParameter("enginecapacity"), "Engine Capacity");

            String engineNumber = request.getParameter("enginenumber");
            String chasisNumber = request.getParameter("chasisnumber");
            String description = request.getParameter("description");
            String milage = calculateMileage(engineCapacity);

            String features = request.getParameter("features");

            // NEW: user-entered instead of derived
            String vehicleType = validateRequired(request.getParameter("vehicle_type"), "Vehicle Type");
            String fuelType = validateRequired(request.getParameter("fuel_type"), "Fuel Type");
            String transmission = validateRequired(request.getParameter("transmission"), "Transmission");
            int manufactureYear = parseManufactureYear(request.getParameter("manufacture_year"));

            String availabilityStatus = "available";

            java.sql.Timestamp createdAt = getCurrentTimestamp();
            java.sql.Timestamp updatedAt = createdAt;

            Part docPart = request.getPart("registrationdocumentation");
            Part imagePart = request.getPart("vehicleimages");

            InputStream docStream = (docPart != null && docPart.getSize() > 0)
                    ? docPart.getInputStream() : null;
            InputStream imgStream = (imagePart != null && imagePart.getSize() > 0)
                    ? imagePart.getInputStream() : null;

            String companyIdStr = request.getParameter("company_id");
            String providerIdStr = request.getParameter("provider_id");

            Integer companyId = (companyIdStr != null && !companyIdStr.isEmpty())
                    ? Integer.parseInt(companyIdStr)
                    : null;

            Integer providerId = (providerIdStr != null && !providerIdStr.isEmpty())
                    ? Integer.parseInt(providerIdStr)
                    : null;

            Vehicle v = new Vehicle(brand, model, numberPlate, tareWeight, color, passengers, engineCapacity,
                    engineNumber, chasisNumber, docStream, imgStream, description, milage, companyId, providerId,
                    pricePerDay, location);

            v.setVehicleType(vehicleType);
            v.setFuelType(fuelType);
            v.setTransmission(transmission);
            v.setAvailabilityStatus(availabilityStatus);
            v.setManufactureYear(manufactureYear);
            v.setCreatedAt(createdAt);
            v.setUpdatedAt(updatedAt);
            v.setFeatures(features);

            boolean success = VehicleDAO.addVehicle(v);

            response.getWriter().write("{\"status\":\"" + (success ? "success" : "error") + "\"}");
        } catch (IllegalArgumentException e) {
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private int parseIntSafe(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        try {
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException(fieldName + " must be a valid number");
        }
    }

    private int parseManufactureYear(String value) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Manufacture Year is required");
        }
        int year;
        try {
            year = Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Manufacture Year must be a valid number");
        }
        int currentYear = java.time.Year.now().getValue();
        if (year < 1950 || year > currentYear) {
            throw new IllegalArgumentException("Manufacture Year must be between 1950 and " + currentYear);
        }
        return year;
    }

    private String validateRequired(String value, String fieldName) {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException(fieldName + " is required");
        }
        return value.trim();
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"");
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