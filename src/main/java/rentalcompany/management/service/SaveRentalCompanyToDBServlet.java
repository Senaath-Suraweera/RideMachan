package rentalcompany.management.service;

import common.util.DBConnection;
import common.util.PasswordServices;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.*;

/**
 * Called after OTP verification.
 * Reads company data from session and inserts into RentalCompanyRegistrationRequest
 * with status = 'PENDING'. Admin must approve before a RentalCompany row is created.
 */
@WebServlet("/company/save")
public class SaveRentalCompanyToDBServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        System.out.println("SaveRentalCompanyToDBServlet");

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession();

        // ── Check OTP verification ──────────────────────────────────
        Boolean verified = (Boolean) session.getAttribute("verified");
        if (verified == null || !verified) {
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Email not verified\"}");
            System.out.println("Email not verified");
            return;
        }

        // ── Read data from session ──────────────────────────────────
        String email = (String) session.getAttribute("email");
        String password = (String) session.getAttribute("password");
        String companyName = (String) session.getAttribute("companyname");
        String phone = (String) session.getAttribute("phone");
        String registrationNumber = (String) session.getAttribute("registrationnumber");
        String taxId = (String) session.getAttribute("taxid");
        String street = (String) session.getAttribute("street");
        String city = (String) session.getAttribute("city");
        String certificatePath = (String) session.getAttribute("certificatepath");
        String taxDocumentPath = (String) session.getAttribute("taxdocumentpath");
        String description = (String) session.getAttribute("description");
        String terms = (String) session.getAttribute("terms");

        if (companyName == null || email == null || password == null) {
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Missing required fields in session\"}");
            return;
        }

        // ── Hash password ───────────────────────────────────────────
        String salt = PasswordServices.generateSalt();
        String hashedPassword = PasswordServices.hashPassword(password, salt);

        // ── Insert into RentalCompanyRegistrationRequest ────────────
        String sql = "INSERT INTO RentalCompanyRegistrationRequest " +
                "(companyname, companyemail, phone, registrationnumber, taxid, street, city, " +
                " certificatepath, taxdocumentpath, description, terms, hashedpassword, salt, status) " +
                "VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'PENDING')";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, companyName);
            ps.setString(2, email);
            ps.setString(3, emptyToNull(phone));
            ps.setString(4, emptyToNull(registrationNumber));
            ps.setString(5, emptyToNull(taxId));
            ps.setString(6, emptyToNull(street));
            ps.setString(7, emptyToNull(city));
            ps.setString(8, emptyToNull(certificatePath));
            ps.setString(9, emptyToNull(taxDocumentPath));
            ps.setString(10, emptyToNull(description));
            ps.setString(11, emptyToNull(terms));
            ps.setString(12, hashedPassword);
            ps.setString(13, salt);

            int rows = ps.executeUpdate();

            if (rows > 0) {
                int requestId = -1;
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) requestId = rs.getInt(1);
                }

                // Clear sensitive data from session
                session.removeAttribute("password");

                System.out.printf("Rental company request submitted. ID=%d, Email=%s, Company=%s%n",
                        requestId, email, companyName);

                response.getWriter().write(
                        "{\"status\":\"success\",\"message\":\"Registration request submitted\",\"request_id\":" + requestId + "}");
            } else {
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Failed to insert data\"}");
            }

        } catch (SQLIntegrityConstraintViolationException dup) {
            System.out.println("Duplicate company email: " + email);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"A request with this email already exists\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Server error\"}");
        }
    }

    private String emptyToNull(String s) {
        return (s == null || s.trim().isEmpty()) ? null : s.trim();
    }
}