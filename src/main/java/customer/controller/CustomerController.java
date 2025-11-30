package customer.controller;

import common.util.PasswordServices;
import customer.model.Customer;

import java.sql.Connection;
import java.sql.SQLException;

public class CustomerController {

    private final CustomerDAO customerDAO;
    private final PasswordServices passwordService;

    public CustomerController(Connection connection, PasswordServices passwordService) {
        this.customerDAO = new CustomerDAO(connection);
        this.passwordService = passwordService;
    }

    // ============= SIGNUP =============
    public int signup(Customer customer, String plainPassword) throws SQLException {
        String salt = passwordService.generateSalt();
        String hash = passwordService.hashPassword(plainPassword, salt);

        customer.setSalt(salt);
        customer.setHashedPassword(hash);

        return customerDAO.insertCustomer(customer);
    }

    // ============= LOGIN =============
    public Customer login(String email, String password) throws SQLException {
        Customer c = customerDAO.getCustomerByEmail(email);
        if (c == null)
        {
            System.out.println("Customer not found for email: " + email);
            return null;
        }

        boolean valid = passwordService.verifyPassword(password, c.getSalt(), c.getHashedPassword());
        boolean verified = c.isVerified();

        if (!valid) {
            System.out.println("password for email: " + email + " is invalid!");
        }else {
            System.out.println("password for email: " + email + " is valid!");
        }


        if (!verified) {
            System.out.println("email: " + email + " not verified! ");
        }
        else {
            System.out.println("verified: " + verified);
        }

        if(valid && verified)
        {
            return c;
        }
        else {
            return null;
        }
    }

    // ============= GET PROFILE BY ID =============
    public Customer getCustomerById(int id) throws SQLException {
        return customerDAO.getCustomerById(id);
    }

    // ============= UPDATE PROFILE =============
    public boolean updateCustomer(Customer c) throws SQLException {
        return customerDAO.updateCustomer(c);
    }

    // ============= DELETE ACCOUNT =============
    public boolean deleteCustomer(int id) throws SQLException {
        return customerDAO.deleteCustomer(id);
    }
}