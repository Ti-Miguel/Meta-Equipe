<?php
require "auth.php";
require "db.php";

if ($_SESSION["usuario"]["perfil"] !== "coord") {
    http_response_code(403);
    echo json_encode(["erro" => "Permissão negada"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$stmt = $conn->prepare("
    INSERT INTO metas_usuarios (usuario_id, ano_mes, meta_geral, meta_liquida, dias_meta)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
        meta_geral = VALUES(meta_geral),
        meta_liquida = VALUES(meta_liquida),
        dias_meta = VALUES(dias_meta)
");

$stmt->bind_param(
    "isddi",
    $data["usuario_id"],
    $data["mes"],
    $data["meta_geral"],
    $data["meta_liquida"],
    $data["dias_meta"]
);

$stmt->execute();
echo json_encode(["ok" => true]);
