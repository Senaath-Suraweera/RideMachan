package admin.controller;

import admin.model.ChatMessage;
import common.util.DBConnection;

import java.sql.*;
import java.util.*;

public class ChatController {

    private static Connection con;

    // --- Conversation: Create Direct (two people) ---
    public static int createDirectConversation(String aType, int aId, String bType, int bId) {
        try {
            con = DBConnection.getConnection();

            // If a direct conversation already exists between these two, return it
            Integer existing = findDirectConversation(aType, aId, bType, bId);
            if (existing != null) return existing;

            // Create conversation
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
            // Find a DIRECT conversation that has both participants
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
            ps.setString(1, aType);
            ps.setInt(2, aId);
            ps.setString(3, bType);
            ps.setInt(4, bId);

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

    // --- List conversations for a user (sidebar) ---
    public static List<Map<String, Object>> listConversations(String actorType, int actorId) {
        List<Map<String, Object>> list = new ArrayList<>();
        try {
            con = DBConnection.getConnection();

            String sql =
                    "SELECT c.conversation_id, c.type, c.title, c.created_at, " +
                            "       (SELECT m.content FROM Message m WHERE m.conversation_id=c.conversation_id ORDER BY m.sent_at DESC LIMIT 1) AS last_message, " +
                            "       (SELECT m.sent_at  FROM Message m WHERE m.conversation_id=c.conversation_id ORDER BY m.sent_at DESC LIMIT 1) AS last_time " +
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
                m.put("conversationId", rs.getInt("conversation_id"));
                m.put("type", rs.getString("type"));
                m.put("title", rs.getString("title"));
                m.put("lastMessage", rs.getString("last_message"));
                m.put("lastTime", String.valueOf(rs.getTimestamp("last_time")));
                list.add(m);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
        return list;
    }

    // --- Message: Save and return message_id ---
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

            int rows = ps.executeUpdate();
            if (rows <= 0) return null;

            ResultSet keys = ps.getGeneratedKeys();
            if (!keys.next()) return null;

            int msgId = keys.getInt(1);

            // Load timestamp
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

            return msg;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    // --- Message history ---
    public static List<ChatMessage> getMessages(int convId, int limit, int offset) {
        List<ChatMessage> list = new ArrayList<>();
        try {
            con = DBConnection.getConnection();

            PreparedStatement ps = con.prepareStatement(
                    "SELECT message_id, conversation_id, sender_type, sender_id, content, sent_at " +
                            "FROM Message WHERE conversation_id=? " +
                            "ORDER BY sent_at DESC LIMIT ? OFFSET ?"
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
            PreparedStatement ps = con.prepareStatement(
                    "UPDATE ConversationParticipant SET last_read_message_id=? " +
                            "WHERE conversation_id=? AND actor_type=? AND actor_id=?"
            );
            ps.setInt(1, lastMessageId);
            ps.setInt(2, convId);
            ps.setString(3, actorType);
            ps.setInt(4, actorId);
            return ps.executeUpdate() > 0;
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
}
