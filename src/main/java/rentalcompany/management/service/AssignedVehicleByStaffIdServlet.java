package rentalcompany.management.service;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import rentalcompany.companyvehicle.model.Vehicle;
import rentalcompany.management.controller.RentalCompanyDAO;

import java.io.IOException;
import java.util.List;

@WebServlet("/display/assigned/vehicles/bystaffId")
public class AssignedVehicleByStaffIdServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {

            int staffId = Integer.parseInt(request.getParameter("staffId"));

            List<Vehicle> vehicles = RentalCompanyDAO.getAssignedVehiclesByStaffId(staffId);

            Gson gson = new Gson();
            String json = gson.toJson(vehicles);

            response.getWriter().write(json);

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            response.getWriter().write("{\"error\":\"Server error\"}");
        }
    }
}