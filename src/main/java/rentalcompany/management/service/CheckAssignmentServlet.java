package rentalcompany.management.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;

import rentalcompany.management.controller.RentalCompanyDAO;

@WebServlet("/checkassignment")
public class CheckAssignmentServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        try {

            HttpSession session = req.getSession(false);

            if(session == null || session.getAttribute("companyId") == null) {
                String requestedPage = req.getRequestURI();
                resp.sendRedirect(req.getContextPath() + "/companylogin.html?redirect=" + requestedPage);
                return;
            }

            int companyId = (int) session.getAttribute("companyId");


            String vehicleIdParam = req.getParameter("vehicleId");

            if (vehicleIdParam == null) {

                resp.getWriter().write("{\"isAssigned\":false}");
                return;

            }

            int vehicleId = Integer.parseInt(vehicleIdParam);

            boolean isAssigned = RentalCompanyDAO.checkVehicleAssignment(vehicleId);


            resp.getWriter().write("{\"isAssigned\":" + isAssigned + "}");


        } catch (Exception e) {

            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");

        }
    }



}