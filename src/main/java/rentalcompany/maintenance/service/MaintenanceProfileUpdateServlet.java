package rentalcompany.maintenance.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;

import rentalcompany.maintenance.controller.MaintenanceStaffDAO;

@WebServlet("/update/maintenance/profile")
public class MaintenanceProfileUpdateServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        HttpSession session = request.getSession(false);

        if (session == null || session.getAttribute("staff_id") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.write("{ \"success\": false, \"message\": \"Not logged in\" }");
            return;
        }

        int staffId = (int) session.getAttribute("staff_id");

        // ---- Read all editable fields ----
        String username       = request.getParameter("username");
        String firstname      = request.getParameter("firstname");
        String lastname       = request.getParameter("lastname");
        String phone          = request.getParameter("phone");
        String email          = request.getParameter("email");
        String specialization = request.getParameter("specialization");
        String status         = request.getParameter("status");
        String yearsRaw       = request.getParameter("yearsOfExperience");

        // ---- Basic server-side validation ----
        if (isBlank(firstname) || isBlank(lastname) || isBlank(email) || isBlank(phone) || isBlank(username)) {
            out.write("{ \"success\": false, \"message\": \"Required fields cannot be empty\" }");
            return;
        }

        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            out.write("{ \"success\": false, \"message\": \"Invalid email format\" }");
            return;
        }

        if (!phone.matches("^(?:\\+94|0)(7\\d{8})$")) {
            out.write("{ \"success\": false, \"message\": \"Invalid Sri Lankan phone number\" }");
            return;
        }

        float yearsOfExperience = 0f;
        if (!isBlank(yearsRaw)) {
            try {
                yearsOfExperience = Float.parseFloat(yearsRaw.trim());
                if (yearsOfExperience < 0 || yearsOfExperience > 60) {
                    out.write("{ \"success\": false, \"message\": \"Years of experience must be between 0 and 60\" }");
                    return;
                }
            } catch (NumberFormatException nfe) {
                out.write("{ \"success\": false, \"message\": \"Invalid years of experience\" }");
                return;
            }
        }

        // status must match the ENUM in the DB
        if (status == null || status.trim().isEmpty()) {
            status = "available";
        } else {
            status = status.trim();
            if (!(status.equals("available") || status.equals("on Job") || status.equals("offline"))) {
                out.write("{ \"success\": false, \"message\": \"Invalid status value\" }");
                return;
            }
        }

        if (specialization == null) specialization = "";

        boolean updated = MaintenanceStaffDAO.updateMaintenanceProfile(
                staffId,
                username.trim(),
                firstname.trim(),
                lastname.trim(),
                phone.trim(),
                email.trim(),
                specialization.trim(),
                status,
                yearsOfExperience
        );

        if (updated) {
            out.write("{ \"success\": true, \"message\": \"Profile updated successfully\" }");
        } else {
            out.write("{ \"success\": false, \"message\": \"Update failed\" }");
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.trim().isEmpty();
    }
}