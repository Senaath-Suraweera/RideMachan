package rentalcompany.management.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.io.PrintWriter;
import com.google.gson.JsonObject;

@WebServlet("/checklogin")
public class CheckLoginServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        // Set response type to JSON
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        PrintWriter out = response.getWriter();
        JsonObject json = new JsonObject();

        // Get existing session, do NOT create a new one
        HttpSession session = request.getSession(false);

        if (session != null && session.getAttribute("rentalcompany") != null) {
            // User is logged in
            json.addProperty("status", "loggedin");
        } else {
            // User not logged in
            json.addProperty("status", "notloggedin");
        }

        out.print(json.toString());
        out.flush();
    }
}
