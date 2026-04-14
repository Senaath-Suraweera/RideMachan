package customer.service;

import admin.controller.ReportController;
import admin.model.Report;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import common.util.DBConnection;
import customer.controller.CustomerDAO;
import customer.model.Customer;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;

@WebServlet("/customer/report/create")
public class CustomerReportCreateServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        PrintWriter out = resp.getWriter();

        try {
            // 1. Session check
            HttpSession session = req.getSession(false);
            if (session == null || session.getAttribute("customerId") == null) {
                resp.setStatus(401);
                out.write("{\"success\":false,\"message\":\"Please login to file a report\"}");
                return;
            }

            int customerId = (int) session.getAttribute("customerId");
            String customerEmail = (String) session.getAttribute("email");

            // 2. Pull full customer info for reporter_name / phone
            String reporterName;
            String reporterPhone;
            try (Connection conn = DBConnection.getConnection()) {
                CustomerDAO dao = new CustomerDAO(conn);
                Customer c = dao.getCustomerById(customerId);
                if (c != null) {
                    reporterName = c.getFirstname() + " " + c.getLastname();
                    reporterPhone = c.getMobileNumber();
                } else {
                    reporterName = (String) session.getAttribute("firstname");
                    reporterPhone = "N/A";
                }
            }

            // 3. Parse JSON body
            StringBuilder sb = new StringBuilder();
            BufferedReader reader = req.getReader();
            String line;
            while ((line = reader.readLine()) != null) sb.append(line);

            JsonObject body = JsonParser.parseString(sb.toString()).getAsJsonObject();

            String category     = body.get("category").getAsString();       // vehicle/behavior/payment/app/safety
            String subject      = body.get("subject").getAsString();
            String description  = body.has("description") ? body.get("description").getAsString() : "";
            String reportedRole = body.get("reportedRole").getAsString();   // DRIVER / COMPANY
            int reportedId      = body.get("reportedId").getAsInt();

            // Basic validation
            if (subject.trim().isEmpty() || category.trim().isEmpty() || reportedId <= 0) {
                resp.setStatus(400);
                out.write("{\"success\":false,\"message\":\"Missing required fields\"}");
                return;
            }

            // 4. Build Report and insert
            Report r = new Report();
            r.setCategory(category.toLowerCase());
            r.setStatus("Pending");
            r.setPriority("Low");
            r.setSubject(subject);
            r.setDescription(description);
            r.setReportedRole(reportedRole.toUpperCase());
            r.setReportedId(reportedId);
            r.setReporterRole("CUSTOMER");
            r.setReporterId(customerId);
            r.setReporterName(reporterName);
            r.setReporterEmail(customerEmail);
            r.setReporterPhone(reporterPhone);

            int reportId = ReportController.createReport(r);

            if (reportId > 0) {
                JsonObject result = new JsonObject();
                result.addProperty("success", true);
                result.addProperty("reportId", reportId);
                result.addProperty("message", "Report filed successfully");
                out.write(result.toString());
            } else {
                resp.setStatus(500);
                out.write("{\"success\":false,\"message\":\"Failed to save report\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            out.write("{\"success\":false,\"message\":\"Server error: " + e.getMessage() + "\"}");
        }
    }
}