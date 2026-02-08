<?php
session_start();

if (!isset($_SESSION["usuario"])) {
    http_response_code(401);
    echo json_encode(["erro" => "Não autenticado"]);
    exit;
}

echo json_encode([
    "nome" => $_SESSION["usuario"]["nome"],
    "email" => $_SESSION["usuario"]["email"],
    "perfil" => $_SESSION["usuario"]["perfil"]
]);
