# Entrega — Dashboard TG 11-002

**Data da verificação:** 14/06/2026
**Status:** ✅ Pronto para entrega

---

## 1. Verificação final

| Check | Resultado |
|---|---|
| Build (`pnpm build`) | ✅ Compilou limpo, zero erros |
| Testes (`pnpm test`) | ✅ 89/89 passando (14 arquivos) |
| Deploy Vercel | ✅ Online e responsivo |
| Página inicial | ✅ TG 11-002 Ituiutaba/MG |
| Próxima missão | ✅ 15/06/2026 — 14 vagas |

Lint tem 4 avisos cosméticos pré-existentes (`setState-in-effect`), nenhum quebra funcionalidade.

---

## 2. Mensagem WhatsApp — Sub-Tenente

> Boa tarde Sub! Segue o acesso ao painel de controle das missões do TG 11-002:
>
> 🔗 **Link:** https://dashboard-tg-topaz.vercel.app/admin
> 🔑 **Senha:** `PresenteESolidario`
>
> Qualquer dúvida estou à disposição.

---

## 3. Dados de acesso

| Campo | Valor |
|---|---|
| **URL pública** | https://dashboard-tg-topaz.vercel.app |
| **Painel admin** | https://dashboard-tg-topaz.vercel.app/admin |
| **Senha admin** | `PresenteESolidario` |
| **Repositório** | https://github.com/Dev-Lks/dashboard-TG |

---

## 4. O que o Sub precisa saber

### Acessar o admin
1. Entrar em https://dashboard-tg-topaz.vercel.app/admin
2. Digitar a senha `PresenteESolidario`
3. Pronto — acesso completo ao painel

### Funcionalidades do painel
- **Datas** — cadastrar segundas/quintas de doação, gerar horários automaticamente, ativar/desativar
- **Agendamentos** — ver todos os agendamentos, filtrar, cancelar, adicionar observações, exportar Excel
- **Voluntários** — listagem por turma (dados vêm do CSV)
- **Missões** — gerenciar missões (doação de sangue e outras), controle de presença

### Regras principais
- Máximo **15 agendamentos confirmados por data** (travado no banco)
- Um agendamento por voluntário
- Cancelamento libera vaga na hora
- Exportação Excel com duas abas: lista completa + resumo por data

---

## 5. Contatos / Suporte

- **GitHub:** https://github.com/Dev-Lks/dashboard-TG
- **README completo** com passo a passo de configuração no repositório

---

**Sistema desenvolvido para o TG 11-002 — Ituiutaba/MG.**
