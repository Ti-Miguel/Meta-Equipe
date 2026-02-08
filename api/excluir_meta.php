<?php
require "auth.php";
require "db.php";

if ($_SESSION["usuario"]["perfil"] !== "coord") {
    http_response_code(403);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$stmt = $conn->prepare("DELETE FROM metas_usuarios WHERE id=?");
$stmt->bind_param("i", $data["id"]);
$stmt->execute();

echo json_encode(["ok" => true]);
