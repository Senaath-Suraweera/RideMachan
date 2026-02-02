-- 01/12/2025: Admin table updates
ALTER TABLE Admin
    ADD COLUMN verified BOOLEAN DEFAULT FALSE,
ADD COLUMN active BOOLEAN DEFAULT TRUE;

-- 02/12/2025: Customer table updates (and instruction to add to all tables)
ALTER TABLE Customer
    ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 02/12/2025: SupportTicket tables
CREATE TABLE IF NOT EXISTS SupportTicket (
                                             ticket_id INT AUTO_INCREMENT PRIMARY KEY,
                                             actor_type ENUM('CUSTOMER','DRIVER','COMPANY','ADMIN','MAINTENANCE','PROVIDER') NOT NULL,
    actor_id INT NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    admin_notes TEXT,
    status ENUM('Open','In Progress','Resolved','Closed') NOT NULL DEFAULT 'Open',
    priority ENUM('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Low',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS SupportTicketImage (
                                                  image_id INT AUTO_INCREMENT PRIMARY KEY,
                                                  ticket_id INT NOT NULL,
                                                  image_data LONGBLOB NOT NULL,
                                                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                                  CONSTRAINT fk_support_image FOREIGN KEY (ticket_id)
    REFERENCES SupportTicket(ticket_id) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS SupportTicketActionLog (
                                                      log_id INT AUTO_INCREMENT PRIMARY KEY,
                                                      ticket_id INT NOT NULL,
                                                      admin_id INT NOT NULL,
                                                      action_type ENUM('NOTE','EMAIL','ESCALATE','STATUS_CHANGE','CLOSE') NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_ticket_log FOREIGN KEY (ticket_id)
    REFERENCES SupportTicket(ticket_id) ON DELETE CASCADE,
    CONSTRAINT fk_log_admin FOREIGN KEY (admin_id)
    REFERENCES Admin(adminid) ON DELETE CASCADE
    );

-- 23/12/2025: companybookings table (partial)
CREATE TABLE IF NOT EXISTS companybookings(
                                              booking_id INT PRIMARY KEY AUTO_INCREMENT,
                                              companyid INT NOT NULL,
                                              customerid INT NOT NULL,
                                              vehicleid INT NULL,
                                              driverid INT
);

-- 04/01/2026: Report tables
CREATE TABLE IF NOT EXISTS Report (
                                      report_id INT AUTO_INCREMENT PRIMARY KEY,
                                      category ENUM('vehicle','behavior','payment','app','safety') NOT NULL,
    status ENUM('Pending','Reviewed','Resolved','Closed') NOT NULL DEFAULT 'Pending',
    priority ENUM('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Low',
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    reported_role ENUM('CUSTOMER','DRIVER','COMPANY') NOT NULL,
    reported_id INT NOT NULL,
    reporter_role ENUM('CUSTOMER','DRIVER','COMPANY') NOT NULL,
    reporter_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS ReportActionLog (
                                               log_id INT AUTO_INCREMENT PRIMARY KEY,
                                               report_id INT NOT NULL,
                                               admin_id INT NOT NULL,
                                               action_type ENUM('NOTE','STATUS_CHANGE','ESCALATE','CLOSE') NOT NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_report_log FOREIGN KEY (report_id) REFERENCES Report(report_id) ON DELETE CASCADE,
    CONSTRAINT fk_report_log_admin FOREIGN KEY (admin_id) REFERENCES Admin(adminid) ON DELETE CASCADE
    );

CREATE TABLE IF NOT EXISTS ReportImage (
                                           image_id INT AUTO_INCREMENT PRIMARY KEY,
                                           report_id INT NOT NULL,
                                           image_data LONGBLOB NOT NULL,
                                           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                                           CONSTRAINT fk_report_image FOREIGN KEY (report_id) REFERENCES Report(report_id) ON DELETE CASCADE
    );

-- 04/01/2026: Messaging system
CREATE TABLE IF NOT EXISTS Conversation (
                                            conversation_id INT AUTO_INCREMENT PRIMARY KEY,
                                            type ENUM('DIRECT','GROUP') NOT NULL DEFAULT 'DIRECT',
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS ConversationParticipant (
                                                       conversation_id INT NOT NULL,
                                                       actor_type ENUM('CUSTOMER','DRIVER','COMPANY','ADMIN','MAINTENANCE','PROVIDER') NOT NULL,
    actor_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_read_message_id INT DEFAULT NULL,
    PRIMARY KEY (conversation_id, actor_type, actor_id),
    CONSTRAINT fk_cp_conversation FOREIGN KEY (conversation_id)
    REFERENCES Conversation(conversation_id) ON DELETE CASCADE,
    INDEX idx_participant (actor_type, actor_id)
    );

CREATE TABLE IF NOT EXISTS Message (
                                       message_id INT AUTO_INCREMENT PRIMARY KEY,
                                       conversation_id INT NOT NULL,
                                       sender_type ENUM('CUSTOMER','DRIVER','COMPANY','ADMIN','MAINTENANCE','PROVIDER') NOT NULL,
    sender_id INT NOT NULL,
    content TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_msg_conversation FOREIGN KEY (conversation_id)
    REFERENCES Conversation(conversation_id) ON DELETE CASCADE,
    INDEX idx_conv_time (conversation_id, sent_at),
    INDEX idx_sender (sender_type, sender_id)
    );

-- 12/01/2026: Vehicle updates
ALTER TABLE Vehicle
    ADD COLUMN price_per_day DECIMAL(10,2) NOT NULL,
ADD COLUMN location VARCHAR(100) NOT NULL,
ADD COLUMN features TEXT;

-- 13/01/2026: Ratings table
CREATE TABLE ratings (
                         rating_id INT AUTO_INCREMENT PRIMARY KEY,
                         actor_type ENUM('DRIVER', 'VEHICLE') NOT NULL,
                         actor_id INT NOT NULL,
                         user_id INT NOT NULL,
                         rating_value INT NOT NULL CHECK (rating_value BETWEEN 1 AND 5),
                         review TEXT,
                         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 18/01/2026: Ratings & Driver updates
ALTER TABLE ratings
    ADD COLUMN companyid INT NOT NULL,
ADD FOREIGN KEY (companyid) REFERENCES rentalcompany(companyid) ON UPDATE CASCADE;

ALTER TABLE driver
    ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'Available',
ADD COLUMN Area VARCHAR(100),
ADD COLUMN licenceexpirydate DATE,
ADD COLUMN licencenumber VARCHAR(50);

-- 23/01/2026: Vehicle and Driver updates
ALTER TABLE vehicle
    ADD COLUMN vehicle_type VARCHAR(20),
ADD COLUMN fuel_type VARCHAR(20),
ADD COLUMN availability_status VARCHAR(20) DEFAULT 'available';

ALTER TABLE Vehicle
    CHANGE COLUMN vehicle_type vehicle_category VARCHAR(20);

ALTER TABLE driver
    ADD COLUMN homeaddress VARCHAR(255),
ADD COLUMN assignedarea VARCHAR(100),
ADD COLUMN shifttime VARCHAR(50),
ADD COLUMN reportingmanager VARCHAR(100),
ADD COLUMN joineddate DATE,
ADD COLUMN profilepicture LONGTEXT,
ADD COLUMN availability VARCHAR(20) DEFAULT 'available';

-- 25/01/2026: Company Bookings updates
ALTER TABLE companybookings
    ADD COLUMN ride_id VARCHAR(50) UNIQUE AFTER booking_id,
ADD COLUMN customer_name VARCHAR(100) AFTER customerid,
ADD COLUMN customer_phone VARCHAR(20) AFTER customer_name,
ADD COLUMN customer_email VARCHAR(100) AFTER customer_phone,
ADD COLUMN estimated_duration INT AFTER end_time,
ADD COLUMN distance DECIMAL(10,2) AFTER estimated_duration,
ADD COLUMN vehicle_model VARCHAR(100) AFTER vehicleid,
ADD COLUMN vehicle_plate VARCHAR(20) AFTER vehicle_model,
ADD COLUMN special_instructions TEXT AFTER drop_location,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER payment_status;

CREATE INDEX idx_ride_id ON companybookings (ride_id);
CREATE INDEX idx_driver_status ON companybookings (driverid, status);

-- 26/01/2026: Revert Vehicle column name
ALTER TABLE Vehicle
    CHANGE COLUMN vehicle_category vehicle_type VARCHAR(20);

-- 27/01/2026: RentalCompany updates
ALTER TABLE RentalCompany
    ADD UNIQUE KEY uniq_rentalcompany_email (companyemail);

CREATE TABLE IF NOT EXISTS RentalCompanyRegistrationRequest (
                                                                request_id INT NOT NULL AUTO_INCREMENT,
                                                                companyname VARCHAR(50) NOT NULL,
    companyemail VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    registrationnumber VARCHAR(50),
    taxid VARCHAR(50),
    street VARCHAR(100),
    city VARCHAR(50),
    certificatepath VARCHAR(255),
    taxdocumentpath VARCHAR(255),
    hashedpassword CHAR(44) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    salt CHAR(24) CHARACTER SET ascii COLLATE ascii_general_ci NOT NULL,
    status ENUM('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    description TEXT NULL,
    terms TEXT NULL
    );

ALTER TABLE RentalCompany
    ADD COLUMN description TEXT NULL AFTER taxdocumentpath,
ADD COLUMN terms TEXT NULL AFTER description;

ALTER TABLE RentalCompanyRegistrationRequest
    ADD COLUMN description TEXT NULL AFTER taxdocumentpath,
ADD COLUMN terms TEXT NULL AFTER description;

-- 27/01/2026: Issue table
CREATE TABLE IF NOT EXISTS Issue (
                                     issue_id INT AUTO_INCREMENT PRIMARY KEY,
                                     driver_id INT NOT NULL,
                                     category VARCHAR(50) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    booking_id VARCHAR(50),
    plate_number VARCHAR(20),
    photo_path VARCHAR(500),
    is_driveable BOOLEAN,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (driver_id) REFERENCES Driver(driverid) ON DELETE CASCADE
    );
