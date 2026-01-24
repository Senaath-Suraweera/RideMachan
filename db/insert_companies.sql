-- ====================================================================
-- Insert Rental Companies for RideMachan
-- ====================================================================
-- Run this FIRST before inserting any vehicles
-- This satisfies the foreign key constraint for vehicle.company_id
-- ====================================================================

USE `RideMachan`;

-- Delete existing companies (if any) to start fresh
DELETE FROM RentalCompany WHERE companyid IN (1,2,3,4,5,6);

-- Insert the 6 rental companies
INSERT INTO RentalCompany (companyid, companyname, companyemail, hashedpassword, salt) VALUES
(1, 'Premium Rentals', 'info@premiumrentals.lk',
 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=',
 'c2FsdDEyMzQ1Njc4OTAxMjM0'),

(2, 'City Car Rentals', 'contact@citycarrentals.lk',
 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=',
 'c2FsdDEyMzQ1Njc4OTAxMjM0'),

(3, 'Budget Wheels', 'hello@budgetwheels.lk',
 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=',
 'c2FsdDEyMzQ1Njc4OTAxMjM0'),

(4, 'Lanka Van Hire', 'service@lankavanhire.lk',
 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=',
 'c2FsdDEyMzQ1Njc4OTAxMjM0'),

(5, 'Luxury Rides LK', 'vip@luxuryrideslk.com',
 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=',
 'c2FsdDEyMzQ1Njc4OTAxMjM0'),

(6, 'Island Transport', 'bookings@islandtransport.lk',
 'dGVtcGhhc2gxMjM0NTY3ODkwMTIzNDU2Nzg5MDEyMzQ=',
 'c2FsdDEyMzQ1Njc4OTAxMjM0');

-- Verify companies were inserted
SELECT companyid, companyname, companyemail FROM RentalCompany ORDER BY companyid;

-- Expected output:
-- +------------+------------------+-----------------------------+
-- | companyid  | companyname      | companyemail                |
-- +------------+------------------+-----------------------------+
-- | 1          | Premium Rentals  | info@premiumrentals.lk      |
-- | 2          | City Car Rentals | contact@citycarrentals.lk   |
-- | 3          | Budget Wheels    | hello@budgetwheels.lk       |
-- | 4          | Lanka Van Hire   | service@lankavanhire.lk     |
-- | 5          | Luxury Rides LK  | vip@luxuryrideslk.com       |
-- | 6          | Island Transport | bookings@islandtransport.lk |
-- +------------+------------------+-----------------------------+
