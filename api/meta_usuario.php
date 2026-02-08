<?php
require "auth.php";
require "db.php";

$mes = $_GET["mes"] ?? date("Y-m");
$usuarioLogado = $_SESSION["usuario"]["id"];
$perfil = $_SESSION["usuario"]["perfil"];

$usuarioId = $usuarioLogado;
if ($perfil === "coord" && isset($_GET["usuario_id"])) {
    $usuarioId = (int)$_GET["usuario_id"];
}

$stmt = $conn->prepare("
    SELECT meta_geral, meta_liquida, dias_meta, fechado
    FROM metas_usuarios
    WHERE usuario_id = ? AND ano_mes = ?
");
$stmt->bind_param("is", $usuarioId, $mes);
$stmt->execute();

$meta = $stmt->get_result()->fetch_assoc();

echo json_encode($meta ?: [
    "meta_geral" => 0,
    "meta_liquida" => 0,
    "dias_meta" => 0,
    "fechado" => 0
]);
