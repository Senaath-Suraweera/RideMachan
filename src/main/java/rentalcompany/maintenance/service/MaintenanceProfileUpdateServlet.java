package rentalcompany.maintenance.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;

import rentalcompany.maintenance.controller.MaintenanceStaffDAO;


@WebServlet("/update/maintenance/profile")
public class MaintenanceProfileUpdateServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {


        HttpSession session = request.getSession(false);

        if(session == null || session.getAttribute("staff_id") == null) {
            String requestedPage = request.getRequestURI();
            response.sendRedirect(request.getContextPath() + "/maintenance.html?redirect=" + requestedPage);
            return;
        }

        int staffId = (int) session.getAttribute("staff_id");


        String firstname = request.getParameter("firstname");
        String lastname = request.getParameter("lastname");
        String phone = request.getParameter("phone");
        String email = request.getParameter("email");


        boolean updated = false;


        updated = MaintenanceStaffDAO.updateMaintenanceProfile(staffId, firstname, lastname, phone, email);


        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String jsonResponse = "{ \"success\": " + updated + " }";

        response.getWriter().write(jsonResponse);

    }

}