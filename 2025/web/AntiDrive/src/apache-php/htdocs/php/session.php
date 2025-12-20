<?php

require_once(__DIR__ . '/connection.php');

/**
 * Session management class for handling user authentication and account operations
 */
class Session {
    private $db;
    private $conn;

    /**
     * Constructor
     * Uses Database singleton for connection management
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Check if user is currently logged in
     * @return bool True if user is logged in, false otherwise
     */
    public function isLogged() {
        if (isset($_SESSION["username"])) {
            $num_rows = $this->db->secureQuery(
                query: "SELECT * FROM utente WHERE username = ?",
                type: "s",
                values: [$_SESSION["username"]],
                checkRows: true
            );

            return $num_rows === 1;
        }

        return false;
    }

    /**
     * Login user with username and password
     * @param string $username User's username
     * @param string $password User's password
     * @return void
     */
    public function login($username, $password) {
        $query = "SELECT username
            FROM utente
            WHERE pswd = '" . hash(HASH_ALGORITHM, $password) . "'
            AND username = '" . $username . "'";

        $res = $this->db->query($query);

        if ($res) {
            $res = $res->fetch_assoc();
        }

        if ($res === null || !$res) {
            http_response_code(404);
            die("User not found");
        }

        if (session_status() === PHP_SESSION_ACTIVE) {
            session_destroy();
        }

        session_start();
        $_SESSION["username"] = $username;
        $_SESSION["realname"] = $res["username"];
    }

    /**
     * Register a new user
     * @param string $username User's username
     * @param string $password User's password
     * @param string $confirmPassword Password confirmation
     * @return void
     */
    public function signup($username, $password, $confirmPassword) {
        if ($password !== $confirmPassword) {
            http_response_code(401);
            die("confirm and password aren't equals");
        }

        $check = $this->db->secureQuery(
            query: "SELECT * FROM utente WHERE username = ?",
            type: "s",
            values: [$username]
        );

        if ($check) {
            http_response_code(409);
            die("Already logged in");
        }

        $res = $this->db->secureQuery(
            query: "INSERT INTO utente (username, pswd) VALUES (?, ?)",
            type: "ss",
            values: [$username, hash(HASH_ALGORITHM, $password)],
            checkRows: true
        );

        if ($res === 1) {
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_destroy();
            }

            session_start();
            $_SESSION["username"] = $username;
        } else {
            http_response_code(500);
            die("Something wrong");
        }
    }

    /**
     * Logout current user
     * @return void
     */
    public function logout() {
        session_destroy();
    }

    /**
     * Delete current user account and all associated data
     * @return void
     */
    public function deleteAccount($rootId) {
        if (!$this->isLogged()) {
            session_destroy();
            http_response_code(401);
            die("Not logged in");
        }

        $username = $_SESSION["username"];

        // Delete the user
        $deleteUserResult = $this->db->secureQuery(
            query: "DELETE FROM utente WHERE username = ?",
            type: "s",
            values: [$username],
            checkRows: true
        );

        if ($deleteUserResult !== 1) {
            http_response_code(500);
            die("Failed to delete user");
        }

        // Delete the root folder and all its contents
        $deleteFolderResult = $this->db->secureQuery(
            query: "DELETE FROM cartella WHERE id = ?",
            type: "i",
            values: [$rootId],
            checkRows: true
        );

        if ($deleteFolderResult < 1) {
            http_response_code(500);
            die("Failed to delete root folder");
        }

        $this->logout();
    }
}
