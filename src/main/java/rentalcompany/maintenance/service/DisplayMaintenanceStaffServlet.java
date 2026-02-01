package rentalcompany.maintenance.service;


import java.io.IOException;
import java.util.List;


import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import rentalcompany.maintenance.controller.MaintenanceStaffDAO;
import rentalcompany.maintenance.model.MaintenanceStaff;
import rentalcompany.management.controller.RentalCompanyBookingsDAO;
import rentalcompany.management.model.RentalCompanyBookings;

@WebServlet(name = "DisplayMaintenanceStaffServlet", urlPatterns = {"/display/maintenancestaff"})
public class DisplayMaintenanceStaffServlet extends HttpServlet {

    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {


        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("companyId") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "companylogin.html?redirect=" + requestedPage);
                return;
            }

            int companyId = (int) session.getAttribute("companyId");

            List<MaintenanceStaff> Staffs = MaintenanceStaffDAO.getCompanyStaffsByCompanyId(companyId);

            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");


            if (Staffs == null || Staffs.isEmpty()) {
                resp.getWriter().write("[]"); // return empty object
                return;
            }

            String json = new Gson().toJson(Staffs);


            resp.getWriter().write(json);

        }catch(Exception e) {

            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");

        }

    }


}
