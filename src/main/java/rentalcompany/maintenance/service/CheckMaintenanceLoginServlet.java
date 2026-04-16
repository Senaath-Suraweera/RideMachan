package rentalcompany.maintenance.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import java.io.IOException;
import java.io.PrintWriter;

@WebServlet("/check/login/maintenance")
public class CheckMaintenanceLoginServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        HttpSession session = request.getSession(false);

        if (session != null && session.getAttribute("staff_id") != null) {
            int staffId = (int) session.getAttribute("staff_id");

            String firstName = session.getAttribute("staffFName") != null
                    ? session.getAttribute("staffFName").toString()
                    : "";

            String lastName = session.getAttribute("staffLName") != null
                    ? session.getAttribute("staffLName").toString()
                    : "";

            out.print("{");
            out.print("\"loggedIn\":true,");
            out.print("\"staffId\":" + staffId + ",");
            out.print("\"actorId\":" + staffId + ",");
            out.print("\"firstname\":\"" + escapeJson(firstName) + "\",");
            out.print("\"lastname\":\"" + escapeJson(lastName) + "\"");
            out.print("}");
        } else {
            out.print("{\"loggedIn\":false}");
        }
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}