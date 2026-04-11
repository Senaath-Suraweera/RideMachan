package customer.service;

import com.google.gson.Gson;
import common.util.DBConnection;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;

@WebServlet("/customer/company-name")
public class CompanyNameServlet extends HttpServlet {
    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        String companyIdStr = req.getParameter("companyId");

        if (companyIdStr == null || companyIdStr.isEmpty()) {
            resp.getWriter().write("{\"companyName\":\"N/A\"}");
            return;
        }

        try {
            int companyId = Integer.parseInt(companyIdStr);
            String companyName = getCompanyName(companyId);
            resp.getWriter().write("{\"companyName\":\"" + companyName + "\"}");
        } catch (Exception e) {
            e.printStackTrace();
            resp.getWriter().write("{\"companyName\":\"N/A\"}");
        }
    }

    private String getCompanyName(int companyId) {
        String companyName = "N/A";
        String sql = "SELECT companyname FROM RentalCompany WHERE companyid = ?";

        try (Connection con = DBConnection.getConnection();
             PreparedStatement ps = con.prepareStatement(sql)) {

            ps.setInt(1, companyId);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                companyName = rs.getString("companyname");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        return companyName;
    }
}
