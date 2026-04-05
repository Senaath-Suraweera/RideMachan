package admin.service;

import admin.controller.ChatController;
import admin.model.ChatMessage;
import admin.model.Notification;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

/**
 * REST API for the messaging & notification system.
 *
 * ENDPOINTS (GET):
 *   /api/chat/conversations          – list my conversations
 *   /api/chat/messages?conversationId=&limit=&offset=  – message history
 *   /api/chat/allowedTypes           – which actor types can I message?
 *   /api/chat/users?type=DRIVER      – list users of a given type
 *   /api/chat/notifications?limit=&offset=  – my notifications
 *   /api/chat/notifications/count    – unread notification count
 *
 * ENDPOINTS (POST):
 *   /api/chat/direct                 – create / open a direct conversation
 *   /api/chat/markRead               – mark conversation read
 *   /api/chat/notifications/read     – mark one notification read
 *   /api/chat/notifications/readAll  – mark all notifications read
 */
@WebServlet("/api/chat/*")
public class ChatApiServlet extends HttpServlet {

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    // ── Auth helper ──
    private int[] getActor(HttpServletRequest req, HttpServletResponse resp, PrintWriter out) throws IOException {
        HttpSession session = req.getSession(false);
        if (session == null) { resp.setStatus(401); out.print("{\"ok\":false,\"error\":\"Not logged in\"}"); return null; }
        String actorType = (String) session.getAttribute("actorType");
        Integer actorIdObj = (Integer) session.getAttribute("actorId");
        if (actorType == null || actorIdObj == null) { resp.setStatus(401); out.print("{\"ok\":false,\"error\":\"Not logged in\"}"); return null; }
        // store type as index-0 trick: we pass actorType via a side channel
        req.setAttribute("_actorType", actorType);
        return new int[]{ actorIdObj };
    }

    // ───────────────────── GET ─────────────────────

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        int[] actor = getActor(req, resp, out);
        if (actor == null) return;
        String actorType = (String) req.getAttribute("_actorType");
        int actorId = actor[0];

        String path = req.getPathInfo();
        if (path == null) path = "";

        // ── Conversations ──
        if ("/conversations".equals(path)) {
            List<Map<String, Object>> list = ChatController.listConversations(actorType.toUpperCase(), actorId);
            StringBuilder sb = new StringBuilder("{\"ok\":true,\"conversations\":[");
            for (int i = 0; i < list.size(); i++) {
                Map<String, Object> c = list.get(i);
                if (i > 0) sb.append(",");
                sb.append("{")
                        .append("\"conversationId\":").append((int)c.get("conversationId")).append(",")
                        .append("\"type\":\"").append(escape((String)c.get("type"))).append("\",")
                        .append("\"title\":\"").append(escape((String)c.get("title"))).append("\",")
                        .append("\"lastMessage\":\"").append(escape((String)c.get("lastMessage"))).append("\",")
                        .append("\"lastTime\":\"").append(escape((String)c.get("lastTime"))).append("\",")
                        .append("\"unreadCount\":").append((int)c.get("unreadCount"));

                if (c.get("otherType") != null) {
                    sb.append(",\"otherType\":\"").append(escape((String)c.get("otherType"))).append("\"");
                    sb.append(",\"otherId\":").append((int)c.get("otherId"));
                }
                sb.append("}");
            }
            sb.append("]}");
            out.print(sb);
            return;
        }

        // ── Messages ──
        if ("/messages".equals(path)) {
            int convId = Integer.parseInt(req.getParameter("conversationId"));
            int limit  = parseIntOrDefault(req.getParameter("limit"), 50);
            int offset = parseIntOrDefault(req.getParameter("offset"), 0);

            List<ChatMessage> msgs = ChatController.getMessages(convId, limit, offset);
            StringBuilder sb = new StringBuilder("{\"ok\":true,\"messages\":[");
            for (int i = 0; i < msgs.size(); i++) {
                ChatMessage m = msgs.get(i);
                if (i > 0) sb.append(",");
                sb.append("{")
                        .append("\"messageId\":").append(m.getMessageId()).append(",")
                        .append("\"conversationId\":").append(m.getConversationId()).append(",")
                        .append("\"senderType\":\"").append(escape(m.getSenderType())).append("\",")
                        .append("\"senderId\":").append(m.getSenderId()).append(",")
                        .append("\"senderName\":\"").append(escape(m.getSenderName())).append("\",")
                        .append("\"content\":\"").append(escape(m.getContent())).append("\",")
                        .append("\"sentAt\":\"").append(escape(m.getSentAt())).append("\"")
                        .append("}");
            }
            sb.append("]}");
            out.print(sb);
            return;
        }

        // ── Allowed target types ──
        if ("/allowedTypes".equals(path)) {
            List<String> types = ChatController.getAllowedTargetTypes(actorType.toUpperCase());
            StringBuilder sb = new StringBuilder("{\"ok\":true,\"types\":[");
            for (int i = 0; i < types.size(); i++) {
                if (i > 0) sb.append(",");
                sb.append("\"").append(escape(types.get(i))).append("\"");
            }
            sb.append("]}");
            out.print(sb);
            return;
        }

        // ── Users list for a given type ──
        if ("/users".equals(path)) {
            String type = req.getParameter("type");
            if (type == null || type.isEmpty()) { out.print("{\"ok\":false,\"error\":\"type required\"}"); return; }

            // Check permission first
            if (!ChatController.canMessage(actorType.toUpperCase(), type.toUpperCase())) {
                resp.setStatus(403);
                out.print("{\"ok\":false,\"error\":\"Not allowed to message this user type\"}");
                return;
            }

            List<Map<String, Object>> users = ChatController.listUsersOfType(type.toUpperCase());
            StringBuilder sb = new StringBuilder("{\"ok\":true,\"users\":[");
            for (int i = 0; i < users.size(); i++) {
                Map<String, Object> u = users.get(i);
                if (i > 0) sb.append(",");
                sb.append("{\"id\":").append((int)u.get("id"))
                        .append(",\"name\":\"").append(escape((String)u.get("name"))).append("\"}");
            }
            sb.append("]}");
            out.print(sb);
            return;
        }

        // ── Notifications ──
        if ("/notifications".equals(path)) {
            int limit  = parseIntOrDefault(req.getParameter("limit"), 20);
            int offset = parseIntOrDefault(req.getParameter("offset"), 0);
            List<Notification> notifs = ChatController.getNotifications(actorType.toUpperCase(), actorId, limit, offset);
            StringBuilder sb = new StringBuilder("{\"ok\":true,\"notifications\":[");
            for (int i = 0; i < notifs.size(); i++) {
                Notification n = notifs.get(i);
                if (i > 0) sb.append(",");
                sb.append("{")
                        .append("\"notificationId\":").append(n.getNotificationId()).append(",")
                        .append("\"type\":\"").append(escape(n.getType())).append("\",")
                        .append("\"title\":\"").append(escape(n.getTitle())).append("\",")
                        .append("\"body\":\"").append(escape(n.getBody())).append("\",")
                        .append("\"referenceType\":\"").append(escape(n.getReferenceType())).append("\",")
                        .append("\"referenceId\":").append(n.getReferenceId()).append(",")
                        .append("\"isRead\":").append(n.isRead()).append(",")
                        .append("\"createdAt\":\"").append(escape(n.getCreatedAt())).append("\"")
                        .append("}");
            }
            sb.append("]}");
            out.print(sb);
            return;
        }

        if ("/notifications/count".equals(path)) {
            int count = ChatController.getUnreadNotificationCount(actorType.toUpperCase(), actorId);
            out.print("{\"ok\":true,\"count\":" + count + "}");
            return;
        }

        out.print("{\"ok\":false,\"error\":\"Unknown endpoint\"}");
    }

    // ───────────────────── POST ─────────────────────

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        PrintWriter out = resp.getWriter();

        int[] actor = getActor(req, resp, out);
        if (actor == null) return;
        String actorType = (String) req.getAttribute("_actorType");
        int actorId = actor[0];

        String path = req.getPathInfo();
        if (path == null) path = "";

        // ── Create direct conversation ──
        if ("/direct".equals(path)) {
            String toType = req.getParameter("toType");
            int toId = Integer.parseInt(req.getParameter("toId"));

            int convId = ChatController.createDirectConversation(actorType.toUpperCase(), actorId, toType.toUpperCase(), toId);
            if (convId == -2) {
                resp.setStatus(403);
                out.print("{\"ok\":false,\"error\":\"You are not allowed to message this user type\"}");
                return;
            }
            if (convId < 0) {
                resp.setStatus(500);
                out.print("{\"ok\":false,\"error\":\"Failed to create conversation\"}");
                return;
            }
            out.print("{\"ok\":true,\"conversationId\":" + convId + "}");
            return;
        }

        // ── Mark read ──
        if ("/markRead".equals(path)) {
            int convId = Integer.parseInt(req.getParameter("conversationId"));
            int lastMessageId = Integer.parseInt(req.getParameter("lastMessageId"));
            boolean ok = ChatController.markRead(convId, actorType.toUpperCase(), actorId, lastMessageId);
            out.print("{\"ok\":" + ok + "}");
            return;
        }

        // ── Mark single notification read ──
        if ("/notifications/read".equals(path)) {
            int notifId = Integer.parseInt(req.getParameter("notificationId"));
            boolean ok = ChatController.markNotificationRead(notifId, actorType.toUpperCase(), actorId);
            out.print("{\"ok\":" + ok + "}");
            return;
        }

        // ── Mark all notifications read ──
        if ("/notifications/readAll".equals(path)) {
            boolean ok = ChatController.markAllNotificationsRead(actorType.toUpperCase(), actorId);
            out.print("{\"ok\":" + ok + "}");
            return;
        }

        out.print("{\"ok\":false,\"error\":\"Unknown endpoint\"}");
    }

    private int parseIntOrDefault(String s, int def) {
        if (s == null || s.isEmpty()) return def;
        try { return Integer.parseInt(s); } catch (Exception e) { return def; }
    }
}