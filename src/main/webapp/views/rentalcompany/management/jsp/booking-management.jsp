<%@ page import="java.sql.*, common.util.DBConnection" %>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bookings Management - ABC Rentals</title>
    <link rel="stylesheet" href="../css/booking-management.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
<div class="dashboard-container">

    <!-- Sidebar (same as before) -->
    <aside class="sidebar">
        <div class="logo-section">
            <img src="../assets/ridemachan-logo.png" alt="RideMachan Logo" class="logo">
        </div>
        <nav class="nav-menu">
            <ul>
                <li class="nav-item">
                    <a href="homepage.html" class="nav-link">
                        <i class="fas fa-home"></i>
                        <span>Dashboard</span>
                    </a>
                </li>
                <li class="nav-item active">
                    <a href="booking-management.jsp" class="nav-link">
                        <i class="fas fa-box"></i>
                        <span>Bookings</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="vehicle-fleet.html" class="nav-link">
                        <i class="fas fa-car"></i>
                        <span>Vehicle Fleet</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="maintenance-staff.html" class="nav-link">
                        <i class="fas fa-tools"></i>
                        <span>Maintenance Staff</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a href="driver-management.html" class="nav-link">
                        <i class="fas fa-users"></i>
                        <span>Drivers</span>
                    </a>
                </li>
            </ul>
        </nav>
        <div class="logout-section">
            <a href="#" class="nav-link">
                <i class="fas fa-sign-out"></i>
                <span>Logout</span>
            </a>
        </div>
    </aside>

    <!-- Main Content -->
    <div class="main-content">
        <header class="header">
            <div class="header-left">
                <div class="breadcrumb">
                    <i class="fas fa-th-large"></i>
                    <span>Company Dashboard</span>
                </div>
            </div>
            <div class="header-right">
                <div class="notification-icon">
                    <a href="notification.html">
                        <i class="fas fa-bell"></i>
                        <span class="notification-badge">1</span>
                    </a>
                </div>
                <div class="user-profile">
                    <div class="user-avatar">A</div>
                    <span class="user-name">ABC Rentals</span>
                </div>
            </div>
        </header>

        <div class="page-content">
            <div class="page-header">
                <div class="page-title-section">
                    <h1 class="page-title">Bookings Management</h1>
                    <p class="page-subtitle">View and manage all vehicle bookings</p>
                </div>
            </div>

            <div class="filters-section">
                <div class="search-bar">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Search by booking ID, customer name, or vehicle..." id="searchInput">
                </div>
                <div class="filter-dropdown">
                    <select id="statusFilter">
                        <option value="all">All Bookings</option>
                        <option value="active">Active</option>
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <i class="fas fa-filter"></i>
                </div>
            </div>

            <div class="bookings-grid" id="bookingsGrid">
                <h1>Bookings</h1>

                <%
                    Connection conn = null;
                    PreparedStatement ps = null;
                    ResultSet rs = null;

                    try {
                        conn = DBConnection.getConnection();

                        String sql = "SELECT * FROM companybookings ORDER BY booked_Date DESC";
                        ps = conn.prepareStatement(sql);
                        rs = ps.executeQuery();

                        while(rs.next()) {
                            int bookingId = rs.getInt("booking_id");
                            int companyId = rs.getInt("companyid");
                            String status = rs.getString("status");
                            java.sql.Date bookedDate = rs.getDate("booked_Date");
                            String paymentStatus = rs.getString("payment_status");
                            java.math.BigDecimal totalAmount = rs.getBigDecimal("total_amount");

                            // Sample: fetch customer name (replace with actual query)
                            String customerName = "Customer"; 
                            String customerContact = "+94-XXX-XXXX";
                            String customerEmail = "customer@email.com";

                            // Sample: fetch vehicle name and plate
                            String vehicleName = "Vehicle";
                            String vehiclePlate = "ABC-123";

                            // Sample: fetch driver
                            String driverName = "Driver";
                %>

                <div class="booking-card" data-status="<%= status.toLowerCase() %>">
                    <div class="booking-header">
                        <div class="booking-info">
                            <h3 class="booking-id">Booking <%= bookingId %></h3>
                            <span class="booking-date">Booked on <%= bookedDate %></span>
                            <span class="status-badge status-<%= status.toLowerCase() %>"><%= status %></span>
                        </div>
                        <div class="booking-amount">
                            <span class="amount">Rs <%= totalAmount %></span>
                            <span class="payment-status <%= paymentStatus.equalsIgnoreCase("Paid") ? "paid" : "pending" %>">
                                Payment: <%= paymentStatus %>
                            </span>
                        </div>
                    </div>

                    <div class="booking-details">
                        <div class="detail-section">
                            <div class="section-header">
                                <i class="fas fa-user"></i>
                                <span>Customer Details</span>
                            </div>
                            <div class="section-content">
                                <p class="customer-name"><%= customerName %></p>
                                <p class="customer-contact"><i class="fas fa-phone"></i> <%= customerContact %></p>
                                <p class="customer-email"><%= customerEmail %></p>
                            </div>
                        </div>

                        <div class="detail-section">
                            <div class="section-header">
                                <i class="fas fa-car"></i>
                                <span>Vehicle & Driver</span>
                            </div>
                            <div class="section-content">
                                <p class="vehicle-name"><%= vehicleName %></p>
                                <p class="vehicle-plate">Plate: <%= vehiclePlate %></p>
                                <p class="driver-name">Driver: <%= driverName %></p>
                            </div>
                        </div>
                    </div>
                </div>

                <%
                        } // end while
                    } catch(Exception e) {
                        out.println("Error: " + e.getMessage());
                    } finally {
                        try { if(rs != null) rs.close(); } catch(Exception e) {}
                        try { if(ps != null) ps.close(); } catch(Exception e) {}
                        try { if(conn != null) conn.close(); } catch(Exception e) {}
                    }
                %>

            </div>
        </div>
    </div>
</div>

<script src="../js/booking-management.js"></script>
<script src="../js/sidebar.js"></script>
</body>
</html>
