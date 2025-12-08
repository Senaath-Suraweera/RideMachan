package customer.service;

import common.util.DBConnection;
import common.util.PasswordServices;
import customer.controller.CustomerController;
import customer.model.Customer;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.SQLException;

@WebServlet("/customer/login")
public class CustomerLoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        req.setCharacterEncoding("UTF-8");
        resp.setContentType("application/json;charset=UTF-8");

        String email = req.getParameter("email");
        String password = req.getParameter("password");

        try (Connection conn = DBConnection.getConnection();
             PrintWriter out = resp.getWriter()) {

            PasswordServices passwordService = new PasswordServices();
            CustomerController controller = new CustomerController(conn, passwordService);

            Customer customer = controller.login(email, password);

            if (customer != null) {

                HttpSession session = req.getSession(true);
                session.setAttribute("customerId", customer.getCustomerId());
                session.setAttribute("username", customer.getUsername());
                session.setAttribute("firstname", customer.getFirstname());
                session.setAttribute("email", customer.getEmail());
                session.setAttribute("customerType", customer.getCustomerType());


                resp.setStatus(HttpServletResponse.SC_OK);
                out.write("{\"status\":\"success\",\"message\":\"Login successful\"}");
            } else {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                out.write("{\"status\":\"error\",\"message\":\"Invalid email or password\"}");
            }


//            if (customer != null)
//            {
//                HttpSession session = req.getSession();
//                session.setAttribute("email", email);
//                resp.sendRedirect(req.getContextPath() + "/views/landing/otp.html");
//
//                resp.setStatus(HttpServletResponse.SC_OK);
//                out.write("{\"status\":\"success\",\"message\":\"Login successful\"}");
//            }
//            else
//            {
//                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
//                out.write("{\"status\":\"error\",\"message\":\"Invalid email or password\"}");
//            }


        } catch (SQLException e) {
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"status\":\"error\",\"message\":\"Database error: " + e.getMessage() + "\"}");
        }
    }
}
