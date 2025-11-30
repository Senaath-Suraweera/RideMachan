package admin.service;

import admin.controller.AdminController;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet(name = "Admin" , urlPatterns = "/admin/signup")
public class AdminServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        String ct = request.getContentType();
        String username, email, password, phoneNumber;

        if (ct != null && ct.toLowerCase().startsWith("application/json")) {
            try (var reader = request.getReader()) {
                JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
                username = json.has("username") ? json.get("username").getAsString() : null;
                email    = json.has("email")    ? json.get("email").getAsString()    : null;
                password = json.has("password") ? json.get("password").getAsString() : null;
                phoneNumber = json.has("phoneNumber") ? json.get("phoneNumber").getAsString() : null;
            }
        } else {
            // Works for x-www-form-urlencoded or multipart/form-data
            username = request.getParameter("username");
            email    = request.getParameter("email");
            password = request.getParameter("password");
            phoneNumber = request.getParameter("phoneNumber");
        }

        boolean isTrue;

        isTrue = AdminController.insertData(username, email, password, phoneNumber);

        if (isTrue) {
            String message = "Data inserted successfully.";
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"success\"}");
        }
        else{
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Failed to insert data\"}");
        }

    }

}