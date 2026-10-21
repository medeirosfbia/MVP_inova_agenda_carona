# 🚗 Carona Bairro (Supabase)

MVP de carona comunitária com **duas telas**:

- **Usuário/passageiro**: vê as caronas disponíveis, reserva uma vaga e é levado
  **diretamente para o WhatsApp do motorista** (mensagem pré-preenchida).
- **Motorista**: cria conta/login, agenda viagens (origem, destino, horário, dias,
  valor, vagas, observações), cancela/reativa/exclui e vê as reservas recebidas.

O banco de dados e o sistema de usuários/login são do **Supabase** (Postgres + Auth + RLS).
Não há mais servidor de API próprio — o site fala direto com o Supabase.

## Precisa de API Key?

**Sim.** Você precisa de 2 valores do seu projeto Supabase (grátis em [supabase.com](https://supabase.com)):

| Valor | Onde encontrar | É secreto? |
|---|---|---|
| **Project URL** | Dashboard → Project Settings → API | Não (pública) |
| **anon public key** | mesma tela | Não — é pública por design; a segurança vem das políticas RLS |
| ~~service_role key~~ | — | **Não é necessária** no frontend. Nunca a coloque no site. |

## Setup (3 passos)

1. **Crie o projeto no Supabase** e cole todo o conteúdo de [`supabase-schema.sql`](./supabase-schema.sql)
   no **SQL Editor** e execute (Run). Isso cria as tabelas `driver_profiles`, `rides`,
   `bookings`, as políticas de segurança (RLS) e a função `book_ride` (reserva atômica sem overbooking).

2. **Configure as chaves no `.env`** (arquivo escondido do git):
   ```bash
   cp .env.example .env    # e preencha SUPABASE_URL e SUPABASE_ANON_KEY
   ```

3. **Rode o site localmente**:
   ```bash
   npm install
   npm start        # lê o .env, gera public/config.browser.js e sobe em http://localhost:3000
   ```

> Dica: em Authentication → Providers → Email você pode desativar "Confirm email"
> para o motorista entrar imediatamente após criar a conta (sem confirmar o e-mail).

## Estrutura

```
public/index.html       # telas do usuário e do motorista
public/app.js           # lógica do frontend (usa o SDK @supabase/supabase-js via CDN)
public/style.css        # estilos
.env                    # suas chaves do Supabase (gitignored — nunca commitar)
.env.example            # modelo de variáveis
server.js               # servidor estático local (apenas serve public/)
scripts/build.js        # lê .env/variáveis da Vercel e gera public/config.browser.js
vercel.json             # buildCommand + outputDirectory para deploy na Vercel
supabase-schema.sql     # cole no SQL Editor do Supabase (tabelas + RLS + RPC book_ride)
```

## Como funciona a segurança (RLS)

- Passageiros (mesmo deslogados) só leem viagens `active = true`.
- Motoristas só criam/editam/excluem viagens cujo `driver_id` seja o próprio `auth.uid()`.
- A reserva é feita pela função SQL `book_ride` (`security definer`), que trava a linha
  (`SELECT ... FOR UPDATE`) e impede vender mais vagas do que existem.
- O link gerado usa `https://wa.me/<numero-do-motorista>?text=<mensagem>` — o usuário
  cai direto na conversa do WhatsApp do motorista.

## Deploy na Vercel (passo a passo)

O projeto já contém o `vercel.json` com o build correto, então basta:

1. **Suba o código para o GitHub** (o `.env` NÃO vai junto — ele é ignorado pelo git):
   ```bash
   git add .
   git commit -m "chore: chaves do Supabase via .env / env vars da Vercel"
   git push
   ```
2. Na Vercel, abra seu projeto → **Settings → Environment Variables** e adicione
   (para as ambientes *Production*, *Preview* e *Development*):
   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | a URL do projeto (Dashboard Supabase → Project Settings → API) |
   | `SUPABASE_ANON_KEY` | a chave **anon public** |
3. Vá em **Deployments → Redeploy** (ou faça um novo push). No build, o comando
   `node scripts/build.js` roda com essas variáveis e injeta os valores no
   `public/config.browser.js` de dentro do deploy — nada de segredo no repositório.
4. Pronto: cada push passa a rebuildar automaticamente com as variáveis da Vercel.

> Alternativa via terminal: `npm i -g vercel && vercel env add SUPABASE_URL production`
> (cole o valor), idem para `SUPABASE_ANON_KEY`, e depois `vercel --prod`.

⚠️ Lembrete: a **anon key** é embutida no bundle público por natureza (é assim que
apps 100% frontend funcionam no Supabase) — quem protege seus dados são as políticas
RLS do `supabase-schema.sql`. A **service_role key** jamais deve aparecer aqui.
