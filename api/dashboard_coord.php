<?php
header("Content-Type: application/json; charset=utf-8");

require "auth.php";
require "db.php";

if (!isset($_SESSION["usuario"]) || $_SESSION["usuario"]["perfil"] !== "coord") {
    http_response_code(403);
    echo json_encode(["erro" => "Acesso negado"]);
    exit;
}

$mes = $_GET["mes"] ?? date("Y-m");

$sql = "
SELECT 
    u.id,
    u.nome,
    IFNULL(mu.meta_geral, 0)   AS meta_geral,
    IFNULL(mu.meta_liquida, 0) AS meta_liquida,
    IFNULL(mu.dias_meta, 0)    AS dias_meta,
    IFNULL(SUM(l.total), 0)    AS total_vendido,
    IFNULL(SUM(
        l.debito + l.dinheiro + l.pix + l.boleto
    ), 0) AS total_vista
FROM usuarios u
LEFT JOIN metas_usuarios mu 
    ON mu.usuario_id = u.id 
    AND mu.ano_mes = ?
LEFT JOIN lancamentos l 
    ON l.usuario_id = u.id 
    AND l.ano_mes = ?
WHERE u.ativo = 1
AND u.perfil = 'usuario'

GROUP BY 
    u.id,
    u.nome,
    mu.meta_geral,
    mu.meta_liquida,
    mu.dias_meta
ORDER BY total_vendido DESC
";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $mes, $mes);
$stmt->execute();

$res = $stmt->get_result();
echo json_encode($res->fetch_all(MYSQLI_ASSOC));
