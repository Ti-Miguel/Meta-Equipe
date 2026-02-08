<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
require "db.php";

header("Content-Type: application/json");

// 🔒 Verifica login
if (!isset($_SESSION["usuario"])) {
    http_response_code(401);
    echo json_encode(["erro" => "Não autenticado"]);
    exit;
}

$usuarioId = (int) $_SESSION["usuario"]["id"];

// 📥 Recebe dados (fetch JSON)
$dados = json_decode(file_get_contents("php://input"), true);

if (!$dados) {
    http_response_code(400);
    echo json_encode(["erro" => "Dados inválidos"]);
    exit;
}

// 🧾 Campos obrigatórios
$data      = $dados["data"] ?? null;
$total     = $dados["total"] ?? 0;
$credito   = $dados["credito"] ?? 0;
$debito    = $dados["debito"] ?? 0;
$dinheiro  = $dados["dinheiro"] ?? 0;
$pix       = $dados["pix"] ?? 0;
$boleto    = $dados["boleto"] ?? 0;

if (!$data) {
    http_response_code(400);
    echo json_encode(["erro" => "Data é obrigatória"]);
    exit;
}

// 📆 Calcula o mês (YYYY-MM)
$mes = substr($data, 0, 7);

// 💾 INSERE NO BANCO
$sql = "
    INSERT INTO lancamentos 
    (usuario_id, data, mes, total, credito, debito, dinheiro, pix, boleto)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["erro" => $conn->error]);
    exit;
}

$stmt->bind_param(
    "issdddddd",
    $usuarioId,
    $data,
    $mes,
    $total,
    $credito,
    $debito,
    $dinheiro,
    $pix,
    $boleto
);

$stmt->execute();

echo json_encode([
    "sucesso" => true,
    "mensagem" => "Lançamento salvo com sucesso"
]);
