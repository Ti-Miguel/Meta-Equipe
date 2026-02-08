<?php
require "auth.php";
require "db.php";

$data = json_decode(file_get_contents("php://input"), true);
$mes = $data["ano_mes"];
$acao = $data["acao"];

$valor = ($acao === "fechar") ? 1 : 0;

$stmt = $conn->prepare("
    UPDATE metas_usuarios
    SET fechado = ?
    WHERE usuario_id = ? AND ano_mes = ?
");

$stmt->bind_param("iis", $valor, $_SESSION["usuario"]["id"], $mes);
$stmt->execute();

echo json_encode(["ok" => true]);
