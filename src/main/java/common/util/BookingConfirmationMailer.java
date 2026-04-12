package common.util;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.io.*;
import java.util.Base64;

public class BookingConfirmationMailer {

    public static void sendBookingConfirmation(
            String recipient,
            String bookingId,
            String customerName,
            String vehicleName,
            String company,
            String mode,
            String pickupDateTime,
            String returnDateTime,
            String duration,
            String pickupLocation,
            String hourlyRate,
            String subtotal,
            String serviceFee,
            String totalCost,
            String paymentMethod,
            String phone
    ) {
        String smtpServer = "smtp.gmail.com";
        int port = 465;
        String senderEmail = "ridemachan.help@gmail.com";
        String senderPassword = "kyuinmehbisemimj";
        String subject = "Booking Confirmed - " + bookingId + " | RideMachan";

        String body =
                "<!DOCTYPE html>" +
                        "<html lang=\"en\"><head><meta charset=\"UTF-8\" />" +
                        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />" +
                        "<style>" +
                        "* { margin: 0; padding: 0; box-sizing: border-box; }" +
                        "body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; " +
                        "background: linear-gradient(135deg, #081553 0%, #0b1aa1 100%); padding: 20px; }" +
                        ".email-container { max-width: 640px; margin: 0 auto; background: #ffffff; " +
                        "border-radius: 16px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }" +
                        ".header-section { background: linear-gradient(135deg, #21215e 0%, #131286 100%); " +
                        "color: #ffffff; padding: 40px 20px; text-align: center; }" +
                        ".header-section h1 { font-size: 30px; font-weight: 700; letter-spacing: 1px; }" +
                        ".header-section p { font-size: 14px; opacity: 0.85; margin-top: 6px; }" +
                        ".success-banner { background: #e6f9ee; border-left: 5px solid #1db954; " +
                        "padding: 18px 24px; margin: 24px 30px; border-radius: 8px; }" +
                        ".success-banner h2 { color: #0f7a34; font-size: 18px; margin-bottom: 4px; }" +
                        ".success-banner p { color: #2f6f47; font-size: 14px; }" +
                        ".booking-id-box { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); " +
                        "color: #fff; padding: 18px 24px; margin: 0 30px 24px; border-radius: 10px; " +
                        "text-align: center; }" +
                        ".booking-id-box .label { font-size: 12px; letter-spacing: 2px; text-transform: uppercase; opacity: 0.9; }" +
                        ".booking-id-box .value { font-size: 24px; font-weight: 700; letter-spacing: 2px; margin-top: 4px; }" +
                        ".section { padding: 0 30px 10px; }" +
                        ".section h3 { color: #21215e; font-size: 16px; font-weight: 600; " +
                        "border-bottom: 2px solid #eef0ff; padding-bottom: 8px; margin-bottom: 12px; }" +
                        ".row { display: flex; justify-content: space-between; padding: 8px 0; " +
                        "font-size: 14px; border-bottom: 1px dashed #eee; }" +
                        ".row .label { color: #666; }" +
                        ".row .value { color: #222; font-weight: 600; text-align: right; }" +
                        ".total-row { background: #f4f6ff; padding: 14px 18px; margin: 16px 30px 24px; " +
                        "border-radius: 10px; display: flex; justify-content: space-between; align-items: center; }" +
                        ".total-row .label { color: #21215e; font-size: 16px; font-weight: 600; }" +
                        ".total-row .value { color: #131286; font-size: 22px; font-weight: 700; }" +
                        ".footer-section { background: #f8f9fa; padding: 24px 30px; text-align: center; " +
                        "border-top: 2px solid #e9ecef; }" +
                        ".footer-section p { color: #667eea; font-size: 14px; font-weight: 500; line-height: 1.6; }" +
                        ".footer-section .brand { color: #21215e; font-size: 16px; font-weight: 700; margin-top: 8px; }" +
                        "</style></head><body>" +

                        "<div class=\"email-container\">" +

                        "<div class=\"header-section\">" +
                        "<h1>RideMachan</h1>" +
                        "<p>Booking Confirmation</p>" +
                        "</div>" +

                        "<div class=\"success-banner\">" +
                        "<h2>&#10004; Your booking is confirmed!</h2>" +
                        "<p>Hi " + safe(customerName) + ", thank you for booking with us. Your ride is all set.</p>" +
                        "</div>" +

                        "<div class=\"booking-id-box\">" +
                        "<div class=\"label\">Booking ID</div>" +
                        "<div class=\"value\">" + safe(bookingId) + "</div>" +
                        "</div>" +

                        "<div class=\"section\">" +
                        "<h3>Vehicle Details</h3>" +
                        row("Vehicle", vehicleName) +
                        row("Company", company) +
                        row("Mode", mode) +
                        "</div>" +

                        "<div class=\"section\">" +
                        "<h3>Schedule</h3>" +
                        row("Pickup", pickupDateTime) +
                        row("Return", returnDateTime) +
                        row("Duration", duration) +
                        row("Pickup Location", pickupLocation) +
                        "</div>" +

                        "<div class=\"section\">" +
                        "<h3>Pricing</h3>" +
                        row("Hourly Rate", hourlyRate) +
                        row("Duration", duration) +
                        row("Subtotal", subtotal) +
                        row("Service Fee", serviceFee) +
                        "</div>" +

                        "<div class=\"total-row\">" +
                        "<span class=\"label\">Total Paid</span>" +
                        "<span class=\"value\">" + safe(totalCost) + "</span>" +
                        "</div>" +

                        "<div class=\"section\">" +
                        "<h3>Payment & Contact</h3>" +
                        row("Payment Method", paymentMethod) +
                        row("Email", recipient) +
                        row("Phone", phone) +
                        "</div>" +

                        "<div class=\"footer-section\">" +
                        "<p>Please keep this email as proof of your booking.<br/>" +
                        "If you need to cancel or modify, visit <b>My Bookings</b> in your RideMachan account.</p>" +
                        "<p class=\"brand\">Thank you for choosing RideMachan!</p>" +
                        "</div>" +

                        "</div></body></html>";

        try {
            SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
            SSLSocket socket = (SSLSocket) factory.createSocket(smtpServer, port);
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), "UTF-8"));

            readResponse(reader);
            sendCommand(writer, "EHLO localhost");
            readResponse(reader);

            sendCommand(writer, "AUTH LOGIN");
            readResponse(reader);
            sendCommand(writer, Base64.getEncoder().encodeToString(senderEmail.getBytes()));
            readResponse(reader);
            sendCommand(writer, Base64.getEncoder().encodeToString(senderPassword.getBytes()));
            readResponse(reader);

            sendCommand(writer, "MAIL FROM:<" + senderEmail + ">");
            readResponse(reader);
            sendCommand(writer, "RCPT TO:<" + recipient + ">");
            readResponse(reader);

            sendCommand(writer, "DATA");
            readResponse(reader);

            writer.write("Subject: " + subject + "\r\n");
            writer.write("From: RideMachan <" + senderEmail + ">\r\n");
            writer.write("To: " + recipient + "\r\n");
            writer.write("MIME-Version: 1.0\r\n");
            writer.write("Content-Type: text/html; charset=UTF-8\r\n");
            writer.write("\r\n" + body + "\r\n.\r\n");
            writer.flush();
            readResponse(reader);

            sendCommand(writer, "QUIT");
            readResponse(reader);
            socket.close();

            System.out.printf("Booking confirmation email sent to %s (bookingId=%s)%n", recipient, bookingId);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String row(String label, String value) {
        return "<div class=\"row\"><span class=\"label\">" + safe(label) +
                "</span><span class=\"value\">" + safe(value) + "</span></div>";
    }

    private static String safe(String s) {
        if (s == null) return "-";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }

    private static void sendCommand(BufferedWriter writer, String command) throws IOException {
        writer.write(command + "\r\n");
        writer.flush();
    }

    private static void readResponse(BufferedReader reader) throws IOException {
        String line;
        while ((line = reader.readLine()) != null) {
            if (line.length() < 4 || line.charAt(3) != '-') break;
        }
    }
}