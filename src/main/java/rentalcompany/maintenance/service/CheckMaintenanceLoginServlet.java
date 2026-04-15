package rentalcompany.maintenance.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;


@WebServlet("/check/login/maintenance")
public class CheckMaintenanceLoginServlet extends HttpServlet{

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();

        // Get existing session, do NOT create a new one
        HttpSession session = request.getSession(false);

        if (session != null && session.getAttribute("staff_id") != null) {
            int staffId = (int) session.getAttribute("staff_id");

            out.print("{\"loggedIn\":true,\"staffId\":" + staffId + "}");
        } else {
            out.println("{\"loggedIn\":false}");
        }


    }

}













