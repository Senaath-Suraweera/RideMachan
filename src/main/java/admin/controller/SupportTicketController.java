package admin.controller;

import common.util.DBConnection;
import admin.model.SupportTicket;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class SupportTicketController {

    private static Connection con = null;

    // ---------- Helpers ----------
    private static int parseTicketId(String idOrDisplay) {
        if (idOrDisplay == null) return -1;
        idOrDisplay = idOrDisplay.trim();

        if (idOrDisplay.matches("\\d+")) return Integer.parseInt(idOrDisplay);

        // Supports: TKT-2024-001
        if (idOrDisplay.startsWith("TKT-")) {
            String[] parts = idOrDisplay.split("-");
            if (parts.length >= 3 && parts[2].matches("\\d+")) {
                return Integer.parseInt(parts[2]);
            }
        }
        return -1;
    }

    private static String dbStatusFromUI(String uiStatus) {
        if (uiStatus == null || uiStatus.isEmpty()) return null;
        return switch (uiStatus) {
            case "pending" -> "Open";
            case "ongoing" -> "In Progress";
            case "resolved" -> "Resolved";
            case "closed" -> "Closed";
            default -> null;
        };
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

    private static String actorTypeFromUIRole(String role) {
        if (role == null || role.isEmpty()) return null;
        return switch (role) {
            case "customer" -> "CUSTOMER";
            case "driver" -> "DRIVER";
            case "company" -> "COMPANY";
            default -> role.toUpperCase();
        };
    }

    private static String uiRoleFromActorType(String actorType) {
        if (actorType == null) return "";
        return switch (actorType) {
            case "CUSTOMER" -> "customer";
            case "DRIVER" -> "driver";
            case "COMPANY" -> "company";
            default -> actorType.toLowerCase();
        };
    }

    private static String capPriority(String p) {
        if (p == null || p.isEmpty()) return null;
        p = p.toLowerCase().trim();
        return p.substring(0, 1).toUpperCase() + p.substring(1);
    }

    // ---------- LIST (for support-ticket-view) ----------
    public static List<SupportTicket> getAllTickets(String statusUI, String roleUI, String priorityUI) {
        List<SupportTicket> list = new ArrayList<>();

        String statusDB = dbStatusFromUI(statusUI);
        String actorType = actorTypeFromUIRole(roleUI);
        String priorityDB = (priorityUI == null || priorityUI.isEmpty()) ? null : capPriority(priorityUI);

        try {
            con = DBConnection.getConnection();

            StringBuilder sql = new StringBuilder(
                    "SELECT ticket_id, actor_type, actor_id, subject, status, priority, booking_id, created_at " +
                            "FROM SupportTicket WHERE 1=1"
            );

            List<Object> params = new ArrayList<>();

            if (statusDB != null) {
                sql.append(" AND status=?");
                params.add(statusDB);
            }
            if (actorType != null) {
                sql.append(" AND actor_type=?");
                params.add(actorType);
            }
            if (priorityDB != null) {
                sql.append(" AND priority=?");
                params.add(priorityDB);
            }

            sql.append(" ORDER BY created_at DESC");

            PreparedStatement ps = con.prepareStatement(sql.toString());

            for (int i = 0; i < params.size(); i++) {
                ps.setObject(i + 1, params.get(i));
            }

            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                SupportTicket t = new SupportTicket();
                t.setTicketId(rs.getInt("ticket_id"));
                t.setActorType(uiRoleFromActorType(rs.getString("actor_type"))); // UI role
                t.setActorId(rs.getInt("actor_id"));
                t.setSubject(rs.getString("subject"));
                t.setStatus(uiStatusFromDB(rs.getString("status"))); // UI status
                t.setPriority(rs.getString("priority").toLowerCase()); // UI priority
                t.setBookingId(rs.getString("booking_id"));
                t.setCreatedAt(String.valueOf(rs.getTimestamp("created_at")));
                list.add(t);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    // ---------- GET ONE (for support-ticket.html) ----------
    public static SupportTicket getTicket(String idOrDisplay) {
        SupportTicket t = null;
        int ticketId = parseTicketId(idOrDisplay);
        if (ticketId <= 0) return null;

        try {
            con = DBConnection.getConnection();

            String sql = "SELECT * FROM SupportTicket WHERE ticket_id=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setInt(1, ticketId);

            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                t = new SupportTicket();
                t.setTicketId(rs.getInt("ticket_id"));
                t.setActorType(rs.getString("actor_type"));
                t.setActorId(rs.getInt("actor_id"));
                t.setSubject(rs.getString("subject"));
                t.setDescription(rs.getString("description"));
                t.setAdminNotes(rs.getString("admin_notes"));
                t.setStatus(rs.getString("status"));
                t.setPriority(rs.getString("priority"));
                t.setBookingId(rs.getString("booking_id"));
                t.setCreatedAt(String.valueOf(rs.getTimestamp("created_at")));
                t.setUpdatedAt(String.valueOf(rs.getTimestamp("updated_at")));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return t;
    }

    // ---------- UPDATE ----------
    public static boolean updateTicket(int ticketId, String subject, String description, String adminNotes,
                                       String status, String priority, String bookingId) {
        try {
            con = DBConnection.getConnection();

            String sql = "UPDATE SupportTicket SET subject=?, description=?, admin_notes=?, status=?, priority=?, booking_id=? WHERE ticket_id=?";
            PreparedStatement ps = con.prepareStatement(sql);

            ps.setString(1, subject);
            ps.setString(2, description);
            ps.setString(3, adminNotes);
            ps.setString(4, status);
            ps.setString(5, priority);
            ps.setString(6, bookingId);
            ps.setInt(7, ticketId);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // ---------- IMAGES ----------
    public static int addImage(int ticketId, byte[] imageBytes) {
        try {
            con = DBConnection.getConnection();

            String sql = "INSERT INTO SupportTicketImage(ticket_id, image_data) VALUES(?, ?)";
            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, ticketId);
            ps.setBytes(2, imageBytes);

            int rows = ps.executeUpdate();
            if (rows > 0) {
                ResultSet keys = ps.getGeneratedKeys();
                if (keys.next()) return keys.getInt(1);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return -1;
    }

    public static byte[] getImage(int imageId) {
        try {
            con = DBConnection.getConnection();

            String sql = "SELECT image_data FROM SupportTicketImage WHERE image_id=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setInt(1, imageId);

            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                return rs.getBytes("image_data");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public static boolean deleteImage(int imageId) {
        try {
            con = DBConnection.getConnection();

            String sql = "DELETE FROM SupportTicketImage WHERE image_id=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setInt(1, imageId);

            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static List<Integer> listImageIds(int ticketId) {
        List<Integer> ids = new ArrayList<>();
        try {
            con = DBConnection.getConnection();

            String sql = "SELECT image_id FROM SupportTicketImage WHERE ticket_id=? ORDER BY created_at DESC";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setInt(1, ticketId);

            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                ids.add(rs.getInt("image_id"));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return ids;
    }
}
