package customer.service;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import common.util.DBConnection;
import customer.controller.CustomerController;
import customer.model.Customer;
import common.util.PasswordServices;

import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.*;
import java.io.BufferedReader;
import java.io.IOException;
import java.sql.Connection;

@WebServlet("/customer/profile/info")
public class CustomerProfileServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("customerId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"not logged in\"}");
            return;
        }

        int customerId = (int) session.getAttribute("customerId");

        try (Connection conn = DBConnection.getConnection()) {
            CustomerController controller = new CustomerController(conn, new PasswordServices());
            Customer c = controller.getCustomerById(customerId);

            if (c == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"error\":\"Customer not found\"}");
                return;
            }

            // Build a clean DTO (don't expose password hash, salt, raw image bytes)
            JsonObject dto = new JsonObject();
            dto.addProperty("username", c.getUsername());
            dto.addProperty("firstname", c.getFirstname());
            dto.addProperty("lastname", c.getLastname());
            dto.addProperty("email", c.getEmail());
            dto.addProperty("mobileNumber", c.getMobileNumber());
            dto.addProperty("customerType", c.getCustomerType());
            dto.addProperty("street", c.getStreet());
            dto.addProperty("city", c.getCity());
            dto.addProperty("zipCode", c.getZipCode());
            dto.addProperty("country", c.getCountry());

            if ("LOCAL".equalsIgnoreCase(c.getCustomerType())) {
                dto.addProperty("nicNumber", c.getNicNumber());
                dto.addProperty("driversLicenseNumber", c.getDriversLicenseNumber());
                dto.addProperty("hasNicImage", c.getNicImage() != null && c.getNicImage().length > 0);
                dto.addProperty("hasLicenseImage", c.getDriversLicenseImage() != null && c.getDriversLicenseImage().length > 0);
            } else {
                dto.addProperty("passportNumber", c.getPassportNumber());
                dto.addProperty("internationalDriversLicenseNumber", c.getInternationalDriversLicenseNumber());
                dto.addProperty("hasPassportImage", c.getNicImage() != null && c.getNicImage().length > 0);
                dto.addProperty("hasLicenseImage", c.getDriversLicenseImage() != null && c.getDriversLicenseImage().length > 0);
            }

            resp.setContentType("application/json");
            resp.getWriter().write(new Gson().toJson(dto));

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("{\"error\":\"server error\"}");
        }
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws IOException {
        HttpSession session = req.getSession(false);
        if (session == null || session.getAttribute("customerId") == null) {
            resp.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            resp.getWriter().write("{\"error\":\"not logged in\"}");
            return;
        }

        int customerId = (int) session.getAttribute("customerId");

        try (BufferedReader reader = req.getReader();
             Connection conn = DBConnection.getConnection()) {

            JsonObject body = new Gson().fromJson(reader, JsonObject.class);

            // Extract & trim
            String firstname = getStr(body, "firstname");
            String lastname  = getStr(body, "lastname");
            String phone     = getStr(body, "phone");
            String street    = getStr(body, "street");
            String city      = getStr(body, "city");
            String zipCode   = getStr(body, "zipCode");
            String country   = getStr(body, "country");

            // ===== Validation =====
            StringBuilder errors = new StringBuilder();

            if (firstname.isEmpty() || !firstname.matches("[A-Za-z ]{2,50}"))
                errors.append("Invalid first name. ");
            if (lastname.isEmpty() || !lastname.matches("[A-Za-z ]{2,50}"))
                errors.append("Invalid last name. ");
            if (!phone.matches("\\+?[0-9]{10,15}"))
                errors.append("Invalid phone number. ");
            if (street.isEmpty() || street.length() > 100)
                errors.append("Invalid street. ");
            if (city.isEmpty() || !city.matches("[A-Za-z ]{2,50}"))
                errors.append("Invalid city. ");
            if (!zipCode.matches("[0-9]{4,10}"))
                errors.append("Invalid ZIP code. ");
            if (country.isEmpty() || !country.matches("[A-Za-z ]{2,50}"))
                errors.append("Invalid country. ");

            resp.setContentType("application/json");

            if (errors.length() > 0) {
                resp.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                resp.getWriter().write("{\"status\":\"failed\",\"message\":\"" + errors.toString().trim() + "\"}");
                return;
            }

            CustomerController controller = new CustomerController(conn, new PasswordServices());
            Customer c = controller.getCustomerById(customerId);

            if (c == null) {
                resp.setStatus(HttpServletResponse.SC_NOT_FOUND);
                resp.getWriter().write("{\"status\":\"failed\",\"message\":\"Customer not found\"}");
                return;
            }

            // Only update WHITELISTED editable fields.
            // Username, email, customerType, NIC, passport, license numbers, images — NEVER touched.
            c.setFirstname(firstname);
            c.setLastname(lastname);
            c.setMobileNumber(phone);
            c.setStreet(street);
            c.setCity(city);
            c.setZipCode(zipCode);
            c.setCountry(country);

            boolean updated = controller.updateCustomer(c);

            if (updated) {
                resp.getWriter().write("{\"status\":\"success\",\"message\":\"Profile updated\"}");
            } else {
                resp.getWriter().write("{\"status\":\"failed\",\"message\":\"Update failed\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            resp.setStatus(500);
            resp.getWriter().write("{\"status\":\"failed\",\"message\":\"server error\"}");
        }
    }

    private String getStr(JsonObject body, String key) {
        if (body.has(key) && !body.get(key).isJsonNull()) {
            return body.get(key).getAsString().trim();
        }
        return "";
    }
}