package rentalcompany.Common;

public class RideMachan {

    public static void ridemachanCreateDatabaseTask(){String sql="CREATE DATABASE ridemachan";}
    public static void ridemachanUseDatabaseTask(){String sql="USE ridemachan";}

    public static void ridemachanCreateTableTask(){String sql="CREATE TABLE users(id INT PRIMARY KEY AUTO_INCREMENT,name VARCHAR(100),email VARCHAR(100),age INT)";}
    public static void ridemachanCreateTableWithConstraintsTask(){String sql="CREATE TABLE emp(id INT PRIMARY KEY,name VARCHAR(50) NOT NULL,email VARCHAR(100) UNIQUE,salary DECIMAL(10,2),dept_id INT)";}

    public static void ridemachanInsertTask(){String sql="INSERT INTO users(name,email,age) VALUES('Siva','siva@gmail.com',22)";}
    public static void ridemachanInsertMultipleTask(){String sql="INSERT INTO users(name,email,age) VALUES('A','a@gmail.com',20),('B','b@gmail.com',25)";}
    public static void ridemachanInsertSelectTask(){String sql="INSERT INTO emp(name,email) SELECT name,email FROM users";}

    public static void ridemachanSelectAllTask(){String sql="SELECT * FROM users";}
    public static void ridemachanSelectColumnsTask(){String sql="SELECT name,age FROM users";}
    public static void ridemachanDistinctTask(){String sql="SELECT DISTINCT age FROM users";}
    public static void ridemachanWhereTask(){String sql="SELECT * FROM users WHERE age>20";}
    public static void ridemachanAndOrTask(){String sql="SELECT * FROM users WHERE age>20 AND name='Siva'";}
    public static void ridemachanBetweenTask(){String sql="SELECT * FROM users WHERE age BETWEEN 20 AND 30";}
    public static void ridemachanInTask(){String sql="SELECT * FROM users WHERE age IN(20,25,30)";}
    public static void ridemachanLikeTask(){String sql="SELECT * FROM users WHERE name LIKE 'S%'";}
    public static void ridemachanWildcardTask(){String sql="SELECT * FROM users WHERE name LIKE '%a%'";}
    public static void ridemachanIsNullTask(){String sql="SELECT * FROM users WHERE email IS NULL";}
    public static void ridemachanIsNotNullTask(){String sql="SELECT * FROM users WHERE email IS NOT NULL";}

    public static void ridemachanOrderByAscTask(){String sql="SELECT * FROM users ORDER BY age ASC";}
    public static void ridemachanOrderByDescTask(){String sql="SELECT * FROM users ORDER BY age DESC";}
    public static void ridemachanLimitTask(){String sql="SELECT * FROM users LIMIT 5";}
    public static void ridemachanOffsetTask(){String sql="SELECT * FROM users LIMIT 5 OFFSET 5";}

    public static void ridemachanUpdateTask(){String sql="UPDATE users SET age=30 WHERE id=1";}
    public static void ridemachanUpdateMultipleTask(){String sql="UPDATE users SET age=25,name='Kumar' WHERE id=2";}

    public static void ridemachanDeleteTask(){String sql="DELETE FROM users WHERE id=1";}
    public static void ridemachanDeleteAllTask(){String sql="DELETE FROM users";}

    public static void ridemachanSumTask(){String sql="SELECT SUM(age) FROM users";}
    public static void ridemachanAvgTask(){String sql="SELECT AVG(age) FROM users";}
    public static void ridemachanCountTask(){String sql="SELECT COUNT(*) FROM users";}
    public static void ridemachanMaxTask(){String sql="SELECT MAX(age) FROM users";}
    public static void ridemachanMinTask(){String sql="SELECT MIN(age) FROM users";}

    public static void ridemachanGroupByTask(){String sql="SELECT age,COUNT(*) FROM users GROUP BY age";}
    public static void ridemachanHavingTask(){String sql="SELECT age,COUNT(*) FROM users GROUP BY age HAVING COUNT(*)>1";}

    public static void ridemachanInnerJoinTask(){String sql="SELECT u.name,o.id FROM users u INNER JOIN orders o ON u.id=o.user_id";}
    public static void ridemachanLeftJoinTask(){String sql="SELECT u.name,o.id FROM users u LEFT JOIN orders o ON u.id=o.user_id";}
    public static void ridemachanRightJoinTask(){String sql="SELECT u.name,o.id FROM users u RIGHT JOIN orders o ON u.id=o.user_id";}
    public static void ridemachanCrossJoinTask(){String sql="SELECT * FROM users CROSS JOIN orders";}
    public static void ridemachanSelfJoinTask(){String sql="SELECT a.name,b.name FROM users a,users b WHERE a.id=b.id";}

    public static void ridemachanUnionTask(){String sql="SELECT name FROM users UNION SELECT name FROM emp";}
    public static void ridemachanUnionAllTask(){String sql="SELECT name FROM users UNION ALL SELECT name FROM emp";}

    public static void ridemachanSubqueryTask(){String sql="SELECT name FROM users WHERE id IN(SELECT user_id FROM orders)";}
    public static void ridemachanExistsTask(){String sql="SELECT name FROM users u WHERE EXISTS(SELECT 1 FROM orders o WHERE o.user_id=u.id)";}
    public static void ridemachanScalarSubqueryTask(){String sql="SELECT name,(SELECT COUNT(*) FROM orders) FROM users";}

    public static void ridemachanCaseTask(){String sql="SELECT name,CASE WHEN age>18 THEN 'Adult' ELSE 'Minor' END FROM users";}

    public static void ridemachanCreateViewTask(){String sql="CREATE VIEW v_users AS SELECT * FROM users";}
    public static void ridemachanSelectViewTask(){String sql="SELECT * FROM v_users";}
    public static void ridemachanDropViewTask(){String sql="DROP VIEW v_users";}

    public static void ridemachanIndexTask(){String sql="CREATE INDEX idx_name ON users(name)";}
    public static void ridemachanUniqueIndexTask(){String sql="CREATE UNIQUE INDEX idx_email ON users(email)";}
    public static void ridemachanDropIndexTask(){String sql="DROP INDEX idx_name ON users";}

    public static void ridemachanAlterAddColumnTask(){String sql="ALTER TABLE users ADD phone VARCHAR(15)";}
    public static void ridemachanAlterModifyTask(){String sql="ALTER TABLE users MODIFY age BIGINT";}
    public static void ridemachanAlterChangeNameTask(){String sql="ALTER TABLE users CHANGE name full_name VARCHAR(100)";}
    public static void ridemachanAlterRenameColumnTask(){String sql="ALTER TABLE users RENAME COLUMN email TO user_email";}
    public static void ridemachanAlterDropColumnTask(){String sql="ALTER TABLE users DROP COLUMN phone";}
    public static void ridemachanAlterRenameTableTask(){String sql="ALTER TABLE users RENAME TO customers";}

    public static void ridemachanAddPKTask(){String sql="ALTER TABLE users ADD PRIMARY KEY(id)";}
    public static void ridemachanDropPKTask(){String sql="ALTER TABLE users DROP PRIMARY KEY";}
    public static void ridemachanAddFKTask(){String sql="ALTER TABLE orders ADD CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)";}
    public static void ridemachanDropFKTask(){String sql="ALTER TABLE orders DROP FOREIGN KEY fk_user";}
    public static void ridemachanAddUniqueTask(){String sql="ALTER TABLE users ADD UNIQUE(email)";}
    public static void ridemachanDropUniqueTask(){String sql="ALTER TABLE users DROP INDEX email";}

    public static void ridemachanTruncateTask(){String sql="TRUNCATE TABLE users";}
    public static void ridemachanDropTableTask(){String sql="DROP TABLE users";}
    public static void ridemachanDropDatabaseTask(){String sql="DROP DATABASE ridemachan";}

    public static void ridemachanTransactionStartTask(){String sql="START TRANSACTION";}
    public static void ridemachanCommitTask(){String sql="COMMIT";}
    public static void ridemachanRollbackTask(){String sql="ROLLBACK";}

    public static void ridemachanProcedureTask(){String sql="CREATE PROCEDURE p1() BEGIN SELECT * FROM users; END";}
    public static void ridemachanCallProcedureTask(){String sql="CALL p1()";}
    public static void ridemachanFunctionTask(){String sql="CREATE FUNCTION f1(a INT) RETURNS INT RETURN a*2";}

    public static void ridemachanTriggerTask(){String sql="CREATE TRIGGER t1 BEFORE INSERT ON users FOR EACH ROW SET NEW.name=UPPER(NEW.name)";}

    public static void ridemachanWindowRankTask(){String sql="SELECT name,RANK() OVER(ORDER BY age DESC) FROM users";}
    public static void ridemachanWindowRowNumberTask(){String sql="SELECT name,ROW_NUMBER() OVER() FROM users";}

    public static void ridemachanCTETask(){String sql="WITH temp AS(SELECT * FROM users) SELECT * FROM temp";}
}