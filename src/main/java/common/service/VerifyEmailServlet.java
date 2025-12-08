package common.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import common.util.Util;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/code")
public class VerifyEmailServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res)
            throws IOException, ServletException {

        System.out.println("VerifyEmailServlet");

        req.setCharacterEncoding("UTF-8");
        res.setContentType("application/json;charset=UTF-8");

        HttpSession session = req.getSession();
        String email = (String) session.getAttribute("email");

        if (email == null) {
            res.getWriter().write("{\"status\":\"error\",\"message\":\"No email in session\"}");
            return;
        }

        System.out.println("Session email from verify email servlet: " + email);

        // Handle both JSON and form-urlencoded
        String code;
        String ct = req.getContentType();
        if (ct != null && ct.toLowerCase().startsWith("application/json")) {
            try (var reader = req.getReader()) {
                JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
                code = json.has("code") ? json.get("code").getAsString() : null;
            }
        } else {
            code = req.getParameter("code");
        }

        if (code == null || code.trim().isEmpty()) {
            res.getWriter().write("{\"status\":\"error\",\"message\":\"No code provided\"}");
            return;
        }

        String generatedCode = Util.getCode(email);

        Util.getAllCodes();

        if (code.equals(generatedCode)) {
            session.setAttribute("verified", true);

            // Don't write response here - SessionFactory will handle it
            SessionFactory.saveToDB(session, req, res);

        } else {
            session.setAttribute("verified", false);
            res.getWriter().write("{\"status\":\"error\",\"message\":\"incorrect code\"}");
        }
    }
}