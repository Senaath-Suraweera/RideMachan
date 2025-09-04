package rentalcompany.management.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import rentalcompany.management.controller.CompanyController;

import java.io.IOException;

@WebServlet(name = "RentalCompany" , urlPatterns = "/rentalcompany/signup")
@MultipartConfig
public class CompanyServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        String ct = request.getContentType();
        String companyname, companyemail, password;

        if (ct != null && ct.toLowerCase().startsWith("application/json")) {
            try (var reader = request.getReader()) {
                JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
                companyname = json.has("username") ? json.get("username").getAsString() : null;
                companyemail = json.has("email")    ? json.get("email").getAsString()    : null;
                password = json.has("password") ? json.get("password").getAsString() : null;
            }
        } else {
            // Works for x-www-form-urlencoded or multipart/form-data
            companyname = request.getParameter("username");
            companyemail    = request.getParameter("email");
            password = request.getParameter("password");
        }

        boolean isTrue;

        isTrue = CompanyController.insertData(companyname, companyemail, password);

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
