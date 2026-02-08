<?php
require "auth.php";
require "db.php";

if ($_SESSION["usuario"]["perfil"] !== "coord") {
    http_response_code(403);
    echo json_encode(["erro" => "Permissão negada"]);
    exit;
}

$sql = "
    SELECT 
        mu.id,
        u.nome,
        mu.ano_mes,
        mu.meta_geral,
        mu.meta_liquida,
        mu.dias_meta
    FROM metas_usuarios mu
JOIN usuarios u 
  ON u.id = mu.usuario_id
 AND u.perfil = 'usuario'

";

$res = $conn->query($sql);
echo json_encode($res->fetch_all(MYSQLI_ASSOC));
