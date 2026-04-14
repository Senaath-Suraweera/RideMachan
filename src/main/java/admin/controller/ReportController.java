package admin.controller;

import common.util.DBConnection;
import admin.model.Report;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ReportController {

    private static Connection con = null;

    // Parse numeric id OR RPT-2026-001
    private static int parseReportId(String idOrCode) {
        if (idOrCode == null) return -1;
        idOrCode = idOrCode.trim();

        if (idOrCode.matches("\\d+")) return Integer.parseInt(idOrCode);

        if (idOrCode.startsWith("RPT-")) {
            String[] parts = idOrCode.split("-");
            if (parts.length >= 3 && parts[2].matches("\\d+")) {
                return Integer.parseInt(parts[2]);
            }
        }
        return -1;
    }

    // LIST for report-view.html filters: status(pending/reviewed/resolved), category(vehicle..), role(Driver/Customer)
    public static List<Report> listReports(String statusUI, String category, String roleUI, String search) {
        List<Report> list = new ArrayList<>();

        String statusDB = null;
        if (statusUI != null && !statusUI.isEmpty()) {
            statusDB = switch (statusUI.toLowerCase()) {
                case "pending" -> "Pending";
                case "reviewed" -> "Reviewed";
                case "resolved" -> "Resolved";
                case "closed" -> "Closed";
                default -> null;
            };
        }

        String reportedRoleDB = null;
        if (roleUI != null && !roleUI.isEmpty()) {
            reportedRoleDB = switch (roleUI.toLowerCase()) {
                case "driver" -> "DRIVER";
                case "customer" -> "CUSTOMER";
                case "company" -> "COMPANY";
                default -> null;
            };
        }

        try {
            con = DBConnection.getConnection();

            StringBuilder sql = new StringBuilder(
                    "SELECT report_id, subject, category, reported_role, created_at, status, priority " +
                            "FROM Report WHERE 1=1"
            );

            List<Object> params = new ArrayList<>();

            if (statusDB != null) {
                sql.append(" AND status=?");
                params.add(statusDB);
            }
            if (category != null && !category.isEmpty()) {
                sql.append(" AND category=?");
                params.add(category.toLowerCase());
            }
            if (reportedRoleDB != null) {
                sql.append(" AND reported_role=?");
                params.add(reportedRoleDB);
            }
            if (search != null && !search.trim().isEmpty()) {
                sql.append(" AND (subject LIKE ? OR description LIKE ? OR reporter_name LIKE ?)");
                String q = "%" + search.trim() + "%";
                params.add(q);
                params.add(q);
                params.add(q);
            }

            sql.append(" ORDER BY created_at DESC");

            PreparedStatement ps = con.prepareStatement(sql.toString());
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));

            ResultSet rs = ps.executeQuery();
            while (rs.next()) {
                Report r = new Report();
                r.setReportId(rs.getInt("report_id"));
                r.setSubject(rs.getString("subject"));
                r.setCategory(rs.getString("category")); // vehicle/behavior...
                r.setReportedRole(rs.getString("reported_role")); // DRIVER/CUSTOMER
                r.setCreatedAt(String.valueOf(rs.getTimestamp("created_at")));
                r.setStatus(rs.getString("status"));     // Pending/Reviewed/Resolved/Closed
                r.setPriority(rs.getString("priority")); // Low/Medium/High/Urgent
                list.add(r);
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return list;
    }

    public static Report getReport(String idOrCode) {
        int reportId = parseReportId(idOrCode);
        if (reportId <= 0) return null;

        try {
            con = DBConnection.getConnection();

            PreparedStatement ps = con.prepareStatement("SELECT * FROM Report WHERE report_id=?");
            ps.setInt(1, reportId);

            ResultSet rs = ps.executeQuery();
            if (!rs.next()) return null;

            Report r = new Report();
            r.setReportId(rs.getInt("report_id"));
            r.setCategory(rs.getString("category"));
            r.setStatus(rs.getString("status"));
            r.setPriority(rs.getString("priority"));
            r.setSubject(rs.getString("subject"));
            r.setDescription(rs.getString("description"));
            r.setReportedRole(rs.getString("reported_role"));
            r.setReportedId(rs.getInt("reported_id"));
            r.setReporterRole(rs.getString("reporter_role"));
            r.setReporterId(rs.getInt("reporter_id"));
            r.setReporterName(rs.getString("reporter_name"));
            r.setReporterEmail(rs.getString("reporter_email"));
            r.setReporterPhone(rs.getString("reporter_phone"));
            r.setCreatedAt(String.valueOf(rs.getTimestamp("created_at")));
            r.setUpdatedAt(String.valueOf(rs.getTimestamp("updated_at")));
            return r;

        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    // Full update (send ALL fields if you follow same pattern as tickets)
    public static boolean updateReport(int reportId, String status, String priority) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "UPDATE Report SET status=?, priority=? WHERE report_id=?"
            );
            ps.setString(1, status);
            ps.setString(2, priority);
            ps.setInt(3, reportId);
            return ps.executeUpdate() > 0;

        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    // Images
    public static int addImage(int reportId, byte[] bytes) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "INSERT INTO ReportImage(report_id, image_data) VALUES(?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            ps.setInt(1, reportId);
            ps.setBytes(2, bytes);

            int rows = ps.executeUpdate();
            if (rows > 0) {
                ResultSet keys = ps.getGeneratedKeys();
                if (keys.next()) return keys.getInt(1);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return -1;
    }

    public static byte[] getImage(int imageId) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "SELECT image_data FROM ReportImage WHERE image_id=?"
            );
            ps.setInt(1, imageId);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return rs.getBytes("image_data");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return null;
    }

    public static boolean deleteImage(int imageId) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "DELETE FROM ReportImage WHERE image_id=?"
            );
            ps.setInt(1, imageId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static List<Integer> listImageIds(int reportId) {
        List<Integer> ids = new ArrayList<>();
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "SELECT image_id FROM ReportImage WHERE report_id=? ORDER BY created_at DESC"
            );
            ps.setInt(1, reportId);
            ResultSet rs = ps.executeQuery();
            while (rs.next()) ids.add(rs.getInt("image_id"));
        } catch (Exception e) {
            e.printStackTrace();
        }
        return ids;
    }

    public static boolean deleteReport(int reportId) {
        try {
            con = DBConnection.getConnection();
            PreparedStatement ps = con.prepareStatement(
                    "DELETE FROM Report WHERE report_id=?"
            );
            ps.setInt(1, reportId);
            return ps.executeUpdate() > 0;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    public static java.util.Map<String, Integer> getReportStats() {
        java.util.Map<String, Integer> stats = new java.util.HashMap<>();

        stats.put("total", 0);
        stats.put("pending", 0);
        stats.put("resolved", 0);
        stats.put("highPriority", 0);

        try {
            con = DBConnection.getConnection();

            String sql = """
            SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) AS resolved,
                SUM(CASE WHEN priority = 'High' OR priority = 'Urgent' THEN 1 ELSE 0 END) AS highPriority
            FROM Report
        """;

            PreparedStatement ps = con.prepareStatement(sql);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                stats.put("total", rs.getInt("total"));
                stats.put("pending", rs.getInt("pending"));
                stats.put("resolved", rs.getInt("resolved"));
                stats.put("highPriority", rs.getInt("highPriority"));
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return stats;
    }

 //=========================================================================

    public static int createReport(Report r) {
        try {
            con = DBConnection.getConnection();

            String sql = "INSERT INTO Report " +
                    "(category, status, priority, subject, description, " +
                    " reported_role, reported_id, reporter_role, reporter_id, " +
                    " reporter_name, reporter_email, reporter_phone) " +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            PreparedStatement ps = con.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, r.getCategory());                                     // vehicle/behavior/payment/app/safety
            ps.setString(2, r.getStatus() == null ? "Pending" : r.getStatus());   // default Pending
            ps.setString(3, r.getPriority() == null ? "Low" : r.getPriority());   // default Low
            ps.setString(4, r.getSubject());
            ps.setString(5, r.getDescription());
            ps.setString(6, r.getReportedRole());    // DRIVER / COMPANY
            ps.setInt(7, r.getReportedId());
            ps.setString(8, r.getReporterRole());    // CUSTOMER
            ps.setInt(9, r.getReporterId());
            ps.setString(10, r.getReporterName());
            ps.setString(11, r.getReporterEmail());
            ps.setString(12, r.getReporterPhone());

            int rows = ps.executeUpdate();
            if (rows > 0) {
                ResultSet keys = ps.getGeneratedKeys();
                if (keys.next()) return keys.getInt(1);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return -1;
    }

}
