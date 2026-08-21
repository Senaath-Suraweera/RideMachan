package common.util;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * Pooled MySQL connections, configured entirely from the environment.
 *
 * Every value has a sensible default for the hosted Aiven instance except the
 * password, which must always come from DB_PASSWORD so no credential is ever
 * committed to source control.
 *
 * Environment variables:
 *   DB_HOST      default mysql-ridemachan-ride-machan.j.aivencloud.com
 *   DB_PORT      default 13170
 *   DB_NAME      default RideMachan
 *   DB_USER      default avnadmin
 *   DB_PASSWORD  required, no default
 *   DB_SSL_MODE  default REQUIRED (set to DISABLED for a local MySQL)
 *   DB_POOL_SIZE default 8
 */
public class DBConnection {

    private static final DataSource DATA_SOURCE = build();

    private static DataSource build() {
        String host    = env("DB_HOST", "mysql-ridemachan-ride-machan.j.aivencloud.com");
        String port    = env("DB_PORT", "13170");
        String name    = env("DB_NAME", "RideMachan");
        String user    = env("DB_USER", "avnadmin");
        String sslMode = env("DB_SSL_MODE", "REQUIRED");
        String password = System.getenv("DB_PASSWORD");

        if (password == null || password.isBlank()) {
            throw new IllegalStateException(
                    "DB_PASSWORD environment variable is not set. Refusing to start with no database password.");
        }

        String url = "jdbc:mysql://" + host + ":" + port + "/" + name
                + "?sslMode=" + sslMode
                + "&serverTimezone=UTC"
                + "&characterEncoding=UTF-8"
                + "&allowPublicKeyRetrieval=true";

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(url);
        config.setUsername(user);
        config.setPassword(password);
        config.setDriverClassName("com.mysql.cj.jdbc.Driver");

        // Aiven's free plan caps concurrent connections, so keep the pool small.
        config.setMaximumPoolSize(Integer.parseInt(env("DB_POOL_SIZE", "8")));
        config.setMinimumIdle(1);
        config.setConnectionTimeout(20_000);
        config.setIdleTimeout(300_000);
        // Stay under Aiven's server-side idle timeout so we never hand out a dead socket.
        config.setMaxLifetime(600_000);
        config.setPoolName("RideMachanPool");

        // Surfaces any code path that borrows a connection and never closes it.
        config.setLeakDetectionThreshold(30_000);

        return new HikariDataSource(config);
    }

    private static String env(String key, String fallback) {
        String value = System.getenv(key);
        return (value == null || value.isBlank()) ? fallback : value;
    }

    /**
     * Borrows a connection from the pool. Callers must close it — closing
     * returns it to the pool rather than tearing down the socket.
     */
    public static Connection getConnection() {
        try {
            return DATA_SOURCE.getConnection();
        } catch (SQLException e) {
            throw new RuntimeException("Could not obtain a database connection: " + e.getMessage(), e);
        }
    }
}
