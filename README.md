# 🩸 DOAÇÃO DE SANGUE — TG 11

Sistema simples, confiável e pronto para produção de agendamento de doação de sangue para os atiradores do Tiro de Guerra 11 (Ituiutaba-MG).

**Prioridades absolutas:**
1. **Nunca ultrapassar 15 agendamentos confirmados por data** (garantido no banco de dados)
2. Excelente experiência em celular
3. Importação fiel da planilha oficial
4. Exportação organizada e útil para o responsável

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (Postgres gratuito)
- Zod para validação
- xlsx (leitura .xlsm) + exceljs (exportação profissional)
- Deploy: Vercel (plano gratuito)

## Como configurar (passo a passo)

### 1. Instalar dependências

```bash
pnpm install
# ou npm install
```

### 2. Criar projeto no Supabase (gratuito)

1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. Vá em **Project Settings → API** e copie:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (mantenha em segredo)

### 3. Executar as migrations

No Supabase Dashboard, vá em **SQL Editor** e execute o conteúdo completo do arquivo:

```
supabase/migrations/001_initial_schema.sql
```

Isso cria:
- Tabelas `volunteers`, `donation_dates`, `donation_time_slots`, `appointments`
- Índices e constraint parcial (1 agendamento confirmado por voluntário)
- **Função `create_appointment`** (SECURITY DEFINER) — **esta é a peça mais importante** que garante o limite de 15 com transação e `SELECT FOR UPDATE`.

### 4. Configurar variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env.local
```

Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # Server-side apenas
ADMIN_PASSWORD=sua-senha-forte-aqui
VERIFICATION_SECRET=string-aleatoria-longa   # opcional; usa ADMIN_PASSWORD se omitido
```

### 5. Rodar localmente

```bash
pnpm dev
```

Acesse http://localhost:3000

### 6. Carregar os voluntários (seed)

Os dados dos voluntários estão versionados no projeto em `data/volunteers.csv`.

**Importante:** O seed mantém **somente Monitores e Atiradores**. Graus como Cabo, Soldado etc. são filtrados automaticamente (e voluntários existentes com esses graus são removidos do banco).

Para popular (ou atualizar) o banco:

```bash
pnpm seed:volunteers
```

O script carrega automaticamente as variáveis de `.env.local` (ou `.env`).

Ele faz **upsert por NR** usando a `SERVICE_ROLE_KEY`.

Depois de rodar, os voluntários estarão disponíveis para busca no agendamento e visíveis no admin.

**Nota:** A importação manual via interface de admin foi removida. Os dados são mantidos exclusivamente via o CSV no repositório + este seed script.

### 7. Cadastrar datas de doação

No menu **Datas**:
- Adicione datas de Segunda ou Quinta.
- O sistema gera automaticamente os horários corretos (07:00–10:00 ou 13:00–17:00).
- Você pode ativar/desativar datas.

### 8. Testar o fluxo público

- Acesse a página inicial
- Clique em **Fazer meu agendamento**
- Busque por NR ou Nome de Guerra
- Confirme sua identidade
- Escolha data + horário
- Confirme

O sistema impedirá:
- Mais de um agendamento confirmado por atirador
- Mais de 15 pessoas na mesma data (mesmo em concorrência)

### 9. Exportar para controle

No menu **Agendamentos** existe o botão **Exportar Excel**.

O arquivo contém duas abas:
- **Agendamentos**: lista completa com todos os dados + data/hora do registro + observações
- **Resumo**: visão por data com quantidade, capacidade e status (Aberta/Fechada)

### 10. Deploy na Vercel (gratuito)

1. Faça push do código para GitHub
2. Importe o repositório na Vercel
3. Adicione exatamente as mesmas variáveis de ambiente
4. Deploy

O projeto está otimizado para Vercel (Server Actions, Edge, etc).

## Regras de negócio importantes

- Capacidade **por data** (não por horário).
- 15 é o limite duro. Quando chega em 15 confirmados, a data fecha automaticamente.
- A função Postgres `create_appointment` é a única forma de criar agendamentos (evita race conditions).
- Cancelamentos liberam a vaga imediatamente.
- Voluntários são identificados por **NR + Nome de Guerra**.

## Estrutura de pastas relevante

```
app/
  /                    → Landing institucional
  /agendar             → Fluxo completo do atirador (busca → confirmação → data/horário)
  /admin               → Dashboard + login
  /admin/datas         → CRUD de datas + geração de horários
  /admin/voluntarios   → Importação da planilha + listagem
  /admin/agendamentos  → Lista, filtros, cancelar, observações + export
api/
  /admin/...           → Ações protegidas (import, export)
lib/
  admin-auth.ts        → Cookie httpOnly simples
  schemas.ts           → Zod
supabase/migrations/   → SQL completo (execute no dashboard)
```

## Privacidade / LGPD

- A área pública **não lista** todos os voluntários.
- A busca retorna no máximo ~8 resultados.
- Telefone e data de nascimento **não aparecem** na busca nem na confirmação.
- A data de nascimento é usada apenas para **verificar identidade** antes do agendamento.
- Dados completos só aparecem no admin e na exportação.

## Manutenção

- Após o evento, você pode inativar todas as datas.
- O banco guarda histórico completo de agendamentos (confirmados e cancelados).

---

**Sistema desenvolvido com excelência para o TG 11.**  
Foco em confiabilidade, simplicidade e usabilidade em celular.

Qualquer dúvida ou ajuste, o responsável pode entrar em contato.
# dashboard-TG
