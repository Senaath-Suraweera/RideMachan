package admin.service;

import admin.controller.ChatController;
import admin.model.ChatMessage;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Map;

@WebServlet("/api/chat/*")
public class ChatApiServlet extends HttpServlet {

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");

        String path = req.getPathInfo(); // e.g. /conversations, /messages
        if (path == null) path = "";

        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null) { resp.setStatus(401); out.print("{\"ok\":false,\"error\":\"Not logged in\"}"); return; }

        String actorType = (String) session.getAttribute("actorType");
        Integer actorIdObj = (Integer) session.getAttribute("actorId");
        if (actorType == null || actorIdObj == null) { resp.setStatus(401); out.print("{\"ok\":false,\"error\":\"Not logged in\"}"); return; }

        int actorId = actorIdObj;

        if ("/conversations".equals(path)) {
            List<Map<String, Object>> list = ChatController.listConversations(actorType.toUpperCase(), actorId);

            StringBuilder sb = new StringBuilder();
            sb.append("{\"ok\":true,\"conversations\":[");
            for (int i = 0; i < list.size(); i++) {
                Map<String, Object> c = list.get(i);
                if (i > 0) sb.append(",");
                sb.append("{")
                        .append("\"conversationId\":").append((int)c.get("conversationId")).append(",")
                        .append("\"type\":\"").append(escape((String)c.get("type"))).append("\",")
                        .append("\"title\":\"").append(escape((String)c.get("title"))).append("\",")
                        .append("\"lastMessage\":\"").append(escape((String)c.get("lastMessage"))).append("\",")
                        .append("\"lastTime\":\"").append(escape((String)c.get("lastTime"))).append("\"")
                        .append("}");
            }
            sb.append("]}");
            out.print(sb.toString());
            return;
        }

        if ("/messages".equals(path)) {
            int convId = Integer.parseInt(req.getParameter("conversationId"));
            int limit = Integer.parseInt(req.getParameter("limit") == null ? "50" : req.getParameter("limit"));
            int offset = Integer.parseInt(req.getParameter("offset") == null ? "0" : req.getParameter("offset"));

            List<ChatMessage> msgs = ChatController.getMessages(convId, limit, offset);

            // Note: your controller returns DESC by time; for UI we want oldest->newest
            // easiest is reverse in JS, OR change query. We'll reverse in JS.

            StringBuilder sb = new StringBuilder();
            sb.append("{\"ok\":true,\"messages\":[");
            for (int i = 0; i < msgs.size(); i++) {
                ChatMessage m = msgs.get(i);
                if (i > 0) sb.append(",");
                sb.append("{")
                        .append("\"messageId\":").append(m.getMessageId()).append(",")
                        .append("\"conversationId\":").append(m.getConversationId()).append(",")
                        .append("\"senderType\":\"").append(escape(m.getSenderType())).append("\",")
                        .append("\"senderId\":").append(m.getSenderId()).append(",")
                        .append("\"content\":\"").append(escape(m.getContent())).append("\",")
                        .append("\"sentAt\":\"").append(escape(m.getSentAt())).append("\"")
                        .append("}");
            }
            sb.append("]}");
            out.print(sb.toString());
            return;
        }

        out.print("{\"ok\":false,\"error\":\"Unknown endpoint\"}");
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        String path = req.getPathInfo();
        if (path == null) path = "";

        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null) { resp.setStatus(401); out.print("{\"ok\":false,\"error\":\"Not logged in\"}"); return; }

        String actorType = (String) session.getAttribute("actorType");
        Integer actorIdObj = (Integer) session.getAttribute("actorId");
        if (actorType == null || actorIdObj == null) { resp.setStatus(401); out.print("{\"ok\":false,\"error\":\"Not logged in\"}"); return; }

        int actorId = actorIdObj;


        if ("/direct".equals(path)) {
            String toType = req.getParameter("toType");
            int toId = Integer.parseInt(req.getParameter("toId"));

            int convId = ChatController.createDirectConversation(actorType.toUpperCase(), actorId, toType.toUpperCase(), toId);
            out.print("{\"ok\":true,\"conversationId\":"+convId+"}");
            return;
        }

        if ("/markRead".equals(path)) {
            int convId = Integer.parseInt(req.getParameter("conversationId"));
            int lastMessageId = Integer.parseInt(req.getParameter("lastMessageId"));

            boolean ok = ChatController.markRead(convId, actorType.toUpperCase(), actorId, lastMessageId);
            out.print("{\"ok\":" + ok + "}");
            return;
        }

        out.print("{\"ok\":false,\"error\":\"Unknown endpoint\"}");
    }
}
