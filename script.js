// ===============================
// VARIÁVEIS GLOBAIS
// ===============================
let mesSelecionado = new Date().toISOString().slice(0, 7);

let dados = {
    meta: {
        meta_geral: 0,
        meta_liquida: 0,
        dias_meta: 0,
        fechado: 0
    },
    lancamentos: [],
    estornos: []
};

let editLanc = null;
let editEst = null;

// ===== GRÁFICOS =====
let graficoDiario = null;
let graficoAcumulado = null;
let graficoVistaVsTotal = null;

// ===== ELEMENTOS DO DASHBOARD =====
const totalVendidoEl = document.getElementById("totalVendido");
const valorLiquidoEl = document.getElementById("valorLiquido");
const percentualVistaEl = document.getElementById("percentualVista");

const metaGeralValor = document.getElementById("metaGeralValor");
const metaLiquidaValor = document.getElementById("metaLiquidaValor");

const metaDiariaValor = document.getElementById("metaDiariaValor");
const metaDiariaInfo = document.getElementById("metaDiariaInfo");

let perfilUsuario = null;

// ===============================
// CARREGAR DADOS DO MÊS (API)
// ===============================
async function carregarMes(mes) {
    mesSelecionado = mes;

    let metaData;

if (perfilUsuario === "coord") {
    const res = await fetch(`api/metas.php?mes=${mes}`);
    metaData = await res.json();
} else {
    const res = await fetch(`api/meta_usuario.php?mes=${mes}`);
    metaData = await res.json();
}

dados.meta = {
    meta_geral: Number(metaData.meta_geral || 0),
    meta_liquida: Number(metaData.meta_liquida || 0),
    dias_meta: Number(metaData.dias_meta || 0),
    fechado: Number(metaData.fechado || 0)
};


const lancRes = await fetch(`api/lancamentos.php?mes=${mes}`);
const lancData = await lancRes.json();

dados.lancamentos = lancData.map(l => ({
    ...l,
    total: Number(l.total || 0),
    credito: Number(l.credito || 0),
    debito: Number(l.debito || 0),
    dinheiro: Number(l.dinheiro || 0),
    pix: Number(l.pix || 0),
    boleto: Number(l.boleto || 0)
}));



const estRes = await fetch(`api/estornos.php?mes=${mes}`);
const estData = await estRes.json();

dados.estornos = estData.map(e => ({
    ...e,
    valor: Number(e.valor || 0)
}));


    atualizarHeaderMes();
    atualizarDashboard();
    listarLancamentos();
    listarEstornos();
    atualizarConfigMeta();
    atualizarFechamento();
    desenharGraficos();
}

// ===============================
// HEADER / MÊS
// ===============================
function mudarMes(delta) {
    const [ano, mes] = mesSelecionado.split("-").map(Number);
    const novaData = new Date(ano, mes - 1 + delta, 1);
    const novoMes = `${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, "0")}`;
    carregarMes(novoMes);
}

function atualizarHeaderMes() {
    const [ano, mes] = mesSelecionado.split("-");
    const nomesMes = [
        "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
        "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
    ];
    mesAtualLabel.innerText = `${nomesMes[Number(mes) - 1]} / ${ano}`;
}

// ===============================
// NAVEGAÇÃO
// ===============================
function mostrarAba(id) {
    document.querySelectorAll(".aba").forEach(a => a.classList.remove("ativa"));

    const aba = document.getElementById(id);
    if (!aba) return;

    aba.classList.add("ativa");

    if (id === "config") {
        carregarUsuariosParaMeta();
        carregarHistoricoMetas();
    }
}


// ===============================
// META
// ===============================
async function salvarMeta(e) {
    e.preventDefault();

    if (dados.meta.fechado == 1) {
        alert("Este mês está fechado.");
        return;
    }

    await fetch("api/metas.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            ano_mes: mesSelecionado,
            meta_geral: Number(metaGeralInput.value),
            meta_liquida: Number(metaLiquidaInput.value),
            dias_meta: Number(diasMetaInput.value)
        })
    });

    carregarMes(mesSelecionado);
}

function isDiaUtil(dataStr) {
    const data = new Date(dataStr + "T00:00:00");
    const diaSemana = data.getDay(); 
    // 0 = domingo | 6 = sábado
    return diaSemana !== 0 && diaSemana !== 6;
}


// ===============================
// LANÇAMENTOS
// ===============================
async function salvarLancamento(e) {
    e.preventDefault();

    if (dados.meta.fechado == 1) {
        alert("Mês fechado.");
        return;
    }

    await fetch("api/lancamentos.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: editLanc,
            ano_mes: mesSelecionado,
            data: data.value,
            total: Number(totalDia.value),
            credito: Number(credito.value || 0),
            debito: Number(debito.value || 0),
            dinheiro: Number(dinheiro.value || 0),
            pix: Number(pix.value || 0),
            boleto: Number(boleto.value || 0)
        })
    });

    editLanc = null;
    document.querySelector("#lancamento form").reset();
    carregarMes(mesSelecionado);
}

function editarLancamento(id) {
    if (dados.meta.fechado == 1) return alert("Mês fechado.");

    const l = dados.lancamentos.find(l => l.id == id);
    if (!l) return;

    editLanc = id;
    data.value = l.data;
    totalDia.value = l.total;
    credito.value = l.credito;
    debito.value = l.debito;
    dinheiro.value = l.dinheiro;
    pix.value = l.pix;
    boleto.value = l.boleto;

    mostrarAba("lancamento");
}

async function excluirLancamento(id) {
    if (dados.meta.fechado == 1) return alert("Mês fechado.");
    if (!confirm("Excluir lançamento?")) return;

    await fetch("api/lancamentos.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    });

    carregarMes(mesSelecionado);
}

// ===============================
// ESTORNOS
// ===============================
async function salvarEstorno(e) {
    e.preventDefault();

    if (dados.meta.fechado == 1) {
        alert("Mês fechado.");
        return;
    }

    await fetch("api/estornos.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: editEst,
            ano_mes: mesSelecionado,
            data: dataEstorno.value,
            paciente: pacienteEstorno.value,
            valor: Number(valorEstorno.value)
        })
    });

    editEst = null;
    document.querySelector("#estornos form").reset();
    carregarMes(mesSelecionado);
}

function editarEstorno(id) {
    if (dados.meta.fechado == 1) return alert("Mês fechado.");

    const e = dados.estornos.find(e => e.id == id);
    if (!e) return;

    editEst = id;
    dataEstorno.value = e.data;
    pacienteEstorno.value = e.paciente;
    valorEstorno.value = e.valor;

    mostrarAba("estornos");
}

async function excluirEstorno(id) {
    if (dados.meta.fechado == 1) return alert("Mês fechado.");
    if (!confirm("Excluir estorno?")) return;

    await fetch("api/estornos.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
    });

    carregarMes(mesSelecionado);
}

// ===============================
// DASHBOARD / KPIs
function atualizarDashboard() {

    // ===== TOTAIS =====
    const totalVendido = dados.lancamentos.reduce(
        (s, l) => s + Number(l.total || 0),
        0
    );

    const totalVista = dados.lancamentos.reduce(
        (s, l) =>
            s +
            Number(l.debito || 0) +
            Number(l.dinheiro || 0) +
            Number(l.pix || 0) +
            Number(l.boleto || 0),
        0
    );

    // ===== KPIs =====
    totalVendidoEl.innerText = `R$ ${totalVendido.toFixed(2)}`;
    valorLiquidoEl.innerText = `R$ ${totalVista.toFixed(2)}`;
    percentualVistaEl.innerText =
        totalVendido > 0
            ? `${((totalVista / totalVendido) * 100).toFixed(1)}%`
            : "0%";

    // ===== METAS =====
    const metaGeral = Number(dados.meta.meta_geral || 0);
    const metaLiquida = Number(dados.meta.meta_liquida || 0);

    metaGeralValor.innerText = `R$ ${metaGeral.toFixed(2)}`;
    metaLiquidaValor.innerText = `R$ ${metaLiquida.toFixed(2)}`;

    // ===== BARRAS DE PROGRESSO =====
    const barraGeral = document.getElementById("barraGeral");
    const barraLiquida = document.getElementById("barraLiquida");

    // Percentuais
    const percGeral =
        metaGeral > 0 ? (totalVendido / metaGeral) * 100 : 0;

    const percLiquida =
        metaLiquida > 0 ? (totalVista / metaLiquida) * 100 : 0;

    // Aplica largura (limitado a 100%)
    barraGeral.style.width = `${Math.min(percGeral, 100)}%`;
    barraLiquida.style.width = `${Math.min(percLiquida, 100)}%`;

    // Cores dinâmicas
    barraGeral.style.background =
        percGeral >= 100 ? "#22c55e" : "#06b6d4";

    barraLiquida.style.background =
        percLiquida >= 100 ? "#22c55e" : "#06b6d4";

    // ===== META DIÁRIA =====
    atualizarMetaDiaria();
}


// ===============================
// META DIÁRIA
// ===============================
function atualizarMetaDiaria() {
    const meta = dados.meta.meta_geral || 0;
    const diasMeta = dados.meta.dias_meta || 0;

    const totalProduzido = dados.lancamentos.reduce(
        (s, l) => s + Number(l.total || 0),
        0
    );

    const faltante = meta - totalProduzido;

    if (!meta || !diasMeta) {
        metaDiariaValor.innerText = "Configurar meta";
        metaDiariaInfo.innerText = "Informe meta e dias de produção";
        return;
    }

    if (faltante <= 0) {
        metaDiariaValor.innerText = "Meta atingida 🎉";
        metaDiariaInfo.innerText = "Parabéns, objetivo do mês alcançado";
        return;
    }

    // 👉 AQUI É O PONTO QUE VOCÊ ALTERA
    const diasUsados = new Set(
        dados.lancamentos
            .filter(l => isDiaUtil(l.data))
            .map(l => l.data)
    ).size;

    const diasRestantes = diasMeta - diasUsados;

    if (diasRestantes <= 0) {
        metaDiariaValor.innerText = "Dias esgotados";
        metaDiariaInfo.innerText = "Meta não atingida no prazo";
        return;
    }

    const metaDiaria = faltante / diasRestantes;

    metaDiariaValor.innerText = `R$ ${metaDiaria.toFixed(2)}`;
    metaDiariaInfo.innerText = `${diasRestantes} dias úteis restantes`;
}

// ===============================
// LISTAS
// ===============================
function listarLancamentos() {
    listaLancamentos.innerHTML = "";
    dados.lancamentos.forEach(l => {
        const vista = l.debito + l.dinheiro + l.pix + l.boleto;
        listaLancamentos.innerHTML += `
        <tr>
            <td>${l.data}</td>
            <td>R$ ${l.total.toFixed(2)}</td>
            <td>R$ ${vista.toFixed(2)}</td>
            <td>
                <button onclick="editarLancamento(${l.id})">Editar</button>
                <button onclick="excluirLancamento(${l.id})">Excluir</button>
            </td>
        </tr>`;
    });
}

function listarEstornos() {
    listaEstornos.innerHTML = "";
    dados.estornos.forEach(e => {
        listaEstornos.innerHTML += `
        <tr>
            <td>${e.data}</td>
            <td>${e.paciente}</td>
<td>R$ ${Number(e.valor || 0).toFixed(2)}</td>
            <td>
                <button onclick="editarEstorno(${e.id})">Editar</button>
                <button onclick="excluirEstorno(${e.id})">Excluir</button>
            </td>
        </tr>`;
    });
}

// ===============================
// FECHAMENTO
// ===============================
async function fecharMes() {
    if (!confirm("Fechar mês?")) return;

    await fetch("api/fechamento.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano_mes: mesSelecionado, acao: "fechar" })
    });

    carregarMes(mesSelecionado);
}

async function reabrirMes() {
    if (!confirm("Reabrir mês?")) return;

    await fetch("api/fechamento.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ano_mes: mesSelecionado, acao: "reabrir" })
    });

    carregarMes(mesSelecionado);
}

function atualizarConfigMeta() {
    if (!metaGeralInput || !metaLiquidaInput || !diasMetaInput) return;

    metaGeralInput.value = dados.meta.meta_geral || "";
    metaLiquidaInput.value = dados.meta.meta_liquida || "";
    diasMetaInput.value = dados.meta.dias_meta || "";
}

function atualizarFechamento() {
    let total = 0;
    let vista = 0;
    let est = 0;

    dados.lancamentos.forEach(l => {
        total += Number(l.total || 0);
        vista +=
            Number(l.debito || 0) +
            Number(l.dinheiro || 0) +
            Number(l.pix || 0) +
            Number(l.boleto || 0);
    });

    dados.estornos.forEach(e => {
        est += Number(e.valor || 0);
    });

    const liquido = total - est;
    const percVista = total ? (vista / total) * 100 : 0;

    fTotalBruto.innerText = `R$ ${total.toFixed(2)}`;
    fEstornos.innerText = `R$ ${est.toFixed(2)}`;
    fLiquido.innerText = `R$ ${liquido.toFixed(2)}`;
    fVistaValor.innerText = `R$ ${vista.toFixed(2)}`;
    fVistaPercentual.innerText = `${percVista.toFixed(1)}%`;

    const statusCard = document.getElementById("statusCard");

    if (liquido >= dados.meta.meta_geral) {
        fStatusMeta.innerText = "Meta Atingida ✅";
        statusCard.classList.remove("erro");
        statusCard.classList.add("ok");
    } else {
        fStatusMeta.innerText = "Meta Não Atingida ❌";
        statusCard.classList.remove("ok");
        statusCard.classList.add("erro");
    }

    btnFecharMes.style.display = dados.meta.fechado == 1 ? "none" : "inline-block";
    btnReabrirMes.style.display = dados.meta.fechado == 1 ? "inline-block" : "none";
}

function obterDadosPorDia() {
    const mapa = {};

    dados.lancamentos.forEach(l => {
        if (!mapa[l.data]) mapa[l.data] = 0;
        mapa[l.data] += Number(l.total || 0);
    });

    const dias = Object.keys(mapa).sort();
    const valores = dias.map(d => mapa[d]);

    return { dias, valores };
}

function obterDadosAcumulados() {
    const { dias, valores } = obterDadosPorDia();
    let acumulado = 0;

    const acumulados = valores.map(v => {
        acumulado += v;
        return acumulado;
    });

    const metaLinha = dias.map(() => Number(dados.meta.meta_geral || 0));

    return { dias, acumulados, metaLinha };
}
function obterDadosVistaVsTotal() {
    const mapa = {};

    dados.lancamentos.forEach(l => {
        if (!mapa[l.data]) {
            mapa[l.data] = { total: 0, vista: 0 };
        }

        mapa[l.data].total += Number(l.total || 0);
        mapa[l.data].vista +=
            Number(l.debito || 0) +
            Number(l.dinheiro || 0) +
            Number(l.pix || 0) +
            Number(l.boleto || 0);
    });

    const dias = Object.keys(mapa).sort();
    const totais = dias.map(d => mapa[d].total);
    const vistas = dias.map(d => mapa[d].vista);

    return { dias, totais, vistas };
}


function desenharGraficos() {

    const dadosDia = obterDadosPorDia();
    const dadosAcum = obterDadosAcumulados();
    const dadosComparativo = obterDadosVistaVsTotal();

    // Limpa gráficos antigos
    if (graficoDiario) graficoDiario.destroy();
    if (graficoAcumulado) graficoAcumulado.destroy();
    if (graficoVistaVsTotal) graficoVistaVsTotal.destroy();

    // ===== GRÁFICO 1 — VENDAS POR DIA =====
    graficoDiario = new Chart(
        document.getElementById("graficoDiario"),
        {
            type: "bar",
            data: {
                labels: dadosDia.dias,
                datasets: [{
                    label: "Total Vendido",
                    data: dadosDia.valores,
                    backgroundColor: "#64c2d1"
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } }
            }
        }
    );

    // ===== GRÁFICO 2 — EVOLUÇÃO DO MÊS =====
    graficoAcumulado = new Chart(
        document.getElementById("graficoAcumulado"),
        {
            type: "line",
            data: {
                labels: dadosAcum.dias,
                datasets: [
                    {
                        label: "Acumulado do Mês",
                        data: dadosAcum.acumulados,
                        borderColor: "#2ecc71",
                        backgroundColor: "rgba(46,204,113,0.2)",
                        tension: 0.3,
                        fill: true
                    },
                    {
                        label: "Meta do Mês",
                        data: dadosAcum.metaLinha,
                        borderColor: "#e74c3c",
                        borderDash: [6, 6],
                        pointRadius: 0,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: "bottom" } }
            }
        }
    );

    // ===== GRÁFICO 3 — TOTAL x À VISTA =====
    graficoVistaVsTotal = new Chart(
        document.getElementById("graficoVistaVsTotal"),
        {
            type: "bar",
            data: {
                labels: dadosComparativo.dias,
                datasets: [
                    {
                        label: "Total Vendido",
                        data: dadosComparativo.totais,
                        backgroundColor: "#64c2d1"
                    },
                    {
                        label: "À Vista",
                        data: dadosComparativo.vistas,
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

async function logout() {
    await fetch("api/logout.php", { method: "POST" });
    window.location.href = "login.html";
}




async function carregarUsuarioLogado() {
    const res = await fetch("api/me.php");
    const user = await res.json();

    if (!res.ok) {
        window.location.href = "login.html";
        return;
    }

    perfilUsuario = user.perfil;

    document.getElementById("usuarioLogado").innerText = `👤 ${user.nome}`;

    aplicarPermissoes();
}

function aplicarPermissoes() {
    if (perfilUsuario !== "coord") {
        document.querySelectorAll(".so-coord").forEach(el => {
            el.style.display = "none";
        });
    }
}


async function carregarUsuariosParaMeta() {
    if (perfilUsuario !== "coord") return;

    const res = await fetch("api/usuarios.php");
    const lista = await res.json();

    const sel = document.getElementById("usuarioMeta");
    sel.innerHTML = "";

    lista.forEach(u => {
        sel.innerHTML += `<option value="${u.id}">${u.nome}</option>`;
    });
}

async function salvarMetaUsuario(e) {
    e.preventDefault();

    if (!usuarioMeta.value) {
        alert("Selecione uma colaboradora");
        return;
    }

    const payload = {
        usuario_id: Number(usuarioMeta.value),
        mes: mesSelecionado, // ✅ CORRETO
        meta_geral: Number(metaGeralInput.value || 0),
        meta_liquida: Number(metaLiquidaInput.value || 0),
        dias_meta: Number(diasMetaInput.value || 0)
    };

    const res = await fetch("api/salvar_meta_usuario.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    });

    if (!res.ok) {
        alert("Erro ao salvar meta");
        return;
    }

    alert("Meta salva com sucesso!");

    carregarHistoricoMetas(); // 🔄 atualiza histórico
}


async function carregarHistoricoMetas() {
    if (perfilUsuario !== "coord") return;

    const tbody = document.getElementById("listaMetas");
    if (!tbody) return;

    const res = await fetch("api/metas_historico.php");
    if (!res.ok) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;color:#777">
                    Erro ao carregar histórico
                </td>
            </tr>
        `;
        return;
    }

    const lista = await res.json();
    tbody.innerHTML = "";

    if (lista.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;color:#777">
                    Nenhuma meta cadastrada
                </td>
            </tr>
        `;
        return;
    }

    lista.forEach(m => {
        tbody.innerHTML += `
        <tr>
            <td>${m.nome}</td>
            <td>${m.ano_mes}</td>
            <td>R$ ${Number(m.meta_geral).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
            <td>R$ ${Number(m.meta_liquida).toLocaleString("pt-BR",{minimumFractionDigits:2})}</td>
            <td>${m.dias_meta}</td>
            <td class="acoes">
                <button class="btn-editar" onclick="editarMeta(${m.id})">Editar</button>
                <button class="btn-excluir" onclick="excluirMeta(${m.id})">Excluir</button>
            </td>
        </tr>
        `;
    });
}


async function editarMeta(id) {
    const res = await fetch(`api/meta_por_id.php?id=${id}`);
    if (!res.ok) {
        alert("Erro ao carregar meta");
        return;
    }

    const m = await res.json();

    usuarioMeta.value = m.usuario_id;
    metaGeralInput.value = m.meta_geral;
    metaLiquidaInput.value = m.meta_liquida;
    diasMetaInput.value = m.dias_meta;

    mostrarAba("config");
}


async function excluirMeta(id) {
    if (!confirm("Excluir esta meta?")) return;

    await fetch("api/excluir_meta.php", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ id })
    });

    carregarHistoricoMetas();
}

function aplicarPermissoes() {

    // Se for COORDENADOR
    if (perfilUsuario === "coord") {

        // Esconde tudo operacional
        document.querySelectorAll(".menu-operacional").forEach(el => {
            el.style.display = "none";
        });

        // Garante que itens de coord apareçam
        document.querySelectorAll(".menu-coord").forEach(el => {
            el.style.display = "inline-flex";
        });

        // Abre direto a configuração de meta
        mostrarAba("config");
    }

    // Se for USUÁRIO NORMAL
    if (perfilUsuario === "usuario") {

        // Esconde itens de coordenação
        document.querySelectorAll(".menu-coord").forEach(el => {
            el.style.display = "none";
        });
    }
}



// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", async () => {
    await carregarUsuarioLogado();   // carrega perfil
    await carregarUsuariosParaMeta(); // popula o select
    carregarMes(mesSelecionado);
});

