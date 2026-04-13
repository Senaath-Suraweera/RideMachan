package customer.service;

import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import common.util.DBConnection;
import customer.controller.CustomerBookingDAO;
import customer.controller.CustomerDAO;
import customer.model.Customer;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.*;
import java.sql.Connection;

@WebServlet("/customer/create-booking")
public class CustomerBookingServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        try {
            // ──────────────────────────────────────────────
            // 1. Check login session
            // ──────────────────────────────────────────────
            HttpSession session = req.getSession(false);
            if (session == null || session.getAttribute("customerId") == null) {
                resp.setStatus(401);
                out.write("{\"success\":false,\"message\":\"Please login to make a booking\"}");
                return;
            }

            // ──────────────────────────────────────────────
            // 2. Get customer info from session + DB
            // ──────────────────────────────────────────────
            // Session has: customerId, username, firstname, email, customerType
            // We need phone number too, so fetch full customer from DB
            int customerId = (int) session.getAttribute("customerId");
            String customerEmail = (String) session.getAttribute("email");

            // Fetch full customer details to get phone and last name
            String customerName;
            String customerPhone;

            try (Connection conn = DBConnection.getConnection()) {
                CustomerDAO customerDAO = new CustomerDAO(conn);
                Customer customer = customerDAO.getCustomerById(customerId);
                if (customer != null) {
                    customerName = customer.getFirstname() + " " + customer.getLastname();
                    customerPhone = customer.getMobileNumber();
                } else {
                    customerName = (String) session.getAttribute("firstname");
                    customerPhone = "N/A";
                }
            }

            // ──────────────────────────────────────────────
            // 3. Parse JSON request body
            // ──────────────────────────────────────────────
            BufferedReader reader = req.getReader();
            StringBuilder sb = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                sb.append(line);
            }

            JsonObject body = JsonParser.parseString(sb.toString()).getAsJsonObject();

            int vehicleId = body.get("vehicleId").getAsInt();
            int companyId = body.get("companyId").getAsInt();
            String vehicleName = body.get("vehicleName").getAsString();
            String mode = body.get("mode").getAsString();
            String pickupDate = body.get("pickupDate").getAsString();       // yyyy-MM-dd
            String returnDate = body.get("returnDate").getAsString();       // yyyy-MM-dd
            String pickupTime = body.get("pickupTime").getAsString();       // HH:mm
            String returnTime = body.get("returnTime").getAsString();       // HH:mm
            String pickupLocation = body.get("pickupLocation").getAsString();
            int hours = body.get("hours").getAsInt();
            double totalCost = body.get("totalCost").getAsDouble();

            // ──────────────────────────────────────────────
            // 4. Fetch vehicle plate from DB
            // ──────────────────────────────────────────────
            CustomerBookingDAO dao = new CustomerBookingDAO();
            String vehiclePlate = dao.getVehiclePlate(vehicleId);

            // ──────────────────────────────────────────────
            // 5. Prepare data and insert booking
            // ──────────────────────────────────────────────
            // Append seconds to time values (HH:mm -> HH:mm:ss)
            String startTime = pickupTime.length() == 5 ? pickupTime + ":00" : pickupTime;
            String endTime = returnTime.length() == 5 ? returnTime + ":00" : returnTime;

            // Driver ID: null for self-drive, assigned later by company for with-driver
            Integer driverId = null;

            // Special instructions based on mode
            String specialInstructions = mode.equals("with-driver")
                    ? "With Driver booking"
                    : "Self Drive booking";

            String rideId = dao.createBooking(
                    companyId,
                    customerId,
                    customerName,
                    customerPhone,
                    customerEmail,
                    vehicleId,
                    vehicleName,
                    vehiclePlate,
                    driverId,
                    pickupDate,          // trip_start_date
                    returnDate,          // trip_end_date
                    startTime,           // start_time
                    endTime,             // end_time
                    hours * 60,          // estimated_duration in minutes
                    0.0,                 // distance (can be calculated later)
                    pickupLocation,      // pickup_location
                    pickupLocation,      // drop_location (same as pickup for now)
                    specialInstructions,
                    "pending",           // status
                    totalCost,           // total_amount
                    "unpaid"             // payment_status
            );

            // ──────────────────────────────────────────────
            // 6. Send response
            // ──────────────────────────────────────────────
            if (rideId != null) {
                JsonObject result = new JsonObject();
                result.addProperty("success", true);
                result.addProperty("rideId", rideId);
                result.addProperty("message", "Booking created successfully");
                out.write(result.toString());
            } else {
                resp.setStatus(500);
                out.write("{\"success\":false,\"message\":\"Failed to create booking. Please try again.\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            out.write("{\"success\":false,\"message\":\"Server error: " + e.getMessage() + "\"}");
        }
    }
}