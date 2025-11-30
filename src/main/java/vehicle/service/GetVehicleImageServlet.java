package vehicle.service;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.sql.*;
import common.util.DBConnection;

@WebServlet("/vehicle/image")
public class GetVehicleImageServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String vehicleIdStr = request.getParameter("vehicleid");

        if (vehicleIdStr == null || vehicleIdStr.isEmpty()) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Vehicle ID required");
            return;
        }

        try {
            int vehicleId = Integer.parseInt(vehicleIdStr);

            try (Connection con = DBConnection.getConnection();
                 PreparedStatement ps = con.prepareStatement(
                         "SELECT vehicleimages FROM Vehicle WHERE vehicleid = ?")) {

                ps.setInt(1, vehicleId);
                ResultSet rs = ps.executeQuery();

                if (rs.next()) {
                    Blob imageBlob = rs.getBlob("vehicleimages");

                    if (imageBlob != null) {
                        response.setContentType("image/jpeg");
                        response.setContentLength((int) imageBlob.length());

                        try (InputStream in = imageBlob.getBinaryStream();
                             OutputStream out = response.getOutputStream()) {

                            byte[] buffer = new byte[4096];
                            int bytesRead;
                            while ((bytesRead = in.read(buffer)) != -1) {
                                out.write(buffer, 0, bytesRead);
                            }
                        }
                    } else {
                        response.sendError(HttpServletResponse.SC_NOT_FOUND, "Image not found");
                    }
                } else {
                    response.sendError(HttpServletResponse.SC_NOT_FOUND, "Vehicle not found");
                }
            }
        } catch (NumberFormatException e) {
            response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Invalid vehicle ID");
        } catch (SQLException e) {
            e.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Database error");
        }
    }
}