/* Configuração da conta.
   Enquanto estes dois valores estiverem vazios, o site funciona exatamente
   como antes: tudo local, sem login. Preenchidos, a barra de conta aparece.

   A chave pública (anon ou publishable) é pública por natureza — ela fica visível no código de
   qualquer site que use Supabase. Quem protege os dados são as políticas
   de Row Level Security, em supabase/schema.sql.                          */
window.OPRPG_CONFIG = {
  supabaseUrl: "https://cphvyqxtavjlvzrbzwiu.supabase.co",
  supabaseAnonKey: ""
};
