package admin.service;

import admin.controller.ChatController;
import admin.model.ChatMessage;
import jakarta.websocket.*;
import jakarta.websocket.server.ServerEndpoint;

import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@ServerEndpoint("/ws/chat/{actorType}/{actorId}")
public class ChatWebSocket {

    // actorKey -> session
    private static final Map<String, Session> online = new ConcurrentHashMap<>();

    private static String key(String actorType, int actorId) {
        return actorType.toUpperCase() + ":" + actorId;
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
            // Expect a simple flat JSON: {"type":"SEND_MESSAGE","conversationId":1,"content":"hi"}
            String type = SimpleJson.getString(messageJson, "type");
            if (!"SEND_MESSAGE".equals(type)) return;

            int conversationId = SimpleJson.getInt(messageJson, "conversationId");
            String content = SimpleJson.getString(messageJson, "content");

            String senderType = actorType.toUpperCase();

            // Security: only participants can send
            if (!ChatController.isParticipant(conversationId, senderType, actorId)) return;

            ChatMessage saved = ChatController.saveMessage(conversationId, senderType, actorId, content);
            if (saved == null) return;

            // Push to all participants online
            List<Map<String, Object>> participants = ChatController.listParticipants(conversationId);

            String payload = SimpleJson.obj(
                    "type", "NEW_MESSAGE",
                    "message", SimpleJson.messageToJson(saved)
            );

            for (Map<String, Object> p : participants) {
                String pType = (String) p.get("actorType");
                int pId = (int) p.get("actorId");

                Session s = online.get(key(pType, pId));
                if (s != null && s.isOpen()) {
                    s.getAsyncRemote().sendText(payload);
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // Tiny helper: no external libraries
    static class SimpleJson {

        static String escape(String s) {
            if (s == null) return "";
            return s.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r");
        }

        // Very small parser for flat JSON with string/int fields only.
        // Works for our controlled payload format.
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
            while (start < json.length() && (json.charAt(start) == ' ')) start++;
            int end = start;
            while (end < json.length() && Character.isDigit(json.charAt(end))) end++;
            return Integer.parseInt(json.substring(start, end));
        }

        // Build JSON object from alternating key/value (value must already be valid JSON for nested objects)
        static String obj(String k1, String v1, String k2, String v2RawJson) {
            return "{"
                    + "\""+escape(k1)+"\":\""+escape(v1)+"\","
                    + "\""+escape(k2)+"\":"+v2RawJson
                    + "}";
        }

        static String messageToJson(ChatMessage m) {
            return "{"
                    + "\"messageId\":" + m.getMessageId() + ","
                    + "\"conversationId\":" + m.getConversationId() + ","
                    + "\"senderType\":\"" + escape(m.getSenderType()) + "\","
                    + "\"senderId\":" + m.getSenderId() + ","
                    + "\"content\":\"" + escape(m.getContent()) + "\","
                    + "\"sentAt\":\"" + escape(m.getSentAt()) + "\""
                    + "}";
        }
    }
}
