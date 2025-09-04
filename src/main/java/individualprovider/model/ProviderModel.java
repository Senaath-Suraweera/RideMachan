package individualprovider.model;

import common.model.User;

public class ProviderModel extends User {
    public ProviderModel(int id, String userName, String email, String hashedPassword, String salt) {
        super(id, userName, email, hashedPassword, salt);
    }


}
