<?php

require_once(__DIR__ . "/connection.php");
require_once(__DIR__ . "/session.php");
require_once(__DIR__ . "/filesystem.php");

function check_params($names){
    global $_POST;

    foreach ($names as $key => $regex) {
        if (!isset($_POST[$key])) {
            http_response_code(400);
            die("Parameter not set: $key");
        }

        if (isset($regex) && !preg_match($regex, $_POST[$key])){
            http_response_code(400);
            die("Parameter does not match regex: $key");
        }
    }

}

if (!isset($_POST["action"])) {
    http_response_code(400);
    die("Have to pass action variable");
}

// check consistency of the user session
$action = $_POST["action"];

$session = new Session();
$filesystem = new Filesystem();

session_start();
if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION["username"]) && isset($_SESSION["realname"]) && ($_SESSION["username"] !== $_SESSION["realname"])) {
    session_destroy();

    http_response_code(401);
    die("Must re-login first");
}

switch ($action) {
    case "login":
        $session->login($_POST["username"], $_POST["password"]);
        break;

    case "signup":
        check_params([
            "username" => '/^[A-Za-z\d\-\s]{3,64}$/',
            "password" => '/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$.!%*?&])[A-Za-z\d@$.!%*?&]{8,64}$/',
            "confirm_password" => null
        ]);

        $session->signup(
            $_POST["username"],
            $_POST["password"],
            $_POST["confirm_password"]
        );
        break;

    case "is_logged":
        if ($session->isLogged()) {
            echo $_SESSION["username"];
        } else {
            session_destroy();
            http_response_code(401);
            die("Not logged");
        }
        break;

    case "logout":
        $session->logout();
        break;

    case "delete-account":
        $session->deleteAccount($filesystem->getRootId());
        break;

    // ========== FILESYSTEM ACTIONS ==========

    case "ls":
        check_params(["father" => '/(null|[\d]+)/']);

        if ($_POST["father"] === "null") {
            $id = $filesystem->getRootId();
        } else {
            $id = $filesystem->check_father_param($_POST["father"]);
        }

        $names = $filesystem->ls($id);

        foreach($names as $name){
            echo $name . "\n";
        }

        break;

    case "getRootId":
        echo $filesystem->getRootId();
        break;

    case "download":
        check_params([
            "name" => NULL,
            "father" => '/^(null|[\d]+)$/'
        ]);

        if ($_POST["father"] === "null") {
            $father = $filesystem->getRootId();
        } else {
            $father = $filesystem->check_father_param($_POST["father"]);
        }

        $filesystem->download($_POST["name"], $father);
        break;

    case "touch":
        check_params(["cartella" => '/^(null|[\d]+)$/']);

        if ($_POST["cartella"] === "null") {
            $cartella = $filesystem->getRootId();
        } else {
            $cartella = $filesystem->check_father_param($_POST["cartella"]);
        }

        $filesystem->touch($cartella, $_FILES["file"]);
        break;

    case "rm":
        check_params([
            "name" => '/[A-Za-z\d\-\s]{0,64}/',
            "cartella" => '/^(null|[\d]+)$/'
        ]);

        if ($_POST["cartella"] === "null") {
            $cartella = $filesystem->getRootId();
        } else {
            $cartella = $filesystem->check_father_param($_POST["cartella"]);
        }

        $filesystem->rm($_POST["name"], $cartella);
        break;

    default:
        http_response_code(400);
        die("Invalid action");
}
