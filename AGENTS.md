# AGENTS.md

## Project overview

**agenda-tg** — Blood donation scheduling system for TG 11 (Tiro de Guerra, Ituiutaba-MG).

- Public flow: volunteer searches by NR/Nome de Guerra → identity verification → pick date + time → confirm
- Admin flow: login → manage donation dates, volunteers, appointments, missions → export Excel
- Portuguese-language UI, Brazilian Army context

### Architecture

```
Next.js 16 App Router (Server Components + Server Actions)
├── app/
│   ├── /              → Public landing
│   ├── /agendar       → Full scheduling flow (search → verify → pick → confirm)
│   ├── /meus-agendamentos → Volunteer view of own appointments
│   └── /admin/        → Protected dashboard
│       ├── /datas            → CRUD donation dates + schedule generation
│       ├── /voluntarios      → List volunteers by turma (no import UI — seed only)
│       ├── /agendamentos     → Appointments list, filters, cancel, notes, export
│       └── /missoes          → Missions management + attendance control
├── components/        → React components (public + admin)
├── lib/               → Business logic, schemas, queries, utilities
│   ├── admin-auth.ts  → Cookie httpOnly auth
│   ├── schemas.ts     → Zod schemas
│   ├── appointments/  → Appointment logic + mission attendance
│   ├── dates/         → Date management, slot generation, scheduling
│   ├── volunteers/    → Sorting, roles, turmas
│   ├── missions/      → Mission types, slugs, queries
│   ├── export/        → Excel export (tg-spreadsheet)
│   └── branding.ts    → TG branding helpers
├── supabase/migrations/ → Postgres schema + create_appointment function
├── data/              → volunteers.csv (versioned seed data)
└── scripts/           → seed-volunteers.ts
```

### Stack

- Next.js 16 (App Router), TypeScript 5, Tailwind CSS 4
- Supabase (Postgres), pnpm 9+
- Zod 4, Vitest 3, ESLint 9
- xlsx + exceljs (spreadsheet import/export)
- Deploy: Vercel (free plan)

### Key invariants

- **NEVER exceed 15 confirmed appointments per date** — enforced by Postgres `create_appointment` function (`SELECT FOR UPDATE` + constraint)
- One confirmed appointment per volunteer — enforced by unique partial index
- Volunteers identified by **NR + Nome de Guerra**
- `SUPABASE_SERVICE_ROLE_KEY` is server-side only, never exposed to client
- Env files (.env*) are gitignored except `.env.example`

## Commands

### Install

```bash
pnpm install
```

### Dev

```bash
pnpm dev
# → http://localhost:3000
```

### Test

```bash
pnpm test
# vitest run — 89 tests across 14 test files
```

```bash
pnpm test:watch
# vitest in watch mode
```

### Lint

```bash
pnpm lint
# eslint
```

### Seed

```bash
pnpm seed:volunteers
# Upserts volunteers from data/volunteers.csv into Supabase
# Uses SERVICE_ROLE_KEY from .env.local
# Filters to Monitores + Atiradores only
```

### Build

```bash
pnpm build
# Next.js production build
```

## Important files

| File | Purpose |
|---|---|
| `lib/schemas.ts` | Zod schemas — start here for validation changes |
| `lib/appointments/actions.ts` | Server actions for booking |
| `lib/dates/slot-generator.ts` | Time slot generation logic |
| `lib/export/tg-spreadsheet.ts` | Excel export formatting |
| `lib/admin-auth.ts` | Admin cookie auth |
| `supabase/migrations/001_initial_schema.sql` | Full DB schema + `create_appointment` function |
| `data/volunteers.csv` | Seed data (versioned) |
| `components/AgendarFlow.tsx` | Public scheduling wizard |

## Code conventions

- Server actions in `lib/*/actions.ts` for mutations
- API routes in `app/api/` for external endpoints
- Each lib module with `*.test.ts` alongside
- Admin layout includes auth check in `app/admin/layout.tsx`
- Use `@/*` path alias for imports from project root
- Portuguese field/function names where they map to domain concepts
- Zod schemas for all API boundaries

## Safety rules

- **Do NOT modify `supabase/migrations/`** without explicit approval — these are the source of truth for DB schema
- **Do NOT change `create_appointment` function** — it guarantees the 15-appointment limit with row-level locking
- **Do NOT edit `.env.local` or expose secrets** — env is gitignored
- **Do NOT expose `SUPABASE_SERVICE_ROLE_KEY`** to client code
- **Do NOT change public API response shapes** without updating tests
- **Do NOT remove the `volunteers.csv` versioning** — it's the canonical seed data
- **Do NOT commit `.npmrc` or `.pnpm-store/`** — they're gitignored

## Agent workflow

For non-trivial changes:
1. Inspect relevant files in `lib/`, `components/`, `app/`
2. Propose plan referencing the right module
3. Implement smallest coherent change
4. Run `pnpm test` — all 89 tests must pass
5. Run `pnpm lint` — no new warnings
6. Inspect `git diff`
7. Summarize residual risks

**Preferred external implementation agent:** omp / Oh-My-Pi (via `omp -p "..."`)
**Fallback agents:** Codex CLI, Gemini CLI, OpenCode
**For analysis/large-context reading:** Gemini CLI (`GEMINI_CLI_TRUST_WORKSPACE=true gemini "..."`)
