package rentalcompany.maintenance.service;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.*;
import jakarta.servlet.http.HttpSession;
import rentalcompany.maintenance.controller.MaintenanceStaffDAO;

import java.io.IOException;

@WebServlet("/inspection/submit")
public class SubmitInspectionServlet extends HttpServlet {

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
            String inspectionType = req.getParameter("inspectionType");
            String priorityLevel = req.getParameter("priorityLevel");
            String issues = req.getParameter("issues");
            String inspectionDate = req.getParameter("inspectionDate");
            String checklist = req.getParameter("checklist");

            if (numberplate == null || numberplate.trim().isEmpty()) {
                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Numberplate required\"}");
                return;
            }

            if (status == null || status.trim().isEmpty()) {
                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Status required\"}");
                return;
            }


            numberplate = numberplate.trim();
            status = status.trim();

            boolean success = MaintenanceStaffDAO.saveInspection(staffId,numberplate,status,inspectionType,priorityLevel,issues,inspectionDate,checklist);

            if (success) {
                resp.getWriter().write("{\"status\":\"success\",\"message\":\"Inspection saved successfully\"}");
            } else {
                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Database update failed\"}");
            }


        } catch (Exception e) {

            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");

        }

    }

}
