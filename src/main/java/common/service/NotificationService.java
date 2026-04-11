package common.service;

import common.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * NotificationService – centralised, non-real-time notification helper.
 *
 * Any servlet / controller in the system can call the static methods here
 * to create notifications.  Users see them next time they poll
 * GET /api/notifications, /api/notifications/count, etc.
 *
 * ──────────────────────────────────────────────────────────────
 *  USAGE (one-liner from anywhere):
 *
 *    NotificationService.notify("CUSTOMER", 5, "BOOKING",
 *        "Booking Confirmed",
 *        "Your booking #42 with SpeedyCars is confirmed.",
 *        "BOOKING", 42);
 *
 *    NotificationService.notifyAllAdmins("SYSTEM",
 *        "New Rental Company Request",
 *        "QuickRide Ltd submitted a registration request.",
 *        "COMPANY_REQUEST", 7);
 *
 *    NotificationService.notifyMultiple(recipientList, "BOOKING",
 *        "Booking Cancelled", "Booking #42 was cancelled.",
 *        "BOOKING", 42);
 * ──────────────────────────────────────────────────────────────
 */
public class NotificationService {

    // ─────────────────────────────────────────────
    // 1.  Core: send to ONE recipient
    // ─────────────────────────────────────────────

    /**
     * Create a single notification row.
     *
     * @param recipientType  CUSTOMER | DRIVER | COMPANY | ADMIN | MAINTENANCE | PROVIDER
     * @param recipientId    PK of the recipient in their own table
     * @param type           notification category: NEW_MESSAGE, SYSTEM, BOOKING, TICKET, REPORT, MAINTENANCE, GENERAL
     * @param title          short heading shown in the bell dropdown
     * @param body           longer description / detail text
     * @param referenceType  what entity this links to (BOOKING, TICKET, CONVERSATION, COMPANY_REQUEST, REPORT, MAINTENANCE_JOB …)
     * @param referenceId    PK of that entity (bookingId, ticketId, requestId …)
     */
    public static void notify(String recipientType, int recipientId,
                              String type, String title, String body,
                              String referenceType, int referenceId) {
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(
                     "INSERT INTO Notification(recipient_type, recipient_id, type, title, body, reference_type, reference_id) " +
                             "VALUES(?,?,?,?,?,?,?)")) {
            ps.setString(1, recipientType.toUpperCase());
            ps.setInt(2, recipientId);
            ps.setString(3, type.toUpperCase());
            ps.setString(4, title);
            ps.setString(5, body);
            ps.setString(6, referenceType);
            ps.setInt(7, referenceId);
            ps.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ─────────────────────────────────────────────
    // 2.  Bulk: send to a list of recipients
    // ─────────────────────────────────────────────

    /**
     * Recipient descriptor – pass a list of these to notifyMultiple().
     */
    public static class Recipient {
        public final String type;
        public final int id;

        public Recipient(String type, int id) {
            this.type = type;
            this.id = id;
        }
    }

    /**
     * Send the same notification to several recipients in one batch.
     */
    public static void notifyMultiple(List<Recipient> recipients,
                                      String type, String title, String body,
                                      String referenceType, int referenceId) {
        if (recipients == null || recipients.isEmpty()) return;
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(
                     "INSERT INTO Notification(recipient_type, recipient_id, type, title, body, reference_type, reference_id) " +
                             "VALUES(?,?,?,?,?,?,?)")) {
            for (Recipient r : recipients) {
                ps.setString(1, r.type.toUpperCase());
                ps.setInt(2, r.id);
                ps.setString(3, type.toUpperCase());
                ps.setString(4, title);
                ps.setString(5, body);
                ps.setString(6, referenceType);
                ps.setInt(7, referenceId);
                ps.addBatch();
            }
            ps.executeBatch();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ─────────────────────────────────────────────
    // 3.  Convenience: notify ALL active admins
    // ─────────────────────────────────────────────

    public static void notifyAllAdmins(String type, String title, String body,
                                       String referenceType, int referenceId) {
        List<Recipient> admins = new ArrayList<>();
        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(
                     "SELECT adminid FROM Admin WHERE active=1")) {
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                admins.add(new Recipient("ADMIN", rs.getInt("adminid")));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        notifyMultiple(admins, type, title, body, referenceType, referenceId);
    }

    // ─────────────────────────────────────────────
    // 4.  Convenience: notify ALL staff of a company
    //     (drivers + maintenance + providers linked to that company)
    // ─────────────────────────────────────────────

    public static void notifyCompanyStaff(int companyId, String type, String title, String body,
                                          String referenceType, int referenceId) {
        List<Recipient> staff = new ArrayList<>();
        try (Connection con = DBConnection.getConnection()) {
            // Drivers
            try (PreparedStatement ps = con.prepareStatement(
                    "SELECT driverid FROM Driver WHERE company_id=? AND active=1")) {
                ps.setInt(1, companyId);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) staff.add(new Recipient("DRIVER", rs.getInt(1)));
            }
            // Maintenance staff
            try (PreparedStatement ps = con.prepareStatement(
                    "SELECT maintenanceid FROM MaintenanceStaff WHERE company_id=?")) {
                ps.setInt(1, companyId);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) staff.add(new Recipient("MAINTENANCE", rs.getInt(1)));
            }
            // Providers
            try (PreparedStatement ps = con.prepareStatement(
                    "SELECT providerid FROM VehicleProvider WHERE company_id=? AND status='active'")) {
                ps.setInt(1, companyId);
                ResultSet rs = ps.executeQuery();
                while (rs.next()) staff.add(new Recipient("PROVIDER", rs.getInt(1)));
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        notifyMultiple(staff, type, title, body, referenceType, referenceId);
    }

    // ══════════════════════════════════════════════════════════
    //  READY-MADE EVENT METHODS
    //  Call these directly from your servlets / controllers.
    // ══════════════════════════════════════════════════════════

    // ── RENTAL COMPANY REGISTRATION ──────────────────────────

    /** Provider/user submits a new rental company registration request. */
    public static void onCompanyRegistrationSubmitted(int requestId, String companyName) {
        notifyAllAdmins("SYSTEM",
                "New Company Registration Request",
                companyName + " has submitted a registration request. Please review.",
                "COMPANY_REQUEST", requestId);
    }

    /** Admin approves a rental company request → notify the company. */
    public static void onCompanyRegistrationApproved(int requestId, int newCompanyId, String companyName) {
        // The company just got created, so notify the new company account
        notify("COMPANY", newCompanyId, "SYSTEM",
                "Registration Approved",
                "Welcome to RideMachan! Your company \"" + companyName + "\" has been approved.",
                "COMPANY_REQUEST", requestId);
    }

    /** Admin rejects a rental company request.
     *  Since there's no company account yet, we can't send an in-app notification
     *  to the applicant (they don't have a recipientType/id).
     *  If you later add a "pending user" table you can notify them here.
     *  For now, admins get a confirmation. */
    public static void onCompanyRegistrationRejected(int requestId, String companyName, String reason) {
        notifyAllAdmins("SYSTEM",
                "Company Registration Rejected",
                "\"" + companyName + "\" was rejected. Reason: " + reason,
                "COMPANY_REQUEST", requestId);
    }

    // ── PROVIDER RENTAL REQUESTS ─────────────────────────────

    /** Provider sends a vehicle rental request to a company. */
    public static void onProviderRentalRequestCreated(int requestId, int companyId,
                                                      int providerId, String providerName,
                                                      String vehicleInfo) {
        notify("COMPANY", companyId, "GENERAL",
                "New Vehicle Rental Request",
                providerName + " wants to list a vehicle (" + vehicleInfo + ") with your company.",
                "PROVIDER_REQUEST", requestId);
    }

    /** Company approves a provider's rental request. */
    public static void onProviderRentalRequestApproved(int requestId, int providerId,
                                                       String companyName) {
        notify("PROVIDER", providerId, "GENERAL",
                "Rental Request Approved",
                companyName + " approved your vehicle rental request.",
                "PROVIDER_REQUEST", requestId);
    }

    /** Company rejects a provider's rental request. */
    public static void onProviderRentalRequestRejected(int requestId, int providerId,
                                                       String companyName, String reason) {
        notify("PROVIDER", providerId, "GENERAL",
                "Rental Request Rejected",
                companyName + " rejected your request." + (reason != null ? " Reason: " + reason : ""),
                "PROVIDER_REQUEST", requestId);
    }

    // ── BOOKINGS ─────────────────────────────────────────────

    /** Customer creates a new booking. */
    public static void onBookingCreated(int bookingId, int companyId, int customerId,
                                        String customerName, int driverId) {
        // → Company
        notify("COMPANY", companyId, "BOOKING",
                "New Booking Received",
                "New booking #" + bookingId + " from " + customerName + ".",
                "BOOKING", bookingId);

        // → Customer confirmation
        notify("CUSTOMER", customerId, "BOOKING",
                "Booking Submitted",
                "Your booking #" + bookingId + " has been submitted and is awaiting confirmation.",
                "BOOKING", bookingId);

        // → Driver (if assigned at creation time)
        if (driverId > 0) {
            notify("DRIVER", driverId, "BOOKING",
                    "New Trip Assigned",
                    "You have been assigned to booking #" + bookingId + ".",
                    "BOOKING", bookingId);
        }
    }

    /** Booking status changes (confirmed, cancelled, completed, etc). */
    public static void onBookingStatusChanged(int bookingId, int customerId, int companyId,
                                              int driverId, String newStatus) {
        // → Customer
        notify("CUSTOMER", customerId, "BOOKING",
                "Booking " + capitalize(newStatus),
                "Your booking #" + bookingId + " is now " + newStatus.toLowerCase() + ".",
                "BOOKING", bookingId);

        // → Driver
        if (driverId > 0) {
            notify("DRIVER", driverId, "BOOKING",
                    "Booking " + capitalize(newStatus),
                    "Booking #" + bookingId + " status changed to " + newStatus.toLowerCase() + ".",
                    "BOOKING", bookingId);
        }
    }

    /** Driver is assigned to an existing booking. */
    public static void onDriverAssigned(int bookingId, int driverId, int customerId) {
        notify("DRIVER", driverId, "BOOKING",
                "New Trip Assigned",
                "You have been assigned to booking #" + bookingId + ".",
                "BOOKING", bookingId);

        notify("CUSTOMER", customerId, "BOOKING",
                "Driver Assigned",
                "A driver has been assigned to your booking #" + bookingId + ".",
                "BOOKING", bookingId);
    }

    // ── SUPPORT TICKETS ──────────────────────────────────────

    /** Any user creates a support ticket → notify admins. */
    public static void onTicketCreated(int ticketId, String actorType, String actorName,
                                       String subject, String priority) {
        notifyAllAdmins("TICKET",
                "New Support Ticket",
                actorType + " " + actorName + " — \"" + subject + "\" [" + priority + "]",
                "TICKET", ticketId);
    }

    /** Admin changes ticket status → notify the ticket creator. */
    public static void onTicketStatusChanged(int ticketId, String actorType, int actorId,
                                             String newStatus) {
        notify(actorType, actorId, "TICKET",
                "Ticket #" + ticketId + " Updated",
                "Your support ticket status changed to " + newStatus + ".",
                "TICKET", ticketId);
    }

    // ── REPORTS ──────────────────────────────────────────────

    /** Any user files a report → notify admins. */
    public static void onReportCreated(int reportId, String reporterName, String subject) {
        notifyAllAdmins("REPORT",
                "New Report Filed",
                reporterName + " reported: \"" + subject + "\"",
                "REPORT", reportId);
    }

    /** Admin updates report status → notify the reporter. */
    public static void onReportStatusChanged(int reportId, String reporterRole, int reporterId,
                                             String newStatus) {
        notify(reporterRole, reporterId, "REPORT",
                "Report #" + reportId + " Updated",
                "Your report status changed to " + newStatus + ".",
                "REPORT", reportId);
    }

    /** Admin resolves a report → optionally notify the reported party too. */
    public static void onReportResolved(int reportId,
                                        String reporterRole, int reporterId,
                                        String reportedRole, int reportedId) {
        notify(reporterRole, reporterId, "REPORT",
                "Report Resolved",
                "Your report #" + reportId + " has been resolved.",
                "REPORT", reportId);

        notify(reportedRole, reportedId, "REPORT",
                "Report Resolved",
                "A report (#" + reportId + ") regarding you has been resolved.",
                "REPORT", reportId);
    }

    // ── MAINTENANCE ──────────────────────────────────────────

    /** Maintenance job is created/scheduled. */
    public static void onMaintenanceScheduled(int jobId, int staffId, int companyId,
                                              String vehicleInfo, String scheduledDate) {
        notify("MAINTENANCE", staffId, "MAINTENANCE",
                "New Maintenance Assigned",
                "Vehicle " + vehicleInfo + " scheduled for " + scheduledDate + ".",
                "MAINTENANCE_JOB", jobId);

        notify("COMPANY", companyId, "MAINTENANCE",
                "Maintenance Scheduled",
                "Vehicle " + vehicleInfo + " maintenance on " + scheduledDate + ".",
                "MAINTENANCE_JOB", jobId);
    }

    /** Maintenance job completed. */
    public static void onMaintenanceCompleted(int jobId, int companyId, String vehicleInfo) {
        notify("COMPANY", companyId, "MAINTENANCE",
                "Maintenance Completed",
                "Vehicle " + vehicleInfo + " maintenance has been completed.",
                "MAINTENANCE_JOB", jobId);
    }

    /** Calendar event created for a vehicle. */
    public static void onCalendarEventCreated(int eventId, int maintenanceStaffId,
                                              String serviceType, String vehicleInfo,
                                              String scheduledDate) {
        notify("MAINTENANCE", maintenanceStaffId, "MAINTENANCE",
                "Service Scheduled: " + serviceType,
                vehicleInfo + " on " + scheduledDate + ".",
                "CALENDAR_EVENT", eventId);
    }

    // ── RATINGS ──────────────────────────────────────────────

    /** Customer rates a driver or vehicle. */
    public static void onNewRating(String ratedActorType, int ratedActorId,
                                   int ratingValue, int ratingId) {
        notify(ratedActorType, ratedActorId, "GENERAL",
                "New Rating Received",
                "You received a " + ratingValue + "-star rating.",
                "RATING", ratingId);
    }

    // ── ACCOUNT / ADMIN ACTIONS ──────────────────────────────

    /** Admin bans/deactivates a user. */
    public static void onAccountSuspended(String actorType, int actorId, String reason) {
        notify(actorType, actorId, "SYSTEM",
                "Account Suspended",
                "Your account has been suspended." + (reason != null ? " Reason: " + reason : ""),
                "ACCOUNT", actorId);
    }

    /** Admin reactivates a user. */
    public static void onAccountReactivated(String actorType, int actorId) {
        notify(actorType, actorId, "SYSTEM",
                "Account Reactivated",
                "Your account has been reactivated. Welcome back!",
                "ACCOUNT", actorId);
    }

    // ── UTILITY ──────────────────────────────────────────────

    private static String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
    }
}