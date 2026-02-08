<?php
require "auth.php";
require "db.php";

$metodo = $_SERVER["REQUEST_METHOD"];
$data = json_decode(file_get_contents("php://input"), true);

if ($metodo === "GET") {
    $mes = $_GET["mes"] ?? date("Y-m");

    $stmt = $conn->prepare("
        SELECT * FROM estornos
        WHERE usuario_id = ? AND ano_mes = ?
        ORDER BY data DESC
    ");
    $stmt->bind_param("is", $_SESSION["usuario"]["id"], $mes);
    $stmt->execute();

    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    exit;
}

if ($metodo === "POST") {
    if (!empty($data["id"])) {
        $stmt = $conn->prepare("
            UPDATE estornos SET
                data=?, paciente=?, valor=?
            WHERE id=? AND usuario_id=?
        ");
        $stmt->bind_param(
            "ssdii",
            $data["data"],
            $data["paciente"],
            $data["valor"],
            $data["id"],
            $_SESSION["usuario"]["id"]
        );
    } else {
        $stmt = $conn->prepare("
            INSERT INTO estornos
            (usuario_id, ano_mes, data, paciente, valor)
            VALUES (?,?,?,?,?)
        ");
        $stmt->bind_param(
            "isssd",
            $_SESSION["usuario"]["id"],
            $data["ano_mes"],
            $data["data"],
            $data["paciente"],
            $data["valor"]
        );
    }

    $stmt->execute();
    echo json_encode(["ok" => true]);
}

if ($metodo === "DELETE") {
    $stmt = $conn->prepare("
        DELETE FROM estornos
        WHERE id=? AND usuario_id=?
    ");
    $stmt->bind_param("ii", $data["id"], $_SESSION["usuario"]["id"]);
    $stmt->execute();

    echo json_encode(["ok" => true]);
}
