package individualprovider.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;

@WebServlet("/api/provider/me")
public class ProviderMeServlet extends HttpServlet {

    private final Gson gson = new Gson();

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        HttpSession session = req.getSession(false);
        Integer providerId = (session == null) ? null : (Integer) session.getAttribute("providerId");

        JsonObject out = new JsonObject();
        if (providerId == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.addProperty("error", "Not logged in as provider (session providerId missing).");
        } else {
            out.addProperty("providerId", providerId);
        }
        resp.getWriter().write(gson.toJson(out));
    }
}
