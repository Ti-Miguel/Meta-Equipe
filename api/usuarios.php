<?php
require "auth.php";
require "db.php";

if ($_SESSION["usuario"]["perfil"] !== "coord") {
    http_response_code(403);
    echo json_encode(["erro" => "Permissão negada"]);
    exit;
}

$res = $conn->query("SELECT id, nome 
FROM usuarios 
WHERE ativo = 1 
AND perfil = 'usuario'");
$usuarios = [];

while ($row = $res->fetch_assoc()) {
    $usuarios[] = $row;
}

echo json_encode($usuarios);
