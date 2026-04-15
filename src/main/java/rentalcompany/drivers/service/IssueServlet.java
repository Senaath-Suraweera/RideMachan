package rentalcompany.drivers.service;

import com.google.gson.Gson;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;

import rentalcompany.drivers.controller.DriverDAO;
import rentalcompany.drivers.model.Issue;

import java.io.*;
import java.nio.file.*;
import java.util.*;

@WebServlet("/IssueServlet")
@MultipartConfig(
        fileSizeThreshold = 1024 * 1024 * 2,
        maxFileSize = 1024 * 1024 * 5,
        maxRequestSize = 1024 * 1024 * 10
)
public class IssueServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    // ✅ SAFE upload folder (outside redeploy zone)
    private static final String UPLOAD_DIR = "C:/RideMachan/uploads/issues";

    private final Gson gson = new Gson();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp)
            throws IOException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("driverId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"success\":false,\"message\":\"Unauthorized\"}");
            out.flush();
            return;
        }

        int driverId = (int) session.getAttribute("driverId");
        String action = req.getParameter("action");

        System.out.println("Driver ID from session = " + driverId);

        try {
            if ("getAll".equals(action)) {

                List<Issue> issues = DriverDAO.getIssuesByDriverId(driverId);

                Map<String, Object> result = new HashMap<>();
                result.put("success", true);
                result.put("issues", issues);

                out.print(gson.toJson(result));

            } else if ("getById".equals(action)) {

                int issueId = Integer.parseInt(req.getParameter("issueId"));
                Issue issue = DriverDAO.getIssueById(issueId, driverId);

                Map<String, Object> result = new HashMap<>();
                result.put("success", issue != null);
                result.put("issue", issue);

                out.print(gson.toJson(result));

            } else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\":false,\"message\":\"Invalid action\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\":false,\"message\":\"Server error\"}");
        }

        out.flush();
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp)
            throws IOException, ServletException {

        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");

        PrintWriter out = resp.getWriter();

        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("driverId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            out.print("{\"success\":false,\"message\":\"Unauthorized\"}");
            return;
        }

        int driverId = (int) session.getAttribute("driverId");

        String action = req.getParameter("action");

        System.out.println("POST ACTION = " + action);

        try {

            // ============================
            // CREATE ISSUE
            // ============================
            if ("create".equalsIgnoreCase(action)) {

                Issue issue = new Issue();

                issue.setDriverId(driverId);
                issue.setCategory(req.getParameter("category"));
                issue.setLocation(req.getParameter("location"));
                issue.setDescription(req.getParameter("description"));
                issue.setBookingId(req.getParameter("bookingId"));
                issue.setPlateNumber(req.getParameter("plateNumber"));
                issue.setStatus("pending");

                // driveable
                String driveable = req.getParameter("driveable");
                issue.setIsDriveable("yes".equalsIgnoreCase(driveable));

                // photo upload
                Part photo = req.getPart("photo");
                if (photo != null && photo.getSize() > 0) {
                    issue.setPhotoPath(saveFile(photo));
                }

                // DEBUG LOGS (VERY IMPORTANT)
                System.out.println("Creating issue for driver = " + driverId);
                System.out.println("Category = " + issue.getCategory());
                System.out.println("Location = " + issue.getLocation());

                int issueId = DriverDAO.createIssue(issue);

                System.out.println("Inserted Issue ID = " + issueId);

                if (issueId > 0) {
                    out.print("{\"success\":true,\"issueId\":" + issueId + "}");
                } else {
                    out.print("{\"success\":false,\"message\":\"Insert failed\"}");
                }

            }

            // ============================
            // DELETE ISSUE
            // ============================
            else if ("delete".equalsIgnoreCase(action)) {

                int issueId = Integer.parseInt(req.getParameter("issueId"));

                boolean deleted = DriverDAO.deleteIssue(issueId, driverId);

                out.print("{\"success\":" + deleted + "}");

            }

            else {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.print("{\"success\":false,\"message\":\"Invalid action\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.print("{\"success\":false,\"message\":\"Server error\"}");
        }

        out.flush();
    }

    // =============================
    // File Save (SAFE)
    // =============================
    private String saveFile(Part part) throws IOException {

        File dir = new File(UPLOAD_DIR);
        if (!dir.exists()) dir.mkdirs();

        String ext = "";
        String name = part.getSubmittedFileName();
        if (name != null && name.contains(".")) {
            ext = name.substring(name.lastIndexOf("."));
        }

        String fileName = UUID.randomUUID() + ext;
        Path path = Paths.get(UPLOAD_DIR, fileName);

        Files.copy(part.getInputStream(), path, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/issues/" + fileName;
    }
}
