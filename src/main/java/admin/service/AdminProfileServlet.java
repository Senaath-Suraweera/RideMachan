package admin.service;

import admin.controller.AdminController;
import admin.model.Admin;
import com.google.gson.JsonObject;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import java.io.IOException;

@WebServlet("/admin/profile")
public class AdminProfileServlet extends HttpServlet {

    private void addCors(HttpServletResponse resp) {
        resp.setHeader("Access-Control-Allow-Origin", "*");
        resp.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    @Override
    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        addCors(resp);
        resp.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        addCors(response);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            AdminController controller = new AdminController();
            Admin admin = null;

            HttpSession session = request.getSession(false);

            if (session != null) {
                Object adminIdObj = session.getAttribute("actorId");
                Object emailObj = session.getAttribute("email");

                if (adminIdObj != null) {
                    try {
                        int adminId = Integer.parseInt(String.valueOf(adminIdObj));
                        for (Admin a : AdminController.getAllAdmins()) {
                            if (a.getAdminId() == adminId) {
                                admin = a;
                                break;
                            }
                        }
                    } catch (Exception ignored) {
                    }
                }

                if (admin == null && emailObj != null) {
                    admin = controller.getAdminByEmail(String.valueOf(emailObj));
                }
            }

            if (admin == null) {
                String email = request.getParameter("email");
                if (email != null && !email.trim().isEmpty()) {
                    admin = controller.getAdminByEmail(email.trim());
                }
            }

            if (admin == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Admin not found\"}");
                return;
            }

            JsonObject json = new JsonObject();
            json.addProperty("status", "success");
            json.addProperty("adminId", admin.getAdminId());
            json.addProperty("username", admin.getUsername());
            json.addProperty("email", admin.getEmail());
            json.addProperty("phoneNumber", admin.getPhoneNumber() == null ? "" : admin.getPhoneNumber());

            response.setStatus(HttpServletResponse.SC_OK);
            response.getWriter().write(json.toString());

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}");
        }
    }
}