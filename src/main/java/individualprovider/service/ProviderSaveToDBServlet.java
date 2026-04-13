package individualprovider.service;

import common.util.DBConnection;
import common.util.PasswordServices;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLIntegrityConstraintViolationException;
import java.sql.Statement;

@WebServlet("/provider/save")
public class ProviderSaveToDBServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        System.out.println("ProviderSaveToDBServlet");

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession();

        Boolean verified = (Boolean) session.getAttribute("verified");
        if (verified == null || !verified) {
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Email not verified\"}");
            return;
        }

        String username = getString(session, "username");
        String email = getString(session, "email");
        String password = getString(session, "password");

        String firstname = getString(session, "firstname");
        String lastname = getString(session, "lastname");
        String phonenumber = getString(session, "phonenumber");
        String housenumber = getString(session, "housenumber");
        String street = getString(session, "street");
        String city = getString(session, "city");
        String zipcode = getString(session, "zipcode");

        if (isBlank(username) || isBlank(email) || isBlank(password)) {
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Missing required signup data in session\"}");
            return;
        }

        String salt = PasswordServices.generateSalt();
        String hashedPassword = PasswordServices.hashPassword(password, salt);

        String sql = "INSERT INTO VehicleProvider " +
                "(username, email, hashedpassword, salt, company_id, firstname, lastname, phonenumber, housenumber, street, city, zipcode) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {

            ps.setString(1, username);
            ps.setString(2, email);
            ps.setString(3, hashedPassword);
            ps.setString(4, salt);
            ps.setObject(5, null); // company_id assigned later in another flow
            ps.setString(6, emptyToNull(firstname));
            ps.setString(7, emptyToNull(lastname));
            ps.setString(8, emptyToNull(phonenumber));
            ps.setString(9, emptyToNull(housenumber));
            ps.setString(10, emptyToNull(street));
            ps.setString(11, emptyToNull(city));
            ps.setString(12, emptyToNull(zipcode));

            int rows = ps.executeUpdate();

            if (rows > 0) {
                int providerId = -1;
                try (ResultSet rs = ps.getGeneratedKeys()) {
                    if (rs.next()) {
                        providerId = rs.getInt(1);
                    }
                }

                session.removeAttribute("password");

                response.getWriter().write(
                        "{\"status\":\"success\",\"message\":\"Provider account created successfully\",\"provider_id\":" + providerId + "}"
                );
            } else {
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Failed to create provider account\"}");
            }

        } catch (SQLIntegrityConstraintViolationException e) {
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Username or email already exists\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Server error while saving provider\"}");
        }
    }

    private String getString(HttpSession session, String key) {
        Object value = session.getAttribute(key);
        return value == null ? "" : value.toString();
    }

    private String emptyToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}