<?php

define("HASH_ALGORITHM", "sha256");

/**
 * Database connection and query management class
 */
class Database {
    private const HOST = "mariadb:3306";
    private const DATABASE = "ctfuser";
    private const USER = "root";
    private const PASSWORD = "root";

    private $conn;
    private static $instance = null;

    /**
     * Private constructor to implement singleton pattern
     * Establishes database connection
     */
    private function __construct() {
        $this->conn = mysqli_connect(
            self::HOST,
            self::USER,
            self::PASSWORD,
            self::DATABASE
        );

        if (!$this->conn) {
            http_response_code(500);
            die("Database connection failed: " . mysqli_connect_error());
        }
    }

    /**
     * Get singleton instance of Database
     * @return Database The database instance
     */
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Get the mysqli connection object
     * @return mysqli The database connection
     */
    public function getConnection() {
        return $this->conn;
    }

    /**
     * Execute a secure parameterized query
     * @param string $query SQL query with placeholders
     * @param string $type Parameter types (e.g., "ssi" for string, string, int)
     * @param array $values Array of values to bind to query
     * @param bool $checkRows Whether to return affected rows count instead of result set
     * @return array|int|false Query results as associative array, affected rows count, or false on failure
     */
    public function secureQuery($query, $type, $values, $checkRows = false) {
        if (!isset($query) || !isset($type) || !isset($values)) {
            http_response_code(500);
            die("Invalid parameters: either 'query', 'type' and 'values' must be provided.");
        }

        $stmt = mysqli_prepare($this->conn, $query);

        if (!$stmt) {
            http_response_code(500);
            error_log("query errata");
            die();
        }

        mysqli_stmt_bind_param($stmt, $type, ...$values);
        if (!mysqli_stmt_execute($stmt)) {
            return false;
        }

        if ($checkRows) {
            $result = mysqli_stmt_affected_rows($stmt);
        } else {
            $result = mysqli_stmt_get_result($stmt);
            $result = $result ? $result->fetch_all(MYSQLI_ASSOC) : false;
            $result = $result ?: false;
        }

        mysqli_stmt_close($stmt);

        return $result;
    }

    /**
     * Execute a direct query (use with caution)
     * @param string $query SQL query to execute
     * @return mysqli_result|bool Query result or false on failure
     */
    public function query($query) {
        return mysqli_query($this->conn, $query);
    }

    /**
     * Get the ID of the last inserted row
     * @return int Last insert ID
     */
    public function getInsertId() {
        return mysqli_insert_id($this->conn);
    }

    /**
     * Get the number of affected rows from last operation
     * @return int Number of affected rows
     */
    public function getAffectedRows() {
        return mysqli_affected_rows($this->conn);
    }

    /**
     * Get SQL state error code
     * @return string SQL state code
     */
    public function getSqlState() {
        return $this->conn->sqlstate;
    }

    /**
     * Get last error message
     * @return string Error message
     */
    public function getError() {
        return $this->conn->error;
    }

    /**
     * Close the database connection
     * @return void
     */
    public function close() {
        if ($this->conn) {
            mysqli_close($this->conn);
        }
    }

    /**
     * Prevent cloning of singleton instance
     */
    private function __clone() {}

    /**
     * Prevent unserialization of singleton instance
     */
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}
