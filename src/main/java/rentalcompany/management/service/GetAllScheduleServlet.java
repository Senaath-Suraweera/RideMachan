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
import java.sql.Date;
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



            Date selectedDate = Date.valueOf(dateStr);

            String bookingsJson = "[";

            for (int i = 0; i < Bookings.size(); i++) {

                RentalCompanyBookings b = Bookings.get(i);

                Date dateOfTripStart = (Date) b.getTripStartDate();
                Date dateOfTripEnd = (Date) b.getTripEndDate();

                String startTime = b.getStartTimeStr();
                String endTime = b.getEndTimeStr();

                String finalStartTime = startTime;

                if (dateOfTripStart == null || dateOfTripStart.before(selectedDate)) {
                    finalStartTime = "08:00";
                } else if (startTime != null && startTime.compareTo("08:00") < 0) {
                    finalStartTime = "08:00";
                }



                String finalEndTime = endTime;

                if (dateOfTripEnd == null || dateOfTripEnd.after(selectedDate)) {
                    finalEndTime = "18:00";
                } else if (endTime != null && endTime.compareTo("18:00") > 0) {
                    finalEndTime = "18:00";
                }

                bookingsJson += "{"
                        + "\"id\":\"BK" + String.format("%03d", b.getBookingId()) + "\","
                        + "\"customer\":\"" + b.getCustomerName() + "\","
                        + "\"driver\":\"" + b.getDriverName() + "\","
                        + "\"startTime\":\"" + finalStartTime + "\","
                        + "\"endTime\":\"" + finalEndTime + "\","
                        + "\"status\":\"" + b.getStatus() + "\""
                        + "}";


                if (i < Bookings.size() - 1) {
                    bookingsJson += ",";
                }

            }

            bookingsJson += "]";


            String maintenanceJson = "[";

            for (int i = 0; i < maintenanceWork.size(); i++) {

                CalendarEvent e = maintenanceWork.get(i);

                maintenanceJson += "{"
                        + "\"id\":\"MT" + String.format("%03d", e.getEventId()) + "\","
                        + "\"type\":\"" + e.getServiceType() + "\","
                        + "\"startTime\":\"" + e.getScheduledTime() + "\","
                        + "\"endTime\":\"" + e.getScheduledTime() + "\","
                        + "\"status\":\"" + e.getStatus() + "\""
                        + "}";

                if (i < maintenanceWork.size() - 1) maintenanceJson += ",";
            }

            maintenanceJson += "]";


            String json =
                    "{"
                            + "\"schedule\":{"
                            + "\"bookings\":" + bookingsJson + ","
                            + "\"maintenance\":" + maintenanceJson
                            + "}"
                            + "}";

            resp.getWriter().write(json);


        } catch (Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }
    }
}
