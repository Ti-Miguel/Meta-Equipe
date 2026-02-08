<?php
require "db.php";

$metodo = $_SERVER["REQUEST_METHOD"];

if ($metodo === "GET") {
    $mes = $_GET["mes"] ?? date("Y-m");

    $stmt = $conn->prepare("SELECT * FROM metas_mensais WHERE ano_mes = ?");
    $stmt->bind_param("s", $mes);
    $stmt->execute();

    $res = $stmt->get_result()->fetch_assoc();

    echo json_encode($res ?: [
        "ano_mes" => $mes,
        "meta_geral" => 0,
        "meta_liquida" => 0,
        "dias_meta" => 0,
        "fechado" => 0
    ]);
    exit;
}

if ($metodo === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    $stmt = $conn->prepare("
        INSERT INTO metas_mensais (ano_mes, meta_geral, meta_liquida, dias_meta)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            meta_geral = VALUES(meta_geral),
            meta_liquida = VALUES(meta_liquida),
            dias_meta = VALUES(dias_meta)
    ");

    $stmt->bind_param(
        "sddi",
        $data["ano_mes"],
        $data["meta_geral"],
        $data["meta_liquida"],
        $data["dias_meta"]
    );

    $stmt->execute();
    echo json_encode(["ok" => true]);
}
