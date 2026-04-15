package rentalcompany.maintenance.service;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.maintenance.controller.MaintenanceStaffDAO;

import java.io.IOException;


@WebServlet("/vehicle/update/status")
public class UpdateVehicleStatusServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        resp.setContentType("application/json");

        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("staff_id") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "/maintenance.html?redirect=" + requestedPage);
                return;
            }

            int staffId = (int) session.getAttribute("staff_id");

            String numberplate = req.getParameter("numberplate");
            String status = req.getParameter("status");

            if (numberplate == null || status == null || numberplate.isEmpty() || status.isEmpty()) {

                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Missing parameters\"}");
                return;

            }

            boolean success = MaintenanceStaffDAO.updateVehicleStatus(numberplate, status);

            if (success) {
                resp.getWriter().write("{\"status\":\"success\",\"message\":\"Status updated successfully\"}");
            } else {
                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Update failed\"}");
            }


        } catch (Exception e) {

            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");

        }
    }
}