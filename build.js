/* Gera as páginas de docs/ a partir das fontes na raiz.

   As fontes não têm <html>/<head>/<body>: elas também são publicadas como
   artefatos do Claude, que monta esse envelope sozinho. Para hospedar em
   qualquer outro lugar o envelope precisa existir no arquivo — é o que este
   script faz, separando o que é <head> (title, links de fonte, estilos) do
   que é conteúdo (a partir do <nav>).

   Uso:  node build.js
*/
const fs = require("fs");
const path = require("path");

const RAIZ = __dirname;
const SAIDA = path.join(RAIZ, "docs");

const PAGINAS = [
  {
    fonte: "op-rpg-forja.html",
    saida: "forja.html",
    favicon: "⚒️",
    descricao: "Ferramenta para criar Técnicas de Combate, Técnicas Auxiliares e " +
      "Manifestações de Poder do OP RPG dentro do orçamento de Pontos de Poder de cada grau.",
    conta: true
  },
  {
    fonte: "op-rpg-guia.html",
    saida: "guia.html",
    favicon: "🏴‍☠️",
    descricao: "Guia de criação de personagem do OP RPG — da ficha em branco até o 3º nível, " +
      "com montador de ficha que calcula PV, CR, PP e salvaguardas ao vivo.",
    conta: true
  },
  {
    fonte: "op-rpg-anotacoes.html",
    saida: "anotacoes.html",
    favicon: "📜",
    descricao: "Diário de bordo da tripulação: anotações de sessão que acompanham você em qualquer aparelho.",
    conta: true
  }
];

const RESET = `<style>
:root{color-scheme:light dark;box-sizing:border-box;
  padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{margin:0;padding:0}
img{max-width:100%}
[hidden]:not([hidden=until-found i]){display:none!important}
</style>`;

fs.mkdirSync(SAIDA, { recursive: true });

let erros = 0;

for (const p of PAGINAS) {
  const caminho = path.join(RAIZ, p.fonte);
  if (!fs.existsSync(caminho)) {
    console.error(`erro: não achei ${p.fonte}`);
    erros++;
    continue;
  }

  const fonte = fs.readFileSync(caminho, "utf8");
  const corte = fonte.indexOf("<nav");
  if (corte < 0) {
    console.error(`erro: não achei o <nav> que separa o head do corpo em ${p.fonte}`);
    erros++;
    continue;
  }

  const cabeca = fonte.slice(0, corte).trim();
  const corpo = fonte.slice(corte).trim();
  const titulo = (cabeca.match(/<title>([^<]*)<\/title>/) || [, p.saida])[1];

  const scripts = p.conta
    ? `<script src="app/config.js"></script>\n<script src="app/conta.js"></script>`
    : "";

  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${p.descricao}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${p.favicon}</text></svg>">
${RESET}
${cabeca}
${scripts}
</head>
<body>
${corpo}
</body>
</html>
`;

  fs.writeFileSync(path.join(SAIDA, p.saida), html);
  console.log(`ok  docs/${p.saida}  —  "${titulo}"  —  ${(html.length / 1024).toFixed(0)} KB`);
}

process.exit(erros ? 1 : 0);
