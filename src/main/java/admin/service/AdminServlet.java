package admin.service;

import admin.controller.AdminController;
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
        String username, email, password;

        if (ct != null && ct.toLowerCase().startsWith("application/json")) {
            try (var reader = request.getReader()) {
                JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
                username = json.has("username") ? json.get("username").getAsString() : null;
                email    = json.has("email")    ? json.get("email").getAsString()    : null;
                password = json.has("password") ? json.get("password").getAsString() : null;
            }
        } else {
            // Works for x-www-form-urlencoded or multipart/form-data
            username = request.getParameter("username");
            email    = request.getParameter("email");
            password = request.getParameter("password");
        }

        boolean isTrue;

        isTrue = AdminController.insertData(username, email, password);

        if (isTrue) {
            String message = "Data inserted successfully.";
            response.getWriter().println("<script>alert('"+message+"'); window.location.href='done.jsp'</script>");
        }
        else{
            RequestDispatcher dispatcher = request.getRequestDispatcher("wrong.jsp");
            dispatcher.forward(request, response);
        }

    }

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        System.out.println("get from admin servlet");
    }
}
