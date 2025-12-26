package rentalcompany.drivers.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;

import rentalcompany.drivers.controller.TestAddDriverDAO;
import rentalcompany.drivers.model.TestDriver;


@WebServlet("/driver/add")
public class TestAddDriverServlet extends HttpServlet {

    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        request.setCharacterEncoding("UTF-8");


        try {

            String username = request.getParameter("username");
            String email = request.getParameter("email");

            TestDriver driver = new TestDriver(username,email);

            TestAddDriverDAO.insertDriver(driver);

        }catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }


    }

}
