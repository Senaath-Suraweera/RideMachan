USE `RideMachan`;

-- Rename column from vehicle_category back to vehicle_type
ALTER TABLE Vehicle
CHANGE COLUMN vehicle_category vehicle_type VARCHAR(20);
