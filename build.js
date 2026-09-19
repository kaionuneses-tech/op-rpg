/* Gera docs/forja.html a partir de op-rpg-forja.html.

   A fonte não tem <html>/<head>/<body>: o artefato do Claude envolve a página
   sozinho. Para hospedar em qualquer outro lugar esse envelope precisa existir
   no arquivo — é o que este script faz, separando o que é <head> (title, links
   de fonte, estilos) do que é conteúdo (a partir do <nav>).

   Uso:  node build.js
*/
const fs = require("fs");
const path = require("path");

const RAIZ = __dirname;
const FONTE = path.join(RAIZ, "op-rpg-forja.html");
const SAIDA = path.join(RAIZ, "docs", "forja.html");

const DESCRICAO = "Ferramenta para criar Técnicas de Combate, Técnicas Auxiliares e " +
  "Manifestações de Poder do OP RPG dentro do orçamento de Pontos de Poder de cada grau.";

const RESET = `<style>
:root{color-scheme:light dark;box-sizing:border-box;
  padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
html{scroll-padding-top:env(safe-area-inset-top,0px)}
body{margin:0;padding:0}
img{max-width:100%}
[hidden]:not([hidden=until-found i]){display:none!important}
</style>`;

const fonte = fs.readFileSync(FONTE, "utf8");

const corte = fonte.indexOf("<nav");
if (corte < 0) {
  console.error("erro: não achei o <nav> que separa o head do corpo em " + path.basename(FONTE));
  process.exit(1);
}
const cabeca = fonte.slice(0, corte).trim();
const corpo = fonte.slice(corte).trim();

const titulo = (cabeca.match(/<title>([^<]*)<\/title>/) || [, "Forja de Técnicas"])[1];

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="${DESCRICAO}">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚒️</text></svg>">
${RESET}
${cabeca}
</head>
<body>
${corpo}
</body>
</html>
`;

fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(SAIDA, html);

console.log(`ok  docs/forja.html  —  "${titulo}"  —  ${(html.length / 1024).toFixed(0)} KB`);
