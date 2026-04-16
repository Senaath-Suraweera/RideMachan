package rentalcompany.maintenance.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.maintenance.model.CalendarEvent;
import rentalcompany.maintenance.controller.MaintenanceStaffDAO;

import java.io.IOException;
import java.util.List;
import java.text.SimpleDateFormat;
import java.util.Date;

@WebServlet("/display/upcoming/maintenance")
public class DisplayUpcomingMaintenanceServlet extends HttpServlet {

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


            List<CalendarEvent> upcomingMaintenance = MaintenanceStaffDAO.getUpcomingMaintenanceByStaffId(staffId);


            String json = "[";

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");

            for (int i = 0; i < upcomingMaintenance.size(); i++) {

                CalendarEvent event = upcomingMaintenance.get(i);

                String status;

                if ("scheduled".equals(event.getStatus())) {
                    status = "Scheduled";
                } else if ("in-progress".equals(event.getStatus())) {
                    status = "Pending";
                } else {
                    status = event.getStatus();
                }

                String description;

                try {
                    Date today = new Date();
                    Date scheduled = sdf.parse(event.getScheduledDate());

                    long diffMillis = scheduled.getTime() - today.getTime();
                    long daysBetween = diffMillis / (1000 * 60 * 60 * 24);

                    if (daysBetween == 0) {
                        description = "Due today";
                    } else if (daysBetween == 1) {
                        description = "Due tomorrow";
                    } else if (daysBetween > 1) {
                        description = "Due in " + daysBetween + " days";
                    } else {
                        description = "Overdue";
                    }

                } catch (Exception e) {
                    description = event.getDescription();
                }

                json += "{"
                        + "\"title\":\"" + event.getServiceType() + " - Vehicle " + event.getVehicleNumberPlate() + "\","
                        + "\"description\":\"" + description + "\","
                        + "\"status\":\"" + status + "\""
                        + "}";

                if (i < upcomingMaintenance.size() - 1) {
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
