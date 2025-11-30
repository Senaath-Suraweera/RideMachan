//package common.util;
//
//import admin.model.Admin;
//import common.model.User;
//
//import java.security.MessageDigest;
//import java.security.NoSuchAlgorithmException;
//import java.security.SecureRandom;
//import java.util.Base64;
//import java.util.HashMap;
//import java.util.Map;
//
//public class AuthService {
//
//
//    private static Map<String, User> users = new HashMap<>();
//
////    public static boolean signUp(String email, String password) {
////        if (users.containsKey(email)) {
////            System.out.println("Email already exists.");
////            return false;
////        }
////        String salt = generateSalt();
////        String hashedPassword = hashPassword(password, salt);
////        users.put(email, new Admin(0,"Senaath", email, salt, hashedPassword));
////        System.out.println("User signed up successfully!");
////        return true;
////    }
//
//
////    public static boolean signIn(String email, String password) {
////        if (!users.containsKey(email)) {
////            System.out.println("Email not found.");
////            return false;
////        }
////        User user = users.get(email);
////        String hashedInputPassword = hashPassword(password, user.getSalt());
////        if (hashedInputPassword.equals(user.getHashedPassword())) {
////            System.out.println("Login successful!");
////            return true;
////        } else {
////            System.out.println("Invalid password.");
////            return false;
////        }
////    }
//
//
//    public static void main(String[] args) {
//        // Sign up
//        signUp("test@example.com", "securePassword123");
//        signUp("john@example.com", "mypassword");
//
//        // Sign in tests
//        signIn("test@example.com", "securePassword123");
//        signIn("test@example.com", "wrongPassword");
//        signIn("unknown@example.com", "pass");
//    }
//}	