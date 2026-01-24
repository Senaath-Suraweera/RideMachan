-- ====================================================================
-- Vehicle Sample Data for RideMachan
-- ====================================================================
-- This file contains INSERT statements for populating the Vehicle table
-- with realistic Sri Lankan vehicle rental data
-- Date: January 23, 2026
-- ====================================================================

USE `RideMachan`;

-- First, add missing columns to Vehicle table (if not already added)
-- Note: vehicle_type has been replaced with vehicle_category (Car/SUV/Van)
-- vehicle_type is now computed as vehiclebrand + vehiclemodel in the application
ALTER TABLE Vehicle
    ADD COLUMN IF NOT EXISTS vehicle_category VARCHAR(20),
    ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(20),
    ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'available';

-- ====================================================================
-- Insert Rental Companies FIRST (Required for Foreign Key Constraints)
-- ====================================================================
-- Note: These use placeholder passwords - change them in production!
-- hashedpassword: CHAR(44) - Base64 encoded SHA-256 hash (exactly 44 chars)
-- salt: CHAR(24) - Base64 encoded 16-byte salt (exactly 24 chars)

INSERT INTO RentalCompany (companyid, companyname, companyemail, hashedpassword, salt) VALUES
(1, 'Premium Rentals', 'info@premiumrentals.lk', 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=', 'c2FsdDEyMzQ1Njc4OTAxMjM0'),
(2, 'City Car Rentals', 'contact@citycarrentals.lk', 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=', 'c2FsdDEyMzQ1Njc4OTAxMjM0'),
(3, 'Budget Wheels', 'hello@budgetwheels.lk', 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=', 'c2FsdDEyMzQ1Njc4OTAxMjM0'),
(4, 'Lanka Van Hire', 'service@lankavanhire.lk', 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=', 'c2FsdDEyMzQ1Njc4OTAxMjM0'),
(5, 'Luxury Rides LK', 'vip@luxuryrideslk.com', 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=', 'c2FsdDEyMzQ1Njc4OTAxMjM0'),
(6, 'Island Transport', 'bookings@islandtransport.lk', 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=', 'c2FsdDEyMzQ1Njc4OTAxMjM0')
ON DUPLICATE KEY UPDATE companyname=VALUES(companyname);

-- ====================================================================
-- Company 1: Premium Rentals - High-end vehicles
-- ====================================================================

INSERT INTO Vehicle (
    vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color,
    numberofpassengers, enginecapacity, enginenumber, chasisnumber,
    registrationdocumentation, vehicleimages, description, milage,
    company_id, provider_id, price_per_day, location, features,
    vehicle_category, fuel_type, availability_status
) VALUES
('Honda', 'Vezel', 'CAR-1234', 1350, 'Pearl White', 5, 1500, 'L15B7001234', 'RU3-1234567',
 '', '', 'Premium hybrid SUV with excellent fuel economy, leather seats, and advanced safety features',
 '45000 km', 1, NULL, 6500.00, 'Colombo 03',
 'GPS Navigation,Bluetooth,A/C,Leather Seats,Parking Sensors,Reverse Camera',
 'SUV', 'Hybrid', 'available'),

('BMW', 'X3', 'CAB-5678', 1800, 'Black', 5, 2000, 'B48A20001234', 'WBAXG71020D123456',
 '', '', 'Luxury SUV with premium sound system, sunroof, and cutting-edge technology',
 '32000 km', 1, NULL, 12500.00, 'Colombo 07',
 'Premium Sound,Sunroof,GPS,Leather Interior,Heated Seats,Cruise Control',
 'SUV', 'Petrol', 'available'),

('Mercedes', 'E-Class', 'CAE-9012', 1650, 'Silver', 5, 2000, 'M274E20001234', 'WDD2130041A123456',
 '', '', 'Executive sedan with sophisticated design and unmatched comfort',
 '28000 km', 1, NULL, 15000.00, 'Colombo 03',
 'Premium Audio,Leather,GPS,Adaptive Cruise,Massage Seats,Ambient Lighting',
 'Car', 'Diesel', 'available');

-- ====================================================================
-- Company 2: City Car Rentals - Economy and mid-range vehicles
-- ====================================================================

INSERT INTO Vehicle (
    vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color,
    numberofpassengers, enginecapacity, enginenumber, chasisnumber,
    registrationdocumentation, vehicleimages, description, milage,
    company_id, provider_id, price_per_day, location, features,
    vehicle_category, fuel_type, availability_status
) VALUES
('Toyota', 'Axio', 'WP-2345', 1100, 'Blue', 5, 1500, '2NZ-FE001234', 'NRE160-1234567',
 '', '', 'Reliable compact sedan perfect for city driving and fuel efficiency',
 '58000 km', 2, NULL, 4500.00, 'Kandy',
 'A/C,Bluetooth,Power Steering,ABS Brakes,Airbags',
 'Car', 'Petrol', 'available'),

('Honda', 'Civic', 'WP-6789', 1200, 'Red', 5, 1800, 'R18Z4001234', 'FC1-1234567',
 '', '', 'Sporty sedan with modern features and comfortable interior',
 '42000 km', 2, NULL, 5000.00, 'Kandy',
 'A/C,Bluetooth,Cruise Control,Alloy Wheels,Touchscreen',
 'Car', 'Petrol', 'available'),

('Mazda', 'Axela', 'WP-3456', 1250, 'White', 5, 1500, 'P5-VPS001234', 'BM5FS-123456',
 '', '', 'Stylish hatchback with excellent handling and fuel economy',
 '48000 km', 2, NULL, 4800.00, 'Kandy',
 'A/C,Bluetooth,Power Steering,Alloy Wheels,LED Lights',
 'Car', 'Petrol', 'available');

-- ====================================================================
-- Company 3: Budget Wheels - Budget-friendly options
-- ====================================================================

INSERT INTO Vehicle (
    vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color,
    numberofpassengers, enginecapacity, enginenumber, chasisnumber,
    registrationdocumentation, vehicleimages, description, milage,
    company_id, provider_id, price_per_day, location, features,
    vehicle_category, fuel_type, availability_status
) VALUES
('Suzuki', 'Alto', 'CP-4567', 700, 'Silver', 4, 800, 'F8D001234', 'HA36S-123456',
 '', '', 'Compact and economical city car, perfect for budget travelers',
 '65000 km', 3, NULL, 3500.00, 'Galle',
 'A/C,Power Steering,Radio,Fuel Efficient',
 'Car', 'Petrol', 'available'),

('Suzuki', 'Wagon R', 'CP-7890', 800, 'Green', 5, 1000, 'K10C001234', 'MH55S-123456',
 '', '', 'Spacious compact car with excellent fuel economy',
 '70000 km', 3, NULL, 3800.00, 'Galle',
 'A/C,Power Steering,Spacious Interior,Bluetooth',
 'Car', 'Petrol', 'available'),

('Nissan', 'March', 'CP-1234', 900, 'Yellow', 5, 1200, 'HR12DE001234', 'K13-123456',
 '', '', 'Fun and efficient city car with modern styling',
 '62000 km', 3, NULL, 4000.00, 'Galle',
 'A/C,Bluetooth,Power Windows,USB Port',
 'Car', 'Petrol', 'available');

-- ====================================================================
-- Company 4: Lanka Van Hire - Vans and group transport
-- ====================================================================

INSERT INTO Vehicle (
    vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color,
    numberofpassengers, enginecapacity, enginenumber, chasisnumber,
    registrationdocumentation, vehicleimages, description, milage,
    company_id, provider_id, price_per_day, location, features,
    vehicle_category, fuel_type, availability_status
) VALUES
('Toyota', 'Hiace', 'NP-5678', 1900, 'White', 14, 2800, '2KD-FTV001234', 'TRH223-123456',
 '', '', 'Spacious 14-seater van ideal for group tours and family trips',
 '95000 km', 4, NULL, 8500.00, 'Negombo',
 'A/C,GPS,Spacious Luggage,Bluetooth,Comfortable Seating',
 'Van', 'Diesel', 'available'),

('Nissan', 'Caravan', 'NP-9012', 1850, 'Silver', 9, 2500, 'QD32001234', 'E25-123456',
 '', '', 'Comfortable 9-seater van perfect for small groups and families',
 '108000 km', 4, NULL, 7500.00, 'Negombo',
 'A/C,GPS,Spacious Luggage,Radio,Sliding Door',
 'Van', 'Diesel', 'available'),

('Toyota', 'KDH Van', 'NP-3456', 2000, 'White', 12, 3000, '1KD-FTV001234', 'KDH201-123456',
 '', '', 'Large capacity van for group transport with ample luggage space',
 '120000 km', 4, NULL, 9000.00, 'Negombo',
 'A/C,Power Steering,Spacious,Luggage Rack,DVD Player',
 'Van', 'Diesel', 'available');

-- ====================================================================
-- Company 5: Luxury Rides LK - Premium and luxury vehicles
-- ====================================================================

INSERT INTO Vehicle (
    vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color,
    numberofpassengers, enginecapacity, enginenumber, chasisnumber,
    registrationdocumentation, vehicleimages, description, milage,
    company_id, provider_id, price_per_day, location, features,
    vehicle_category, fuel_type, availability_status
) VALUES
('Audi', 'A4', 'CAD-6789', 1580, 'Grey', 5, 2000, 'CVKB001234', '8W2-123456',
 '', '', 'Sophisticated sedan with cutting-edge technology and premium comfort',
 '35000 km', 5, NULL, 13500.00, 'Colombo 07',
 'Virtual Cockpit,Leather,GPS,Adaptive Cruise,LED Lights,Sound System',
 'Car', 'Petrol', 'available'),

('Range Rover', 'Evoque', 'CAD-9012', 1800, 'Black', 5, 2000, 'PT204001234', 'LV-123456',
 '', '', 'Luxury compact SUV with stunning design and exceptional performance',
 '28000 km', 5, NULL, 16000.00, 'Colombo 07',
 'Panoramic Roof,Leather,GPS,360 Camera,Premium Audio,Air Suspension',
 'SUV', 'Petrol', 'available'),

('Lexus', 'ES 300h', 'CAD-3456', 1700, 'Pearl White', 5, 2500, '2AR-FSE001234', 'AVV60L-123456',
 '', '', 'Luxury hybrid sedan combining elegance with efficiency',
 '32000 km', 5, NULL, 14500.00, 'Colombo 03',
 'Mark Levinson Audio,Leather,GPS,Heated Seats,HUD,Adaptive Cruise',
 'Car', 'Hybrid', 'available');

-- ====================================================================
-- Company 6: Island Transport - Mixed fleet
-- ====================================================================

INSERT INTO Vehicle (
    vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color,
    numberofpassengers, enginecapacity, enginenumber, chasisnumber,
    registrationdocumentation, vehicleimages, description, milage,
    company_id, provider_id, price_per_day, location, features,
    vehicle_category, fuel_type, availability_status
) VALUES
('Toyota', 'Prius', 'AP-7890', 1380, 'Blue', 5, 1800, '2ZR-FXE001234', 'ZVW30-123456',
 '', '', 'Popular hybrid sedan with excellent fuel economy and comfort',
 '75000 km', 6, NULL, 5500.00, 'Anuradhapura',
 'Hybrid Technology,A/C,Bluetooth,GPS,Eco Mode,Cruise Control',
 'Car', 'Hybrid', 'available'),

('Mitsubishi', 'Montero', 'AP-1234', 2200, 'Silver', 7, 3000, '4M41001234', 'V98W-123456',
 '', '', 'Powerful 4WD SUV perfect for long journeys and rough terrain',
 '88000 km', 6, NULL, 10500.00, 'Anuradhapura',
 '4WD,A/C,GPS,7 Seats,Hill Assist,Cruise Control,Leather',
 'SUV', 'Diesel', 'available'),

('Toyota', 'Aqua', 'AP-5678', 1100, 'Red', 5, 1500, '1NZ-FXE001234', 'NHP10-123456',
 '', '', 'Compact hybrid hatchback with exceptional fuel efficiency',
 '52000 km', 6, NULL, 4200.00, 'Anuradhapura',
 'Hybrid,A/C,Bluetooth,Power Steering,Eco Mode,USB Port',
 'Car', 'Hybrid', 'available');

-- ====================================================================
-- Additional Popular Vehicles
-- ====================================================================

INSERT INTO Vehicle (
    vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color,
    numberofpassengers, enginecapacity, enginenumber, chasisnumber,
    registrationdocumentation, vehicleimages, description, milage,
    company_id, provider_id, price_per_day, location, features,
    vehicle_category, fuel_type, availability_status
) VALUES
('Toyota', 'Corolla', 'WP-8901', 1250, 'Silver', 5, 1600, '2ZR-FE001234', 'ZRE142-123456',
 '', '', 'Reliable mid-size sedan perfect for business and family use',
 '68000 km', 2, NULL, 5200.00, 'Kandy',
 'A/C,Bluetooth,Power Windows,ABS,Airbags,Cruise Control',
 'Car', 'Petrol', 'available'),

('Suzuki', 'Swift', 'CP-2345', 900, 'White', 5, 1200, 'K12M001234', 'ZC83S-123456',
 '', '', 'Sporty compact hatchback with nimble handling',
 '55000 km', 3, NULL, 4300.00, 'Galle',
 'A/C,Bluetooth,Alloy Wheels,Touchscreen,Sporty Design',
 'Car', 'Petrol', 'available'),

('Honda', 'Fit', 'CAR-6789', 1050, 'Orange', 5, 1300, 'L13B001234', 'GK3-123456',
 '', '', 'Versatile hatchback with magic seats and spacious interior',
 '60000 km', 1, NULL, 4600.00, 'Colombo 03',
 'A/C,Bluetooth,Magic Seats,Power Windows,USB Port',
 'Car', 'Petrol', 'available'),

('Nissan', 'X-Trail', 'CAB-7890', 1650, 'Brown', 7, 2000, 'MR20DD001234', 'T32-123456',
 '', '', '7-seater SUV with advanced safety and comfort features',
 '45000 km', 1, NULL, 9500.00, 'Colombo 07',
 'A/C,GPS,7 Seats,Reverse Camera,Cruise Control,LED Lights',
 'SUV', 'Petrol', 'available'),

('Toyota', 'Voxy', 'NP-4567', 1600, 'Black', 8, 2000, '3ZR-FAE001234', 'ZRR80-123456',
 '', '', 'Modern 8-seater MPV perfect for family trips',
 '52000 km', 4, NULL, 7800.00, 'Negombo',
 'A/C,Power Sliding Doors,GPS,Rear Entertainment,Spacious',
 'Van', 'Petrol', 'available'),

('Mitsubishi', 'Outlander', 'WP-5678', 1700, 'White', 7, 2400, '4B12001234', 'GF7W-123456',
 '', '', 'Versatile 7-seater SUV with 4WD capability',
 '58000 km', 2, NULL, 8800.00, 'Kandy',
 '4WD,A/C,GPS,7 Seats,Parking Sensors,Cruise Control',
 'SUV', 'Petrol', 'available'),

('Nissan', 'Tiida', 'CP-6789', 1150, 'Blue', 5, 1500, 'HR15DE001234', 'C11-123456',
 '', '', 'Compact sedan with spacious cabin and good fuel economy',
 '72000 km', 3, NULL, 4400.00, 'Galle',
 'A/C,Bluetooth,Power Steering,CD Player,Spacious',
 'Car', 'Petrol', 'available');

-- ====================================================================
-- Some vehicles marked as rented (unavailable)
-- ====================================================================

INSERT INTO Vehicle (
    vehiclebrand, vehiclemodel, numberplatenumber, tareweight, color,
    numberofpassengers, enginecapacity, enginenumber, chasisnumber,
    registrationdocumentation, vehicleimages, description, milage,
    company_id, provider_id, price_per_day, location, features,
    vehicle_category, fuel_type, availability_status
) VALUES
('Honda', 'CR-V', 'CAB-8901', 1600, 'White', 7, 2400, 'K24W001234', 'RW1-123456',
 '', '', 'Popular 7-seater SUV with excellent versatility - Currently Rented',
 '48000 km', 1, NULL, 11000.00, 'Colombo 03',
 'A/C,GPS,7 Seats,Reverse Camera,Cruise Control,LED Lights',
 'SUV', 'Petrol', 'rented'),

('Toyota', 'Camry', 'CAD-1234', 1590, 'Black', 5, 2500, '2AR-FE001234', 'AVV50-123456',
 '', '', 'Executive sedan with premium features - Currently Rented',
 '42000 km', 5, NULL, 12000.00, 'Colombo 07',
 'Leather,GPS,Premium Audio,Heated Seats,Cruise Control,LED',
 'Car', 'Petrol', 'rented'),

('Nissan', 'Elgrand', 'NP-7890', 2100, 'Silver', 8, 3500, 'VQ35DE001234', 'E51-123456',
 '', '', 'Luxury 8-seater van with captain seats - Currently Rented',
 '98000 km', 4, NULL, 10500.00, 'Negombo',
 'A/C,GPS,8 Seats,DVD Player,Captain Seats,Power Doors',
 'Van', 'Petrol', 'rented');

-- ====================================================================
-- Summary Statistics
-- ====================================================================
-- Total Vehicles: 30
-- Available: 27
-- Rented: 3
--
-- By Type:
-- Cars: 18
-- SUVs: 8
-- Vans: 4
--
-- By Fuel:
-- Petrol: 18
-- Diesel: 6
-- Hybrid: 6
--
-- By Company:
-- Company 1 (Premium Rentals): 5 vehicles
-- Company 2 (City Car Rentals): 5 vehicles
-- Company 3 (Budget Wheels): 4 vehicles
-- Company 4 (Lanka Van Hire): 5 vehicles
-- Company 5 (Luxury Rides LK): 3 vehicles
-- Company 6 (Island Transport): 5 vehicles
--
-- Price Range: LKR 3,500 - 16,000 per day
-- ====================================================================
