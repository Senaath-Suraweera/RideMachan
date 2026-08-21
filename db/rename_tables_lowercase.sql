-- Normalises all table names to lowercase.
-- Required because Aiven runs MySQL on Linux (case-sensitive table names),
-- while local macOS MySQL is case-insensitive and hid the mismatch.
-- Safe to re-run: tables already lowercase are simply not listed.

SET FOREIGN_KEY_CHECKS = 0;

RENAME TABLE `CalendarEvents` TO `calendarevents`;
RENAME TABLE `Conversation` TO `conversation`;
RENAME TABLE `ConversationParticipant` TO `conversationparticipant`;
RENAME TABLE `DriverProfileImage` TO `driverprofileimage`;
RENAME TABLE `Issue` TO `issue`;
RENAME TABLE `Message` TO `message`;
RENAME TABLE `MessagingPermission` TO `messagingpermission`;
RENAME TABLE `Notification` TO `notification`;
RENAME TABLE `ProviderRentalRequests` TO `providerrentalrequests`;
RENAME TABLE `RentalCompany` TO `rentalcompany`;
RENAME TABLE `RentalCompanyRegistrationRequest` TO `rentalcompanyregistrationrequest`;
RENAME TABLE `Report` TO `report`;
RENAME TABLE `ReportActionLog` TO `reportactionlog`;
RENAME TABLE `ReportImage` TO `reportimage`;
RENAME TABLE `SupportTicket` TO `supportticket`;
RENAME TABLE `SupportTicketActionLog` TO `supportticketactionlog`;
RENAME TABLE `SupportTicketImage` TO `supportticketimage`;
RENAME TABLE `Vehicle` TO `vehicle`;
RENAME TABLE `VehicleProvider` TO `vehicleprovider`;

SET FOREIGN_KEY_CHECKS = 1;
