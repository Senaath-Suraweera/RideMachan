package rentalcompany.maintenance.model;

import common.model.User;

public class MaintenanceModel extends User {

    int mobileNumber ;
    String lastName, firstName , companyID ;


    public MaintenanceModel(int id, String userName, String email, String hashedPassword, String salt, int mobileNumber, String lastName, String firstName, String companyID) {
        super(id, userName, email, hashedPassword, salt);
        this.mobileNumber = mobileNumber;
        this.lastName = lastName;
        this.firstName = firstName;
        this.companyID = companyID;
    }

}
