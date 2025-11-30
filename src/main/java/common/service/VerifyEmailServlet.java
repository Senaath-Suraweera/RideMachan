package common.service;

import common.util.Util;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@WebServlet("/code")
public class VerifyEmailServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {

        req.setCharacterEncoding("UTF-8");
        res.setContentType("application/json;charset=UTF-8");

        HttpSession session = req.getSession();
        String email = (String) session.getAttribute("email");

        if(email == null)
        {
            res.getWriter().write("{\"status\":\"error\",\"message\":\"No email in session\"}");
            return;
        }

        System.out.println("Session email from verify email servlet: " + email);
        String code = req.getParameter("code");

        String generatedCode = Util.getCode(email);

        HttpSession httpSession = req.getSession();

        Util.getAllCodes();
        if(code.equals(generatedCode)) {
            session.setAttribute("verified", true);
            res.getWriter().write("{\"status\":\"success\",\"message\":\"verified\"}");
//            SessionFactory.redirectUser(session , req , res);
        }else{
            session.setAttribute("verified", false);
            res.getWriter().write("{\"status\":\"error\",\"message\":\"incorrect code\"}");
        }
    }
}