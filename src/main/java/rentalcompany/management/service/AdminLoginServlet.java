package admin.service;

import admin.model.Admin;
import admin.controller.AdminController;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet(name = "AdminLogin", urlPatterns = {"/admin" , "/admin/login"})
public class AdminLoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String email = request.getParameter("email");
        String password = request.getParameter("password");

        AdminController adminController = new AdminController();
        Admin admin = adminController.getAdminByEmail(email);

        if (admin != null) {
            boolean isValid = adminController.verifyPassword(password, admin.getHashedPassword(), admin.getSalt());

            if (isValid) {
                HttpSession session = request.getSession();
                session.setAttribute("admin", admin);
                response.sendRedirect("/views/admin/dashboard.html");
                return;
            }
        }

        request.setAttribute("error", "Invalid email or password");
        request.getRequestDispatcher("/views/admin/login.html").forward(request, response);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        response.sendRedirect(request.getContextPath() + "/views/admin/login.html");
    }
}