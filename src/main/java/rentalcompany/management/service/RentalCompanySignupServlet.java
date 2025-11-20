package rentalcompany.management.service;

import common.util.PasswordServices;
import rentalcompany.management.controller.RentalCompanyDAO;
import rentalcompany.management.model.RentalCompany;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.MultipartConfig;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.Part;

import java.io.File;
import java.io.IOException;

@WebServlet(name = "RentalCompanySignupServlet", urlPatterns = {"/rentalcompanies/signup"})
@MultipartConfig
public class RentalCompanySignupServlet extends HttpServlet {

    private static final String UPLOAD_DIR = "src/company_documents";

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        try {
            String companyName = request.getParameter("companyname");
            String email = request.getParameter("email");
            String phone = request.getParameter("phone");
            String registrationNumber = request.getParameter("registrationnumber");
            String taxId = request.getParameter("taxid");
            String street = request.getParameter("street");
            String city = request.getParameter("city");
            String password = request.getParameter("password");

            // Handle uploaded documents
            Part certificatePart = request.getPart("certificate");
            Part taxDocPart = request.getPart("taxdocument");

            String uploadPath = getServletContext().getRealPath("") + File.separator + UPLOAD_DIR;
            File uploadDir = new File(uploadPath);
            if (!uploadDir.exists()) uploadDir.mkdirs();

            String certificateFileName = System.currentTimeMillis() + "_certificate_" + certificatePart.getSubmittedFileName();
            String taxFileName = System.currentTimeMillis() + "_tax_" + taxDocPart.getSubmittedFileName();

            certificatePart.write(uploadPath + File.separator + certificateFileName);
            taxDocPart.write(uploadPath + File.separator + taxFileName);

            String certificatePath = UPLOAD_DIR + "/" + certificateFileName;
            String taxDocumentPath = UPLOAD_DIR + "/" + taxFileName;

            // Password hashing
            String salt = PasswordServices.generateSalt();
            String hashed = PasswordServices.hashPassword(password, salt);

            RentalCompany company = new RentalCompany();
            company.setCompanyName(companyName);
            company.setEmail(email);
            company.setPhone(phone);
            company.setRegistrationNumber(registrationNumber);
            company.setTaxId(taxId);
            company.setStreet(street);
            company.setCity(city);
            company.setCertificatePath(certificatePath);
            company.setTaxDocumentPath(taxDocumentPath);
            company.setHashedPassword(hashed);
            company.setSalt(salt);

            RentalCompanyDAO dao = new RentalCompanyDAO();
            if (dao.addCompany(company)) {
                // Instead of JSON, redirect to login page
                response.sendRedirect("/views/landing/companylogin.html");
            } else {
                response.setStatus(500);
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Database insert failed\"}");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.setStatus(500);
            response.getWriter().write("{\"status\":\"error\",\"message\":\"" + e.getMessage() + "\"}");
        }
    }
}
