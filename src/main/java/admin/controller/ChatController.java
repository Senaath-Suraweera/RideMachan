package admin.controller;

import admin.model.ChatMessage;
import admin.model.Notification;
import common.util.DBConnection;

import java.sql.*;
import java.util.*;

/**
 * ChatController – updated for RideMachan multi-actor messaging.
 *
 * KEY CHANGES from original:
 *   1. canMessage(fromType, toType) – checks the MessagingPermission table.
 *   2. getAllowedTargetTypes(actorType) – returns the list of types this actor can message.
 *   3. resolveActorName(type, id) – fetches human-readable name from the correct table.
 *   4. listUsersOfType(type) – returns {id, name} pairs for the "New Conversation" modal.
 *   5. createNotification() – inserts into Notification table when a message is sent.
 *   6. listConversations() now includes the OTHER participant's name for DIRECT chats.
 */
public class ChatController {

    private static Connection con;

    // ──────────────────────────────────────────────────────────
    // Permission helpers
    // ──────────────────────────────────────────────────────────

    /** Check if fromType is allowed to message toType. */
    public static boolean canMessage(String fromType, String toType) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "SELECT 1 FROM MessagingPermission WHERE from_actor_type=? AND to_actor_type=? LIMIT 1"
            );
            ps.setString(1, fromType.toUpperCase());
            ps.setString(2, toType.toUpperCase());
            return ps.executeQuery().next();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /** Return all actor types this actor is allowed to message. */
    public static List<String> getAllowedTargetTypes(String actorType) {
        List<String> types = new ArrayList<>();
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "SELECT to_actor_type FROM MessagingPermission WHERE from_actor_type=?"
            );
            ps.setString(1, actorType.toUpperCase());
            ResultSet rs = ps.executeQuery();
            while (rs.next()) types.add(rs.getString(1));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return types;
    }

    // ──────────────────────────────────────────────────────────
    // Actor name resolution
    // ──────────────────────────────────────────────────────────

    /** Resolve a human-friendly display name for any actor. */
    public static String resolveActorName(String actorType, int actorId) {
        try {
            con = DBConnection.getConnection();
            String sql;
            switch (actorType.toUpperCase()) {
                case "ADMIN":
                    sql = "SELECT username AS name FROM Admin WHERE adminid=?";
                    break;
                case "CUSTOMER":
                    sql = "SELECT CONCAT(firstname,' ',lastname) AS name FROM Customer WHERE customerid=?";
                    break;
                case "DRIVER":
                    sql = "SELECT CONCAT(firstname,' ',lastname) AS name FROM Driver WHERE driverid=?";
                    break;
                case "COMPANY":
                    sql = "SELECT companyname AS name FROM RentalCompany WHERE companyid=?";
                    break;
                case "MAINTENANCE":
                    sql = "SELECT CONCAT(firstname,' ',lastname) AS name FROM MaintenanceStaff WHERE maintenanceid=?";
                    break;
                case "PROVIDER":
                    sql = "SELECT CONCAT(firstname,' ',lastname) AS name FROM VehicleProvider WHERE providerid=?";
                    break;
                default:
                    return actorType + " #" + actorId;
            }
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setInt(1, actorId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                String name = rs.getString("name");
                if (name != null && !name.trim().isEmpty()) return name.trim();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return actorType + " #" + actorId;
    }

    /** List all users of a given type (for "New Conversation" modal dropdown). */
    public static List<Map<String, Object>> listUsersOfType(String actorType) {
        List<Map<String, Object>> list = new ArrayList<>();
        try {
            con = DBConnection.getConnection();
            String sql;
            switch (actorType.toUpperCase()) {
                case "ADMIN":
                    sql = "SELECT adminid AS id, username AS name FROM Admin WHERE active=1";
                    break;
                case "CUSTOMER":
                    sql = "SELECT customerid AS id, CONCAT(firstname,' ',lastname) AS name FROM Customer WHERE active=1";
                    break;
                case "DRIVER":
                    sql = "SELECT driverid AS id, CONCAT(firstname,' ',lastname) AS name FROM Driver WHERE active=1";
                    break;
                case "COMPANY":
                    sql = "SELECT companyid AS id, companyname AS name FROM RentalCompany";
                    break;
                case "MAINTENANCE":
                    sql = "SELECT maintenanceid AS id, CONCAT(firstname,' ',lastname) AS name FROM MaintenanceStaff";
                    break;
                case "PROVIDER":
                    sql = "SELECT providerid AS id, CONCAT(firstname,' ',lastname) AS name FROM VehicleProvider WHERE status='active'";
                    break;
                default:
                    return list;
            }
            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", rs.getInt("id"));
                m.put("name", rs.getString("name"));
                list.add(m);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    // ──────────────────────────────────────────────────────────
    // Conversation CRUD  (mostly unchanged; title enrichment added)
    // ──────────────────────────────────────────────────────────

    /** Create a direct (1-to-1) conversation. Returns -1 on failure, -2 if not permitted. */
    public static int createDirectConversation(String aType, int aId, String bType, int bId) {
        // ── PERMISSION CHECK ──
        if (!canMessage(aType, bType)) return -2;

        try {
            con = DBConnection.getConnection();

            Integer existing = findDirectConversation(aType, aId, bType, bId);
            if (existing != null) return existing;

            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO Conversation(type) VALUES('DIRECT')",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.executeUpdate();
            ResultSet keys = ps.getGeneratedKeys();
            if (!keys.next()) return -1;
            int convId = keys.getInt(1);

            addParticipant(convId, aType, aId);
            addParticipant(convId, bType, bId);

            return convId;
        } catch (Exception e) {
            e.printStackTrace();
            return -1;
        }
    }

    private static Integer findDirectConversation(String aType, int aId, String bType, int bId) {
        try {
            con = DBConnection.getConnection();
            String sql =
                    "SELECT c.conversation_id " +
                            "FROM Conversation c " +
                            "JOIN ConversationParticipant p1 ON c.conversation_id=p1.conversation_id " +
                            "JOIN ConversationParticipant p2 ON c.conversation_id=p2.conversation_id " +
                            "WHERE c.type='DIRECT' " +
                            "AND p1.actor_type=? AND p1.actor_id=? " +
                            "AND p2.actor_type=? AND p2.actor_id=? " +
                            "LIMIT 1";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, aType);  ps.setInt(2, aId);
            ps.setString(3, bType);  ps.setInt(4, bId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt(1);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public static boolean addParticipant(int convId, String type, int id) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "INSERT IGNORE INTO ConversationParticipant(conversation_id, actor_type, actor_id) VALUES(?,?,?)"
            );
            ps.setInt(1, convId);
            ps.setString(2, type);
            ps.setInt(3, id);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * List conversations with enriched titles.
     * For DIRECT chats the title is resolved to the OTHER participant's name.
     */
    public static List<Map<String, Object>> listConversations(String actorType, int actorId) {
        List<Map<String, Object>> list = new ArrayList<>();
        try {
            con = DBConnection.getConnection();
            String sql =
                    "SELECT c.conversation_id, c.type, c.title, c.created_at, " +
                            "  (SELECT m.content FROM Message m WHERE m.conversation_id=c.conversation_id ORDER BY m.sent_at DESC LIMIT 1) AS last_message, " +
                            "  (SELECT m.sent_at  FROM Message m WHERE m.conversation_id=c.conversation_id ORDER BY m.sent_at DESC LIMIT 1) AS last_time, " +
                            "  (SELECT COUNT(*) FROM Message m2 " +
                            "     WHERE m2.conversation_id=c.conversation_id " +
                            "       AND m2.message_id > COALESCE(p.last_read_message_id,0)) AS unread_count " +
                            "FROM Conversation c " +
                            "JOIN ConversationParticipant p ON c.conversation_id=p.conversation_id " +
                            "WHERE p.actor_type=? AND p.actor_id=? " +
                            "ORDER BY COALESCE(last_time, c.created_at) DESC";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, actorType);
            ps.setInt(2, actorId);
            ResultSet rs = ps.executeQuery();

            while (rs.next()) {
                Map<String, Object> m = new HashMap<>();
                int convId = rs.getInt("conversation_id");
                m.put("conversationId", convId);
                m.put("type", rs.getString("type"));
                m.put("lastMessage", rs.getString("last_message"));
                m.put("lastTime", String.valueOf(rs.getTimestamp("last_time")));
                m.put("unreadCount", rs.getInt("unread_count"));

                // Title: for DIRECT chats, resolve the OTHER participant's name
                String title = rs.getString("title");
                if ("DIRECT".equals(rs.getString("type"))) {
                    title = resolveOtherParticipantName(convId, actorType, actorId);
                }
                m.put("title", title != null ? title : "Conversation");

                // Also include the other party's type for badge display
                Map<String, Object> other = getOtherParticipant(convId, actorType, actorId);
                if (other != null) {
                    m.put("otherType", other.get("actorType"));
                    m.put("otherId", other.get("actorId"));
                }

                list.add(m);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    /** Resolve the other participant's display name in a DIRECT conversation. */
    private static String resolveOtherParticipantName(int convId, String myType, int myId) {
        Map<String, Object> other = getOtherParticipant(convId, myType, myId);
        if (other == null) return "Unknown";
        return resolveActorName((String) other.get("actorType"), (int) other.get("actorId"));
    }

    private static Map<String, Object> getOtherParticipant(int convId, String myType, int myId) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "SELECT actor_type, actor_id FROM ConversationParticipant " +
                            "WHERE conversation_id=? AND NOT (actor_type=? AND actor_id=?) LIMIT 1"
            );
            ps.setInt(1, convId);
            ps.setString(2, myType);
            ps.setInt(3, myId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                Map<String, Object> m = new HashMap<>();
                m.put("actorType", rs.getString("actor_type"));
                m.put("actorId", rs.getInt("actor_id"));
                return m;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    // ──────────────────────────────────────────────────────────
    // Message CRUD
    // ──────────────────────────────────────────────────────────

    public static ChatMessage saveMessage(int convId, String senderType, int senderId, String content) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO Message(conversation_id, sender_type, sender_id, content) VALUES(?,?,?,?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setInt(1, convId);
            ps.setString(2, senderType);
            ps.setInt(3, senderId);
            ps.setString(4, content);

            if (ps.executeUpdate() <= 0) return null;
            ResultSet keys = ps.getGeneratedKeys();
            if (!keys.next()) return null;
            int msgId = keys.getInt(1);

            PreparedStatement ps2 = con.prepareStatement("SELECT sent_at FROM Message WHERE message_id=?");
            ps2.setInt(1, msgId);
            ResultSet rs = ps2.executeQuery();
            String sentAt = null;
            if (rs.next()) sentAt = String.valueOf(rs.getTimestamp("sent_at"));

            ChatMessage msg = new ChatMessage();
            msg.setMessageId(msgId);
            msg.setConversationId(convId);
            msg.setSenderType(senderType);
            msg.setSenderId(senderId);
            msg.setContent(content);
            msg.setSentAt(sentAt);
            msg.setSenderName(resolveActorName(senderType, senderId));

            // ── CREATE NOTIFICATION for all OTHER participants ──
            String senderName = msg.getSenderName();
            List<Map<String, Object>> participants = listParticipants(convId);
            for (Map<String, Object> p : participants) {
                String pType = (String) p.get("actorType");
                int pId = (int) p.get("actorId");
                if (pType.equals(senderType) && pId == senderId) continue; // skip sender
                createNotification(pType, pId, "NEW_MESSAGE",
                        "New message from " + senderName,
                        content.length() > 100 ? content.substring(0, 100) + "..." : content,
                        "CONVERSATION", convId);
            }

            return msg;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public static List<ChatMessage> getMessages(int convId, int limit, int offset) {
        List<ChatMessage> list = new ArrayList<>();
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "SELECT message_id, conversation_id, sender_type, sender_id, content, sent_at " +
                            "FROM Message WHERE conversation_id=? ORDER BY sent_at DESC LIMIT ? OFFSET ?"
            );
            ps.setInt(1, convId);
            ps.setInt(2, limit);
            ps.setInt(3, offset);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                ChatMessage m = new ChatMessage();
                m.setMessageId(rs.getInt("message_id"));
                m.setConversationId(rs.getInt("conversation_id"));
                m.setSenderType(rs.getString("sender_type"));
                m.setSenderId(rs.getInt("sender_id"));
                m.setContent(rs.getString("content"));
                m.setSentAt(String.valueOf(rs.getTimestamp("sent_at")));
                m.setSenderName(resolveActorName(m.getSenderType(), m.getSenderId()));
                list.add(m);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public static boolean markRead(int convId, String actorType, int actorId, int lastMessageId) {
        try {
            con = DBConnection.getConnection();

            // Mark conversation read
            PreparedStatement ps = con.prepareStatement(
                    "UPDATE ConversationParticipant SET last_read_message_id=? " +
                            "WHERE conversation_id=? AND actor_type=? AND actor_id=?"
            );
            ps.setInt(1, lastMessageId);
            ps.setInt(2, convId);
            ps.setString(3, actorType);
            ps.setInt(4, actorId);
            ps.executeUpdate();

            // Also mark related notifications as read
            PreparedStatement ps2 = con.prepareStatement(
                    "UPDATE Notification SET is_read=TRUE " +
                            "WHERE recipient_type=? AND recipient_id=? AND reference_type='CONVERSATION' AND reference_id=?"
            );
            ps2.setString(1, actorType);
            ps2.setInt(2, actorId);
            ps2.setInt(3, convId);
            ps2.executeUpdate();

            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean isParticipant(int convId, String actorType, int actorId) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "SELECT 1 FROM ConversationParticipant WHERE conversation_id=? AND actor_type=? AND actor_id=? LIMIT 1"
            );
            ps.setInt(1, convId);
            ps.setString(2, actorType);
            ps.setInt(3, actorId);
            return ps.executeQuery().next();
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static List<Map<String, Object>> listParticipants(int convId) {
        List<Map<String, Object>> list = new ArrayList<>();
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "SELECT actor_type, actor_id FROM ConversationParticipant WHERE conversation_id=?"
            );
            ps.setInt(1, convId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Map<String, Object> m = new HashMap<>();
                m.put("actorType", rs.getString("actor_type"));
                m.put("actorId", rs.getInt("actor_id"));
                list.add(m);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    // ──────────────────────────────────────────────────────────
    // Notification CRUD
    // ──────────────────────────────────────────────────────────

    public static void createNotification(String recipientType, int recipientId,
                                          String type, String title, String body,
                                          String referenceType, int referenceId) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO Notification(recipient_type, recipient_id, type, title, body, reference_type, reference_id) " +
                            "VALUES(?,?,?,?,?,?,?)"
            );
            ps.setString(1, recipientType);
            ps.setInt(2, recipientId);
            ps.setString(3, type);
            ps.setString(4, title);
            ps.setString(5, body);
            ps.setString(6, referenceType);
            ps.setInt(7, referenceId);
            ps.executeUpdate();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static List<Notification> getNotifications(String actorType, int actorId, int limit, int offset) {
        List<Notification> list = new ArrayList<>();
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "SELECT * FROM Notification WHERE recipient_type=? AND recipient_id=? " +
                            "ORDER BY created_at DESC LIMIT ? OFFSET ?"
            );
            ps.setString(1, actorType);
            ps.setInt(2, actorId);
            ps.setInt(3, limit);
            ps.setInt(4, offset);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Notification n = new Notification();
                n.setNotificationId(rs.getInt("notification_id"));
                n.setRecipientType(rs.getString("recipient_type"));
                n.setRecipientId(rs.getInt("recipient_id"));
                n.setType(rs.getString("type"));
                n.setTitle(rs.getString("title"));
                n.setBody(rs.getString("body"));
                n.setReferenceType(rs.getString("reference_type"));
                n.setReferenceId(rs.getInt("reference_id"));
                n.setRead(rs.getBoolean("is_read"));
                n.setCreatedAt(String.valueOf(rs.getTimestamp("created_at")));
                list.add(n);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    public static int getUnreadNotificationCount(String actorType, int actorId) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "SELECT COUNT(*) FROM Notification WHERE recipient_type=? AND recipient_id=? AND is_read=FALSE"
            );
            ps.setString(1, actorType);
            ps.setInt(2, actorId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getInt(1);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return 0;
    }

    public static boolean markNotificationRead(int notificationId, String actorType, int actorId) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "UPDATE Notification SET is_read=TRUE WHERE notification_id=? AND recipient_type=? AND recipient_id=?"
            );
            ps.setInt(1, notificationId);
            ps.setString(2, actorType);
            ps.setInt(3, actorId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static boolean markAllNotificationsRead(String actorType, int actorId) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "UPDATE Notification SET is_read=TRUE WHERE recipient_type=? AND recipient_id=? AND is_read=FALSE"
            );
            ps.setString(1, actorType);
            ps.setInt(2, actorId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}