package customer.model;

import common.model.User;

public class Customer extends User {

    int mobileNumber;

    public Customer(int id, String userName, String email, String hashedPassword, String salt, int mobileNumber) {
        super(id, userName, email, hashedPassword, salt);
        this.mobileNumber = mobileNumber;
    }


}
