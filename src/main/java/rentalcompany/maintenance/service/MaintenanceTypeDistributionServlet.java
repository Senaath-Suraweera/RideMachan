package rentalcompany.maintenance.service;

import jakarta.servlet.annotation.WebServlet;
import java.io.IOException;


import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;

import rentalcompany.maintenance.controller.MaintenanceStaffDAO;


@WebServlet("/displaymaintenancedistribution")
public class MaintenanceTypeDistributionServlet extends HttpServlet{

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        try {

            HttpSession session = req.getSession(false);

            /*if(session == null || session.getAttribute("staff_id") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "maintenance.html?redirect=" + requestedPage);
                return;
            }*/

            int staffId = (int) session.getAttribute("staff_id");


            float oilChangesPercentage = MaintenanceStaffDAO.calculateMaintenanceStaffPercentage(staffId,"Oil Change");
            float brakeServicesPercentage = MaintenanceStaffDAO.calculateMaintenanceStaffPercentage(staffId,"Brake Services");
            float tireServicesPercentage = MaintenanceStaffDAO.calculateMaintenanceStaffPercentage(staffId,"Tire Services");
            float otherServicesPercentage = MaintenanceStaffDAO.calculateMaintenanceStaffPercentage(staffId,"Other Services");


            String json = "{"
                    + "\"maintenanceDistribution\": {"
                    + "{\"type\":\"Oil Changes\",\"percentage\":" + oilChangesPercentage + "},"
                    + "{\"type\":\"Brake Services\",\"percentage\":" + brakeServicesPercentage + "},"
                    + "{\"type\":\"Tire Services\",\"percentage\":" + tireServicesPercentage + "},"
                    + "{\"type\":\"Other Services\",\"percentage\":" + otherServicesPercentage + "}"
                    + "}"
                    + "}";

            resp.getWriter().write(json);




        }catch(Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }

    }

}
