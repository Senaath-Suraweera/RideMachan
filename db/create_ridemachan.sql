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
    `verified` BOOLEAN DEFAULT FALSE,
    `active` BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (`adminid`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `Customer` (
    `customerid` INT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `firstname` VARCHAR(50) NOT NULL,
    `lastname` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `mobilenumber` VARCHAR(20) NOT NULL,
    `hashedpassword` CHAR(44) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    `salt` CHAR(24) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    
    -- Customer type
    `customer_type` ENUM('LOCAL', 'FOREIGN') NOT NULL,
    
    -- Address fields
    `street` VARCHAR(100),
    `city` VARCHAR(50),
    `zip_code` VARCHAR(20),
    `country` VARCHAR(50),
    
    -- Local customer fields
    `nic_number` VARCHAR(20),
    `nic_image` LONGBLOB,
    `drivers_license_number` VARCHAR(20),
    `drivers_license_image` LONGBLOB,
    
    -- Foreign customer fields
    `passport_number` VARCHAR(20),
    `international_drivers_license_number` VARCHAR(20),
    
    -- Status fields
    `verified` BOOLEAN DEFAULT FALSE,
    `active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`customerid`),
    INDEX `idx_email` (`email`),
    INDEX `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `RentalCompany` (
                                               `companyid` INT NOT NULL AUTO_INCREMENT,
                                               `companyname` VARCHAR(50) NOT NULL,
    `companyemail` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20),
    `registrationnumber` VARCHAR(50),
    `taxid` VARCHAR(50),
    `street` VARCHAR(100),
    `city` VARCHAR(50),
    `certificatepath` VARCHAR(255),
    `taxdocumentpath` VARCHAR(255),
    `hashedpassword` CHAR(44) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    `salt` CHAR(24) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
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
    `mobilenumber`  VARCHAR(20),
    `description` VARCHAR(200),
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
                                                 `providerid` INT NOT NULL AUTO_INCREMENT,
                                                 `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `hashedpassword` CHAR(44) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(SHA-256)
    `salt` CHAR(24) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL, -- Base64(16 bytes)
    `company_id` INT,
    `firstname` VARCHAR(50),
    `lastname` VARCHAR(50),
    `phonenumber` VARCHAR(20),
    `housenumber` VARCHAR(10),
    `street` VARCHAR(20),
    `city` VARCHAR(20),
    `zipcode` VARCHAR(10),
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


CREATE TABLE IF NOT EXISTS `CalendarEvents` (
                                                `eventid` INT NOT NULL AUTO_INCREMENT,
                                                `vehicle_id` INT NOT NULL,
                                                `service_type` VARCHAR(200) NOT NULL,
    `status` ENUM('scheduled', 'in-progress', 'completed') NOT NULL DEFAULT 'scheduled',
    `description` TEXT,
    `maintenance_id` INT NOT NULL,
    `scheduled_date` DATE NOT NULL,
    `scheduled_time` TIME NOT NULL,
    `service_bay` VARCHAR(50) NOT NULL,
    `estimated_duration` VARCHAR(50) NOT NULL,
    `assigned_technician` VARCHAR(100) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`eventid`),
    INDEX `idx_scheduled_date` (`scheduled_date`),
    INDEX `idx_vehicle` (`vehicle_id`),
    INDEX `idx_maintenance` (`maintenance_id`),
    INDEX `idx_status` (`status`),
    CONSTRAINT `fk_event_maintenance`
    FOREIGN KEY (`maintenance_id`)
    REFERENCES `MaintenanceStaff` (`maintenanceid`)
                                                     ON DELETE CASCADE
                                                     ON UPDATE CASCADE,
    CONSTRAINT `fk_event_vehicle`
    FOREIGN KEY (`vehicle_id`)
    REFERENCES `Vehicle` (`vehicleid`)
                                                     ON DELETE CASCADE
                                                     ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS SupportTicket (

    ticket_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id VARCHAR(50) NULL,


    actor_type ENUM(
     'CUSTOMER',
     'DRIVER',
     'COMPANY',
     'ADMIN',
     'MAINTENANCE',
     'PROVIDER'
    ) NOT NULL,

    actor_id INT NOT NULL,

    -- Core ticket fields
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    admin_notes TEXT,

    -- UI fields
    status ENUM('Open', 'In Progress', 'Resolved', 'Closed')
    NOT NULL DEFAULT 'Open',

    priority ENUM('Low','Medium','High','Urgent')
    NOT NULL DEFAULT 'Low',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    -- Useful indexes
    INDEX idx_actor (actor_type, actor_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority)
    );

CREATE TABLE IF NOT EXISTS SupportTicketImage (
  image_id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id INT NOT NULL,
  image_data LONGBLOB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_support_image
  FOREIGN KEY (ticket_id)
    REFERENCES SupportTicket(ticket_id)
    ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS SupportTicketActionLog (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    admin_id INT NOT NULL,

    action_type ENUM('NOTE','EMAIL','ESCALATE','STATUS_CHANGE','CLOSE') NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_ticket_log
    FOREIGN KEY (ticket_id)
    REFERENCES SupportTicket(ticket_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_log_admin
    FOREIGN KEY (admin_id)
    REFERENCES Admin(adminid)
    ON DELETE CASCADE
    );



CREATE TABLE IF NOT EXISTS Report (
                                      report_id INT AUTO_INCREMENT PRIMARY KEY,

    -- Display code in UI: RPT-2026-001 (you can generate in backend)
    -- We'll not store it; UI can show it from report_id + year.

                                      category ENUM('vehicle','behavior','payment','app','safety') NOT NULL,

    status ENUM('Pending','Reviewed','Resolved','Closed') NOT NULL DEFAULT 'Pending',
    priority ENUM('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Low',

    subject VARCHAR(255) NOT NULL,
    description TEXT,

    -- Who is being reported (shown as "Reported Party" in UI)
    reported_role ENUM('CUSTOMER','DRIVER','COMPANY') NOT NULL,
    reported_id INT NOT NULL,

    -- Who submitted the report (shown as "Reporter" + reporter card)
    reporter_role ENUM('CUSTOMER','DRIVER','COMPANY','ADMIN') NOT NULL,
    reporter_id INT NOT NULL,

    -- snapshot info for UI (so you can show name/email/phone without joins)
    reporter_name VARCHAR(150),
    reporter_email VARCHAR(150),
    reporter_phone VARCHAR(50),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_status(status),
    INDEX idx_category(category),
    INDEX idx_reported(reported_role, reported_id),
    INDEX idx_reporter(reporter_role, reporter_id),
    INDEX idx_priority(priority)
    );

CREATE TABLE IF NOT EXISTS ReportImage (
                                           image_id INT AUTO_INCREMENT PRIMARY KEY,
                                           report_id INT NOT NULL,
                                           image_data LONGBLOB NOT NULL,
                                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                                           CONSTRAINT fk_report_image
                                           FOREIGN KEY (report_id)
    REFERENCES Report(report_id)
    ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS ReportActionLog (
                                               log_id INT AUTO_INCREMENT PRIMARY KEY,
                                               report_id INT NOT NULL,
                                               admin_id INT NOT NULL,

                                               action_type ENUM('NOTE','STATUS_CHANGE','ESCALATE','CLOSE') NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_log
    FOREIGN KEY (report_id) REFERENCES Report(report_id)
    ON DELETE CASCADE,

    CONSTRAINT fk_report_log_admin
    FOREIGN KEY (admin_id) REFERENCES Admin(adminid)
    ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS Conversation (
                                            conversation_id INT AUTO_INCREMENT PRIMARY KEY,
                                            type ENUM('DIRECT','GROUP') NOT NULL DEFAULT 'DIRECT',
    title VARCHAR(255), -- for GROUP chats
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS ConversationParticipant (
                                                       conversation_id INT NOT NULL,
                                                       actor_type ENUM('CUSTOMER','DRIVER','COMPANY','ADMIN','MAINTENANCE','PROVIDER') NOT NULL,
    actor_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id INT DEFAULT NULL,

    PRIMARY KEY (conversation_id, actor_type, actor_id),

    CONSTRAINT fk_cp_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES Conversation(conversation_id)
    ON DELETE CASCADE,

    INDEX idx_participant (actor_type, actor_id)
    );

CREATE TABLE IF NOT EXISTS Message (
                                       message_id INT AUTO_INCREMENT PRIMARY KEY,
                                       conversation_id INT NOT NULL,

                                       sender_type ENUM('CUSTOMER','DRIVER','COMPANY','ADMIN','MAINTENANCE','PROVIDER') NOT NULL,
    sender_id INT NOT NULL,

    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_msg_conversation
    FOREIGN KEY (conversation_id)
    REFERENCES Conversation(conversation_id)
    ON DELETE CASCADE,

    INDEX idx_conv_time (conversation_id, sent_at),
    INDEX idx_sender (sender_type, sender_id)
    );

CREATE TABLE IF NOT EXISTS companybookings(
                                              booking_id INT PRIMARY KEY AUTO_INCREMENT,

                                              companyid INT NOT NULL,
                                              customerid INT NOT NULL,
                                              vehicleid INT NULL,
                                              driverid INT,

                                              booked_Date DATE,
                                              trip_start_date DATE,
                                              trip_end_date DATE,
                                              start_time TIME,
                                              end_time TIME,

                                              pickup_location VARCHAR(50),
    drop_location VARCHAR(50),

    status VARCHAR(20),
    total_amount DECIMAL(10,2),
    payment_status VARCHAR(20),

    FOREIGN KEY (companyid) REFERENCES rentalcompany(companyid),
    FOREIGN KEY (customerid) REFERENCES customer(customerid),
    FOREIGN KEY (vehicleid) REFERENCES vehicle(vehicleid),
    FOREIGN KEY (driverid) REFERENCES driver(driverid)
    );

ALTER TABLE Vehicle
    ADD COLUMN price_per_day DECIMAL(10,2) NOT NULL,
ADD COLUMN location VARCHAR(100) NOT NULL,
ADD COLUMN features TEXT;

CREATE TABLE ratings (
                         rating_id INT AUTO_INCREMENT PRIMARY KEY,

                         actor_type ENUM('DRIVER', 'VEHICLE') NOT NULL,
                         actor_id INT NOT NULL,

                         user_id INT NOT NULL,   -- who gave the rating

                         rating_value INT NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
                         review TEXT,

                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE ratings
    ADD COLUMN companyid INT NOT NULL;

ALTER TABLE ratings
    ADD FOREIGN KEY (companyid)
        REFERENCES rentalcompany(companyid)
        ON UPDATE CASCADE;


ALTER TABLE driver

    ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Available',
ADD COLUMN Area VARCHAR(100),
ADD COLUMN licenceexpirydate DATE;

ALTER TABLE vehicle
    ADD COLUMN vehicle_type VARCHAR(20),
ADD COLUMN fuel_type VARCHAR(20),
ADD COLUMN availability_status VARCHAR(20) DEFAULT 'available';

ALTER TABLE driver
    ADD COLUMN homeaddress VARCHAR(255),
ADD COLUMN licensenumber VARCHAR(50),
ADD COLUMN assignedarea VARCHAR(100),
ADD COLUMN shifttime VARCHAR(50),
ADD COLUMN reportingmanager VARCHAR(100),
ADD COLUMN joineddate DATE,
ADD COLUMN profilepicture LONGTEXT;

ALTER TABLE Driver ADD COLUMN availability VARCHAR(20) DEFAULT 'available';


CREATE TABLE IF NOT EXISTS `RentalCompanyRegistrationRequest` (
                                                                  `request_id` INT NOT NULL AUTO_INCREMENT,

    -- submitted company details
                                                                  `companyname` VARCHAR(50) NOT NULL,
    `companyemail` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20),
    `registrationnumber` VARCHAR(50),
    `taxid` VARCHAR(50),
    `street` VARCHAR(100),
    `city` VARCHAR(50),
    `certificatepath` VARCHAR(255),
    `taxdocumentpath` VARCHAR(255),

    -- login credentials (stored safely)
    `hashedpassword` CHAR(44) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    `salt` CHAR(24) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,

    -- workflow
    `status` ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    `submitted_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
    `reviewed_by_adminid` INT NULL DEFAULT NULL,
    `reject_reason` VARCHAR(255) NULL DEFAULT NULL,

    -- filled when approved
    `approved_companyid` INT NULL DEFAULT NULL,

    PRIMARY KEY (`request_id`),

    INDEX `idx_rcr_status` (`status`),
    INDEX `idx_rcr_email` (`companyemail`),

    CONSTRAINT `fk_rcr_admin`
    FOREIGN KEY (`reviewed_by_adminid`) REFERENCES `Admin`(`adminid`)
    ON DELETE SET NULL ON UPDATE CASCADE,

    CONSTRAINT `fk_rcr_company`
    FOREIGN KEY (`approved_companyid`) REFERENCES `RentalCompany`(`companyid`)
    ON DELETE SET NULL ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE RentalCompany
  ADD UNIQUE KEY uniq_rentalcompany_email (companyemail);

ALTER TABLE RentalCompany
    ADD COLUMN description TEXT NULL AFTER taxdocumentpath,
  ADD COLUMN terms TEXT NULL AFTER description;

ALTER TABLE Driver
    ADD COLUMN age INT NULL,
    ADD COLUMN experience_years INT NULL,
    ADD COLUMN totalrides INT NOT NULL DEFAULT 0,
    ADD COLUMN totalkm INT NOT NULL DEFAULT 0,
    ADD COLUMN ontimepercentage INT NOT NULL DEFAULT 0,
    ADD COLUMN licensecategories VARCHAR(100) NULL,
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN banned BOOLEAN NOT NULL DEFAULT FALSE;

INSERT INTO Driver
(username, firstname, lastname, email, mobilenumber, description, hashedpassword, salt, nicnumber, nic, driverslicence, company_id,
 status, Area, licenceexpirydate, licensenumber, homeaddress, assignedarea, shifttime, reportingmanager, joineddate, profilepicture,
 availability, age, experience_years, totalrides, totalkm, ontimepercentage, licensecategories, active, banned)
SELECT
    'drv_test_1','Rajesh','Kumar','rajesh.kumar@test.com','+94 77 123 4567','Top-rated driver.',
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'AAAAAAAAAAAAAAAAAAAAAAAA',
    '901234567V', 0x00, 0x00, 1,
    'Available','Colombo','2027-12-01','B1234567',
    'No 1, Main Street','Colombo','Day','Manager 1','2024-01-13','',
    'available', 32, 8, 247, 12400, 98, 'A, B1, B', TRUE, FALSE
    WHERE NOT EXISTS (SELECT 1 FROM Driver WHERE username='drv_test_1');

INSERT INTO Driver
(username, firstname, lastname, email, mobilenumber, description, hashedpassword, salt, nicnumber, nic, driverslicence, company_id,
 status, Area, licenceexpirydate, licensenumber, joineddate,
 availability, age, experience_years, totalrides, totalkm, ontimepercentage, licensecategories, active, banned)
SELECT
    'drv_test_2','Maria','Fernando','maria.fernando@test.com','+94 71 555 0123','Airport transfers.',
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 'AAAAAAAAAAAAAAAAAAAAAAAA',
    '912345678V', 0x00, 0x00, 1,
    'Available','Negombo','2026-03-01','B2345678','2024-01-14',
    'available', 29, 5, 189, 8950, 95, 'B1, B', TRUE, FALSE
    WHERE NOT EXISTS (SELECT 1 FROM Driver WHERE username='drv_test_2');


INSERT INTO Driver
(username, firstname, lastname, email, mobilenumber, description,
 hashedpassword, salt, nicnumber, nic, driverslicence, company_id,
 status, Area, licenceexpirydate, licensenumber, joineddate, availability)
SELECT
    'drv_test_2','Maria','Fernando','maria.fernando@test.com','+94 71 555 0123',
    'Airport transfers.',
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    'AAAAAAAAAAAAAAAAAAAAAAAA',
    '912345678V', 0x00, 0x00, 1,
    'Available','Negombo','2026-03-01','B2345678','2024-01-14','available'
    WHERE NOT EXISTS (
    SELECT 1 FROM Driver WHERE username='drv_test_2'
);

INSERT INTO Driver
(username, firstname, lastname, email, mobilenumber, description,
 hashedpassword, salt, nicnumber, nic, driverslicence, company_id,
 status, Area, licenceexpirydate, licensenumber, joineddate, availability)
SELECT
    'drv_test_2','Maria','Fernando','maria.fernando@test.com','+94 71 555 0123',
    'Airport transfers.',
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    'AAAAAAAAAAAAAAAAAAAAAAAA',
    '912345678V', 0x00, 0x00, 1,
    'Available','Negombo','2026-03-01','B2345678','2024-01-14','available'
    WHERE NOT EXISTS (
    SELECT 1 FROM Driver WHERE username='drv_test_2'
);

USE `RideMachan`;

-- Add missing columns safely (won't error if they already exist)
DELIMITER $$

DROP PROCEDURE IF EXISTS add_column_if_not_exists $$
CREATE PROCEDURE add_column_if_not_exists(
    IN p_table VARCHAR(64),
    IN p_column VARCHAR(64),
    IN p_alter_suffix TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_table
      AND COLUMN_NAME = p_column
  ) THEN
    SET @sql = CONCAT('ALTER TABLE `', p_table, '` ', p_alter_suffix);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
END IF;
END $$

DELIMITER ;

-- Fields your UI expects but your Driver table doesn't reliably have
CALL add_column_if_not_exists('Driver','age',                 'ADD COLUMN `age` INT NULL');
CALL add_column_if_not_exists('Driver','experience_years',    'ADD COLUMN `experience_years` INT NULL');
CALL add_column_if_not_exists('Driver','totalrides',          'ADD COLUMN `totalrides` INT NOT NULL DEFAULT 0');
CALL add_column_if_not_exists('Driver','totalkm',             'ADD COLUMN `totalkm` INT NOT NULL DEFAULT 0');
CALL add_column_if_not_exists('Driver','ontimepercentage',    'ADD COLUMN `ontimepercentage` INT NOT NULL DEFAULT 0');
CALL add_column_if_not_exists('Driver','licensecategories',   'ADD COLUMN `licensecategories` VARCHAR(100) NULL');

-- Admin control flags
CALL add_column_if_not_exists('Driver','active',              'ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT TRUE');
CALL add_column_if_not_exists('Driver','banned',              'ADD COLUMN `banned` BOOLEAN NOT NULL DEFAULT FALSE');

-- Helpful indexes for list filtering
CALL add_column_if_not_exists('Driver','idx_driver_company',  'ADD INDEX `idx_driver_company` (`company_id`)');
CALL add_column_if_not_exists('Driver','idx_driver_email',    'ADD INDEX `idx_driver_email` (`email`)');

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

ALTER TABLE maintenancestaff
    ADD COLUMN specialization VARCHAR(100) DEFAULT '',
ADD COLUMN status VARCHAR(50) DEFAULT 'available',
ADD COLUMN yearsOfExperience FLOAT DEFAULT 0;

ALTER TABLE maintenancestaff
    MODIFY COLUMN status ENUM('available', 'on Job', 'offline') DEFAULT 'available';

ALTER TABLE driver ADD UNIQUE (username);
ALTER TABLE driver ADD UNIQUE (email);
ALTER TABLE driver ADD UNIQUE (mobilenumber);
ALTER TABLE driver ADD UNIQUE (nicnumber);
ALTER TABLE driver ADD UNIQUE (licensenumber);

ALTER TABLE Vehicle
    ADD COLUMN manufacture_year INT NULL,
  ADD COLUMN daily_rate DECIMAL(10,2) NULL,
  ADD COLUMN transmission VARCHAR(30) NULL;

ALTER TABLE VehicleProvider
    ADD COLUMN status ENUM('active','pending','suspended') NOT NULL DEFAULT 'active',
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE Vehicle
    ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE Vehicle
DROP COLUMN daily_rate;

ALTER TABLE Vehicle
    MODIFY location VARCHAR(255) NULL;

ALTER TABLE VehicleProvider
    ADD UNIQUE KEY uniq_provider_username (username),
    ADD UNIQUE KEY uniq_provider_email (email);

ALTER TABLE VehicleProvider
    MODIFY city VARCHAR(50);

-- (optional but recommended to match real addresses)
ALTER TABLE VehicleProvider
    MODIFY street VARCHAR(100),
    MODIFY zipcode VARCHAR(20);

ALTER TABLE customer
    ADD COLUMN status ENUM('active','inactive','banned') NOT NULL DEFAULT 'active';


CREATE TABLE IF NOT EXISTS ProviderRentalRequests (
                                                      request_id INT NOT NULL AUTO_INCREMENT,
                                                      provider_id INT NOT NULL,
                                                      vehicle_id INT NOT NULL,
                                                      company_id INT NOT NULL,
                                                      status ENUM('pending','approved','rejected','cancelled') NOT NULL DEFAULT 'pending',
    message VARCHAR(500) NULL,
    requested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (request_id),
    INDEX idx_prr_provider (provider_id),
    INDEX idx_prr_company (company_id),
    INDEX idx_prr_vehicle (vehicle_id),
    INDEX idx_prr_status (status)
    );


-- ============================================================
-- RideMachan – Messaging & Notification System Migration
-- Run AFTER your existing create_ridemachan.sql
-- ============================================================

USE `RideMachan`;

-- ─────────────────────────────────────────────────────────────
-- 1. Notification table (NEW)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Notification (
                                            notification_id   INT AUTO_INCREMENT PRIMARY KEY,
                                            recipient_type    ENUM('CUSTOMER','DRIVER','COMPANY','ADMIN','MAINTENANCE','PROVIDER') NOT NULL,
    recipient_id      INT NOT NULL,

    type              ENUM('NEW_MESSAGE','SYSTEM','BOOKING','TICKET','REPORT','MAINTENANCE','GENERAL') NOT NULL DEFAULT 'GENERAL',

    title             VARCHAR(255) NOT NULL,
    body              TEXT,

    -- optional link to a related entity
    reference_type    VARCHAR(50)  NULL,   -- e.g. 'CONVERSATION', 'TICKET', 'BOOKING'
    reference_id      INT          NULL,

    is_read           BOOLEAN NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notif_recipient (recipient_type, recipient_id),
    INDEX idx_notif_read      (is_read),
    INDEX idx_notif_created   (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─────────────────────────────────────────────────────────────
-- 2. Messaging permission table  (NEW – enforced in Java)
--    This is a REFERENCE table. Each row says:
--       "from_actor_type CAN message to_actor_type"
--    The backend reads this on conversation creation.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS MessagingPermission (
                                                   from_actor_type  ENUM('CUSTOMER','DRIVER','COMPANY','ADMIN','MAINTENANCE','PROVIDER') NOT NULL,
    to_actor_type    ENUM('CUSTOMER','DRIVER','COMPANY','ADMIN','MAINTENANCE','PROVIDER') NOT NULL,
    PRIMARY KEY (from_actor_type, to_actor_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed the permission matrix
-- ADMIN → everyone
INSERT IGNORE INTO MessagingPermission VALUES ('ADMIN','CUSTOMER');
INSERT IGNORE INTO MessagingPermission VALUES ('ADMIN','DRIVER');
INSERT IGNORE INTO MessagingPermission VALUES ('ADMIN','COMPANY');
INSERT IGNORE INTO MessagingPermission VALUES ('ADMIN','MAINTENANCE');
INSERT IGNORE INTO MessagingPermission VALUES ('ADMIN','PROVIDER');
INSERT IGNORE INTO MessagingPermission VALUES ('ADMIN','ADMIN');

-- COMPANY → everyone except ADMIN
INSERT IGNORE INTO MessagingPermission VALUES ('COMPANY','CUSTOMER');
INSERT IGNORE INTO MessagingPermission VALUES ('COMPANY','DRIVER');
INSERT IGNORE INTO MessagingPermission VALUES ('COMPANY','COMPANY');
INSERT IGNORE INTO MessagingPermission VALUES ('COMPANY','MAINTENANCE');
INSERT IGNORE INTO MessagingPermission VALUES ('COMPANY','PROVIDER');

-- MAINTENANCE → COMPANY only
INSERT IGNORE INTO MessagingPermission VALUES ('MAINTENANCE','COMPANY');

-- DRIVER → everyone except ADMIN and PROVIDER
INSERT IGNORE INTO MessagingPermission VALUES ('DRIVER','CUSTOMER');
INSERT IGNORE INTO MessagingPermission VALUES ('DRIVER','DRIVER');
INSERT IGNORE INTO MessagingPermission VALUES ('DRIVER','COMPANY');
INSERT IGNORE INTO MessagingPermission VALUES ('DRIVER','MAINTENANCE');

-- CUSTOMER → COMPANY and DRIVER only
INSERT IGNORE INTO MessagingPermission VALUES ('CUSTOMER','COMPANY');
INSERT IGNORE INTO MessagingPermission VALUES ('CUSTOMER','DRIVER');

-- PROVIDER → COMPANY only
INSERT IGNORE INTO MessagingPermission VALUES ('PROVIDER','COMPANY');

CREATE TABLE maintenanceJobs (
                                 jobId INT AUTO_INCREMENT PRIMARY KEY,
                                 vehicleId INT NOT NULL,
                                 assignedStaffId INT,
                                 companyId INT NOT NULL,
                                 status ENUM('pending','on Job','completed','overdue') DEFAULT 'pending',
                                 scheduledDate DATE,
                                 completedDate DATE
);

ALTER TABLE maintenanceJobs
    ADD CONSTRAINT fk_assignedStaff
        FOREIGN KEY (assignedStaffId) REFERENCES maintenancestaff(maintenanceid);

ALTER TABLE maintenanceJobs
    ADD CONSTRAINT fk_company
        FOREIGN KEY (companyId) REFERENCES rentalcompany(companyid);

ALTER TABLE maintenanceJobs
    ADD COLUMN type ENUM('Oil Change', 'Brake Services', 'Tire Services',  'Other Services') NOT NULL DEFAULT 'Other Services';


