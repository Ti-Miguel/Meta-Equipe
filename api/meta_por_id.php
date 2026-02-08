<?php
require "auth.php";
require "db.php";

if ($_SESSION["usuario"]["perfil"] !== "coord") {
    http_response_code(403);
    exit;
}

$id = (int)($_GET["id"] ?? 0);

$stmt = $conn->prepare("
    SELECT id, usuario_id, ano_mes, meta_geral, meta_liquida, dias_meta
    FROM metas_usuarios
    WHERE id = ?
");
$stmt->bind_param("i", $id);
$stmt->execute();

$res = $stmt->get_result()->fetch_assoc();
echo json_encode($res);
