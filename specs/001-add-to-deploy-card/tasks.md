---
description: "Task list for add-to-deploy-card feature"
---

# Tasks: Adicionar tarefas a um card de deploy

**Input**: Design documents from `/specs/001-add-to-deploy-card/`

**Status**: Implementado (2026-10-21)

## Phase 1: Setup (Shared Infrastructure)

- [x] T001 Estender tipos em `src/types/deployCard.ts` (`DeployCardSummary`, `AttachTasksToDeployCardInput`, resultado attach)
- [x] T002 [P] Estender interface `AzureDevOpsService` em `src/services/azureDevOps/types.ts`

## Phase 2: Foundational (Blocking Prerequisites)

- [x] T003 Implementar listagem WIQL e `GET /deploy-cards` em `server/azureDevOps/handlers.ts`
- [x] T004 Implementar `attachTasksToDeployCard` (PATCH descrição, relations, close) em `server/azureDevOps/handlers.ts`
- [x] T005 Registrar rotas e guard HTTP (`POST .../tasks`) em `handleAzureDevOpsApi` em `server/azureDevOps/handlers.ts`
- [x] T006 [P] Testes BFF list/attach em `server/azureDevOps/handlers.test.ts`
- [x] T007 [P] Implementar `listDeployCards` e `attachTasksToDeployCard` em `src/services/azureDevOps/rest/restService.ts`
- [x] T008 [P] Implementar métodos mock em `src/services/azureDevOps/mock/mockService.ts`
- [x] T009 [P] Implementar stub mcp em `src/services/azureDevOps/mcp/mcpService.ts`
- [x] T010 [P] Testes rest/mock attach em `src/services/azureDevOps/rest/restService.test.ts` e `mock/mockService.test.ts`

## Phase 3: User Story 1 — Anexar tarefas (P1) MVP

- [x] T011 [P] [US1] Criar hooks `src/hooks/useDeployCards.ts` e `src/hooks/useAttachTasksToDeployCard.ts`
- [x] T012 [P] [US1] Criar `src/components/AddToDeployCardDialog/AddToDeployCardDialog.tsx` e `AddToDeployCardDialog.module.css`
- [x] T013 [US1] Integrar botão e dialog em `src/components/Board/WorkItemBoard.tsx`
- [x] T014 [US1] Conectar hooks no `src/pages/Dashboard/Dashboard.tsx` e invalidar work items
- [x] T015 [P] [US1] Testes do dialog em `src/components/AddToDeployCardDialog/AddToDeployCardDialog.test.tsx`
- [x] T016 [P] [US1] Atualizar testes do board em `src/components/Board/WorkItemBoard.test.tsx`

## Phase 4: User Story 2 — Escolher cartão (P2)

- [x] T017 [US2] Garantir filtro por iteracao/Sprint no handler list (T003) e prop `sprintId` no dialog
- [x] T018 [P] [US2] Testes de empty/loading no `AddToDeployCardDialog.test.tsx`

## Phase 5: User Story 3 — Falhas e cancelamento (P3)

- [x] T019 [US3] Tratamento de erro/cancelamento no `AddToDeployCardDialog.tsx`
- [x] T020 [P] [US3] Testes de erro/cancel em `AddToDeployCardDialog.test.tsx`

## Phase 6: Polish & Cross-Cutting

- [x] T021 [P] Documentar endpoints em `FEATURES.md`
- [x] T022 Executar `npm run test -- --run`, lint e `tsc` conforme `quickstart.md`
