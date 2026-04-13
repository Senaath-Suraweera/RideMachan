package rentalcompany.management.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.Part;

import java.io.File;
import java.io.IOException;

/**
 * UPDATED: No longer saves directly to DB.
 * Stores form data in session → user verifies OTP → SaveRentalCompanyToDBServlet
 * saves to RentalCompanyRegistrationRequest table (status = PENDING).
 */
@WebServlet(name = "RentalCompanySignupServlet", urlPatterns = {"/rentalcompany/signup"})
@MultipartConfig
public class RentalCompanySignupLandingServlet extends HttpServlet {

    private static final String UPLOAD_DIR = "src/company_documents";

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            // ── Collect form fields ──────────────────────────────────
            String companyName = request.getParameter("companyname");
            String email = request.getParameter("email");
            String phone = request.getParameter("phone");
            String registrationNumber = request.getParameter("registrationnumber");
            String taxId = request.getParameter("taxid");
            String street = request.getParameter("street");
            String city = request.getParameter("city");
            String description = request.getParameter("description");
            String terms = request.getParameter("terms");
            String password = request.getParameter("password");

            // Basic validation
            if (companyName == null || companyName.trim().isEmpty()
                    || email == null || email.trim().isEmpty()
                    || password == null || password.trim().isEmpty()) {
                response.setStatus(400);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Company name, email, and password are required\"}");
                return;
            }

            // ── Handle uploaded documents ────────────────────────────
            String certificatePath = "";
            String taxDocumentPath = "";

            Part certificatePart = request.getPart("certificate");
            Part taxDocPart = request.getPart("taxdocument");

            if (certificatePart != null && certificatePart.getSize() > 0) {
                String uploadPath = getServletContext().getRealPath("") + File.separator + UPLOAD_DIR;
                File uploadDir = new File(uploadPath);
                if (!uploadDir.exists()) uploadDir.mkdirs();

                String certificateFileName = System.currentTimeMillis() + "_certificate_" + certificatePart.getSubmittedFileName();
                certificatePart.write(uploadPath + File.separator + certificateFileName);
                certificatePath = UPLOAD_DIR + "/" + certificateFileName;
            }

            if (taxDocPart != null && taxDocPart.getSize() > 0) {
                String uploadPath = getServletContext().getRealPath("") + File.separator + UPLOAD_DIR;
                File uploadDir = new File(uploadPath);
                if (!uploadDir.exists()) uploadDir.mkdirs();

                String taxFileName = System.currentTimeMillis() + "_tax_" + taxDocPart.getSubmittedFileName();
                taxDocPart.write(uploadPath + File.separator + taxFileName);
                taxDocumentPath = UPLOAD_DIR + "/" + taxFileName;
            }

            // ── Store everything in session ──────────────────────────
            HttpSession session = request.getSession();
            session.setAttribute("role", "company");
            session.setAttribute("email", email.trim());
            session.setAttribute("password", password);
            session.setAttribute("companyname", companyName.trim());
            session.setAttribute("phone", phone != null ? phone.trim() : "");
            session.setAttribute("registrationnumber", registrationNumber != null ? registrationNumber.trim() : "");
            session.setAttribute("taxid", taxId != null ? taxId.trim() : "");
            session.setAttribute("street", street != null ? street.trim() : "");
            session.setAttribute("city", city != null ? city.trim() : "");
            session.setAttribute("certificatepath", certificatePath);
            session.setAttribute("taxdocumentpath", taxDocumentPath);
            session.setAttribute("description", description != null ? description.trim() : "");
            session.setAttribute("terms", terms != null ? terms.trim() : "");

            System.out.println("RentalCompanySignupServlet: session saved for " + email);

            response.getWriter().write("{\"status\":\"success\",\"message\":\"Data saved to session\"}");

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + escapeJson(e.getMessage()) + "\"}");
        }
    }

    private String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "");
    }
}