package rentalcompany.management.service;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import rentalcompany.management.controller.RentalCompanyDAO;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@WebServlet("/provider/accept")
public class AcceptProviderRequestServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws ServletException, IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        Map<String, Object> result = new HashMap<>();
        Gson gson = new Gson();

        try {
            HttpSession session = req.getSession(false);

            if (session == null || session.getAttribute("companyId") == null) {
                resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                result.put("success", false);
                result.put("error", "Not logged in");
                resp.getWriter().write(gson.toJson(result));
                return;
            }

            int companyId = (int) session.getAttribute("companyId");
            int vehicleId = Integer.parseInt(req.getParameter("vehicleId"));

            boolean ok = RentalCompanyDAO.acceptProviderRequest(companyId, vehicleId);

            result.put("success", ok);
            if (!ok) result.put("error", "Could not accept request");

            resp.getWriter().write(gson.toJson(result));

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            result.put("success", false);
            result.put("error", e.getMessage());
            resp.getWriter().write(gson.toJson(result));
        }
    }
}