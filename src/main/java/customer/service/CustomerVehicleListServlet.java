package customer.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import customer.controller.CustomerController;
import customer.controller.CustomerVehicleDAO;
import customer.model.Customer;
import common.util.PasswordServices;
import vehicle.model.Vehicle;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Connection;
import java.util.List;
import java.sql.SQLException;


@WebServlet("/customer/search/vehicle")
public class CustomerVehicleListServlet extends HttpServlet {

    private final Gson gson =new Gson(); //We create a Gson object and use its toJson() method to convert Java objects (such as a list of Vehicle objects) into JSON format so that the data can be sent to the frontend.

    @Override// I am intentionally overriding HttpServlet’s doGet() method
    protected void doGet(HttpServletRequest req ,HttpServletResponse resp)
        throws ServletException,IOException {

        resp.setContentType("application/json;charset=UTF-8");//tells the browser that the servlet response is in JSON format and encoded using UTF-8, so the client can correctly interpret the data.

        try(Connection conn = DBConnection.getConnection()) {

            CustomerVehicleDAO dao = new CustomerVehicleDAO(conn);
            List<Vehicle> vehicles = dao.getAllVehicles();

            String json = gson.toJson(vehicles);
            resp.getWriter().write(json); //Writes JSON to HTTP response body
        } catch (SQLException e) {
            resp.setStatus(500);
            //Prevents server crash
            //Sends clean error response to frontend
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            resp.getWriter().write("{\"error\":\"Database error occurred\"}");

        }

    }

}
