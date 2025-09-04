package rentalcompany.management.model;

import common.model.User;

import java.io.InputStream;

public class CompanyModel extends User {

    public CompanyModel(int id, String companyName, String email, String hashedPassword, String salt) {
        super(id, companyName, email, hashedPassword, salt);
    }

}
