//package admin.service;
//
//import admin.controller.DashboardController;
//import admin.model.DashboardOverviewResponse;
//import admin.controller.JsonUtil;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.annotation.WebServlet;
//import jakarta.servlet.http.HttpServlet;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//
//import java.io.IOException;
//
//@WebServlet(name = "AdminDashboardApiServlet", urlPatterns = {
//        "/admin/dashboard/overview"
//})
//public class AdminDashboardApiServlet extends HttpServlet {
//
//    private final DashboardController controller = new DashboardController();
//
//    @Override
//    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
//
//        // If frontend is in different origin, keep this (or tighten it)
//        resp.setHeader("Access-Control-Allow-Origin", "*");
//        resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
//        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//
//        resp.setContentType("application/json");
//        resp.setCharacterEncoding("UTF-8");
//
//        int months = 6;
//        try {
//            String m = req.getParameter("months");
//            if (m != null && !m.trim().isEmpty()) months = Integer.parseInt(m.trim());
//        } catch (Exception ignored) {}
//
//        try {
//            DashboardOverviewResponse data = controller.getOverview(months);
//            resp.getWriter().write(JsonUtil.toJson(data));
//        } catch (Exception e) {
//            resp.setStatus(500);
//            resp.getWriter().write("{\"error\":\"Dashboard query failed\",\"details\":\"" +
//                    e.getMessage().replace("\"", "\\\"") + "\"}");
//        }
//    }
//
//    @Override
//    protected void doOptions(HttpServletRequest req, HttpServletResponse resp) throws IOException {
//        resp.setHeader("Access-Control-Allow-Origin", "*");
//        resp.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
//        resp.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//        resp.setStatus(204);
//    }
//}
