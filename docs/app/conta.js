/* ═══════════════════════════════════════════════════════════════════════
   Conta e sincronização — OP RPG

   Expõe window.OPRPGConta com uma API pequena que as páginas usam:

     iniciar({tabela, lerLocal, escreverLocal, aoMudar})
     entrar()            abre o login do Discord
     sair()
     estado()            {ligado, logado, usuario, sincronizando}

   Desenho: a nuvem é a cópia de segurança, o navegador continua sendo o
   que a página lê. Toda gravação vai para os dois lados; se a nuvem falhar,
   o local continua valendo e a pessoa é avisada — nada se perde.

   Sem as chaves em config.js, iniciar() devolve ligado:false e a página
   segue funcionando como sempre funcionou.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var SDK = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.116.0/dist/umd/supabase.js";

  var cfg = window.OPRPG_CONFIG || {};
  var ligado = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);

  var cliente = null;
  var sessao = null;
  var opcoes = null;
  var sincronizando = false;
  var ouvintes = [];

  /* ─────────────────────────── utilidades ─────────────────────────── */

  function carregarSDK() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve();
    return new Promise(function (ok, falha) {
      var s = document.createElement("script");
      s.src = SDK;
      s.onload = function () {
        if (window.supabase && window.supabase.createClient) ok();
        else falha(new Error("SDK carregou mas não expôs createClient"));
      };
      s.onerror = function () { falha(new Error("não consegui baixar o SDK")); };
      document.head.appendChild(s);
    });
  }

  function avisar() {
    var e = estado();
    ouvintes.forEach(function (fn) { try { fn(e); } catch (err) { /* um ouvinte ruim não derruba os outros */ } });
  }

  function estado() {
    return {
      ligado: ligado,
      logado: !!sessao,
      usuario: sessao ? perfil(sessao.user) : null,
      sincronizando: sincronizando
    };
  }

  function perfil(u) {
    var m = (u && u.user_metadata) || {};
    return {
      id: u.id,
      nome: m.full_name || m.name || m.user_name || m.preferred_username || "Pirata",
      avatar: m.avatar_url || m.picture || ""
    };
  }

  /* ──────────────────────── leitura e escrita ─────────────────────── */

  /* Junta o que veio da nuvem com o que está no navegador.
     Critério: o carimbo mais recente ganha. Item que existe só de um lado
     entra dos dois lados — ninguém perde nada por ter usado outro aparelho. */
  function juntar(locais, remotos) {
    var mapa = {}, ordem = [];

    function pôr(item, carimbo) {
      if (!item || !item.id) return;
      var atual = mapa[item.id];
      if (!atual) { mapa[item.id] = { item: item, carimbo: carimbo }; ordem.push(item.id); return; }
      if (carimbo > atual.carimbo) mapa[item.id] = { item: item, carimbo: carimbo };
    }

    locais.forEach(function (t) { pôr(t, Number(t.atualizadoEm) || 0); });
    remotos.forEach(function (linha) {
      var item = linha.dados || {};
      item.id = linha.id;
      pôr(item, Date.parse(linha.atualizado_em) || 0);
    });

    return ordem.map(function (id) { return mapa[id].item; });
  }

  function paraLinha(item) {
    return {
      user_id: sessao.user.id,
      id: item.id,
      nome: String(item.nome || ""),
      tipo: String(item.tipo || ""),
      grau: (typeof item.grau === "number" ? item.grau : null),
      dados: item
    };
  }

  /* Puxa tudo da nuvem, junta com o local, grava o resultado nos dois lados. */
  function sincronizar() {
    if (!cliente || !sessao || !opcoes) return Promise.resolve(null);
    sincronizando = true; avisar();

    return cliente.from(opcoes.tabela).select("id,dados,atualizado_em")
      .then(function (r) {
        if (r.error) throw r.error;
        var locais = opcoes.lerLocal() || [];
        var juntos = juntar(locais, r.data || []);
        opcoes.escreverLocal(juntos);

        /* devolve para a nuvem o que só existia aqui, ou o que está mais novo */
        var remotos = {};
        (r.data || []).forEach(function (l) { remotos[l.id] = Date.parse(l.atualizado_em) || 0; });
        var enviar = juntos.filter(function (t) {
          var c = Number(t.atualizadoEm) || 0;
          return !(t.id in remotos) || c > remotos[t.id];
        });

        if (!enviar.length) return { total: juntos.length, enviadas: 0 };
        return cliente.from(opcoes.tabela).upsert(enviar.map(paraLinha)).then(function (up) {
          if (up.error) throw up.error;
          return { total: juntos.length, enviadas: enviar.length };
        });
      })
      .then(function (res) {
        sincronizando = false; avisar();
        if (opcoes.aoMudar) opcoes.aoMudar();
        return res;
      })
      .catch(function (err) {
        sincronizando = false; avisar();
        if (opcoes.aoErro) opcoes.aoErro(err);
        return null;
      });
  }

  function guardar(item) {
    if (!cliente || !sessao || !item || !item.id) return Promise.resolve(false);
    return cliente.from(opcoes.tabela).upsert([paraLinha(item)]).then(function (r) {
      if (r.error) { if (opcoes.aoErro) opcoes.aoErro(r.error); return false; }
      return true;
    }, function (err) { if (opcoes.aoErro) opcoes.aoErro(err); return false; });
  }

  function apagar(id) {
    if (!cliente || !sessao || !id) return Promise.resolve(false);
    return cliente.from(opcoes.tabela).delete()
      .eq("user_id", sessao.user.id).eq("id", id)
      .then(function (r) {
        if (r.error) { if (opcoes.aoErro) opcoes.aoErro(r.error); return false; }
        return true;
      }, function (err) { if (opcoes.aoErro) opcoes.aoErro(err); return false; });
  }

  /* ────────────────────────────── entrada ─────────────────────────── */

  function iniciar(o) {
    opcoes = o || {};
    if (o && o.aoMudarEstado) ouvintes.push(o.aoMudarEstado);
    if (!ligado) { avisar(); return Promise.resolve(estado()); }

    return carregarSDK().then(function () {
      cliente = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });

      cliente.auth.onAuthStateChange(function (evento, s) {
        var antes = !!sessao;
        sessao = s || null;
        avisar();
        if (sessao && !antes) sincronizar();
      });

      return cliente.auth.getSession().then(function (r) {
        sessao = (r.data && r.data.session) || null;
        avisar();
        if (sessao) sincronizar();
        return estado();
      });
    }).catch(function (err) {
      ligado = false;
      avisar();
      if (opcoes.aoErro) opcoes.aoErro(err);
      return estado();
    });
  }

  function entrar() {
    if (!cliente) return Promise.resolve(false);
    /* volta para a mesma página de onde saiu, sem a sujeira de query antiga */
    var volta = location.origin + location.pathname;
    return cliente.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: volta }
    }).then(function (r) {
      if (r.error) { if (opcoes && opcoes.aoErro) opcoes.aoErro(r.error); return false; }
      return true;
    });
  }

  function sair() {
    if (!cliente) return Promise.resolve();
    return cliente.auth.signOut().then(function () {
      sessao = null;
      avisar();
    });
  }

  window.OPRPGConta = {
    iniciar: iniciar,
    entrar: entrar,
    sair: sair,
    estado: estado,
    sincronizar: sincronizar,
    guardar: guardar,
    apagar: apagar
  };
})();
