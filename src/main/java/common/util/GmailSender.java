package common.util;

import javax.net.ssl.SSLSocket;
import javax.net.ssl.SSLSocketFactory;
import java.io.*;
import java.util.Base64;

public class GmailSender {



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
                        ".validity-info { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px 20px; margin: 20px 0; border-radius: 8px; }" +
                        ".validity-info td { color: #856404; font-size: 14px; font-weight: 600; }" +
                        ".footer-section { background: #ffffff; padding: 30px 40px; text-align: center; border-top: 2px solid #e9ecef; }" +
                        ".footer-section td { color: #667eea; font-size: 18px; font-weight: 600; }" +
                        ".divider { height: 2px; background: linear-gradient(90deg, transparent 0%, #667eea 50%, transparent 100%); margin: 20px 0; }" +
                        ".decorative-line { width: 60px; height: 4px; background: linear-gradient(90deg, #667eea, #764ba2); margin: 15px auto; border-radius: 2px; }" +
                        "</style>" +
                        "</head>" +
                        "<body>" +
                        "<div class=\"email-container\">" +
                        "<table>" +

                        // Header section
                        "<tr><th class=\"header-section\">RideMachan</th></tr>" +

                        // Image section
                        "<tr><td class=\"image-section\">" +
                        "<img src=\"https://drive.google.com/uc?export=view&id=1DevYvrYkwYWw761lEtNKCQVRRoNxYEMn\" " +
                        "alt=\"Email Verification\" class=\"email-image\" />" +
                        "</td></tr>" +

                        // Title
                        "<tr><th class=\"title-section\">Verify your email address using the OTP below" +
                        "<div class=\"decorative-line\"></div></th></tr>" +

                        "<tr><td class=\"content-section\">Your OTP is:<br><br>" +
                        "<div><span class=\"otp-wrapper\" id=\"otp\">" + code + "</span></div>" +
                        "</td></tr>" +

                        // Divider
                        "<tr><td><div class=\"divider\"></div></td></tr>" +

                        // Validity Info
                        "<tr><td class=\"content-section\">" +
                        "<h4>Your OTP will be valid for 5 minutes</h4><br><br>" +
                        "Thank you for choosing RideMachan!" +
                        "</td></tr>" +

                        "</table></div></body></html>";


        try {
            SSLSocketFactory factory = (SSLSocketFactory) SSLSocketFactory.getDefault();
            SSLSocket socket = (SSLSocket) factory.createSocket(smtpServer, port);
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), "UTF-8"));

            // Greeting
            readResponse(reader);
            sendCommand(writer, "EHLO localhost");
            readResponse(reader);

            // Authenticate
            sendCommand(writer, "AUTH LOGIN");
            readResponse(reader);

            sendCommand(writer, Base64.getEncoder().encodeToString(senderEmail.getBytes()));
            readResponse(reader);

            sendCommand(writer, Base64.getEncoder().encodeToString(senderPassword.getBytes()));
            readResponse(reader);

            // Mail headers
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
            writer.write("\r\n" + body + "\r\n.\r\n");
            writer.flush();
            readResponse(reader);

            sendCommand(writer, "QUIT");
            readResponse(reader);

            socket.close();
            System.out.println("Generated HTML:\n" + code);
            System.out.printf("Email sent to %s successfully!",  recipient);

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
            // SMTP responses end with a line that doesn't start with "XYZ-"
            if (line.length() < 4 || line.charAt(3) != '-') break;
        }
    }

//    public static void main(String[] args) {
//        Util.generateCode();
//        System.out.println("code : " + Util.getCurrentCode());
//        sendEmail("senaathsuraweera2003@gmail.com", "Email Verification Code", Util.getCurrentCode());
//    }
}
