package rentalcompany.drivers.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import jakarta.servlet.RequestDispatcher;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;
import rentalcompany.drivers.controller.DriverController;

import java.io.IOException;
import java.io.InputStream;

@WebServlet(name = "Driver" , urlPatterns = "/rentalcompany/driver/signup")
@MultipartConfig
public class DriverServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        request.setCharacterEncoding("UTF-8");
        String ct = request.getContentType();
        String username, email, password,nicNumber,FirstName,LastName,companyID;
        InputStream nicPdf = null,licencePdf = null;

        if (ct != null && ct.toLowerCase().startsWith("application/json")) {
            try (var reader = request.getReader()) {
                JsonObject json = JsonParser.parseReader(reader).getAsJsonObject();
                username = json.has("username") ? json.get("username").getAsString() : null;
                email    = json.has("email")    ? json.get("email").getAsString()    : null;
                password = json.has("password") ? json.get("password").getAsString() : null;
                nicNumber = json.has("nicnumber") ? json.get("nicnumber").getAsString() : null;
                FirstName = json.has("firstname") ? json.get("firstname").getAsString() : null;
                LastName = json.has("lastname") ? json.get("lastname").getAsString() : null;
                companyID = json.has("company_id") ? json.get("company_id").getAsString() : null;
                Part nicPart = request.getPart("nicPdf");
                Part licencePart = request.getPart("driversLicence");


                nicPdf = nicPart != null ? nicPart.getInputStream() : null;
                licencePdf = licencePart != null ? licencePart.getInputStream() : null;

            }
        } else {
            // Works for x-www-form-urlencoded or multipart/form-data
            username = request.getParameter("username");
            email    = request.getParameter("email");
            password = request.getParameter("password");
            nicNumber = request.getParameter("nicnumber");
            FirstName = request.getParameter("firstname");
            LastName = request.getParameter("lastname");
            companyID = request.getParameter("company_id");
            Part nicPart = request.getPart("nicPdf");
            Part licencePart = request.getPart("driversLicence");


            nicPdf = nicPart != null ? nicPart.getInputStream() : null;
            licencePdf = licencePart != null ? licencePart.getInputStream() : null;
        }

        boolean isTrue;

        isTrue = DriverController.insertData(username, email, password, FirstName, LastName, nicNumber , nicPdf, licencePdf, companyID);

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
