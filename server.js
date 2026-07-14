const express = require("express");
const app = express();

app.use(express.json());
app.use(express.static("public"));

// Alfabeto da Base62
const BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// BANCO_DADOS
const bancoDeDados = [null];

// A FUNÇÃO DE GERAÇÂO
function converterParaBase62(id) {
    if (id === 0) return BASE62[0];

    let resultado = "";
    let numero = id;

    while (numero > 0) {
        let resto = numero % 62; // Pega o resto da divisão
        resultado = BASE62[resto] + resultado; // Adiciona a letra de trás pra frente
        numero = Math.floor(numero / 62); // Pega o resultado inteiro para a próxima rodada
    }
    return resultado;
}

// Rota POST que recebe a URL do site
app.post("/encurtar", (req, res) => {
    const urlOriginal = req.body.url;

    // Link encurtado + Temporario
    const tempoDeVida = 60 * 1000; // 1 min
    const momentoDaMorte = Date.now() + tempoDeVida;

    // Salva na última linha do banco para descobre qual é o ID
    bancoDeDados.push({
        url: urlOriginal,
        expira: momentoDaMorte
    });
    const id = bancoDeDados.length - 1;

    // Chama funçaõ e transforma o ID em link curto
    const codigoCurto = converterParaBase62(id);

    res.json({ urlCurta: `http://localhost:3000/${codigoCurto}` });
});

// Rota que faz o redirecionamento
app.get("/:codigo", (req, res) => {
    const codigo = req.params.codigo;

    // Procura no banco qual URL original tem esse código
    const id = bancoDeDados.findIndex((_, index) => converterParaBase62(index) === codigo);
    const registro = bancoDeDados[id]; // Para a comparaçaõ de tempo funcionar

    if (id !== -1 && bancoDeDados[id]) {
        // Verifica que horas são AGORA e compara com a hora de expirar do link salvo no banco "expirar"
        if (Date.now() > registro.expira) {
            res.status(410).send("<h1 style='text-align:center; margin-top:50px;'>⏳ Ops! Este link se autodestruiu após 1 minuto.</h1>");
        } else {
            res.redirect(registro.url); // Manda o navegador para o link de destino (ORIGINAL)
        }
    } else {
        res.status(404).send("Link não encontrado!");
    }
});

app.listen(3000, () => {
    console.log(`Servidor rodando em http://localhost:3000`);
});