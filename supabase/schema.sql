-- ══════════════════════════════════════════════════════════════════════
--  OP RPG — esquema do banco
--
--  Cole este arquivo inteiro no SQL Editor do Supabase e clique em "Run".
--  Pode rodar de novo quantas vezes quiser: nada é apagado nem duplicado.
--
--  Cada linha guarda o dono em user_id. As políticas de Row Level Security
--  no fim do arquivo garantem que uma pessoa só enxerga e só mexe nas
--  próprias linhas — nem o Narrador, nem ninguém, vê o que é dos outros.
-- ══════════════════════════════════════════════════════════════════════


-- ─────────────────────── carimbo de atualização ───────────────────────
create or replace function public.marcar_atualizacao()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;


-- ─────────────────────────────── TÉCNICAS ──────────────────────────────
create table if not exists public.tecnicas (
  user_id       uuid        not null references auth.users(id) on delete cascade,
  id            text        not null,
  nome          text        not null default '',
  tipo          text        not null default '',
  grau          smallint,
  dados         jsonb       not null default '{}'::jsonb,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists tecnicas_por_dono
  on public.tecnicas (user_id, atualizado_em desc);

drop trigger if exists tecnicas_atualizacao on public.tecnicas;
create trigger tecnicas_atualizacao
  before update on public.tecnicas
  for each row execute function public.marcar_atualizacao();


-- ──────────────────────────────── FICHAS ───────────────────────────────
create table if not exists public.fichas (
  user_id       uuid        not null references auth.users(id) on delete cascade,
  id            text        not null,
  nome          text        not null default '',
  especie       text        not null default '',
  estilo        text        not null default '',
  nivel         smallint,
  dados         jsonb       not null default '{}'::jsonb,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists fichas_por_dono
  on public.fichas (user_id, atualizado_em desc);

drop trigger if exists fichas_atualizacao on public.fichas;
create trigger fichas_atualizacao
  before update on public.fichas
  for each row execute function public.marcar_atualizacao();


-- ────────────────────────────── ANOTAÇÕES ──────────────────────────────
create table if not exists public.anotacoes (
  user_id       uuid        not null references auth.users(id) on delete cascade,
  id            text        not null,
  titulo        text        not null default '',
  texto         text        not null default '',
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, id)
);

create index if not exists anotacoes_por_dono
  on public.anotacoes (user_id, atualizado_em desc);

drop trigger if exists anotacoes_atualizacao on public.anotacoes;
create trigger anotacoes_atualizacao
  before update on public.anotacoes
  for each row execute function public.marcar_atualizacao();


-- ═══════════════════ Row Level Security: cada um só o seu ══════════════
-- Sem estas políticas a tabela fica trancada para todo mundo. Com elas,
-- o Postgres compara auth.uid() (quem está logado) com user_id (o dono)
-- em cada linha, em toda leitura e toda escrita.

alter table public.tecnicas  enable row level security;
alter table public.fichas    enable row level security;
alter table public.anotacoes enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['tecnicas', 'fichas', 'anotacoes']
  loop
    execute format('drop policy if exists "dono lê %1$s"       on public.%1$I', t);
    execute format('drop policy if exists "dono insere %1$s"   on public.%1$I', t);
    execute format('drop policy if exists "dono atualiza %1$s" on public.%1$I', t);
    execute format('drop policy if exists "dono apaga %1$s"    on public.%1$I', t);

    execute format(
      'create policy "dono lê %1$s" on public.%1$I
         for select using (auth.uid() = user_id)', t);
    execute format(
      'create policy "dono insere %1$s" on public.%1$I
         for insert with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "dono atualiza %1$s" on public.%1$I
         for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
    execute format(
      'create policy "dono apaga %1$s" on public.%1$I
         for delete using (auth.uid() = user_id)', t);
  end loop;
end
$$;


-- ─────────────────────────── conferência ───────────────────────────────
-- Deve listar 3 tabelas com rowsecurity = true e 4 políticas cada.
select
  c.relname                        as tabela,
  c.relrowsecurity                 as rls_ligado,
  count(p.polname)                 as politicas
from pg_class c
left join pg_policy p on p.polrelid = c.oid
where c.relname in ('tecnicas', 'fichas', 'anotacoes')
group by c.relname, c.relrowsecurity
order by c.relname;
