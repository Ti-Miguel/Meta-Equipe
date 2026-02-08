<?php
session_start();
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);

$email = $data["email"] ?? "";
$senha = $data["senha"] ?? "";

$stmt = $conn->prepare("SELECT * FROM usuarios WHERE email = ? AND ativo = 1 LIMIT 1");
$stmt->bind_param("s", $email);
$stmt->execute();

$res = $stmt->get_result();
$user = $res->fetch_assoc();

if (!$user || !password_verify($senha, $user["senha"])) {
    http_response_code(401);
    echo json_encode(["erro" => "E-mail ou senha inválidos"]);
    exit;
}

$_SESSION["usuario"] = [
    "id" => $user["id"],
    "nome" => $user["nome"],
    "email" => $user["email"],
    "perfil" => $user["perfil"]
];

echo json_encode([
    "ok" => true,
    "nome" => $user["nome"],
    "perfil" => $user["perfil"]
]);
