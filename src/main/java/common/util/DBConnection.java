package common.util;

import java.sql.Connection;
import java.sql.DriverManager;

public class DBConnection {

    private static String url = "jdbc:mysql://localhost:3306/RideMachan";
    private static String username = "root";
    private static String password = "Sathnara@1";
    private static Connection con;

    public static Connection getConnection(){
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            con = DriverManager.getConnection(url, username, password);
            System.out.println("Database Connection Established!");
        }catch (NullPointerException e){
            System.out.println("Database connection failed");
        }catch (Exception e) {
            System.out.println("other error");
        }
        return con;
    }
}