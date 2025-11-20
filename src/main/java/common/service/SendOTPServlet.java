package common.service;

import common.util.GmailSender;
import common.util.Util;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/verify")
public class SendOTPServlet extends HttpServlet {

    boolean verified = false;

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {

        req.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json;charset=UTF-8");
        HttpSession session = req.getSession();
        String email = (String) session.getAttribute("email");

        if (email == null)
        {
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"No email address\"}");
            return;
        }

        Util.generateCode(email);

        System.out.printf("Email: %s\n", email);
        System.out.printf("Code: %s\n", Util.getCode(email));

        GmailSender.sendEmail(email, "verification code", Util.getCode(email));


        resp.getWriter().write("{\"status\":\"success\",\"message\":\"OTP sent successful\"}");
    }



}
