//package admin.model;
//
//import java.util.List;
//
//public class DashboardOverviewResponse {
//    public Stats stats;
//    public List<MonthlyIncomePoint> monthlyIncome;
//    public List<TopItem> topCustomers;
//    public List<TopItem> topRenters;
//
//    public static class Stats {
//        public double totalIncome;
//        public int newRentalRequests;
//        public int supportTickets;
//        public int reports;
//
//        // optional change fields (can be null)
//        public Double totalIncomeChangePercent;
//        public Integer newRentalRequestsChange;
//        public Integer supportTicketsChange;
//    }
//
//    public static class MonthlyIncomePoint {
//        public String month;   // "YYYY-MM"
//        public double amount;
//        public int bookings;
//    }
//
//    public static class TopItem {
//        public String name;
//        public int rides;      // matches your dashboard UI naming
//        public Double rating;  // can be null
//    }
//}
