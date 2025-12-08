package rentalcompany.maintenance.controller;

import rentalcompany.maintenance.model.CalendarEvent;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * CalendarEventDAO - Data Access Object for Calendar Events
 * Updated to support the new database schema with additional fields
 */
public class CalendarEventDAO {

    private final Connection con;

    public CalendarEventDAO(Connection con) {
        this.con = con;
    }

    /**
     * Add new calendar event with all fields
     */
    public boolean addEvent(CalendarEvent event) throws SQLException {
        String sql = "INSERT INTO CalendarEvents " +
                "(vehicle_id, service_type, status, description, maintenance_id, " +
                "scheduled_date, scheduled_time, service_bay, estimated_duration, assigned_technician) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, event.getVehicleId());
            ps.setString(2, event.getServiceType());
            ps.setString(3, event.getStatus());
            ps.setString(4, event.getDescription());
            ps.setInt(5, event.getMaintenanceId());
            ps.setString(6, event.getScheduledDate());
            ps.setString(7, event.getScheduledTime());
            ps.setString(8, event.getServiceBay());
            ps.setString(9, event.getEstimatedDuration());
            ps.setString(10, event.getAssignedTechnician());

            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Update existing calendar event
     */
    public boolean updateEvent(CalendarEvent event) throws SQLException {
        String sql = "UPDATE CalendarEvents SET " +
                "vehicle_id=?, service_type=?, status=?, description=?, maintenance_id=?, " +
                "scheduled_date=?, scheduled_time=?, service_bay=?, estimated_duration=?, " +
                "assigned_technician=? " +
                "WHERE eventid=?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, event.getVehicleId());
            ps.setString(2, event.getServiceType());
            ps.setString(3, event.getStatus());
            ps.setString(4, event.getDescription());
            ps.setInt(5, event.getMaintenanceId());
            ps.setString(6, event.getScheduledDate());
            ps.setString(7, event.getScheduledTime());
            ps.setString(8, event.getServiceBay());
            ps.setString(9, event.getEstimatedDuration());
            ps.setString(10, event.getAssignedTechnician());
            ps.setInt(11, event.getEventId());

            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Update only the status of an event (for quick status changes)
     */
    public boolean updateEventStatus(int eventId, String status) throws SQLException {
        String sql = "UPDATE CalendarEvents SET status=? WHERE eventid=?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setInt(2, eventId);

            return ps.executeUpdate() > 0;
        }
    }

    /**
     * Delete an event
     */
    public boolean deleteEvent(int eventId) throws SQLException {
        String sql = "DELETE FROM CalendarEvents WHERE eventid=?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, eventId);
            return ps.executeUpdate() > 0;
        }
    }

    /**
     * List all events with vehicle details (for calendar display)
     */
    public List<CalendarEvent> listEvents() throws SQLException {
        List<CalendarEvent> events = new ArrayList<>();

        String sql = "SELECT " +
                "ce.eventid, ce.vehicle_id, " +
                "v.numberplatenumber AS vehicleNumberPlate, " +
                "CONCAT(v.vehiclebrand, ' ', v.vehiclemodel) AS vehicleModel, " +
                "ce.service_type, ce.status, ce.description, ce.maintenance_id, " +
                "ce.scheduled_date, TIME_FORMAT(ce.scheduled_time, '%H:%i') AS scheduled_time, " +
                "ce.service_bay, ce.estimated_duration, ce.assigned_technician " +
                "FROM CalendarEvents ce " +
                "INNER JOIN Vehicle v ON ce.vehicle_id = v.vehicleid " +
                "ORDER BY ce.scheduled_date DESC, ce.scheduled_time ASC";

        try (PreparedStatement ps = con.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {

            while (rs.next()) {
                events.add(new CalendarEvent(
                        rs.getInt("eventid"),
                        rs.getInt("vehicle_id"),
                        rs.getString("vehicleNumberPlate"),
                        rs.getString("vehicleModel"),
                        rs.getString("service_type"),
                        rs.getString("status"),
                        rs.getString("description"),
                        rs.getInt("maintenance_id"),
                        rs.getString("scheduled_date"),
                        rs.getString("scheduled_time"),
                        rs.getString("service_bay"),
                        rs.getString("estimated_duration"),
                        rs.getString("assigned_technician")
                ));
            }
        }

        return events;
    }

    /**
     * Get events for a specific date
     */
    public List<CalendarEvent> getEventsByDate(String date) throws SQLException {
        List<CalendarEvent> events = new ArrayList<>();

        String sql = "SELECT " +
                "ce.eventid, ce.vehicle_id, " +
                "v.numberplatenumber AS vehicleNumberPlate, " +
                "CONCAT(v.vehiclebrand, ' ', v.vehiclemodel) AS vehicleModel, " +
                "ce.service_type, ce.status, ce.description, ce.maintenance_id, " +
                "ce.scheduled_date, TIME_FORMAT(ce.scheduled_time, '%H:%i') AS scheduled_time, " +
                "ce.service_bay, ce.estimated_duration, ce.assigned_technician " +
                "FROM CalendarEvents ce " +
                "INNER JOIN Vehicle v ON ce.vehicle_id = v.vehicleid " +
                "WHERE ce.scheduled_date = ? " +
                "ORDER BY ce.scheduled_time ASC";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, date);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    events.add(new CalendarEvent(
                            rs.getInt("eventid"),
                            rs.getInt("vehicle_id"),
                            rs.getString("vehicleNumberPlate"),
                            rs.getString("vehicleModel"),
                            rs.getString("service_type"),
                            rs.getString("status"),
                            rs.getString("description"),
                            rs.getInt("maintenance_id"),
                            rs.getString("scheduled_date"),
                            rs.getString("scheduled_time"),
                            rs.getString("service_bay"),
                            rs.getString("estimated_duration"),
                            rs.getString("assigned_technician")
                    ));
                }
            }
        }

        return events;
    }

    /**
     * Get events for a date range (for calendar month view)
     */
    public List<CalendarEvent> getEventsByDateRange(String startDate, String endDate) throws SQLException {
        List<CalendarEvent> events = new ArrayList<>();

        String sql = "SELECT " +
                "ce.eventid, ce.vehicle_id, " +
                "v.numberplatenumber AS vehicleNumberPlate, " +
                "CONCAT(v.vehiclebrand, ' ', v.vehiclemodel) AS vehicleModel, " +
                "ce.service_type, ce.status, ce.description, ce.maintenance_id, " +
                "ce.scheduled_date, TIME_FORMAT(ce.scheduled_time, '%H:%i') AS scheduled_time, " +
                "ce.service_bay, ce.estimated_duration, ce.assigned_technician " +
                "FROM CalendarEvents ce " +
                "INNER JOIN Vehicle v ON ce.vehicle_id = v.vehicleid " +
                "WHERE ce.scheduled_date BETWEEN ? AND ? " +
                "ORDER BY ce.scheduled_date ASC, ce.scheduled_time ASC";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, startDate);
            ps.setString(2, endDate);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    events.add(new CalendarEvent(
                            rs.getInt("eventid"),
                            rs.getInt("vehicle_id"),
                            rs.getString("vehicleNumberPlate"),
                            rs.getString("vehicleModel"),
                            rs.getString("service_type"),
                            rs.getString("status"),
                            rs.getString("description"),
                            rs.getInt("maintenance_id"),
                            rs.getString("scheduled_date"),
                            rs.getString("scheduled_time"),
                            rs.getString("service_bay"),
                            rs.getString("estimated_duration"),
                            rs.getString("assigned_technician")
                    ));
                }
            }
        }

        return events;
    }

    /**
     * Get a single event by ID
     */
    public CalendarEvent getEventById(int eventId) throws SQLException {
        String sql = "SELECT " +
                "ce.eventid, ce.vehicle_id, " +
                "v.numberplatenumber AS vehicleNumberPlate, " +
                "CONCAT(v.vehiclebrand, ' ', v.vehiclemodel) AS vehicleModel, " +
                "ce.service_type, ce.status, ce.description, ce.maintenance_id, " +
                "ce.scheduled_date, TIME_FORMAT(ce.scheduled_time, '%H:%i') AS scheduled_time, " +
                "ce.service_bay, ce.estimated_duration, ce.assigned_technician " +
                "FROM CalendarEvents ce " +
                "INNER JOIN Vehicle v ON ce.vehicle_id = v.vehicleid " +
                "WHERE ce.eventid = ?";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setInt(1, eventId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return new CalendarEvent(
                            rs.getInt("eventid"),
                            rs.getInt("vehicle_id"),
                            rs.getString("vehicleNumberPlate"),
                            rs.getString("vehicleModel"),
                            rs.getString("service_type"),
                            rs.getString("status"),
                            rs.getString("description"),
                            rs.getInt("maintenance_id"),
                            rs.getString("scheduled_date"),
                            rs.getString("scheduled_time"),
                            rs.getString("service_bay"),
                            rs.getString("estimated_duration"),
                            rs.getString("assigned_technician")
                    );
                }
            }
        }

        return null;
    }

    /**
     * Get events by status
     */
    public List<CalendarEvent> getEventsByStatus(String status) throws SQLException {
        List<CalendarEvent> events = new ArrayList<>();

        String sql = "SELECT " +
                "ce.eventid, ce.vehicle_id, " +
                "v.numberplatenumber AS vehicleNumberPlate, " +
                "CONCAT(v.vehiclebrand, ' ', v.vehiclemodel) AS vehicleModel, " +
                "ce.service_type, ce.status, ce.description, ce.maintenance_id, " +
                "ce.scheduled_date, TIME_FORMAT(ce.scheduled_time, '%H:%i') AS scheduled_time, " +
                "ce.service_bay, ce.estimated_duration, ce.assigned_technician " +
                "FROM CalendarEvents ce " +
                "INNER JOIN Vehicle v ON ce.vehicle_id = v.vehicleid " +
                "WHERE ce.status = ? " +
                "ORDER BY ce.scheduled_date ASC, ce.scheduled_time ASC";

        try (PreparedStatement ps = con.prepareStatement(sql)) {
            ps.setString(1, status);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    events.add(new CalendarEvent(
                            rs.getInt("eventid"),
                            rs.getInt("vehicle_id"),
                            rs.getString("vehicleNumberPlate"),
                            rs.getString("vehicleModel"),
                            rs.getString("service_type"),
                            rs.getString("status"),
                            rs.getString("description"),
                            rs.getInt("maintenance_id"),
                            rs.getString("scheduled_date"),
                            rs.getString("scheduled_time"),
                            rs.getString("service_bay"),
                            rs.getString("estimated_duration"),
                            rs.getString("assigned_technician")
                    ));
                }
            }
        }

        return events;
    }
}