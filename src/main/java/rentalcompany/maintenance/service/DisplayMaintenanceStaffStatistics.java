package rentalcompany.maintenance.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import rentalcompany.maintenance.controller.MaintenanceStaffDAO;
import rentalcompany.maintenance.model.MaintenanceStaff;

import vehicle.dao.VehicleDAO;

import java.io.IOException;

@WebServlet("/displaymaintenancestatistics")
public class DisplayMaintenanceStaffStatistics extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        try {

            HttpSession session = req.getSession(false);

            /*if(session == null || session.getAttribute("staff_id") == null) {
                String requestedPage = req.getRequestURI();
                //resp.sendRedirect(req.getContextPath() + "companylogin.html?redirect=" + requestedPage);
                return;
            }*/

            int staffId = (int) session.getAttribute("staff_id");

            int overdueMaintenance = MaintenanceStaffDAO.getOverdueMaintenanceCount(staffId);
            int completedToday = MaintenanceStaffDAO.getTodayCompletedJobsCount(staffId);
            int linkedVehicles = MaintenanceStaffDAO.getLinkedCount(staffId);
            int pendingMaintenance = MaintenanceStaffDAO.getPendingMaintenanceJobsCount(staffId);


            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");


            String json = "{"
                    + "\"overdueMaintenance\":" + overdueMaintenance + ","
                    + "\"completedToday\":" + completedToday + ","
                    + "\"linkedVehicles\":" + linkedVehicles + ","
                    + "\"pendingMaintenance\":" + pendingMaintenance
                    + "}";

            resp.getWriter().write(json);



        }catch(Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }

    }


}

