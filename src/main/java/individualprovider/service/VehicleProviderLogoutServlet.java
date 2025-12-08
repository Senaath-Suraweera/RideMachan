package individualprovider.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/provider/logout")
public class VehicleProviderLogoutServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
            response.getWriter().write("{\"status\":\"success\",\"message\":\"Logout successful\"}");
        } else {
            response.getWriter().write("{\"status\":\"error\",\"message\":\"No active session\"}");
        }
    }
}
