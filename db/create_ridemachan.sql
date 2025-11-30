-- Create schema
CREATE DATABASE IF NOT EXISTS `RideMachan`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `RideMachan`;

CREATE TABLE IF NOT EXISTS `Admin` (
    `adminid`             INT NOT NULL AUTO_INCREMENT,
    `username`       VARCHAR(50) NOT NULL,
    `email`          VARCHAR(255) NOT NULL,
    `phonenumber`    VARCHAR(20),
    `hashedpassword` CHAR(44) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(SHA-256)
    `salt`           CHAR(24) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(16 bytes)
    PRIMARY KEY (`adminid`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Customer` (
    `customerid`             INT NOT NULL AUTO_INCREMENT,
    `username`       VARCHAR(50) NOT NULL,
    `email`          VARCHAR(255) NOT NULL,
    `mobilenumber`   VARCHAR(20) NOT NULL,
    `hashedpassword` CHAR(44) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(SHA-256)
    `salt`           CHAR(24) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(16 bytes)
    PRIMARY KEY (`customerid`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `RentalCompany` (
    `companyid`             INT NOT NULL AUTO_INCREMENT,
    `companyname`       VARCHAR(50) NOT NULL,
    `companyemail`          VARCHAR(255) NOT NULL,
    `hashedpassword` CHAR(44) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(SHA-256)
    `salt`           CHAR(24) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(16 bytes)
    PRIMARY KEY (`companyid`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `MaintenanceStaff` (
    `maintenanceid`             INT NOT NULL AUTO_INCREMENT,
    `username`       VARCHAR(50) NOT NULL,
    `firstname`     VARCHAR(50) NOT NULL,
    `mobilenumber` VARCHAR(20),
    `lastname`  VARCHAR(50) NOT NULL,
    `email`          VARCHAR(255) NOT NULL,
    `hashedpassword` CHAR(44) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(SHA-256)
    `salt`           CHAR(24) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(16 bytes)
    `company_id` INT NOT NULL,
    PRIMARY KEY (`maintenanceid`),
    CONSTRAINT `fk_maintenance_company`
        FOREIGN KEY (`company_id`)
        REFERENCES `RentalCompany` (`companyid`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Driver` (
    `driverid`             INT NOT NULL AUTO_INCREMENT,
    `username`       VARCHAR(50) NOT NULL,
    `firstname`       VARCHAR(50) NOT NULL,
    `lastname`       VARCHAR(50) NOT NULL,
    `email`          VARCHAR(255) NOT NULL,
    `hashedpassword` CHAR(44) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(SHA-256)
    `salt`           CHAR(24) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(16 bytes)
    `nicnumber` VARCHAR(15) NOT NULL,
    `nic` LONGBLOB NOT NULL,
    `driverslicence` LONGBLOB NOT NULL,
    `company_id` INT NOT NULL,
    PRIMARY KEY (`driverid`),
    CONSTRAINT `fk_driver_company`
        FOREIGN KEY (`company_id`)
        REFERENCES `RentalCompany` (`companyid`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `VehicleProvider` (
    `providerid`             INT NOT NULL AUTO_INCREMENT,
    `username`       VARCHAR(50) NOT NULL,
    `email`          VARCHAR(255) NOT NULL,
    `hashedpassword` CHAR(44) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(SHA-256)
    `salt`           CHAR(24) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(16 bytes)
    `company_id` INT,
    PRIMARY KEY (`providerid`),
    CONSTRAINT `fk_provider_company`
        FOREIGN KEY (`company_id`)
        REFERENCES `RentalCompany` (`companyid`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `Vehicle` (
    `vehicleid`             INT NOT NULL AUTO_INCREMENT,
    `vehiclebrand`       VARCHAR(50) NOT NULL,
    `vehiclemodel` VARCHAR(50) NOT NULL,
    `numberplatenumber` VARCHAR(20) NOT NULL,
    `tareweight` INT NOT NULL,
    `color` VARCHAR(30) NOT NULL,
    `numberofpassengers` INT NOT NULL,
    `enginecapacity` INT NOT NULL,
    `enginenumber` VARCHAR(30) NOT NULL,
    `chasisnumber` VARCHAR(30) NOT NULL,
    `registrationdocumentation` LONGBLOB NOT NULL,
    `vehicleimages` LONGBLOB NOT NULL,
    `description` VARCHAR(300),
    `milage` VARCHAR(10),
    `company_id` INT,
    `provider_id` INT,
    PRIMARY KEY (`vehicleid`),
    CONSTRAINT `fk_vehicle_company`
        FOREIGN KEY (`company_id`)
        REFERENCES `RentalCompany` (`companyid`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_vehicle_provider`
        FOREIGN KEY (`provider_id`)
        REFERENCES `VehicleProvider` (`providerid`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;	