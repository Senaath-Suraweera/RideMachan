package customer.controller;

import customer.model.Customer;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class CustomerDAO {

    private final Connection connection;

    public CustomerDAO(Connection connection) {
        this.connection = connection;
    }

    // ============= INSERT =============
    public int insertCustomer(Customer c) throws SQLException {
        String sql = "INSERT INTO Customer (username, firstname, lastname, email, mobilenumber, hashedpassword, salt, "
                + "customer_type, street, city, zip_code, country, nic_number, nic_image, "
                + "drivers_license_number, drivers_license_image, passport_number, international_drivers_license_number) "
                + "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        try (PreparedStatement ps = connection.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            int i = 1;
            ps.setString(i++, c.getUsername());
            ps.setString(i++, c.getFirstname());
            ps.setString(i++, c.getLastname());
            ps.setString(i++, c.getEmail());
            ps.setString(i++, c.getMobileNumber());
            ps.setString(i++, c.getHashedPassword());
            ps.setString(i++, c.getSalt());
            ps.setString(i++, c.getCustomerType());

            ps.setString(i++, c.getStreet());
            ps.setString(i++, c.getCity());
            ps.setString(i++, c.getZipCode());
            ps.setString(i++, c.getCountry());

            if ("LOCAL".equalsIgnoreCase(c.getCustomerType())) {
                ps.setString(i++, c.getNicNumber());
                if (c.getNicImage() != null) ps.setBytes(i++, c.getNicImage()); else ps.setNull(i++, Types.BLOB);
                ps.setString(i++, c.getDriversLicenseNumber());
                if (c.getDriversLicenseImage() != null) ps.setBytes(i++, c.getDriversLicenseImage()); else ps.setNull(i++, Types.BLOB);
                ps.setNull(i++, Types.VARCHAR); // passport_number
                ps.setNull(i++, Types.VARCHAR); // international license
            } else {
                ps.setNull(i++, Types.VARCHAR); // nic_number
                ps.setNull(i++, Types.BLOB);    // nic_image
                ps.setNull(i++, Types.VARCHAR); // drivers_license_number
                ps.setNull(i++, Types.BLOB);    // drivers_license_image
                ps.setString(i++, c.getPassportNumber());
                ps.setString(i++, c.getInternationalDriversLicenseNumber());
            }

            ps.executeUpdate();

            try (ResultSet rs = ps.getGeneratedKeys()) {
                if (rs.next()) return rs.getInt(1);
            }
        }
        return -1;
    }

    // ============= GET BY EMAIL =============
    public Customer getCustomerByEmail(String email) throws SQLException {
        String sql = "SELECT * FROM Customer WHERE email = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return extractCustomer(rs);
                }
            }
        }
        return null;
    }

    // ============= GET BY ID =============
    public Customer getCustomerById(int id) throws SQLException {
        String sql = "SELECT * FROM Customer WHERE customerid = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setInt(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return extractCustomer(rs);
                }
            }
        }
        return null;
    }

    // ============= UPDATE =============
    public boolean updateCustomer(Customer c) throws SQLException {
        String sql = "UPDATE Customer SET firstname=?, lastname=?, mobilenumber=?, street=?, city=?, zip_code=?, country=?, "
                + "nic_number=?, nic_image=?, drivers_license_number=?, drivers_license_image=?, "
                + "passport_number=?, international_drivers_license_number=? "
                + "WHERE customerid=?";

        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            int i = 1;
            ps.setString(i++, c.getFirstname());
            ps.setString(i++, c.getLastname());
            ps.setString(i++, c.getMobileNumber());
            ps.setString(i++, c.getStreet());
            ps.setString(i++, c.getCity());
            ps.setString(i++, c.getZipCode());
            ps.setString(i++, c.getCountry());

            ps.setString(i++, c.getNicNumber());
            if (c.getNicImage() != null) ps.setBytes(i++, c.getNicImage()); else ps.setNull(i++, Types.BLOB);
            ps.setString(i++, c.getDriversLicenseNumber());
            if (c.getDriversLicenseImage() != null) ps.setBytes(i++, c.getDriversLicenseImage()); else ps.setNull(i++, Types.BLOB);

            ps.setString(i++, c.getPassportNumber());
            ps.setString(i++, c.getInternationalDriversLicenseNumber());
            ps.setInt(i++, c.getCustomerId());

            return ps.executeUpdate() > 0;
        }
    }

    // ============= DELETE =============
    public boolean deleteCustomer(int id) throws SQLException {
        String sql = "DELETE FROM Customer WHERE customerid = ?";
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setInt(1, id);
            return ps.executeUpdate() > 0;
        }
    }

    // ============= LIST ALL =============
    public List<Customer> getAllCustomers() throws SQLException {
        List<Customer> list = new ArrayList<>();
        String sql = "SELECT * FROM Customer";
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            while (rs.next()) {
                list.add(extractCustomer(rs));
            }
        }
        return list;
    }

    // ============= HELPER =============
    private Customer extractCustomer(ResultSet rs) throws SQLException {
        Customer c = new Customer();
        c.setCustomerId(rs.getInt("customerid"));
        c.setUsername(rs.getString("username"));
        c.setFirstname(rs.getString("firstname"));
        c.setLastname(rs.getString("lastname"));
        c.setEmail(rs.getString("email"));
        c.setMobileNumber(rs.getString("mobilenumber"));
        c.setHashedPassword(rs.getString("hashedpassword"));
        c.setSalt(rs.getString("salt"));
        c.setCustomerType(rs.getString("customer_type"));
        c.setStreet(rs.getString("street"));
        c.setCity(rs.getString("city"));
        c.setZipCode(rs.getString("zip_code"));
        c.setCountry(rs.getString("country"));
        c.setNicNumber(rs.getString("nic_number"));
        c.setNicImage(rs.getBytes("nic_image"));
        c.setDriversLicenseNumber(rs.getString("drivers_license_number"));
        c.setDriversLicenseImage(rs.getBytes("drivers_license_image"));
        c.setPassportNumber(rs.getString("passport_number"));
        c.setInternationalDriversLicenseNumber(rs.getString("international_drivers_license_number"));
        c.setVerified(rs.getBoolean("verified"));
        return c;
    }
}
