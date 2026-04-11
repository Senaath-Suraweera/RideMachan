package customer.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import vehicle.dao.VehicleDAO;
import vehicle.model.Vehicle;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Connection;
import java.util.List;
import java.sql.SQLException;


@WebServlet("/customer/vehicle-details")

public class CustomerVehicleDetailsServlet extends HttpServlet {
    private final Gson gson =new Gson();
    @Override// I am intentionally overriding HttpServlet’s doGet() method
    protected void doGet(HttpServletRequest req ,HttpServletResponse resp)
            throws ServletException,IOException {
        int vehicleId = Integer.parseInt(req.getParameter("vehicleId"));


        Vehicle vehicle = VehicleDAO.getOneVehicleById(vehicleId);


        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");


        resp.getWriter().write(gson.toJson(vehicle));    }
}
