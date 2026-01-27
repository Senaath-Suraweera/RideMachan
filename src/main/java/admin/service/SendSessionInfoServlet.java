package admin.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/admin/info")
public class SendSessionInfoServlet extends HttpServlet {

    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException
    {
        HttpSession session = request.getSession();

        try
        {
            String username = session.getAttribute("username").toString();
            String email = session.getAttribute("email").toString();
            String phoneNumber = session.getAttribute("phoneNumber").toString();

            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"success\" , \"username\":\" " + username + "\" , \"email\":\"" + email + "\" , \"phoneNumber\":\"" + phoneNumber + "\"}");
        }
        catch(Exception e)
        {
            e.printStackTrace();
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"error\" , \"message\":\"error getting session info\"}");
        }
    }
}
