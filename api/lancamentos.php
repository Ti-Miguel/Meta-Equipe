<?php
require "auth.php";
require "db.php";

$metodo = $_SERVER["REQUEST_METHOD"];
$data = json_decode(file_get_contents("php://input"), true);

if ($metodo === "GET") {
    $mes = $_GET["mes"] ?? date("Y-m");

    $stmt = $conn->prepare("
        SELECT * FROM lancamentos
        WHERE usuario_id = ? AND ano_mes = ?
        ORDER BY data DESC
    ");
    $stmt->bind_param("is", $_SESSION["usuario"]["id"], $mes);
    $stmt->execute();

    echo json_encode($stmt->get_result()->fetch_all(MYSQLI_ASSOC));
    exit;
}

if ($metodo === "POST") {
    if (!empty($data["id"])) {
        $stmt = $conn->prepare("
            UPDATE lancamentos SET
                data=?, total=?, credito=?, debito=?, dinheiro=?, pix=?, boleto=?
            WHERE id=? AND usuario_id=?
        ");
        $stmt->bind_param(
            "sddddddii",
            $data["data"],
            $data["total"],
            $data["credito"],
            $data["debito"],
            $data["dinheiro"],
            $data["pix"],
            $data["boleto"],
            $data["id"],
            $_SESSION["usuario"]["id"]
        );
    } else {
        $stmt = $conn->prepare("
            INSERT INTO lancamentos
            (usuario_id, ano_mes, data, total, credito, debito, dinheiro, pix, boleto)
            VALUES (?,?,?,?,?,?,?,?,?)
        ");
        $stmt->bind_param(
            "issdddddd",
            $_SESSION["usuario"]["id"],
            $data["ano_mes"],
            $data["data"],
            $data["total"],
            $data["credito"],
            $data["debito"],
            $data["dinheiro"],
            $data["pix"],
            $data["boleto"]
        );
    }

    $stmt->execute();
    echo json_encode(["ok" => true]);
}

if ($metodo === "DELETE") {
    $stmt = $conn->prepare("
        DELETE FROM lancamentos
        WHERE id=? AND usuario_id=?
    ");
    $stmt->bind_param("ii", $data["id"], $_SESSION["usuario"]["id"]);
    $stmt->execute();

    echo json_encode(["ok" => true]);
}
