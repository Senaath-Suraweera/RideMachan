package rentalcompany.maintenance.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import rentalcompany.maintenance.controller.MaintenanceStaffDAO;
import rentalcompany.maintenance.model.MaintenanceStaff;

import rentalcompany.companyvehicle.dao.VehicleDAO;

import java.io.IOException;

@WebServlet("/displaystaffstatistics")
public class DisplayStaffStatisticsServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("companyId") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "companylogin.html?redirect=" + requestedPage);
                return;
            }

            int companyId = (int) session.getAttribute("companyId");

            int totalStaff = MaintenanceStaffDAO.getTotalStaffCount(companyId);
            int availableStaff = MaintenanceStaffDAO.getAvailableStaffCount(companyId);
            int onJobStaff = MaintenanceStaffDAO.getOnJobStaffCount(companyId);
            int offlineStaff = totalStaff - availableStaff - onJobStaff;

            int totalVehicles = VehicleDAO.getTotalVehiclesCount(companyId);

            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");


            String json = "{"
                    + "\"totalStaff\":" + totalStaff + ","
                    + "\"availableStaff\":" + availableStaff + ","
                    + "\"onJobStaff\":" + onJobStaff + ","
                    + "\"offlineStaff\":" + offlineStaff + ","
                    + "\"totalVehicles\":" + totalVehicles
                    + "}";

            resp.getWriter().write(json);



        }catch(Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }

    }


}

