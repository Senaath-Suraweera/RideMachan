package rentalcompany.drivers.service;

import common.util.DBConnection;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.OutputStream;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@WebServlet("/driver/pdf")
public class DriverPdfServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException {
        String driverId = request.getParameter("id");
        String type = request.getParameter("type"); // "nic" or "licence"

        System.out.println("=== DriverPdfServlet DEBUG ===");
        System.out.println("Received request -> driverId: " + driverId + ", type: " + type);

        if (driverId == null || type == null) {
            System.out.println("Missing parameters: driverId or type is null.");
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            return;
        }

        String column = type.equals("licence") ? "driverslicence" : "nic";
        String sql = "SELECT " + column + " FROM Driver WHERE driverid = ?";

        System.out.println("Resolved column: " + column);
        System.out.println("SQL Query: " + sql);

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            System.out.println("Database connection established.");
            ps.setInt(1, Integer.parseInt(driverId));
            System.out.println("Executing query with driverId: " + driverId);

            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                byte[] pdfData = rs.getBytes(column);
                if (pdfData != null && pdfData.length > 0) {
                    System.out.println("PDF found. Size: " + pdfData.length + " bytes");
                    response.setContentType("application/pdf");
                    response.setHeader("Content-Disposition", "inline; filename=" + type + ".pdf");
                    OutputStream out = response.getOutputStream();
                    out.write(pdfData);
                    out.flush();
                    System.out.println("PDF streamed successfully to response.");
                } else {
                    System.out.println("No PDF found for driverId " + driverId + " in column " + column);
                    response.getWriter().write("No PDF found for this driver.");
                }
            } else {
                System.out.println("Driver with ID " + driverId + " not found.");
                response.getWriter().write("Driver not found.");
            }
        } catch (Exception e) {
            System.out.println("Error while retrieving PDF for driverId " + driverId);
            e.printStackTrace();
            throw new ServletException("Error retrieving PDF", e);
        }

        System.out.println("=== End DriverPdfServlet DEBUG ===");
    }
}
