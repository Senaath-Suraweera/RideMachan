package rentalcompany.management.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.io.PrintWriter;


@WebServlet("/checklogin")
public class CheckLoginServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // Set response type to JSON
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();

        // Get existing session, do NOT create a new one
        HttpSession session = request.getSession(false);

        if (session != null && session.getAttribute("rentalcompany") != null) {
            out.println("{\"loggedIn\":true}");
        } else {
            out.println("{\"loggedIn\":false}");
        }


    }
}