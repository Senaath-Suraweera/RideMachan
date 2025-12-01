package common.service;

import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

public class SessionFactory {

    public static void saveToDB(HttpSession session, HttpServletRequest req, HttpServletResponse resp)
            throws IOException, ServletException {

        System.out.println("sessionFactoryServlet");

        String role = (String) session.getAttribute("role");

        if (role == null) {
            resp.setContentType("application/json");
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"No role in session\"}");
            return;
        }

        if (role.equalsIgnoreCase("customer")) {
            resp.sendRedirect(req.getContextPath() + "/views/customer/pages/home.html");
        }
        else if (role.equalsIgnoreCase("admin")) {
            // Remove context path from RequestDispatcher
            RequestDispatcher rd = req.getRequestDispatcher("/admin/save");
            rd.forward(req, resp);
        }
    }
}