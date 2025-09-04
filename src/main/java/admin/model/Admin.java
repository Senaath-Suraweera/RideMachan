package admin.model;

import common.model.User;

public class Admin extends User {

    public Admin(int id, String userName, String email, String hashedPassword, String salt) {
        super(id, userName, email, hashedPassword, salt);
    }
}
