package common.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.jboss.weld.context.http.Http;

import java.io.IOException;


//do not use legacy code use the front end to redirect to the correct user pages
public class SessionFactory {

    public static void redirectUser(HttpSession session , HttpServletRequest req, HttpServletResponse resp) throws IOException {
        String role = session.getAttribute("role").toString();

        if(role.equalsIgnoreCase("customer"))
        {
            resp.sendRedirect(req.getContextPath() + "/views/customer/pages/home.html");
        }
    }

}