package admin.service;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/api/session")
public class SessionInfoServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        resp.setContentType("application/json;charset=UTF-8");
        HttpSession session = req.getSession(false);

        if (session != null
                && session.getAttribute("actorType") != null
                && session.getAttribute("actorId") != null) {
            String actorType = (String) session.getAttribute("actorType");
            int actorId = (int) session.getAttribute("actorId");
            resp.getWriter().write("{\"actorType\":\"" + actorType
                    + "\",\"actorId\":" + actorId + "}");
        } else {
            resp.setStatus(401);
            resp.getWriter().write("{\"error\":\"Not logged in\"}");
        }
    }
}