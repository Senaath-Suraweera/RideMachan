package common.util;

import java.util.*;

public class Util{
    private static final long time = 1;
    private static final Map<String, String> threadMap = new HashMap<>();;

    public static void generateCode(String email) {

        threadMap.put(email, String.valueOf((int) (Math.random() * 900000) + 100000));
        System.out.printf("Current Code for %s is %s\n", email , threadMap.get(email));

        new Thread(() -> {
            try {
                Thread.sleep(time * 60 * 1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            threadMap.remove(email);
            System.out.printf("Code expired for the email %s\n" ,email);
        }).start();
    }

    public static void getAllCodes()
    {
        for (Map.Entry<String, String> entry : threadMap.entrySet()) {
            System.out.printf("%s: %s\n",entry.getKey(),  entry.getValue());
        }
    }

    public static String getCode(String email)
    {
        return threadMap.get(email);
    }

}
