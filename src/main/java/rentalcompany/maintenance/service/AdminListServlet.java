package admin.service;

import admin.controller.AdminController;
import admin.model.Admin;
import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@WebServlet(name = "AdminList", urlPatterns = "/admin/list")
public class AdminListServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        List<Admin> admins = AdminController.getAllAdmins();


        Gson gson = new Gson();
        String json = gson.toJson(Map.of("admins", admins));

        response.getWriter().write(json);
    }
}	