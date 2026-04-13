package rentalcompany.management.service;

import java.io.IOException;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;


@WebServlet("/assignstaff")
public class AssignStaffServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {


        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("companyId") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "/companylogin.html?redirect=" + requestedPage);
                return;
            }

            int companyId = (int) session.getAttribute("companyId");

            String staffIdStr = req.getParameter("staffId");
            String vehicleIdStr = req.getParameter("vehicleId");


            if (staffIdStr == null || vehicleIdStr == null || vehicleIdStr.isEmpty()) {

                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Missing parameters\"}");
                return;

            }

            boolean success = assignStaffToVehicle(staffId, vehicleId, companyId);


            if (success) {
                resp.getWriter().write("{\"status\":\"success\",\"message\":\"Status updated successfully\"}");
            } else {
                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Update failed\"}");
            }

        }catch(Exception e) {

            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");

        }

    }


}
