# Implementation Plan: Adicionar tarefas a um card de deploy

**Branch**: `001-add-to-deploy-card` | **Date**: 2026-10-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-add-to-deploy-card/spec.md`

## Summary

Adicionar no Modo Lead um terceiro botão **"Adicionar tarefas a um card de
deploy"** que abre um dialog para escolher um cartão de deploy existente na
Sprint atual e anexar as tarefas já selecionadas na grade. O BFF lista cartões
e executa PATCH no Azure: descrição regenerada via
`buildDeployCardDescription`, relations Related e fechamento (`Closed`) das
tarefas anexadas. UI e testes seguem os padrões de `DeployCardDialog` e
`POST /deploy-cards`.

## Technical Context

**Language/Version**: TypeScript 5.x, React 18, Node (BFF em `server/`)

**Primary Dependencies**: Vite, TanStack Query, `@poliedro/tamentai/web`,
Vitest, Azure DevOps REST (JSON Patch)

**Storage**: Azure DevOps work items (sem persistência local da feature)

**Testing**: Vitest + Testing Library; cobertura ~90% em componentes alterados;
testes de handler em `server/azureDevOps/handlers.test.ts`

**Target Platform**: SPA + BFF Node (provider `rest` / `mock` / `mcp`)

**Project Type**: Web application (frontend `src/`, BFF `server/azureDevOps/`)

**Performance Goals**: Lista de cartões e anexação em tempo humano (< few s);
sem polling adicional além do cache React Query

**Constraints**: PAT só no servidor; UI em PT-BR; reutilizar
`buildDeployCardDescription` e tipo `deployWorkItemType`

**Scale/Scope**: Uma Sprint por vez; dezenas de cartões/tarefas por operação

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

O arquivo `.specify/memory/constitution.md` está em template (sem princípios
ratificados). Gates aplicados a partir das práticas do repositório:

| Gate | Status |
|------|--------|
| Testes automatizados para comportamento novo | PASS (planejado) |
| BFF para mutações Azure | PASS |
| UI em português | PASS |
| Escopo mínimo / reutilizar deploy existente | PASS |
| Sem secrets no cliente | PASS |

**Pós-design**: Contratos BFF documentados; nenhuma violação que exija
Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/001-add-to-deploy-card/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── bff-deploy-cards.md
│   └── ui-lead-mode-add-to-deploy.md
└── tasks.md             # /speckit-tasks (não criado aqui)
```

### Source Code (repository root)

```text
src/
├── components/
│   ├── Board/WorkItemBoard.tsx          # terceiro botão + dialog
│   └── AddToDeployCardDialog/             # novo (espelho DeployCardDialog)
├── hooks/
│   ├── useCreateDeployCard.ts
│   ├── useDeployCards.ts                 # novo
│   └── useAttachTasksToDeployCard.ts     # novo
├── services/azureDevOps/
│   ├── types.ts
│   ├── rest/restService.ts
│   ├── mock/mockService.ts
│   └── mcp/mcpService.ts
├── types/deployCard.ts                   # estender tipos
└── utils/
    ├── deployCardDescription.ts          # possível helper: ids → descrição
    └── deployCard/mergeWorkItemIds.ts      # opcional, testado

server/azureDevOps/
├── handlers.ts                           # GET list, POST attach, PATCH helpers
└── handlers.test.ts
```

**Structure Decision**: Monorepo existente — estender componentes Lead, hooks
e handlers; sem novo pacote.

## Complexity Tracking

> Nenhuma violação de constitution ratificada a justificar.
