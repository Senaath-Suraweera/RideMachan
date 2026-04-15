package rentalcompany.management.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import rentalcompany.management.controller.RentalCompanyBookingsDAO;
import rentalcompany.management.model.RentalCompanyBookings;

import java.io.IOException;
import java.util.List;

@WebServlet("/displayrecentbookings")
public class DisplayRecentBookingsServlet extends HttpServlet {

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

            List<RentalCompanyBookings> recentBookings = RentalCompanyBookingsDAO.loadRecentBookingsByCompanyId(companyId);


// Debug prints
            System.out.println("Debug: companyId = " + companyId);
            System.out.println("Debug: Number of bookings fetched = " + recentBookings.size());
            for (RentalCompanyBookings b : recentBookings) {
                System.out.println("Booking: " + b.getCustomerName() + ", " + b.getVehicleBrand() + " " + b.getVehicleModel() + ", Status: " + b.getStatus());
            }


            resp.setContentType("application/json");
            resp.setCharacterEncoding("UTF-8");


            if (recentBookings == null || recentBookings.isEmpty()) {
                resp.getWriter().write("[]"); // return empty object
                return;
            }

            StringBuilder json = new StringBuilder();
            json.append("[");

            for (int i = 0; i < recentBookings.size(); i++) {
                RentalCompanyBookings b = recentBookings.get(i);

                // Manually create JSON object
                json.append("{");

                json.append("\"companyId\":").append(b.getCompanyId()).append(",");
                json.append("\"status\":\"").append(b.getStatus() != null ? b.getStatus() : "").append("\",");
                json.append("\"totalAmount\":").append(b.getTotalAmount()).append(",");
                json.append("\"customerName\":\"").append(b.getCustomerName() != null ? b.getCustomerName() : "").append("\",");
                json.append("\"vehicleBrand\":\"").append(b.getVehicleBrand() != null ? b.getVehicleBrand() : "").append("\",");
                json.append("\"vehicleModel\":\"").append(b.getVehicleModel() != null ? b.getVehicleModel() : "").append("\",");
                json.append("\"numberPlate\":\"").append(b.getNumberPlate() != null ? b.getNumberPlate() : "").append("\",");
                json.append("\"tripStartDate\":\"").append(b.getTripStartDate()).append("\",");
                json.append("\"tripEndDate\":\"").append(b.getTripEndDate()).append("\"");

                json.append("}");

                if (i < recentBookings.size() - 1) {
                    json.append(",");
                }
            }

            json.append("]");


            resp.getWriter().write(json.toString());

        }catch(Exception e) {
            e.printStackTrace(); // check server logs
            resp.getWriter().write("{\"error\":\""+e.getMessage()+"\"}");
        }

    }




}
