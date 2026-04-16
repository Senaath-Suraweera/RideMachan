package rentalcompany.maintenance.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import jakarta.servlet.http.HttpSession;
import rentalcompany.maintenance.controller.MaintenanceStaffDAO;
import rentalcompany.companyvehicle.model.MaintenanceRecord;

import java.io.IOException;
import java.util.List;


@WebServlet("/display/recent/maintenance")
public class DisplayRecentMaintenanceServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("staff_id") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "/maintenance.html?redirect=" + requestedPage);
                return;
            }

            int staffId = (int) session.getAttribute("staff_id");


            List<MaintenanceRecord> recentMaintenance = MaintenanceStaffDAO.getRecentMaintenanceByStaff(staffId);


            String json = "[";

            for (int i = 0; i < recentMaintenance.size(); i++) {

                MaintenanceRecord r = recentMaintenance.get(i);

                json += "{"
                        + "\"status\":\"" + r.getStatus() + "\","
                        + "\"title\":\"" + r.getServiceType() + " - Vehicle " + r.getVehicleId() + "\","
                        + "\"description\":\"" + r.getDescription() + "\","
                        + "\"completedDate\":\"" + r.getCompletedDate() + "\""
                        + "}";

                if (i < recentMaintenance.size() - 1) {
                    json += ",";
                }

            }

            json += "]";

            resp.setContentType("application/json");
            resp.getWriter().write(json);


        }catch(Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }

    }


}
