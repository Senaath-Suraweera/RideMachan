package common.util;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

public class GmailSender {

    // ---------------------------------------------------------------------------------
    // Existing OTP method (UNCHANGED) - kept exactly to avoid breaking your current flow
    // ---------------------------------------------------------------------------------
    public static void sendEmail(String recipient, String subject, String code) {
        String smtpServer = "smtp.gmail.com";
        int port = 465;
        String senderEmail = "ridemachan.help@gmail.com";
        String senderPassword = "kyuinmehbisemimj";

        String body =
                "<!DOCTYPE html>" +
                        "<html lang=\"en\">" +
                        "<head>" +
                        "<meta charset=\"UTF-8\" />" +
                        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />" +
                        "<style>" +
                        "* { margin: 0; padding: 0; box-sizing: border-box; }" +
                        "body { display: flex; justify-content: center; align-items: center; min-height: 100vh; " +
                        "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #081553 0%, #0b1aa1 100%); padding: 20px; }" +
                        ".email-container { max-width: 600px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; " +
                        "box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }" +
                        "table { width: 100%; border-collapse: collapse; }" +
                        ".header-section { color: #ffffff; font-size: 30px; background: linear-gradient(135deg, #21215e 0%, #131286 100%); padding: 40px 20px; text-align: center; }" +
                        ".header-section th { color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: 1px; }" +
                        ".image-section { padding: 30px 20px; text-align: center; background: #f8f9fa; }" +
                        ".email-image { width: 100%; height: auto; border-radius: 12px; }" +
                        ".title-section { padding: 30px 20px 20px; text-align: center; background: #ffffff; }" +
                        ".title-section th { color: #333; font-size: 24px; font-weight: 600; line-height: 1.4; }" +
                        ".content-section { padding: 20px 40px; text-align: center; }" +
                        ".content-section td { color: #555; font-size: 16px; line-height: 1.8; padding: 15px 0; }" +
                        ".otp-wrapper { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; font-size: 36px; " +
                        "font-weight: 700; letter-spacing: 8px; padding: 20px 30px; border-radius: 12px; display: inline-block; margin: 10px 0; " +
                        "box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4); }" +
                        ".divider { height: 2px; background: linear-gradient(90deg, transparent 0%, #667eea 50%, transparent 100%); margin: 20px 0; }" +
                        ".decorative-line { width: 60px; height: 4px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 15px auto; border-radius: 2px; }" +
                        "</style>" +
                        "</head>" +
                        "<body>" +
                        "<div class=\"email-container\">" +
                        "<table>" +
                        "<tr><th class=\"header-section\">RideMachan</th></tr>" +
                        "<tr><td class=\"image-section\">" +
                        "<img src=\"https://drive.google.com/uc?export=view&id=1DevYvrYkwYWw761lEtNKCQVRRoNxYEMn\" " +
                        "alt=\"Email Verification\" class=\"email-image\" />" +
                        "</td></tr>" +
                        "<tr><th class=\"title-section\">Verify your email address using the OTP below" +
                        "<div class=\"decorative-line\"></div></th></tr>" +
                        "<tr><td class=\"content-section\">Your OTP is:<br><br>" +
                        "<div><span class=\"otp-wrapper\" id=\"otp\">" + code + "</span></div>" +
                        "</td></tr>" +
                        "<tr><td><div class=\"divider\"></div></td></tr>" +
                        "<tr><td class=\"content-section\">" +
                        "<h4>Your OTP will be valid for 5 minutes</h4><br><br>" +
                        "Thank you for choosing RideMachan!" +
                        "</td></tr>" +
                        "</table></div></body></html>";

        sendHtmlEmailInternal(recipient, subject, body, senderEmail, senderPassword, smtpServer, port);
    }

    // ------------------------------------------------------------------
    // NEW: Generic HTML email sender (use this for approve/reject emails)
    // ------------------------------------------------------------------
    public static void sendHtmlEmail(String recipient, String subject, String htmlBody) {
        String smtpServer = "smtp.gmail.com";
        int port = 465;
        String senderEmail = "ridemachan.help@gmail.com";
        String senderPassword = "kyuinmehbisemimj";

        sendHtmlEmailInternal(recipient, subject, htmlBody, senderEmail, senderPassword, smtpServer, port);
    }

    // ------------------------------------------------------------------
    // NEW: Convenience method for request status notifications
    // ------------------------------------------------------------------
    public static void sendRentalCompanyRequestStatusEmail(
            String recipient,
            String companyName,
            boolean approved,
            String rejectReason
    ) {
        String safeCompany = (companyName == null || companyName.trim().isEmpty()) ? "Rental Company" : escapeHtml(companyName.trim());

        String subject = approved
                ? "RideMachan | Rental Company Request Approved"
                : "RideMachan | Rental Company Request Rejected";

        String statusTitle = approved ? "Approved ✅" : "Rejected ❌";
        String statusColor = approved ? "#16a34a" : "#dc2626";

        String reasonBlock = "";
        if (!approved) {
            String reason = (rejectReason == null || rejectReason.trim().isEmpty())
                    ? "No reason was provided by the admin."
                    : escapeHtml(rejectReason.trim());

            reasonBlock =
                    "<div style=\"margin-top:16px; padding:14px 16px; border-radius:12px; background:#fff7ed; border:1px solid #fed7aa; color:#9a3412;\">" +
                            "<div style=\"font-weight:700; margin-bottom:6px;\">Reason</div>" +
                            "<div style=\"line-height:1.6;\">" + reason + "</div>" +
                            "</div>";
        }

        String html =
                "<!DOCTYPE html><html><head><meta charset=\"UTF-8\" />" +
                        "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />" +
                        "</head><body style=\"margin:0; padding:0; font-family:Segoe UI, Tahoma, Arial, sans-serif; background:#f5f7fb;\">" +
                        "<div style=\"max-width:640px; margin:0 auto; padding:24px;\">" +
                        "<div style=\"background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 16px 40px rgba(0,0,0,0.08);\">" +

                        "<div style=\"padding:22px 20px; background:linear-gradient(135deg,#081553 0%, #0b1aa1 100%); color:#fff;\">" +
                        "<div style=\"font-size:22px; font-weight:800; letter-spacing:0.5px;\">RideMachan</div>" +
                        "<div style=\"opacity:0.9; margin-top:4px;\">Rental Company Registration Update</div>" +
                        "</div>" +

                        "<div style=\"padding:22px 22px 10px;\">" +
                        "<div style=\"font-size:18px; font-weight:700; color:#111827;\">Hello " + safeCompany + ",</div>" +
                        "<div style=\"margin-top:10px; color:#374151; line-height:1.7;\">" +
                        "Your rental company registration request has been <span style=\"font-weight:800; color:" + statusColor + ";\">" + statusTitle + "</span>." +
                        "</div>" +
                        reasonBlock +
                        "</div>" +

                        "<div style=\"padding:0 22px 22px; color:#6b7280; font-size:13px; line-height:1.6;\">" +
                        "If you believe this is a mistake, you can contact the RideMachan support team or submit a new request with updated details." +
                        "<div style=\"margin-top:10px;\">Thank you,<br/><b>RideMachan Team</b></div>" +
                        "</div>" +

                        "</div></div></body></html>";

        sendHtmlEmail(recipient, subject, html);
    }

    // --------------------- Internal SMTP sender ---------------------
    private static void sendHtmlEmailInternal(
            String recipient,
            String subject,
            String htmlBody,
            String senderEmail,
            String senderPassword,
            String smtpServer,
            int port
    ) {
        try {
            SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
            SSLSocket socket = (SSLSocket) factory.createSocket(smtpServer, port);

            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8));

            readResponse(reader);
            sendCommand(writer, "EHLO localhost");
            readResponse(reader);

            sendCommand(writer, "AUTH LOGIN");
            readResponse(reader);

            sendCommand(writer, Base64.getEncoder().encodeToString(senderEmail.getBytes(StandardCharsets.UTF_8)));
            readResponse(reader);

            sendCommand(writer, Base64.getEncoder().encodeToString(senderPassword.getBytes(StandardCharsets.UTF_8)));
            readResponse(reader);

            sendCommand(writer, "MAIL FROM:<" + senderEmail + ">");
            readResponse(reader);

            sendCommand(writer, "RCPT TO:<" + recipient + ">");
            readResponse(reader);

            sendCommand(writer, "DATA");
            readResponse(reader);

            writer.write("Subject: " + subject + "\r\n");
            writer.write("From: " + senderEmail + "\r\n");
            writer.write("To: " + recipient + "\r\n");
            writer.write("MIME-Version: 1.0\r\n");
            writer.write("Content-Type: text/html; charset=UTF-8\r\n");
            writer.write("\r\n");
            writer.write(htmlBody);
            writer.write("\r\n.\r\n");
            writer.flush();

            readResponse(reader);

            sendCommand(writer, "QUIT");
            readResponse(reader);

            socket.close();
            System.out.println("Email sent to " + recipient);
        } catch (Exception e) {
            e.printStackTrace();
        }
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

    private static String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
