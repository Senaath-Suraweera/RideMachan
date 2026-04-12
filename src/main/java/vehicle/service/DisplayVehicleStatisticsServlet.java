package vehicle.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import vehicle.dao.VehicleDAO;
import vehicle.model.Vehicle;

import java.io.IOException;

@WebServlet("/displayvehiclestatistics")
public class DisplayVehicleStatisticsServlet extends HttpServlet {

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

            int totalVehicles = VehicleDAO.getTotalVehiclesCount(companyId);
            int availableVehicles = VehicleDAO.getAvailableVehiclesCount(companyId);
            int onTripVehicles = VehicleDAO.getOnTripVehiclesCount(companyId);
            int maintenanceVehicles = totalVehicles - availableVehicles - onTripVehicles;

            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");


            String json = "{"
                    + "\"totalVehicles\":" + totalVehicles + ","
                    + "\"availableVehicles\":" + availableVehicles + ","
                    + "\"onTripVehicles\":" + onTripVehicles + ","
                    + "\"maintenanceVehicles\":" + maintenanceVehicles
                    + "}";

            resp.getWriter().write(json);



        }catch(Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }

    }



}







