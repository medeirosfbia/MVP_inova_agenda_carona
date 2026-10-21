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

2. **Configure as chaves** editando `supabase-config.js` (ou via variáveis de ambiente
   `SUPABASE_URL` / `SUPABASE_ANON_KEY`).

3. **Rode o site**:
   ```bash
   npm install
   npm start        # gera config.browser.js a partir do supabase-config.js e sobe em http://localhost:3000
   ```

> Dica: em Authentication → Providers → Email você pode desativar "Confirm email"
> para o motorista entrar imediatamente após criar a conta (sem confirmar o e-mail).

## Estrutura

```
index.html            # telas do usuário e do motorista
app.js                # lógica do frontend (usa o SDK @supabase/supabase-js via CDN)
style.css             # estilos
server.js             # servidor estático (apenas serve os arquivos)
supabase-schema.sql   # cole no SQL Editor do Supabase (tabelas + RLS + RPC book_ride)
supabase-config.js    # suas chaves do Supabase (gitignored)
scripts/build-config.js  # gera config.browser.js (gitignored)
```

## Como funciona a segurança (RLS)

- Passageiros (mesmo deslogados) só leem viagens `active = true`.
- Motoristas só criam/editam/excluem viagens cujo `driver_id` seja o próprio `auth.uid()`.
- A reserva é feita pela função SQL `book_ride` (`security definer`), que trava a linha
  (`SELECT ... FOR UPDATE`) e impede vender mais vagas do que existem.
- O link gerado usa `https://wa.me/<numero-do-motorista>?text=<mensagem>` — o usuário
  cai direto na conversa do WhatsApp do motorista.

## Hospedagem

Como não há backend próprio, o site pode ser hospedado gratuitamente em qualquer
servidor estático (Vercel, Netlify, GitHub Pages...). Basta gerar o `config.browser.js`
localmente antes do deploy (ou colar as duas constantes dentro dele manualmente).
