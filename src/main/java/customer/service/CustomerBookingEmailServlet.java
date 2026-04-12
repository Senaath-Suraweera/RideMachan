package customer.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import common.util.BookingConfirmationMailer;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.BufferedReader;
import java.io.IOException;

@WebServlet("/customer/send-booking-email")
public class CustomerBookingEmailServlet extends HttpServlet {

    private final Gson gson = new Gson();

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json;charset=UTF-8");

        try {
            // Read JSON body
            StringBuilder sb = new StringBuilder();
            try (BufferedReader reader = req.getReader()) {
                String line;
                while ((line = reader.readLine()) != null) sb.append(line);
            }

            JsonObject data = gson.fromJson(sb.toString(), JsonObject.class);
            if (data == null) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"success\":false,\"message\":\"Empty request body\"}");
                return;
            }

            final String recipient      = getStr(data, "email");
            if (recipient == null || recipient.isEmpty()) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"success\":false,\"message\":\"Recipient email is required\"}");
                return;
            }

            final String bookingId       = getStr(data, "bookingId");
            final String customerName    = getStr(data, "customerName");
            final String vehicleName     = getStr(data, "vehicleName");
            final String company         = getStr(data, "company");
            final String mode            = getStr(data, "mode");
            final String pickupDateTime  = getStr(data, "pickupDateTime");
            final String returnDateTime  = getStr(data, "returnDateTime");
            final String duration        = getStr(data, "duration");
            final String pickupLocation  = getStr(data, "pickupLocation");
            final String hourlyRate      = getStr(data, "hourlyRate");
            final String subtotal        = getStr(data, "subtotal");
            final String serviceFee      = getStr(data, "serviceFee");
            final String totalCost       = getStr(data, "totalCost");
            final String paymentMethod   = getStr(data, "paymentMethod");
            final String phone           = getStr(data, "phone");

            // Send email asynchronously so the user isn't blocked by SMTP latency
            new Thread(() -> BookingConfirmationMailer.sendBookingConfirmation(
                    recipient, bookingId, customerName, vehicleName, company, mode,
                    pickupDateTime, returnDateTime, duration, pickupLocation,
                    hourlyRate, subtotal, serviceFee, totalCost, paymentMethod, phone
            )).start();

            resp.setStatus(HttpServletResponse.SC_OK);
            resp.getWriter().write("{\"success\":true,\"message\":\"Email dispatch started\"}");

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"success\":false,\"message\":\"Failed to send email\"}");
        }
    }

    private String getStr(JsonObject obj, String key) {
        if (obj == null || !obj.has(key) || obj.get(key).isJsonNull()) return "";
        return obj.get(key).getAsString();
    }
}