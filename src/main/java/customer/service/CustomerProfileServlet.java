package customer.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import customer.controller.CustomerController;
import customer.model.Customer;
import common.util.PasswordServices;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Connection;

@WebServlet("/customer/profile/info")
public class CustomerProfileServlet extends HttpServlet {

    // =========== GET PROFILE ===========
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("customerId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"not logged in\"}");
            return;
        }

        int customerId = (int) session.getAttribute("customerId");

        try (Connection conn = DBConnection.getConnection()) {

            CustomerController controller =
                    new CustomerController(conn, new PasswordServices());

            Customer c = controller.getCustomerById(customerId);

            if (c == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"error\":\"Customer not found\"}");
                return;
            }

            Gson gson = new Gson();
            resp.setContentType("application/json");
            resp.getWriter().write(gson.toJson(c));

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"server error\"}");
        }
    }


    // =========== UPDATE PROFILE ===========

    @Override

    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {
        System.out.println("PROFILE UPDATE SERVLET HIT");

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("customerId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"not logged in\"}");
            return;
        }

        int customerId = (int) session.getAttribute("customerId");

        BufferedReader reader = req.getReader();
        Gson gson = new Gson();

        JsonObject body = gson.fromJson(reader, JsonObject.class);

        try (Connection conn = DBConnection.getConnection()) {

            CustomerController controller =
                    new CustomerController(conn, new PasswordServices());

            Customer c = controller.getCustomerById(customerId);

            // Update fields
            c.setFirstname(body.get("firstname").getAsString());
            c.setLastname(body.get("lastname").getAsString());
            c.setMobileNumber(body.get("phone").getAsString());
            c.setStreet(body.get("street").getAsString());
            c.setCity(body.get("city").getAsString());
            c.setZipCode(body.get("zipCode").getAsString());
            c.setCountry(body.get("country").getAsString());

            boolean updated = controller.updateCustomer(c);

            resp.setContentType("application/json");

            if (updated) {
                resp.getWriter().write("{\"status\":\"success\"}");
            } else {
                resp.getWriter().write("{\"status\":\"failed\"}");
            }

        } catch (Exception e) {
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"update failed\"}");
        }
    }
}
