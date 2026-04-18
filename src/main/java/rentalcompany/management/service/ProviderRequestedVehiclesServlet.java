package rentalcompany.management.service;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import rentalcompany.maintenance.controller.CalendarEventDAO;
import rentalcompany.maintenance.model.CalendarEvent;
import rentalcompany.management.controller.RentalCompanyDAO;
import rentalcompany.management.model.RentalCompanyBookings;
import rentalcompany.companyvehicle.model.Vehicle;

import java.io.IOException;
import java.sql.Date;
import java.util.List;



public class ProviderRequestedVehiclesServlet extends HttpServlet {


    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {


        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("companyId") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "/companylogin.html?redirect=" + requestedPage);
                return;
            }

            int companyId = (int) session.getAttribute("companyId");



            List<Vehicle> vehicles =
                    RentalCompanyDAO.getPendingProviderRequestedVehicles(companyId);


            Gson gson = new Gson();
            String json = gson.toJson(vehicles);

            resp.getWriter().write(json);

            resp.getWriter().write(json);


        } catch (Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }
    }

}
