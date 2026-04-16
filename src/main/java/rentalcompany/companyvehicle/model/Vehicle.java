package rentalcompany.companyvehicle.model;

import java.io.InputStream;

public class Vehicle {
    private int vehicleId;
    private String status;
    private int year;
    private String type;
    private String vehicleBrand;
    private String vehicleModel;
    private String numberPlateNumber;
    private int tareWeight;
    private String color;
    private int numberOfPassengers;
    private int associateMaintenanceStaffId;
    private int engineCapacity;
    private String engineNumber;
    private String chasisNumber;
    private InputStream registrationDocumentation;
    private InputStream vehicleImages;
    private String description;
    private String milage;
    private Integer companyId;
    private Integer providerId;
    private int pricePerDay;
    private String location;
    private String lastServiceDate;
    private String nextServiceDate;
    private String features;
    private String vehicleType;
    private String fuelType;
    private String availabilityStatus;
    private int manufactureYear;
    private String transmission;
    private java.sql.Timestamp createdAt;
    private java.sql.Timestamp updatedAt;

    // Constructors
    public Vehicle() {}

    public Vehicle(String vehicleBrand, String vehicleModel, String numberPlateNumber, int tareWeight,
                   String color, int numberOfPassengers, int engineCapacity, String engineNumber,
                   String chasisNumber, InputStream registrationDocumentation, InputStream vehicleImages,
                   String description, String milage, Integer companyId, Integer providerId,int pricePerDay, String location) {
        this.vehicleBrand = vehicleBrand;
        this.vehicleModel = vehicleModel;
        this.numberPlateNumber = numberPlateNumber;
        this.tareWeight = tareWeight;
        this.color = color;
        this.numberOfPassengers = numberOfPassengers;
        this.engineCapacity = engineCapacity;
        this.engineNumber = engineNumber;
        this.chasisNumber = chasisNumber;
        this.registrationDocumentation = registrationDocumentation;
        this.vehicleImages = vehicleImages;
        this.description = description;
        this.milage = milage;
        this.companyId = companyId;
        this.providerId = providerId;
        this.pricePerDay = pricePerDay;
        this.location = location;
    }

    // Getters and Setters
    public int getVehicleId() { return vehicleId; }
    public void setVehicleId(int vehicleId) { this.vehicleId = vehicleId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getVehicleBrand() { return vehicleBrand; }
    public void setVehicleBrand(String vehicleBrand) { this.vehicleBrand = vehicleBrand; }

    public String getVehicleModel() { return vehicleModel; }
    public void setVehicleModel(String vehicleModel) { this.vehicleModel = vehicleModel; }

    public String getNumberPlateNumber() { return numberPlateNumber; }
    public void setNumberPlateNumber(String numberPlateNumber) { this.numberPlateNumber = numberPlateNumber; }

    public int getTareWeight() { return tareWeight; }
    public void setTareWeight(int tareWeight) { this.tareWeight = tareWeight; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public int getNumberOfPassengers() { return numberOfPassengers; }
    public void setNumberOfPassengers(int numberOfPassengers) { this.numberOfPassengers = numberOfPassengers; }

    public int getAssociateMaintenanceStaffId() { return associateMaintenanceStaffId; }
    public void setAssociateMaintenanceStaffId(int associateMaintenanceStaffId) { this.associateMaintenanceStaffId = associateMaintenanceStaffId;}

    public int getEngineCapacity() { return engineCapacity; }
    public void setEngineCapacity(int engineCapacity) { this.engineCapacity = engineCapacity; }

    public String getEngineNumber() { return engineNumber; }
    public void setEngineNumber(String engineNumber) { this.engineNumber = engineNumber; }

    public String getChasisNumber() { return chasisNumber; }
    public void setChasisNumber(String chasisNumber) { this.chasisNumber = chasisNumber; }

    public InputStream getRegistrationDocumentation() { return registrationDocumentation; }
    public void setRegistrationDocumentation(InputStream registrationDocumentation) { this.registrationDocumentation = registrationDocumentation; }

    public InputStream getVehicleImages() { return vehicleImages; }
    public void setVehicleImages(InputStream vehicleImages) { this.vehicleImages = vehicleImages; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMilage() { return milage; }
    public void setMilage(String milage) { this.milage = milage; }

    public Integer getCompanyId() { return companyId; }
    public void setCompanyId(Integer companyId) { this.companyId = companyId; }

    public Integer getProviderId() { return providerId; }
    public void setProviderId(Integer providerId) { this.providerId = providerId; }

    public int getPricePerDay() { return pricePerDay; }
    public void setPricePerDay(int pricePerDay) { this.pricePerDay = pricePerDay; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public  String getLastServiceDate() { return lastServiceDate; }
    public void setLastServiceDate(String lastServiceDate) { this.lastServiceDate = lastServiceDate; }

    public String getNextServiceDate() { return nextServiceDate; }
    public void setNextServiceDate(String nextServiceDate) { this.nextServiceDate = nextServiceDate; }

    public String getFeatures() { return features; }
    public void setFeatures(String features) { this.features = features; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }

    public String getFuelType() { return fuelType; }
    public void setFuelType(String fuelType) { this.fuelType = fuelType; }

    public String getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(String availabilityStatus) { this.availabilityStatus = availabilityStatus; }

    public int getManufactureYear() { return manufactureYear; }
    public void setManufactureYear(int manufactureYear) { this.manufactureYear = manufactureYear; }

    public String getTransmission() { return transmission; }
    public void setTransmission(String transmission) { this.transmission = transmission; }

    public java.sql.Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(java.sql.Timestamp createdAt) { this.createdAt = createdAt; }

    public java.sql.Timestamp getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(java.sql.Timestamp updatedAt) { this.updatedAt = updatedAt; }
}
