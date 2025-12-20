<?php

require_once(__DIR__ . '/connection.php');

/**
 * FileSystem management class for handling file and folder operations
 */
class FileSystem {
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
     * List contents of a directory
     * @param int $folderId Parent folder ID
     * @return array Array of file/folder names with type indicators
     */
    public function ls($id_father) {
        $names = [];
        $i = 0;

        $dir_type  = "(select \"d\") as `type`";
        $file_type = "(select \"f\") as `type`";
        $empty_id = "(select \"\") as id";

        $query =
        "SELECT nome, $file_type, $empty_id FROM `file` WHERE cartella = ?
            UNION ALL
        select nome, $dir_type, id FROM cartella WHERE id_padre = ?";
        $types = "ii";
        $values = [$id_father, $id_father];

        $result = $this->db->secureQuery($query, $types, $values);

        if ($result) foreach($result as $line){
            $names[$i] = $line["nome"] . "|" . $line["type"] . "|" . $line["id"];
            $i = $i +1;
        }

        return $names;

    }

    /**
     * Get root folder ID for current user
     * @return int Root folder ID
     */
    public function getRootId() {
        $result = $this->db->secureQuery(
            query: "SELECT `root` FROM utente WHERE username = ?",
            type: "s",
            values: [$_SESSION["username"]]
        );

        if ($result && count($result) === 1) {
            return $result[0]["root"];
        } else {
            http_response_code(400);
            die("Mysqli internal error");
        }
    }

    /**
     * Create a new file (upload)
     * @param int $cartella Folder ID where file will be created
     * @param array $file Uploaded file data from $_FILES
     * @return void
     */
    public function touch($cartella, $file) {
        $name = basename($file['name']);

        // Check for file upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            die('Errore durante il caricamento del file.');
        }

        if ($file['tmp_name'] === '') {
            http_response_code(400);
            die('Errore: file temporaneo non trovato.');
        }

        $content = file_get_contents($file['tmp_name']);
        if ($content === false) {
            http_response_code(500);
            die('Errore nella lettura del file.');
        }

        // Check if the file is of a textual type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        if (strpos($mimeType, 'text') === false) {
            http_response_code(422);
            die('Errore: il file deve essere di tipo testuale.');
        }

        // Check for duplicate entry before inserting
        $checkQuery = "SELECT COUNT(*) as affected_rows FROM `file` WHERE nome = ? AND cartella = ?";
        $types = "si";
        $values = [$name, $cartella];

        $count = $this->db->secureQuery($checkQuery, $types, $values)[0]["affected_rows"];

        if ($count > 0) {
            http_response_code(400);
            die('Errore: voce duplicata nel database.');
        }

        $query = "INSERT INTO `file` (nome, contenuto, cartella) VALUES (?, ?, ?)";
        $types = "ssi";
        $values = [$name, $content, $cartella];

        if ($this->db->secureQuery($query, $types, $values, true) === false) {
            http_response_code(400);
            die('Errore: contenuto del file troppo grande');
        }
    }

    /**
     * Remove a file or folder
     * @param int|null $id Folder ID (for folders)
     * @param string|null $name File name (for files)
     * @param int|null $cartella Folder ID containing the file (for files)
     * @return void
     */
    public function rm($name, $cartella) {
        if (!isset($name) || !isset($cartella)) {
            http_response_code(500);
            die("Invalid parameters: 'name' and 'cartella' must be provided.");
        }

        $tabella = "file";
        $condizione = "nome = ? AND cartella = ?";
        $values = [$name, $cartella];
        $types = "si";

        if (!$this->db->secureQuery("DELETE FROM $tabella WHERE $condizione", $types, $values, checkRows: true)) {
            http_response_code(409);
            die("conflicts");
        }
    }

    /**
     * Checks if the given person is the father of the specified child.
     *
     * This function takes two parameters: the name of the person and the name of the child.
     * It verifies whether the person is the biological father of the child based on the
     * provided data or logic implemented within the function.
     */
    public function check_father_param($id){

        // check if user is owner of the father dir
        if ($this->file(id : $id)["owner"] !== $_SESSION["username"]){
            http_response_code(400);
            die("the father folder is not owned by this user");
        }

        return $id;
    }

    /**
     * Download a file
     * @param string $name File name
     * @param int $cartella Folder ID containing the file
     * @return void Outputs file content directly to browser
     */
    public function download($name, $cartella) {
        // Verify ownership of the folder
        if ($this->file(id: $cartella)["owner"] !== $_SESSION["username"]) {
            http_response_code(404);
            die("invalid owner");
        }

        $query = "SELECT contenuto, nome FROM `file` WHERE nome = ? AND cartella = ?";
        $types = "si";
        $values = [$name, $cartella];
        $result = $this->db->secureQuery($query, $types, $values);

        $contenuto = $result[0]["contenuto"];
        $nome = $result[0]["nome"];
        $contenuto_decodificato = html_entity_decode($contenuto, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

        // Send headers for file download
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $nome . '"');
        header('Content-Length: ' . strlen($contenuto_decodificato));
        header('Pragma: public');

        echo $contenuto_decodificato;
    }

    // utility function to get file info

    /**
     * Retrieves information about a file or folder based on the provided parameters.
     *
     * @param int|null $id The ID of the file or folder.
     * @param int|null $father The ID of the parent folder.
     * @param string|null $name The name of the file or folder.
     * @param bool $is_folder Whether the query is for a folder name.
     * @return array The information about the file or folder.
     */
    private function file($id = null, $father = null, $name = null, $is_folder = false){

        if (!isset($id) && !(isset($father) && isset($name)) ) {
            http_response_code(500);
            die("Invalid parameters: either 'id' or both 'name' and 'father' must be provided.");
        }

        if (isset($id)){
            $filesystem_where_close = "id = ?";
            $availible_id = $filesystem_where_close;

            $types = "ii";
            $values= [$id, $id];
        } else {
            $filesystem_where_close = "nome = ? AND id_padre = ?";
            $availible_id = "id_padre = ?";

            $types = "sii";
            $values= [$name, $father, $father];
        }

        $query = <<<SQL
        WITH RECURSIVE filesystem AS (
            SELECT id, id_padre, nome
            FROM cartella
            WHERE $filesystem_where_close
                    UNION ALL
            SELECT c.id, c.id_padre, c.nome
            FROM cartella c
                INNER JOIN filesystem fs ON c.id = fs.id_padre
        )
        SELECT u.username           as `owner`,
                current_folder.nome as `name`,
                current_folder.id   as `id`
        FROM utente u
            INNER JOIN filesystem `root`         ON root.id = u.root
            INNER JOIN filesystem current_folder ON current_folder.$availible_id;
        SQL;

        $result = $this->db->secureQuery($query, $types, $values);

        return ($result !== false) ? $result[0] : $result;
    }
}
