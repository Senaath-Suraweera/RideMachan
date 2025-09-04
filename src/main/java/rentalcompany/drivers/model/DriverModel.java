package rentalcompany.drivers.model;

import common.model.User;

import java.io.InputStream;

public class DriverModel extends User {

    String firstName, lastName, nicNumber,companyId;
    InputStream nicPdf,licensePdf;

    public DriverModel(int id, String userName, String email, String hashedPassword, String salt, String firstName, String lastName, String nicNumber, InputStream nicPdf, InputStream licensePdf, String companyId) {
        super(id, userName, email, hashedPassword, salt);
        this.firstName = firstName;
        this.lastName = lastName;
        this.nicNumber = nicNumber;
        this.nicPdf = nicPdf;
        this.licensePdf = licensePdf;
        this.companyId = companyId;
    }

}
