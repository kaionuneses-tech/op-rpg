/* ═══════════════════════════════════════════════════════════════════════
   Painel de Aparência — OP RPG

   Uma implementação só, usada pelas três páginas. Cada página só precisa
   ter um <button id="themebtn"> na barra do topo: este módulo o transforma
   no botão "Cores" e monta o painel inteiro ao lado dele.

   As preferências ficam no localStorage com as mesmas chaves em todas as
   páginas, então escolher uma cor na forja muda o guia e o diário também.

   Roda em duas partes:
     1. na hora em que o <script> é lido (dentro do <head>), aplica tema,
        paleta e cores — antes da página desenhar, para não haver piscada;
     2. quando o DOM termina, monta o painel e liga os controles.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var root = document.documentElement;
  var cfg = window.OPRPG_APARENCIA || {};

  /* ───────────────────────────── catálogos ───────────────────────────── */

  var PALETAS = [
    {id:"", nome:"Marinho",  c:["#B8372C","#96660C","#1C6478"]},
    {id:"grandline", nome:"Grand Line", c:["#0F7A6E","#8A6100","#1E5F8A"]},
    {id:"porsol", nome:"Pôr do Sol", c:["#C05A16","#8C6A00","#8A4A6E"]},
    {id:"yonko", nome:"Yonko", c:["#6E3A9E","#96660C","#2E6B8F"]},
    {id:"kairoseki", nome:"Kairoseki", c:["#2B5C7A","#6E7A2E","#4A6070"]}
  ];
  var FONTES_TITULO = [
    ["oswald",  "Oswald — condensada (padrão)", '"Oswald","Arial Narrow",Arial,sans-serif'],
    ["cinzel",  "Cinzel — clássica",            '"Cinzel",Georgia,serif'],
    ["bebas",   "Bebas Neue — cartaz",          '"Bebas Neue","Arial Narrow",sans-serif'],
    ["archivo", "Archivo Black — pesada",       '"Archivo Black",Impact,sans-serif'],
    ["spectral","Spectral — serifada",          '"Spectral",Georgia,serif'],
    ["plexsans","IBM Plex Sans — neutra",       '"IBM Plex Sans",system-ui,sans-serif']
  ];
  var FONTES_CORPO = [
    ["spectral","Spectral — serifada (padrão)", '"Spectral",Georgia,"Times New Roman",serif'],
    ["lora",    "Lora — serifada suave",        '"Lora",Georgia,serif'],
    ["sourcesans","Source Sans 3 — sem serifa", '"Source Sans 3",system-ui,sans-serif'],
    ["plexsans","IBM Plex Sans — sem serifa",   '"IBM Plex Sans",system-ui,sans-serif'],
    ["atkinson","Atkinson Hyperlegible — alta legibilidade", '"Atkinson Hyperlegible",system-ui,sans-serif']
  ];
  var FONTES_NUM = [
    ["plexmono","IBM Plex Mono (padrão)", '"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace'],
    ["sourcesans","Source Sans 3",        '"Source Sans 3",system-ui,sans-serif'],
    ["plexsans","IBM Plex Sans",          '"IBM Plex Sans",system-ui,sans-serif'],
    ["atkinson","Atkinson Hyperlegible",  '"Atkinson Hyperlegible",system-ui,sans-serif']
  ];
  var CORES_LIVRES = [
    {id:"red",     varname:"--red",      rotulo:"Destaque — títulos, botões"},
    {id:"gold",    varname:"--gold",     rotulo:"Energia — números e medidores"},
    {id:"sea",     varname:"--sea",      rotulo:"Informação — links"},
    {id:"ok",      varname:"--ok",       rotulo:"Sucesso — confirmações"},
    {id:"ink",     varname:"--ink",      rotulo:"Texto principal"},
    {id:"ink2",    varname:"--ink2",     rotulo:"Texto secundário"},
    {id:"surf",    varname:"--surf",     rotulo:"Painéis"},
    {id:"surf2",   varname:"--surf2",    rotulo:"Cabeçalhos e campos"},
    {id:"bar",     varname:"--bar",      rotulo:"Barras escuras"},
    {id:"bar-ink", varname:"--bar-ink",  rotulo:"Texto das barras"},
    {id:"line",    varname:"--line",     rotulo:"Bordas e divisórias"}
  ];
  /* o fundo tem painel próprio, mas é uma cor livre como as outras */
  var COR_FUNDO = {id:"paper", varname:"--paper", rotulo:"Cor do fundo"};
  var TODAS_CORES = CORES_LIVRES.concat([COR_FUNDO]);

  var FORMATACAO = [
    {id:"tamanho",    varname:"--fs-scale",    sel:"f-tamanho",    padrao:"16"},
    {id:"titulos",    varname:"--title-scale", sel:"f-titulos",    padrao:"1"},
    {id:"entrelinha", varname:"--lh",          sel:"f-entrelinha", padrao:"1.6"},
    {id:"densidade",  varname:"--dens",        sel:"f-densidade",  padrao:"1"},
    {id:"cantos",     varname:"--radius",      sel:"f-cantos",     padrao:"3px"}
  ];

  /* texturas geradas em CSS — não dependem de nenhum arquivo externo */
  var TEXTURAS = [
    {id:"", nome:"Sem textura", css:"none", size:"auto", repeat:"no-repeat"},
    {id:"pontos", nome:"Pontilhado", size:"20px 20px", repeat:"repeat",
     css:"radial-gradient(color-mix(in srgb, var(--ink) 12%, transparent) 1px, transparent 1px)"},
    {id:"grade", nome:"Grade náutica", size:"auto", repeat:"repeat",
     css:"repeating-linear-gradient(0deg, color-mix(in srgb, var(--ink) 7%, transparent) 0 1px, transparent 1px 44px),"
       + "repeating-linear-gradient(90deg, color-mix(in srgb, var(--ink) 7%, transparent) 0 1px, transparent 1px 44px)"},
    {id:"ondas", nome:"Ondas", size:"auto", repeat:"repeat",
     css:"repeating-linear-gradient(135deg, color-mix(in srgb, var(--sea) 11%, transparent) 0 2px, transparent 2px 17px)"},
    {id:"bruma", nome:"Bruma", size:"cover", repeat:"no-repeat",
     css:"radial-gradient(900px 520px at 12% 6%, color-mix(in srgb, var(--sea) 20%, transparent), transparent 70%),"
       + "radial-gradient(820px 470px at 88% 20%, color-mix(in srgb, var(--red) 16%, transparent), transparent 68%),"
       + "radial-gradient(760px 430px at 48% 98%, color-mix(in srgb, var(--gold) 15%, transparent), transparent 70%)"},
    {id:"papel", nome:"Papel envelhecido", size:"110px 110px", repeat:"repeat",
     css:"radial-gradient(circle at 22% 28%, color-mix(in srgb, var(--gold) 13%, transparent) 0 7px, transparent 8px),"
       + "radial-gradient(circle at 72% 64%, color-mix(in srgb, var(--gold) 9%, transparent) 0 11px, transparent 12px),"
       + "radial-gradient(circle at 48% 88%, color-mix(in srgb, var(--ink) 5%, transparent) 0 5px, transparent 6px)"},
    {id:"escamas", nome:"Escamas", size:"32px 32px", repeat:"repeat",
     css:"radial-gradient(circle at 50% 100%, transparent 0 13px, color-mix(in srgb, var(--sea) 13%, transparent) 13px 15px, transparent 15px)"}
  ];

  /* ──────────────────────────── preferências ─────────────────────────── */

  function lerPref(k, d){ try{ var v = localStorage.getItem(k); return v === null ? d : v; }catch(e){ return d; } }
  function gravarPref(k, v){ try{ localStorage.setItem(k, v); }catch(e){} }

  var tema = lerPref("oprpg-theme", "auto");
  var paleta = lerPref("oprpg-palette", "");
  var coresLivres = {};
  TODAS_CORES.forEach(function(c){ coresLivres[c.id] = lerPref("oprpg-cor-" + c.id, ""); });
  var fontes = {
    display: lerPref("oprpg-font-display", "oswald"),
    corpo:   lerPref("oprpg-font-corpo", "spectral"),
    numeros: lerPref("oprpg-font-numeros", "plexmono")
  };
  var formatacao = {};
  FORMATACAO.forEach(function(f){ formatacao[f.id] = lerPref("oprpg-fmt-" + f.id, f.padrao); });
  var fundo = {
    textura: lerPref("oprpg-bg-textura", ""),
    imagem:  lerPref("oprpg-bg-img", ""),
    veu:     lerPref("oprpg-bg-veu", "0"),
    painel:  lerPref("oprpg-bg-painel", "100"),
    fixo:    lerPref("oprpg-bg-fixo", "0") === "1"
  };

  /* ────────────────────── parte 1 · CSS e aplicação ──────────────────── */

  /* Superfícies que ficam translúcidas quando há imagem de fundo. A união
     das três páginas: um seletor que não existe aqui simplesmente não casa. */
  var SUPERFICIES = cfg.superficies ||
    ".panel, .card, .ledger, .statblock, .tablebox, .lista, .editor, " +
    ".example, .stylecard, .lvlcard, .fact, .bigstat, .fichas-corpo";

  var CSS = [
    /* tokens de tipografia e formatação — as páginas os consomem */
    ':root{--font-display:"Oswald","Arial Narrow",Arial,sans-serif;',
    '  --font-body:"Spectral",Georgia,"Times New Roman",serif;',
    '  --font-mono:"IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace;',
    "  --fs-scale:1; --lh:1.6; --dens:1; --radius:3px; --ls-title:0em; --title-scale:1;",
    "  --surf-mix:100%; --surf-blur:0px;",
    "  --bg-image:none; --bg-size:auto; --bg-repeat:no-repeat; --bg-attach:scroll;",
    "  --onaccent:#FFFFFF}",
    '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--onaccent:#0A131A}}',
    ':root[data-theme="dark"]{--onaccent:#0A131A}',

    /* paletas prontas — variante clara */
    ':root[data-palette="grandline"]{ --red:#0F7A6E; --gold:#8A6100; --sea:#1E5F8A; --ok:#2C6A45; }',
    ':root[data-palette="porsol"]  { --red:#C05A16; --gold:#8C6A00; --sea:#8A4A6E; --ok:#3F7046; }',
    ':root[data-palette="yonko"]   { --red:#6E3A9E; --gold:#96660C; --sea:#2E6B8F; --ok:#25705A; }',
    ':root[data-palette="kairoseki"]{ --red:#2B5C7A; --gold:#6E7A2E; --sea:#4A6070; --ok:#2E6B5B; }',
    /* variante escura — especificidade maior que a do bloco escuro da página */
    "@media (prefers-color-scheme: dark){",
    ' :root[data-palette="grandline"]:not([data-theme="light"]){ --red:#4FC0B0; --gold:#DFA845; --sea:#6BADE0; --ok:#5FBE92; }',
    ' :root[data-palette="porsol"]:not([data-theme="light"])  { --red:#F0904A; --gold:#D9B34A; --sea:#D98BB8; --ok:#6FBE7E; }',
    ' :root[data-palette="yonko"]:not([data-theme="light"])   { --red:#B292E8; --gold:#DFA845; --sea:#6FB3D6; --ok:#4FB58D; }',
    ' :root[data-palette="kairoseki"]:not([data-theme="light"]){ --red:#6FB0D4; --gold:#BFC96B; --sea:#9AB0C0; --ok:#5FC0A8; }}',
    ':root[data-palette="grandline"][data-theme="dark"]{ --red:#4FC0B0; --gold:#DFA845; --sea:#6BADE0; --ok:#5FBE92; }',
    ':root[data-palette="porsol"][data-theme="dark"]  { --red:#F0904A; --gold:#D9B34A; --sea:#D98BB8; --ok:#6FBE7E; }',
    ':root[data-palette="yonko"][data-theme="dark"]   { --red:#B292E8; --gold:#DFA845; --sea:#6FB3D6; --ok:#4FB58D; }',
    ':root[data-palette="kairoseki"][data-theme="dark"]{ --red:#6FB0D4; --gold:#BFC96B; --sea:#9AB0C0; --ok:#5FC0A8; }',

    /* fundo da página: véu + textura + imagem, nessa ordem de camadas */
    "body{background-color:var(--paper); background-image:var(--bg-image); background-size:var(--bg-size);",
    "  background-repeat:var(--bg-repeat); background-attachment:var(--bg-attach); background-position:center}",
    SUPERFICIES + "{background:color-mix(in srgb, var(--surf) var(--surf-mix), transparent);",
    "  backdrop-filter:blur(var(--surf-blur))}",

    /* botão de voltar ao início */
    ".homebtn{flex:none; display:inline-flex; align-items:center; gap:6px; text-decoration:none;",
    "  border:1px solid var(--line); background:var(--surf); color:var(--ink2); border-radius:var(--radius);",
    "  padding:6px 10px; font-family:var(--font-display); font-size:calc(12px * var(--fs-scale));",
    "  font-weight:500; letter-spacing:.09em; text-transform:uppercase; white-space:nowrap}",
    ".homebtn:hover{border-color:var(--red); color:var(--red)}",
    "@media (max-width:620px){.homebtn .rot{display:none} .homebtn{padding:6px 9px}}",

    /* o botão que abre o painel */
    "#themebtn{border:1px solid var(--line); background:var(--surf); color:var(--ink2); border-radius:var(--radius);",
    "  padding:6px 11px; cursor:pointer; font-family:var(--font-display); font-size:calc(12px * var(--fs-scale));",
    "  font-weight:500; letter-spacing:.09em; text-transform:uppercase; display:flex; align-items:center; gap:7px}",
    "#themebtn:hover{border-color:var(--line2); color:var(--ink)}",
    "#themebtn .dot{width:11px; height:11px; border-radius:50%; background:var(--red); flex:none;",
    "  box-shadow:0 0 0 1px color-mix(in srgb, var(--ink) 20%, transparent)}",
    "@media (max-width:620px){#themebtn .rot{display:none} #themebtn{padding:6px 9px}}",

    /* o painel */
    "#pop{width:min(330px, calc(100vw - 32px)); max-height:min(76vh, 640px); overflow-y:auto}",
    "#pop h4{display:flex; justify-content:space-between; align-items:baseline; gap:8px}",
    "#pop h4 + h4, #pop .sec2{margin-top:15px}",
    "#pop h4 button{border:0; background:none; padding:0; cursor:pointer; color:var(--sea);",
    "  font-family:var(--font-mono); font-size:calc(9.5px * var(--fs-scale)); letter-spacing:.08em; text-transform:uppercase}",
    "#pop h4 button:hover{color:var(--red)}",
    "#pop select{width:100%; font-family:var(--font-body); font-size:calc(14px * var(--fs-scale)); color:var(--ink);",
    "  background:var(--surf2); border:1px solid var(--line); border-radius:var(--radius); padding:6px 8px}",
    "#pop select + select{margin-top:7px}",
    ".cpick{display:grid; grid-template-columns:auto 1fr; gap:8px; align-items:center; margin-top:7px}",
    ".cpick input[type=color]{width:34px; height:30px; padding:0; border:1px solid var(--line2);",
    "  border-radius:50%; background:none; cursor:pointer; overflow:hidden; flex:none}",
    ".cpick input[type=color]::-webkit-color-swatch-wrapper{padding:2px}",
    ".cpick input[type=color]::-webkit-color-swatch{border:0; border-radius:50%}",
    ".cpick input[type=color]::-moz-color-swatch{border:0; border-radius:50%}",
    ".cpick .lab{font-family:var(--font-mono); font-size:calc(10px * var(--fs-scale)); letter-spacing:.06em;",
    "  text-transform:uppercase; color:var(--ink3); line-height:1.2}",
    ".cpick input[type=text]{width:100%; font-family:var(--font-mono); font-size:calc(12.5px * var(--fs-scale));",
    "  text-transform:uppercase; color:var(--ink); background:var(--surf2); border:1px solid var(--line);",
    "  border-radius:var(--radius); padding:4px 7px; margin-top:2px}",
    ".cpick input[type=text].bad{border-color:var(--red); color:var(--red)}",
    ".popseg{display:flex; border:1px solid var(--line); border-radius:var(--radius); overflow:hidden}",
    ".popseg button{flex:1; border:0; border-right:1px solid var(--line); background:var(--surf2); color:var(--ink2);",
    "  font-family:var(--font-display); font-size:calc(12px * var(--fs-scale)); font-weight:500; letter-spacing:.05em;",
    "  padding:7px 4px; cursor:pointer; text-transform:uppercase}",
    ".popseg button:last-child{border-right:0}",
    ".popseg button:hover{background:var(--surf3); color:var(--ink)}",
    '.popseg button[aria-pressed="true"]{background:var(--red); color:var(--onaccent)}',
    ".swatches{display:grid; grid-template-columns:repeat(5,1fr); gap:7px}",
    ".sw{border:1px solid var(--line2); background:var(--surf2); border-radius:var(--radius); padding:6px 3px 5px;",
    "  cursor:pointer; display:flex; flex-direction:column; align-items:center; gap:5px}",
    ".sw:hover{border-color:var(--ink3)}",
    '.sw[aria-pressed="true"]{border-color:var(--red); border-width:2px; padding:5px 2px 4px}',
    ".sw i{display:block; width:100%; height:13px; border-radius:2px}",
    ".sw span{font-family:var(--font-mono); font-size:calc(8px * var(--fs-scale)); letter-spacing:.04em;",
    "  color:var(--ink3); text-transform:uppercase; line-height:1}",
    "#pop .slider{display:grid; grid-template-columns:1fr auto; gap:4px 8px; align-items:center; margin-top:9px}",
    "#pop .slider .lab{font-family:var(--font-mono); font-size:calc(10px * var(--fs-scale)); letter-spacing:.06em;",
    "  text-transform:uppercase; color:var(--ink3)}",
    "#pop .slider .val{font-family:var(--font-mono); font-size:calc(11px * var(--fs-scale)); color:var(--ink2); text-align:right}",
    "#pop .slider input[type=range]{grid-column:1 / -1; width:100%; accent-color:var(--red); margin:0}",
    "#pop .filelinha{display:flex; gap:7px; margin-top:8px; flex-wrap:wrap}",
    "#pop .filelinha .btn{flex:1 1 auto; padding:6px 10px; font-size:calc(12px * var(--fs-scale))}",
    "#pop .aviso{font-size:calc(12px * var(--fs-scale)); color:var(--ink2); margin-top:7px; line-height:1.4}",
    "#pop .aviso.bad{color:var(--red)}",
    "#pop .chkline{display:flex; align-items:center; gap:8px; margin-top:9px;",
    "  font-size:calc(13px * var(--fs-scale)); color:var(--ink2); cursor:pointer}",
    "#pop .chkline input{width:15px; height:15px; accent-color:var(--red); margin:0}"
  ].join("\n");

  var FONTES_EXTRA = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700"
    + "&family=Bebas+Neue&family=Archivo+Black&family=Lora:ital,wght@0,400;0,600;1,400"
    + "&family=Source+Sans+3:wght@400;600"
    + "&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400"
    + "&family=IBM+Plex+Sans:wght@400;600&display=swap";

  function injetar(){
    var s = document.createElement("style");
    s.id = "aparencia-css";
    s.textContent = CSS;
    document.head.appendChild(s);
    var l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = FONTES_EXTRA;
    document.head.appendChild(l);
  }

  function acharTextura(id){
    for(var i = 0; i < TEXTURAS.length; i++) if(TEXTURAS[i].id === id) return TEXTURAS[i];
    return TEXTURAS[0];
  }
  function acharFonte(lista, id){
    for(var i = 0; i < lista.length; i++) if(lista[i][0] === id) return lista[i];
    return lista[0];
  }
  function $(id){ return document.getElementById(id); }
  var montado = false;

  function aplicarFundo(){
    var tex = acharTextura(fundo.textura);
    var camadas = [], tamanhos = [], repeticoes = [];

    var veu = Number(fundo.veu) || 0;
    if(veu > 0){
      var c = "color-mix(in srgb, var(--paper) " + veu + "%, transparent)";
      camadas.push("linear-gradient(" + c + ", " + c + ")");
      tamanhos.push("cover"); repeticoes.push("no-repeat");
    }
    if(tex.css !== "none"){
      camadas.push(tex.css);
      tamanhos.push(tex.size); repeticoes.push(tex.repeat);
    }
    if(fundo.imagem){
      camadas.push('url("' + fundo.imagem + '")');
      tamanhos.push("cover"); repeticoes.push("no-repeat");
    }

    root.style.setProperty("--bg-image", camadas.length ? camadas.join(", ") : "none");
    root.style.setProperty("--bg-size", tamanhos.length ? tamanhos.join(", ") : "auto");
    root.style.setProperty("--bg-repeat", repeticoes.length ? repeticoes.join(", ") : "no-repeat");
    root.style.setProperty("--bg-attach", fundo.fixo ? "fixed" : "scroll");

    var pct = Number(fundo.painel) || 100;
    root.style.setProperty("--surf-mix", pct + "%");
    root.style.setProperty("--surf-blur", pct < 100 ? "7px" : "0px");

    if(!montado) return;
    $("f-padraofundo").value = fundo.textura;
    $("f-veu").value = String(veu);
    $("v-veu").textContent = veu + "%";
    $("f-painel").value = String(pct);
    $("v-painel").textContent = pct + "%";
    $("f-fixo").checked = fundo.fixo;
    $("btn-img-off").disabled = !fundo.imagem;
    $("btn-img-off").style.opacity = fundo.imagem ? "1" : ".5";
  }

  function corLida(varname){
    var v = getComputedStyle(root).getPropertyValue(varname).trim();
    return /^#[0-9a-f]{6}$/i.test(v) ? v : "#888888";
  }

  function aplicar(){
    if(tema === "auto") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", tema);
    if(paleta) root.setAttribute("data-palette", paleta);
    else root.removeAttribute("data-palette");

    /* cores livres: inline vence qualquer regra de tema ou paleta */
    TODAS_CORES.forEach(function(c){
      if(coresLivres[c.id]) root.style.setProperty(c.varname, coresLivres[c.id]);
      else root.style.removeProperty(c.varname);
    });
    root.style.setProperty("--font-display", acharFonte(FONTES_TITULO, fontes.display)[2]);
    root.style.setProperty("--font-body", acharFonte(FONTES_CORPO, fontes.corpo)[2]);
    root.style.setProperty("--font-mono", acharFonte(FONTES_NUM, fontes.numeros)[2]);
    root.style.setProperty("--ls-title", fontes.display === "bebas" ? ".03em" : "0em");
    /* o tamanho vira uma escala, porque quase todo texto tem tamanho próprio
       em px — sem a escala só o corpo mudaria */
    root.style.setProperty("--fs-scale", (Number(formatacao.tamanho) / 16).toFixed(4));
    root.style.setProperty("--title-scale", formatacao.titulos);
    root.style.setProperty("--lh", formatacao.entrelinha);
    root.style.setProperty("--dens", formatacao.densidade);
    root.style.setProperty("--radius", formatacao.cantos);
    aplicarFundo();
    if(montado) pintarControles();
  }

  function pintarControles(){
    Array.prototype.forEach.call($("seg-tema").querySelectorAll("button"), function(b){
      b.setAttribute("aria-pressed", String(b.dataset.v === tema));
    });
    Array.prototype.forEach.call($("swatches").querySelectorAll(".sw"), function(b){
      b.setAttribute("aria-pressed", String(b.dataset.p === paleta));
    });
    $("f-display").value = fontes.display;
    $("f-corpo").value = fontes.corpo;
    $("f-numeros").value = fontes.numeros;
    FORMATACAO.forEach(function(f){ $(f.sel).value = formatacao[f.id]; });

    /* os seletores de cor sempre mostram a cor em vigor */
    TODAS_CORES.forEach(function(c){
      var atual = coresLivres[c.id] || corLida(c.varname);
      $("c-" + c.id).value = atual;
      var campo = $("h-" + c.id);
      if(document.activeElement !== campo){ campo.value = atual.toUpperCase(); campo.classList.remove("bad"); }
    });
  }

  injetar();
  aplicar();

  /* ─────────────────────── parte 2 · montar o painel ─────────────────── */

  function linhaCor(c){
    return '<div class="cpick">'
      + '<input type="color" id="c-' + c.id + '" aria-label="' + c.rotulo + '">'
      + '<span><span class="lab">' + c.rotulo + '</span>'
      + '<input type="text" id="h-' + c.id + '" maxlength="7" spellcheck="false" aria-label="Hex — ' + c.rotulo + '"></span>'
      + "</div>";
  }

  var MARCACAO = ""
    + "<h4>Tema</h4>"
    + '<div class="popseg" id="seg-tema" role="group" aria-label="Tema">'
    +   '<button type="button" data-v="light" aria-pressed="false">Claro</button>'
    +   '<button type="button" data-v="dark" aria-pressed="false">Escuro</button>'
    +   '<button type="button" data-v="auto" aria-pressed="true">Sistema</button>'
    + "</div>"
    + "<h4>Paleta</h4>"
    + '<div class="swatches" id="swatches"></div>'
    + '<h4 class="sec2">Cores livres <button type="button" id="btn-reset-cores">Voltar ao padrão</button></h4>'
    + CORES_LIVRES.map(linhaCor).join("")
    + '<h4 class="sec2">Fundo <button type="button" id="btn-reset-fundo">Voltar ao padrão</button></h4>'
    + linhaCor(COR_FUNDO)
    + '<select id="f-padraofundo" aria-label="Textura do fundo" style="margin-top:8px"></select>'
    + '<div class="filelinha">'
    +   '<button class="btn" type="button" id="btn-img">Escolher imagem…</button>'
    +   '<button class="btn" type="button" id="btn-img-off">Remover</button>'
    + "</div>"
    + '<input type="file" id="file-img" accept="image/*" hidden>'
    + '<p class="aviso" id="aviso-fundo">A imagem fica salva só neste navegador e é reduzida para caber.</p>'
    + '<div class="slider"><span class="lab">Véu sobre o fundo</span><span class="val" id="v-veu">0%</span>'
    +   '<input type="range" id="f-veu" min="0" max="95" step="5" value="0" aria-label="Véu sobre o fundo"></div>'
    + '<div class="slider"><span class="lab">Opacidade dos painéis</span><span class="val" id="v-painel">100%</span>'
    +   '<input type="range" id="f-painel" min="55" max="100" step="5" value="100" aria-label="Opacidade dos painéis"></div>'
    + '<label class="chkline"><input type="checkbox" id="f-fixo"> Fundo parado ao rolar a página</label>'
    + '<h4 class="sec2">Fontes</h4>'
    + '<select id="f-display" aria-label="Fonte dos títulos"></select>'
    + '<select id="f-corpo" aria-label="Fonte do texto"></select>'
    + '<select id="f-numeros" aria-label="Fonte dos números"></select>'
    + '<h4 class="sec2">Formatação <button type="button" id="btn-reset-form">Voltar ao padrão</button></h4>'
    + '<select id="f-tamanho" aria-label="Tamanho do texto">'
    +   '<option value="13">Texto muito pequeno</option><option value="14">Texto pequeno</option>'
    +   '<option value="15">Texto médio</option><option value="16">Texto normal</option>'
    +   '<option value="17">Texto grande</option><option value="18">Texto maior</option>'
    +   '<option value="20">Texto muito grande</option><option value="22">Texto enorme</option></select>'
    + '<select id="f-titulos" aria-label="Tamanho dos títulos">'
    +   '<option value="0.8">Títulos discretos</option><option value="0.9">Títulos menores</option>'
    +   '<option value="1">Títulos normais</option><option value="1.15">Títulos maiores</option>'
    +   '<option value="1.3">Títulos enormes</option></select>'
    + '<select id="f-entrelinha" aria-label="Entrelinha">'
    +   '<option value="1.42">Entrelinha apertada</option><option value="1.6">Entrelinha normal</option>'
    +   '<option value="1.8">Entrelinha solta</option></select>'
    + '<select id="f-densidade" aria-label="Densidade">'
    +   '<option value="0.7">Espaçamento compacto</option><option value="1">Espaçamento normal</option>'
    +   '<option value="1.35">Espaçamento arejado</option></select>'
    + '<select id="f-cantos" aria-label="Cantos">'
    +   '<option value="0px">Cantos retos</option><option value="3px">Cantos suaves</option>'
    +   '<option value="9px">Cantos arredondados</option></select>';

  var AVISO_PADRAO = "A imagem fica salva só neste navegador e é reduzida para caber.";
  var wrap = null;

  function montar(){
    var botao = $("themebtn");
    if(!botao) return;

    wrap = (botao.parentNode && botao.parentNode.classList.contains("appearance")) ? botao.parentNode : null;
    if(!wrap){
      wrap = document.createElement("div");
      wrap.className = "appearance";
      botao.parentNode.insertBefore(wrap, botao);
      wrap.appendChild(botao);
    }
    var velho = wrap.querySelector("#pop");
    if(velho) velho.parentNode.removeChild(velho);

    /* troca o botão por uma cópia limpa: assim some junto qualquer handler
       que a página tenha registrado no antigo alternador de tema */
    var novo = botao.cloneNode(false);
    novo.innerHTML = '<span class="dot"></span><span class="rot">Cores</span>';
    novo.type = "button";
    novo.setAttribute("aria-haspopup", "true");
    novo.setAttribute("aria-expanded", "false");
    novo.setAttribute("aria-label", "Aparência do site");
    botao.parentNode.replaceChild(novo, botao);

    var pop = document.createElement("div");
    pop.className = "pop";
    pop.id = "pop";
    pop.hidden = true;
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "Aparência do site");
    pop.innerHTML = MARCACAO;
    wrap.appendChild(pop);

    montado = true;
    ligar();
    aplicar();
  }

  function encher(sel, lista){
    $(sel).innerHTML = lista.map(function(f){ return '<option value="' + f[0] + '">' + f[1] + "</option>"; }).join("");
  }
  function avisoFundo(msg, ruim){
    var el = $("aviso-fundo");
    el.textContent = msg;
    el.classList.toggle("bad", !!ruim);
  }
  function definirCor(id, valor){
    coresLivres[id] = valor;
    gravarPref("oprpg-cor-" + id, valor);
    aplicar();
  }

  function ligar(){
    $("swatches").innerHTML = PALETAS.map(function(p){
      return '<button type="button" class="sw" data-p="' + p.id + '" aria-pressed="false" title="' + p.nome + '">'
        + '<i style="background:linear-gradient(90deg,' + p.c[0] + " 0 34%," + p.c[1] + " 34% 67%," + p.c[2] + ' 67% 100%)"></i>'
        + "<span>" + p.nome.split(" ")[0] + "</span></button>";
    }).join("");
    encher("f-display", FONTES_TITULO);
    encher("f-corpo", FONTES_CORPO);
    encher("f-numeros", FONTES_NUM);
    $("f-padraofundo").innerHTML = TEXTURAS.map(function(t){
      return '<option value="' + t.id + '">' + t.nome + "</option>";
    }).join("");

    $("seg-tema").addEventListener("click", function(ev){
      var b = ev.target.closest("button[data-v]"); if(!b) return;
      tema = b.dataset.v; gravarPref("oprpg-theme", tema); aplicar();
    });
    $("swatches").addEventListener("click", function(ev){
      var b = ev.target.closest(".sw"); if(!b) return;
      paleta = b.dataset.p; gravarPref("oprpg-palette", paleta);
      /* escolher uma paleta pronta descarta as cores livres */
      TODAS_CORES.forEach(function(c){ coresLivres[c.id] = ""; gravarPref("oprpg-cor-" + c.id, ""); });
      aplicar();
    });

    TODAS_CORES.forEach(function(c){
      $("c-" + c.id).addEventListener("input", function(){ definirCor(c.id, this.value); });
      $("h-" + c.id).addEventListener("input", function(){
        var v = this.value.trim();
        if(v && v.charAt(0) !== "#") v = "#" + v;
        if(/^#[0-9a-fA-F]{6}$/.test(v)){ this.classList.remove("bad"); definirCor(c.id, v.toLowerCase()); }
        else this.classList.add("bad");
      });
      $("h-" + c.id).addEventListener("blur", function(){ this.classList.remove("bad"); aplicar(); });
    });
    $("btn-reset-cores").addEventListener("click", function(){
      CORES_LIVRES.forEach(function(c){ coresLivres[c.id] = ""; gravarPref("oprpg-cor-" + c.id, ""); });
      aplicar();
    });

    $("f-padraofundo").addEventListener("change", function(){
      fundo.textura = this.value; gravarPref("oprpg-bg-textura", this.value); aplicarFundo();
    });
    $("f-veu").addEventListener("input", function(){
      fundo.veu = this.value; gravarPref("oprpg-bg-veu", this.value); aplicarFundo();
    });
    $("f-painel").addEventListener("input", function(){
      fundo.painel = this.value; gravarPref("oprpg-bg-painel", this.value); aplicarFundo();
    });
    $("f-fixo").addEventListener("change", function(){
      fundo.fixo = this.checked; gravarPref("oprpg-bg-fixo", this.checked ? "1" : "0"); aplicarFundo();
    });
    $("btn-img").addEventListener("click", function(){ $("file-img").click(); });
    $("btn-img-off").addEventListener("click", function(){
      fundo.imagem = ""; gravarPref("oprpg-bg-img", ""); avisoFundo(AVISO_PADRAO); aplicarFundo();
    });
    $("file-img").addEventListener("change", function(){
      var file = this.files && this.files[0];
      this.value = "";
      if(!file) return;
      if(!/^image\//.test(file.type)){ avisoFundo("Esse arquivo não é uma imagem.", true); return; }
      avisoFundo("Preparando a imagem…");
      var reader = new FileReader();
      reader.onerror = function(){ avisoFundo("Não consegui ler esse arquivo.", true); };
      reader.onload = function(){
        var img = new Image();
        img.onerror = function(){ avisoFundo("Não consegui abrir essa imagem.", true); };
        img.onload = function(){
          var max = 1600, w = img.naturalWidth, h = img.naturalHeight;
          if(!w || !h){ avisoFundo("Essa imagem veio vazia.", true); return; }
          if(w > max || h > max){ var k = Math.min(max/w, max/h); w = Math.round(w*k); h = Math.round(h*k); }
          var dados;
          try{
            var cv = document.createElement("canvas");
            cv.width = w; cv.height = h;
            cv.getContext("2d").drawImage(img, 0, 0, w, h);
            dados = cv.toDataURL("image/jpeg", 0.72);
          }catch(e){ dados = reader.result; }
          fundo.imagem = dados;
          var kb = Math.round(dados.length * 0.75 / 1024);
          try{
            localStorage.setItem("oprpg-bg-img", dados);
            avisoFundo("Imagem aplicada (" + kb + " KB). Se o texto ficar difícil de ler, suba o véu.");
          }catch(e){
            var cota = e && (e.name === "QuotaExceededError" || e.name === "NS_ERROR_DOM_QUOTA_REACHED");
            avisoFundo("Imagem aplicada (" + kb + " KB), mas "
              + (cota ? "grande demais para o navegador guardar"
                      : "este navegador não está guardando dados do site")
              + " — ela some ao recarregar a página.", true);
          }
          if(!Number(fundo.veu)){ fundo.veu = "45"; gravarPref("oprpg-bg-veu", "45"); }
          aplicarFundo();
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    $("btn-reset-fundo").addEventListener("click", function(){
      fundo = {textura:"", imagem:"", veu:"0", painel:"100", fixo:false};
      gravarPref("oprpg-bg-textura", ""); gravarPref("oprpg-bg-img", "");
      gravarPref("oprpg-bg-veu", "0"); gravarPref("oprpg-bg-painel", "100"); gravarPref("oprpg-bg-fixo", "0");
      ["paper","ink","ink2"].forEach(function(id){ coresLivres[id] = ""; gravarPref("oprpg-cor-" + id, ""); });
      avisoFundo(AVISO_PADRAO);
      aplicar();
    });

    [["f-display","display","oprpg-font-display"],["f-corpo","corpo","oprpg-font-corpo"],
     ["f-numeros","numeros","oprpg-font-numeros"]].forEach(function(t){
      $(t[0]).addEventListener("change", function(){
        fontes[t[1]] = this.value; gravarPref(t[2], this.value); aplicar();
      });
    });
    FORMATACAO.forEach(function(f){
      $(f.sel).addEventListener("change", function(){
        formatacao[f.id] = this.value; gravarPref("oprpg-fmt-" + f.id, this.value); aplicar();
      });
    });
    $("btn-reset-form").addEventListener("click", function(){
      FORMATACAO.forEach(function(f){ formatacao[f.id] = f.padrao; gravarPref("oprpg-fmt-" + f.id, f.padrao); });
      fontes = {display:"oswald", corpo:"spectral", numeros:"plexmono"};
      gravarPref("oprpg-font-display", "oswald");
      gravarPref("oprpg-font-corpo", "spectral");
      gravarPref("oprpg-font-numeros", "plexmono");
      aplicar();
    });

    function fechar(){
      $("pop").hidden = true;
      $("themebtn").setAttribute("aria-expanded", "false");
    }
    $("themebtn").addEventListener("click", function(ev){
      ev.stopPropagation();
      var aberto = !$("pop").hidden;
      $("pop").hidden = aberto;
      this.setAttribute("aria-expanded", String(!aberto));
      /* o painel da conta mora em outra caixa; um aberto fecha o outro */
      var pc = $("pop-conta");
      if(pc && !aberto){
        pc.hidden = true;
        if($("btn-conta")) $("btn-conta").setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("click", function(ev){
      if(!$("pop").hidden && !wrap.contains(ev.target)) fechar();
    });
    document.addEventListener("keydown", function(ev){
      if(ev.key === "Escape" && !$("pop").hidden){ fechar(); $("themebtn").focus(); }
    });
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", montar);
  else montar();

  window.OPRPGAparencia = { aplicar: aplicar };
})();
