package rentalcompany.drivers.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.drivers.controller.DriverDAO;
import rentalcompany.drivers.model.Driver;

import java.io.IOException;
import java.io.InputStream;

@WebServlet("/driver/add")
@MultipartConfig(maxFileSize = 16177215) // 16MB
public class AddDriverServlet extends HttpServlet {

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        request.setCharacterEncoding("UTF-8");

        try {



        }catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }


    }

}
