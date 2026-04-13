package customer.controller;

import common.util.DBConnection;
import admin.model.SupportTicket;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CustomerSupportTicketController {

    // ---------- CREATE ----------
    // Returns new ticket_id, or -1 on failure
    public static int createTicket(int customerId, String subject, String description, String priority) {
        String sql = "INSERT INTO SupportTicket(actor_type, actor_id, subject, description, status, priority) " +
                "VALUES('CUSTOMER', ?, ?, ?, 'Open', ?)";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setInt(1, customerId);
            ps.setString(2, subject);
            ps.setString(3, description);
            ps.setString(4, capPriority(priority));

            int rows = ps.executeUpdate();
            if (rows > 0) {
                try (ResultSet keys = ps.getGeneratedKeys()) {
                    if (keys.next()) return keys.getInt(1);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return -1;
    }

    // ---------- LIST (for the logged-in customer) ----------
    public static List<SupportTicket> getMyTickets(int customerId) {
        List<SupportTicket> list = new ArrayList<>();

        String sql = "SELECT ticket_id, subject, description, status, priority, created_at, updated_at " +
                "FROM SupportTicket " +
                "WHERE actor_type='CUSTOMER' AND actor_id=? " +
                "ORDER BY created_at DESC";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, customerId);

            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    SupportTicket t = new SupportTicket();
                    t.setTicketId(rs.getInt("ticket_id"));
                    t.setActorType("CUSTOMER");
                    t.setActorId(customerId);
                    t.setSubject(rs.getString("subject"));
                    t.setDescription(rs.getString("description"));
                    t.setStatus(uiStatusFromDB(rs.getString("status")));
                    t.setPriority(rs.getString("priority").toLowerCase());
                    t.setCreatedAt(String.valueOf(rs.getTimestamp("created_at")));
                    t.setUpdatedAt(String.valueOf(rs.getTimestamp("updated_at")));
                    list.add(t);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    // ---------- GET ONE (with ownership check) ----------
    public static SupportTicket getMyTicket(int customerId, int ticketId) {
        String sql = "SELECT * FROM SupportTicket WHERE ticket_id=? AND actor_type='CUSTOMER' AND actor_id=?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, ticketId);
            ps.setInt(2, customerId);

            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    SupportTicket t = new SupportTicket();
                    t.setTicketId(rs.getInt("ticket_id"));
                    t.setActorType("CUSTOMER");
                    t.setActorId(customerId);
                    t.setSubject(rs.getString("subject"));
                    t.setDescription(rs.getString("description"));
                    t.setAdminNotes(rs.getString("admin_notes"));
                    t.setStatus(uiStatusFromDB(rs.getString("status")));
                    t.setPriority(rs.getString("priority").toLowerCase());
                    t.setCreatedAt(String.valueOf(rs.getTimestamp("created_at")));
                    t.setUpdatedAt(String.valueOf(rs.getTimestamp("updated_at")));
                    return t;
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    // ---------- Helpers ----------
    private static String capPriority(String p) {
        if (p == null || p.isEmpty()) return "Low";
        p = p.toLowerCase().trim();
        String cap = p.substring(0, 1).toUpperCase() + p.substring(1);
        // Validate against enum
        if (cap.equals("Low") || cap.equals("Medium") || cap.equals("High") || cap.equals("Urgent")) {
            return cap;
        }
        return "Low";
    }

    private static String uiStatusFromDB(String dbStatus) {
        if (dbStatus == null) return "pending";
        return switch (dbStatus) {
            case "Open" -> "pending";
            case "In Progress" -> "ongoing";
            case "Resolved" -> "resolved";
            case "Closed" -> "closed";
            default -> "pending";
        };
    }
}