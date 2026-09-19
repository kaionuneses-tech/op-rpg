/* Servidor estático mínimo para testar a pasta site/ localmente.
   Uso: node serve.js  →  http://localhost:4173                    */
const http = require("http"), fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, "docs"), PORTA = 4173;
const TIPOS = {".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8",
  ".js":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".ico":"image/x-icon"};
http.createServer((req, res) => {
  let rel = decodeURIComponent(req.url.split("?")[0]);
  if (rel.endsWith("/")) rel += "index.html";
  const arq = path.join(RAIZ, path.normalize(rel).replace(/^([\/])+/, ""));
  if (!arq.startsWith(RAIZ)) { res.writeHead(403).end("403"); return; }
  fs.readFile(arq, (err, dados) => {
    if (err) { res.writeHead(404, {"Content-Type":"text/plain; charset=utf-8"}).end("404: " + rel); return; }
    res.writeHead(200, {"Content-Type": TIPOS[path.extname(arq).toLowerCase()] || "application/octet-stream"});
    res.end(dados);
  });
}).listen(PORTA, () => console.log("servindo docs/ em http://localhost:" + PORTA));
