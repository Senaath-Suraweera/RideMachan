package admin.service;

import admin.controller.ChatController;
import admin.model.ChatMessage;
import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * WebSocket endpoint for real-time messaging & notification delivery.
 *
 * URL: /ws/chat/{actorType}/{actorId}
 *
 * Inbound message format:
 *   {"type":"SEND_MESSAGE","conversationId":1,"content":"hello"}
 *
 * Outbound message types:
 *   {"type":"NEW_MESSAGE","message":{...}}
 *   {"type":"NOTIFICATION","notification":{...}}
 */
@ServerEndpoint("/ws/chat/{actorType}/{actorId}")
public class ChatWebSocket {

    private static final Map<String, Session> online = new ConcurrentHashMap<>();

    private static String key(String actorType, int actorId) {
        return actorType.toUpperCase() + ":" + actorId;
    }

    // ── Public: push a notification JSON to a specific actor if online ──
    public static void pushToActor(String actorType, int actorId, String jsonPayload) {
        Session s = online.get(key(actorType, actorId));
        if (s != null && s.isOpen()) {
            s.getAsyncRemote().sendText(jsonPayload);
        }
    }

    @OnOpen
    public void onOpen(Session session,
                       @PathParam("actorType") String actorType,
                       @PathParam("actorId") int actorId) {
        online.put(key(actorType, actorId), session);
        System.out.println("WS connected: " + key(actorType, actorId));
    }

    @OnClose
    public void onClose(Session session,
                        @PathParam("actorType") String actorType,
                        @PathParam("actorId") int actorId) {
        online.remove(key(actorType, actorId));
        System.out.println("WS disconnected: " + key(actorType, actorId));
    }

    @OnMessage
    public void onMessage(String messageJson,
                          @PathParam("actorType") String actorType,
                          @PathParam("actorId") int actorId) {
        try {
            String type = SimpleJson.getString(messageJson, "type");
            if (!"SEND_MESSAGE".equals(type)) return;

            int conversationId = SimpleJson.getInt(messageJson, "conversationId");
            String content = SimpleJson.getString(messageJson, "content");
            String senderType = actorType.toUpperCase();

            // Security: must be a participant
            if (!ChatController.isParticipant(conversationId, senderType, actorId)) return;

            // Save message (also creates notifications in controller)
            ChatMessage saved = ChatController.saveMessage(conversationId, senderType, actorId, content);
            if (saved == null) return;

            // Build message payload
            String msgJson = SimpleJson.messageToJson(saved);
            String payload = "{\"type\":\"NEW_MESSAGE\",\"message\":" + msgJson + "}";

            // Push to all online participants
            List<Map<String, Object>> participants = ChatController.listParticipants(conversationId);
            for (Map<String, Object> p : participants) {
                String pType = (String) p.get("actorType");
                int pId = (int) p.get("actorId");
                Session s = online.get(key(pType, pId));
                if (s != null && s.isOpen()) {
                    s.getAsyncRemote().sendText(payload);
                }

                // Also push notification event to non-sender participants
                if (!(pType.equals(senderType) && pId == actorId)) {
                    String notifPayload = "{\"type\":\"NOTIFICATION\",\"notification\":{"
                            + "\"title\":\"New message from " + SimpleJson.escape(saved.getSenderName()) + "\","
                            + "\"body\":\"" + SimpleJson.escape(
                            content.length() > 80 ? content.substring(0, 80) + "..." : content
                    ) + "\","
                            + "\"referenceType\":\"CONVERSATION\","
                            + "\"referenceId\":" + conversationId
                            + "}}";
                    pushToActor(pType, pId, notifPayload);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ── Simple JSON helper (no external libraries) ──
    static class SimpleJson {
        static String escape(String s) {
            if (s == null) return "";
            return s.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r");
        }

        static String getString(String json, String key) {
            String needle = "\"" + key + "\"";
            int i = json.indexOf(needle);
            if (i < 0) return null;
            int colon = json.indexOf(":", i);
            int firstQuote = json.indexOf("\"", colon + 1);
            int secondQuote = json.indexOf("\"", firstQuote + 1);
            if (firstQuote < 0 || secondQuote < 0) return null;
            return json.substring(firstQuote + 1, secondQuote);
        }

        static int getInt(String json, String key) {
            String needle = "\"" + key + "\"";
            int i = json.indexOf(needle);
            if (i < 0) return 0;
            int colon = json.indexOf(":", i);
            int start = colon + 1;
            while (start < json.length() && json.charAt(start) == ' ') start++;
            int end = start;
            while (end < json.length() && Character.isDigit(json.charAt(end))) end++;
            return Integer.parseInt(json.substring(start, end));
        }

        static String messageToJson(ChatMessage m) {
            return "{"
                    + "\"messageId\":" + m.getMessageId() + ","
                    + "\"conversationId\":" + m.getConversationId() + ","
                    + "\"senderType\":\"" + escape(m.getSenderType()) + "\","
                    + "\"senderId\":" + m.getSenderId() + ","
                    + "\"senderName\":\"" + escape(m.getSenderName()) + "\","
                    + "\"content\":\"" + escape(m.getContent()) + "\","
                    + "\"sentAt\":\"" + escape(m.getSentAt()) + "\""
                    + "}";
        }
    }
}