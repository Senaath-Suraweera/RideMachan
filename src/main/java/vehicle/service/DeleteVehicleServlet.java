package vehicle.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import vehicle.dao.VehicleDAO;

import java.io.IOException;

@WebServlet("/vehicle/delete")
@MultipartConfig
public class DeleteVehicleServlet extends HttpServlet {
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        request.setCharacterEncoding("UTF-8");

        try {
            int vehicleId = Integer.parseInt(request.getParameter("vehicleid"));
            boolean success = VehicleDAO.deleteVehicle(vehicleId);
            response.getWriter().write("{\"status\":\"" + (success ? "success" : "error") + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}
