package rentalcompany.maintenance.service;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.*;
import rentalcompany.companyvehicle.model.Vehicle;
import rentalcompany.maintenance.controller.MaintenanceStaffDAO;
import rentalcompany.maintenance.model.MaintenanceStaff;

import java.io.IOException;
import java.util.List;

@WebServlet("/load/maintenance/profile")
public class LoadStaffProfileServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {

        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("staff_id") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "/maintenance.html?redirect=" + requestedPage);
                return;
            }

            int staffId = (int) session.getAttribute("staff_id");


            MaintenanceStaff company = MaintenanceStaffDAO.getStaffProfile(staffId);

            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");

            Gson gson = new Gson();
            String json = gson.toJson(company);

            resp.getWriter().write(json);

        }catch(Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }

    }


}
