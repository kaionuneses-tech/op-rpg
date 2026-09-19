# OP RPG — Ferramentas

Duas ferramentas de apoio para o **OP RPG — Livro do Jogador 2.0**, de Brendo Neves.

- **Rota do Novato** — guia de criação de personagem, da ficha em branco até o 3º nível, com montador de ficha.
- **Forja de Técnicas** — criador de Técnicas de Combate, Técnicas Auxiliares e Manifestações de Poder, com o orçamento de Pontos de Poder de cada grau.

São páginas estáticas: sem servidor, sem banco de dados, sem cadastro. Tudo roda no navegador de quem acessa, e as técnicas ficam guardadas no próprio navegador.

## Estrutura

```
docs/                  o site publicado
  index.html             página inicial
  guia.html              Rota do Novato
  forja.html             Forja de Técnicas  (gerado — não edite à mão)
op-rpg-forja.html      fonte da forja
build.js               gera docs/forja.html a partir da fonte
serve.js               servidor local para testar
```

`docs/forja.html` é **gerado**. Edite `op-rpg-forja.html` e rode:

```
node build.js
```

A fonte não tem `<html>`/`<head>`/`<body>` porque ela também é publicada como artefato do Claude, que monta esse envelope sozinho. O `build.js` acrescenta o envelope para a versão hospedada.

## Rodar localmente

```
node serve.js
```

Abre em `http://localhost:4173`.

## Publicar no GitHub Pages

O site é servido da pasta `docs/` no branch `main`. Em **Settings → Pages**, escolha:

- Source: *Deploy from a branch*
- Branch: `main` · pasta `/docs`

O endereço fica `https://SEU-USUARIO.github.io/NOME-DO-REPO/`.

## Créditos

**OP RPG — Livro do Jogador 2.0**, criação e desenvolvimento de Brendo Neves. Estas ferramentas são de apoio e não substituem o livro; toda criação precisa da aprovação do Narrador.

Conteúdo sob Open Game License 1.0a. One Piece é obra de Eiichiro Oda.
