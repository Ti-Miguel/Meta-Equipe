<?php
header("Content-Type: application/json; charset=utf-8");

$host = "localhost";
$banco = "u380360322_metasequipe";
$usuario = "u380360322_metasequipe";
$senha = "Miguel847829";

$conn = new mysqli($host, $usuario, $senha, $banco);
$conn->set_charset("utf8");

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["erro" => "Erro de conexão com o banco"]);
    exit;
}
