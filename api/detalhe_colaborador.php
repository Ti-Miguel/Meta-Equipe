<?php
require "auth.php";
require "db.php";

$usuarioId = (int)($_GET["usuario_id"] ?? 0);
$mes = $_GET["mes"] ?? date("Y-m");

/* ===============================
   BUSCAR NOME DO COLABORADOR
================================ */
$nomeColaborador = "";

$stmtNome = $conn->prepare("SELECT nome FROM usuarios WHERE id = ?");
$stmtNome->bind_param("i", $usuarioId);
$stmtNome->execute();
$stmtNome->bind_result($nomeColaborador);
$stmtNome->fetch();
$stmtNome->close();

/* ===============================
   BUSCAR META DO USUÁRIO
================================ */
$metaGeral = 0;
$diasMeta = 0;

$stmtMeta = $conn->prepare("
    SELECT meta_geral, dias_meta
    FROM metas_usuarios
    WHERE usuario_id = ? AND ano_mes = ?
");
$stmtMeta->bind_param("is", $usuarioId, $mes);
$stmtMeta->execute();
$stmtMeta->bind_result($metaGeral, $diasMeta);
$stmtMeta->fetch();
$stmtMeta->close();

/* ===============================
   BUSCAR LANÇAMENTOS DO MÊS
================================ */
$stmt = $conn->prepare("
    SELECT 
        data,
        SUM(total) AS total_dia,
        SUM(debito + dinheiro + pix + boleto) AS vista_dia
    FROM lancamentos
    WHERE usuario_id = ? AND ano_mes = ?
    GROUP BY data
");
$stmt->bind_param("is", $usuarioId, $mes);
$stmt->execute();
$res = $stmt->get_result();

$total = 0;
$vista = 0;
$maiorDia = 0;
$menorDia = null;

while ($r = $res->fetch_assoc()) {
    $total += (float)$r["total_dia"];
    $vista += (float)$r["vista_dia"];

    $maiorDia = max($maiorDia, $r["total_dia"]);
    $menorDia = is_null($menorDia)
        ? $r["total_dia"]
        : min($menorDia, $r["total_dia"]);
}

$stmt->close();

/* ===============================
   DIAS COM VENDA (ÚTEIS)
================================ */
$diasComVenda = 0;

$stmtDias = $conn->prepare("
    SELECT COUNT(DISTINCT data)
    FROM lancamentos
    WHERE usuario_id = ?
      AND ano_mes = ?
      AND WEEKDAY(data) < 5
");
$stmtDias->bind_param("is", $usuarioId, $mes);
$stmtDias->execute();
$stmtDias->bind_result($diasComVenda);
$stmtDias->fetch();
$stmtDias->close();

/* ===============================
   CÁLCULOS
================================ */
$diasSemVenda = max(0, $diasMeta - $diasComVenda);

$percVista = $total > 0 ? ($vista / $total) * 100 : 0;

$faltante = max(0, $metaGeral - $total);
$diasRestantes = max(0, $diasMeta - $diasComVenda);

$metaDiaria = 0;
if ($faltante > 0 && $diasRestantes > 0) {
    $metaDiaria = $faltante / $diasRestantes;
}

$projecaoFinal = 0;

if ($diasComVenda > 0 && $diasMeta > 0) {
    $mediaDiariaAtual = $total / $diasComVenda;
    $projecaoFinal = $mediaDiariaAtual * $diasMeta;
}

/* ===============================
   STATUS INTELIGENTE
================================ */
$status = "Crítico";
if ($metaGeral > 0 && ($total / $metaGeral) >= 1) {
    $status = "Meta Batida";
} elseif ($metaGeral > 0 && ($total / $metaGeral) >= 0.8) {
    $status = "No Ritmo";
} elseif ($metaGeral > 0 && ($total / $metaGeral) >= 0.5) {
    $status = "Atenção";
}

/* ===============================
   RESPOSTA JSON
================================ */
echo json_encode([
    "nome" => $nomeColaborador,
    "total" => $total,
    "vista" => $vista,
    "perc_vista" => $percVista,
    "status" => $status,
    "dias_com_venda" => $diasComVenda,
    "dias_sem_venda" => $diasSemVenda,
    "maior_dia" => $maiorDia,
    "menor_dia" => $menorDia ?? 0,
    "meta_diaria" => $metaDiaria,
    "dias_restantes" => $diasRestantes,
    "projecao_final" => $projecaoFinal

]);
