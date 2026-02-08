// ===============================
// VARIÁVEIS GLOBAIS
// ===============================
let mesSelecionado = new Date().toISOString().slice(0, 7);
let dadosEquipe = [];

let graficoRanking = null;
let graficoComparativo = null;

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    await carregarUsuarioLogado();
    carregarDashboard();
});

// ===============================
// USUÁRIO LOGADO
// ===============================
async function carregarUsuarioLogado() {
    const res = await fetch("../api/me.php");
    const user = await res.json();

    if (!res.ok || user.perfil !== "coord") {
        window.location.href = "../index.html";
        return;
    }

    document.getElementById("usuarioLogado").innerText = `👤 ${user.nome}`;
}

// ===============================
// CONTROLE DE MÊS
// ===============================
function mudarMes(delta) {
    const [ano, mes] = mesSelecionado.split("-").map(Number);
    const novaData = new Date(ano, mes - 1 + delta, 1);
    mesSelecionado = `${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, "0")}`;
    carregarDashboard();
}

function atualizarHeaderMes() {
    const [ano, mes] = mesSelecionado.split("-");
    const nomesMes = [
        "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
        "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
    ];
    document.getElementById("mesAtualLabel").innerText =
        `${nomesMes[Number(mes) - 1]} / ${ano}`;
}

// ===============================
// DASHBOARD
// ===============================
async function carregarDashboard() {
    atualizarHeaderMes();

    const res = await fetch(`../api/dashboard_coord.php?mes=${mesSelecionado}`);
    if (!res.ok) {
        alert("Erro ao carregar dados da coordenação");
        return;
    }

    dadosEquipe = await res.json();

    atualizarKPIs();
    listarEquipe();
    desenharGraficos();
}

// ===============================
// KPIs
// ===============================
function atualizarKPIs() {
    let totalVendido = 0;
    let totalLiquido = 0;
    let totalVista = 0;
    let metasBatidas = 0;

    dadosEquipe.forEach(u => {
        totalVendido += Number(u.total_vendido || 0);
        totalVista += Number(u.total_vista || 0);
        totalLiquido += Number(u.total_vista || 0);

        if (Number(u.total_vendido) >= Number(u.meta_geral || 0) && u.meta_geral > 0) {
            metasBatidas++;
        }
    });

    const percVista = totalVendido > 0 ? (totalVista / totalVendido) * 100 : 0;

    document.getElementById("kpiTotalVendido").innerText =
        `R$ ${totalVendido.toLocaleString("pt-BR",{minimumFractionDigits:2})}`;

    document.getElementById("kpiTotalLiquido").innerText =
        `R$ ${totalLiquido.toLocaleString("pt-BR",{minimumFractionDigits:2})}`;

    document.getElementById("kpiPercentualVista").innerText =
        `${percVista.toFixed(1)}%`;

    document.getElementById("kpiMetasBatidas").innerText =
        `${metasBatidas} / ${dadosEquipe.length}`;
}

// ===============================
// LISTA DA EQUIPE
// ===============================
function listarEquipe() {
    const tbody = document.getElementById("listaEquipe");
    tbody.innerHTML = "";

    if (dadosEquipe.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;color:#777">
                    Nenhum dado encontrado
                </td>
            </tr>
        `;
        return;
    }

    dadosEquipe.forEach(u => {
        const meta = Number(u.meta_geral || 0);
        const realizado = Number(u.total_vendido || 0);
        const perc = meta > 0 ? (realizado / meta) * 100 : 0;

        const status = obterStatusMeta(perc);

        tbody.innerHTML += `
            <tr>
                <td>
    <button class="link-colab" onclick="abrirDetalhe(${u.id})">
        ${u.nome}
    </button>
</td>

                <td>R$ ${meta.toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
                <td>R$ ${realizado.toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
                <td>${perc.toFixed(1)}%</td>
                <td>
                    <span class="status-badge ${status.classe}">
                        ${status.texto}
                    </span>
                </td>
            </tr>
        `;
    });
}

// ===============================
// GRÁFICOS
// ===============================
function desenharGraficos() {

    const nomes = dadosEquipe.map(u => u.nome);
    const realizados = dadosEquipe.map(u => Number(u.total_vendido || 0));
    const metas = dadosEquipe.map(u => Number(u.meta_geral || 0));

    if (graficoRanking) graficoRanking.destroy();
    if (graficoComparativo) graficoComparativo.destroy();

    // Ranking
    graficoRanking = new Chart(
        document.getElementById("graficoRanking"),
        {
            type: "bar",
            data: {
                labels: nomes,
                datasets: [{
                    label: "Total Vendido",
                    data: realizados,
                    backgroundColor: "#64c2d1"
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        }
    );

    // Metas x Realizado
    graficoComparativo = new Chart(
        document.getElementById("graficoComparativo"),
        {
            type: "bar",
            data: {
                labels: nomes,
                datasets: [
                    {
                        label: "Meta",
                        data: metas,
                        backgroundColor: "#e74c3c"
                    },
                    {
                        label: "Realizado",
                        data: realizados,
                        backgroundColor: "#2ecc71"
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" }
                }
            }
        }
    );
}

async function abrirDetalhe(usuarioId) {
    const res = await fetch(`../api/detalhe_colaborador.php?usuario_id=${usuarioId}&mes=${mesSelecionado}`);
    if (!res.ok) {
        alert("Erro ao carregar detalhe");
        return;
    }
    

    const d = await res.json();
    const metaDiariaEl = document.getElementById("dMetaDiaria");

if (d.meta_diaria > 0) {
    metaDiariaEl.innerText =
        `R$ ${Number(d.meta_diaria).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
} else {
    metaDiariaEl.innerText = "Meta atingida 🎉";
}
    const projEl = document.getElementById("dProjecao");

if (d.projecao_final > 0) {
    projEl.innerText =
        `Projeção de fechamento: R$ ${Number(d.projecao_final)
            .toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
} else {
    projEl.innerText = "";
}


    document.getElementById("detalheNome").innerText = d.nome;
    document.getElementById("dTotal").innerText =
        `R$ ${Number(d.total).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
    document.getElementById("dVista").innerText =
        `R$ ${Number(d.vista).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
    document.getElementById("dPercVista").innerText =
        `${d.perc_vista.toFixed(1)}%`;
    document.getElementById("dStatus").innerText = d.status;

    document.getElementById("modalDetalhe").classList.remove("hidden");
    document.getElementById("dDiasComVenda").innerText = d.dias_com_venda;
document.getElementById("dDiasSemVenda").innerText = d.dias_sem_venda;
document.getElementById("dMaiorDia").innerText =
    `R$ ${Number(d.maior_dia).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;
document.getElementById("dMenorDia").innerText =
    `R$ ${Number(d.menor_dia).toLocaleString("pt-BR",{minimumFractionDigits:2})}`;

}

function fecharDetalhe() {
    document.getElementById("modalDetalhe").classList.add("hidden");
}


function obterStatusMeta(percentual) {
    if (percentual >= 100) {
        return { texto: "Meta Batida", classe: "status-ok" };
    }
    if (percentual >= 80) {
        return { texto: "No Ritmo", classe: "status-bom" };
    }
    if (percentual >= 50) {
        return { texto: "Atenção", classe: "status-atencao" };
    }
    return { texto: "Crítico", classe: "status-critico" };
}


// ===============================
// LOGOUT
// ===============================
async function logout() {
    await fetch("../api/logout.php", { method: "POST" });
    window.location.href = "../login.html";
}
