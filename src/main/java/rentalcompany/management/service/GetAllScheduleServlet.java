package rentalcompany.management.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import com.google.gson.Gson;
import rentalcompany.management.controller.RentalCompanyDAO;
import rentalcompany.management.controller.RentalCompanyBookingsDAO;
import rentalcompany.maintenance.controller.CalendarEventDAO;
import rentalcompany.management.model.RentalCompanyBookings;
import rentalcompany.maintenance.model.CalendarEvent;
import common.util.DBConnection;


import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.util.List;


@WebServlet("/getallschedule")
public class GetAllScheduleServlet extends HttpServlet {

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

            String dateStr = req.getParameter("date");
            String vehicleIdStr = req.getParameter("vehicleId");


            if (dateStr == null || dateStr.isEmpty() || vehicleIdStr == null || vehicleIdStr.isEmpty()) {

                resp.getWriter().write("{\"status\":\"error\",\"message\":\"Date or vehicleId is missing\"}");
                return;

            }

            int vehicleId = Integer.parseInt(vehicleIdStr);

            List<RentalCompanyBookings> Bookings = RentalCompanyBookingsDAO.loadBookingsByVehicleAndDate(companyId, vehicleId, dateStr);
            List<CalendarEvent> maintenanceWork = CalendarEventDAO.getEventsByVehicleAndDate(vehicleId, dateStr);

            if(Bookings == null || Bookings.isEmpty()) {}

            String json = """
            {
                "schedule": {
                    "bookings": [
                        {
                            "id": "BK001",
                            "customer": "John Smith",
                            "driver": "Mike Johnson",
                            "startTime": "08:00",
                            "endTime": "10:00",
                            "status": "Ongoing"
                        },
                        {
                            "id": "BK002",
                            "customer": "Sarah Wilson",
                            "driver": "David Perera",
                            "startTime": "14:00",
                            "endTime": "16:00",
                            "status": "Confirmed"
                        }
                    ],
                    "maintenance": [
                        {
                            "id": "MT001",
                            "type": "Engine Check",
                            "startTime": "11:30",
                            "endTime": "13:00",
                            "status": "Scheduled"
                        },
                        {
                            "id": "MT002",
                            "type": "Oil Change",
                            "startTime": "16:00",
                            "endTime": "17:00",
                            "status": "In Progress"
                        }
                    ]
                }
            }
            """;

            resp.getWriter().write(json);


        } catch (Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }
    }
}
