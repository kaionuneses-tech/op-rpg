# Ligar o login com Discord — o que você precisa fazer

São três etapas. A primeira e a terceira são no Supabase, a segunda é no Discord.
Leva uns 15 minutos. **No fim você me manda dois valores** e eu ligo tudo no site.

> Nada aqui pede cartão de crédito. Se algum passo não bater com o que você
> está vendo na tela, me diga o que aparece — as interfaces mudam de tempos
> em tempos e eu te reoriento.

---

## Etapa 1 — Criar o projeto no Supabase

1. Abra **https://supabase.com** e clique em **Start your project**.
   Entre com sua conta do GitHub (a mesma `kaionuneses-tech` serve).

2. Clique em **New project**.

   - **Name:** `op-rpg`
   - **Database Password:** clique em *Generate a password* e **guarde essa senha
     num lugar seguro**. Você não vai precisar dela para o site funcionar, mas é a
     única forma de acessar o banco direto depois. O Supabase não mostra de novo.
   - **Region:** escolha `South America (São Paulo)` — é a mais perto, o site
     responde mais rápido.

3. Clique em **Create new project** e espere uns 2 minutos enquanto ele monta.

4. Quando terminar, vá em **SQL Editor** (ícone na barra da esquerda) e clique
   em **New query**.

5. Abra o arquivo `supabase/schema.sql` deste repositório, **copie tudo** e cole
   na caixa. Clique em **Run** (ou `Ctrl+Enter`).

   No fim deve aparecer uma tabelinha assim:

   | tabela    | rls_ligado | politicas |
   |-----------|------------|-----------|
   | anotacoes | true       | 4         |
   | fichas    | true       | 4         |
   | tecnicas  | true       | 4         |

   **Se `rls_ligado` não for `true` nas três, me avise antes de continuar** —
   sem isso as anotações de uma pessoa ficariam visíveis para as outras.

---

## Etapa 2 — Criar o aplicativo no Discord

Você precisa do endereço do seu projeto Supabase aqui. Pegue assim:
no Supabase, vá em **Project Settings** (engrenagem) → **API** e copie o valor de
**Project URL**. É algo como `https://abcdefghijklm.supabase.co`.

1. Abra **https://discord.com/developers/applications** e entre com sua conta
   do Discord.

2. Clique em **New Application** (canto superior direito).
   Dê o nome **OP RPG** e aceite os termos. Clique em **Create**.

3. Na barra da esquerda, clique em **OAuth2**.

4. Na seção **Redirects**, clique em **Add Redirect** e cole:

   ```
   COLE-AQUI-O-PROJECT-URL/auth/v1/callback
   ```

   Ou seja, o Project URL do Supabase com `/auth/v1/callback` no fim.
   Exemplo: `https://abcdefghijklm.supabase.co/auth/v1/callback`

   Clique em **Save Changes** no rodapé.

5. Ainda em **OAuth2**, na seção **Client information**:

   - Copie o **Client ID**.
   - Em **Client Secret**, clique em **Reset Secret** e confirme. Copie o valor
     que aparecer — **ele só é mostrado uma vez**.

   Deixe os dois numa nota; você usa no próximo passo.

> Enquanto estiver aqui, se quiser: em **General Information** dá para pôr um
> ícone no aplicativo. É o que as pessoas veem na tela de autorização. Opcional.

---

## Etapa 3 — Ligar os dois no Supabase

1. No Supabase, vá em **Authentication** → **Sign In / Providers**
   (em algumas versões aparece como **Providers**).

2. Ache **Discord** na lista e ligue a chavinha.

3. Cole o **Client ID** e o **Client Secret** que você copiou do Discord.
   Clique em **Save**.

4. Ainda em **Authentication**, vá em **URL Configuration**:

   - **Site URL:** `https://kaionuneses-tech.github.io/op-rpg/`
   - Em **Redirect URLs**, clique em **Add URL** e acrescente estes dois:

     ```
     https://kaionuneses-tech.github.io/op-rpg/**
     http://localhost:4173/**
     ```

     O primeiro é o site publicado; o segundo deixa a gente testar na sua máquina.
     Os `**` no fim são necessários — sem eles o Supabase recusa a volta do login.

   Clique em **Save**.

---

## O que me mandar

No Supabase, em **Project Settings** → **API**, copie estes dois valores:

1. **Project URL** — `https://xxxxxxxx.supabase.co`
2. **anon public** (a chave longa, na seção *Project API keys*)

Cole os dois aqui no chat que eu configuro o site.

### É seguro mandar essa chave?

Sim. A chave `anon public` é **feita para ficar visível** no código do site —
todo mundo que abrir a página vai conseguir lê-la, e isso é normal. Quem protege
os dados são as políticas de Row Level Security que você criou na Etapa 1:
mesmo com a chave em mãos, ninguém consegue ler linha de outra pessoa.

**O que você nunca deve mandar para ninguém** (nem para mim):

- a chave **`service_role`** — essa ignora todas as proteções;
- a **Database Password** da Etapa 1;
- o **Client Secret** do Discord (ele fica só no Supabase).

---

## Depois que ligar

Cada pessoa do grupo entra no site, clica em **Entrar com Discord**, autoriza, e
pronto — a conta dela existe. Não tem cadastro, não tem senha, não tem e-mail de
confirmação. As técnicas e fichas dela passam a acompanhar a conta em qualquer
computador ou celular.

### Uma coisa para saber

Projetos gratuitos do Supabase **são pausados depois de uma semana sem nenhum
acesso**. Os dados não somem, mas alguém precisa entrar no painel e clicar em
*Restore* para acordar. Se a mesa jogar toda semana, isso nunca acontece. Se
ficarem um mês parados, você acorda o projeto antes da sessão.
