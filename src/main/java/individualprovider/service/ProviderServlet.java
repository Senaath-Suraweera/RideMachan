package individualprovider.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import customer.controller.CustomerController;
import individualprovider.controller.ProviderController;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet(name = "Provider" , urlPatterns = "/provider/signup")
public class ProviderServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        String ct = request.getContentType();
        String username, email, password,mobileNumber;

        if (ct != null && ct.toLowerCase().startsWith("application/json")) {
            try (var reader = request.getReader()) {
                JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
                username = json.has("username") ? json.get("username").getAsString() : null;
                email    = json.has("email")    ? json.get("email").getAsString()    : null;
                password = json.has("password") ? json.get("password").getAsString() : null;
                mobileNumber = json.has("mobilenumber") ? json.get("mobilenumber").getAsString() : null;
            }
        } else {
            // Works for x-www-form-urlencoded or multipart/form-data
            username = request.getParameter("username");
            email    = request.getParameter("email");
            password = request.getParameter("password");
            mobileNumber = request.getParameter("mobilenumber");
        }

        boolean isTrue;

        isTrue = ProviderController.insertData(username, email, password);

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
        System.out.println("get from customer servlet");
    }
}
